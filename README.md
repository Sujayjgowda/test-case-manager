# Test Case Manager

A web application to track and automate writing test cases based on test scenarios using AI.

## Features

- **Project & Module Management** - Organize test scenarios by projects and modules
- **Test Scenario Tracking** - Create, edit, and manage test scenarios with priorities and tags
- **AI-Powered Test Case Generation** - Automatically generate test cases from scenarios using Anthropic Claude API
- **Test Steps Editor** - Detailed step-by-step test instructions with drag-and-drop reordering
- **Status Workflow** - Track test cases through Draft → In Review → Reviewed → Approved
- **Multi-Format Export** - Export to JSON, Markdown, PDF, or Excel formats

## Tech Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS, shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Backend**: Node.js, Express.js
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **AI**: Anthropic Claude API for test case generation
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Anthropic API key for AI features

### Installation

1. **Install dependencies**

```bash
cd test-case-manager
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

3. **Set up the database**

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

4. **Run the application**

From the root directory:

```bash
# Run both frontend and backend
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

5. **Open your browser**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- API Health: http://localhost:3001/health

## Project Structure

```
test-case-manager/
├── apps/
│   ├── api/                    # Express.js backend
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── routes/         # API routes
│   │   │   ├── validators/     # Zod schemas
│   │   │   ├── middleware/     # Express middleware
│   │   │   └── prisma/         # Database schema
│   │   └── package.json
│   │
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # Next.js pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities
│       │   └── hooks/          # Custom hooks
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types and utils
│
├── package.json                # Root package (workspaces)
└── README.md
```

## API Endpoints

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Scenarios
- `GET /api/v1/scenarios` - List scenarios
- `POST /api/v1/scenarios` - Create scenario
- `GET /api/v1/scenarios/:id` - Get scenario
- `PUT /api/v1/scenarios/:id` - Update scenario
- `DELETE /api/v1/scenarios/:id` - Delete scenario
- `POST /api/v1/scenarios/:id/generate` - AI generate test cases

### Test Cases
- `GET /api/v1/test-cases` - List test cases
- `POST /api/v1/test-cases` - Create test case
- `GET /api/v1/test-cases/:id` - Get test case with steps
- `PUT /api/v1/test-cases/:id` - Update test case
- `DELETE /api/v1/test-cases/:id` - Delete test case
- `POST /api/v1/test-cases/:id/steps` - Add step

### Export
- `GET /api/v1/export/test-cases/:id/json` - Export as JSON
- `GET /api/v1/export/test-cases/:id/markdown` - Export as Markdown
- `GET /api/v1/export/test-cases/:id/pdf` - Export as PDF
- `GET /api/v1/export/test-cases/:id/excel` - Export as Excel

## Usage Guide

### Creating a Project

1. Navigate to Projects page
2. Click "New Project"
3. Enter project name and key (e.g., "E-commerce Platform", "ECOM")
4. Click "Create Project"

### Adding Modules

1. Open a project
2. Click "Add Module"
3. Enter module name (e.g., "Authentication", "Checkout")
4. Click "Create Module"

### Creating Scenarios

1. Navigate to Scenarios page
2. Click "New Scenario"
3. Select a module
4. Enter scenario title and description
5. Define preconditions and expected outcome
6. Click "Create Scenario"

### AI Test Case Generation

1. Open a scenario
2. Click "AI Generate" button
3. (Optional) Add additional instructions
4. Click "Generate Test Cases"
5. Wait for AI to create test cases (30-60 seconds)
6. Review generated test cases

### Manual Test Case Creation

1. Navigate to Test Cases page
2. Click "New Test Case"
3. Select a scenario
4. Enter test case details
5. Add test steps with expected results
6. Click "Create Test Case"

### Exporting Test Cases

1. Open a test case
2. Click "Export PDF" (or other formats)
3. Download the file

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite/PostgreSQL connection string | `file:./dev.db` |
| `PORT` | Backend server port | `3001` |
| `HOST` | Backend server host | `localhost` |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | - |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3001/api/v1` |

## Development

### Running Tests

```bash
npm test
```

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## License

MIT

## Support

For issues and feature requests, please create an issue on the repository.
