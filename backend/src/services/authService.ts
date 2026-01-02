import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { dataStore } from '../models';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '../types';
import { signToken } from '../utils/jwt';

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    if (dataStore.userExists(data.email)) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      passwordHash,
      createdAt: new Date(),
    };

    dataStore.createUser(user);

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = dataStore.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  getUserById(id: string) {
    const user = dataStore.getUserById(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

export const authService = new AuthService();
