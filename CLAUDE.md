# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack expense splitter application where users can create groups, add expenses, and automatically calculate who owes whom. This is a monorepo with independent backend and frontend applications.

## Technology Stack

**Backend**: Node.js + Express + TypeScript + SQLite (better-sqlite3)
**Frontend**: React 18 + TypeScript + Vite + Zustand + shadcn/ui + Tailwind CSS v4 + React Router v6

## Development Commands

### Backend (from `backend/` directory)
```bash
npm run dev              # Run development server with hot reload (nodemon + ts-node)
npm run build            # Compile TypeScript to dist/
npm start                # Run production server from dist/
npm test                 # Run all tests with Jest
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Frontend (from `frontend/` directory)
```bash
npm run dev              # Run Vite dev server with HMR (http://localhost:5173)
npm run build            # Type-check and build for production
npm run preview          # Preview production build locally
```

**Note**: The frontend proxies API requests to the backend (configured in `vite.config.ts`). Start the backend first on port 3000 before running the frontend.

## Architecture

### Monorepo Structure
```
backend/
  src/
    config/       # Database configuration and initialization
    controllers/  # Request handlers (thin layer, calls services)
    models/       # Data access layer (SQLite queries via better-sqlite3)
    routes/       # API route definitions with validation middleware
    services/     # Business logic (balance calculation, settlement algorithm)
    middleware/   # Error handling and validation middleware
    validators/   # express-validator schemas for input validation
    types/        # TypeScript type definitions (enums, interfaces)
    __tests__/    # Unit tests (Jest + Supertest)
    app.ts        # Express app setup
    server.ts     # Server entry point
  expense-splitter.db  # SQLite database file (auto-created)

frontend/
  src/
    api/          # API client with typed requests
    components/   # UI components organized by feature
      expenses/   # ExpenseFormDialog, ExpensesList, ExpenseFilters, ExpensesCard
      group/      # MembersCard, BalancesCard, SettlementsCard
      ui/         # shadcn/ui components (Button, Dialog, Card, etc.)
    pages/        # Page-level components (GroupsPage, GroupDetailPage)
    store/        # Zustand state management
    types/        # TypeScript interfaces (shared with backend types)
    lib/          # Utility functions (cn for className merging)
    main.tsx      # Application entry point with router
