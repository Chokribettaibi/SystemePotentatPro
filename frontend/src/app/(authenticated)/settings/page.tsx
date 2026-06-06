'use client';

import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Settings, Save, Store, Mail, Phone, MapPin, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { settings, saveSettings } = useApp();
  const [loading, setLoading] = useState(false);

  // Form states initialized with context values
  const [storeName, setStoreName] = useState(settings.store_name || '');
  const [storePhone, setStorePhone] = useState(settings.store_phone || '');
  const [storeEmail, setStoreEmail] = useState(settings.store_email || '');
  const [storeAddress, setStoreAddress] = useState(settings.store_address || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol || '$');
  const [currencyCode, setCurrencyCode] = useState(settings.currency_code || 'USD');
  const [taxRate, setTaxRate] = useState(settings.tax_rate || '12.5');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      store_name: storeName,
      store_phone: storePhone,
      store_email: storeEmail,
      store_address: storeAddress,
      currency_symbol: currencySymbol,
      currency_code: currencyCode,
      tax_rate: taxRate
    };

    const success = await saveSettings(payload);
    setLoading(false);
    if (success) {
      toast.success('System settings saved and applied globally');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* settings Card */}
      <div className="glass-panel p-6 border border-sky-950/30">
        
        <div className="flex items-center gap-3 border-b border-sky-950/40 pb-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Settings size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Global System Settings</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Configure store profiles, currency values and sales tax rates</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-300">
          
          {/* General Store profile */}
          <div className="space-y-4">
            <h4 className="font-semibold text-cyan-400 border-b border-sky-950/20 pb-1 text-[11px] uppercase tracking-wider">
              Store Profile
            </h4>
            
            <div>
              <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Store / Company Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Store size={14} />
                </div>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 font-sans"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Phone number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={14} />
                  </div>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Store Physical Address</label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 text-slate-500">
                  <MapPin size={14} />
                </div>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl p-3 pl-10 text-slate-200"
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Localization parameters */}
          <div className="space-y-4 pt-4 border-t border-sky-950/40">
            <h4 className="font-semibold text-cyan-400 border-b border-sky-950/20 pb-1 text-[11px] uppercase tracking-wider">
              Localization & Billing
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Symbol</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 px-3 text-slate-100 font-mono uppercase"
                  placeholder="USD"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wide mb-1.5 font-medium">Sales Tax Rate (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Percent size={13} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-xl glow-button text-[#060919] font-bold text-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#060919] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={15} />
                Save Global settings
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
