import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaPlus, FaFolder, FaImage, FaTimes } from "react-icons/fa";
import api from '../utils/axiosInstance';

const colorOptions = [
    { label: 'Terracotta → Sand', value: 'from-terracotta-500 to-sand-400' },
    { label: 'Sage → Teal', value: 'from-sage-500 to-teal-500' },
    { label: 'Blue → Cyan', value: 'from-blue-500 to-cyan-500' },
    { label: 'Pink → Rose', value: 'from-pink-500 to-rose-500' },
    { label: 'Amber → Orange', value: 'from-amber-500 to-orange-500' },
    { label: 'Green → Emerald', value: 'from-green-500 to-emerald-500' },
    { label: 'Violet → Purple', value: 'from-violet-500 to-purple-500' },
    { label: 'Indigo → Blue', value: 'from-indigo-500 to-blue-500' },
    { label: 'Fuchsia → Pink', value: 'from-fuchsia-500 to-pink-500' },
    { label: 'Charcoal → Slate', value: 'from-charcoal-600 to-slate-600' },
];

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        parent: '',
        image: '',
        color: 'from-terracotta-500 to-sand-400',
        isActive: true,
    });

    const fetchCategories = useCallback(async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setError('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = editingCategory
                ? `/categories/${editingCategory.id}`
                : `/categories`;

            const res = await api({
                method: editingCategory ? 'put' : 'post',
                url: url,
                data: { ...form, parentId: form.parent || null }
            });

            if (res.data.success) {
                setSuccess(editingCategory ? 'Category updated!' : 'Category created!');
                fetchCategories();
                closeModal();
            } else {
                setError(res.data.message || 'Failed to save category');
            }
        } catch (err) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || 'Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const res = await api.delete(`/categories/${id}`);
            if (res.data.success) {
                setSuccess('Category deleted!');
                fetchCategories();
            } else {
                setError(res.data.message || 'Failed to delete category');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setForm({
                name: category.name || '',
                description: category.description || '',
                parent: category.parentId || category.parent?.id || '',
                image: category.image || '',
                color: category.color || 'from-terracotta-500 to-sand-400',
                isActive: category.isActive !== false,
            });
        } else {
            setEditingCategory(null);
            setForm({
                name: '',
                description: '',
                parent: '',
                image: '',
                color: 'from-terracotta-500 to-sand-400',
                isActive: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setError('');
    };

    return (
        <div className="min-h-screen flex flex-col transition-all duration-300">
            <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Product Categories</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage product categories and their hierarchy</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-terracotta-500/20 active:scale-95"
                    >
                        <FaPlus className="text-sm" /> Add Category
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 rounded-xl text-sm">
                        {success}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-12 text-center border border-cream-200 dark:border-charcoal-700">
                        <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-charcoal-500 dark:text-charcoal-400">Loading categories...</p>
                    </div>
                ) : (
                    /* Categories Table */
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-cream-50 dark:bg-charcoal-900">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Color</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Parent</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <FaFolder className="text-4xl text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
                                                <p className="text-charcoal-500 dark:text-charcoal-400">No categories yet</p>
                                                <p className="text-sm text-charcoal-400 dark:text-charcoal-500">Click "Add Category" to create one</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((cat) => (
                                            <tr key={cat.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    {cat.image ? (
                                                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center">
                                                            <FaImage className="text-charcoal-400" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-charcoal-800 dark:text-white">{cat.name}</div>
                                                    {cat.description && (
                                                        <div className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 line-clamp-1">
                                                            {cat.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`w-16 h-8 rounded-lg bg-gradient-to-r ${cat.color || 'from-terracotta-500 to-sand-400'}`} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                                                    {cat.parent?.name || <span className="text-charcoal-400">—</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cat.isActive
                                                        ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400'
                                                        : 'bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400'
                                                        }`}>
                                                        {cat.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openModal(cat)}
                                                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cat.id)}
                                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y divide-cream-100 dark:divide-charcoal-700">
                            {categories.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FaFolder className="text-4xl text-charcoal-300 mx-auto mb-3" />
                                    <p className="text-charcoal-500">No categories yet</p>
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="p-4 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {cat.image ? (
                                                <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center">
                                                    <FaImage className="text-charcoal-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-charcoal-800 dark:text-white">{cat.name}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive
                                                        ? 'bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-400'
                                                        : 'bg-charcoal-100 text-charcoal-600'
                                                        }`}>
                                                        {cat.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <div className={`w-16 h-4 rounded mt-2 bg-gradient-to-r ${cat.color || 'from-terracotta-500 to-sand-400'}`} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-3">
                                            <button
                                                onClick={() => openModal(cat)}
                                                className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-charcoal-700">
                                <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h3>
                                <button onClick={closeModal} className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                                            Category Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g., Electronics"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                                            Parent Category
                                        </label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                            value={form.parent}
                                            onChange={(e) => setForm({ ...form, parent: e.target.value })}
                                        >
                                            <option value="">None (Top Level)</option>
                                            {categories
                                                .filter(c => c.id !== editingCategory?.id)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors resize-none"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of this category"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors"
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {form.image && (
                                        <div className="mt-2 p-2 bg-cream-50 dark:bg-charcoal-700 rounded-lg">
                                            <img
                                                src={form.image}
                                                alt="Preview"
                                                className="h-20 w-auto object-contain rounded"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                                        Card Color Gradient
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, color: color.value })}
                                                className={`
                                                    h-10 rounded-lg bg-gradient-to-r ${color.value} 
                                                    transition-all hover:scale-105 
                                                    ${form.color === color.value ? 'ring-2 ring-offset-2 ring-charcoal-800 dark:ring-white' : ''}
                                                `}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-charcoal-300 text-terracotta-500 focus:ring-terracotta-500"
                                    />
                                    <span className="text-sm text-charcoal-700 dark:text-charcoal-300">
                                        Active (visible to customers)
                                    </span>
                                </label>
                            </form>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-cream-200 dark:border-charcoal-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-terracotta-500/20 active:scale-95"
                                >
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
