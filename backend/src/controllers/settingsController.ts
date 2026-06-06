import { Request, Response, NextFunction } from 'express';
import { SettingsRepository } from '../repositories/settingsRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsRepository.getSettings();
      res.status(200).json({ success: true, settings });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await SettingsRepository.updateSettings(req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'SETTINGS_UPDATE',
        'Updated global system settings configuration',
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
