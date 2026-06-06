import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Your account is deactivated' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password || '');
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const secret = process.env.JWT_SECRET || 'potentat_pro_secret_key_2026_enterprise_pos';
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role_name, name: user.name },
        secret,
        { expiresIn: expiresIn as any }
      );

      // Log action
      await AuditLogService.log(
        user.id || null,
        'USER_LOGIN',
        `User ${user.email} logged in successfully`,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, roleId } = req.body;

      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await UserRepository.create({
        name,
        email,
        password: hashedPassword,
        role_id: roleId,
        status: 'ACTIVE'
      });

      // Log action
      const actingUserId = (req as AuthenticatedRequest).user?.id || null;
      await AuditLogService.log(
        actingUserId,
        'USER_REGISTER',
        `Registered new user: ${email} with role ID ${roleId}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await UserRepository.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await UserRepository.listRoles();
      res.status(200).json({ success: true, roles });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserRepository.listAll();
      res.status(200).json({ success: true, users });
    } catch (error) {
      next(error);
    }
  }
}
