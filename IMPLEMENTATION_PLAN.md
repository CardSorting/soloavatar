# Implementation Plan - Single-User Collection System

## Overview

This document outlines the step-by-step implementation plan for building a robust single-user avatar and drop collection system. The plan is organized into phases with specific tasks, priorities, and dependencies.

---

## Phase 1: Foundation & Simplification (Priority: High)

### Goal
Simplify the system for single-user use and establish core infrastructure.

### Tasks

#### 1.1 Remove User ID Complexity
- [ ] Create `USER_ID` constant in config (or use environment variable)
- [ ] Update all services to use constant instead of userId parameter
- [ ] Remove userId from API endpoints (or make optional with default)
- [ ] Update database queries to use constant
- [ ] Update UI to remove userId inputs

**Files to Modify:**
- `src/lib/server/infrastructure/config.ts`
- `src/lib/server/domains/gemini/services/avatarService.ts`
- `src/lib/server/domains/drops/services/dropService.ts`
- All API routes
- All UI pages

**Estimated Time:** 4 hours

#### 1.2 Add Collection System to Database
- [ ] Create `AvatarCollection` model in Prisma schema
- [ ] Add collection fields to `AvatarForgeRequest` (collectionId, tags, favorite, rating, notes)
- [ ] Create migration
- [ ] Update TypeScript types

**Files to Create/Modify:**
- `prisma/schema.prisma`
- `src/types/index.ts`

**Estimated Time:** 2 hours

#### 1.3 Create Collection Service
- [ ] Create `collectionService.ts`
- [ ] Implement CRUD operations
- [ ] Add item management (add/remove avatars/drops)
- [ ] Add search and filtering

**Files to Create:**
- `src/lib/server/domains/collections/services/collectionService.ts`
- `src/lib/server/domains/collections/types/index.ts`

**Estimated Time:** 6 hours

#### 1.4 Create Collection API Endpoints
- [ ] `POST /api/collections` - Create collection
- [ ] `GET /api/collections` - List collections
- [ ] `GET /api/collections/[id]` - Get collection
- [ ] `PATCH /api/collections/[id]` - Update collection
- [ ] `DELETE /api/collections/[id]` - Delete collection
- [ ] `POST /api/collections/[id]/items` - Add items
- [ ] `DELETE /api/collections/[id]/items` - Remove items

**Files to Create:**
- `src/app/api/collections/route.ts`
- `src/app/api/collections/[id]/route.ts`
- `src/app/api/collections/[id]/items/route.ts`

**Estimated Time:** 4 hours

**Phase 1 Total:** ~16 hours

---

## Phase 2: Avatar Generation Enhancement (Priority: High)

### Goal
Build a complete avatar generation UI and enhance the generation workflow.

### Tasks

#### 2.1 Create Avatar Generation Page
- [ ] Create `/app/avatars/create/page.tsx`
- [ ] Add image upload component (drag & drop)
- [ ] Add image preview
- [ ] Add style selection grid
- [ ] Add custom prompt input
- [ ] Add generation progress indicator
- [ ] Add result display
- [ ] Add quick actions (add to collection, tag, favorite)

**Files to Create:**
- `src/app/avatars/create/page.tsx`
- `src/components/avatars/ImageUpload.tsx`
- `src/components/avatars/StyleSelector.tsx`
- `src/components/avatars/GenerationProgress.tsx`
- `src/components/avatars/AvatarResult.tsx`

**Estimated Time:** 12 hours

#### 2.2 Enhance Avatar Service
- [ ] Add batch generation support
- [ ] Add regeneration functionality
- [ ] Add metadata update methods
- [ ] Add progress tracking
- [ ] Improve error handling

**Files to Modify:**
- `src/lib/server/domains/gemini/services/avatarService.ts`

**Files to Create:**
- `src/lib/server/domains/avatars/services/avatarMetadataService.ts`

**Estimated Time:** 8 hours

#### 2.3 Add Avatar Metadata API
- [ ] `PATCH /api/avatars/[id]` - Update metadata
- [ ] `POST /api/avatars/batch-generate` - Batch generation
- [ ] `POST /api/avatars/[id]/regenerate` - Regenerate

**Files to Modify:**
- `src/app/api/avatars/[id]/route.ts`

**Files to Create:**
- `src/app/api/avatars/batch-generate/route.ts`
- `src/app/api/avatars/[id]/regenerate/route.ts`

**Estimated Time:** 4 hours

#### 2.4 Enhance Avatar List API
- [ ] Add filtering (collection, tags, style, favorite)
- [ ] Add sorting options
- [ ] Add pagination
- [ ] Add search

**Files to Modify:**
- `src/app/api/avatars/user/[userId]/route.ts` (or create new endpoint)

**Estimated Time:** 3 hours

**Phase 2 Total:** ~27 hours

