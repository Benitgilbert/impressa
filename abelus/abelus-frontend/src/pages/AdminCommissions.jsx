import { useState, useEffect, useCallback } from 'react';
import {
    FaPercent, FaSave, FaDollarSign, FaCalendarAlt,
    FaUsers, FaMoneyBillWave, FaCog, FaChartLine
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminCommissions() {
    const [settings, setSettings] = useState({ 
        defaultRate: 10, 
        posRate: 5, 
        minimumPayoutAmount: 10000, 
        payoutSchedule: 'manual', 
        payoutMethods: ['mobile_money', 'bank_transfer'] 
    });
    const [dashboard, setDashboard] = useState({ 
        platformEarnings: 0, 
        pendingPayouts: { amount: 0, count: 0 }, 
        completedPayouts: { amount: 0, count: 0 }, 
        activeSellers: 0 
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [settingsRes, dashRes] = await Promise.all([
                api.get('/commissions/settings'),
                api.get('/commissions/dashboard')
            ]);
            
            if (settingsRes.data.success) {
                setSettings({
                    ...settingsRes.data.data,
                    posRate: settingsRes.data.data.posRate ?? 5 // Fallback if missing
                });
            }
            if (dashRes.data.success) setDashboard(dashRes.data.data);
        } catch (err) { 
            console.error('Commission load error:', err);
            setError('Failed to load commission data. Please check your permissions.'); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    useEffect(() => { 
        if (error || success) { 
            const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); 
            return () => clearTimeout(t); 
        } 
    }, [error, success]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/commissions/settings', settings);
            if (res.data.success) setSuccess('Settings saved successfully');
            else setError(res.data.message || 'Failed to save');
        } catch (err) { 
            setError('Failed to save settings'); 
        } finally { 
            setSaving(false); 
        }
    };

    const formatCurrency = (amount) => `RWF ${amount?.toLocaleString() || 0}`;

    const stats = [
        { label: 'Platform Earnings', value: formatCurrency(dashboard.platformEarnings), icon: <FaChartLine />, color: 'from-sage-500 to-sage-600' },
        { label: `Pending Payouts (${dashboard.pendingPayouts?.count || 0})`, value: formatCurrency(dashboard.pendingPayouts?.amount), icon: <FaDollarSign />, color: 'from-sand-500 to-sand-600' },
        { label: `Completed Payouts (${dashboard.completedPayouts?.count || 0})`, value: formatCurrency(dashboard.completedPayouts?.amount), icon: <FaMoneyBillWave />, color: 'from-terracotta-500 to-terracotta-600' },
        { label: 'Active Sellers', value: dashboard.activeSellers || 0, icon: <FaUsers />, color: 'from-blue-500 to-blue-600' },
    ];

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Commission Management</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Configure commission rates and payout settings</p>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-charcoal-500">Loading commission data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">{stat.icon}</div>
                                        </div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm opacity-80 mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Settings Card */}
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <div className="w-10 h-10 bg-terracotta-100 dark:bg-terracotta-900/20 rounded-xl flex items-center justify-center text-terracotta-600 dark:text-terracotta-400">
                                        <FaCog />
                                    </div>
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Commission Configuration</h3>
                                </div>

                                <form onSubmit={handleSaveSettings} className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Online Commission Rate (%)</label>
                                            <div className="relative">
                                                <FaPercent className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                                <input type="number" min="0" max="100" step="0.5" value={settings.defaultRate} onChange={e => setSettings({ ...settings, defaultRate: parseFloat(e.target.value) })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <p className="text-xs text-charcoal-500 mt-1.5">Commission for Online Orders</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">POS Commission Rate (%)</label>
                                            <div className="relative">
                                                <FaPercent className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                                <input type="number" min="0" max="100" step="0.5" value={settings.posRate ?? 5} onChange={e => setSettings({ ...settings, posRate: parseFloat(e.target.value) })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <p className="text-xs text-charcoal-500 mt-1.5">Commission for Seller POS Sales</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Minimum Payout Amount (RWF)</label>
                                            <div className="relative">
                                                <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                                <input type="number" min="0" step="1000" value={settings.minimumPayoutAmount} onChange={e => setSettings({ ...settings, minimumPayoutAmount: parseInt(e.target.value) })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                            </div>
                                            <p className="text-xs text-charcoal-500 mt-1.5">Sellers must earn at least this amount to request payout</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Payout Schedule</label>
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                                <select value={settings.payoutSchedule} onChange={e => setSettings({ ...settings, payoutSchedule: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none appearance-none">
                                                    <option value="manual">Manual (On Request)</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="biweekly">Bi-weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3">Payout Methods</label>
                                            <div className="flex flex-wrap gap-4">
                                                {['mobile_money', 'bank_transfer', 'paypal'].map(method => (
                                                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={settings.payoutMethods?.includes(method)}
                                                            onChange={e => {
                                                                const methods = settings.payoutMethods || [];
                                                                if (e.target.checked) setSettings({ ...settings, payoutMethods: [...methods, method] });
                                                                else setSettings({ ...settings, payoutMethods: methods.filter(m => m !== method) });
                                                            }}
                                                            className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                                        <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">{method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-cream-200 dark:border-charcoal-700 flex justify-end">
                                        <button type="submit" disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
                                            <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
