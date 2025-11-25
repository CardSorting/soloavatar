/**
 * Configuration management
 * Reads from environment variables
 */

export const config = {
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  
  database: {
    url: process.env.DATABASE_URL || '',
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
    // For simplicity, we'll use data URLs or a simple file storage
    // In production, you'd want to use cloud storage (S3, Backblaze, etc.)
    type: process.env.STORAGE_TYPE || 'local', // 'local' | 'cloud'
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000',
  },
};