---

## Phase 3: Drop Generation System (Priority: High)

### Goal
Implement complete trait-based drop generation system.

### Tasks

#### 3.1 Create Trait System Types
- [ ] Define `TraitCategory` interface
- [ ] Define `TraitValue` interface
- [ ] Define `TraitConfig` interface
- [ ] Define rarity types and calculations

**Files to Create:**
- `src/lib/server/domains/drops/types/traits.ts`

**Estimated Time:** 2 hours

#### 3.2 Create Trait Generation Service
- [ ] Implement trait combination calculator
- [ ] Implement rarity distribution
- [ ] Implement trait validation
- [ ] Add trait preview generation

**Files to Create:**
- `src/lib/server/domains/drops/services/dropTraitService.ts`

**Estimated Time:** 8 hours

#### 3.3 Create Replicate Service
- [ ] Set up Replicate client
- [ ] Implement image generation with traits
- [ ] Add progress tracking
- [ ] Add error handling and retries

**Files to Create:**
- `src/lib/server/domains/gemini/services/replicateService.ts`

**Estimated Time:** 6 hours

#### 3.4 Create Drop Generation Service
- [ ] Implement variation generation queue
- [ ] Implement generation job management
- [ ] Add progress tracking
- [ ] Add error recovery
- [ ] Implement generation strategies (pre-generate, on-demand, hybrid)

**Files to Create:**
- `src/lib/server/domains/drops/services/dropGenerationService.ts`
- `src/lib/server/domains/drops/services/dropVariationService.ts`

**Estimated Time:** 12 hours

#### 3.5 Add Generation Job Model
- [ ] Add `DropGenerationJob` model to Prisma schema
- [ ] Create migration
- [ ] Update types

**Files to Modify:**
- `prisma/schema.prisma`
- `src/types/index.ts`

**Estimated Time:** 1 hour

#### 3.6 Create Drop Generation API
- [ ] `POST /api/drops/[id]/generate` - Start generation
- [ ] `GET /api/drops/[id]/generation-status` - Get status
- [ ] `GET /api/drops/[id]/variations` - Get variations
- [ ] `POST /api/drops/[id]/claim` - Claim variation

**Files to Create:**
- `src/app/api/drops/[id]/generate/route.ts`
- `src/app/api/drops/[id]/generation-status/route.ts`
- `src/app/api/drops/[id]/variations/route.ts`
- `src/app/api/drops/[id]/claim/route.ts`

**Estimated Time:** 6 hours

#### 3.7 Enhance Drop Creation UI
- [ ] Add trait builder component
- [ ] Add rarity distribution slider
- [ ] Add trait preview
- [ ] Add generation strategy selection
- [ ] Add generation progress display
- [ ] Add variation gallery

**Files to Create:**
- `src/components/drops/TraitBuilder.tsx`
- `src/components/drops/RaritySlider.tsx`
- `src/components/drops/TraitPreview.tsx`
- `src/components/drops/GenerationProgress.tsx`
- `src/components/drops/VariationGallery.tsx`

**Files to Modify:**
- `src/app/drops/create/page.tsx`

**Estimated Time:** 16 hours

**Phase 3 Total:** ~51 hours

---

## Phase 4: Collection Management UI (Priority: Medium)

### Goal
Build comprehensive collection management and gallery features.

### Tasks

#### 4.1 Enhance Gallery Page
- [ ] Add view modes (grid, list, detail)
- [ ] Add filters sidebar
- [ ] Add search functionality
- [ ] Add sorting options
- [ ] Add bulk selection
- [ ] Add quick view modal
- [ ] Add statistics panel

**Files to Modify:**
- `src/app/gallery/[userId]/page.tsx`

**Files to Create:**
- `src/components/gallery/ViewModeSelector.tsx`
- `src/components/gallery/FilterSidebar.tsx`
- `src/components/gallery/SearchBar.tsx`
- `src/components/gallery/QuickView.tsx`
- `src/components/gallery/StatisticsPanel.tsx`

**Estimated Time:** 16 hours

#### 4.2 Create Collection Management UI
- [ ] Create collection list page
- [ ] Create collection detail page
- [ ] Add collection creation modal
- [ ] Add collection editing
- [ ] Add item management UI

**Files to Create:**
- `src/app/collections/page.tsx`
- `src/app/collections/[id]/page.tsx`
- `src/components/collections/CollectionCard.tsx`
- `src/components/collections/CollectionForm.tsx`
- `src/components/collections/ItemManager.tsx`

**Estimated Time:** 12 hours

#### 4.3 Add Search API
- [ ] `GET /api/search` - Full-text search
- [ ] Implement search indexing
- [ ] Add search filters

**Files to Create:**
- `src/app/api/search/route.ts`
- `src/lib/server/domains/collections/services/searchService.ts`

