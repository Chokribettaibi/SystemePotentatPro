"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const reportRepository_1 = require("../repositories/reportRepository");
const auditLogService_1 = require("../services/auditLogService");
class ReportController {
    static async getDashboard(req, res, next) {
        try {
            const stats = await reportRepository_1.ReportRepository.getDashboardStats();
            res.status(200).json({ success: true, stats });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCharts(req, res, next) {
        try {
            const charts = await reportRepository_1.ReportRepository.getChartsData();
            res.status(200).json({ success: true, charts });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSalesReport(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const sales = await reportRepository_1.ReportRepository.getSalesReport(startDate, endDate);
            res.status(200).json({ success: true, report: sales });
        }
        catch (error) {
            next(error);
        }
    }
    static async getExpensesReport(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const expenses = await reportRepository_1.ReportRepository.getExpensesReport(startDate, endDate);
            res.status(200).json({ success: true, report: expenses });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStockValueReport(req, res, next) {
        try {
            const stock = await reportRepository_1.ReportRepository.getStockValueReport();
            res.status(200).json({ success: true, report: stock });
        }
        catch (error) {
            next(error);
        }
    }
    static async createExpense(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User unauthorized' });
            }
            const expenseId = await reportRepository_1.ReportRepository.addExpense(req.body, userId);
            // Audit Log
            await auditLogService_1.AuditLogService.log(userId, 'EXPENSE_CREATE', `Logged business expense for category '${req.body.category}' amount $${req.body.amount}`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Expense logged successfully',
                expenseId
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
