/**
 * Configuration management
 * Reads from environment variables
 */

// Single-user constants - no authentication needed
export const USER_CONSTANTS = {
  DEFAULT_USER_ID: 'single-user', // Used when userId is not provided
  ANONYMOUS_USER_ID: 'anon-user', // Used for optional endpoints
} as const;

// Application constants
export const APP_CONSTANTS = {
  MAX_TAGS_PER_AVATAR: 10,
  MAX_COLLECTION_NAME_LENGTH: 255,
  MAX_AVATAR_NOTES_LENGTH: 1000,
  DEFAULT_AVATAR_LIMIT: 50,
  MAX_BULK_UPDATE_SIZE: 100,
  GENERATION_TIMEOUT_MS: 120000, // 2 minutes
} as const;

export const config = {
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

  database: {
    url: process.env.DATABASE_URL || '',
    // Enhanced Postgres settings for better performance
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    queryTimeoutMillis: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  },

  gemini: {
    enabled: process.env.GEMINI_API_KEY ? true : false,
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  replicate: {
    enabled: process.env.REPLICATE_API_TOKEN ? true : false,
    apiToken: process.env.REPLICATE_API_TOKEN || '',
  },

  storage: {
    // Enhanced local file storage with robust file management
    type: process.env.STORAGE_TYPE || 'local', // 'local' | 'cloud'
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000',
    baseDir: process.env.STORAGE_BASE_DIR || 'data/storage',
    maxFileSizeMB: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '10'),
    maxTotalStorageGB: parseInt(process.env.STORAGE_MAX_TOTAL_GB || '5'),
    // Cleanup settings
    enableAutoCleanup: process.env.STORAGE_AUTO_CLEANUP !== 'false',
    cleanupOlderThanDays: parseInt(process.env.STORAGE_CLEANUP_DAYS || '30'),
  },

  // Single-user application settings
  user: {
    defaultId: USER_CONSTANTS.DEFAULT_USER_ID,
    allowAnonymous: false, // For future multi-user expansion
  },

  app: {
    maxTagsPerAvatar: APP_CONSTANTS.MAX_TAGS_PER_AVATAR,
    maxCollectionNameLength: APP_CONSTANTS.MAX_COLLECTION_NAME_LENGTH,
    maxAvatarNotesLength: APP_CONSTANTS.MAX_AVATAR_NOTES_LENGTH,
    defaultAvatarLimit: APP_CONSTANTS.DEFAULT_AVATAR_LIMIT,
    maxBulkUpdateSize: APP_CONSTANTS.MAX_BULK_UPDATE_SIZE,
    generationTimeoutMs: APP_CONSTANTS.GENERATION_TIMEOUT_MS,
  },
};
