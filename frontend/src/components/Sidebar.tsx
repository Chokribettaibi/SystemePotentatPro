'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  RefreshCw, 
  BarChart3, 
  Users, 
  Truck, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user, logout, settings } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Admin', 'Manager', 'Cashier', 'Employee'] },
    { name: 'POS Register', icon: ShoppingBag, path: '/pos', roles: ['Admin', 'Manager', 'Cashier'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['Admin', 'Manager', 'Cashier', 'Employee'] },
    { name: 'Returns', icon: RefreshCw, path: '/returns', roles: ['Admin', 'Manager', 'Cashier'] },
    { name: 'Customers', icon: Users, path: '/customers', roles: ['Admin', 'Manager', 'Cashier', 'Employee'] },
    { name: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['Admin', 'Manager'] },
    { name: 'Reports & Stats', icon: BarChart3, path: '/reports', roles: ['Admin', 'Manager'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full text-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 border-b border-sky-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="font-extrabold text-lg text-slate-900">P</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-wide text-white glow-text-blue">{settings.store_name || 'Potentat Pro'}</span>
              <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">Enterprise POS</span>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse Button (Desktop Only) */}
        {setMobileOpen === undefined && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/30 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* User Information Summary */}
      {!collapsed && (
        <div className="mx-4 mt-6 p-4 rounded-2xl bg-sky-950/20 border border-sky-900/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-800/40 border border-sky-600/30 flex items-center justify-center">
            <span className="font-semibold text-cyan-400">{user.name.charAt(0)}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sm text-slate-200 truncate">{user.name}</span>
            <span className="text-xs text-cyan-400/80 font-mono flex items-center gap-1">
              <ShieldCheck size={12} className="inline text-cyan-400" />
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/30 text-cyan-400 border-l-[3px] border-cyan-400 pl-[13px] shadow-[inset_4px_0_12px_rgba(6,182,212,0.06)]' 
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-sky-950/20 hover:pl-[18px]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyan-400 glow-text-blue' : 'text-slate-400 group-hover:text-cyan-300 transition-colors'} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions - Logout */}
      <div className="p-4 border-t border-sky-950/40">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/10 transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  // Mobile navigation overlay drawer
  if (setMobileOpen !== undefined) {
    return (
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        
        {/* Drawer panel */}
        <div className={`absolute top-0 bottom-0 left-0 w-72 bg-[#090D22] border-r border-sky-950/40 shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop sidebar panel
  return (
    <aside className={`hidden md:block bg-[#080B1A]/85 backdrop-blur-md border-r border-sky-950/40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} shrink-0`}>
      {sidebarContent}
    </aside>
  );
};
