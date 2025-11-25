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
  ```json
  {
    "imageBase64": "data:image/png;base64,...",
    "stylePrompt": "cyberpunk style, neon lighting...",
    "userId": "user123" // optional, defaults to "anonymous"
  }
  ```

- `GET /api/avatars/[id]` - Get avatar by ID
- `GET /api/avatars/user/[userId]` - Get user's avatars

### Drops

- `POST /api/drops` - Create a new drop (instant, no scheduling)
- `GET /api/drops` - List drops (optionally filter by userId)
- `GET /api/drops/[id]` - Get drop details
- `DELETE /api/drops/[id]` - Delete a drop

### Personal Gallery

- `GET /api/gallery/[userId]` - Get user's personal gallery (avatars + drops combined)

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

### Database Migrations

```bash
# Create a new migration
npm run prisma:migrate:dev

# Apply migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio
npm run prisma:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Simplifications

This extracted version removes:
- Authentication system (user IDs are simple strings)
- Payment/credit system
- Marketplace features (only drops)
- Complex attribution/metadata systems
- Queue systems (synchronous processing)

## Notes

- Storage service is simplified - uses data URLs by default
- For production, replace `StorageService` with cloud storage (S3, Backblaze, etc.)
- User IDs are simple strings - integrate with your auth system as needed
- Drop purchases are simplified - no actual payment processing

## License

MIT

