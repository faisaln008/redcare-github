import config from '../config';
import { GitHubRepository, RepositoryWithScore, ScoringWeights } from '../types/github.types';

/**
 * Scoring Service
 * Calculates popularity scores for GitHub repositories based on:
 * - Stars (weighted)
 * - Forks (weighted)
 * - Recency of updates (weighted)
 */

export class ScoringService {
  private weights: ScoringWeights;
  private recencyDecayDays: number;

  constructor() {
    this.weights = config.scoring.weights;
    this.recencyDecayDays = config.scoring.recencyDecayDays;
  }

  /**
   * Calculate popularity score for a single repository
   * Returns a score between 0-10
   */
  calculatePopularityScore(repo: GitHubRepository): number {
    const starsScore = this.normalizeStars(repo.stargazers_count);
    const forksScore = this.normalizeForks(repo.forks_count);
    const recencyScore = this.calculateRecencyScore(repo.updated_at);

    // Weighted combination
    const score =
      starsScore * this.weights.stars +
      forksScore * this.weights.forks +
      recencyScore * this.weights.recency;

    // Scale to 0-10 and round to 2 decimal places
    return Math.round(score * 10 * 100) / 100;
  }

  /**
   * Normalize stars using logarithmic scale
   * Prevents repositories with huge star counts from dominating
   */
  private normalizeStars(stars: number): number {
    if (stars <= 0) return 0;
    
    // Using log10 scale with a reference of 100,000 stars as "max"
    // A repo with 100k stars gets a score of 1.0
    const maxStarsReference = 100000;
    const normalizedScore = Math.log10(stars + 1) / Math.log10(maxStarsReference + 1);
    
    // Cap at 1.0
    return Math.min(normalizedScore, 1.0);
  }

  /**
   * Normalize forks using logarithmic scale
   * Similar to stars, prevents outliers from dominating
   */
  private normalizeForks(forks: number): number {
    if (forks <= 0) return 0;
    
    // Using log10 scale with a reference of 10,000 forks as "max"
    const maxForksReference = 10000;
    const normalizedScore = Math.log10(forks + 1) / Math.log10(maxForksReference + 1);
    
    // Cap at 1.0
    return Math.min(normalizedScore, 1.0);
  }

  /**
   * Calculate recency score based on last update
   * Uses exponential decay: recent updates score higher
   * 
   * Score calculation:
   * - Updated today: 1.0
   * - Updated 365 days ago: ~0.37 (e^-1)
   * - Updated 730 days ago: ~0.14 (e^-2)
   */
  private calculateRecencyScore(updatedAt: string): number {
    const now = new Date();
    const lastUpdate = new Date(updatedAt);
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay formula: e^(-days/decayDays)
    const recencyScore = Math.exp(-daysSinceUpdate / this.recencyDecayDays);
    
    return Math.max(recencyScore, 0);
  }

  /**
   * Transform GitHub repository to application format with popularity score
   */
  transformRepository(repo: GitHubRepository): RepositoryWithScore {
    const popularityScore = this.calculatePopularityScore(repo);

    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        type: repo.owner.type,
      },
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      topics: repo.topics,
      license: repo.license ? {
        name: repo.license.name,
        spdx_id: repo.license.spdx_id,
      } : undefined,
      popularity_score: popularityScore,
    };
  }

  /**
   * Transform and score multiple repositories
   */
  transformRepositories(repos: GitHubRepository[]): RepositoryWithScore[] {
    return repos.map((repo) => this.transformRepository(repo));
  }

  /**
   * Sort repositories by popularity score
   * Returns a new sorted array without mutating the original
   */
  sortByPopularityScore(
    repos: RepositoryWithScore[],
    order: 'asc' | 'desc' = 'desc'
  ): RepositoryWithScore[] {
    // Create shallow copy to avoid mutation
    return [...repos].sort((a, b) => {
      if (order === 'desc') {
        return b.popularity_score - a.popularity_score;
      }
      return a.popularity_score - b.popularity_score;
    });
  }
}

// Export singleton instance
export const scoringService = new ScoringService();

