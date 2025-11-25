# Queue Implementation with pg-boss

This document describes the queue system implementation using pg-boss for handling avatar generation and drop processing asynchronously.

## Overview

The queue system uses **pg-boss**, a PostgreSQL-based job queue system, to process long-running tasks asynchronously:

- **Avatar Generation**: Processes avatar generation requests in the background
- **Drop Generation**: Processes drop variation generation in the background

## Architecture

### Components

1. **Queue Service** (`src/lib/server/infrastructure/queue/queueService.ts`)
   - Manages pg-boss instance
   - Provides methods to enqueue jobs
   - Handles queue initialization and shutdown

2. **Workers**
   - **Avatar Generation Worker** (`src/lib/server/infrastructure/queue/workers/avatarGenerationWorker.ts`)
   - **Drop Generation Worker** (`src/lib/server/infrastructure/queue/workers/dropGenerationWorker.ts`)

3. **Worker Manager** (`src/lib/server/infrastructure/queue/workerManager.ts`)
   - Starts and stops all workers
   - Manages worker lifecycle

## Setup

### 1. Database Schema

pg-boss automatically creates its own tables in the `pgboss` schema when initialized. No manual migration is needed.

### 2. Environment Variables

No additional environment variables are required. The queue service uses the existing `DATABASE_URL`.

**For Personal Software**: Workers start automatically when the application initializes - no configuration needed!

### 3. Starting Workers

**For Personal Software**: Workers start automatically when you run the application - no setup needed!

If you need to start workers manually (e.g., after a restart):

#### Option A: Automatic (Default)

Workers start automatically when the Next.js app initializes. Just run:

```bash
npm run dev
# or
npm start
```

#### Option B: Standalone Process

Run workers in a separate process if needed:

```bash
npm run workers:start
```

#### Option C: API Endpoint

Start workers via API endpoint:

```bash
POST /api/workers/start
```

## Usage

### Avatar Generation

The avatar generation API now returns immediately with a job ID and request ID:

**Request:**
```bash
POST /api/avatars/generate
{
  "imageBase64": "...",
  "stylePrompt": "anime style",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "uuid",
  "jobId": "pg-boss-job-id",
  "status": "pending",
  "message": "Avatar generation queued successfully"
}
```

**Check Status:**
```bash
GET /api/avatars/{requestId}
```

The avatar status will be:
- `pending` - Job queued, waiting to be processed
- `processing` - Currently being generated
- `completed` - Generation complete, `outputImageUrl` available
- `failed` - Generation failed, check `errorMessage`

### Drop Generation

When creating a drop, a generation job is automatically enqueued:

**Request:**
```bash
POST /api/drops
{
  "baseAvatarId": "uuid",
  "title": "My Drop",
  "stockLimit": 100,
  "traitConfig": {...}
}
```

**Response:**
```json
{
  "success": true,
  "drop": {...},
  "jobId": "pg-boss-job-id",
  "message": "Drop created and generation queued successfully"
}
```

**Check Status:**
```bash
GET /api/drops/{dropId}
```

The drop's `generationStatus` will be:
- `pending` - Job queued
- `generating` - Currently generating variations
- `completed` - Generation complete
- `failed` - Generation failed

## Queue Configuration

**Optimized for Single-User Personal Software:**

### Avatar Generation Queue
- **Concurrency**: 1 job at a time (saves resources for personal use)
- **Retry**: 3 attempts with exponential backoff
- **Expiration**: 48 hours (more lenient for personal use)

### Drop Generation Queue
- **Concurrency**: 1 job at a time (more resource intensive)
- **Retry**: 3 attempts with exponential backoff
- **Expiration**: 48 hours

### Job Retention
- **Completed jobs**: Deleted after 3 days (shorter retention for personal use)
- **Failed jobs**: Kept for troubleshooting

## Monitoring

### Queue Status Endpoint

Check queue health easily:

```bash
GET /api/queue/status
```

Returns:
```json
{
  "initialized": true,
  "queues": {
    "avatar-generation": {
      "pending": 2,
      "active": 1,
      "completed": 10,
      "failed": 0
    },
    "drop-generation": {
      "pending": 0,
      "active": 0,
      "completed": 5,
      "failed": 0
    }
  },
  "message": "Queue is running"
}
```

### Health Check

Queue status is also included in the health check endpoint:

```bash
GET /api/health
```

### Programmatic Access

You can check queue metrics programmatically:

```typescript
import { queueService, QueueName } from '@/lib/server/infrastructure/queue/queueService';

// Get queue status
const status = await queueService.getQueueStatus();

// Get queue metrics
const metrics = await queueService.getQueueMetrics(QueueName.AVATAR_GENERATION);

// Get job status
const job = await queueService.getJobStatus(jobId);
```

### Database Tables

pg-boss creates tables in the `pgboss` schema:
- `job` - Job queue
- `version` - Schema version
- `schedule` - Scheduled jobs (if used)

You can query these directly for monitoring:

```sql
SELECT * FROM pgboss.job WHERE name = 'avatar-generation' ORDER BY createdon DESC LIMIT 10;
```

## Error Handling

- Jobs that fail are automatically retried up to 3 times
- After retries are exhausted, jobs are marked as failed
- Failed jobs are kept for 7 days before deletion
- Database records are updated with error messages

## Development

### Testing Locally

1. Start the database:
   ```bash
   npm run db:up
   ```

2. Start workers in one terminal:
   ```bash
   npm run workers:start
   ```

3. Start the Next.js dev server in another terminal:
   ```bash
   npm run dev
   ```

### Debugging

Check worker logs for job processing details. Workers log:
- Job start/completion
- Processing progress
- Errors and retries

## Production Considerations

1. **Separate Worker Process**: Run workers in a separate process/container for better scalability
2. **Monitoring**: Set up monitoring for queue sizes and job failures
3. **Scaling**: Adjust `teamSize` and `teamConcurrency` based on server capacity
4. **Database Connection Pooling**: Ensure your database connection pool can handle both API and worker connections

## Troubleshooting

### Workers Not Processing Jobs

1. Check if workers are running: `npm run workers:start`
2. Verify database connection
3. Check worker logs for errors
4. Verify pg-boss schema exists: `SELECT * FROM pgboss.version;`

### Jobs Stuck in Queue

1. Check worker logs
2. Verify database connectivity
3. Check for deadlocks or long-running queries
4. Manually cancel stuck jobs via API or database

### High Queue Backlog

1. Increase worker concurrency (adjust `teamSize` in queue configuration)
2. Scale out worker processes
3. Check for performance bottlenecks in job processing

