/**
 * pg-boss Queue Service
 * Manages job queues for avatar generation and drop processing
 */

import * as PgBossModule from 'pg-boss';
import { config } from '../config';
import logger from '../../shared/utils/logger';

// pg-boss exports an object with PgBoss as a named export
const PgBoss = PgBossModule.PgBoss;

export interface AvatarGenerationJobData {
  requestId: string;
  imageBase64: string;
  stylePrompt: string;
  userId: string;
  inputImageUrl?: string;
  inputImageFileId?: string;
}

export interface DropGenerationJobData {
  dropId: string;
  baseAvatarId: string;
  stockLimit: number;
  traitConfig?: any;
}

export type JobData = AvatarGenerationJobData | DropGenerationJobData;

export enum QueueName {
  AVATAR_GENERATION = 'avatar-generation',
  DROP_GENERATION = 'drop-generation',
}

class QueueService {
  private boss: any = null;
  private initialized = false;

  /**
   * Initialize pg-boss with database connection
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.boss) {
      logger.info('Queue service already initialized');
      return;
    }

    try {
      if (!config.database.url) {
        throw new Error('DATABASE_URL is required for queue service');
      }

      // Create pg-boss instance
      // PgBoss is a constructor class
      this.boss = new PgBoss({
        connectionString: config.database.url,
        // Schema for pg-boss tables
        schema: 'pgboss',
      });

      // Set up event handlers
      if (this.boss) {
        this.boss.on('error', (error: Error) => {
          logger.error('Queue error', { error: error.message });
        });

      // Only log monitor states in development for personal software
      // Note: monitor-states event may not be available in all pg-boss versions
      if (process.env.NODE_ENV === 'development' && typeof this.boss.on === 'function') {
        try {
          this.boss.on('monitor-states', (states: any) => {
            logger.debug('Queue monitor states', { states });
          });
        } catch {
          // Event not available, skip
        }
      }

        // Start the boss
        await this.boss.start();

        // Create queues if they don't exist with queue-specific options
        // Optimized for single-user personal software: lower concurrency to save resources
        if (this.boss) {
          const queueOptions = {
            // Job expiration (23 hours 59 minutes = 86340 seconds - slightly under 24 hour limit)
            expireInSeconds: 23 * 60 * 60 + 59 * 60,
            // Delete completed jobs after 3 days (259200 seconds)
            deleteAfterSeconds: 72 * 60 * 60,
            // Retry configuration
            retryLimit: 3,
            retryDelay: 5000, // 5 seconds
            retryBackoff: true,
          };
          await this.boss.createQueue(QueueName.AVATAR_GENERATION, queueOptions);
          await this.boss.createQueue(QueueName.DROP_GENERATION, queueOptions);
        }
      }

      this.initialized = true;
      logger.info('Queue service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize queue service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get the pg-boss instance
   */
  getBoss(): any {
    if (!this.boss || !this.initialized) {
      throw new Error('Queue service not initialized. Call initialize() first.');
    }
    return this.boss;
  }

  /**
   * Enqueue an avatar generation job
   */
  async enqueueAvatarGeneration(data: AvatarGenerationJobData): Promise<string> {
    const boss = this.getBoss();
    
    const jobId = await boss.send(QueueName.AVATAR_GENERATION, data, {
      // Job options
      priority: 1,
      startAfter: new Date(), // Start immediately
    });

    if (!jobId) {
      throw new Error('Failed to enqueue avatar generation job');
    }

    logger.info('Avatar generation job enqueued', {
      jobId,
      requestId: data.requestId,
      userId: data.userId,
    });

    return jobId;
  }

  /**
   * Enqueue a drop generation job
   */
  async enqueueDropGeneration(data: DropGenerationJobData): Promise<string> {
    const boss = this.getBoss();
    
    const jobId = await boss.send(QueueName.DROP_GENERATION, data, {
      priority: 1,
      startAfter: new Date(),
    });

    if (!jobId) {
      throw new Error('Failed to enqueue drop generation job');
    }

    logger.info('Drop generation job enqueued', {
      jobId,
      dropId: data.dropId,
    });

    return jobId;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const boss = this.getBoss();
    // pg-boss getJobById might need queue name, try both approaches
    try {
      return await boss.getJobById(jobId);
    } catch {
      // If that fails, try with queue name
      return await boss.getJobById(QueueName.AVATAR_GENERATION, jobId) || 
             await boss.getJobById(QueueName.DROP_GENERATION, jobId);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const boss = this.getBoss();
    await boss.cancel([jobId]);
    logger.info('Job cancelled', { jobId });
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: QueueName): Promise<{ pending: number; active: number; completed: number; failed: number }> {
    const boss = this.getBoss();
    try {
      const queues = await boss.getQueues();
      const queue = queues.find((q: any) => q.name === queueName);
      if (queue && typeof queue === 'object') {
        return {
          pending: (queue as any).pending || 0,
          active: (queue as any).active || 0,
          completed: (queue as any).completed || 0,
          failed: (queue as any).failed || 0,
        };
      }
    } catch (error) {
      logger.warn('Failed to get queue metrics', { queueName, error });
    }
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }

  /**
   * Get comprehensive queue status for monitoring
   */
  async getQueueStatus(): Promise<{
    initialized: boolean;
    queues: {
      [QueueName.AVATAR_GENERATION]: { pending: number; active: number; completed: number; failed: number };
      [QueueName.DROP_GENERATION]: { pending: number; active: number; completed: number; failed: number };
    };
  }> {
    if (!this.initialized || !this.boss) {
      return {
        initialized: false,
        queues: {
          [QueueName.AVATAR_GENERATION]: { pending: 0, active: 0, completed: 0, failed: 0 },
          [QueueName.DROP_GENERATION]: { pending: 0, active: 0, completed: 0, failed: 0 },
        },
      };
    }

    try {
      const queues = await this.boss.getQueues();
      const avatarQueue = queues.find((q: any) => q.name === QueueName.AVATAR_GENERATION);
      const dropQueue = queues.find((q: any) => q.name === QueueName.DROP_GENERATION);
      
      const getMetrics = (queue: any) => ({
        pending: queue?.pending || 0,
        active: queue?.active || 0,
        completed: queue?.completed || 0,
        failed: queue?.failed || 0,
      });

      return {
        initialized: true,
        queues: {
          [QueueName.AVATAR_GENERATION]: getMetrics(avatarQueue),
          [QueueName.DROP_GENERATION]: getMetrics(dropQueue),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get queue status', { error: error.message });
      return {
        initialized: true,
        queues: {
          [QueueName.AVATAR_GENERATION]: { pending: 0, active: 0, completed: 0, failed: 0 },
          [QueueName.DROP_GENERATION]: { pending: 0, active: 0, completed: 0, failed: 0 },
        },
      };
    }
  }

  /**
   * Shutdown the queue service
   */
  async shutdown(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
      this.initialized = false;
      logger.info('Queue service shut down');
    }
  }

  /**
   * Check if queue service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.boss !== null;
  }
}

// Singleton instance
export const queueService = new QueueService();

