import { useState, useEffect, useCallback } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaStar, FaTimes,
    FaQuoteLeft, FaToggleOn, FaToggleOff, FaUser
} from 'react-icons/fa';
import api from '../utils/axiosInstance';

export default function AdminTestimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({ name: '', role: 'Customer', content: '', avatar: '', rating: 5, isActive: true, featured: false });




    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000); return () => clearTimeout(t); } }, [error, success]);

    const fetchTestimonials = useCallback(async () => {
        try {
            const res = await api.get('/testimonials');
            if (res.data.success) setTestimonials(res.data.data);
        } catch (err) { setError('Failed to fetch testimonials'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = editingTestimonial 
                ? await api.put(`/testimonials/${editingTestimonial.id}`, form)
                : await api.post('/testimonials', form);
            if (res.data.success) { setSuccess(editingTestimonial ? 'Testimonial updated!' : 'Testimonial created!'); fetchTestimonials(); closeModal(); }
            else setError(res.data.message || 'Failed to save');
        } catch (err) { setError('Failed to save testimonial'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this testimonial?')) return;
        try {
            const res = await api.delete(`/testimonials/${id}`);
            if (res.data.success) { setSuccess('Testimonial deleted!'); fetchTestimonials(); }
        } catch (err) { setError('Failed to delete'); }
    };

    const handleToggle = async (id) => {
        try {
            const res = await api.patch(`/testimonials/${id}/toggle`);
            if (res.data.success) fetchTestimonials();
        } catch (err) { setError('Failed to toggle'); }
    };

    const openModal = (testimonial = null) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setForm({ name: testimonial.name || '', role: testimonial.role || 'Customer', content: testimonial.content || '', avatar: testimonial.avatar || '', rating: testimonial.rating || 5, isActive: testimonial.isActive !== false, featured: testimonial.featured || false });
        } else {
            setEditingTestimonial(null);
            setForm({ name: '', role: 'Customer', content: '', avatar: '', rating: 5, isActive: true, featured: false });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingTestimonial(null); setError(''); };

    const renderStars = (rating) => [...Array(5)].map((_, i) => (
        <FaStar key={i} className={i < rating ? 'text-sand-500' : 'text-charcoal-200 dark:text-charcoal-600'} />
    ));

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Customer Testimonials</h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage homepage testimonials</p>
                        </div>
                        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">
                            <FaPlus /> Add Testimonial
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
                    {success && <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">{success}</div>}

                    {/* Testimonials Grid */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-charcoal-500">Loading testimonials...</p>
                        </div>
                    ) : testimonials.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700">
                            <FaQuoteLeft className="text-5xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-2">No Testimonials Yet</h3>
                            <p className="text-charcoal-500">Add customer testimonials to display on your homepage</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {testimonials.map((testimonial) => (
                                <div key={testimonial.id} className={`relative bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 p-6 transition-all ${!testimonial.isActive ? 'opacity-60' : ''}`}>
                                    {/* Featured Badge */}
                                    {testimonial.featured && (
                                        <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-sand-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                                            <FaStar className="text-[10px]" /> Featured
                                        </span>
                                    )}

                                    {/* Quote Icon */}
                                    <FaQuoteLeft className="text-3xl text-terracotta-200 dark:text-terracotta-900/30 mb-4" />

                                    {/* Content */}
                                    <p className="text-charcoal-600 dark:text-charcoal-400 italic mb-4 line-clamp-4">"{testimonial.content}"</p>

                                    {/* Rating */}
                                    <div className="flex gap-0.5 mb-4">{renderStars(testimonial.rating)}</div>

                                    {/* Author */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-cream-200 dark:bg-charcoal-700 overflow-hidden flex items-center justify-center">
                                            {testimonial.avatar ? (
                                                <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FaUser className="text-charcoal-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-charcoal-800 dark:text-white">{testimonial.name}</h4>
                                            <span className="text-sm text-charcoal-500 dark:text-charcoal-400">{testimonial.role}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                        <button onClick={() => handleToggle(testimonial.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${testimonial.isActive ? 'text-sage-600 hover:bg-sage-50 dark:hover:bg-sage-900/20' : 'text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'}`}>
                                            {testimonial.isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                                            {testimonial.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                        <div className="flex gap-1">
                                            <button onClick={() => openModal(testimonial)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><FaEdit /></button>
                                            <button onClick={() => handleDelete(testimonial.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><FaTrash /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                    <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
                                    <button onClick={closeModal} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"><FaTimes /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Name *</label>
                                            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
                                                className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Role</label>
                                            <input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Customer"
                                                className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Testimonial *</label>
                                        <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write the customer's testimonial here..."
                                            rows={4} className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none resize-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Avatar URL</label>
                                        <input type="url" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="https://example.com/avatar.jpg (optional)"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} type="button" onClick={() => setForm({ ...form, rating: star })}
                                                    className={`p-2 rounded-lg transition-all ${star <= form.rating ? 'text-sand-500 bg-sand-50 dark:bg-sand-900/20' : 'text-charcoal-300 hover:text-sand-400'}`}>
                                                    <FaStar className="text-xl" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500" />
                                            <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">Active</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="w-5 h-5 rounded border-charcoal-300 text-sand-500 focus:ring-sand-500" />
                                            <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">Featured</span>
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-700">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all">{editingTestimonial ? 'Update' : 'Add Testimonial'}</button>
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
