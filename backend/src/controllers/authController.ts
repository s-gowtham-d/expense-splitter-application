import { Request, Response } from 'express';
import { authService } from '../services/authService';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User with this email already exists') {
          res.status(409).json({ error: error.message });
          return;
        }
      }
      res.status(400).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid email or password') {
          res.status(401).json({ error: error.message });
          return;
        }
      }
      res.status(400).json({ error: 'Login failed' });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
}

export const authController = new AuthController();
