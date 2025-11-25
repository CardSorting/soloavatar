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

Optional:
- `ENABLE_WORKERS=true` - Automatically start workers when the application initializes

### 3. Starting Workers

Workers can be started in two ways:

#### Option A: Standalone Process (Recommended for Production)

Run workers in a separate process:

```bash
npm run workers:start
```

This keeps workers running independently of the Next.js server.

#### Option B: With Application (Development)

Set `ENABLE_WORKERS=true` in your environment, and workers will start automatically when the application initializes.

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

### Avatar Generation Queue
- **Concurrency**: 2 jobs at a time
- **Retry**: 3 attempts with exponential backoff
- **Expiration**: 24 hours

### Drop Generation Queue
- **Concurrency**: 1 job at a time (more resource intensive)
- **Retry**: 3 attempts with exponential backoff
- **Expiration**: 24 hours

## Monitoring

### Queue Metrics

You can check queue metrics programmatically:

```typescript
import { queueService, QueueName } from '@/lib/server/infrastructure/queue/queueService';

// Get queue size
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