**Estimated Time:** 6 hours

#### 4.4 Add Statistics API
- [ ] `GET /api/stats` - Collection statistics
- [ ] Calculate stats (totals, rarity distribution, etc.)
- [ ] Cache statistics

**Files to Create:**
- `src/app/api/stats/route.ts`
- `src/lib/server/domains/collections/services/collectionStatsService.ts`

**Estimated Time:** 4 hours

**Phase 4 Total:** ~38 hours

---

## Phase 5: Polish & Optimization (Priority: Medium)

### Goal
Improve performance, error handling, and user experience.

### Tasks

#### 5.1 Image Optimization
- [ ] Implement image compression
- [ ] Generate thumbnails
- [ ] Add lazy loading
- [ ] Optimize image delivery

**Files to Create:**
- `src/lib/server/infrastructure/imageOptimization.ts`

**Estimated Time:** 8 hours

#### 5.2 Error Handling Improvements
- [ ] Add retry logic for API calls
- [ ] Improve error messages
- [ ] Add error recovery
- [ ] Add error logging

**Files to Modify:**
- All service files
- All API routes

**Estimated Time:** 6 hours

#### 5.3 Performance Optimization
- [ ] Add database query optimization
- [ ] Add caching layer
- [ ] Add pagination everywhere
- [ ] Optimize image loading

**Estimated Time:** 8 hours

#### 5.4 UI/UX Improvements
- [ ] Add loading states
- [ ] Add empty states
- [ ] Improve error states
- [ ] Add animations
- [ ] Improve responsive design
- [ ] Add keyboard shortcuts

**Estimated Time:** 10 hours

#### 5.5 Testing
- [ ] Add unit tests for services
- [ ] Add integration tests for API
- [ ] Add E2E tests for critical flows
- [ ] Add error scenario testing

**Estimated Time:** 12 hours

**Phase 5 Total:** ~44 hours

---

## Total Estimated Time

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Foundation | 16 | High |
| Phase 2: Avatar Enhancement | 27 | High |
| Phase 3: Drop Generation | 51 | High |
| Phase 4: Collection Management | 38 | Medium |
| Phase 5: Polish & Optimization | 44 | Medium |
| **Total** | **176 hours** | |

**Estimated Timeline:** 4-5 weeks (full-time) or 8-10 weeks (part-time)

---

## Critical Path

The critical path for getting a working system:

1. **Phase 1.1** - Remove userId complexity (blocks everything)
2. **Phase 2.1** - Create avatar generation page (core feature)
3. **Phase 3.1-3.4** - Build drop generation system (core feature)
4. **Phase 3.7** - Enhance drop creation UI (user-facing)

**Minimum Viable Product (MVP):**
- Single-user system (Phase 1.1)
- Avatar generation UI (Phase 2.1)
- Basic drop generation (Phase 3.1-3.4)
- Basic drop UI (Phase 3.7)

**Estimated MVP Time:** ~60 hours

---

## Dependencies

### External Dependencies
- Google Gemini API (already integrated)
- Replicate API (needs integration)
- PostgreSQL database (already set up)
- Image storage (needs cloud storage for production)

### Internal Dependencies
- Phase 1 must complete before Phase 2-4
- Phase 3.1-3.3 must complete before Phase 3.4
- Phase 3.4 must complete before Phase 3.6-3.7

---

## Risk Mitigation

### High-Risk Items
1. **Replicate API Integration** - New integration, may have issues
   - Mitigation: Start early, test thoroughly, have fallback plan

2. **Generation Performance** - Large drops may be slow
   - Mitigation: Implement queue system, show progress, allow cancellation

3. **Image Storage** - Data URLs not production-ready
   - Mitigation: Plan cloud storage migration early

### Medium-Risk Items
1. **Database Performance** - Large collections may be slow
   - Mitigation: Add indexes, implement pagination, add caching

2. **UI Complexity** - Complex features may be hard to use
   - Mitigation: User testing, iterative design, clear documentation

---

## Success Criteria

### MVP Success
- [ ] Can generate avatars from uploaded images
- [ ] Can create drops with trait configuration
- [ ] Can generate drop variations
- [ ] Can view and organize collection
- [ ] System works for single user without auth

### Full System Success
- [ ] All features from architecture document implemented
- [ ] Performance meets targets (< 2s page loads, < 30s generation)
- [ ] Error handling is robust
- [ ] UI is intuitive and polished
- [ ] Code is maintainable and well-documented

---

## Next Steps

1. **Review this plan** - Ensure it aligns with goals
2. **Prioritize phases** - Adjust based on needs
3. **Set up development environment** - Ensure all tools ready
4. **Start Phase 1** - Begin with foundation work
5. **Iterate** - Build, test, refine

---

*This plan is a living document and should be updated as implementation progresses.*

