'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Employee';
}

export interface Variant {
  id: number;
  variant_name: string;
  sku: string;
  barcode?: string;
  qr_code?: string;
  cost_price: number;
  retail_price: number;
  stock_quantity: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  qr_code?: string;
  category_id: number;
  brand_id: number;
  category_name: string;
  brand_name: string;
  cost_price: number;
  retail_price: number;
  alert_quantity: number;
  status: string;
  description: string;
  has_variants: boolean;
  variants: Variant[];
  total_stock?: number;
}

export interface CartItem {
  product: Product;
  variant: Variant;
  quantity: number;
  discount: number; // custom discount per item
  imeis?: string[];
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyalty_points: number;
  balance: number; // outstanding debt
}

export interface Supplier {
  id: number;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  customer_name: string;
  cashier_name: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  paid_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: string;
  notes?: string;
}

export interface Return {
  id: number;
  invoice_number: string;
  return_date: string;
  cashier_name: string;
  total_refund: number;
  type: 'WARRANTY' | 'DAMAGED' | 'STANDARD';
  notes?: string;
}

export interface AuditLog {
  id: number;
  created_at: string;
  user_name: string;
  role_name: string;
  action: string;
  details: string;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  theme: 'dark' | 'light';
  settings: Record<string, string>;
  products: Product[];
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  returns: Return[];
  auditLogs: AuditLog[];
  cart: CartItem[];
  currentCustomer: Customer | null;
  isApiOnline: boolean;
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;

  // POS actions
  addToCart: (product: Product, variant: Variant, quantity?: number) => void;
  removeFromCart: (variantId: number) => void;
  updateCartQty: (variantId: number, qty: number) => void;
  updateCartDiscount: (variantId: number, discount: number) => void;
  updateCartImeis: (variantId: number, imeis: string[]) => void;
  clearCart: () => void;
  setCurrentCustomer: (customer: Customer | null) => void;
  checkoutCart: (paidAmount: number, paymentMethod: string, notes?: string, taxRateOverride?: number, discountOverride?: number) => Promise<any>;

  // Inventory actions
  saveProduct: (productData: any) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
  replenishStock: (purchaseData: any) => Promise<boolean>;

  // Returns actions
  processReturn: (returnData: any) => Promise<boolean>;

  // Customer/Supplier actions
  saveCustomer: (customerData: any) => Promise<boolean>;
  recordCustomerPayment: (customerId: number, amount: number, method: string) => Promise<boolean>;
  saveSupplier: (supplierData: any) => Promise<boolean>;

