/**
 * pg-boss Queue Service
 * Manages job queues for avatar generation and drop processing
 */

import PgBoss from 'pg-boss';
import { config } from '../config';
import logger from '../../shared/utils/logger';

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
  private boss: PgBoss | null = null;
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
      this.boss = new PgBoss({
        connectionString: config.database.url,
        // Queue configuration
        retryLimit: 3,
        retryDelay: 5000, // 5 seconds
        retryBackoff: true,
        // Job expiration (24 hours)
        expireInHours: 24,
        // Delete completed jobs after 7 days
        deleteAfterHours: 168,
        // Schema for pg-boss tables
        schema: 'pgboss',
      });

      // Set up event handlers
      this.boss.on('error', (error) => {
        logger.error('pg-boss error', { error: error.message });
      });

      this.boss.on('monitor-states', (states) => {
        logger.debug('pg-boss monitor states', { states });
      });

      // Start the boss
      await this.boss.start();

      // Create queues if they don't exist
      await this.boss.createQueue(QueueName.AVATAR_GENERATION, {
        // Process up to 2 avatar generations concurrently
        teamSize: 2,
        teamConcurrency: 2,
      });

      await this.boss.createQueue(QueueName.DROP_GENERATION, {
        // Process up to 1 drop generation at a time (more resource intensive)
        teamSize: 1,
        teamConcurrency: 1,
      });

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
  getBoss(): PgBoss {
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
    return await boss.getJobById(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const boss = this.getBoss();
    await boss.cancel(jobId);
    logger.info('Job cancelled', { jobId });
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: QueueName): Promise<any> {
    const boss = this.getBoss();
    return await boss.getQueueSize(queueName);
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

