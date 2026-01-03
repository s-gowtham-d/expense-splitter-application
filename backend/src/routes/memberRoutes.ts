import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import {
  addMemberValidators,
  removeMemberValidators,
} from '../validators/memberValidators';

const router = Router();

// All member routes require authentication
router.use(authenticate);

// Member management within groups
router.post(
  '/groups/:groupId/members',
  addMemberValidators,
  validate,
  asyncHandler(memberController.addMemberToGroup)
);

router.delete(
  '/groups/:groupId/members/:memberId',
  removeMemberValidators,
  validate,
  asyncHandler(memberController.removeMemberFromGroup)
);

export default router;
