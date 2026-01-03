import { Router } from 'express';
import * as balanceController from '../controllers/balanceController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { groupIdValidator } from '../validators/groupValidators';

const router = Router();

// All balance routes require authentication
router.use(authenticate);

// Balance and settlement endpoints
router.get(
  '/groups/:id/balances',
  groupIdValidator,
  validate,
  asyncHandler(balanceController.getGroupBalances)
);

router.get(
  '/groups/:id/settlements',
  groupIdValidator,
  validate,
  asyncHandler(balanceController.getGroupSettlements)
);

export default router;
