import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../repositories/customerRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await CustomerRepository.listAll();
      res.status(200).json({ success: true, customers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const customer = await CustomerRepository.findById(id);
      
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      res.status(200).json({ success: true, customer });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const history = await CustomerRepository.getPurchaseHistory(id);
      res.status(200).json({ success: true, history });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = await CustomerRepository.create(req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'CUSTOMER_CREATE',
        `Created customer ${req.body.name} (ID: ${customerId})`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        customerId
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await CustomerRepository.update(id, req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'CUSTOMER_UPDATE',
        `Updated customer details for customer ID ${id}`,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async payDebt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { amount, paymentMethod } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
      }

      await CustomerRepository.payDebt(id, amount, paymentMethod || 'CASH');

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'CUSTOMER_DEBT_PAY',
        `Customer ID ${id} paid debt: $${amount.toFixed(2)} using ${paymentMethod}`,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Debt payment recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
