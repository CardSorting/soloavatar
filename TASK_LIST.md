# Task List - Single-User Avatar Drop System

## Status Overview

### ✅ Completed (All Core Features)
- [x] Single-user configuration (userId defaults to 'single-user')
- [x] Avatar creation UI page (`/avatars/create`)
- [x] Removed userId inputs from UI pages
- [x] Fixed TypeScript errors in avatar generation
- [x] Added `getUserDrops` method to DropService
- [x] Collection API endpoints (complete)
- [x] Avatar Metadata API (complete)
- [x] Drop Variation APIs (complete)
- [x] Replicate Integration (complete)
- [x] Enhanced Gallery API with filters (complete)
- [x] Search API (complete)
- [x] Statistics API (complete)
- [x] Batch Avatar Generation (complete)
- [x] Avatar Regeneration (complete)

### ❌ Missing - Critical Priority

#### 1. Collection API Endpoints
**Status**: Service exists, but no API routes
**Files to Create**:
- `src/app/api/collections/route.ts` - List/Create collections
- `src/app/api/collections/[id]/route.ts` - Get/Update/Delete collection
- `src/app/api/collections/[id]/items/route.ts` - Add/Remove items

**Estimated Time**: 4 hours

#### 2. Avatar Metadata Management API
**Status**: Service exists (`avatarMetadataService.ts`), but no API routes
**Files to Create**:
- `src/app/api/avatars/[id]/route.ts` - Update (PATCH) avatar metadata
  - Support: tags, favorite, rating, notes, collectionId

**Estimated Time**: 2 hours

#### 3. Drop Variation Generation (Replicate Integration)
**Status**: Basic worker exists, but uses base avatar image
**Files to Create/Modify**:
- `src/lib/server/domains/drops/services/dropTraitService.ts` - Trait configuration
- `src/lib/server/domains/gemini/services/replicateService.ts` - Replicate API wrapper
- `src/lib/server/infrastructure/queue/workers/dropGenerationWorker.ts` - Enhance to use Replicate

**Estimated Time**: 12 hours

#### 4. Drop Variation APIs
**Status**: Database schema ready, no APIs
**Files to Create**:
- `src/app/api/drops/[id]/variations/route.ts` - Get generated variations
- `src/app/api/drops/[id]/generation-status/route.ts` - Get generation progress
- `src/app/api/drops/[id]/claim/route.ts` - Claim/assign variation token

**Estimated Time**: 6 hours

### ❌ Missing - High Priority

#### 5. Enhanced Gallery with Filters
**Status**: Basic gallery exists, needs enhancement
**Files to Modify**:
- `src/app/api/gallery/[userId]/route.ts` - Add filters (type, collection, tags, favorite)
- `src/app/gallery/[userId]/page.tsx` - Add filter UI, search, sorting

**Estimated Time**: 8 hours

#### 6. Search API
**Status**: Not implemented
**Files to Create**:
- `src/app/api/search/route.ts` - Full-text search
- `src/lib/server/domains/collections/services/searchService.ts` - Search logic

**Estimated Time**: 6 hours

#### 7. Statistics API
**Status**: Schema exists (`CollectionStats`), no service/API
**Files to Create**:
- `src/lib/server/domains/collections/services/collectionStatsService.ts`
- `src/app/api/stats/route.ts` - Collection statistics

**Estimated Time**: 4 hours

#### 8. Batch Avatar Generation
**Status**: Not implemented
**Files to Create**:
- `src/app/api/avatars/batch-generate/route.ts` - Generate multiple avatars
- Enhance `avatarService.ts` to support batch operations

**Estimated Time**: 6 hours

#### 9. Avatar Regeneration
**Status**: Not implemented
**Files to Create**:
- `src/app/api/avatars/[id]/regenerate/route.ts` - Regenerate with new style

**Estimated Time**: 3 hours

### ❌ Missing - Medium Priority

#### 10. Collection Management UI
**Status**: Service/API missing, UI missing
**Files to Create**:
- `src/app/collections/page.tsx` - Collection list
- `src/app/collections/[id]/page.tsx` - Collection detail
- `src/components/collections/CollectionCard.tsx`
- `src/components/collections/CollectionForm.tsx`

**Estimated Time**: 12 hours

#### 11. Enhanced Drop Creation UI
**Status**: Basic UI exists, needs trait builder
**Files to Create**:
- `src/components/drops/TraitBuilder.tsx` - Build trait categories
- `src/components/drops/RaritySlider.tsx` - Configure rarity distribution
- `src/components/drops/GenerationProgress.tsx` - Show generation progress
- `src/components/drops/VariationGallery.tsx` - Display generated variations

