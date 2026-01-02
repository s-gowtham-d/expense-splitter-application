# Architecture Documentation

This document provides detailed technical information about the Expense Splitter Application's architecture, design decisions, and implementation details.

## Table of Contents

- [System Overview](#system-overview)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Business Logic](#business-logic)
- [Data Flow](#data-flow)

## System Overview

The Expense Splitter Application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│  - UI Components (shadcn/ui + Tailwind)         │
│  - State Management (React Hooks)               │
│  - API Client Layer                              │
└────────────────────┬────────────────────────────┘
                     │ HTTP/JSON
                     │ REST API
┌────────────────────▼────────────────────────────┐
│            Backend (Express)                     │
│  ┌──────────────────────────────────────────┐  │
│  │  Routes → Controllers → Services → Models│  │
│  └──────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────────────┐
│          SQLite Database                         │
│  - Groups, Members, Expenses, Splits            │
└─────────────────────────────────────────────────┘
```

## Backend Architecture

### Layer Architecture

The backend follows a **function-based layered architecture**:

1. **Routes Layer** (`src/routes/`)
   - Define API endpoints
   - Map HTTP methods to controller functions
   - Apply validation middleware

2. **Controllers Layer** (`src/controllers/`)
   - Handle HTTP request/response
   - Extract request data
   - Call service layer functions
   - Format responses

3. **Services Layer** (`src/services/`)
   - Implement business logic
   - Coordinate between multiple models
   - Perform calculations (balances, settlements)
   - Handle data transformations

4. **Models Layer** (`src/models/`)
   - Data access layer
   - Execute SQL queries
   - Handle database operations
   - Return raw data objects

### Key Design Decisions

**Function-Based vs Class-Based**
- Used functional programming style instead of classes
- Pure functions for business logic
- Easier to test and reason about
- Example:
  ```typescript
  export const createGroup = (data: CreateGroupRequest): Group => {
    // Function implementation
  };
  ```

**Middleware Pattern**
- Validation middleware using express-validator
- Error handling middleware for consistent error responses
- Async handler wrapper for error propagation

### Directory Structure

```
backend/src/
├── config/
│   └── database.ts          # SQLite initialization and schema
├── controllers/
│   ├── groupController.ts   # Group-related handlers
│   ├── memberController.ts  # Member-related handlers
│   └── expenseController.ts # Expense-related handlers
├── middleware/
│   ├── validation.ts        # Input validation middleware
│   └── errorHandler.ts      # Error handling middleware
├── models/
│   └── index.ts             # Data access layer (all CRUD operations)
├── routes/
│   ├── groupRoutes.ts       # Group endpoints
│   ├── memberRoutes.ts      # Member endpoints
│   └── expenseRoutes.ts     # Expense endpoints
├── services/
│   ├── groupService.ts      # Group business logic
│   ├── memberService.ts     # Member business logic
│   ├── expenseService.ts    # Expense business logic
│   └── balanceService.ts    # Balance calculations and settlements
├── types/
│   └── index.ts             # TypeScript type definitions
└── server.ts                # Application entry point
```

## Frontend Architecture

### Component Architecture

The frontend uses a **component-based architecture** with React:

1. **Pages** (`src/pages/`)
   - Top-level route components
   - Manage page-specific state
   - Coordinate child components
   - Handle data fetching

2. **UI Components** (`src/components/ui/`)
   - Reusable UI primitives from shadcn/ui
   - Built on Radix UI for accessibility
   - Styled with Tailwind CSS
   - Examples: Button, Dialog, Input, Select

3. **API Client** (`src/api/`)
   - Centralized API communication
   - Type-safe request/response handling
   - Error handling
   - Base URL configuration with proxy

### State Management

- **Local State**: React useState for component-specific data
- **Effect Hooks**: useEffect for data fetching and side effects
- **URL State**: React Router params for navigation state
- No global state management library (kept simple)

### Routing Structure

```
/ (HomePage)
  └── /groups (GroupsPage)
       └── /groups/:id (GroupDetailPage)
```

### Directory Structure

```
frontend/src/
├── api/
│   └── client.ts              # API client with typed methods
├── components/
│   └── ui/                    # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── radio-group.tsx
│       └── textarea.tsx
├── lib/
│   └── utils.ts               # Utility functions (cn helper)
├── pages/
│   ├── HomePage.tsx           # Landing page
│   ├── GroupsPage.tsx         # Groups list and creation
│   └── GroupDetailPage.tsx    # Group details, members, expenses
├── types/
│   └── index.ts               # TypeScript type definitions
└── main.tsx                   # Application entry point
```

## Database Design

### Schema

The database uses a normalized relational schema with SQLite:

#### Tables

**groups**
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL
)
```

**members**
```sql
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  createdAt TEXT NOT NULL
)
```

**group_members** (Junction Table)
```sql
CREATE TABLE group_members (
  groupId TEXT NOT NULL,
  memberId TEXT NOT NULL,
  PRIMARY KEY (groupId, memberId),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
)
```

**expenses**
```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  groupId TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  paidBy TEXT NOT NULL,
  date TEXT NOT NULL,
  splitType TEXT NOT NULL CHECK(splitType IN ('equal', 'percentage', 'exact')),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (paidBy) REFERENCES members(id)
)
```

**split_details**
```sql
CREATE TABLE split_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expenseId TEXT NOT NULL,
  memberId TEXT NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES members(id)
)
```

### Entity Relationships

```
groups ──┬─< group_members >─┬── members
         │                     │
         └─< expenses          │
              │                │
              └─< split_details┘
```

### Data Integrity

- **Foreign Keys**: Enabled with `PRAGMA foreign_keys = ON`
- **CASCADE Deletes**: Removing a group deletes all related expenses and splits
- **Check Constraints**: splitType must be one of: 'equal', 'percentage', 'exact'
- **NOT NULL Constraints**: Critical fields cannot be null
- **Composite Primary Keys**: group_members uses (groupId, memberId)

## API Design

### RESTful Principles

The API follows REST conventions:

- **Resource-Based URLs**: `/api/groups`, `/api/expenses`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: 200 (success), 201 (created), 400 (validation error), 404 (not found), 500 (server error)
- **JSON Responses**: Consistent response format

### Response Format

All API responses follow this structure:

```typescript
{
  status: "success" | "error",
  data: {
    // Resource-specific data
    group?: Group,
    groups?: Group[],
    balances?: Balance[],
    // etc.
  },
  message?: string  // For errors
}
```

### Validation

Input validation using express-validator:

```typescript
const createGroupValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
];
```

Validation errors return 400 with detailed error messages.

## Business Logic

### Balance Calculation Algorithm

```typescript
function calculateGroupBalances(groupId: string): Balance[] {
  // 1. Get all expenses for the group
  const expenses = getExpensesByGroupId(groupId);

  // 2. Initialize balance map
  const balances = new Map<string, number>();

  // 3. For each expense:
  for (expense of expenses) {
    // 3a. Credit the payer
    balances[expense.paidBy] += expense.amount;

    // 3b. Debit each split recipient
    for (split of expense.splits) {
      balances[split.memberId] -= split.amount;
    }
  }

  // 4. Return balances
  return Array.from(balances);
}
```

### Settlement Optimization Algorithm

The greedy algorithm minimizes transaction count:

```typescript
function calculateSettlements(groupId: string): Settlement[] {
  // 1. Get all balances
  const balances = calculateGroupBalances(groupId);

  // 2. Separate into debtors and creditors
  const debtors = balances.filter(b => b.balance < 0);
  const creditors = balances.filter(b => b.balance > 0);

  // 3. Sort by absolute value (largest first)
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  // 4. Greedy matching
  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debt = Math.abs(debtors[i].balance);
    const credit = creditors[j].balance;
    const amount = Math.min(debt, credit);

    settlements.push({
      from: debtors[i].memberId,
      to: creditors[j].memberId,
      amount
    });

    // Update balances
    debtors[i].balance += amount;
    creditors[j].balance -= amount;

    // Move to next if settled
    if (debtors[i].balance === 0) i++;
    if (creditors[j].balance === 0) j++;
  }

  return settlements;
}
```

### Split Type Handling

**Equal Split**
```typescript
// Divide total amount by number of members
const perPerson = amount / members.length;
splitDetails = members.map(m => ({ memberId: m.id, amount: perPerson }));
```

**Percentage Split**
```typescript
// Validate percentages sum to 100
const total = percentages.reduce((sum, p) => sum + p, 0);
if (Math.abs(total - 100) > 0.01) throw new Error('Invalid percentages');

// Calculate amounts
splitDetails = percentages.map((p, i) => ({
  memberId: members[i].id,
  amount: (amount * p) / 100
}));
```

**Exact Split**
```typescript
// Validate amounts sum to total
const total = amounts.reduce((sum, a) => sum + a, 0);
if (Math.abs(total - amount) > 0.01) throw new Error('Invalid amounts');

// Use exact amounts
splitDetails = amounts.map((a, i) => ({
  memberId: members[i].id,
  amount: a
}));
```

## Data Flow

### Creating an Expense

```
User Interface
    ├─> Fill expense form
    ├─> Select split type
    ├─> Select members
    └─> Enter split details (%, exact, or auto-equal)
         │
         ▼
API Client (frontend/src/api/client.ts)
    └─> POST /api/expenses with JSON payload
         │
         ▼
Route (backend/src/routes/expenseRoutes.ts)
    └─> Validate input with middleware
         │
         ▼
Controller (backend/src/controllers/expenseController.ts)
    └─> Extract and format request data
         │
         ▼
Service (backend/src/services/expenseService.ts)
    ├─> Validate business rules
    ├─> Calculate split details if needed
    └─> Call model layer
         │
         ▼
Model (backend/src/models/index.ts)
    ├─> Begin transaction
    ├─> INSERT INTO expenses
    ├─> INSERT INTO split_details (multiple rows)
    └─> Commit transaction
         │
         ▼
Response
    └─> Return created expense with splits
         │
         ▼
UI Update
    ├─> Refresh group data
    ├─> Update balances display
    └─> Update settlements display
```

### Calculating Balances

```
Page Load (GroupDetailPage)
    │
    ▼
Parallel API Calls
    ├─> GET /api/groups/:id
    ├─> GET /api/groups/:id/balances
    └─> GET /api/groups/:id/settlements
         │
         ▼
Balance Service
    ├─> Fetch all expenses for group
    ├─> Fetch all split details
    ├─> Calculate net balance per member
    │   (amount paid - amount owed)
    └─> Return balance array
         │
         ▼
Settlement Service
    ├─> Get balances
    ├─> Run greedy algorithm
    └─> Return optimized settlements
         │
         ▼
UI Rendering
    ├─> Display balances with color coding
    │   (green = gets back, red = owes)
    └─> Display settlement instructions
```

## Technology Choices

### Why SQLite?
- Lightweight, embedded database
- No separate server process needed
- File-based storage (easy backup)
- ACID compliant with transactions
- Foreign key support for referential integrity
- Perfect for small to medium scale applications

### Why Function-Based Backend?
- Simpler to understand and test
- Easier to compose and reuse
- Avoid OOP complexity
- Better alignment with functional paradigms
- Stateless by design

### Why shadcn/ui?
- Copy-paste component approach (full control)
- Built on Radix UI (excellent accessibility)
- Fully customizable with Tailwind
- Type-safe TypeScript components
- Modern, clean design system

### Why No Global State Management?
- Application state is simple
- Most state is server-driven
- Local component state is sufficient
- Reduces complexity and dependencies
- Easier to understand data flow

## Performance Considerations

- **Database Indexes**: Primary keys on all tables for fast lookups
- **Transaction Batching**: Multiple splits inserted in single transaction
- **Parallel Requests**: Frontend fetches group, balances, and settlements in parallel
- **Prepared Statements**: better-sqlite3 uses prepared statements for SQL injection prevention
- **Lazy Loading**: Only load data when navigating to specific pages

## Security Considerations

- **SQL Injection Prevention**: Parameterized queries with prepared statements
- **Input Validation**: Server-side validation on all inputs
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Type Safety**: TypeScript prevents many runtime errors
- **Error Handling**: No sensitive information in error messages

## Future Architecture Improvements

- Add Redis for caching frequently accessed data
- Implement WebSocket for real-time balance updates
- Add database migrations system (e.g., knex.js)
- Implement request rate limiting
- Add comprehensive logging system
- Add unit and integration tests
- Implement CI/CD pipeline
