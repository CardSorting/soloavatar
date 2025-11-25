# Quick Reference - Single-User Avatar Collection System

## 🎯 System Purpose
Robust personal avatar generation and collection system for a single user. Generate styled avatars, create trait-based drop collections, and organize your personal digital art collection.

## 📊 Status Overview

| Component | Status | Notes |
|-----------|--------|-------|
| **Core System** | | |
| Single-User Setup | ⚠️ Partial | Still uses userId params |
| Avatar Generation API | ✅ Complete | Gemini integration working |
| Avatar Creation UI | ❌ Missing | Page doesn't exist |
| Drop Creation API | ✅ Complete | Basic CRUD working |
| Drop Creation UI | ✅ Complete | Basic page exists |
| **Advanced Features** | | |
| Trait Generation | ❌ Missing | Schema ready, no service |
| Drop Variation Generation | ❌ Missing | Replicate not integrated |
| Collection System | ❌ Missing | Not implemented |
| Tagging & Metadata | ❌ Missing | Not implemented |
| Search & Filtering | ❌ Missing | Basic only |
| **Infrastructure** | | |
| Gallery API | ✅ Complete | Combined view working |
| Gallery UI | ✅ Complete | Basic page exists |
| Storage | ⚠️ Simplified | Data URLs only |
| Statistics | ❌ Missing | Not implemented |

## 🔑 Key Files

### Services
- `src/lib/server/domains/gemini/services/avatarService.ts` - Avatar generation
- `src/lib/server/domains/gemini/services/geminiService.ts` - Gemini API wrapper
- `src/lib/server/domains/drops/services/dropService.ts` - Drop management

### API Routes
- `src/app/api/avatars/generate/route.ts` - Generate avatar
- `src/app/api/drops/route.ts` - Create/list drops
- `src/app/api/gallery/[userId]/route.ts` - Personal gallery

### Pages
- `src/app/page.tsx` - Home page
- `src/app/drops/create/page.tsx` - Create drop
- `src/app/gallery/[userId]/page.tsx` - View gallery
- `src/app/avatars/create/page.tsx` - **MISSING** ⚠️

## 🗄️ Database Models

1. **AvatarForgeRequest** - Avatar generation requests
2. **DropListing** - Drop collections
3. **DropOwnership** - Ownership tokens (NFT-style)
4. **DropGeneratedAvatar** - Pre-generated trait variations

## 🎨 Art Styles (8 total)
Cyberpunk, Watercolor, Pixel Art, Anime, Oil Painting, 3D Render, Pencil Sketch, Pop Art

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your-key
REPLICATE_API_TOKEN=your-token  # Configured but unused
STORAGE_TYPE=local
STORAGE_BASE_URL=http://localhost:3000
LOG_LEVEL=info
```

## 🚀 Quick Start

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

## ❌ Missing Features (Priority Order)

### Critical (MVP)
1. **Single-User Simplification** - Remove userId complexity
2. **Avatar Creation UI** (`/avatars/create`)
3. **Trait Generation System** - Trait configuration and generation
4. **Drop Variation Generation** - Replicate integration for variations

### Important
5. **Collection System** - Organize avatars/drops into collections
6. **Tagging & Metadata** - Tags, favorites, ratings, notes
7. **Enhanced Gallery** - Search, filters, multiple view modes
8. **Generation Progress** - Real-time progress tracking

### Nice to Have
9. **Statistics Dashboard** - Collection insights
10. **Batch Operations** - Bulk actions
11. **Cloud Storage** - Replace data URLs
12. **Export/Import** - Collection backup

## 📝 Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Simplify to single-user (remove userId)
2. Add collection system to database
3. Create collection service & API

### Phase 2: Avatar Enhancement (Week 2-3)
4. Create avatar generation UI
5. Add batch generation
6. Add metadata management

### Phase 3: Drop Generation (Week 3-5)
7. Build trait system
8. Integrate Replicate API
9. Create variation generation pipeline
10. Enhance drop creation UI

### Phase 4: Collection Management (Week 5-6)
11. Build collection UI
12. Add search & filtering
13. Add statistics

### Phase 5: Polish (Week 7-8)
14. Performance optimization
15. Error handling
16. UI/UX refinements

**See IMPLEMENTATION_PLAN.md for detailed tasks**

## 🔍 Code Quality

- ✅ TypeScript throughout
- ✅ Error handling
- ✅ Logging
- ✅ Database indexes
- ⚠️ No tests
- ⚠️ No request validation middleware
- ⚠️ Synchronous processing

## 📦 Dependencies

- Next.js 15.1.0
- Prisma 6.19.0
- @google/genai 1.30.0
- replicate 0.34.1 (installed but unused)
- Tailwind CSS 4.1.17

---

*See INVESTIGATION_REPORT.md for detailed analysis*

