/**
 * Drop Generation Worker
 * Processes drop variation generation jobs from the queue
 */

import { QueueName, queueService, DropGenerationJobData } from '../queueService';
import { prisma } from '../../database/prisma';
import logger from '../../../shared/utils/logger';

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

      // Create the generated avatar record
      // Note: For now, we use the base avatar image
      // Future: Generate actual variation using Replicate/Gemini with trait-based prompts
      await prisma.dropGeneratedAvatar.create({
        data: {
          listingId: dropId,
          tokenNumber,
          traits: traits as any,
          rarity: currentRarity,
          rarityScore: rarityScore,
          avatarImageUrl: baseAvatar.outputImageUrl, // Using base for now
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

