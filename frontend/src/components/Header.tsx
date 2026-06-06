'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  CloudOff, 
  CloudLightning,
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, title }) => {
  const { user, theme, toggleTheme, isApiOnline, products } = useApp();
  const [time, setTime] = useState<string>('');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  // Digital clock
  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor stock alerts
  useEffect(() => {
    const lowStockProducts = products.filter(p => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      return totalStock <= p.alert_quantity;
    });

    const alertMsgs = lowStockProducts.map(p => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      return `Low Stock Alert: ${p.name} only has ${totalStock} left!`;
    });

    if (!isApiOnline) {
      alertMsgs.unshift('Demo Sandbox Mode: Express API is currently offline');
    }

    setAlerts(alertMsgs);
  }, [products, isApiOnline]);

  return (
    <header className="h-20 bg-[#080B1A]/40 backdrop-blur-md border-b border-sky-950/40 px-6 flex items-center justify-between z-40 relative">
      {/* Left side: Hamburger (Mobile) + Path */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/30 text-slate-300 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="font-semibold text-xl text-white tracking-wide">{title}</h1>
          <span className="text-xs text-slate-400 font-medium">Potentat Pro Suite</span>
        </div>
      </div>

      {/* Right side: Connection status, Time, notifications, theme toggles */}
      <div className="flex items-center gap-4 md:gap-5">
        {/* Live / Sandbox Status Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isApiOnline 
            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
            : 'bg-amber-950/20 text-amber-400 border-amber-500/20 animate-pulse'
        }`}>
          {isApiOnline ? (
            <>
              <CloudLightning size={13} className="text-emerald-400" />
              <span>LIVE DATABASE</span>
            </>
          ) : (
            <>
              <CloudOff size={13} className="text-amber-400" />
              <span>DEMO SANDBOX</span>
            </>
          )}
        </div>

        {/* Real-time Clock */}
        <div className="hidden lg:block font-mono text-sm text-cyan-400/90 bg-sky-950/30 border border-sky-900/30 px-3.5 py-1.5 rounded-xl">
          {time}
        </div>

        {/* Theme toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-900/30 text-slate-300 hover:text-cyan-400 transition-all duration-200"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications / Alerts Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-900/30 text-slate-300 hover:text-cyan-400 transition-all duration-200 relative"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#0d122b]/95 backdrop-blur-lg border border-sky-900/40 shadow-2xl p-4 z-50 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-sky-950/40">
                <span className="font-semibold text-sm">System Notifications</span>
                <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded-full bg-sky-950/60 font-mono">
                  {alerts.length} alerts
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No new alerts. System functioning optimally.</p>
                ) : (
                  alerts.map((alert, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-2.5 p-2.5 rounded-xl text-xs ${
                        alert.includes('Demo') 
                          ? 'bg-amber-950/15 border border-amber-500/10 text-amber-300' 
                          : 'bg-rose-950/15 border border-rose-500/10 text-rose-300'
                      }`}
                    >
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar (compact) */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-sky-950/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-slate-900 font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-200 leading-none">{user.name.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{user.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
