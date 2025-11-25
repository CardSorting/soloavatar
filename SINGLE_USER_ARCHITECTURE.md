# Single-User Personal Collection Architecture

## Vision

A robust, personal avatar generation and collection system designed for a single user to:
- Generate styled avatars from personal photos
- Create curated drop collections with trait-based variations
- Organize and manage personal digital art collections
- Generate unique variations automatically
- Track collection statistics and rarity

**Core Principle**: Everything is personal, private, and focused on collection building rather than marketplace transactions.

---

## System Architecture

### Core Concepts

1. **Personal Collection** - All avatars and drops belong to one user
2. **Avatar Generation** - Transform photos into styled avatars using AI
3. **Drop Collections** - Curated sets of trait-based avatar variations
4. **Trait Generation** - Automatic generation of unique variations with traits
5. **Collection Management** - Organize, tag, and browse personal collection

### Simplified User Model

Since this is single-user, we can:
- Remove `userId` parameters (use a constant or environment variable)
- Simplify ownership tracking (everything is owned by the user)
- Focus on collection organization instead of user separation

---

## Enhanced Database Schema

### Proposed Improvements

#### 1. Avatar Collections
Add collection/tagging system for better organization:

```prisma
model AvatarCollection {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  description String?  @db.Text
  color       String?  @db.VarChar(7)  // Hex color for UI
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  avatars     AvatarForgeRequest[]
  drops       DropListing[]
  
  @@index([name])
  @@map("avatar_collections")
}
```

#### 2. Enhanced Avatar Metadata
Add tags and organization:

```prisma
// Add to AvatarForgeRequest
tags         String[]  @default([])  // Array of tags
collectionId String?   @map("collection_id") @db.Uuid
favorite     Boolean   @default(false)
rating       Int?      @db.Integer  // 1-5 stars
notes        String?   @db.Text     // Personal notes
```

#### 3. Drop Generation Queue
Track generation jobs:

```prisma
model DropGenerationJob {
  id              String   @id @default(uuid())
  dropId          String   @map("drop_id") @db.Uuid
  status          String   @default("pending")  // pending, processing, completed, failed
  progress        Int      @default(0)
  totalVariations Int      @map("total_variations")
  completedCount  Int      @default(0) @map("completed_count")
  errorMessage    String?  @map("error_message") @db.Text
  startedAt       DateTime? @map("started_at")
  completedAt     DateTime? @map("completed_at")
  createdAt       DateTime @default(now())
  
  drop            DropListing @relation(fields: [dropId], references: [id])
  
  @@index([dropId, status])
  @@map("drop_generation_jobs")
}
```

#### 4. Collection Statistics
Track collection metrics:

```prisma
model CollectionStats {
  id              String   @id @default(uuid())
  totalAvatars    Int      @default(0) @map("total_avatars")
  totalDrops      Int      @default(0) @map("total_drops")
  totalVariations Int      @default(0) @map("total_variations")
  lastUpdated     DateTime @default(now()) @updatedAt
  
  @@map("collection_stats")
}
```

---

## Enhanced Features

### 1. Avatar Generation Workflow

#### Current Flow
1. Upload image → Generate → Store

#### Enhanced Flow
1. **Upload & Preview** - Upload image with preview
2. **Style Selection** - Choose from 8 art styles with previews
3. **Custom Prompt** - Optional custom style modifications
4. **Generation** - Process with progress tracking
5. **Review & Refine** - View result, regenerate if needed
6. **Organize** - Add to collection, tag, rate, add notes
7. **Use in Drop** - Select for drop creation

#### New Features
- **Batch Generation** - Generate multiple styles from one image
- **Style Variations** - Generate same style with different intensity
- **Regeneration** - Regenerate with modified prompts
- **Comparison View** - Side-by-side style comparison

### 2. Drop Collection System

#### Enhanced Drop Creation
1. **Select Base Avatar** - Choose from personal collection
2. **Configure Traits** - Define trait categories and values
3. **Set Rarity Distribution** - Configure rarity percentages
4. **Preview Configuration** - See trait combinations preview
5. **Generate Variations** - Automatic generation of all variations
6. **Review & Curate** - Review generated variations, remove unwanted ones
7. **Organize Collection** - Add to collection, set metadata