**Files to Modify**:
- `src/app/drops/create/page.tsx` - Add trait configuration UI

**Estimated Time**: 16 hours

#### 12. Drop Detail Page
**Status**: Not implemented
**Files to Create**:
- `src/app/drops/[id]/page.tsx` - View drop details, variations, ownership

**Estimated Time**: 8 hours

#### 13. Image Optimization & Thumbnails
**Status**: Storage service exists, optimization not fully implemented
**Files to Modify**:
- `src/lib/server/infrastructure/storage/storageService.ts` - Ensure optimization works
- `src/lib/server/infrastructure/storage/imageOptimizer.ts` - Verify implementation

**Estimated Time**: 4 hours

### ❌ Missing - Low Priority (Nice to Have)

#### 14. Export/Import System
**Status**: Not implemented
**Files to Create**:
- `src/app/api/export/route.ts` - Export collection
- `src/app/api/import/route.ts` - Import collection

**Estimated Time**: 8 hours

#### 15. Advanced Filtering & Sorting
**Status**: Basic filtering exists
**Enhancements Needed**:
- Multiple filter combinations
- Saved filter presets
- Advanced sorting options

**Estimated Time**: 6 hours

#### 16. Bulk Operations
**Status**: Not implemented
**Files to Create**:
- `src/app/api/avatars/bulk-update/route.ts` - Bulk update metadata
- `src/app/api/avatars/bulk-delete/route.ts` - Bulk delete

**Estimated Time**: 4 hours

---

## Implementation Priority Matrix

### Phase 1: Core Missing APIs (Week 1)
**Total: ~24 hours**

1. Collection API Endpoints (4h)
2. Avatar Metadata Management API (2h)
3. Drop Variation APIs (6h)
4. Drop Variation Generation - Replicate Integration (12h)

### Phase 2: Enhanced Features (Week 2)
**Total: ~24 hours**

5. Enhanced Gallery with Filters (8h)
6. Search API (6h)
7. Statistics API (4h)
8. Batch Avatar Generation (6h)

### Phase 3: UI Enhancements (Week 3)
**Total: ~36 hours**

9. Avatar Regeneration (3h)
10. Collection Management UI (12h)
11. Enhanced Drop Creation UI (16h)
12. Drop Detail Page (8h)

### Phase 4: Polish & Optimization (Week 4)
**Total: ~18 hours**

13. Image Optimization & Thumbnails (4h)
14. Export/Import System (8h)
15. Advanced Filtering & Sorting (6h)

---

## Quick Wins (Can be done immediately)

1. **Collection API Endpoints** (4h) - Service already exists
2. **Avatar Metadata API** (2h) - Service already exists
3. **Drop Variation APIs** (6h) - Database schema ready

**Total Quick Wins: ~12 hours**

---

## Dependencies

### External Dependencies
- ✅ Google Gemini API - Integrated
- ⚠️ Replicate API - Configured but not integrated (needed for Phase 1)
- ✅ PostgreSQL - Set up
- ⚠️ Image Storage - Local storage works, cloud storage optional

### Internal Dependencies
- Collection APIs depend on CollectionService (✅ exists)
- Avatar Metadata APIs depend on AvatarMetadataService (✅ exists)
- Drop Variation Generation depends on Replicate integration
- Enhanced UI depends on APIs being complete

---

## Notes

### Services That Exist But Need APIs
1. `CollectionService` - Full CRUD, item management ✅
2. `AvatarMetadataService` - Tags, favorites, ratings, notes ✅
3. `DropService` - Basic CRUD ✅

### Services That Need Creation
1. `dropTraitService.ts` - Trait configuration and validation
2. `replicateService.ts` - Replicate API wrapper
3. `searchService.ts` - Full-text search
4. `collectionStatsService.ts` - Statistics calculation

### Database Schema Status
- ✅ All models exist and are migrated
- ✅ Indexes are in place
- ✅ Relationships are correct
- ⚠️ Some fields may need validation (userId removed, but some queries may still reference it)

---

## Testing Recommendations

For each new feature:
1. Unit tests for services
2. Integration tests for API routes
3. Manual testing in UI

Priority testing:
- Collection APIs (high usage)
- Drop variation generation (complex logic)
- Search functionality (performance critical)

---

*Last Updated: Based on current codebase investigation*
*Next Review: After Phase 1 completion*

