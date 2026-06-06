import { Response, NextFunction } from 'express';
import { ReturnRepository } from '../repositories/returnRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class ReturnController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User authentication missing' });
      }

      const returnData = {
        ...req.body,
        userId
      };

      const returnId = await ReturnRepository.createReturn(returnData);

      // Audit Log
      await AuditLogService.log(
        userId,
        'RETURN_CREATE',
        `Processed return transaction ID ${returnId} for Sale ID ${req.body.saleId}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Return transaction processed successfully',
        returnId
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const returns = await ReturnRepository.getReturnHistory(limit);
      res.status(200).json({ success: true, returns });
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const returnId = parseInt(req.params.id);
      const returnTx = await ReturnRepository.getReturnDetails(returnId);

      if (!returnTx) {
        return res.status(404).json({ success: false, message: 'Return record not found' });
      }

      res.status(200).json({ success: true, return: returnTx });
    } catch (error) {
      next(error);
    }
  }
}
