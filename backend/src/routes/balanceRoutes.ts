import { Router } from 'express';
import * as balanceController from '../controllers/balanceController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validator';
import { groupIdValidator } from '../validators/groupValidators';

const router = Router();

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
