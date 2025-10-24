# GitHub Repository Search API

A RESTful API that searches GitHub repositories and ranks them by popularity using a custom scoring algorithm.

**Quick start with Docker:**
```bash
git clone <repo-url>
cd redcare-github
docker-compose up -d
curl http://localhost:3000/api/health
```

## Features

- Custom popularity scoring algorithm
- Rate limiting and error handling
- TypeScript with Express.js
- Docker support
- Comprehensive tests

## Setup

### Prerequisites
- Docker and Docker Compose

### Quick Start
```bash
# Clone and start
git clone <repository-url>
cd redcare-github
docker-compose up -d

# Test it works
curl http://localhost:3000/api/health
```

### Container Management
```bash
# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart
```

### With GitHub Token (Optional)
```bash
# For higher rate limits
docker run -d \
  --name github-api \
  -p 3000:3000 \
  -e GITHUB_TOKEN=your_token_here \
  github-repo-search-api
```

---

## API Usage

### Base URL
```
http://localhost:3000
```

### Endpoints

**Health Check:**
```
GET /api/health
```

**Rate Limit Status:**
```
GET /api/rate-limit
```

**Search Repositories:**
```
GET /api/repositories/search
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `language` | string | Programming language | `typescript`, `python` |
| `createdAfter` | string | Date filter (ISO 8601) | `2024-01-01` |
| `sort` | string | Sort by: `score`, `stars`, `forks`, `updated` | `score` |
| `order` | string | `asc` or `desc` | `desc` |
| `page` | number | Page number (1-100) | `1` |
| `perPage` | number | Results per page (1-100) | `30` |

**Example Response:**
```json
{
  "total_count": 1234567,
  "incomplete_results": false,
  "items": [
    {
      "id": 123456,
      "name": "awesome-repo",
      "full_name": "owner/awesome-repo",
      "owner": {
        "login": "owner",
        "avatar_url": "https://avatars.githubusercontent.com/...",
        "type": "User"
      },
      "description": "An awesome TypeScript project",
      "html_url": "https://github.com/owner/awesome-repo",
      "language": "TypeScript",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2025-10-20T14:22:00Z",
      "stars": 15420,
      "forks": 1234,
      "open_issues": 42,
      "topics": ["typescript", "nodejs", "api"],
      "license": {
        "name": "MIT License",
        "spdx_id": "MIT"
      },
      "popularity_score": 8.75
    }
  ],
  "page": 1,
  "per_page": 30
}
```

## Examples

### Search TypeScript repositories
```bash
curl "http://localhost:3000/api/repositories/search?language=typescript&perPage=5"
```

### Search with date filter
```bash
curl "http://localhost:3000/api/repositories/search?language=python&createdAfter=2024-01-01"
```

### Pagination
```bash
# Page 1 (default)
curl "http://localhost:3000/api/repositories/search?language=rust&page=1&perPage=10"

# Page 2
curl "http://localhost:3000/api/repositories/search?language=rust&page=2&perPage=10"
```

## Scoring Algorithm

The API uses a custom algorithm to rank repositories by popularity:

- **Stars (40%)**: Logarithmic scale to prevent mega-repos from dominating
- **Forks (30%)**: Logarithmic scale for fair comparison  
- **Recency (30%)**: Exponential decay based on last update date

### Configuration
```env
SCORE_WEIGHT_STARS=0.4
SCORE_WEIGHT_FORKS=0.3
SCORE_WEIGHT_RECENCY=0.3
```

## Project Structure

```
src/
├── config/           # Environment config
├── services/         # Business logic
├── controllers/      # Request handlers (repository, system)
├── middleware/       # Validation, rate limiting
├── routes/           # API routes
├── types/            # TypeScript definitions
└── utils/            # Logging, errors
```

## Architecture

- Clean separation of concerns
- TypeScript for type safety
- Express.js with middleware pattern
- Comprehensive error handling
- Rate limiting and validation

## Rate Limiting

The API has two layers of rate limiting:

**API Rate Limiting:**
- General API: 100 requests per 15 minutes
- Search endpoint: 30 requests per 15 minutes

**GitHub API Rate Limiting:**
- Without token: 60 requests per hour
- With token: 5,000 requests per hour

Set `GITHUB_TOKEN` environment variable for higher limits.

## Error Handling

The API returns structured error responses:

```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "statusCode": 400
}
```

## Testing

Run tests:
```bash
npm test
npm test -- --coverage
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `GITHUB_TOKEN` | GitHub Personal Access Token | - | No (recommended) |
| `SCORE_WEIGHT_STARS` | Stars weight in scoring | `0.4` | No |
| `SCORE_WEIGHT_FORKS` | Forks weight in scoring | `0.3` | No |
| `SCORE_WEIGHT_RECENCY` | Recency weight in scoring | `0.3` | No |

## Dependencies

**Production:**
- express, axios, joi, winston, cors, dotenv

**Development:**
- typescript, jest, supertest, ts-node-dev

## License

MIT