"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsSchema = exports.expenseSchema = exports.returnSchema = exports.returnItemSchema = exports.purchaseSchema = exports.purchaseItemSchema = exports.saleSchema = exports.paymentSchema = exports.saleItemSchema = exports.supplierSchema = exports.customerSchema = exports.productSchema = exports.productVariantSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        roleId: zod_1.z.number().int().positive('Role ID must be a positive integer'),
    }),
});
exports.productVariantSchema = zod_1.z.object({
    variantName: zod_1.z.string().min(1, 'Variant name is required'),
    sku: zod_1.z.string().min(2, 'SKU is required'),
    barcode: zod_1.z.string().optional(),
    qrCode: zod_1.z.string().optional(),
    costPrice: zod_1.z.number().nonnegative('Cost price must be positive'),
    retailPrice: zod_1.z.number().nonnegative('Retail price must be positive'),
    stockQuantity: zod_1.z.number().int().nonnegative('Stock must be positive or zero'),
});
exports.productSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Product name is required'),
        sku: zod_1.z.string().min(2, 'Base SKU is required'),
        barcode: zod_1.z.string().optional(),
        qrCode: zod_1.z.string().optional(),
        categoryId: zod_1.z.number().int().positive('Category ID is required'),
        brandId: zod_1.z.number().int().positive('Brand ID is required'),
        costPrice: zod_1.z.number().nonnegative('Cost price must be positive'),
        retailPrice: zod_1.z.number().nonnegative('Retail price must be positive'),
        alertQuantity: zod_1.z.number().int().nonnegative().default(5),
        description: zod_1.z.string().optional(),
        hasVariants: zod_1.z.boolean().default(false),
        variants: zod_1.z.array(exports.productVariantSchema).optional(),
        imeis: zod_1.z.array(zod_1.z.string()).optional(), // Optional list of initial IMEIs for simple tracking
    }),
});
exports.customerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Customer name is required'),
        email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }),
});
exports.supplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Supplier name is required'),
        contactName: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }),
});
exports.saleItemSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    variantId: zod_1.z.number().int().positive().nullable(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    discountAmount: zod_1.z.number().nonnegative().default(0),
    imeis: zod_1.z.array(zod_1.z.string()).optional(), // IMEIs sold
});
exports.paymentSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'PARTIAL', 'DEBT']),
    amount: zod_1.z.number().positive(),
    transactionRef: zod_1.z.string().optional(),
});
exports.saleSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.number().int().positive().nullable().optional(),
        items: zod_1.z.array(exports.saleItemSchema).min(1, 'Sale must include at least one item'),
        discountAmount: zod_1.z.number().nonnegative().default(0),
        taxAmount: zod_1.z.number().nonnegative().default(0),
        paidAmount: zod_1.z.number().nonnegative(),
        payments: zod_1.z.array(exports.paymentSchema).min(1, 'At least one payment must be specified'),
        notes: zod_1.z.string().optional(),
    }),
});
exports.purchaseItemSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    variantId: zod_1.z.number().int().positive().nullable(),
    quantity: zod_1.z.number().int().positive(),
    costPrice: zod_1.z.number().nonnegative(),
    imeis: zod_1.z.array(zod_1.z.string()).optional(), // New IMEIs purchased
});
exports.purchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        supplierId: zod_1.z.number().int().positive(),
        referenceNo: zod_1.z.string().min(2),
        purchaseDate: zod_1.z.string(), // YYYY-MM-DD
        items: zod_1.z.array(exports.purchaseItemSchema).min(1, 'Purchase must include at least one item'),
        paidAmount: zod_1.z.number().nonnegative(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.returnItemSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    variantId: zod_1.z.number().int().positive().nullable(),
    quantity: zod_1.z.number().int().positive(),
    refundAmount: zod_1.z.number().nonnegative(),
    imeis: zod_1.z.array(zod_1.z.string()).optional(), // IMEIs returned
});
exports.returnSchema = zod_1.z.object({
    body: zod_1.z.object({
        saleId: zod_1.z.number().int().positive(),
        type: zod_1.z.enum(['WARRANTY', 'DAMAGED', 'STANDARD']),
        items: zod_1.z.array(exports.returnItemSchema).min(1, 'Return must include at least one item'),
        notes: zod_1.z.string().optional(),
    }),
});
exports.expenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string().min(2),
        amount: zod_1.z.number().positive(),
        expenseDate: zod_1.z.string(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.settingsSchema = zod_1.z.object({
    body: zod_1.z.record(zod_1.z.string()),
});
