import { useState, useEffect } from 'react';
import {
    FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaCog,
    FaTruck, FaShieldAlt, FaUndo, FaHeadset, FaStar, FaHeart, FaCheck, FaClock,
    FaToggleOn, FaToggleOff, FaArrowUp, FaArrowDown, FaRedo,
    FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const iconOptions = [
    { value: 'truck', label: 'Truck (Shipping)', icon: <FaTruck /> },
    { value: 'shield', label: 'Shield (Security)', icon: <FaShieldAlt /> },
    { value: 'undo', label: 'Undo (Returns)', icon: <FaUndo /> },
    { value: 'headset', label: 'Headset (Support)', icon: <FaHeadset /> },
    { value: 'clock', label: 'Clock (Time)', icon: <FaClock /> },
    { value: 'star', label: 'Star (Quality)', icon: <FaStar /> },
    { value: 'check', label: 'Check (Verified)', icon: <FaCheck /> },
    { value: 'heart', label: 'Heart (Care)', icon: <FaHeart /> }
];

export default function AdminSiteSettings() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [editingIndex, setEditingIndex] = useState(-1);

    const [badgeForm, setBadgeForm] = useState({ icon: 'truck', title: '', description: '', isActive: true });
    const [footerForm, setFooterForm] = useState({
        footerTagline: '', contactEmail: '', contactPhone: '', contactAddress: '',
        googleMapsQuery: '',
        socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' }
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace(/\/api$/, '');

    useEffect(() => { fetchSettings(); }, []);
    useEffect(() => {
        if (settings) {
            setFooterForm({
                footerTagline: settings.footerTagline || '', contactEmail: settings.contactEmail || '',
                contactPhone: settings.contactPhone || '', contactAddress: settings.contactAddress || '',
                googleMapsQuery: settings.googleMapsQuery || '',
                socialLinks: settings.socialLinks || { facebook: '', twitter: '', instagram: '', linkedin: '' }
            });
        }
    }, [settings]);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/site-settings`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setSettings(data.data);
        } catch (err) { setError('Failed to fetch settings'); }
        finally { setLoading(false); }
    };

    const saveTrustBadges = async (badges) => {
        setSaving(true); setError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/site-settings/trust-badges`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ trustBadges: badges })
            });
            const data = await res.json();
            if (data.success) { setSuccess('Trust badges saved!'); fetchSettings(); }
            else setError(data.message || 'Failed to save');
        } catch (err) { setError('Failed to save trust badges'); }
        finally { setSaving(false); }
    };

    const saveFooterSettings = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/site-settings/footer`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(footerForm)
            });
            const data = await res.json();
            if (data.success) { setSuccess('Footer settings saved!'); fetchSettings(); }
            else setError(data.message || 'Failed to save footer settings');
        } catch (err) { setError('Failed to save footer settings'); }
        finally { setSaving(false); }
    };

    const handleAddBadge = () => { setEditingBadge(null); setEditingIndex(-1); setBadgeForm({ icon: 'truck', title: '', description: '', isActive: true }); setShowModal(true); };
    const handleEditBadge = (badge, index) => { setEditingBadge(badge); setEditingIndex(index); setBadgeForm({ icon: badge.icon, title: badge.title, description: badge.description, isActive: badge.isActive }); setShowModal(true); };
    const handleSaveBadge = (e) => {
        e.preventDefault();
        const updatedBadges = [...(settings?.trustBadges || [])];
        if (editingIndex >= 0) updatedBadges[editingIndex] = { ...updatedBadges[editingIndex], ...badgeForm };
        else updatedBadges.push({ ...badgeForm, order: updatedBadges.length });
        saveTrustBadges(updatedBadges); setShowModal(false);
    };
    const handleDeleteBadge = (index) => { if (!window.confirm('Delete this trust badge?')) return; const updatedBadges = settings.trustBadges.filter((_, i) => i !== index); saveTrustBadges(updatedBadges); };
    const handleToggleBadge = (index) => { const updatedBadges = [...settings.trustBadges]; updatedBadges[index].isActive = !updatedBadges[index].isActive; saveTrustBadges(updatedBadges); };
    const handleMoveUp = (index) => { if (index === 0) return; const updatedBadges = [...settings.trustBadges];[updatedBadges[index - 1], updatedBadges[index]] = [updatedBadges[index], updatedBadges[index - 1]]; saveTrustBadges(updatedBadges); };
    const handleMoveDown = (index) => { if (index === settings.trustBadges.length - 1) return; const updatedBadges = [...settings.trustBadges];[updatedBadges[index], updatedBadges[index + 1]] = [updatedBadges[index + 1], updatedBadges[index]]; saveTrustBadges(updatedBadges); };
    const handleResetDefaults = async () => {
        if (!window.confirm('Reset trust badges to defaults? This will remove all custom badges.')) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/site-settings/trust-badges/reset`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setSuccess('Trust badges reset to defaults!'); fetchSettings(); }
        } catch (err) { setError('Failed to reset'); }
    };

    const getIconComponent = (iconName) => {
        const iconMap = { truck: <FaTruck />, shield: <FaShieldAlt />, undo: <FaUndo />, headset: <FaHeadset />, clock: <FaClock />, star: <FaStar />, check: <FaCheck />, heart: <FaHeart /> };
        return iconMap[iconName] || <FaShieldAlt />;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-cream-100 dark:bg-charcoal-900">
            <div className="w-12 h-12 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Site Settings" />
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Site Configuration</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage trust badges and footer information</p>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    <div className="space-y-6">
                        {/* Trust Badges Section */}
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                            <div className="p-6 border-b border-cream-100 dark:border-charcoal-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white flex items-center gap-2"><FaShieldAlt className="text-terracotta-500" /> Trust Badges</h3>
                                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Badges displayed on homepage to build trust</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleResetDefaults} className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-300 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors flex items-center gap-2"><FaRedo /> Reset Defaults</button>
                                    <button onClick={handleAddBadge} className="px-4 py-2 text-sm font-bold text-white bg-terracotta-500 hover:bg-terracotta-600 rounded-xl transition-colors flex items-center gap-2 shadow-md"><FaPlus /> Add Badge</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                {settings?.trustBadges?.length === 0 ? (
                                    <div className="p-12 text-center text-charcoal-500">
                                        <FaShieldAlt className="text-4xl mx-auto mb-3 opacity-20" />
                                        <p>No Trust Badges Configured</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-cream-50 dark:bg-charcoal-900">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider w-20">Order</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider w-20">Icon</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Title</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                            {settings?.trustBadges?.map((badge, index) => (
                                                <tr key={index} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-1 text-charcoal-400 hover:text-charcoal-600 disabled:opacity-30"><FaArrowUp size={10} /></button>
                                                            <button onClick={() => handleMoveDown(index)} disabled={index === settings.trustBadges.length - 1} className="p-1 text-charcoal-400 hover:text-charcoal-600 disabled:opacity-30"><FaArrowDown size={10} /></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-2xl text-terracotta-500">{getIconComponent(badge.icon)}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-charcoal-800 dark:text-white">{badge.title}</td>
                                                    <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">{badge.description}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.isActive ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400' : 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400'}`}>
                                                            {badge.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleToggleBadge(index)} className={`p-2 rounded-lg transition-colors ${badge.isActive ? 'text-sage-500 bg-sage-50 dark:bg-sage-900/10' : 'text-charcoal-400 bg-charcoal-100 dark:bg-charcoal-700'}`}>{badge.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}</button>
                                                            <button onClick={() => handleEditBadge(badge, index)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><FaEdit /></button>
                                                            <button onClick={() => handleDeleteBadge(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><FaTrash /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Footer Settings Section */}
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                            <div className="p-6 border-b border-cream-100 dark:border-charcoal-700">
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white flex items-center gap-2"><FaCog className="text-terracotta-500" /> Footer Settings</h3>
                                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Configure footer contact info and social links</p>
                            </div>

                            <form onSubmit={saveFooterSettings} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2"><FaEnvelope className="inline mr-2 text-terracotta-500" /> Contact Email</label>
                                        <input type="email" value={footerForm.contactEmail} onChange={(e) => setFooterForm({ ...footerForm, contactEmail: e.target.value })} placeholder="support@example.com"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2"><FaPhone className="inline mr-2 text-terracotta-500" /> Contact Phone</label>
                                        <input type="text" value={footerForm.contactPhone} onChange={(e) => setFooterForm({ ...footerForm, contactPhone: e.target.value })} placeholder="+250 788 123 456"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2"><FaMapMarkerAlt className="inline mr-2 text-terracotta-500" /> Address</label>
                                    <input type="text" value={footerForm.contactAddress} onChange={(e) => setFooterForm({ ...footerForm, contactAddress: e.target.value })} placeholder="123 Commerce St, Kigali, Rwanda"
                                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2"><FaMapMarkerAlt className="inline mr-2 text-terracotta-500" /> Google Maps Query / Coordinates</label>
                                    <input type="text" value={footerForm.googleMapsQuery} onChange={(e) => setFooterForm({ ...footerForm, googleMapsQuery: e.target.value })} placeholder="e.g. 1°34'49.5&quot;S 30°04'07.7&quot;E"
                                        className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    <p className="text-[10px] text-charcoal-400 mt-1 italic">You can enter an address or coordinates (Latitude, Longitude)</p>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Footer Tagline</label>
                                    <textarea value={footerForm.footerTagline} onChange={(e) => setFooterForm({ ...footerForm, footerTagline: e.target.value })} placeholder="Your premium destination..." rows={3}
                                        className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 resize-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-4">Social Media Links</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600"><FaFacebookF /></div>
                                            <input type="url" value={footerForm.socialLinks.facebook} onChange={(e) => setFooterForm({ ...footerForm, socialLinks: { ...footerForm.socialLinks, facebook: e.target.value } })} placeholder="Facebook URL"
                                                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-400"><FaTwitter /></div>
                                            <input type="url" value={footerForm.socialLinks.twitter} onChange={(e) => setFooterForm({ ...footerForm, socialLinks: { ...footerForm.socialLinks, twitter: e.target.value } })} placeholder="Twitter URL"
                                                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-500"><FaInstagram /></div>
                                            <input type="url" value={footerForm.socialLinks.instagram} onChange={(e) => setFooterForm({ ...footerForm, socialLinks: { ...footerForm.socialLinks, instagram: e.target.value } })} placeholder="Instagram URL"
                                                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-700"><FaLinkedinIn /></div>
                                            <input type="url" value={footerForm.socialLinks.linkedin} onChange={(e) => setFooterForm({ ...footerForm, socialLinks: { ...footerForm.socialLinks, linkedin: e.target.value } })} placeholder="LinkedIn URL"
                                                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-cream-100 dark:border-charcoal-700 flex justify-end">
                                    <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all">
                                        <FaSave /> {saving ? 'Saving...' : 'Save Footer Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Badge Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{editingIndex >= 0 ? 'Edit Trust Badge' : 'Add Trust Badge'}</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>
                                <form onSubmit={handleSaveBadge} className="p-6 space-y-5">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3">Select Icon</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {iconOptions.map((opt) => (
                                                <div key={opt.value} onClick={() => setBadgeForm({ ...badgeForm, icon: opt.value })}
                                                    className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${badgeForm.icon === opt.value ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-600 dark:bg-terracotta-900/30 dark:text-terracotta-400' : 'bg-cream-50 dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 text-charcoal-500 dark:text-charcoal-400 hover:border-terracotta-300'}`}>
                                                    <div className="text-2xl mb-1">{opt.icon}</div>
                                                    <span className="text-[10px] text-center font-medium leading-tight">{opt.label.split(' ')[1].replace(/[()]/g, '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Title *</label>
                                        <input type="text" required maxLength={50} value={badgeForm.title} onChange={(e) => setBadgeForm({ ...badgeForm, title: e.target.value })} placeholder="e.g., Free Shipping"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Description *</label>
                                        <input type="text" required maxLength={100} value={badgeForm.description} onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })} placeholder="e.g., On orders over 50,000 Rwf"
                                            className="w-full px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-3 p-3 bg-cream-50 dark:bg-charcoal-700 rounded-xl cursor-pointer">
                                            <input type="checkbox" checked={badgeForm.isActive} onChange={(e) => setBadgeForm({ ...badgeForm, isActive: e.target.checked })} className="w-5 h-5 text-terracotta-500 rounded focus:ring-terracotta-500 border-gray-300" />
                                            <span className="text-sm font-medium text-charcoal-800 dark:text-white">Active (Visible on homepage)</span>
                                        </label>
                                    </div>
                                    <div className="pt-2 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-charcoal-600 dark:text-charcoal-300 font-medium hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white font-bold rounded-xl shadow-md transition-all"><FaSave /> {editingIndex >= 0 ? 'Update Badge' : 'Add Badge'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
