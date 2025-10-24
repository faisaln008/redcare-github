import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // GitHub API configuration
  github: {
    apiUrl: 'https://api.github.com',
    token: process.env.GITHUB_TOKEN || '',
    // Rate limits: authenticated (30/min), unauthenticated (10/min)
    rateLimit: {
      searchPerMinute: process.env.GITHUB_TOKEN ? 30 : 10,
    },
  },

  // Scoring weights configuration
  scoring: {
    weights: {
      stars: parseFloat(process.env.SCORE_WEIGHT_STARS || '0.4'),
      forks: parseFloat(process.env.SCORE_WEIGHT_FORKS || '0.3'),
      recency: parseFloat(process.env.SCORE_WEIGHT_RECENCY || '0.3'),
    },
    // Decay factor for recency calculation (days)
    recencyDecayDays: 365,
  },

  // Cache configuration
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
  },

  // API defaults
  api: {
    defaultPerPage: 30,
    maxPerPage: 100,
  },
};

export default config;

