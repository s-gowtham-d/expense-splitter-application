import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import {
  addMemberValidators,
  removeMemberValidators,
} from '../validators/memberValidators';

const router = Router();

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
