'use client';

import React, { useState, useEffect } from 'react';
import InvestmentForm from '@/components/InvestmentForm';
import SummaryCards from '@/components/SummaryCards';
import DashboardChart from '@/components/DashboardChart';
import { RefreshCcw, LayoutDashboard } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/investment');
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-secondary rounded-xl border border-border shadow-lg shadow-glow-primary">
              <LayoutDashboard className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient">VR Diary</h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">TQQQ Value Rebalancing Dashboard</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-secondary/50 hover:bg-secondary border border-border rounded-lg text-sm text-muted-foreground transition-all active:scale-95"
          >
            <RefreshCcw className={`${loading ? 'animate-spin' : ''}`} size={16} />
            {loading ? '동기화 중...' : '데이터 새로고침'}
          </button>
        </header>

        {/* Summary Statistics */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <SummaryCards data={data} />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chart Section */}
          <section className="lg:col-span-3 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <DashboardChart data={data} />
          </section>

          {/* Form Section */}
          <section className="lg:col-span-1 animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
            <InvestmentForm onSuccess={fetchData} />

            <div className="mt-8 p-6 glass-card border-accent/20 bg-accent/5 text-center">
              <h4 className="text-sm font-semibold text-accent mb-4 uppercase tracking-tight">System Status</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex justify-between items-center">
                  <span>Backend Storage:</span>
                  <span className="text-foreground">CSV (Active)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Data Precision:</span>
                  <span className="text-foreground">2 Decimal Places</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Last Updated:</span>
                  <span className="text-foreground">{data.length > 0 ? data[data.length - 1].date : 'N/A'}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-12 border-t border-border/50 pb-8 flex flex-col items-center gap-3">
          <p className="font-mono opacity-60 uppercase tracking-[0.2em]">TQQQ-VR-DIARY-2026 INTERNAL BUILD v1.0.0</p>
          <div className="flex gap-6 text-sm">
            <span className="hover:text-primary transition-colors cursor-pointer">Security</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Logs</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Performance</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
