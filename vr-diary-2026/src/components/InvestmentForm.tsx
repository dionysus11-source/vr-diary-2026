'use client';

import React, { useState } from 'react';
import { PlusCircle, Calendar, Target, TrendingUp, Wallet } from 'lucide-react';

interface InvestmentFormProps {
    onSuccess: () => void;
}

export default function InvestmentForm({ onSuccess }: InvestmentFormProps) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        v: '',
        tqqq_price: '',
        shares: '',
        pool: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const evaluation = Number(formData.tqqq_price) * Number(formData.shares);
            const payload = {
                date: formData.date,
                v: formData.v,
                evaluation: evaluation.toFixed(2),
                pool: formData.pool,
            };
            const response = await fetch('/api/investment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setFormData({ ...formData, v: '', tqqq_price: '', shares: '', pool: '' });
                onSuccess();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="glass-card p-6 w-full">
            <h2 className="text-2xl mb-6 flex items-center justify-center gap-2">
                <PlusCircle className="text-primary" />
                <span className="text-gradient">새로운 기록 추가</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 justify-center">
                        <Calendar size={14} /> 날짜
                    </label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-md px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 justify-center">
                        <Target size={14} /> V (목표 가치)
                    </label>
                    <input
                        type="number"
                        name="v"
                        value={formData.v}
                        onChange={handleChange}
                        step="any"
                        placeholder="0"
                        className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2 justify-center">
                            <TrendingUp size={14} /> TQQQ 가격
                        </label>
                        <input
                            type="number"
                            name="tqqq_price"
                            value={formData.tqqq_price}
                            onChange={handleChange}
                            step="any"
                            placeholder="예: 45.50"
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2 justify-center">
                            <Wallet size={14} /> 보유 주식 수
                        </label>
                        <input
                            type="number"
                            name="shares"
                            value={formData.shares}
                            onChange={handleChange}
                            step="any"
                            placeholder="예: 220"
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 justify-center">
                        <Wallet size={14} /> 현금 Pool
                    </label>
                    <input
                        type="number"
                        name="pool"
                        value={formData.pool}
                        onChange={handleChange}
                        step="any"
                        placeholder="0"
                        className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-6 disabled:opacity-50"
                >
                    {loading ? '저장 중...' : '기록 저장하기'}
                </button>
            </form>
        </div>
    );
}
