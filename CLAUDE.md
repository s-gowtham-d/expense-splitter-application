# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack expense splitter application where users can create groups, add expenses, and automatically calculate who owes whom. Features include JWT authentication, data visualization dashboard, and intelligent settlement calculations. All expenses are tracked in Indian Rupees (INR). This is a monorepo with independent backend and frontend applications.

## Technology Stack

**Backend**: Node.js + Express + TypeScript + SQLite (better-sqlite3) + JWT authentication + bcrypt
**Frontend**: React 18 + TypeScript + Vite + Zustand + React Context + shadcn/ui + Tailwind CSS v4 + React Router v6 + Recharts

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

**Running Single Test**:
```bash
npm test -- balanceService.test.ts           # Run specific test file
npm test -- -t "should calculate balances"   # Run tests matching pattern
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
    services/     # Business logic (auth, balance, settlement, expense management)
    middleware/   # Auth middleware and error handling
    validators/   # express-validator schemas for input validation
    utils/        # JWT utilities and helper functions
    types/        # TypeScript type definitions (enums, interfaces)
    __tests__/    # Unit tests (Jest + Supertest)
    app.ts        # Express app setup
    server.ts     # Server entry point
  expense-splitter.db  # SQLite database file (auto-created)

frontend/
  src/
    api/          # API client with typed requests and token management
    components/   # UI components organized by feature
      dashboard/  # Dashboard charts (MemberSpendingChart, CategoryPieChart, SpendingTrendChart)
      expenses/   # ExpenseFormDialog, ExpensesList, ExpenseFilters, ExpensesCard
      group/      # MembersCard, BalancesCard, SettlementsCard
      ui/         # shadcn/ui components (Button, Dialog, Card, etc.)
    contexts/     # React Context providers (AuthContext)
    pages/        # Page-level components (LoginPage, RegisterPage, GroupsPage, GroupDetailPage, DashboardPage)
    store/        # Zustand state management (useGroupStore)
    types/        # TypeScript interfaces (shared with backend types)
    lib/          # Utility functions (cn for className merging, currency formatting)
    main.tsx      # Application entry point with router and providers
```

### Backend Layered Architecture

**Data Flow**: Routes → Auth Middleware → Controllers → Services → Models (SQLite)

- **Routes** (`backend/src/routes/`): Define API endpoints, attach validation and auth middleware
- **Middleware** (`backend/src/middleware/`):
  - `auth.ts` - JWT authentication middleware (verifies Bearer token, populates req.user)
  - `errorHandler.ts` - Centralized error handling
- **Controllers** (`backend/src/controllers/`): Handle HTTP requests/responses, call services
  - All protected routes receive `req.user` with `{ userId, email }` from auth middleware
- **Services** (`backend/src/services/`): Contain business logic:
  - `authService.ts` - User registration, login, password hashing with bcrypt
  - `balanceService.ts` - Calculate member balances and optimal settlements
  - `expenseService.ts` - Handle expense CRUD and split calculations
  - `groupService.ts` - Group management logic (user-scoped)
  - `memberService.ts` - Member management logic
- **Models** (`backend/src/models/index.ts`): Data access layer using SQLite prepared statements
  - All expense queries JOIN with members table to include paidByName
  - All group operations filter by userId for data isolation
- **Validators** (`backend/src/validators/`): express-validator schemas for input validation

### Frontend Architecture

**Authentication Pattern**: React Context API + Protected Routes
- `AuthContext` manages user state, login/register/logout actions
- Token stored in localStorage via `tokenManager`
- ProtectedRoute component wraps authenticated pages
- Login/Register pages redirect to /groups if already authenticated
- Navbar component on all protected pages with user info and logout

**State Management**:
- **Global Auth**: React Context API (`contexts/AuthContext.tsx`)
- **Group Details**: Zustand store (`store/useGroupStore.ts`)
  - Manages group state, balances, settlements
  - Optimistic updates with automatic refetching
  - Centralized error handling

