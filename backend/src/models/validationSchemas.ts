import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.number().int().positive('Role ID must be a positive integer'),
  }),
});

export const productVariantSchema = z.object({
  variantName: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  costPrice: z.number().nonnegative('Cost price must be positive'),
  retailPrice: z.number().nonnegative('Retail price must be positive'),
  stockQuantity: z.number().int().nonnegative('Stock must be positive or zero'),
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'Base SKU is required'),
    barcode: z.string().optional(),
    qrCode: z.string().optional(),
    categoryId: z.number().int().positive('Category ID is required'),
    brandId: z.number().int().positive('Brand ID is required'),
    costPrice: z.number().nonnegative('Cost price must be positive'),
    retailPrice: z.number().nonnegative('Retail price must be positive'),
    alertQuantity: z.number().int().nonnegative().default(5),
    description: z.string().optional(),
    hasVariants: z.boolean().default(false),
    variants: z.array(productVariantSchema).optional(),
    imeis: z.array(z.string()).optional(), // Optional list of initial IMEIs for simple tracking
  }),
});

export const customerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const supplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Supplier name is required'),
    contactName: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  imeis: z.array(z.string()).optional(), // IMEIs sold
});

export const paymentSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'PARTIAL', 'DEBT']),
  amount: z.number().positive(),
  transactionRef: z.string().optional(),
});

export const saleSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().nullable().optional(),
    items: z.array(saleItemSchema).min(1, 'Sale must include at least one item'),
    discountAmount: z.number().nonnegative().default(0),
    taxAmount: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative(),
    payments: z.array(paymentSchema).min(1, 'At least one payment must be specified'),
    notes: z.string().optional(),
  }),
});

export const purchaseItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  imeis: z.array(z.string()).optional(), // New IMEIs purchased
});

export const purchaseSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive(),
    referenceNo: z.string().min(2),
    purchaseDate: z.string(), // YYYY-MM-DD
    items: z.array(purchaseItemSchema).min(1, 'Purchase must include at least one item'),
    paidAmount: z.number().nonnegative(),
    notes: z.string().optional(),
  }),
});

export const returnItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().positive(),
  refundAmount: z.number().nonnegative(),
  imeis: z.array(z.string()).optional(), // IMEIs returned
});

export const returnSchema = z.object({
  body: z.object({
    saleId: z.number().int().positive(),
    type: z.enum(['WARRANTY', 'DAMAGED', 'STANDARD']),
    items: z.array(returnItemSchema).min(1, 'Return must include at least one item'),
    notes: z.string().optional(),
  }),
});

export const expenseSchema = z.object({
  body: z.object({
    category: z.string().min(2),
    amount: z.number().positive(),
    expenseDate: z.string(),
    notes: z.string().optional(),
  }),
});

export const settingsSchema = z.object({
  body: z.record(z.string()),
});
