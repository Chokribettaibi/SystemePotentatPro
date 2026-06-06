'use client';

import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  RefreshCw, 
  Plus, 
  Search, 
  X, 
  Calendar, 
  AlertCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReturnsPage() {
  const { returns, sales, products, processReturn } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Return Form state
  const [selectedSaleId, setSelectedSaleId] = useState<number>(sales[0]?.id || 0);
  const [returnType, setReturnType] = useState<'WARRANTY' | 'DAMAGED' | 'STANDARD'>('STANDARD');
  const [returnNotes, setReturnNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 0);

  const handleOpenModal = () => {
    if (sales.length === 0) {
      toast.error('No sales transactions exist to issue a return against');
      return;
    }
    setSelectedSaleId(sales[0].id);
    setSelectedProductId(products[0]?.id || 0);
    setReturnType('STANDARD');
    setReturnNotes('');
    setRefundAmount(0);
    setModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId || !selectedProductId) {
      toast.error('Sale Invoice and Product are required');
      return;
    }

    const payload = {
      saleId: selectedSaleId,
      type: returnType,
      notes: returnNotes,
      items: [{
        productId: selectedProductId,
        variantId: products.find(p => p.id === selectedProductId)?.variants[0]?.id || null,
        quantity: 1,
        refundAmount
      }]
    };

    const success = await processReturn(payload);
    if (success) {
      setModalOpen(false);
    }
  };

  const filteredReturns = returns.filter(r => 
    r.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Search Header Bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search returns by Invoice No..."
            className="w-full bg-slate-950/40 border border-sky-900/40 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-xl text-slate-950 flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
        >
          <Plus size={15} />
          <span>Register Return</span>
        </button>
      </div>

      {/* Returns List */}
      <div className="glass-panel overflow-hidden border border-sky-950/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-sky-950/40 bg-sky-950/20 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Invoice Number</th>
                <th className="p-4">Return Date</th>
                <th className="p-4">Processed By</th>
                <th className="p-4 font-mono">Refunded Amount</th>
                <th className="p-4 text-center">Return Type</th>
                <th className="p-4 pr-6">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-950/20">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No returns history found.</td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-sky-950/10 text-slate-300 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-100 font-mono">{r.invoice_number}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400 font-medium">
                        <Calendar size={13} className="text-cyan-400" />
                        {new Date(r.return_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{r.cashier_name}</td>
                    <td className="p-4 font-mono font-bold text-slate-200">${r.total_refund.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                        r.type === 'WARRANTY'
                          ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20'
                          : r.type === 'DAMAGED'
                            ? 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                            : 'bg-cyan-950/20 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-slate-400 max-w-xs truncate">{r.notes || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          REGISTER NEW RETURN MODAL
          ========================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <RefreshCw size={18} className="text-cyan-400" />
              Register Customer Return
            </h3>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Select Sale Invoice</label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => setSelectedSaleId(parseInt(e.target.value))}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200 font-mono"
                >
                  {sales.map(s => (
                    <option key={s.id} value={s.id}>{s.invoice_number} - {s.customer_name} (${s.total_amount})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Select Product to Return</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Return Type</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as any)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                  >
                    <option value="STANDARD">Standard Return</option>
                    <option value="WARRANTY">Warranty Replacement</option>
                    <option value="DAMAGED">Damaged / Write-off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Refund Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Reason & Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200"
                  rows={2}
                  placeholder="Explain why the product is returned, warranty status..."
                  required
                />
              </div>

              <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-2xl flex items-start gap-2 text-rose-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  {returnType === 'DAMAGED' 
                    ? 'Damaged item: inventory stock levels will NOT recover for this item.' 
                    : 'Standard/Warranty return: inventory stock levels will automatically recover.'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Log Return Transaction
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
