'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-[#060919] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Validating authorization...</span>
        </div>
      </div>
    );
  }

  // Get matching page title for the header
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'System Analytics Dashboard';
    if (pathname.startsWith('/pos')) return 'Point of Sale (POS) Terminal';
    if (pathname.startsWith('/inventory')) return 'Inventory & Stock Management';
    if (pathname.startsWith('/returns')) return 'Warranty & Product Returns';
    if (pathname.startsWith('/customers')) return 'Customer database & Loyalty';
    if (pathname.startsWith('/suppliers')) return 'Supplier Networks & Logistics';
    if (pathname.startsWith('/reports')) return 'Reports & Financial Statements';
    if (pathname.startsWith('/settings')) return 'Global Store Settings';
    return 'Potentat Pro Suite';
  };

  return (
    <div className="min-h-screen flex bg-[#060919] overflow-hidden relative">
      
      {/* Sidebar - Desktop */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Sidebar - Mobile Drawer */}
      <Sidebar 
        collapsed={false} 
        setCollapsed={() => {}} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header bar */}
        <Header setMobileOpen={setMobileOpen} title={getPageTitle()} />

        {/* Scrollable Work Viewport */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-[#060919]/5">
          {children}
        </main>
      </div>
    </div>
  );
}
