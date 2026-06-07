"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const supplierRepository_1 = require("../repositories/supplierRepository");
const auditLogService_1 = require("../services/auditLogService");
class SupplierController {
    static async list(req, res, next) {
        try {
            const suppliers = await supplierRepository_1.SupplierRepository.listAll();
            res.status(200).json({ success: true, suppliers });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const supplier = await supplierRepository_1.SupplierRepository.findById(id);
            if (!supplier) {
                return res.status(404).json({ success: false, message: 'Supplier not found' });
            }
            res.status(200).json({ success: true, supplier });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const supplierId = await supplierRepository_1.SupplierRepository.create(req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'SUPPLIER_CREATE', `Created supplier ${req.body.name} (ID: ${supplierId})`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Supplier created successfully',
                supplierId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            await supplierRepository_1.SupplierRepository.update(id, req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'SUPPLIER_UPDATE', `Updated supplier details for supplier ID ${id}`, req.ip);
            res.status(200).json({
                success: true,
                message: 'Supplier updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createPurchase(req, res, next) {
        try {
            const purchaseId = await supplierRepository_1.SupplierRepository.createPurchase(req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'PURCHASE_CREATE', `Created supplier purchase transaction ID ${purchaseId} ref ${req.body.referenceNo}`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Stock purchase registered and inventory updated successfully',
                purchaseId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async listPurchases(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const purchases = await supplierRepository_1.SupplierRepository.getPurchases(limit);
            res.status(200).json({ success: true, purchases });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPurchaseHistory(req, res, next) {
        try {
            const supplierId = parseInt(req.params.id);
            const history = await supplierRepository_1.SupplierRepository.getPurchaseHistory(supplierId);
            res.status(200).json({ success: true, history });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SupplierController = SupplierController;
