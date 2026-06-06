'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  ArrowUpRight,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const { products, sales, returns, auditLogs, isApiOnline } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load analytics (either via API or mock aggregations)
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      
      // Calculate locally to ensure instant load (offline first approach)
      // Total Sales Value
      const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
      const todaySales = sales.filter(s => s.sale_date.startsWith(new Date().toISOString().split('T')[0]))
                              .reduce((sum, s) => sum + s.total_amount, 0);

      // Stock Value
      let totalCostVal = 0;
      let totalRetailVal = 0;
      let lowStockCount = 0;

      products.forEach(p => {
        const pQty = p.variants.reduce((sum, v) => {
          totalCostVal += v.stock_quantity * v.cost_price;
          totalRetailVal += v.stock_quantity * v.retail_price;
          return sum + v.stock_quantity;
        }, 0);

        if (pQty <= p.alert_quantity) {
          lowStockCount++;
        }
      });

      // Charts mock aggregates
      const monthlyTrends = [
        { month: 'Jan', revenue: 4000, profit: 2400 },
        { month: 'Feb', revenue: 3000, profit: 1398 },
        { month: 'Mar', revenue: 2000, profit: 9800 },
        { month: 'Apr', revenue: 2780, profit: 3908 },
        { month: 'May', revenue: 1890, profit: 4800 },
        { month: 'Jun', revenue: totalRevenue > 0 ? totalRevenue : 2390, profit: totalRevenue > 0 ? totalRevenue * 0.45 : 3800 }
      ];

      const categoryDistribution = [
        { name: 'Smartphones', value: 400 },
        { name: 'Fast Chargers', value: 300 },
        { name: 'Wireless Earbuds', value: 300 },
        { name: 'Phone Cases', value: 200 }
      ];

      const productPerformance = [
        { name: 'iPhone 15 Pro', sales: 15 },
        { name: 'Galaxy S24', sales: 8 },
        { name: 'Anker Nano II', sales: 50 }
      ];

      setStats({
        salesToday: todaySales,
        salesTotal: totalRevenue,
        stockCostValue: totalCostVal,
        stockRetailValue: totalRetailVal,
        lowStockCount,
        returnsCount: returns.length
      });

      setChartData({
        trends: monthlyTrends,
        categories: categoryDistribution,
        products: productPerformance
      });
      
      setLoading(false);
    };

    fetchAnalytics();
  }, [products, sales, returns]);

  const COLORS = ['#00F2FE', '#4FACFE', '#6366F1', '#EC4899', '#8B5CF6'];

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-sky-950/20 border border-sky-900/10 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 md:col-span-2 rounded-3xl bg-sky-950/20 border border-sky-900/10 animate-pulse" />
          <div className="h-80 rounded-3xl bg-sky-950/20 border border-sky-900/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total revenue */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white glow-text-blue">${stats.salesTotal.toFixed(2)}</h3>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              +14.5% overall growth
            </span>
          </div>
        </div>

        {/* Today's sales */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Checkout</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white glow-text-blue">${stats.salesToday.toFixed(2)}</h3>
            <span className="text-[10px] text-blue-400 font-mono mt-1 flex items-center gap-1">
              <Activity size={12} />
              Live cashier terminal
            </span>
          </div>
        </div>

        {/* Stock value */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white glow-text-blue">${stats.stockRetailValue.toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              Cost value: ${stats.stockCostValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Stock Alerts</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-rose-500/10 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white">{stats.lowStockCount} Products</h3>
            <span className={`text-[10px] font-mono mt-1 ${stats.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {stats.lowStockCount > 0 ? 'Replenishment order required' : 'Stock counts optimal'}
            </span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line / Area Chart - Sales Trend */}
        <div className="glass-panel p-5 lg:col-span-2 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">Revenue & Profit History</span>
              <span className="text-[10px] text-slate-400 font-mono">Last 6 Months performance metrics</span>
            </div>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d122b', 
                    borderColor: 'rgba(56,189,248,0.25)', 
                    color: '#f8fafc',
                    borderRadius: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#00F2FE" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Total Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Best Selling Categories */}
        <div className="glass-panel p-5 flex flex-col h-[380px]">
          <span className="font-semibold text-slate-200 mb-4">Product Category Mix</span>
          <div className="flex-1 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.categories}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.categories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d122b', 
                    borderColor: 'rgba(56,189,248,0.25)', 
                    color: '#f8fafc',
                    borderRadius: '12px'
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[40%] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest leading-none">Share</span>
              <p className="text-xl font-bold text-white mt-0.5">Mix %</p>
            </div>
          </div>
        </div>

      </div>

      {/* Two Column details: Low Stock warnings list + Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Low stock list */}
        <div className="glass-panel p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-sky-950/40 pb-3">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Low Stock Warnings
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {products.filter(p => {
              const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
              return totalStock <= p.alert_quantity;
            }).length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">All product stock counts healthy.</div>
            ) : (
              products.filter(p => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                return totalStock <= p.alert_quantity;
              }).map((p) => {
                const qty = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
                return (
                  <div key={p.id} className="p-3 bg-sky-950/20 border border-sky-900/30 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-slate-200">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 font-mono">{qty} units left</span>
                      <p className="text-[9px] text-slate-500">Alert threshold: {p.alert_quantity}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="glass-panel p-5 lg:col-span-2 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-sky-950/40 pb-3">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Recent Operations Audit Logs
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-slate-950/40 border border-sky-950/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-cyan-400/20 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="text-[10px] text-slate-400 bg-sky-950/50 border border-sky-900/30 px-2 py-0.5 rounded font-mono shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{log.details}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto text-[10px] font-mono text-cyan-400 bg-cyan-950/15 border border-cyan-800/20 px-2 py-0.5 rounded-full">
                  <span>{log.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
