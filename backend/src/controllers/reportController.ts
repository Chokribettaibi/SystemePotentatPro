import { Request, Response, NextFunction } from 'express';
import { ReportRepository } from '../repositories/reportRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class ReportController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ReportRepository.getDashboardStats();
      res.status(200).json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  }

  static async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const charts = await ReportRepository.getChartsData();
      res.status(200).json({ success: true, charts });
    } catch (error) {
      next(error);
    }
  }

  static async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const sales = await ReportRepository.getSalesReport(startDate, endDate);
      res.status(200).json({ success: true, report: sales });
    } catch (error) {
      next(error);
    }
  }

  static async getExpensesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const expenses = await ReportRepository.getExpensesReport(startDate, endDate);
      res.status(200).json({ success: true, report: expenses });
    } catch (error) {
      next(error);
    }
  }

  static async getStockValueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const stock = await ReportRepository.getStockValueReport();
      res.status(200).json({ success: true, report: stock });
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User unauthorized' });
      }

      const expenseId = await ReportRepository.addExpense(req.body, userId);

      // Audit Log
      await AuditLogService.log(
        userId,
        'EXPENSE_CREATE',
        `Logged business expense for category '${req.body.category}' amount $${req.body.amount}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Expense logged successfully',
        expenseId
      });
    } catch (error) {
      next(error);
    }
  }
}
