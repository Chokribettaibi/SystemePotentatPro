import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'potentat_pro_secret_key_2026_enterprise_pos';

    jwt.verify(token, secret, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Authorization token required' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};