```

### Backend Layered Architecture

**Data Flow**: Routes → Controllers → Services → Models (SQLite)

- **Routes** (`backend/src/routes/`): Define API endpoints, attach validation middleware
- **Controllers** (`backend/src/controllers/`): Handle HTTP requests/responses, call services
- **Services** (`backend/src/services/`): Contain business logic:
  - `balanceService.ts` - Calculate member balances and optimal settlements
  - `expenseService.ts` - Handle expense CRUD and split calculations
  - `groupService.ts` - Group management logic
  - `memberService.ts` - Member management logic
- **Models** (`backend/src/models/index.ts`): Data access layer using SQLite prepared statements
- **Validators** (`backend/src/validators/`): express-validator schemas for input validation

### Frontend Architecture

**State Management**: Zustand store (`frontend/src/store/useGroupStore.ts`)
- Manages group state, balances, settlements
- Optimistic updates with automatic refetching
- Centralized error handling

**Component Pattern**: Feature-based organization with shared UI components
- Reusable dialogs (ExpenseFormDialog for both add/edit)
- Card-based layout (MembersCard, BalancesCard, SettlementsCard, ExpensesCard)
- shadcn/ui for consistent, accessible UI components

**UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS v4)
- Components are copied into `src/components/ui/` and can be modified
- Add new components with: `npx shadcn@latest add <component-name>`

### Database Schema (SQLite)

**Tables**:
1. `groups` - Group information (id, name, description, created_at)
2. `members` - Member records (id, name, email)
3. `group_members` - Junction table for group-member relationships
4. `expenses` - Expense records (id, group_id, description, amount, paid_by, split_type, category, date)
5. `split_details` - Individual split records (expense_id, member_id, amount)

**Key Points**:
- Foreign key constraints enforced (`db.pragma('foreign_keys = ON')`)
- Cascading deletes for data integrity
- Database auto-initialized on server start (`initializeDatabase()` in `config/database.ts`)
- Migration handling: ALTER TABLE with try/catch for backward compatibility

### Data Models

**Group**: id, name, description, members (array of member IDs), createdAt
**Member**: id, name, email (optional)
**Expense**: id, groupId, description, amount, paidBy, splitBetween (array of {memberId, amount}), splitType, category, date

**Expense Categories** (Bonus Feature):
- FOOD, TRAVEL, UTILITIES, ENTERTAINMENT, ACCOMMODATION, SHOPPING, OTHER

### Split Types & Calculation Logic

1. **Equal** (`SplitType.EQUAL`):
   - Amount divided equally among selected members
   - Backend calculates: `amount / memberCount`
   - Frontend sends member IDs with placeholder amounts (0)
   - Implementation: `backend/src/services/expenseService.ts:13-19`

2. **Percentage** (`SplitType.PERCENTAGE`):
   - Custom percentages (must sum to exactly 100%)
   - Frontend sends percentage values (not calculated amounts)
   - Backend converts: `(amount * percentage) / 100`
   - Validation: Total percentages must equal 100% (±0.01 tolerance)
   - Implementation: `backend/src/services/expenseService.ts:21-36`

3. **Exact** (`SplitType.EXACT`):
   - Specific amounts per member (must sum to total expense)
   - Frontend sends exact amounts
   - Backend validates: Sum of splits must equal total amount (±0.01 tolerance)
   - Implementation: `backend/src/services/expenseService.ts:38-50`

**Important**: When updating expenses, the backend preserves the originally selected members (not all group members). This is critical for maintaining split integrity.

### Settlement Algorithm

**Purpose**: Minimize the number of transactions needed to settle all debts

**Implementation** (`backend/src/services/balanceService.ts:41-83`):

1. **Calculate Balances**: For each member, balance = total paid - total owed
2. **Separate**: Split into debtors (balance < 0) and creditors (balance > 0)
3. **Greedy Matching**: Match largest debtor with largest creditor iteratively
4. **Settle Amount**: min(debtor balance, creditor balance)
5. **Repeat**: Continue until all balances settled

**Example**:
- Alice owes $30, Bob is owed $20, Charlie is owed $10
- Optimal: Alice → Bob $20, Alice → Charlie $10 (2 transactions)

### API Endpoints

All endpoints return JSON with format: `{ status: "success", data: {...} }`

**Groups**:
- `POST /api/groups` - Create group
- `GET /api/groups` - List all groups
- `GET /api/groups/:id` - Get group details with members and expenses
- `PUT /api/groups/:id` - Update group (name, description)
- `DELETE /api/groups/:id` - Delete group (cascades to expenses)
- `GET /api/groups/:id/balances` - Get balance summary
- `GET /api/groups/:id/settlements` - Get optimized settlement suggestions

**Members**:
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member

**Expenses**:
- `POST /api/expenses` - Create expense with split details
- `GET /api/expenses?groupId=:id` - Get expenses (filterable by group)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Key Implementation Notes

### Storage
SQLite database with better-sqlite3 for synchronous, high-performance queries. Database file: `backend/expense-splitter.db`

### Validation
- express-validator used for all API endpoints
- Validation happens at route level before controller execution
- Validators in `backend/src/validators/` (groupValidators, expenseValidators, memberValidators)
- Frontend has client-side validation in forms

### Error Handling
- Centralized error middleware: `backend/src/middleware/errorHandler.ts`
- Custom `AppError` class for application errors
- Consistent error response format: `{ status: "error", message: "..." }`
- HTTP status codes: 200 (success), 201 (created), 400 (validation), 404 (not found), 500 (server error)

### Frontend State Management (Zustand)
- Single store for group detail page: `useGroupStore`
- Actions automatically refetch group data after mutations
- Optimistic updates with loading states
- Error handling with user-friendly alerts

### Component Patterns

**Shared ExpenseFormDialog**:
- Single component for both add and edit modes
- Mode prop controls dialog title and submit behavior
- Form data populated from expense prop in edit mode
- Reset on dialog close to clear stale data

**Card-based Layout**:
- Each major feature in its own card component
- Self-contained with internal state management
- Callbacks for parent communication (onAddMember, onRemoveMember, etc.)

### Bonus Features Implemented

1. **TypeScript** - Full type safety across stack
2. **State Management** - Zustand with clean architecture
3. **Styling Library** - Tailwind CSS v4 + shadcn/ui
4. **Unit Tests** - Backend Jest tests in `backend/src/__tests__/`
5. **Expense Categories** - 7 categories with filtering
6. **CSV Export** - Export expenses with all details
7. **Search & Filter** - Filter by member, category, search description

### Testing

**Backend Tests** (Jest + Supertest):
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

Tests located in `backend/src/services/__tests__/`:
- `balanceService.test.ts` - Balance calculation and settlement tests
- `expenseService.test.ts` - Expense CRUD and split validation tests

**Running Single Test**:
```bash
npm test -- balanceService.test.ts
```

## Commit Convention

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code restructuring
- `docs:` Documentation changes
- `test:` Adding/updating tests

Do NOT add Claude attribution to commits.

## Common Pitfalls

1. **Split Calculation on Update**: When updating expenses, preserve originally selected members (not all group members). See `backend/src/services/expenseService.ts:138-155`

2. **Equal Split Member Selection**: Frontend must send member IDs even for equal splits (with placeholder amounts). Backend needs to know which members to include.

3. **Category Type Casting**: Use `value as ExpenseCategory` when setting category in Select onChange to avoid type issues.

4. **Database Foreign Keys**: Always enable foreign keys with `db.pragma('foreign_keys = ON')` for cascade deletes to work.

5. **Zustand Store Updates**: After mutations (add/edit/delete), always refetch group data to update balances and settlements.

6. **Percentage Validation**: Percentages are sent as values (not pre-calculated amounts). Backend converts to amounts.
