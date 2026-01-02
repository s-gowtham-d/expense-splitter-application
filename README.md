# Expense Splitter Application

A full-stack web application for managing shared expenses among group members. Split bills easily using equal, percentage-based, or exact amount distribution methods with automatic settlement calculations.

## Features

- **Group Management**: Create and manage expense groups with descriptions
- **Member Management**: Add/remove members from groups with email tracking
- **Expense Tracking**: Record expenses with flexible split options
- **Smart Settlements**: Automatically calculates optimal payment settlements to minimize transactions
- **Balance Tracking**: Real-time balance calculations showing who owes whom
- **Three Split Types**:
  - **Equal**: Split evenly among selected members
  - **Percentage**: Custom percentage allocation (must sum to 100%)
  - **Exact**: Specify exact amounts per member (must sum to total)

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- SQLite database with better-sqlite3
- express-validator for input validation
- CORS enabled for cross-origin requests

### Frontend
- React 18 with TypeScript
- Vite for build tooling and development server
- shadcn/ui component library (built on Radix UI)
- Tailwind CSS v4 with CSS variables
- React Router v6 for navigation
- Lucide React for icons

## Project Structure

```
expense-splitter-application/
├── backend/               # Express backend server
│   ├── src/
│   │   ├── config/       # Database configuration and initialization
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Data access layer (SQLite queries)
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic layer
│   │   ├── middleware/   # Validation and error handling
│   │   ├── types/        # TypeScript type definitions
│   │   └── server.ts     # Application entry point
│   ├── database.sqlite   # SQLite database file
│   └── package.json
└── frontend/             # React frontend application
    ├── src/
    │   ├── api/          # API client with typed requests
    │   ├── components/   # Reusable UI components
    │   │   └── ui/       # shadcn/ui components
    │   ├── pages/        # Page components
    │   ├── lib/          # Utility functions
    │   ├── types/        # TypeScript type definitions
    │   └── main.tsx      # Application entry point
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-splitter-application
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

#### Development Mode

1. Start the backend server (from backend directory):
```bash
npm run dev
```
The backend API will run on `http://localhost:3000`

2. In a new terminal, start the frontend (from frontend directory):
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

The frontend is configured to proxy API requests to the backend automatically.

#### Production Build

1. Build and start the backend:
```bash
cd backend
npm run build
npm start
```

2. Build and preview the frontend:
```bash
cd frontend
npm run build
npm run preview
```

## API Endpoints

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details with members and expenses
- `PUT /api/groups/:id` - Update group information
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:id/balances` - Get balance summary for all members
- `GET /api/groups/:id/settlements` - Get optimized settlement suggestions

### Members
- `POST /api/groups/:groupId/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member from group

### Expenses
- `GET /api/expenses` - Get all expenses (supports `?groupId=` query parameter)
- `POST /api/expenses` - Create new expense with split details
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Database Schema

The application uses SQLite with the following normalized schema:

- **groups**: Stores group information (id, name, description, createdAt)
- **members**: Individual member records (id, name, email, createdAt)
- **group_members**: Junction table for group-member relationships
- **expenses**: Expense records (id, groupId, description, amount, paidBy, date, splitType)
- **split_details**: Individual split records (expenseId, memberId, amount)

Foreign key constraints are enforced to maintain data integrity.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema and design information.

## Key Features Explained

### Settlement Algorithm

The application uses a greedy algorithm to minimize the number of transactions needed to settle all debts:

1. Calculate net balance for each member (total paid - total owed)
2. Separate members into creditors (positive balance) and debtors (negative balance)
3. Match largest debtor with largest creditor iteratively
4. Generate optimal payment instructions

### Split Type Validation

- **Equal**: Automatically divides amount equally among selected members
- **Percentage**: Validates that percentages sum to exactly 100%
- **Exact**: Validates that exact amounts sum to the total expense amount

## Development Scripts

### Backend
- `npm run dev` - Start development server with nodemon (auto-restart on changes)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run clean` - Remove dist directory

### Frontend
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Architecture Decisions

- **Function-based architecture**: Backend uses functional programming style instead of classes
- **Layered structure**: Clear separation between routes, controllers, services, and data models
- **Type safety**: Full TypeScript coverage on both frontend and backend
- **Component library**: shadcn/ui for consistent, accessible UI components
- **SQLite**: Lightweight embedded database, perfect for this use case

## Future Enhancements

- User authentication and authorization
- Multi-currency support
- Expense categories and tags
- Receipt image uploads
- Email notifications
- Data export (CSV, PDF)
- Mobile responsive design improvements

## License

MIT