**Component Pattern**: Feature-based organization with shared UI components
- Reusable dialogs (ExpenseFormDialog for both add/edit)
- Card-based layout (MembersCard, BalancesCard, SettlementsCard, ExpensesCard)
- Dashboard charts using Recharts (BarChart, PieChart, LineChart)
- shadcn/ui for consistent, accessible UI components

**UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS v4)
- Components are copied into `src/components/ui/` and can be modified
- Add new components with: `npx shadcn@latest add <component-name>`

### Database Schema (SQLite)

**Tables**:
1. `users` - User accounts (id, email, name, password_hash, created_at)
2. `groups` - Group information (id, user_id, name, description, created_at)
3. `members` - Member records (id, name, email)
4. `group_members` - Junction table for group-member relationships
5. `expenses` - Expense records (id, group_id, description, amount, currency, paid_by, split_type, category, date)
6. `split_details` - Individual split records (expense_id, member_id, amount)

**Key Points**:
- Foreign key constraints enforced (`db.pragma('foreign_keys = ON')`)
- Cascading deletes for data integrity
- Database auto-initialized on server start (`initializeDatabase()` in `config/database.ts`)
- Migration handling: ALTER TABLE with try/catch for backward compatibility
- Groups have user_id foreign key for user-scoped data isolation

### Data Models

**User**: id, email, name, passwordHash, createdAt
**Group**: id, userId, name, description, members (array of member IDs), createdAt
**Member**: id, name, email (optional)
**Expense**: id, groupId, description, amount, currency (always INR), paidBy, paidByName, splitBetween (array of {memberId, amount}), splitType, category, date

**Currency**: All expenses use Indian Rupees (INR). The backend stores currency field but frontend always sends INR.

**Expense Categories**:
- FOOD, TRAVEL, UTILITIES, ENTERTAINMENT, ACCOMMODATION, SHOPPING, OTHER

### Authentication Flow

**Registration/Login**:
1. Frontend sends credentials to `/api/auth/register` or `/api/auth/login`
2. Backend validates, hashes password (bcrypt), creates/verifies user
3. Backend generates JWT token with `{ userId, email }` payload
4. Frontend stores token in localStorage, sets user in AuthContext
5. Subsequent requests include `Authorization: Bearer <token>` header

**Protected Routes**:
- All `/api/groups/*` and `/api/expenses/*` routes require authentication
- Auth middleware verifies JWT and populates `req.user`
- Group operations automatically filter by `req.user.userId`
- Unauthorized access returns 403 Forbidden

**Token Management**:
- Tokens stored in localStorage (`tokenManager.ts`)
- Auto-attached to API requests via interceptor
- Invalid/expired tokens trigger logout and redirect to login

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

### Dashboard & Data Visualization

**Components** (`frontend/src/components/dashboard/`):
1. **MemberSpendingChart**: Bar chart of total spending by member
   - Uses `paidByName` from expense data (no separate member lookup needed)
   - Aggregates expenses by member name
   - Sorted by amount descending

2. **CategoryPieChart**: Pie chart of expenses by category
   - Visual breakdown of spending across categories
   - Color-coded by category type

3. **SpendingTrendChart**: Line chart of spending over time
   - Shows spending trends across dates
   - Helps identify spending patterns

**Data Flow**:
- Backend queries include LEFT JOIN with members table to populate `paidByName`
- Frontend receives expenses with member names already attached
- Charts directly use expense data without additional API calls

### API Endpoints

All endpoints return JSON with format: `{ status: "success", data: {...} }`

**Authentication** (Public):
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

**Groups** (Protected):
- `POST /api/groups` - Create group (auto-associated with authenticated user)
- `GET /api/groups` - List user's groups (filtered by userId)
- `GET /api/groups/:id` - Get group details with members and expenses (ownership verified)
- `PUT /api/groups/:id` - Update group (name, description, ownership verified)
- `DELETE /api/groups/:id` - Delete group (cascades to expenses, ownership verified)
- `GET /api/groups/:id/balances` - Get balance summary
- `GET /api/groups/:id/settlements` - Get optimized settlement suggestions

