# Quick Start Guide - Single-User Avatar Drop System

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or existing PostgreSQL database
- Google Gemini API key
- Replicate API token (optional, for variation generation)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
DATABASE_URL=postgresql://avatar_user:avatar_password@localhost:5432/avatar_drop_system
GEMINI_API_KEY=your-gemini-api-key
REPLICATE_API_TOKEN=your-replicate-token  # Optional
```

### 3. Set Up Database

**Option A: Using Docker (Recommended)**

```bash
npm run db:setup
```

This will:
- Start PostgreSQL container
- Run database migrations
- Generate Prisma client

**Option B: Manual Setup**

1. Create PostgreSQL database: `avatar_drop_system`
2. Run migrations:
```bash
npm run prisma:migrate:dev
```

### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Start Workers (Optional)

For async processing (avatar generation, drop variations):

```bash
npm run workers:start
```

Or start in a separate terminal:
```bash
tsx src/scripts/start-workers.ts
```

## First Steps

### 1. Generate Your First Avatar

1. Go to `http://localhost:3000/avatars/create`
2. Upload an image
3. Select a style (or enter custom)
4. Click "Generate Avatar"
5. Wait for generation to complete

### 2. Create Your First Drop

1. Go to `http://localhost:3000/drops/create`
2. Select a completed avatar
3. Enter drop details
4. Set stock limit
5. Click "Create Drop Instantly"
6. Variations will generate automatically

### 3. View Your Gallery

1. Go to `http://localhost:3000/gallery/single-user`
2. See all your avatars and drops
3. Use filters to organize

## API Usage Examples

### Generate Avatar

```bash
curl -X POST http://localhost:3000/api/avatars/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,...",
    "stylePrompt": "cyberpunk style"
  }'
```

### Create Collection

```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Collection",
    "description": "My favorite avatars"
  }'
```

### Search

```bash
curl "http://localhost:3000/api/search?q=cyberpunk&type=avatar"
```

### Get Statistics

```bash
curl http://localhost:3000/api/stats
```

## Common Tasks

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Reset Database

```bash
npm run db:reset
```

⚠️ **Warning**: This deletes all data!

### Check Health

```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running: `docker-compose ps`
2. Verify `DATABASE_URL` in `.env`
3. Try: `npm run db:up`

### Avatar Generation Fails

1. Check `GEMINI_API_KEY` is set correctly
2. Verify API key has credits
3. Check logs for specific errors

### Drop Variations Not Generating

1. Check `REPLICATE_API_TOKEN` is set (optional)
2. System will use base avatar if Replicate unavailable
3. Check worker is running: `npm run workers:start`

### Images Not Loading

1. Check storage directory exists: `data/storage/`
2. Verify `STORAGE_BASE_URL` in `.env`
3. Check file permissions

## Next Steps

- Read `API_REFERENCE.md` for complete API documentation
- Check `COMPLETION_SUMMARY.md` for feature overview
- See `REPLICATE_INTEGRATION.md` for variation generation details

## Support

- Check logs in console output
- Use Prisma Studio to inspect database
- Review API responses for error messages
- Check `INVESTIGATION_REPORT.md` for system details

---

**Happy Creating! 🎨**

