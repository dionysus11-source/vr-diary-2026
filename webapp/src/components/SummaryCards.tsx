'use client';

import React from 'react';
import { TrendingUp, Wallet, Shield, BarChart3 } from 'lucide-react';

interface SummaryCardsProps {
    data: any[];
}

export default function SummaryCards({ data }: SummaryCardsProps) {
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    const first = data[0];

    const vrTotalAsset = (latest.evaluation || 0) + (latest.pool || 0);
    const initialPool = first.pool || 0;
    const bhTotalAsset = latest.v_bh || 0;

    const initialTotal = (first.evaluation || 0) + initialPool;
    const profit = vrTotalAsset - initialTotal;
    const profitRate = initialTotal !== 0 ? ((profit / initialTotal) * 100).toFixed(2) : '0';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full h-full">
            <div className="glass-card p-6 flex flex-col justify-between text-center">
                <div>
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
                        <Shield size={16} className="text-primary" /> VR 총 자산
                    </span>
                    <div className="text-2xl font-bold">${vrTotalAsset.toLocaleString()}</div>
                </div>
                <div className={`text-sm mt-3 font-medium ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString()} ({profitRate}%)
                </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between text-center">
                <div>
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
                        <BarChart3 size={16} className="text-accent" /> B&H 총 자산
                    </span>
                    <div className="text-2xl font-bold">${bhTotalAsset.toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                    초기 전액 투자 기준
                </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between text-center">
                <div>
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-accent" /> 평가금 / Pool
                    </span>
                    <div className="text-lg font-bold">
                        ${(latest.evaluation || 0).toLocaleString()} / ${(latest.pool || 0).toLocaleString()}
                    </div>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden flex">
                    <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${vrTotalAsset !== 0 ? ((latest.evaluation || 0) / vrTotalAsset) * 100 : 0}%` }}
                    />
                    <div
                        className="bg-accent h-full transition-all duration-500"
                        style={{ width: `${vrTotalAsset !== 0 ? ((latest.pool || 0) / vrTotalAsset) * 100 : 0}%` }}
                    />
                </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between text-center">
                <div>
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
                        <Wallet size={16} className="text-primary" /> 목표 가치 (V)
                    </span>
                    <div className="text-2xl font-bold text-gradient">${(latest.v || 0).toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                    Bands: ${(latest.min_band || 0).toLocaleString()} ~ ${(latest.max_band || 0).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