#### Trait System
```typescript
interface TraitCategory {
  name: string;           // e.g., "Background"
  values: TraitValue[];   // e.g., ["Red", "Blue", "Green"]
  rarityWeights: number[]; // Weight for each value
}

interface TraitValue {
  value: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;         // Generation weight
}
```

#### Generation Strategy
- **Pre-generate All** - Generate all variations upfront
- **On-Demand** - Generate as needed (slower but flexible)
- **Hybrid** - Pre-generate common, generate rare on-demand

### 3. Collection Management

#### Organization Features
- **Collections** - Group avatars/drops into named collections
- **Tags** - Flexible tagging system
- **Favorites** - Mark favorite items
- **Rating** - Rate items 1-5 stars
- **Notes** - Personal notes on items
- **Search** - Search by tags, collections, style, date
- **Filters** - Filter by style, rarity, collection, date range
- **Sorting** - Sort by date, rating, rarity, name

#### Views
- **Gallery View** - Grid of thumbnails
- **List View** - Detailed list with metadata
- **Collection View** - View items in a collection
- **Drop Detail View** - View all variations in a drop
- **Statistics Dashboard** - Collection stats and insights

### 4. Generation Pipeline

#### Avatar Generation
```
Upload Image
  ↓
Validate & Optimize
  ↓
Store Input Image
  ↓
Generate with Gemini (with progress)
  ↓
Store Output Image
  ↓
Update Status
  ↓
Notify Completion
```

#### Drop Variation Generation
```
Create Drop
  ↓
Configure Traits
  ↓
Calculate Combinations
  ↓
Queue Generation Jobs
  ↓
For each variation:
  - Generate traits
  - Generate image (Replicate/Gemini)
  - Calculate rarity
  - Store variation
  ↓
Update Drop Status
  ↓
Notify Completion
```

---

## API Design (Simplified for Single User)

### Avatar Endpoints

```typescript
// Generate avatar
POST /api/avatars/generate
{
  imageBase64: string;
  stylePrompt: string;
  customPrompt?: string;
  tags?: string[];
  collectionId?: string;
}

// Batch generate (multiple styles)
POST /api/avatars/batch-generate
{
  imageBase64: string;
  styleIds: string[];
  tags?: string[];
}

// Get avatar
GET /api/avatars/[id]

// List avatars (with filters)
GET /api/avatars?collectionId=...&tags=...&style=...&sort=...

// Update avatar metadata
PATCH /api/avatars/[id]
{
  tags?: string[];
  collectionId?: string;
  favorite?: boolean;
  rating?: number;
  notes?: string;
}

// Delete avatar
DELETE /api/avatars/[id]

// Regenerate avatar
POST /api/avatars/[id]/regenerate
{
  stylePrompt?: string;
  customPrompt?: string;
}
```

### Drop Endpoints

```typescript
// Create drop
POST /api/drops
{
  baseAvatarId: string;
  title: string;
  description?: string;
  collectionName?: string;
  traitConfig: TraitConfig;
  generationStrategy: 'pre-generate' | 'on-demand' | 'hybrid';
}

// Get drop
GET /api/drops/[id]

// List drops
GET /api/drops?collectionId=...&status=...

// Update drop
PATCH /api/drops/[id]
{
  title?: string;
  description?: string;
  collectionName?: string;
}

// Delete drop
DELETE /api/drops/[id]

// Start trait generation
POST /api/drops/[id]/generate
{
  strategy?: 'pre-generate' | 'on-demand';
}

// Get generation status
GET /api/drops/[id]/generation-status

// Get drop variations
GET /api/drops/[id]/variations?rarity=...&assigned=...

// Assign variation (claim token)
POST /api/drops/[id]/claim
{
  tokenNumber: number;
}

// Get unassigned variations
GET /api/drops/[id]/unassigned
```

### Collection Endpoints

