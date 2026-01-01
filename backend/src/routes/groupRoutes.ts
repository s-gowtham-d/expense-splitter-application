import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import {
  createGroupValidators,
  updateGroupValidators,
  groupIdValidator,
} from '../validators/groupValidators';

const router = Router();

// Group CRUD operations
router.post(
  '/',
  createGroupValidators,
  validate,
  asyncHandler(groupController.createGroup)
);

router.get(
  '/',
  asyncHandler(groupController.getAllGroups)
);

router.get(
  '/:id',
  groupIdValidator,
  validate,
  asyncHandler(groupController.getGroupById)
);

router.put(
  '/:id',
  updateGroupValidators,
  validate,
  asyncHandler(groupController.updateGroup)
);

router.delete(
  '/:id',
  groupIdValidator,
  validate,
  asyncHandler(groupController.deleteGroup)
);

export default router;