**Members** (Protected):
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member

**Expenses** (Protected):
- `POST /api/expenses` - Create expense with split details
- `GET /api/expenses?groupId=:id` - Get expenses (filterable by group, includes paidByName)
- `GET /api/expenses/:id` - Get expense details (includes paidByName)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Key Implementation Notes

### Storage
SQLite database with better-sqlite3 for synchronous, high-performance queries. Database file: `backend/expense-splitter.db`

### Authentication
- JWT tokens signed with SECRET_KEY from environment (defaults to dev key)
- Passwords hashed with bcrypt (10 salt rounds)
- Tokens include `{ userId, email }` payload
- Frontend stores token in localStorage
- Auth middleware on all protected routes

### User Data Isolation
- Groups table has `user_id` foreign key
- All group queries filter by authenticated user's ID
- Ownership verification on update/delete operations (403 if unauthorized)
- Users can only see and modify their own groups/expenses

### Validation
- express-validator used for all API endpoints
- Validation happens at route level before controller execution
- Validators in `backend/src/validators/` (authValidators, groupValidators, expenseValidators, memberValidators)
- Frontend has client-side validation in forms

### Error Handling
- Centralized error middleware: `backend/src/middleware/errorHandler.ts`
- Custom `AppError` class for application errors
- Consistent error response format: `{ status: "error", message: "..." }`
- HTTP status codes: 200 (success), 201 (created), 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

### Frontend State Management

**AuthContext** (Global):
- Manages user authentication state
- Provides login, register, logout functions
- Auto-loads user on app init if token exists
- Used by ProtectedRoute and Navbar components

**Zustand Store** (Group Detail):
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

**Dashboard Charts**:
- Use Recharts library for data visualization
- All charts receive expenses array with paidByName included
- Self-contained aggregation logic within each chart component
- Responsive design with ResponsiveContainer

### Currency Handling

**Backend**:
- Currency enum defined with multiple currencies but only INR is used
- All expenses stored with INR currency in database
- Backend accepts currency field but frontend always sends INR

**Frontend**:
- No currency selector in expense forms (removed for simplicity)
- All amounts displayed in INR using ₹ symbol
- Utility function: `formatCurrency(amount, Currency.INR)` in `lib/currency.ts`
- ExpenseFormDialog does not include currency field
- ExpensesCard hardcodes `currency: Currency.INR` when creating/updating expenses

### Member Names in Expense Data

**Backend Enhancement**:
- All expense queries use LEFT JOIN with members table
- Includes `paidByName` field in expense responses
- Queries: `getExpense()`, `getAllExpenses()`, `getExpensesByGroupId()`

**Frontend Usage**:
- Expense interface includes optional `paidByName?: string`
- Charts use `paidByName || 'Unknown'` for display
- No need to fetch members separately for dashboard

### Testing

**Backend Tests** (Jest + Supertest):
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

Tests located in `backend/src/services/__tests__/` and `backend/src/routes/__tests__/`:
- `balanceService.test.ts` - Balance calculation and settlement tests
- `expenseService.test.ts` - Expense CRUD and split validation tests
- `expenseRoutes.test.ts` - Integration tests for expense API endpoints

**Test Data Setup**:
- Tests use `dataStore.clearAll()` in beforeEach to reset state
- Create test users, groups, members for each test
- Integration tests use supertest to test full request/response cycle

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

7. **Authentication Required**: All group and expense endpoints require authentication. Include `Authorization: Bearer <token>` header.

8. **User Data Isolation**: Groups are scoped to users. Accessing another user's group returns 403 Forbidden.

9. **paidByName Field**: Expense queries automatically include member names via JOIN. Don't query members separately for display purposes.

10. **Protected Route Redirects**: Login/Register pages redirect to /groups if user is already authenticated (check in useEffect).