```typescript
// Create collection
POST /api/collections
{
  name: string;
  description?: string;
  color?: string;
}

// Get collection
GET /api/collections/[id]

// List collections
GET /api/collections

// Update collection
PATCH /api/collections/[id]

// Delete collection
DELETE /api/collections/[id]

// Add items to collection
POST /api/collections/[id]/items
{
  avatarIds?: string[];
  dropIds?: string[];
}

// Remove items from collection
DELETE /api/collections/[id]/items
{
  avatarIds?: string[];
  dropIds?: string[];
}
```

### Gallery & Search

```typescript
// Get personal gallery
GET /api/gallery?type=avatar|drop|all&collectionId=...&tags=...&sort=...

// Search
GET /api/search?q=...&type=...&filters=...

// Get statistics
GET /api/stats
```

---

## Service Architecture

### Domain Services

```
src/lib/server/domains/
├── avatars/
│   ├── services/
│   │   ├── avatarService.ts          # Core generation
│   │   ├── avatarCollectionService.ts # Collection management
│   │   └── avatarMetadataService.ts  # Tags, ratings, notes
│   └── types/
│       └── index.ts
├── drops/
│   ├── services/
│   │   ├── dropService.ts            # Drop CRUD
│   │   ├── dropGenerationService.ts  # Trait generation
│   │   ├── dropVariationService.ts   # Variation management
│   │   └── dropTraitService.ts       # Trait configuration
│   └── types/
│       └── index.ts
├── collections/
│   ├── services/
│   │   ├── collectionService.ts      # Collection CRUD
│   │   └── collectionStatsService.ts # Statistics
│   └── types/
│       └── index.ts
└── gemini/
    └── services/
        ├── geminiService.ts           # Gemini API
        └── replicateService.ts        # Replicate API (for variations)
```

### Key Services

#### AvatarService (Enhanced)
- Generate single avatar
- Batch generate (multiple styles)
- Regenerate with modifications
- Progress tracking
- Error handling and retries

#### DropGenerationService
- Trait combination calculation
- Rarity distribution
- Variation generation queue
- Progress tracking
- Error recovery

#### CollectionService
- Collection CRUD
- Item organization
- Tag management
- Search and filtering
- Statistics calculation

---

## UI/UX Improvements

### Avatar Generation Page
- **Image Upload** - Drag & drop with preview
- **Style Gallery** - Visual style selection with previews
- **Custom Prompt** - Optional text input for customizations
- **Generation Progress** - Real-time progress indicator
- **Result Preview** - Large preview with zoom
- **Quick Actions** - Add to collection, tag, favorite, regenerate
- **Comparison View** - Compare multiple generated styles

### Drop Creation Page
- **Avatar Selector** - Visual grid of available avatars
- **Trait Builder** - Interactive trait configuration
- **Rarity Slider** - Visual rarity distribution
- **Preview** - Preview trait combinations
- **Generation Queue** - See generation progress
- **Variation Gallery** - Browse generated variations
- **Curate Mode** - Remove unwanted variations

### Gallery Page
- **View Modes** - Grid, list, detail
- **Filters** - Collection, tags, style, rarity, date
- **Search** - Full-text search
- **Sorting** - Multiple sort options
- **Bulk Actions** - Select multiple items
- **Quick View** - Modal preview
- **Statistics Panel** - Collection insights

### Collection Management
- **Collection Sidebar** - Quick access to collections
- **Collection Pages** - Dedicated collection views
- **Tag Cloud** - Visual tag navigation
- **Smart Collections** - Auto-organized by criteria

---

## Generation Strategies

### Strategy 1: Pre-Generate All
- Generate all variations when drop is created
- Fast access, uses more storage
- Best for: Small drops (<100 variations)

### Strategy 2: On-Demand
- Generate when variation is claimed
- Slower access, uses less storage
- Best for: Large drops (>1000 variations)

### Strategy 3: Hybrid
- Pre-generate common/uncommon
- Generate rare/epic/legendary on-demand
- Balanced approach
- Best for: Medium drops (100-1000 variations)

