import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { ProductController } from '../controllers/productController';
import { SaleController } from '../controllers/saleController';
import { ReturnController } from '../controllers/returnController';
import { CustomerController } from '../controllers/customerController';
import { SupplierController } from '../controllers/supplierController';
import { ReportController } from '../controllers/reportController';
import { SettingsController } from '../controllers/settingsController';
import { AuditController } from '../controllers/auditController';

import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

import {
  loginSchema,
  registerSchema,
  productSchema,
  customerSchema,
  supplierSchema,
  saleSchema,
  purchaseSchema,
  returnSchema,
  expenseSchema,
  settingsSchema
} from '../models/validationSchemas';

const router = Router();

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/auth/register', authenticateJWT, requireRole(['Admin']), validateRequest(registerSchema), AuthController.register);
router.get('/auth/profile', authenticateJWT, AuthController.getProfile);
router.get('/auth/roles', authenticateJWT, AuthController.getRoles);
router.get('/auth/users', authenticateJWT, requireRole(['Admin', 'Manager']), AuthController.getUsers);

// ==========================================
// PRODUCTS & INVENTORY ROUTES
// ==========================================
router.get('/products', authenticateJWT, ProductController.list);
router.get('/products/lookup', authenticateJWT, ProductController.lookupProduct);
router.get('/products/movements', authenticateJWT, ProductController.getStockMovements);
router.get('/products/:id', authenticateJWT, ProductController.getById);
router.post('/products', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(productSchema), ProductController.create);
router.put('/products/:id', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(productSchema), ProductController.update);

router.get('/categories', authenticateJWT, ProductController.getCategories);
router.get('/brands', authenticateJWT, ProductController.getBrands);

// ==========================================
// POINT OF SALE (POS) ROUTES
// ==========================================
router.post('/sales', authenticateJWT, validateRequest(saleSchema), SaleController.create);
router.get('/sales', authenticateJWT, SaleController.list);
router.get('/sales/:id', authenticateJWT, SaleController.getDetails);
router.get('/sales/:id/receipt', authenticateJWT, SaleController.getReceipt);

// ==========================================
// RETURNS MANAGEMENT ROUTES
// ==========================================
router.post('/returns', authenticateJWT, validateRequest(returnSchema), ReturnController.create);
router.get('/returns', authenticateJWT, ReturnController.list);
router.get('/returns/:id', authenticateJWT, ReturnController.getDetails);

// ==========================================
// CUSTOMERS ROUTES
// ==========================================
router.get('/customers', authenticateJWT, CustomerController.list);
router.get('/customers/:id', authenticateJWT, CustomerController.getById);
router.get('/customers/:id/history', authenticateJWT, CustomerController.getHistory);
router.post('/customers', authenticateJWT, validateRequest(customerSchema), CustomerController.create);
router.put('/customers/:id', authenticateJWT, validateRequest(customerSchema), CustomerController.update);
router.post('/customers/:id/pay-debt', authenticateJWT, CustomerController.payDebt);

// ==========================================
// SUPPLIERS & PURCHASES ROUTES
// ==========================================
router.get('/suppliers', authenticateJWT, SupplierController.list);
router.get('/suppliers/:id', authenticateJWT, SupplierController.getById);
router.post('/suppliers', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(supplierSchema), SupplierController.create);
router.put('/suppliers/:id', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(supplierSchema), SupplierController.update);

router.post('/suppliers/purchases', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(purchaseSchema), SupplierController.createPurchase);
router.get('/suppliers/purchases/list', authenticateJWT, requireRole(['Admin', 'Manager']), SupplierController.listPurchases);
router.get('/suppliers/:id/purchases', authenticateJWT, requireRole(['Admin', 'Manager']), SupplierController.getPurchaseHistory);

// ==========================================
// STATISTICS & REPORTS ROUTES
// ==========================================
router.get('/reports/dashboard', authenticateJWT, requireRole(['Admin', 'Manager']), ReportController.getDashboard);
router.get('/reports/charts', authenticateJWT, requireRole(['Admin', 'Manager']), ReportController.getCharts);
router.get('/reports/sales', authenticateJWT, requireRole(['Admin', 'Manager']), ReportController.getSalesReport);
router.get('/reports/expenses', authenticateJWT, requireRole(['Admin', 'Manager']), ReportController.getExpensesReport);
router.get('/reports/stock-value', authenticateJWT, requireRole(['Admin', 'Manager']), ReportController.getStockValueReport);
router.post('/reports/expenses', authenticateJWT, requireRole(['Admin', 'Manager']), validateRequest(expenseSchema), ReportController.createExpense);

// ==========================================
// SETTINGS ROUTES
// ==========================================
router.get('/settings', authenticateJWT, SettingsController.get);
router.put('/settings', authenticateJWT, requireRole(['Admin']), validateRequest(settingsSchema), SettingsController.update);

// ==========================================
// AUDIT LOGS ROUTES
// ==========================================
router.get('/audit/logs', authenticateJWT, requireRole(['Admin']), AuditController.getLogs);

export default router;
