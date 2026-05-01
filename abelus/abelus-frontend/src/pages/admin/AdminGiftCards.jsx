import React, { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaTrash, FaTimes, FaQrcode, FaGift, FaCopy, FaCalendarAlt, FaUser } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const AdminGiftCards = () => {
    const [giftcards, setGiftcards] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        productId: "",
        count: 1,
        note: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [gcRes, prodRes] = await Promise.all([
                api.get("/giftcards"),
                api.get("/giftcards/products")
            ]);
            setGiftcards(gcRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            toast.error("Failed to load gift card data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post("/giftcards/generate", formData);
            toast.success(`${formData.count} cards generated successfully`);
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error("Generation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this card?")) return;
        try {
            await api.delete(`/giftcards/${id}`);
            toast.success("Card deleted");
            fetchData();
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    const filteredCards = giftcards.filter(card => {
        const codeMatch = card.code.toLowerCase().includes(searchTerm.toLowerCase());
        const ownerMatch = card.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filterStatus === "all" || card.status === filterStatus;
        return (codeMatch || ownerMatch) && statusMatch;
    });

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Active Gift Cards</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Track usage, generate codes, and manage card inventory</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-charcoal-900 dark:bg-terracotta-500 hover:bg-charcoal-800 dark:hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-charcoal-900/20 dark:shadow-terracotta-500/30"
                        >
                            <FaQrcode /> Generate Cards
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by code or owner..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent rounded-xl text-sm font-bold text-charcoal-800 dark:text-white outline-none cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="redeemed">Redeemed</option>
                                <option value="expired">Expired</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Found: <span className="text-charcoal-900 dark:text-white">{filteredCards.length} Cards</span>
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400 font-bold uppercase tracking-widest text-[10px]">Syncing Cards...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Card Code</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Product / Value</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Owner</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-black text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {filteredCards.map((card) => (
                                            <tr key={card.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-600 dark:text-charcoal-300">
                                                            <FaGift size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="font-mono font-black text-charcoal-900 dark:text-white flex items-center gap-2 text-xs">
                                                                {card.code}
                                                                <button 
                                                                    onClick={() => { navigator.clipboard.writeText(card.code); toast.success("Copied!"); }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-terracotta-500 transition-all"
                                                                >
                                                                    <FaCopy size={10} />
                                                                </button>
                                                            </div>
                                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Created: {new Date(card.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-charcoal-800 dark:text-white">{card.product?.name || "Standard Card"}</div>
                                                    <div className="text-terracotta-500 font-black text-xs">RWF {card.currentBalance.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {card.owner ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-cream-200 dark:bg-charcoal-600 flex items-center justify-center text-[10px] font-black">{card.owner.name.charAt(0)}</div>
                                                            <span className="text-charcoal-700 dark:text-charcoal-300 font-medium">{card.owner.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">No owner assigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        card.status === 'active' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
                                                        card.status === 'redeemed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                                                        card.status === 'expired' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
                                                        'bg-gray-100 text-gray-500 dark:bg-charcoal-700'
                                                    }`}>
                                                        {card.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDelete(card.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-400 hover:text-red-500 transition-all"
                                                            title="Delete"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredCards.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No gift cards found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Generator Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">Generate Cards</h2>
                                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Select Card Product</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white font-bold cursor-pointer text-sm"
                                            value={formData.productId}
                                            onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                        >
                                            <option value="">Select a product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (RWF {p.value.toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Quantity to Generate</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="100"
                                            className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white font-bold"
                                            value={formData.count}
                                            onChange={e => setFormData({ ...formData, count: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Internal Note (Optional)</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white h-24 resize-none"
                                            placeholder="Batch purpose or details..."
                                            value={formData.note}
                                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 shadow-lg shadow-terracotta-500/20 transition-all"
                                        >
                                            Generate Now
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminGiftCards;
