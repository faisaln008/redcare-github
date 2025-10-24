import { ScoringService } from '../scoring.service';
import { GitHubRepository } from '../../types/github.types';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
  });

  describe('calculatePopularityScore', () => {
    it('should calculate score for a popular repository', () => {
      const repo: GitHubRepository = {
        id: 1,
        node_id: 'MDEwOlJlcG9zaXRvcnkx',
        name: 'popular-repo',
        full_name: 'owner/popular-repo',
        owner: {
          login: 'owner',
          id: 1,
          avatar_url: 'https://example.com/avatar.jpg',
          url: 'https://api.github.com/users/owner',
          type: 'User',
        },
        html_url: 'https://github.com/owner/popular-repo',
        description: 'A popular repository',
        fork: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: new Date().toISOString(), // Recently updated
        pushed_at: new Date().toISOString(),
        size: 1000,
        stargazers_count: 10000,
        watchers_count: 1000,
        language: 'TypeScript',
        forks_count: 500,
        open_issues_count: 10,
        default_branch: 'main',
        score: 1,
      };

      const score = scoringService.calculatePopularityScore(repo);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
      expect(typeof score).toBe('number');
    });

    it('should give higher score to repositories with more stars', () => {
      const repo1: GitHubRepository = createMockRepo(1000, 100);
      const repo2: GitHubRepository = createMockRepo(10000, 100);

      const score1 = scoringService.calculatePopularityScore(repo1);
      const score2 = scoringService.calculatePopularityScore(repo2);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should give higher score to repositories with more forks', () => {
      const repo1: GitHubRepository = createMockRepo(1000, 50);
      const repo2: GitHubRepository = createMockRepo(1000, 500);

      const score1 = scoringService.calculatePopularityScore(repo1);
      const score2 = scoringService.calculatePopularityScore(repo2);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should give higher score to recently updated repositories', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

      const repo1: GitHubRepository = createMockRepo(1000, 100, oldDate.toISOString());
      const repo2: GitHubRepository = createMockRepo(1000, 100, now.toISOString());

      const score1 = scoringService.calculatePopularityScore(repo1);
      const score2 = scoringService.calculatePopularityScore(repo2);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should handle repositories with zero stars and forks', () => {
      const repo: GitHubRepository = createMockRepo(0, 0);
      const score = scoringService.calculatePopularityScore(repo);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should return a score between 0 and 10', () => {
      const testCases = [
        createMockRepo(0, 0),
        createMockRepo(10, 5),
        createMockRepo(1000, 100),
        createMockRepo(10000, 1000),
        createMockRepo(100000, 10000),
      ];

      testCases.forEach((repo) => {
        const score = scoringService.calculatePopularityScore(repo);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('transformRepository', () => {
    it('should transform GitHub repository to application format', () => {
      const githubRepo: GitHubRepository = createMockRepo(1000, 100);
      const transformed = scoringService.transformRepository(githubRepo);

      expect(transformed).toHaveProperty('id');
      expect(transformed).toHaveProperty('name');
      expect(transformed).toHaveProperty('full_name');
      expect(transformed).toHaveProperty('owner');
      expect(transformed).toHaveProperty('stars');
      expect(transformed).toHaveProperty('forks');
      expect(transformed).toHaveProperty('popularity_score');
      expect(transformed.stars).toBe(1000);
      expect(transformed.forks).toBe(100);
    });

    it('should include popularity score in transformed repository', () => {
      const githubRepo: GitHubRepository = createMockRepo(1000, 100);
      const transformed = scoringService.transformRepository(githubRepo);

      expect(transformed.popularity_score).toBeGreaterThan(0);
      expect(typeof transformed.popularity_score).toBe('number');
    });
  });

  describe('sortByPopularityScore', () => {
    it('should sort repositories by score in descending order', () => {
      const repos = [
        { ...createMockRepoWithScore(1000, 100), popularity_score: 5.5 },
        { ...createMockRepoWithScore(10000, 1000), popularity_score: 7.5 },
        { ...createMockRepoWithScore(500, 50), popularity_score: 4.0 },
      ];

      const sorted = scoringService.sortByPopularityScore(repos as any, 'desc');

      expect(sorted[0].popularity_score).toBe(7.5);
      expect(sorted[1].popularity_score).toBe(5.5);
      expect(sorted[2].popularity_score).toBe(4.0);
    });

    it('should sort repositories by score in ascending order', () => {
      const repos = [
        { ...createMockRepoWithScore(1000, 100), popularity_score: 5.5 },
        { ...createMockRepoWithScore(10000, 1000), popularity_score: 7.5 },
        { ...createMockRepoWithScore(500, 50), popularity_score: 4.0 },
      ];

      const sorted = scoringService.sortByPopularityScore(repos as any, 'asc');

      expect(sorted[0].popularity_score).toBe(4.0);
      expect(sorted[1].popularity_score).toBe(5.5);
      expect(sorted[2].popularity_score).toBe(7.5);
    });
  });
});

/**
 * Test Helper Functions
 */

function createMockRepo(
  stars: number,
  forks: number,
  updatedAt?: string
): GitHubRepository {
  return {
    id: Math.floor(Math.random() * 1000000),
    node_id: `MDEwOlJlcG9zaXRvcnk${Math.random()}`,
    name: 'test-repo',
    full_name: 'owner/test-repo',
    owner: {
      login: 'owner',
      id: 1,
      avatar_url: 'https://example.com/avatar.jpg',
      url: 'https://api.github.com/users/owner',
      type: 'User',
    },
    html_url: 'https://github.com/owner/test-repo',
    description: 'Test repository',
    fork: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: updatedAt || new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    size: 1000,
    stargazers_count: stars,
    watchers_count: stars,
    language: 'TypeScript',
    forks_count: forks,
    open_issues_count: 10,
    default_branch: 'main',
    score: 1,
  };
}

function createMockRepoWithScore(stars: number, forks: number) {
  return {
    id: Math.floor(Math.random() * 1000000),
    name: 'test-repo',
    full_name: 'owner/test-repo',
    owner: {
      login: 'owner',
      avatar_url: 'https://example.com/avatar.jpg',
      type: 'User',
    },
    description: 'Test repository',
    html_url: 'https://github.com/owner/test-repo',
    language: 'TypeScript',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    stars,
    forks,
    open_issues: 10,
  };
}

