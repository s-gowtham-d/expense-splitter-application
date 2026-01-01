import { body, param, query } from 'express-validator';
import { SplitType } from '../types';

export const createExpenseValidators = [
  body('groupId').trim().notEmpty().withMessage('Group ID is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('paidBy').trim().notEmpty().withMessage('Paid by member ID is required'),
  body('splitType')
    .isIn([SplitType.EQUAL, SplitType.PERCENTAGE, SplitType.EXACT])
    .withMessage('Split type must be equal, percentage, or exact'),
  body('splitBetween')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Split between must be a non-empty array'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),
];

export const updateExpenseValidators = [
  param('id').trim().notEmpty().withMessage('Expense ID is required'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('paidBy')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Paid by member ID cannot be empty'),
  body('splitType')
    .optional()
    .isIn([SplitType.EQUAL, SplitType.PERCENTAGE, SplitType.EXACT])
    .withMessage('Split type must be equal, percentage, or exact'),
  body('splitBetween')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Split between must be a non-empty array'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),
];

export const expenseIdValidator = [
  param('id').trim().notEmpty().withMessage('Expense ID is required'),
];

export const getExpensesValidators = [
  query('groupId').optional().trim().notEmpty().withMessage('Group ID cannot be empty'),
];
