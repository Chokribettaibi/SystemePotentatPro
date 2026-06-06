'use client';

import React, { useState } from 'react';
import { useApp, Product } from '../../../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  PackageMinus, 
  Truck, 
  X, 
  ChevronDown, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { 
    products, 
    categories, 
    brands, 
    suppliers,
    saveProduct, 
    deleteProduct, 
    replenishStock 
  } = useApp();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | 'ALL'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  
  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New Product Form state
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodQrCode, setProdQrCode] = useState('');
  const [prodCat, setProdCat] = useState<number>(categories[0]?.id || 1);
  const [prodBrand, setProdBrand] = useState<number>(brands[0]?.id || 1);
  const [prodCost, setProdCost] = useState<number>(0);
  const [prodRetail, setProdRetail] = useState<number>(0);
  const [prodAlert, setProdAlert] = useState<number>(5);
  const [prodDesc, setProdDesc] = useState('');
  const [prodHasVariants, setProdHasVariants] = useState(false);
  const [prodImeisText, setProdImeisText] = useState(''); // comma-separated IMEIs

  // Restock Form state
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [purchaseRef, setPurchaseRef] = useState('');
  const [restockProduct, setRestockProduct] = useState<number>(products[0]?.id || 1);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockCost, setRestockCost] = useState<number>(0);
  const [restockImeis, setRestockImeis] = useState('');

  const openAddModal = () => {
    setSelectedProduct(null);
    setProdName('');
    setProdSku('');
    setProdBarcode('');
    setProdQrCode('');
    setProdCat(categories[0]?.id || 1);
    setProdBrand(brands[0]?.id || 1);
    setProdCost(0);
    setProdRetail(0);
    setProdAlert(5);
    setProdDesc('');
    setProdHasVariants(false);
    setProdImeisText('');
    setProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdBarcode(p.barcode || '');
    setProdQrCode(p.qr_code || '');
    setProdCat(p.category_id);
    setProdBrand(p.brand_id);
    setProdCost(p.cost_price);
    setProdRetail(p.retail_price);
    setProdAlert(p.alert_quantity);
    setProdDesc(p.description);
    setProdHasVariants(p.has_variants);
    setProdImeisText('');
    setProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku) {
      toast.error('Product Name and SKU are required');
      return;
    }

    const payload: any = {
      name: prodName,
      sku: prodSku,
      barcode: prodBarcode,
      qrCode: prodQrCode,
      categoryId: prodCat,
      brandId: prodBrand,
      costPrice: prodCost,
      retailPrice: prodRetail,
      alertQuantity: prodAlert,
      description: prodDesc,
      hasVariants: prodHasVariants,
      imeis: prodImeisText ? prodImeisText.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
    };

    if (selectedProduct) {
      payload.id = selectedProduct.id;
    }

    const success = await saveProduct(payload);
    if (success) {
      setProductModalOpen(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseRef) {
      toast.error('Purchase Reference Number is required');
      return;
    }

    const matchedProd = products.find(p => p.id === restockProduct);
    if (!matchedProd) return;

    const payload = {
      supplierId,
      referenceNo: purchaseRef,
      purchaseDate: new Date().toISOString().slice(0, 10),
      items: [{
        productId: restockProduct,
        variantId: matchedProd.variants[0]?.id || null,
        quantity: restockQty,
        costPrice: restockCost > 0 ? restockCost : matchedProd.variants[0]?.cost_price || matchedProd.cost_price,
        imeis: restockImeis ? restockImeis.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
      }],
      paidAmount: (restockCost > 0 ? restockCost : matchedProd.cost_price) * restockQty,
      notes: 'Standard replenishment'
    };

    const success = await replenishStock(payload);
    if (success) {
      setPurchaseModalOpen(false);
      setPurchaseRef('');
      setRestockImeis('');
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    // Search keyword match
    const term = search.toLowerCase();
    const searchMatch = p.name.toLowerCase().includes(term) || 
                        p.sku.toLowerCase().includes(term) || 
                        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
                        p.variants.some(v => v.sku.toLowerCase().includes(term) || (v.barcode && v.barcode.toLowerCase().includes(term)));
    
    if (!searchMatch) return false;

    // Category match
    if (catFilter !== 'ALL' && p.category_id !== catFilter) return false;

    // Stock level match
    const totalQty = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    if (stockFilter === 'LOW' && totalQty > p.alert_quantity) return false;
    if (stockFilter === 'OUT' && totalQty > 0) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        
        {/* Keyword Search */}
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, SKU or barcode..."
            className="w-full bg-slate-950/40 border border-sky-900/40 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap gap-3 items-center justify-end">
          
          {/* Category Filter */}
          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="appearance-none bg-[#0a0f28] text-xs text-slate-300 border border-sky-900/40 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Stock Alert Filter */}
          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="appearance-none bg-[#0a0f28] text-xs text-slate-300 border border-sky-900/40 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">Low Stock Alerts</option>
              <option value="OUT">Out of Stock</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setPurchaseModalOpen(true)}
            className="px-4 py-2.5 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-900/30 rounded-xl text-cyan-400 flex items-center gap-2 text-xs font-semibold glow-text-blue transition-all"
          >
            <Truck size={15} />
            <span>Restock Purchase</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-xl text-slate-950 flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>

        </div>
      </div>

      {/* Main Stock Table */}
      <div className="glass-panel overflow-hidden border border-sky-950/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-sky-950/40 bg-sky-950/20 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Product Details</th>
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4">Category</th>
                <th className="p-4">Brand</th>
                <th className="p-4 font-mono">Retail Price</th>
                <th className="p-4 font-mono text-center">Available Stock</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-950/20">
              {filteredProducts.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                const isLow = totalStock <= p.alert_quantity;

                return (
                  <tr key={p.id} className="hover:bg-sky-950/10 text-slate-300 transition-colors">
                    <td className="p-4 pl-6 font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-100 font-semibold">{p.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.description || 'No description provided'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col font-mono text-[10px]">
                        <span className="text-slate-200">Base: {p.sku}</span>
                        {p.barcode && <span className="text-slate-400">BC: {p.barcode}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{p.category_name}</td>
                    <td className="p-4 text-slate-400 font-medium">{p.brand_name}</td>
                    <td className="p-4 font-mono font-bold text-slate-200">${p.retail_price.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono">
                        <span className={`font-bold ${
                          totalStock === 0 
                            ? 'text-rose-500' 
                            : isLow 
                              ? 'text-amber-500' 
                              : 'text-cyan-400'
                        }`}>{totalStock} units</span>
                        {isLow && totalStock > 0 && <AlertTriangle size={12} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        p.status === 'ACTIVE' 
                          ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-950/20 text-rose-400 border border-rose-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded bg-sky-950/50 hover:bg-sky-900/60 border border-sky-850/40 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Edit Details"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 rounded bg-sky-950/50 hover:bg-rose-950/20 border border-sky-850/40 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Deactivate Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD/EDIT PRODUCT MODAL
          ========================================== */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5">
              {selectedProduct ? 'Edit Store Product Details' : 'Add New Retail Product'}
            </h3>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs text-slate-300">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Product Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Galaxy S24 Ultra"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Base SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    placeholder="e.g. S24ULTRA"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Barcode</label>
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    placeholder="e.g. 190199123456"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">QR Code</label>
                  <input
                    type="text"
                    value={prodQrCode}
                    onChange={(e) => setProdQrCode(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    placeholder="e.g. QR-S24U"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Category</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(parseInt(e.target.value))}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Brand</label>
                  <select
                    value={prodBrand}
                    onChange={(e) => setProdBrand(parseInt(e.target.value))}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodCost}
                    onChange={(e) => setProdCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodRetail}
                    onChange={(e) => setProdRetail(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Alert Qty</label>
                  <input
                    type="number"
                    value={prodAlert}
                    onChange={(e) => setProdAlert(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200"
                  rows={2}
                  placeholder="Additional specs, warranty information, features..."
                />
              </div>

              {/* IMEI Initial Seeding input */}
              {!selectedProduct && (
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                    IMEIs / Serial Numbers (Optional, Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={prodImeisText}
                    onChange={(e) => setProdImeisText(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 px-3 text-slate-100 font-mono"
                    placeholder="e.g. 358765109876541, 358765109876542"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Save Product Record
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          RESTOCK PURCHASE MODAL
          ========================================== */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setPurchaseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <Truck size={18} className="text-cyan-400" />
              Replenish Inventory Stock
            </h3>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(parseInt(e.target.value))}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Purchase Order / Ref No.</label>
                <input
                  type="text"
                  value={purchaseRef}
                  onChange={(e) => setPurchaseRef(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                  placeholder="PO-2026-0001"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Restock Product</label>
                <select
                  value={restockProduct}
                  onChange={(e) => setRestockProduct(parseInt(e.target.value))}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Quantity to Add</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Cost Price (Leave 0 for default)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockCost}
                    onChange={(e) => setRestockCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                  Add IMEIs / Serial Numbers (Optional, Comma Separated)
                </label>
                <textarea
                  value={restockImeis}
                  onChange={(e) => setRestockImeis(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-100 font-mono"
                  rows={2}
                  placeholder="e.g. 358765109876544, 358765109876545"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Execute Stock replenishment
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
