"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customerRepository_1 = require("../repositories/customerRepository");
const auditLogService_1 = require("../services/auditLogService");
class CustomerController {
    static async list(req, res, next) {
        try {
            const customers = await customerRepository_1.CustomerRepository.listAll();
            res.status(200).json({ success: true, customers });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const customer = await customerRepository_1.CustomerRepository.findById(id);
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }
            res.status(200).json({ success: true, customer });
        }
        catch (error) {
            next(error);
        }
    }
    static async getHistory(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const history = await customerRepository_1.CustomerRepository.getPurchaseHistory(id);
            res.status(200).json({ success: true, history });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const customerId = await customerRepository_1.CustomerRepository.create(req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'CUSTOMER_CREATE', `Created customer ${req.body.name} (ID: ${customerId})`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                customerId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            await customerRepository_1.CustomerRepository.update(id, req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'CUSTOMER_UPDATE', `Updated customer details for customer ID ${id}`, req.ip);
            res.status(200).json({
                success: true,
                message: 'Customer updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async payDebt(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const { amount, paymentMethod } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
            }
            await customerRepository_1.CustomerRepository.payDebt(id, amount, paymentMethod || 'CASH');
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'CUSTOMER_DEBT_PAY', `Customer ID ${id} paid debt: $${amount.toFixed(2)} using ${paymentMethod}`, req.ip);
            res.status(200).json({
                success: true,
                message: 'Debt payment recorded successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
