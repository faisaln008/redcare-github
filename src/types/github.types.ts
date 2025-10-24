/**
 * GitHub API Response Types
 */

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  score: number;
  topics?: string[];
  license?: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  };
}

export interface GitHubOwner {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  type: string;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

/**
 * Application Types
 */

export interface SearchQuery {
  language?: string;
  createdAfter?: string; // ISO date string
  sort?: 'score' | 'stars' | 'forks' | 'updated';
  order?: 'desc' | 'asc';
  page?: number;
  perPage?: number;
}

export interface RepositoryWithScore {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  description: string | null;
  html_url: string;
  language: string | null;
  created_at: string;
  updated_at: string;
  stars: number;
  forks: number;
  open_issues: number;
  topics?: string[];
  license?: {
    name: string;
    spdx_id: string;
  };
  popularity_score: number;
}

export interface SearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: RepositoryWithScore[];
  page: number;
  per_page: number;
}

export interface ScoringWeights {
  stars: number;
  forks: number;
  recency: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

