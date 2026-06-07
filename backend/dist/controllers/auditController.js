"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const auditLogService_1 = require("../services/auditLogService");
class AuditController {
    static async getLogs(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const logs = await auditLogService_1.AuditLogService.getLogs(limit, offset);
            res.status(200).json({ success: true, logs });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
