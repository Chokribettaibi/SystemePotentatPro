'use client';

import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  BarChart3, 
  Plus, 
  Search, 
  X, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { sales, settings } = useApp();
  const [search, setSearch] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([
    { id: 1, date: '2026-06-01', category: 'Rent', amount: 1500.00, notes: 'Monthly retail space rent' },
    { id: 2, date: '2026-06-02', category: 'Utilities', amount: 350.00, notes: 'Electricity and high speed internet' },
    { id: 3, date: '2026-06-03', category: 'Packaging', amount: 120.00, notes: 'Store bags and custom phone gift boxes' }
  ]);

  // Form states
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expNotes, setExpNotes] = useState('');

  // Summary Metrics
  const totalSalesVal = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalTaxVal = sales.reduce((sum, s) => sum + s.tax_amount, 0);
  const totalExpensesVal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netEarnings = totalSalesVal - totalExpensesVal;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      toast.error('Expense amount must be greater than 0');
      return;
    }

    const newExp = {
      id: expenses.length + 1,
      date: new Date().toISOString().slice(0, 10),
      category: expCategory,
      amount: expAmount,
      notes: expNotes
    };

    setExpenses(prev => [newExp, ...prev]);
    setExpenseModalOpen(false);
    setExpAmount(0);
    setExpNotes('');
    toast.success('Business expense logged successfully');
  };

  // Client-side CSV export
  const exportToCsv = (type: 'sales' | 'expenses') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (type === 'sales') {
      headers = ['Invoice Number', 'Sale Date', 'Customer', 'Cashier', 'Total Amount ($)', 'Tax ($)', 'Status'];
      rows = sales.map(s => [
        s.invoice_number,
        new Date(s.sale_date).toLocaleString(),
        s.customer_name,
        s.cashier_name,
        s.total_amount.toFixed(2),
        s.tax_amount.toFixed(2),
        s.status
      ]);
      filename = 'potentat_sales_report.csv';
    } else {
      headers = ['Expense Date', 'Category', 'Amount ($)', 'Internal Notes'];
      rows = expenses.map(e => [
        e.date,
        e.category,
        e.amount.toFixed(2),
        e.notes
      ]);
      filename = 'potentat_expenses_report.csv';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((val: any) => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} downloaded successfully!`);
  };

  const filteredSales = sales.filter(s => 
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 3 Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Gross Sales */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white font-mono">${totalSalesVal.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Tax collected: ${totalTaxVal.toFixed(2)}</p>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white font-mono">${totalExpensesVal.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Includes rent, utilities, restocks</p>
          </div>
        </div>

        {/* Net Earnings */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-emerald-400 font-mono">${netEarnings.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Gross Sales minus Expenses</p>
          </div>
        </div>

      </div>

      {/* Two Column layouts: Sales Reports + Expenses Reports */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Sales Logs (Left Column - 8 Cols) */}
        <div className="glass-panel p-5 xl:col-span-8 flex flex-col h-[450px]">
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-sky-950/40 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2 text-cyan-400">
              <BarChart3 size={16} />
              <span className="font-semibold text-slate-200">Transactions Ledger</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Invoice..."
                className="bg-slate-950/40 border border-sky-900/40 rounded-xl px-3 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => exportToCsv('sales')}
                className="p-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-900/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Export CSV"
              >
                <FileSpreadsheet size={15} />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-sky-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2">Invoice No</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2 font-mono text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-950/15">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="text-slate-300">
                    <td className="py-2.5 font-semibold text-slate-100 font-mono">{s.invoice_number}</td>
                    <td className="py-2.5 text-slate-400">{new Date(s.sale_date).toLocaleDateString()}</td>
                    <td className="py-2.5 text-slate-400">{s.customer_name}</td>
                    <td className="py-2.5 font-mono text-right font-bold text-slate-200">${s.total_amount.toFixed(2)}</td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">
                        {s.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Expense Logs (Right Column - 4 Cols) */}
        <div className="glass-panel p-5 xl:col-span-4 flex flex-col h-[450px]">
          
          <div className="flex justify-between items-center border-b border-sky-950/40 pb-3 mb-4 shrink-0">
            <span className="font-semibold text-slate-200">Operating Expenses</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => exportToCsv('expenses')}
                className="p-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-900/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Export CSV"
              >
                <FileSpreadsheet size={14} />
              </button>
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="p-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-slate-950 transition-colors flex items-center justify-center"
                title="Add Expense"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-xs">
            {expenses.map((e) => (
              <div key={e.id} className="p-3 bg-sky-950/20 border border-sky-900/30 rounded-xl flex justify-between items-start gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">{e.category}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{e.date}</span>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{e.notes}</p>
                </div>
                <span className="font-bold text-rose-400 font-mono shrink-0">${e.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ==========================================
          LOG EXPENSE MODAL
          ========================================== */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5">Record Business Expense</h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                >
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Expense Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Internal Description Notes</label>
                <textarea
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200"
                  rows={3}
                  placeholder="Details of expense, supplier or receipt references..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Log Expense Record
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
