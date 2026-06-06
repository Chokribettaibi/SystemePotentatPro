'use client';

import React, { useState } from 'react';
import { useApp, Supplier } from '../../../context/AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const { suppliers, saveSupplier } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form states
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const openAddModal = () => {
    setSelectedSupplier(null);
    setSupName('');
    setSupContact('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupName(s.name);
    setSupContact(s.contact_name);
    setSupEmail(s.email);
    setSupPhone(s.phone);
    setSupAddress(s.address);
    setModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) {
      toast.error('Supplier name is required');
      return;
    }

    const payload: any = {
      name: supName,
      contactName: supContact,
      email: supEmail,
      phone: supPhone,
      address: supAddress
    };

    if (selectedSupplier) {
      payload.id = selectedSupplier.id;
    }

    const success = await saveSupplier(payload);
    if (success) {
      setModalOpen(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.contact_name && s.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
            placeholder="Search suppliers by company or contact..."
            className="w-full bg-slate-950/40 border border-sky-900/40 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-xl text-slate-950 flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
        >
          <Plus size={15} />
          <span>Register Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSuppliers.map((s) => (
          <div 
            key={s.id} 
            className="glass-panel p-5 relative overflow-hidden border border-sky-950/30 flex flex-col justify-between h-[200px] hover:border-cyan-400/30 transition-all"
          >
            <div>
              <div className="flex justify-between items-start border-b border-sky-950/20 pb-2 mb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Truck size={16} />
                  <h4 className="font-bold text-sm text-slate-100">{s.name}</h4>
                </div>
                <button 
                  onClick={() => openEditModal(s)}
                  className="text-[10px] text-cyan-400 hover:underline font-semibold"
                >
                  Edit Profile
                </button>
              </div>

              {/* Details stack */}
              <div className="space-y-1.5 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-slate-500" />
                  <span>Contact: {s.contact_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Mail size={12} className="text-slate-500" />
                  <span>{s.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Phone size={12} className="text-slate-500" />
                  <span>{s.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Address bar footer */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-sky-950/20 mt-3 truncate">
              <MapPin size={12} className="text-slate-600 shrink-0" />
              <span className="truncate">{s.address || 'No address details'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==========================================
          ADD/EDIT SUPPLIER MODAL
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
              <Truck size={18} className="text-cyan-400" />
              {selectedSupplier ? 'Update Supplier Profile' : 'Register New Supplier'}
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Company Name</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100"
                  placeholder="e.g. Mobile Wholesale Ltd"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Contact Person</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100"
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    placeholder="e.g. sales@wholesale.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2 px-3 text-slate-100 font-mono"
                    placeholder="e.g. +1-555-0188"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Company Address</label>
                <textarea
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 text-slate-200"
                  rows={2}
                  placeholder="Street details, State, Country..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs"
              >
                Save Supplier Registry
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
