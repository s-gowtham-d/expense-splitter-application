import { Router, Request, Response } from 'express';
import { authController } from '../controllers/authController';
import { registerValidator, loginValidator } from '../validators/authValidators';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidator, validate, (req: Request, res: Response) =>
  authController.register(req, res)
);

router.post('/login', loginValidator, validate, (req: Request, res: Response) =>
  authController.login(req, res)
);

// Protected routes
router.get('/me', authenticate, (req: Request, res: Response) =>
  authController.getMe(req, res)
);

export default router;
