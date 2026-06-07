"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const productRepository_1 = require("../repositories/productRepository");
const auditLogService_1 = require("../services/auditLogService");
class ProductController {
    static async list(req, res, next) {
        try {
            const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
            const brandId = req.query.brandId ? parseInt(req.query.brandId) : undefined;
            const search = req.query.search;
            const lowStockOnly = req.query.lowStock === 'true';
            const products = await productRepository_1.ProductRepository.listProducts({
                categoryId,
                brandId,
                search,
                lowStockOnly
            });
            res.status(200).json({ success: true, products });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const product = await productRepository_1.ProductRepository.findById(id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            res.status(200).json({ success: true, product });
        }
        catch (error) {
            next(error);
        }
    }
    static async lookupProduct(req, res, next) {
        try {
            const code = req.query.code;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Scan code is required' });
            }
            const lookup = await productRepository_1.ProductRepository.findBySkuOrBarcode(code);
            if (!lookup) {
                return res.status(404).json({ success: false, message: 'No product or variant found matching the code' });
            }
            res.status(200).json({ success: true, match: lookup });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const productId = await productRepository_1.ProductRepository.createProduct(req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'PRODUCT_CREATE', `Created product ${req.body.name} (SKU: ${req.body.sku}) with ID ${productId}`, req.ip);
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                productId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            await productRepository_1.ProductRepository.updateProduct(id, req.body);
            // Audit Log
            await auditLogService_1.AuditLogService.log(req.user?.id || null, 'PRODUCT_UPDATE', `Updated product details for product ID ${id}`, req.ip);
            res.status(200).json({
                success: true,
                message: 'Product updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategories(req, res, next) {
        try {
            const categories = await productRepository_1.ProductRepository.listCategories();
            res.status(200).json({ success: true, categories });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBrands(req, res, next) {
        try {
            const brands = await productRepository_1.ProductRepository.listBrands();
            res.status(200).json({ success: true, brands });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStockMovements(req, res, next) {
        try {
            const productId = req.query.productId ? parseInt(req.query.productId) : undefined;
            const movements = await productRepository_1.ProductRepository.getStockMovements(productId);
            res.status(200).json({ success: true, movements });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
