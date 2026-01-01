# Architecture Documentation

## Overview

This is a monorepo containing a full-stack expense splitter application with a clear separation between frontend and backend.

## Architecture Decisions

### Monorepo Structure
- **Backend**: Standalone Express API server
- **Frontend**: Standalone React SPA
- Both can be developed and deployed independently

### Backend Architecture
- **Pattern**: Layered architecture (Routes → Controllers → Services → Models)
- **Storage**: In-memory data structures (easily migrateable to database)
- **Validation**: express-validator for request validation
- **Error Handling**: Centralized error handling middleware

### Frontend Architecture
- **Pattern**: Component-based architecture with React
- **State Management**: React Context API (can be upgraded to Zustand if needed)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

### Data Flow

```
Frontend (React) → API Client → Backend (Express) → Services → In-Memory Store
```

## Key Features

### 1. Settlement Algorithm
Minimizes the number of transactions required to settle all debts using a greedy algorithm approach.

### 2. Split Types
- **Equal**: Split amount equally among all participants
- **Percentage**: Split by custom percentages (must sum to 100%)
- **Exact**: Specify exact amounts for each participant

## Design Trade-offs

Will be documented as implementation progresses.
