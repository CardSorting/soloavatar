# Avatar & Drop System

A simplified Next.js application for avatar generation and NFT-style drop management, extracted from a larger system. This version focuses on core functionality without authentication, payment, or marketplace features.

## Features

### Avatar Generation
- Generate styled avatars from user-uploaded images using Google Gemini API
- Multiple art styles (Cyberpunk, Watercolor, Pixel Art, Anime, Oil Painting, 3D Render, Pencil Sketch, Pop Art)
- Store and manage avatar generation requests

### Drop System
- Create instant drops (no scheduling - available immediately)
- Generate unique trait-based avatar variations using Replicate API
- Track ownership tokens (similar to NFT token IDs)
- Personal gallery that shows both avatars and drops together

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Google Gemini API** - Avatar generation
- **Replicate API** - Trait-based avatar generation for drops
- **Tailwind CSS** - Styling

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key
- Replicate API token (for drop trait generation)

### Installation

1. Clone the repository:
```bash
cd avatar-drop-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Your Google Gemini API key
- `REPLICATE_API_TOKEN` - Your Replicate API token (for drops)

4. Set up the database:

**Option A: Local PostgreSQL with Docker (Recommended)**

```bash
# Start PostgreSQL database
npm run db:setup

# This will:
# 1. Start PostgreSQL container
# 2. Create initial migration
# 3. Generate Prisma client
```

**Option B: Manual PostgreSQL setup**

Ensure you have PostgreSQL running and create a database named `avatar_drop_system`, then:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
avatar-drop-system/
├── prisma/
│   └── schema.prisma          # Database schema (Avatar & Drop tables)
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── avatars/       # Avatar generation endpoints
│   │   │   └── drops/         # Drop management endpoints
│   │   └── ...                # Next.js app router pages
│   ├── components/            # React components
│   │   ├── avatarforge/       # Avatar generation UI
│   │   └── drops/             # Drop management UI
│   ├── lib/
│   │   └── server/
│   │       ├── domains/
│   │       │   ├── gemini/    # Avatar generation services
│   │       │   └── drops/     # Drop management services
│   │       ├── infrastructure/ # Database, storage, config
│   │       └── shared/        # Shared utilities
│   └── constants/
│       └── artStyles.ts       # Available art styles
└── package.json
```

## API Endpoints

### Avatar Generation

- `POST /api/avatars/generate` - Generate a new avatar
- `GET /api/avatars/[id]` - Get avatar by ID
- `PATCH /api/avatars/[id]` - Update avatar metadata (tags, favorite, rating, notes, collectionId)
- `POST /api/avatars/batch-generate` - Generate multiple avatars from one image
- `POST /api/avatars/[id]/regenerate` - Regenerate avatar with new style
- `GET /api/avatars/user/[userId]` - Get user's avatars

### Drops

- `POST /api/drops` - Create a new drop (instant, no scheduling)
- `GET /api/drops` - List drops
- `GET /api/drops/[id]` - Get drop details
- `DELETE /api/drops/[id]` - Delete a drop
- `GET /api/drops/[id]/variations` - Get generated variations
- `GET /api/drops/[id]/generation-status` - Get generation progress
- `POST /api/drops/[id]/claim` - Claim/assign variation token

### Collections

- `GET /api/collections` - List collections (with search)
- `POST /api/collections` - Create collection
- `GET /api/collections/[id]` - Get collection
- `PATCH /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection
- `POST /api/collections/[id]/items` - Add items to collection
- `DELETE /api/collections/[id]/items` - Remove items from collection

### Gallery & Search

- `GET /api/gallery/[userId]` - Get gallery with filters (type, collection, tags, favorite, search, sort)
- `GET /api/search` - Full-text search across avatars, drops, and collections

### Statistics

- `GET /api/stats` - Get collection statistics

**See `API_REFERENCE.md` for complete API documentation.**

## Database Schema

### AvatarForgeRequest
- Stores avatar generation requests
- Tracks input/output images
- Status: pending, processing, completed, failed

### DropListing
- Instant drop listings (no scheduling)
- Links to base avatar
- Tracks stock, generation status, and progress

### DropOwnership
- Ownership tokens (like NFT token IDs)
- Links to drop listing
- Tracks current owner

### DropGeneratedAvatar
- Pre-generated avatars with traits
- Assigned to ownership tokens on purchase

## Development

### Database Operations

**Quick Setup Scripts:**

```bash
# Start PostgreSQL database + run initial migration
npm run db:setup

# Start PostgreSQL database
npm run db:up

# Stop PostgreSQL database
npm run db:down

# Reset database (removes all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio
```

**Migration Commands:**

```bash
# Create a new migration
npm run prisma:migrate:dev

# Apply migrations (production)
npm run prisma:migrate:deploy

# Generate Prisma client (automatically done in db:setup)
npm run prisma:generate
```

### Building for Production

```bash
npm run build
npm start
```

## Features

### ✅ Complete Features

- **Avatar Generation**: Generate styled avatars using Google Gemini API
- **Drop System**: Create drops with trait-based variation generation
- **Replicate Integration**: Generate unique variations using Replicate API
- **Collection Management**: Organize avatars into collections
- **Metadata Management**: Tags, favorites, ratings, notes
- **Search & Filter**: Full-text search and advanced filtering
- **Statistics**: Collection analytics and insights
- **Batch Operations**: Generate multiple avatars at once
- **Queue System**: Async processing for long-running tasks

### Single-User System

This is a **single-user, personal software** system:
- No authentication required (defaults to `'single-user'`)
- All data belongs to the single user
- Simplified architecture for personal use
- Ready for personal deployment

## Notes

- Storage service uses local file storage by default
- For production, consider cloud storage (S3, Backblaze, etc.)
- Replicate API is optional - system falls back gracefully if not configured
- Queue system handles async processing automatically

## License

MIT
