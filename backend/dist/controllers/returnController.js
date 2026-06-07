"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnController = void 0;
const returnRepository_1 = require("../repositories/returnRepository");
const auditLogService_1 = require("../services/auditLogService");
class ReturnController {
    static async create(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User authentication missing' });
            }
            const returnData = {
                ...req.body,
                userId
            };
            const returnId = await returnRepository_1.ReturnRepository.createReturn(returnData);
            // Audit Log
            await auditLogService_1.AuditLogService.log(userId, 'RETURN_CREATE', `Processed return transaction ID ${returnId} for Sale ID ${req.body.saleId}`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Return transaction processed successfully',
                returnId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const returns = await returnRepository_1.ReturnRepository.getReturnHistory(limit);
            res.status(200).json({ success: true, returns });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDetails(req, res, next) {
        try {
            const returnId = parseInt(req.params.id);
            const returnTx = await returnRepository_1.ReturnRepository.getReturnDetails(returnId);
            if (!returnTx) {
                return res.status(404).json({ success: false, message: 'Return record not found' });
            }
            res.status(200).json({ success: true, return: returnTx });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReturnController = ReturnController;
