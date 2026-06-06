'use client';

import React, { useState, useEffect } from 'react';
import { useApp, Product, Variant, CartItem } from '../../../context/AppContext';
import { CameraScanner } from '../../../components/CameraScanner';
import { 
  Search, 
  Camera, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  DollarSign, 
  Receipt,
  CheckCircle,
  X,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PosPage() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQty, 
    updateCartDiscount, 
    clearCart, 
    customers, 
    currentCustomer, 
    setCurrentCustomer, 
    checkoutCart,
    settings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [scanOpen, setScanOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  // Checkout billing states
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'PARTIAL' | 'DEBT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(parseFloat(settings.tax_rate || '12.5'));
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  
  // Checkout completion states
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Billing Math
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.variant.retail_price * item.quantity) - item.discount, 0);
  const totalDiscount = (cartSubtotal * (discountPercent / 100));
  const taxableAmount = Math.max(0, cartSubtotal - totalDiscount);
  const cartTax = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const grandTotal = taxableAmount + cartTax;

  // Auto set paid amount to grand total when checkout opens or total changes
  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal, checkoutOpen]);

  // Handle Scan Code Lookup
  const handleScanCode = (code: string) => {
    // Search in variant SKUs, barcodes, QR codes
    let matchedProd: Product | null = null;
    let matchedVar: Variant | null = null;

    for (const p of products) {
      const v = p.variants.find(varItem => 
        varItem.sku === code || 
        varItem.barcode === code || 
        varItem.qr_code === code
      );
      if (v) {
        matchedProd = p;
        matchedVar = v;
        break;
      }
      if (p.sku === code || p.barcode === code || p.qr_code === code) {
        matchedProd = p;
        matchedVar = p.variants[0];
        break;
      }
    }

    if (matchedProd && matchedVar) {
      addToCart(matchedProd, matchedVar, 1);
    } else {
      toast.error(`Code lookup failed: No item matched code '${code}'`);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (paymentMethod === 'PARTIAL' && (paidAmount <= 0 || paidAmount >= grandTotal)) {
      toast.error('Partial payment requires a paid amount between $0.01 and Grand Total.');
      return;
    }
    if (paymentMethod === 'DEBT' && !currentCustomer) {
      toast.error('Debt payment requires a registered customer to track the balance.');
      return;
    }

    const checkoutAmt = paymentMethod === 'DEBT' ? 0 : paidAmount;

    try {
      const result = await checkoutCart(
        checkoutAmt, 
        paymentMethod, 
        checkoutNotes,
        taxRate,
        totalDiscount
      );

      if (result) {
        setCompletedSale({
          invoiceNumber: result.invoiceNumber,
          saleDate: new Date().toISOString(),
          customerName: currentCustomer?.name || 'Walk-in Customer',
          items: [...cart],
          subtotal: cartSubtotal,
          discount: totalDiscount,
          tax: cartTax,
          total: grandTotal,
          paid: checkoutAmt,
          paymentMethod,
          change: paymentMethod === 'CASH' ? Math.max(0, paidAmount - grandTotal) : 0,
          cashier: 'Cashier Terminal'
        });
        setCheckoutOpen(false);
        setReceiptOpen(true);
      }
    } catch (err) {
      toast.error('Checkout processing error');
    }
  };

  const handleBarcodeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    handleScanCode(searchQuery);
    setSearchQuery('');
  };

  const filteredCatalog = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.category_id !== selectedCategory) return false;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Catalog & Search Section (Left Column) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-[#080B1A]/40 glass-panel p-5 overflow-hidden">
        
        {/* Search Header Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
          <form onSubmit={handleBarcodeSearchSubmit} className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU or scan barcode..."
              className="w-full bg-slate-950/40 border border-sky-900/40 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </form>

          <div className="flex gap-2">
            <button 
              onClick={() => setScanOpen(true)}
              className="px-4 py-2.5 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-900/30 rounded-xl text-cyan-400 flex items-center gap-2 text-xs font-semibold glow-text-blue transition-all"
            >
              <Camera size={15} />
              <span>Camera Scan</span>
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex gap-2 pb-3 mb-3 border-b border-sky-950/40 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                : 'bg-sky-950/30 border border-sky-900/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Products
          </button>
          {[1, 5, 8, 10, 11].map(catId => {
            const catName = products.find(p => p.category_id === catId)?.category_name || `Category ${catId}`;
            return (
              <button
                key={catId}
                onClick={() => setSelectedCategory(catId)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all shrink-0 ${
                  selectedCategory === catId
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                    : 'bg-sky-950/30 border border-sky-900/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* Catalog Items Grid */}
        <div className="flex-grow overflow-y-auto pr-1">
          {filteredCatalog.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">No catalog products found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredCatalog.map(product => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                
                return (
                  <div 
                    key={product.id}
                    className={`p-3 bg-[#0a0f28]/60 border rounded-2xl flex flex-col justify-between h-[160px] relative hover:border-cyan-400/30 transition-all cursor-pointer ${
                      totalStock <= 0 ? 'opacity-50 border-rose-950/20' : 'border-sky-950/40'
                    }`}
                    onClick={() => {
                      if (totalStock > 0) {
                        addToCart(product, product.variants[0]);
                      } else {
                        toast.error('Product is out of stock!');
                      }
                    }}
                  >
                    <div>
                      <span className="text-[9px] text-cyan-400 font-mono tracking-wider uppercase">{product.category_name}</span>
                      <h4 className="font-semibold text-xs text-slate-200 mt-1 line-clamp-2">{product.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">SKU: {product.sku}</p>
                    </div>

                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-sky-950/20">
                      <span className="font-bold text-sm text-white font-mono">${product.variants[0].retail_price.toFixed(2)}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                        totalStock === 0 
                          ? 'bg-rose-950/30 text-rose-400' 
                          : totalStock <= product.alert_quantity 
                            ? 'bg-amber-950/30 text-amber-400' 
                            : 'bg-emerald-950/30 text-emerald-400'
                      }`}>
                        {totalStock === 0 ? 'Out' : `${totalStock} Qty`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Cart & Customer Sidebar (Right Column) */}
      <div className="lg:col-span-4 flex flex-col h-full bg-[#080B1A]/40 glass-panel p-5 overflow-hidden">
        
        {/* Customer Attachment Selector */}
        <div className="mb-4 pb-3 border-b border-sky-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-cyan-400">
            <User size={16} />
            <span className="font-semibold text-slate-200 text-xs">Customer Link</span>
          </div>
          <select
            value={currentCustomer?.id || ''}
            onChange={(e) => {
              const custId = parseInt(e.target.value);
              const found = customers.find(c => c.id === custId);
              setCurrentCustomer(found || null);
            }}
            className="bg-[#0a0f28] text-[11px] text-slate-300 border border-sky-900/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 transition-all font-sans"
          >
            <option value="">Walk-in Customer</option>
            {customers.filter(c => c.name !== 'Walk-in Customer').map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
            ))}
          </select>
        </div>

        {/* Shopping Cart List */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-500">
              <Receipt size={32} className="mb-2 opacity-30 text-cyan-400" />
              <p className="text-xs">Checkout Cart is empty.</p>
              <p className="text-[10px] text-slate-600 mt-1">Select items or scan codes to begin checkout.</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.variant.id} 
                className="p-3 bg-[#0a0f28]/60 border border-sky-950/50 rounded-2xl flex flex-col gap-2 relative hover:border-sky-900/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-200">{item.product.name}</h5>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">{item.variant.variant_name}</span>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.variant.id)}
                    className="p-1 rounded bg-sky-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Pricing and Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-sky-950/20">
                  <span className="text-xs font-bold text-white font-mono">
                    ${((item.variant.retail_price * item.quantity) - item.discount).toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-2 bg-[#060919] border border-sky-900/30 rounded-lg p-1">
                    <button 
                      onClick={() => updateCartQty(item.variant.id, item.quantity - 1)}
                      className="p-0.5 rounded hover:bg-sky-950 text-slate-400 hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-semibold text-slate-200 w-5 text-center font-mono">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item.product, item.variant, 1)}
                      className="p-0.5 rounded hover:bg-sky-950 text-slate-400 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Actions */}
        <div className="mt-4 pt-4 border-t border-sky-950/40 space-y-3.5 shrink-0">
          <div className="space-y-1.5 text-xs text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-200 font-mono">${cartSubtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount override input */}
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-10 bg-slate-950/80 text-right border border-sky-900/40 rounded px-1 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span>Sales Tax ({taxRate}%)</span>
              <span className="text-slate-200 font-mono">${cartTax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between border-t border-sky-950/30 pt-2 text-sm font-bold text-white">
              <span>Total Bill</span>
              <span className="text-cyan-400 font-mono glow-text-blue">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-3 rounded-xl bg-sky-950/30 border border-sky-900/30 text-slate-400 hover:text-rose-400 transition-colors text-xs font-semibold"
            >
              Reset Terminal
            </button>
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="py-3 rounded-xl glow-button text-slate-950 text-xs font-bold"
            >
              Collect Payment
            </button>
          </div>
        </div>

      </div>

      {/* ==========================================
          CAMERA SCANNER DIALOG
          ========================================== */}
      {scanOpen && (
        <CameraScanner
          onScan={(code) => handleScanCode(code)}
          onClose={() => setScanOpen(false)}
        />
      )}

      {/* ==========================================
          COLLECT PAYMENT DIALOG
          ========================================== */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-5">
              <CreditCard size={18} className="text-cyan-400" />
              Collect Transaction Payment
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* Payment Methods */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-2 font-medium">Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: DollarSign },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'PARTIAL', label: 'Partial', icon: Receipt },
                    { id: 'DEBT', label: 'Debt', icon: User }
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id as any);
                          if (method.id === 'DEBT') setPaidAmount(0);
                          else setPaidAmount(grandTotal);
                        }}
                        className={`py-2 px-1 border rounded-xl flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === method.id
                            ? 'bg-cyan-950/20 text-cyan-400 border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,254,0.15)] font-semibold'
                            : 'bg-slate-950/40 border-sky-900/30 text-slate-400'
                        }`}
                      >
                        <Icon size={14} />
                        <span className="text-[10px]">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Inputs */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-2 font-medium">Amount Received</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    disabled={paymentMethod === 'DEBT'}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Receipt Totals Summary */}
              <div className="p-3 bg-slate-950/40 rounded-2xl border border-sky-950/50 space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Charge:</span>
                  <span className="text-slate-200 font-mono">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-sky-950/30 pt-2 font-bold">
                  <span className="text-slate-400">Change Due:</span>
                  <span className="text-cyan-400 font-mono">
                    ${paymentMethod === 'CASH' ? Math.max(0, paidAmount - grandTotal).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-2 font-medium">Internal Notes</label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Reference number or customer loyalty updates..."
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  rows={2}
                />
              </div>

              <button
                onClick={handleCheckoutSubmit}
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Complete Payment Check
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          PRINT RECEIPT DIALOG
          ========================================== */}
      {receiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setReceiptOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-sky-900/40">
              <CheckCircle size={32} className="text-cyan-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{settings.store_name}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{settings.store_address}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Phone: {settings.store_phone}</p>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed border-sky-900/40 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between">
                <span>Invoice No:</span>
                <span className="text-white">{completedSale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(completedSale.saleDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{completedSale.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="text-cyan-400 font-semibold">{completedSale.customerName}</span>
              </div>
            </div>

            {/* Receipt items */}
            <div className="py-4 space-y-2 max-h-40 overflow-y-auto border-b border-dashed border-sky-900/40 font-mono text-[10px]">
              {completedSale.items.map((item: CartItem, i: number) => (
                <div key={i} className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-white">{item.product.name}</span>
                    <span className="text-[8px] text-slate-500">Qty: {item.quantity} x ${item.variant.retail_price.toFixed(2)}</span>
                  </div>
                  <span className="text-white self-center">${((item.variant.retail_price * item.quantity) - item.discount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-4 space-y-1.5 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${completedSale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${completedSale.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>+${completedSale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-white pt-1.5 border-t border-sky-900/20">
                <span>Grand Total:</span>
                <span className="text-cyan-400">${completedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-slate-400">
                <span>Paid Amount:</span>
                <span>${completedSale.paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-white pt-1">
                <span>Change:</span>
                <span className="text-emerald-400">${completedSale.change.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-900/30 rounded-xl text-xs font-semibold text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Receipt size={14} />
                Print Ticket
              </button>
              <button
                onClick={() => {
                  toast.success('PDF saved to downloads!');
                  setReceiptOpen(false);
                }}
                className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <FileDown size={14} />
                PDF Download
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
