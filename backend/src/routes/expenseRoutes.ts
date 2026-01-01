import { Router } from 'express';
import * as expenseController from '../controllers/expenseController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import {
  createExpenseValidators,
  updateExpenseValidators,
  expenseIdValidator,
  getExpensesValidators,
} from '../validators/expenseValidators';

const router = Router();

// Expense CRUD operations
router.post(
  '/',
  createExpenseValidators,
  validate,
  asyncHandler(expenseController.createExpense)
);

router.get(
  '/',
  getExpensesValidators,
  validate,
  asyncHandler(expenseController.getAllExpenses)
);

router.get(
  '/:id',
  expenseIdValidator,
  validate,
  asyncHandler(expenseController.getExpenseById)
);

router.put(
  '/:id',
  updateExpenseValidators,
  validate,
  asyncHandler(expenseController.updateExpense)
);

router.delete(
  '/:id',
  expenseIdValidator,
  validate,
  asyncHandler(expenseController.deleteExpense)
);

export default router;
