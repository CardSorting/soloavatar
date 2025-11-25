# Migration Notes - Instant Personal Drops

## Schema Changes

The drop system has been simplified to remove scheduling and make drops instant/personal.

### Removed Fields from DropListing:
- `dropStartTime` - Drops are created instantly
- `dropEndTime` - No end time needed
- `dropStatus` - Always active when created
- `dropTeaser` - Not needed for instant drops

### Renamed Fields:
- `dropCollectionName` → `collectionName`
- `dropTraitConfig` → `traitConfig`
- `dropGenerationStatus` → `generationStatus`
- `dropGenerationProgress` → `generationProgress`

### New Behavior:
- Drops are **created instantly** and available immediately
- No scheduling logic needed
- Personal gallery shows both avatars and drops together
- Focus on personal collection management

## Database Migration

When you run `prisma migrate dev`, Prisma will:
1. Remove the scheduling-related columns
2. Rename the fields as listed above
3. Update indexes accordingly

## API Changes

### Drop Creation
- No need to specify `dropStartTime` or `dropEndTime`
- Drop is immediately available after creation
- Status is always "active" (implicit)

### Drop Listing
- No filtering by `dropStatus` (upcoming/live/ended)
- All drops are active
- Can filter by `userId` for personal drops

### Personal Gallery
- New endpoint: `GET /api/gallery/[userId]`
- Returns combined list of avatars and drops
- Sorted by creation date (newest first)

## UI Changes

- Removed countdown timers
- Removed "upcoming" vs "live" status indicators
- Personal gallery page shows unified view
- Simplified drop creation flow