  // Settings action
  saveSettings: (settingsData: Record<string, string>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isApiOnline, setIsApiOnline] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentCustomer, setCurrentCustomerSelected] = useState<Customer | null>(null);

  // Core records states (pre-populated with mock data for instant demo mode if backend is not started yet)
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: 'Potentat Pro Store',
    store_phone: '+1-555-POTENTAT',
    store_email: 'contact@potentatpro.com',
    store_address: '777 Futuristic Blvd, Suite 101, Cyber City',
    currency_symbol: '$',
    currency_code: 'USD',
    tax_rate: '12.5',
    logo_url: '/images/logo-neon.png',
    loyalty_points_per_dollar: '1'
  });

  const [categories, setCategories] = useState([
    { id: 1, name: 'Smartphones' },
    { id: 2, name: 'Tablets' },
    { id: 3, name: 'Smart Watches' },
    { id: 4, name: 'Chargers' },
    { id: 5, name: 'Fast Chargers' },
    { id: 6, name: 'Power Banks' },
    { id: 7, name: 'Earphones' },
    { id: 8, name: 'Wireless Earbuds' },
    { id: 9, name: 'Bluetooth Speakers' },
    { id: 10, name: 'Phone Cases' },
    { id: 11, name: 'Screen Protectors' },
    { id: 12, name: 'Cables' },
    { id: 13, name: 'Accessories' },
    { id: 14, name: 'SIM Cards' }
  ]);

  const [brands, setBrands] = useState([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'Xiaomi' },
    { id: 4, name: 'Huawei' },
    { id: 5, name: 'OnePlus' },
    { id: 6, name: 'Anker' },
    { id: 7, name: 'JBL' },
    { id: 8, name: 'Baseus' },
    { id: 9, name: 'Generic' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'iPhone 15 Pro',
      sku: 'IPHONE15PRO',
      barcode: '190199123456',
      qr_code: 'QR-IPH15P',
      category_id: 1,
      brand_id: 1,
      category_name: 'Smartphones',
      brand_name: 'Apple',
      cost_price: 800.00,
      retail_price: 999.00,
      alert_quantity: 3,
      status: 'ACTIVE',
      description: 'Apple iPhone 15 Pro titanium finish',
      has_variants: true,
      variants: [
        { id: 101, variant_name: 'Natural Titanium 128GB', sku: 'IPH15PRO-NT-128', barcode: '190199123457', qr_code: 'QR-IPH15P-NT128', cost_price: 800.00, retail_price: 999.00, stock_quantity: 10 },
        { id: 102, variant_name: 'Blue Titanium 256GB', sku: 'IPH15PRO-BT-256', barcode: '190199123458', qr_code: 'QR-IPH15P-BT256', cost_price: 900.00, retail_price: 1099.00, stock_quantity: 5 }
      ],
      total_stock: 15
    },
    {
      id: 2,
      name: 'Galaxy S24 Ultra',
      sku: 'S24ULTRA',
      barcode: '8806091234567',
      qr_code: 'QR-S24U',
      category_id: 1,
      brand_id: 2,
      category_name: 'Smartphones',
      brand_name: 'Samsung',
      cost_price: 950.00,
      retail_price: 1199.00,
      alert_quantity: 2,
      status: 'ACTIVE',
      description: 'Samsung Galaxy S24 Ultra AI Smartphone',
      has_variants: false,
      variants: [
        { id: 201, variant_name: 'Standard Black 256GB', sku: 'S24ULTRA-BK-256', barcode: '8806091234567', qr_code: 'QR-S24U', cost_price: 950.00, retail_price: 1199.00, stock_quantity: 8 }
      ],
      total_stock: 8
    },
    {
      id: 3,
      name: 'Anker Nano II 65W',
      sku: 'ANKERNANO65W',
      barcode: '848061023456',
      qr_code: 'QR-ANKN65',
      category_id: 5,
      brand_id: 6,
      category_name: 'Fast Chargers',
      brand_name: 'Anker',
      cost_price: 15.00,
      retail_price: 29.99,
      alert_quantity: 10,
      status: 'ACTIVE',
      description: 'Anker GaN II fast wall charger 65W',
      has_variants: false,
      variants: [
        { id: 301, variant_name: 'Standard White', sku: 'ANKERNANO65W-WHT', barcode: '848061023456', qr_code: 'QR-ANKN65', cost_price: 15.00, retail_price: 29.99, stock_quantity: 50 }
      ],
      total_stock: 50
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: 'Walk-in Customer', email: '', phone: 'N/A', address: 'N/A', loyalty_points: 0, balance: 0 },
    { id: 2, name: 'John Doe', email: 'john.doe@gmail.com', phone: '+1-555-0123', address: '456 Elm St, Metropia', loyalty_points: 120, balance: 0 },
    { id: 3, name: 'Alice Smith', email: 'alice@example.com', phone: '+1-555-9876', address: '789 Oak Ave, Forestville', loyalty_points: 50, balance: 150.00 }
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: 'TechDistributors Corp', contact_name: 'John Miller', email: 'sales@techdist.com', phone: '+1-555-0199', address: '120 Technology Drive, San Jose, CA' },
    { id: 2, name: 'MobileWorld Wholesale', contact_name: 'Sara Connor', email: 'wholesale@mobileworld.com', phone: '+1-555-0188', address: '45 Industry Blvd, Dallas, TX' }
  ]);

  const [sales, setSales] = useState<Sale[]>([
    { id: 1001, invoice_number: 'INV-20260601-0001', sale_date: '2026-06-01T14:30:00Z', customer_name: 'John Doe', cashier_name: 'Cashier User', total_amount: 1011.50, tax_amount: 112.50, discount_amount: 100.00, paid_amount: 1011.50, payment_status: 'PAID', status: 'COMPLETED' },
    { id: 1002, invoice_number: 'INV-20260602-0002', sale_date: '2026-06-02T10:15:00Z', customer_name: 'Alice Smith', cashier_name: 'Admin User', total_amount: 29.99, tax_amount: 0.00, discount_amount: 0.00, paid_amount: 0.00, payment_status: 'UNPAID', status: 'COMPLETED' }
  ]);

  const [returns, setReturns] = useState<Return[]>([
    { id: 2001, invoice_number: 'INV-20260601-0001', return_date: '2026-06-03T11:00:00Z', cashier_name: 'Manager User', total_refund: 999.00, type: 'WARRANTY', notes: 'Defective screen replacement' }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 1, created_at: '2026-06-03T09:00:00Z', user_name: 'Admin User', role_name: 'Admin', action: 'USER_LOGIN', details: 'Admin logged in successfully' },
    { id: 2, created_at: '2026-06-03T09:15:00Z', user_name: 'Admin User', role_name: 'Admin', action: 'PRODUCT_CREATE', details: 'Created product iPhone 15 Pro' }
  ]);

  // Load state from localStorage on init if available
  useEffect(() => {
    // Read local cache
    const cachedToken = localStorage.getItem('potentat_token');
    const cachedUser = localStorage.getItem('potentat_user');
    const cachedTheme = localStorage.getItem('potentat_theme');

    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(JSON.parse(cachedUser));
    }
    if (cachedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    // Ping API to check status
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/health`, { method: 'GET' });
      if (res.ok) {
        setIsApiOnline(true);
        console.log('Connected to Potentat Pro Backend API successfully.');
        // Load operational datasets from backend
        loadApiData();
      } else {
        setIsApiOnline(false);
      }
    } catch (e) {
      setIsApiOnline(false);
      console.warn('Backend API offline. Running in Demo Sandbox mode.');
    }
  };

  const loadApiData = async () => {
    // If online, fetch categories, brands, products, customers, suppliers
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('potentat_token')}` };
    try {
      const [resProd, resCat, resBrand, resCust, resSupp, resSales, resRet] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/categories`, { headers }),
        fetch(`${API_URL}/brands`, { headers }),
        fetch(`${API_URL}/customers`, { headers }),
        fetch(`${API_URL}/suppliers`, { headers }),
        fetch(`${API_URL}/sales`, { headers }),
        fetch(`${API_URL}/returns`, { headers })
      ]);

      if (resProd.ok) {
        const d = await resProd.json();
        setProducts(d.products);
      }
      if (resCat.ok) {
        const d = await resCat.json();
        setCategories(d.categories);
      }
      if (resBrand.ok) {
        const d = await resBrand.json();
        setBrands(d.brands);
      }
      if (resCust.ok) {
        const d = await resCust.json();
        setCustomers(d.customers);
      }
      if (resSupp.ok) {
        const d = await resSupp.json();
        setSuppliers(d.suppliers);
      }
      if (resSales.ok) {
        const d = await resSales.json();
        setSales(d.sales);
      }
      if (resRet.ok) {
        const d = await resRet.json();
        setReturns(d.returns);
      }
    } catch (e) {
      console.error('Error fetching online datasets:', e);
    }
  };

  // Auth operations
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('potentat_token', data.token);
        localStorage.setItem('potentat_user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}!`);
        setIsApiOnline(true);
        // Refresh online database feeds
        loadApiData();
        return true;
      } else {
        toast.error(data.message || 'Login failed');
        return false;
      }
    } catch (e) {
      // Offline fallback login for demo purposes
      if (email.includes('@potentat.com') && password === 'Password123') {
        const mockRole = email.startsWith('admin') 
          ? 'Admin' 
          : email.startsWith('manager') 
            ? 'Manager' 
            : 'Cashier';
        const dummyUser: User = {
          id: 99,
          name: email.split('@')[0].toUpperCase() + ' (Demo)',
          email,
          role: mockRole as any
        };
        setUser(dummyUser);
        setToken('demo_token_123');
        localStorage.setItem('potentat_token', 'demo_token_123');
        localStorage.setItem('potentat_user', JSON.stringify(dummyUser));
        toast.success(`Logged in to Demo Mode as ${dummyUser.name}`);
        return true;
      }
      toast.error('Unable to connect to backend server. Double check your MySQL connection.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('potentat_token');
    localStorage.removeItem('potentat_user');
    setCart([]);
    toast.success('Logged out successfully.');
  };

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      localStorage.setItem('potentat_theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      localStorage.setItem('potentat_theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  };

  // Cart actions
  const addToCart = (product: Product, variant: Variant, quantity = 1) => {
    // Check if variant stock is 0 or less
    if (variant.stock_quantity <= 0) {
      toast.error(`Out of stock: Variant ${variant.variant_name} is out of stock`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variant.id === variant.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > variant.stock_quantity) {
          toast.error(`Out of Stock: Only ${variant.stock_quantity} units available.`);
          return prev;
        }
        toast.success(`Added ${product.name} (${variant.variant_name}) to cart.`);
        return prev.map(item => item.variant.id === variant.id ? { ...item, quantity: newQty } : item);
      }
      toast.success(`Added ${product.name} (${variant.variant_name}) to cart.`);
      return [...prev, { product, variant, quantity, discount: 0, imeis: [] }];
    });
  };

  const removeFromCart = (variantId: number) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const updateCartQty = (variantId: number, qty: number) => {
    setCart(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        if (qty > item.variant.stock_quantity) {
          toast.error(`Only ${item.variant.stock_quantity} units available.`);
          return item;
        }
        return { ...item, quantity: Math.max(1, qty) };
      }
      return item;
    }));
  };

  const updateCartDiscount = (variantId: number, discount: number) => {
    setCart(prev => prev.map(item => 
      item.variant.id === variantId ? { ...item, discount: Math.max(0, discount) } : item
    ));
  };

  const updateCartImeis = (variantId: number, imeis: string[]) => {
    setCart(prev => prev.map(item => 
      item.variant.id === variantId ? { ...item, imeis } : item
    ));
  };

  const clearCart = () => setCart([]);

  const setCurrentCustomer = (customer: Customer | null) => {
    setCurrentCustomerSelected(customer);
  };

  // Checkout process
  const checkoutCart = async (
    paidAmount: number, 
    paymentMethod: string, 
    notes = '',
    taxRateOverride?: number,
    discountOverride?: number
  ): Promise<any> => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return null;
    }

    const tr = taxRateOverride !== undefined ? taxRateOverride : parseFloat(settings.tax_rate);
    const subtotal = cart.reduce((sum, item) => sum + (item.variant.retail_price * item.quantity) - item.discount, 0);
    const disc = discountOverride || 0;
    const tax = Math.round((subtotal - disc) * (tr / 100) * 100) / 100;
    const grandTotal = subtotal + tax - disc;

    const payload = {
      customerId: currentCustomer?.id || null,
      items: cart.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        unitPrice: item.variant.retail_price,
        discountAmount: item.discount,
        imeis: item.imeis || []
      })),
      taxAmount: tax,
      discountAmount: disc,
      paidAmount,
      payments: [{ paymentMethod, amount: paidAmount }],
      notes
    };

    if (isApiOnline) {
      try {
        const res = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Checkout complete! Invoice: ${data.invoiceNumber}`);
          clearCart();
          setCurrentCustomerSelected(null);
          loadApiData(); // refresh product list and stock counts
          return data;
        } else {
          toast.error(data.message || 'Checkout failed');
          return null;
        }
      } catch (e) {
        console.error('Checkout failed online, falling back', e);
      }
    }

    // Mock Offline Checkout
    const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: Math.floor(Math.random() * 100000),
      invoice_number: invoiceNum,
      sale_date: new Date().toISOString(),
      customer_name: currentCustomer?.name || 'Walk-in Customer',
      cashier_name: user?.name || 'Cashier User',
      total_amount: grandTotal,
      tax_amount: tax,
      discount_amount: disc,
      paid_amount: paidAmount,
      payment_status: paidAmount >= grandTotal ? 'PAID' : paidAmount === 0 ? 'UNPAID' : 'PARTIAL',
      status: 'COMPLETED',
      notes
    };

    // Update stock in products list
    setProducts(prev => prev.map(p => {
      const matchItems = cart.filter(item => item.product.id === p.id);
      if (matchItems.length > 0) {
        const updatedVariants = p.variants.map(v => {
          const cartItem = matchItems.find(item => item.variant.id === v.id);
          if (cartItem) {
            return { ...v, stock_quantity: Math.max(0, v.stock_quantity - cartItem.quantity) };
          }
          return v;
        });
        const tot = updatedVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
        return { ...p, variants: updatedVariants, total_stock: tot };
      }
      return p;
    }));

    // Add to sales list
    setSales(prev => [newSale, ...prev]);

    // Update customer balance/points
    if (currentCustomer) {
      setCustomers(prev => prev.map(c => {
        if (c.id === currentCustomer.id) {
          const outstanding = grandTotal - paidAmount;
          return {
            ...c,
            loyalty_points: c.loyalty_points + Math.floor(grandTotal),
            balance: c.balance + (outstanding > 0 ? outstanding : 0)
          };
        }
        return c;
      }));
    }

    // Log action
    const newLog: AuditLog = {
      id: auditLogs.length + 1,
      created_at: new Date().toISOString(),
      user_name: user?.name || 'Cashier User',
      role_name: user?.role || 'Cashier',
      action: 'SALE_CREATE',
      details: `Completed sale (Demo). Invoice: ${invoiceNum}, Amount: $${grandTotal.toFixed(2)}`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    toast.success(`Checkout Complete! (Demo Sandbox Mode) Invoice ${invoiceNum}`);
    clearCart();
    setCurrentCustomerSelected(null);
    return { invoiceNumber: invoiceNum, totalAmount: grandTotal };
  };

  // Inventory actions
  const saveProduct = async (productData: any): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const url = productData.id ? `${API_URL}/products/${productData.id}` : `${API_URL}/products`;
        const method = productData.id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success(productData.id ? 'Product updated' : 'Product created');
          loadApiData();
          return true;
        } else {
          toast.error(data.message || 'Saving product failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock Offline Product Save
    if (productData.id) {
      setProducts(prev => prev.map(p => {
        if (p.id === productData.id) {
          return {
            ...p,
            ...productData,
            category_name: categories.find(c => c.id === productData.categoryId)?.name || 'Accessories',
            brand_name: brands.find(b => b.id === productData.brandId)?.name || 'Generic'
          };
        }
        return p;
      }));
      toast.success('Product updated (Demo Mode)');
    } else {
      const newProdId = Math.floor(Math.random() * 10000);
      const newProd: Product = {
        ...productData,
        id: newProdId,
        category_name: categories.find(c => c.id === productData.categoryId)?.name || 'Accessories',
        brand_name: brands.find(b => b.id === productData.brandId)?.name || 'Generic',
        variants: productData.variants || [{
          id: Math.floor(Math.random() * 100000),
          variant_name: 'Standard',
          sku: productData.sku,
          barcode: productData.barcode,
          cost_price: productData.costPrice,
          retail_price: productData.retailPrice,
          stock_quantity: 0
        }],
        total_stock: (productData.variants || []).reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0)
      };
      setProducts(prev => [...prev, newProd]);
      toast.success('Product created (Demo Mode)');
    }
    return true;
  };

  const deleteProduct = async (id: number): Promise<boolean> => {
    toast.error('To maintain integrity, products status set to INACTIVE instead of delete.');
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'INACTIVE' } : p));
    return true;
  };

  const replenishStock = async (purchaseData: any): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const res = await fetch(`${API_URL}/suppliers/purchases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(purchaseData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Restock transaction recorded');
          loadApiData();
          return true;
        } else {
          toast.error(data.message || 'Restock failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock Offline restock
    setProducts(prev => prev.map(p => {
      const restockItems = purchaseData.items.filter((item: any) => item.productId === p.id);
      if (restockItems.length > 0) {
        const updatedVariants = p.variants.map(v => {
          const restItem = restockItems.find((item: any) => item.variantId === v.id);
          if (restItem) {
            return { ...v, stock_quantity: v.stock_quantity + restItem.quantity, cost_price: restItem.costPrice };
          }
          return v;
        });
        const tot = updatedVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
        return { ...p, variants: updatedVariants, total_stock: tot };
      }
      return p;
    }));

    toast.success('Stock replenished successfully (Demo Mode)');
    return true;
  };

  // Returns
  const processReturn = async (returnData: any): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const res = await fetch(`${API_URL}/returns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(returnData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Return processed');
          loadApiData();
          return true;
        } else {
          toast.error(data.message || 'Return failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock Offline return
    const refundTotal = returnData.items.reduce((sum: number, item: any) => sum + item.refundAmount, 0);
    const saleMatch = sales.find(s => s.id === returnData.saleId);
    const invoiceNo = saleMatch ? saleMatch.invoice_number : 'INV-OLD';

    const newRet: Return = {
      id: Math.floor(Math.random() * 100000),
      invoice_number: invoiceNo,
      return_date: new Date().toISOString(),
      cashier_name: user?.name || 'Manager User',
      total_refund: refundTotal,
      type: returnData.type,
      notes: returnData.notes
    };

    setReturns(prev => [newRet, ...prev]);

    // Restore stock if not damaged type
    if (returnData.type !== 'DAMAGED') {
      setProducts(prev => prev.map(p => {
        const returnedItems = returnData.items.filter((item: any) => item.productId === p.id);
        if (returnedItems.length > 0) {
          const updatedVariants = p.variants.map(v => {
            const retItem = returnedItems.find((item: any) => item.variantId === v.id);
            if (retItem) {
              return { ...v, stock_quantity: v.stock_quantity + retItem.quantity };
            }
            return v;
          });
          const tot = updatedVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
          return { ...p, variants: updatedVariants, total_stock: tot };
        }
        return p;
      }));
    }

    toast.success('Return processed and inventory adjusted (Demo Mode)');
    return true;
  };

  // Customers / Suppliers CRUD
  const saveCustomer = async (customerData: any): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const url = customerData.id ? `${API_URL}/customers/${customerData.id}` : `${API_URL}/customers`;
        const method = customerData.id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(customerData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success(customerData.id ? 'Customer updated' : 'Customer created');
          loadApiData();
          return true;
        } else {
          toast.error(data.message || 'Saving customer failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock Offline
    if (customerData.id) {
      setCustomers(prev => prev.map(c => c.id === customerData.id ? { ...c, ...customerData } : c));
      toast.success('Customer updated (Demo Mode)');
    } else {
      const newCust = {
        id: Math.floor(Math.random() * 100000),
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        loyalty_points: 0,
        balance: 0.00
      };
      setCustomers(prev => [...prev, newCust]);
      toast.success('Customer registered (Demo Mode)');
    }
    return true;
  };

  const recordCustomerPayment = async (customerId: number, amount: number, method: string): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const res = await fetch(`${API_URL}/customers/${customerId}/pay-debt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount, paymentMethod: method })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Payment recorded');
          loadApiData();
          return true;
        } else {
          toast.error(data.message);
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock Offline debt pay
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, balance: Math.max(0, c.balance - amount) };
      }
      return c;
    }));
    toast.success('Payment recorded (Demo Mode)');
    return true;
  };

  const saveSupplier = async (supplierData: any): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const url = supplierData.id ? `${API_URL}/suppliers/${supplierData.id}` : `${API_URL}/suppliers`;
        const method = supplierData.id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(supplierData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success(supplierData.id ? 'Supplier updated' : 'Supplier created');
          loadApiData();
          return true;
        } else {
          toast.error(data.message || 'Saving supplier failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Mock
    if (supplierData.id) {
      setSuppliers(prev => prev.map(s => s.id === supplierData.id ? { ...s, ...supplierData } : s));
      toast.success('Supplier updated (Demo Mode)');
    } else {
      const newSupp = {
        id: Math.floor(Math.random() * 100000),
        name: supplierData.name,
        contact_name: supplierData.contactName || '',
        email: supplierData.email || '',
        phone: supplierData.phone || '',
        address: supplierData.address || ''
      };
      setSuppliers(prev => [...prev, newSupp]);
      toast.success('Supplier added (Demo Mode)');
    }
    return true;
  };

  const saveSettings = async (settingsData: Record<string, string>): Promise<boolean> => {
    if (isApiOnline) {
      try {
        const res = await fetch(`${API_URL}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settingsData)
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Settings updated');
          setSettings(settingsData);
          return true;
        } else {
          toast.error(data.message || 'Updating settings failed');
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setSettings(settingsData);
    toast.success('Settings updated (Demo Mode)');
    return true;
  };

  return (
    <AppContext.Provider value={{
      user,
      token,
      theme,
      settings,
      products,
      categories,
      brands,
      customers,
      suppliers,
      sales,
      returns,
      auditLogs,
      cart,
      currentCustomer,
      isApiOnline,
      login,
      logout,
      toggleTheme,
      addToCart,
      removeFromCart,
      updateCartQty,
      updateCartDiscount,
      updateCartImeis,
      clearCart,
      setCurrentCustomer,
      checkoutCart,
      saveProduct,
      deleteProduct,
      replenishStock,
      processReturn,
      saveCustomer,
      recordCustomerPayment,
      saveSupplier,
      saveSettings
    }}>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10, 16, 42, 0.9)',
            color: '#f8fafc',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            fontFamily: 'var(--font-outfit)',
          },
          success: {
            iconTheme: {
              primary: '#00F2FE',
              secondary: '#0b132b',
            },
          },
        }}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