---

## Performance Optimizations

### Image Handling
- **Optimization** - Compress images on upload
- **Thumbnails** - Generate thumbnails for gallery
- **Lazy Loading** - Load images on demand
- **CDN** - Use CDN for image delivery (production)

### Database
- **Indexing** - Proper indexes for common queries
- **Pagination** - Paginate large result sets
- **Caching** - Cache frequently accessed data
- **Connection Pooling** - Optimize database connections

### Generation
- **Queue System** - Background job processing
- **Rate Limiting** - Respect API rate limits
- **Retry Logic** - Automatic retries on failure
- **Progress Tracking** - Real-time progress updates

---

## Error Handling & Resilience

### Generation Failures
- **Retry Logic** - Automatic retries with exponential backoff
- **Partial Success** - Continue generation if some fail
- **Error Logging** - Detailed error logs
- **User Notification** - Clear error messages

### Data Integrity
- **Transactions** - Use DB transactions for critical operations
- **Validation** - Validate all inputs
- **Backup** - Regular database backups
- **Recovery** - Recovery procedures for failures

---

## Security Considerations

### Single-User Security
- **Local Storage** - All data stored locally (or private cloud)
- **No Public Access** - No public endpoints needed
- **Input Validation** - Validate all user inputs
- **File Upload Security** - Validate image uploads
- **API Key Protection** - Secure API keys in environment

---

## Implementation Roadmap

### Phase 1: Core Enhancements (Week 1-2)
1. ✅ Remove userId complexity (use constant)
2. ✅ Add collection/tagging system
3. ✅ Enhance avatar generation UI
4. ✅ Add metadata management (favorites, ratings, notes)

### Phase 2: Drop Generation (Week 3-4)
1. ✅ Implement trait system
2. ✅ Build trait generation service
3. ✅ Integrate Replicate API
4. ✅ Create variation generation pipeline
5. ✅ Add generation progress tracking

### Phase 3: Collection Management (Week 5-6)
1. ✅ Build collection UI
2. ✅ Implement search and filtering
3. ✅ Add statistics dashboard
4. ✅ Create organization features

### Phase 4: Polish & Optimization (Week 7-8)
1. ✅ Performance optimization
2. ✅ Error handling improvements
3. ✅ UI/UX refinements
4. ✅ Testing and bug fixes

---

## Success Metrics

### User Experience
- Time to generate avatar: < 30 seconds
- Drop generation: Progress visible, < 5 min for 100 variations
- Gallery load time: < 2 seconds
- Search results: < 500ms

### System Performance
- API response time: < 200ms (non-generation endpoints)
- Database query time: < 100ms
- Image optimization: < 5 seconds
- Generation success rate: > 95%

### Collection Quality
- Organization: Easy to find items
- Discovery: Easy to browse and explore
- Management: Simple to organize
- Statistics: Useful insights

---

## Technical Decisions

### Why Single-User?
- Simpler architecture
- No authentication overhead
- Faster development
- Focus on features, not multi-tenancy

### Why Pre-Generate Variations?
- Better user experience (instant access)
- Can curate before claiming
- Better for small-medium collections

### Why Collections & Tags?
- Flexible organization
- Easy discovery
- Personal curation
- Scalable as collection grows

### Why Both Gemini & Replicate?
- Gemini: High-quality base avatar generation
- Replicate: Trait-based variation generation
- Best tool for each job

---

## Future Enhancements (Optional)

1. **Export Features** - Export collection as images/JSON
2. **Import Features** - Import external avatars
3. **Sharing** - Share collections (read-only links)
4. **Analytics** - Advanced collection analytics
5. **AI Suggestions** - AI-powered collection organization
6. **Batch Operations** - Bulk actions on items
7. **Backup/Restore** - Collection backup system
8. **Themes** - Custom UI themes
9. **Keyboard Shortcuts** - Power user features
10. **Mobile App** - Native mobile app

---

*This architecture focuses on creating a robust, personal collection system that prioritizes user experience, organization, and generation quality over marketplace features.*

