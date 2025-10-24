import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';
import { GitHubSearchResponse, SearchQuery, SearchResult } from '../types/github.types';
import { GitHubAPIError, RateLimitError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { scoringService } from './scoring.service';

/**
 * GitHub API Service
 * Handles interaction with GitHub's REST API
 */

export class GitHubService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = config.github.apiUrl;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(config.github.token && {
          Authorization: `Bearer ${config.github.token}`,
        }),
      },
      timeout: 10000, // 10 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleAPIError(error)
    );
  }

  /**
   * Search repositories with filters and return scored results
   */
  async searchRepositories(query: SearchQuery): Promise<SearchResult> {
    try {
      // Build GitHub API query string
      const q = this.buildQueryString(query);
      
      // Prepare request parameters
      const params = {
        q,
        sort: this.mapSortParameter(query.sort),
        order: query.order || 'desc',
        per_page: query.perPage || config.api.defaultPerPage,
        page: query.page || 1,
      };

      logger.info('Searching GitHub repositories', { params });

      // Make API request
      const response = await this.client.get<GitHubSearchResponse>('/search/repositories', {
        params,
      });

      logger.info('GitHub API response received', {
        total_count: response.data.total_count,
        items_count: response.data.items.length,
        incomplete_results: response.data.incomplete_results,
      });

      // Transform repositories with popularity scores
      let scoredItems = scoringService.transformRepositories(response.data.items);

      // If sorting by our custom score, sort by popularity
      if (query.sort === 'score') {
        scoredItems = scoringService.sortByPopularityScore(scoredItems, query.order || 'desc');
      }

      return {
        total_count: response.data.total_count,
        incomplete_results: response.data.incomplete_results,
        items: scoredItems,
        page: params.page,
        per_page: params.per_page,
      };
    } catch (error) {
      logger.error('Error searching repositories', { error });
      throw error;
    }
  }

  /**
   * Build GitHub search query string from filters
   * Sanitizes inputs to prevent injection attacks
   */
  private buildQueryString(query: SearchQuery): string {
    const parts: string[] = [];

    // Add language filter with sanitization
    if (query.language) {
      const sanitizedLanguage = this.sanitizeInput(query.language);
      parts.push(`language:${sanitizedLanguage}`);
    }

    // Add created date filter
    if (query.createdAfter) {
      const date = new Date(query.createdAfter);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid date format for createdAfter. Use ISO 8601 format (YYYY-MM-DD)');
      }
      const formattedDate = date.toISOString().split('T')[0];
      parts.push(`created:>=${formattedDate}`);
    }

    // If no specific query parts, search for all repositories (with stars to get meaningful results)
    if (parts.length === 0) {
      parts.push('stars:>0');
    }

    const queryString = parts.join(' ');
    logger.debug('Built GitHub query string', { queryString });
    
    return queryString;
  }

  /**
   * Map our sort parameter to GitHub's sort parameter
   */
  private mapSortParameter(sort?: string): string | undefined {
    if (!sort) return undefined;
    
    // Our custom 'score' sorting will be handled after fetching results
    if (sort === 'score') {
      // Use GitHub's default best match
      return undefined;
    }

    // Map other sort options
    const sortMap: Record<string, string> = {
      stars: 'stars',
      forks: 'forks',
      updated: 'updated',
    };

    return sortMap[sort];
  }

  /**
   * Handle GitHub API errors with proper typing
   */
  private handleAPIError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string; errors?: unknown };

      // Rate limit exceeded
      if (status === 403 && data.message?.includes('rate limit')) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        throw new RateLimitError(
          'GitHub API rate limit exceeded. Please try again later.',
          resetTime ? parseInt(resetTime) : undefined
        );
      }

      // Validation failed
      if (status === 422) {
        throw new ValidationError(
          data.message || 'Validation failed',
          data.errors
        );
      }

      // Service unavailable
      if (status === 503) {
        throw new GitHubAPIError('GitHub API is temporarily unavailable', 503);
      }

      // Generic GitHub API error
      throw new GitHubAPIError(
        data.message || 'GitHub API request failed',
        status,
        data
      );
    }

    // Network or timeout error
    if (error.request) {
      throw new GitHubAPIError('Unable to reach GitHub API. Please check your network connection.', 503);
    }

    // Unknown error
    throw new GitHubAPIError('An unexpected error occurred', 500);
  }

  /**
   * Sanitize user input to prevent injection attacks
   * Critical for security in API interactions
   */
  private sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    // Allow alphanumeric, spaces, hyphens, underscores, plus, hash, dot
    return input.replace(/[^a-zA-Z0-9\s\-_+#.]/g, '');
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus() {
    try {
      const response = await this.client.get('/rate_limit');
      return response.data;
    } catch (error) {
      logger.error('Error fetching rate limit status', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();

