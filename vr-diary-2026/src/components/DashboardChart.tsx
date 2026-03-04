'use client';

import React from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

interface DashboardChartProps {
    data: any[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="glass-card p-6 w-full h-[400px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다. 새로운 기록을 추가해주세요.
            </div>
        );
    }

    const first = data[0];
    const initialPool = first.pool || 0;

    const chartData = data.map(d => ({
        ...d,
        vrTotal: (d.evaluation || 0) + (d.pool || 0),
        bhTotal: d.v_bh || 0,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#141417] border border-[#27272a] p-4 rounded-lg shadow-xl">
                    <p className="text-sm font-bold mb-2 text-foreground">{label}</p>
                    {payload.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs mb-1">
                            <span style={{ color: item.color }}>{item.name}:</span>
                            <span className="font-mono text-foreground">${Number(item.value).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-[#27272a] flex justify-between gap-4 text-xs italic text-muted-foreground">
                        <span>VR vs B&H:</span>
                        <span className={chartData[payload[0].payload.index]?.vrTotal >= chartData[payload[0].payload.index]?.bhTotal ? 'text-primary' : 'text-destructive'}>
                            {(chartData[payload[0].payload.index]?.vrTotal - chartData[payload[0].payload.index]?.bhTotal).toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-card p-8 w-full h-[500px]">
            <h3 className="text-xl font-semibold mb-6 text-gradient text-center">성과 비교 및 목표 트래킹</h3>
            <div className="w-full" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorVR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBH" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                    {/* Target Band Area */}
                    <Area
                        type="monotone"
                        dataKey="max_band"
                        stroke="none"
                        fill="url(#colorBand)"
                        fillOpacity={1}
                        connectNulls
                    />
                    <Area
                        type="monotone"
                        dataKey="min_band"
                        stroke="none"
                        fill="#0a0a0c" // Matches background to "cut out" the bottom
                        fillOpacity={1}
                        connectNulls
                    />

                    <Area
                        type="monotone"
                        dataKey="vrTotal"
                        name="VR 총 자산"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorVR)"
                        strokeWidth={3}
                    />
                    <Area
                        type="monotone"
                        dataKey="bhTotal"
                        name="B&H 총 자산"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorBH)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                    />
                    <Line
                        type="monotone"
                        dataKey="v"
                        name="Target Value (V)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="evaluation"
                        name="주식 평가금"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
            </div>
        </div>
    );
}
