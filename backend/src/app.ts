import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import groupRoutes from './routes/groupRoutes';
import memberRoutes from './routes/memberRoutes';
import expenseRoutes from './routes/expenseRoutes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Expense Splitter API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Expense Splitter API',
    version: '1.0.0',
  });
});

app.use('/api/groups', groupRoutes);
app.use('/api', memberRoutes);
app.use('/api/expenses', expenseRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
