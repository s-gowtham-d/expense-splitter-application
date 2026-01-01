import { body, param } from 'express-validator';

export const addMemberValidators = [
  param('groupId').trim().notEmpty().withMessage('Group ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Member name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Member name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

export const removeMemberValidators = [
  param('groupId').trim().notEmpty().withMessage('Group ID is required'),
  param('memberId').trim().notEmpty().withMessage('Member ID is required'),
];
