"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const productController_1 = require("../controllers/productController");
const saleController_1 = require("../controllers/saleController");
const returnController_1 = require("../controllers/returnController");
const customerController_1 = require("../controllers/customerController");
const supplierController_1 = require("../controllers/supplierController");
const reportController_1 = require("../controllers/reportController");
const settingsController_1 = require("../controllers/settingsController");
const auditController_1 = require("../controllers/auditController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validationSchemas_1 = require("../models/validationSchemas");
const router = (0, express_1.Router)();
// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', rateLimiter_1.authLimiter, (0, validate_1.validateRequest)(validationSchemas_1.loginSchema), authController_1.AuthController.login);
router.post('/auth/register', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin']), (0, validate_1.validateRequest)(validationSchemas_1.registerSchema), authController_1.AuthController.register);
router.get('/auth/profile', auth_1.authenticateJWT, authController_1.AuthController.getProfile);
router.get('/auth/roles', auth_1.authenticateJWT, authController_1.AuthController.getRoles);
router.get('/auth/users', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), authController_1.AuthController.getUsers);
// ==========================================
// PRODUCTS & INVENTORY ROUTES
// ==========================================
router.get('/products', auth_1.authenticateJWT, productController_1.ProductController.list);
router.get('/products/lookup', auth_1.authenticateJWT, productController_1.ProductController.lookupProduct);
router.get('/products/movements', auth_1.authenticateJWT, productController_1.ProductController.getStockMovements);
router.get('/products/:id', auth_1.authenticateJWT, productController_1.ProductController.getById);
router.post('/products', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.productSchema), productController_1.ProductController.create);
router.put('/products/:id', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.productSchema), productController_1.ProductController.update);
router.get('/categories', auth_1.authenticateJWT, productController_1.ProductController.getCategories);
router.get('/brands', auth_1.authenticateJWT, productController_1.ProductController.getBrands);
// ==========================================
// POINT OF SALE (POS) ROUTES
// ==========================================
router.post('/sales', auth_1.authenticateJWT, (0, validate_1.validateRequest)(validationSchemas_1.saleSchema), saleController_1.SaleController.create);
router.get('/sales', auth_1.authenticateJWT, saleController_1.SaleController.list);
router.get('/sales/:id', auth_1.authenticateJWT, saleController_1.SaleController.getDetails);
router.get('/sales/:id/receipt', auth_1.authenticateJWT, saleController_1.SaleController.getReceipt);
// ==========================================
// RETURNS MANAGEMENT ROUTES
// ==========================================
router.post('/returns', auth_1.authenticateJWT, (0, validate_1.validateRequest)(validationSchemas_1.returnSchema), returnController_1.ReturnController.create);
router.get('/returns', auth_1.authenticateJWT, returnController_1.ReturnController.list);
router.get('/returns/:id', auth_1.authenticateJWT, returnController_1.ReturnController.getDetails);
// ==========================================
// CUSTOMERS ROUTES
// ==========================================
router.get('/customers', auth_1.authenticateJWT, customerController_1.CustomerController.list);
router.get('/customers/:id', auth_1.authenticateJWT, customerController_1.CustomerController.getById);
router.get('/customers/:id/history', auth_1.authenticateJWT, customerController_1.CustomerController.getHistory);
router.post('/customers', auth_1.authenticateJWT, (0, validate_1.validateRequest)(validationSchemas_1.customerSchema), customerController_1.CustomerController.create);
router.put('/customers/:id', auth_1.authenticateJWT, (0, validate_1.validateRequest)(validationSchemas_1.customerSchema), customerController_1.CustomerController.update);
router.post('/customers/:id/pay-debt', auth_1.authenticateJWT, customerController_1.CustomerController.payDebt);
// ==========================================
// SUPPLIERS & PURCHASES ROUTES
// ==========================================
router.get('/suppliers', auth_1.authenticateJWT, supplierController_1.SupplierController.list);
router.get('/suppliers/:id', auth_1.authenticateJWT, supplierController_1.SupplierController.getById);
router.post('/suppliers', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.supplierSchema), supplierController_1.SupplierController.create);
router.put('/suppliers/:id', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.supplierSchema), supplierController_1.SupplierController.update);
router.post('/suppliers/purchases', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.purchaseSchema), supplierController_1.SupplierController.createPurchase);
router.get('/suppliers/purchases/list', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), supplierController_1.SupplierController.listPurchases);
router.get('/suppliers/:id/purchases', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), supplierController_1.SupplierController.getPurchaseHistory);
// ==========================================
// STATISTICS & REPORTS ROUTES
// ==========================================
router.get('/reports/dashboard', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), reportController_1.ReportController.getDashboard);
router.get('/reports/charts', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), reportController_1.ReportController.getCharts);
router.get('/reports/sales', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), reportController_1.ReportController.getSalesReport);
router.get('/reports/expenses', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), reportController_1.ReportController.getExpensesReport);
router.get('/reports/stock-value', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), reportController_1.ReportController.getStockValueReport);
router.post('/reports/expenses', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin', 'Manager']), (0, validate_1.validateRequest)(validationSchemas_1.expenseSchema), reportController_1.ReportController.createExpense);
// ==========================================
// SETTINGS ROUTES
// ==========================================
router.get('/settings', auth_1.authenticateJWT, settingsController_1.SettingsController.get);
router.put('/settings', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin']), (0, validate_1.validateRequest)(validationSchemas_1.settingsSchema), settingsController_1.SettingsController.update);
// ==========================================
// AUDIT LOGS ROUTES
// ==========================================
router.get('/audit/logs', auth_1.authenticateJWT, (0, auth_1.requireRole)(['Admin']), auditController_1.AuditController.getLogs);
exports.default = router;
