/**
 * Drop Generation Worker
 * Processes drop variation generation jobs from the queue
 */

import { QueueName, queueService, DropGenerationJobData } from '../queueService';
import { prisma } from '../../database/prisma';
import logger from '../../../shared/utils/logger';
import { ReplicateService } from '../../../domains/gemini/services/replicateService';
import { StorageService } from '../../storage/storageService';

/**
 * Process a drop generation job
 * This will generate variations for a drop based on trait configuration
 */
export async function processDropGenerationJob(
  job: { id: string; data: DropGenerationJobData }
): Promise<void> {
  const { id: jobId, data } = job;
  const { dropId, baseAvatarId, stockLimit, traitConfig } = data;

  logger.info('Starting drop generation', {
    dropId,
    stockLimit,
  });

  try {
    // Update drop status to generating
    await prisma.dropListing.update({
      where: { id: dropId },
      data: {
        generationStatus: 'generating',
        generationProgress: 0,
      },
    });

    // Get the base avatar
    const baseAvatar = await prisma.avatarForgeRequest.findUnique({
      where: { id: baseAvatarId },
    });

    if (!baseAvatar || !baseAvatar.outputImageUrl) {
      throw new Error('Base avatar not found or not completed');
    }

    // Generate variations for the drop
    // For now, we create database records with the base avatar image
    // Future enhancement: Use Replicate/Gemini to generate actual variations with traits
    
    const variationsToGenerate = Math.min(stockLimit, 50); // Limit to 50 for now
    
    // Basic trait categories for variation (can be enhanced with traitConfig)
    const traitCategories = traitConfig?.categories || [
      { name: 'Background', values: ['Solid', 'Gradient', 'Pattern', 'Abstract'] },
      { name: 'Effect', values: ['None', 'Glow', 'Shadow', 'Sparkle'] },
      { name: 'Frame', values: ['None', 'Circle', 'Square', 'Hexagon'] },
    ];

    // Calculate rarity distribution
    const rarityDistribution = {
      common: Math.floor(variationsToGenerate * 0.5),
      uncommon: Math.floor(variationsToGenerate * 0.3),
      rare: Math.floor(variationsToGenerate * 0.15),
      epic: Math.floor(variationsToGenerate * 0.04),
      legendary: Math.max(1, variationsToGenerate - Math.floor(variationsToGenerate * 0.99)),
    };

    const rarities: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = [
      'common', 'uncommon', 'rare', 'epic', 'legendary'
    ];

    let rarityIndex = 0;
    let rarityCount = 0;
    const currentRarity = rarities[rarityIndex];
    const maxForRarity = rarityDistribution[currentRarity];

    // Generate each variation
    for (let tokenNumber = 1; tokenNumber <= variationsToGenerate; tokenNumber++) {
      // Determine rarity for this token
      if (rarityCount >= maxForRarity && rarityIndex < rarities.length - 1) {
        rarityIndex++;
        rarityCount = 0;
      }
      const currentRarity = rarities[rarityIndex];
      rarityCount++;

      // Generate random traits for this variation
      const traits = traitCategories.map((category: any) => {
        const randomValue = category.values[Math.floor(Math.random() * category.values.length)];
        return {
          trait_type: category.name,
          value: randomValue,
        };
      });

      // Calculate rarity score (simplified - can be enhanced)
      const rarityScore = {
        common: 0.1,
        uncommon: 0.3,
        rare: 0.6,
        epic: 0.85,
        legendary: 0.99,
      }[currentRarity];

      // Generate variation image using Replicate if available, otherwise use base avatar
      let variationImageUrl = baseAvatar.outputImageUrl;
      
      if (ReplicateService.isAvailable()) {
        try {
          // Build prompt from traits
          const traitDescription = traits
            .map((t: any) => `${t.trait_type}: ${t.value}`)
            .join(', ');
          
          const prompt = `Transform this avatar with the following traits: ${traitDescription}. 
            Maintain the core identity and style of the base avatar while applying these variations.
            Create a unique variation that reflects ${currentRarity} rarity level.
            Style: ${baseAvatar.stylePrompt || 'avatar style'}`;

          // Generate image with Replicate
          const result = await ReplicateService.generateImage({
            prompt,
            imageInput: baseAvatar.outputImageUrl ? [baseAvatar.outputImageUrl] : undefined,
            resolution: '2K',
            aspectRatio: '1:1',
            outputFormat: 'jpg',
          });

          // Download and store the generated image
          if (result.url) {
            try {
              // Fetch the image from Replicate URL
              const imageResponse = await fetch(result.url);
              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString('base64');
                const dataUrl = `data:image/jpeg;base64,${base64Image}`;
                
                // Upload to storage
                const upload = await StorageService.uploadImageFromDataUrl(dataUrl, {
                  userId: 'single-user',
                  avatarForgeType: 'output',
                });
                
                variationImageUrl = upload.url;
                
                logger.info('Variation image generated and stored', {
                  tokenNumber,
                  rarity: currentRarity,
                });
              } else {
                logger.warn('Failed to fetch generated image from Replicate', {
                  tokenNumber,
                  status: imageResponse.status,
                });
                // Fall back to base avatar
              }
            } catch (storageError: any) {
              logger.warn('Failed to store generated variation image', {
                tokenNumber,
                error: storageError.message,
              });
              // Fall back to base avatar
            }
          }
        } catch (replicateError: any) {
          logger.warn('Replicate generation failed, using base avatar', {
            tokenNumber,
            error: replicateError.message,
          });
          // Fall back to base avatar image
        }
      }

      // Create the generated avatar record
      await prisma.dropGeneratedAvatar.create({
        data: {
          listingId: dropId,
          tokenNumber,
          traits: traits as any,
          rarity: currentRarity,
          rarityScore: rarityScore,
          avatarImageUrl: variationImageUrl,
        },
      });

      // Update progress
      const progress = Math.floor((tokenNumber / variationsToGenerate) * 100);
      await prisma.dropListing.update({
        where: { id: dropId },
        data: {
          generationProgress: progress,
        },
      });
    }

    // Mark as completed
    await prisma.dropListing.update({
      where: { id: dropId },
      data: {
        generationStatus: 'completed',
        generationProgress: 100,
      },
    });

    logger.info('Drop generation completed', {
      dropId,
    });
  } catch (error: any) {
    logger.error('Drop generation job failed', {
      jobId,
      dropId,
      error: error.message,
    });

    // Update drop status to failed
    try {
      await prisma.dropListing.update({
        where: { id: dropId },
        data: {
          generationStatus: 'failed',
        },
      });
    } catch (updateError: any) {
      logger.error('Failed to update drop status', {
        dropId,
        error: updateError.message,
      });
    }

    // Re-throw to mark job as failed in pg-boss
    throw error;
  }
}

/**
 * Start the drop generation worker
 */
export async function startDropGenerationWorker(): Promise<void> {
  const boss = queueService.getBoss();

  await boss.work(QueueName.DROP_GENERATION, {
    teamSize: 1,
    teamConcurrency: 1,
  }, async (job: { id: string; data: DropGenerationJobData } | null) => {
    if (!job) {
      return;
    }

    try {
      await processDropGenerationJob({
        id: job.id,
        data: job.data,
      });
    } catch (error: any) {
      logger.error('Error processing drop generation job', {
        jobId: job.id,
        error: error.message,
      });
      throw error; // Let pg-boss handle retries
    }
  });

  logger.info('Drop generation worker started');
}

