# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack expense splitter application where users can create groups, add expenses, and automatically calculate who owes whom. This is a monorepo with independent backend and frontend applications.

## Technology Stack

**Backend**: Node.js + Express + TypeScript + In-memory storage
**Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS + React Router

## Development Commands

### Backend (from `backend/` directory)
```bash
npm run dev    # Run development server with hot reload
npm run build  # Compile TypeScript to dist/
npm start      # Run production server from dist/
```

### Frontend (will be added when frontend is set up)
Commands will be added once frontend structure is created.

## Architecture

### Monorepo Structure
```
backend/
  src/
    config/       # Configuration files
    controllers/  # Request handlers
    models/       # Data models and TypeScript types
    routes/       # API route definitions
    services/     # Business logic layer
    middleware/   # Custom middleware (validation, error handling)
    utils/        # Utility functions (settlement algorithm)
    validators/   # Request validation schemas
    types/        # TypeScript type definitions
    app.ts        # Express app setup
    server.ts     # Server entry point

frontend/
  src/
    api/          # API client functions
    components/   # UI components organized by feature
    pages/        # Page-level components
    hooks/        # Custom React hooks
    context/      # React Context for state management
    types/        # TypeScript interfaces
    utils/        # Helper functions
```

### Backend Layered Architecture

**Data Flow**: Routes → Controllers → Services → In-Memory Store

- **Routes**: Define API endpoints and attach middleware
- **Controllers**: Handle HTTP requests/responses, call services
- **Services**: Contain business logic (balance calculation, settlement algorithm)
- **Models**: In-memory data structures (Groups, Members, Expenses)
- **Validators**: express-validator schemas for input validation

### Frontend Architecture

**Pattern**: Component-based with feature organization
**State Management**: React Context API
**UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)

### Data Models

**Group**: id, name, description, members (array of IDs), createdAt
**Member**: id, name, email
**Expense**: id, groupId, description, amount, paidBy, splitBetween, splitType (equal/percentage/exact), date

### Split Types
1. **Equal**: Amount divided equally among all participants
2. **Percentage**: Custom percentages (must sum to 100%)
3. **Exact**: Specific amounts for each participant

### Settlement Algorithm
Minimizes transaction count to settle all debts using a greedy algorithm approach. Implemented in `backend/src/utils/` (to be created).

## API Endpoints (Planned)

```
POST   /api/groups                              # Create group
GET    /api/groups                              # List all groups
GET    /api/groups/:id                          # Get group details
PUT    /api/groups/:id                          # Update group
DELETE /api/groups/:id                          # Delete group
POST   /api/groups/:id/members                  # Add member
DELETE /api/groups/:groupId/members/:memberId   # Remove member
POST   /api/expenses                            # Create expense
GET    /api/expenses?groupId=:id                # Get expenses (filterable)
PUT    /api/expenses/:id                        # Update expense
DELETE /api/expenses/:id                        # Delete expense
GET    /api/groups/:id/balances                 # Get balance summary
GET    /api/groups/:id/settlements              # Get optimized settlement suggestions
```

## Key Implementation Notes

### Storage
In-memory storage using TypeScript Maps/arrays. Design allows easy migration to database (SQLite/PostgreSQL) by swapping the data access layer.

### Validation
Use express-validator for all request validation. Validate at API boundary, trust internal service calls.

### Error Handling
Centralized error handling middleware in `backend/src/middleware/`. Return consistent error response format.

## Commit Convention

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code restructuring
- `docs:` Documentation changes
- `style:` Formatting changes
- `test:` Adding/updating tests

Do NOT add Claude attribution to commits.
