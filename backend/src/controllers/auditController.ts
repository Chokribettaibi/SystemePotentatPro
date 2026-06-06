import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLogService';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const logs = await AuditLogService.getLogs(limit, offset);
      res.status(200).json({ success: true, logs });
    } catch (error) {
      next(error);
    }
  }
}
