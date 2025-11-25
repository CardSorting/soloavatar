# Replicate Integration - Drop Variation Generation

## Overview

The Replicate API has been integrated into the drop variation generation system. This allows the system to generate actual unique avatar variations based on traits, rather than just using the base avatar image.

## Implementation

### 1. Replicate Service (`src/lib/server/domains/gemini/services/replicateService.ts`)

A service wrapper for the Replicate API that handles:
- Client initialization with API token
- Image generation using the `google/nano-banana-pro` model
- Input validation and error handling
- Timeout protection (2 minutes default)
- Multiple output format handling

**Key Features:**
- Supports prompt-based generation
- Can use input images as reference (up to 14 images)
- Configurable resolution (1K, 2K, 4K)
- Configurable aspect ratio and output format
- Safety filter levels

### 2. Drop Generation Worker Integration

The drop generation worker (`src/lib/server/infrastructure/queue/workers/dropGenerationWorker.ts`) has been updated to:
- Use Replicate service when available
- Generate unique variations based on traits
- Fall back to base avatar if Replicate fails or is unavailable
- Store generated images in storage service
- Track generation progress

**Generation Process:**
1. Generate trait combinations for each variation
2. Build prompt from traits and rarity level
3. Call Replicate API with base avatar as input image
4. Download generated image from Replicate
5. Upload to local storage
6. Store variation record in database

## Configuration

### Environment Variables

```env
REPLICATE_API_TOKEN=your-replicate-api-token
```

The service automatically checks if Replicate is enabled and configured. If not available, it gracefully falls back to using the base avatar image.

### Model Used

- **Model**: `google/nano-banana-pro`
- **Default Resolution**: 2K
- **Default Format**: JPG
- **Default Aspect Ratio**: Match input image (1:1 for avatars)
- **Safety Filter**: `block_only_high` (most permissive)

## API Schema

### Input Schema

```typescript
{
  prompt: string;                    // Required: Text description
  imageInput?: string[];              // Optional: Base64 or URLs (max 14)
  resolution?: '1K' | '2K' | '4K';   // Default: '2K'
  aspectRatio?: string;               // Default: 'match_input_image'
  outputFormat?: 'jpg' | 'png';       // Default: 'jpg'
  safetyFilterLevel?: string;         // Default: 'block_only_high'
}
```

### Output Schema

```typescript
{
  url: string;  // URL to generated image
}
```

## Usage Example

```typescript
import { ReplicateService } from '@/lib/server/domains/gemini/services/replicateService';

// Generate variation with traits
const result = await ReplicateService.generateImage({
  prompt: 'Transform this avatar with Background: Gradient, Effect: Glow, Frame: Circle. Create a rare rarity variation.',
  imageInput: [baseAvatarUrl],
  resolution: '2K',
  aspectRatio: '1:1',
  outputFormat: 'jpg',
});

// result.url contains the generated image URL
```

## Error Handling

The service includes comprehensive error handling:
- **Timeout Protection**: 2-minute timeout to prevent hanging
- **Graceful Fallback**: If Replicate fails, uses base avatar
- **Logging**: All errors are logged for debugging
- **Validation**: Input validation before API calls

## Integration Points

### Drop Generation Worker

The worker automatically:
1. Checks if Replicate is available
2. Generates trait-based prompts
3. Calls Replicate for each variation
4. Stores generated images
5. Falls back gracefully if needed

### Storage Service

Generated images are:
1. Downloaded from Replicate URL
2. Converted to base64 data URL
3. Uploaded via StorageService
4. Stored in `data/storage/avatars/output/`
5. URL stored in database

## Trait-Based Prompt Generation

The system builds prompts from traits:

```
Transform this avatar with the following traits: Background: Gradient, Effect: Glow, Frame: Circle. 
Maintain the core identity and style of the base avatar while applying these variations.
Create a unique variation that reflects rare rarity level.
Style: [base avatar style prompt]
```

## Rarity Levels

The system generates variations with different rarity levels:
- **Common** (50%): Basic variations
- **Uncommon** (30%): Slightly unique
- **Rare** (15%): More distinctive
- **Epic** (4%): Very unique
- **Legendary** (1%): Most unique

Rarity affects the prompt to encourage more unique variations for higher rarities.

## Performance Considerations

- **Generation Time**: Each variation takes ~10-30 seconds
- **Rate Limits**: Replicate has rate limits (check your plan)
- **Batch Processing**: Variations are generated sequentially
- **Progress Tracking**: Real-time progress updates in database

## Testing

To test the integration:

1. Set `REPLICATE_API_TOKEN` in `.env`
2. Create a drop with trait configuration
3. Monitor generation progress via `/api/drops/[id]/generation-status`
4. Check generated variations via `/api/drops/[id]/variations`

## Troubleshooting

### Replicate Not Generating Images

1. Check API token is set correctly
2. Verify token has sufficient credits
3. Check logs for specific error messages
4. Ensure base avatar image is accessible

### Slow Generation

1. Reduce number of variations
2. Use lower resolution (1K instead of 2K)
3. Check Replicate API status
4. Consider batch processing optimization

### Fallback to Base Avatar

If all variations use base avatar:
- Replicate may be disabled or misconfigured
- Check `REPLICATE_API_TOKEN` environment variable
- Review logs for error messages
- System will continue working with base avatars

## Future Enhancements

Potential improvements:
1. **Parallel Generation**: Generate multiple variations simultaneously
2. **Caching**: Cache generated variations for similar traits
3. **Custom Models**: Support for different Replicate models
4. **Advanced Traits**: More sophisticated trait-to-prompt mapping
5. **Quality Control**: Validation of generated images before storage

---

*Last Updated: After Replicate integration implementation*

