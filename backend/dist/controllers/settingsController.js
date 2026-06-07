"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settingsRepository_1 = require("../repositories/settingsRepository");
const auditLogService_1 = require("../services/auditLogService");
class SettingsController {
    static async get(req, res, next) {
        try {
            const settings = await settingsRepository_1.SettingsRepository.getSettings();
            res.status(200).json({ success: true, settings });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            await settingsRepository_1.SettingsRepository.updateSettings(req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'SETTINGS_UPDATE', 'Updated global system settings configuration', req.ip);
            res.status(200).json({
                success: true,
                message: 'Settings updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
