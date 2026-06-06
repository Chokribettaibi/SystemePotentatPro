'use client';

import React, { useState } from 'react';
import { useApp, Customer } from '../../../context/AppContext';
import { 
  Users, 
  Plus, 
  Search, 
  X, 
  UserCheck, 
  Coins, 
  DollarSign, 
  CreditCard,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { customers, saveCustomer, recordCustomerPayment } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Form states
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const openAddModal = () => {
    setSelectedCust(null);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');
    setCustModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setSelectedCust(c);
    setCustName(c.name);
    setCustEmail(c.email || '');
    setCustPhone(c.phone || '');
    setCustAddress(c.address || '');
    setCustModalOpen(true);
  };

  const openPayModal = (c: Customer) => {
    setSelectedCust(c);
    setPaymentAmount(c.balance);
    setPaymentMethod('CASH');
    setPayModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) {
      toast.error('Customer name is required');
      return;
    }

    const payload: any = {
      name: custName,
      email: custEmail,
      phone: custPhone,
      address: custAddress
    };

    if (selectedCust) {
      payload.id = selectedCust.id;
    }

    const success = await saveCustomer(payload);
    if (success) {
      setCustModalOpen(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || paymentAmount <= 0) {
      toast.error('Enter a valid repayment amount');
      return;
    }

    const success = await recordCustomerPayment(selectedCust.id, paymentAmount, paymentMethod);
    if (success) {
      setPayModalOpen(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
            placeholder="Search customers by name, phone or email..."
            className="w-full bg-slate-950/40 border border-sky-900/40 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-xl text-slate-950 flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
        >
          <Plus size={15} />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((c) => (
          <div 
            key={c.id} 
            className="glass-panel p-5 relative overflow-hidden border border-sky-950/30 flex flex-col justify-between h-[180px] group hover:border-cyan-400/30 transition-all"
          >
            <div>
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-100">{c.name}</h4>
                {c.name !== 'Walk-in Customer' && (
                  <button 
                    onClick={() => openEditModal(c)}
                    className="text-[10px] text-cyan-400 hover:underline font-semibold"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{c.email || 'No email registered'}</p>
              
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 font-mono">
                <Phone size={11} className="text-cyan-400" />
                {c.phone || 'No phone'}
              </div>
            </div>

            {/* Loyalty points and Balance */}
            <div className="flex items-end justify-between mt-4 pt-3 border-t border-sky-950/20">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Coins size={14} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider leading-none">Loyalty</span>
                  <span className="text-xs font-bold text-amber-500 font-mono leading-none">{c.loyalty_points} Pts</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider leading-none">Debt Balance</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-bold font-mono ${c.balance > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    ${c.balance.toFixed(2)}
                  </span>
                  {c.balance > 0 && (
                    <button 
                      onClick={() => openPayModal(c)}
                      className="px-2 py-0.5 bg-rose-500 text-slate-950 text-[9px] rounded font-extrabold hover:bg-rose-600 transition-colors"
                    >
                      PAY DEBT
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==========================================
          ADD/EDIT CUSTOMER MODAL
          ========================================== */}
      {custModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setCustModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-400" />
              {selectedCust ? 'Update Customer Profile' : 'Register New Customer'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Customer Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100"
                  placeholder="e.g. john@gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Phone Number</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                  placeholder="e.g. +1-555-0123"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Billing Address</label>
                <textarea
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200"
                  rows={2}
                  placeholder="Street details, State, Zip code..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Save Customer Profile
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          PAY DEBT MODAL
          ========================================== */}
      {payModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#090d22] border border-sky-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
            <button 
              onClick={() => setPayModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-sky-950/50 border border-sky-900/30 text-slate-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <DollarSign size={18} className="text-cyan-400" />
              Process Repayment: {selectedCust.name}
            </h3>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs text-slate-300">
              
              <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-2xl">
                <span className="text-slate-400">Total Outstanding Balance:</span>
                <p className="text-xl font-bold text-rose-400 font-mono mt-1">${selectedCust.balance.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Repayment Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-200"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Wire</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Log Repayment Receipt
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
