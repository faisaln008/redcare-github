/**
 * Integration Tests
 * 
 * These tests require network access to GitHub API
 * Run with: npm test
 * 
 * Note: These tests may fail if GitHub API is down or rate limited
 * 
 * Delays are added between API calls to respect GitHub rate limits
 */

import request from 'supertest';
import app from '../server';

// Helper to avoid rate limiting during tests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 1000; // 1 second between API calls

describe('API Integration Tests', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('search');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /api/rate-limit', () => {
    it('should return GitHub rate limit status', async () => {
      const response = await request(app).get('/api/rate-limit');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
    });
  });

  describe('GET /api/repositories/search', () => {
    it('should search repositories without filters', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app).get('/api/repositories/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_count');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('per_page');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should search repositories with language filter', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ language: 'typescript' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      
      if (response.body.items.length > 0) {
        // Check if returned items have the expected structure
        const item = response.body.items[0];
        expect(item).toHaveProperty('popularity_score');
        expect(item).toHaveProperty('stars');
        expect(item).toHaveProperty('forks');
      }
    });

    it('should search repositories with created date filter', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ 
          language: 'typescript',
          createdAfter: '2024-01-01'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should return validation error for invalid sort parameter', async () => {
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ sort: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    it('should return validation error for invalid date format', async () => {
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ createdAfter: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return validation error for page out of range', async () => {
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ page: 101 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should support pagination with correct metadata', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ 
          language: 'typescript',
          page: 1,
          perPage: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.per_page).toBe(10);
      expect(response.body.items.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('total_count');
    });

    it('should return different results for different pages', async () => {
      await delay(RATE_LIMIT_DELAY);
      const page1 = await request(app)
        .get('/api/repositories/search')
        .query({ 
          language: 'typescript',
          page: 1,
          perPage: 5
        });

      await delay(RATE_LIMIT_DELAY);
      const page2 = await request(app)
        .get('/api/repositories/search')
        .query({ 
          language: 'typescript',
          page: 2,
          perPage: 5
        });

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      
      // Both should have items
      expect(page1.body.items.length).toBeGreaterThan(0);
      expect(page2.body.items.length).toBeGreaterThan(0);
      
      // Pages should return different results
      const page1Ids = page1.body.items.map((item: any) => item.id);
      const page2Ids = page2.body.items.map((item: any) => item.id);
      
      // At least one ID should be different (no overlap for different pages)
      const hasOverlap = page1Ids.some((id: number) => page2Ids.includes(id));
      expect(hasOverlap).toBe(false);
    });

    it('should respect perPage parameter', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ 
          language: 'python',
          page: 1,
          perPage: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(5);
      expect(response.body.per_page).toBe(5);
    });

    it('should include popularity scores in results', async () => {
      await delay(RATE_LIMIT_DELAY);
      const response = await request(app)
        .get('/api/repositories/search')
        .query({ language: 'typescript' });

      expect(response.status).toBe(200);
      
      if (response.body.items.length > 0) {
        response.body.items.forEach((item: any) => {
          expect(item).toHaveProperty('popularity_score');
          expect(typeof item.popularity_score).toBe('number');
          expect(item.popularity_score).toBeGreaterThanOrEqual(0);
          expect(item.popularity_score).toBeLessThanOrEqual(10);
        });
      }
    });
  });

  describe('GET /api/non-existent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NotFound');
    });
  });
});

