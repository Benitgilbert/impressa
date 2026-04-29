import { useState, useEffect, useCallback } from "react";
import axios from "../../utils/axiosInstance";
import { FaUserPlus, FaFileInvoiceDollar, FaTimes, FaMoneyBillWave, FaPrint, FaEdit, FaTrash, FaTags, FaSearch, FaSpinner } from "react-icons/fa";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

const AdminAbonne = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFicheModal, setShowFicheModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);

    const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientFiche, setClientFiche] = useState([]);
    const [payAmount, setPayAmount] = useState("");

    // Contract Prices State
    const [contractPrices, setContractPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [priceSearch, setPriceSearch] = useState("");
    const [loadingPrices, setLoadingPrices] = useState(false);

    const [siteSettings, setSiteSettings] = useState({ logo: null, siteName: "Abelus" });

    useEffect(() => {
        fetchClients();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get("/site-settings/public");
            if (res.data.success) {
                setSiteSettings(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch settings");
        }
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get("/abonnes");
            if (res.data.success) {
                setClients(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch abonnes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/abonnes", newClient);
            if (res.data.success) {
                setClients([...clients, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
                setShowAddModal(false);
                setNewClient({ name: "", phone: "", email: "" });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add client");
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`/abonnes/${selectedClient._id}`, selectedClient);
            if (res.data.success) {
                setClients(clients.map(c => c._id === selectedClient._id ? res.data.data : c));
                setShowEditModal(false);
                alert("Client updated successfully!");
            }
        } catch (err) {
            alert("Failed to update client");
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm("Are you sure? This will delete the client and all their transaction history.")) return;
        try {
            const res = await axios.delete(`/abonnes/${id}`);
            if (res.data.success) {
                setClients(clients.filter(c => c._id !== id));
                alert("Client deleted.");
            }
        } catch (err) {
            alert("Failed to delete client");
        }
    };

    const handleViewFiche = async (client) => {
        setSelectedClient(client);
        try {
            const res = await axios.get(`/abonnes/${client._id}/fiche`);
            if (res.data.success) {
                setClientFiche(res.data.transactions);
                setShowFicheModal(true);
            }
        } catch (err) {
            alert("Failed to load fiche");
        }
    };

    const handleManagePrices = async (client) => {
        setSelectedClient(client);
        setLoadingPrices(true);
        setShowPriceModal(true);
        try {
            const [pricesRes, prodRes] = await Promise.all([
                axios.get(`/abonnes/${client._id}/prices`),
                axios.get("/orders/admin/pos-products")
            ]);
            if (pricesRes.data.success) setContractPrices(pricesRes.data.data);
            if (prodRes.data.success) setProducts(prodRes.data.data);
        } catch (err) {
            console.error("Failed to load pricing data");
        } finally {
            setLoadingPrices(false);
        }
    };

    const updatePrice = async (productId, price) => {
        if (!price || price < 0) return;
        try {
            const res = await axios.post(`/abonnes/${selectedClient._id}/prices`, {
                productId,
                price: Number(price)
            });
            if (res.data.success) {
                // Update local state
                const existing = contractPrices.find(p => p.productId === productId);
                if (existing) {
                    setContractPrices(contractPrices.map(p => p.productId === productId ? res.data.data : p));
                } else {
                    setContractPrices([...contractPrices, res.data.data]);
                }
            }
        } catch (err) {
            alert("Failed to update price");
        }
    };

    const removePrice = async (productId) => {
        try {
            const res = await axios.delete(`/abonnes/${selectedClient._id}/prices/${productId}`);
            if (res.data.success) {
                setContractPrices(contractPrices.filter(p => p.productId !== productId));
            }
        } catch (err) {
            alert("Failed to remove custom price");
        }
    };

    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (!payAmount || isNaN(payAmount) || payAmount <= 0) return alert("Enter a valid amount");

        try {
            const res = await axios.post(`/abonnes/${selectedClient._id}/pay`, { amount: Number(payAmount) });
            if (res.data.success) {
                setClients(clients.map(c => c._id === selectedClient._id ? res.data.data : c));
                setShowPayModal(false);
                setPayAmount("");
                alert("Payment recorded successfully!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to record payment");
        }
    };

    const printFiche = () => {
        const printContent = document.getElementById("fiche-print-area").innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); 
    };

    const getCustomPrice = (productId) => {
        const cp = contractPrices.find(p => p.productId === productId);
        return cp ? cp.price : null;
    };

    return (
        <div className="flex h-screen bg-cream-50 dark:bg-charcoal-900 font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                <Topbar />
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Clients Abonnés</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage regular clients, custom pricing, and debt logs</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-terracotta-500/30"
                        >
                            <FaUserPlus /> New Client
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FaSpinner className="animate-spin text-4xl mb-4 text-terracotta-500" />
                            <p className="font-bold">Loading clients...</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-charcoal-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-bold">Client Name</th>
                                        <th className="p-4 font-bold">Contact Info</th>
                                        <th className="p-4 font-bold">Total Debt</th>
                                        <th className="p-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-700">
                                    {clients.map(client => (
                                        <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-charcoal-900 dark:text-white">{client.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {client._id}</div>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                                                <p>{client.phone || "No Phone"}</p>
                                                <p className="text-xs opacity-70">{client.email || "No Email"}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${client.totalDebt > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>
                                                     RWF {client.totalDebt.toLocaleString()}
                                                 </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setSelectedClient(client); setShowEditModal(true); }}
                                                        className="p-2 text-charcoal-400 hover:text-terracotta-500 transition-colors"
                                                        title="Edit Info"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleManagePrices(client)}
                                                        className="p-2 text-charcoal-400 hover:text-blue-500 transition-colors"
                                                        title="Contract Prices"
                                                    >
                                                        <FaTags size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClient(client._id)}
                                                        className="p-2 text-charcoal-400 hover:text-red-500 transition-colors"
                                                        title="Delete Client"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-1 group-hover:hidden">
                                                     <button
                                                        onClick={() => { setSelectedClient(client); setShowPayModal(true); }}
                                                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold"
                                                    >
                                                        Pay
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewFiche(client)}
                                                        className="px-3 py-1 bg-charcoal-900 text-white rounded-lg text-xs font-bold"
                                                    >
                                                        Fiche
                                                    </button>
                                                </div>
                                                {/* Desktop always visible actions for quick access */}
                                                <div className="hidden group-hover:flex justify-end gap-2 mt-1">
                                                     <button
                                                        onClick={() => { setSelectedClient(client); setShowPayModal(true); }}
                                                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                                                    >
                                                        Pay
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewFiche(client)}
                                                        className="px-3 py-1 bg-charcoal-900 text-white rounded-lg text-xs font-bold hover:bg-charcoal-800 transition-colors"
                                                    >
                                                        Fiche
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {clients.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400 italic">No abonné clients found. Click "New Client" to start.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">New Client Abonné</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 dark:text-white"
                                    placeholder="Enter client name"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 dark:text-white"
                                    placeholder="078..."
                                    value={newClient.phone}
                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 shadow-lg shadow-terracotta-500/20 transition-all"
                                >
                                    Create Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">Edit Client Info</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleUpdateClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white"
                                    value={selectedClient.name}
                                    onChange={e => setSelectedClient({ ...selectedClient, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white"
                                    value={selectedClient.phone || ""}
                                    onChange={e => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 shadow-lg shadow-terracotta-500/20 transition-all"
                                >
                                    Update Info
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Price Management Modal */}
            {showPriceModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-3xl w-full max-w-4xl p-8 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-charcoal-900 dark:text-white">Contract Prices</h2>
                                <p className="text-gray-500 text-sm">Special product rates for <span className="font-bold text-terracotta-500">{selectedClient.name}</span></p>
                            </div>
                            <button onClick={() => setShowPriceModal(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-charcoal-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"><FaTimes /></button>
                        </div>

                        <div className="relative mb-6">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products to override price..."
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-charcoal-700 border-2 border-transparent focus:border-terracotta-500 dark:text-white rounded-2xl outline-none shadow-sm transition-all"
                                value={priceSearch}
                                onChange={e => setPriceSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                            {loadingPrices ? (
                                <div className="text-center py-20 text-gray-400"><FaSpinner className="animate-spin text-3xl mx-auto mb-2" /> Loading data...</div>
                            ) : (
                                products.filter(p => p.name.toLowerCase().includes(priceSearch.toLowerCase())).map(product => {
                                    const customPrice = getCustomPrice(product._id);
                                    return (
                                        <div key={product._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-charcoal-700/40 rounded-2xl border border-gray-100 dark:border-charcoal-600 hover:border-terracotta-200 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-charcoal-600 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-charcoal-500">
                                                    {product.image ? (
                                                        <img src={`${process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${product.image}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaTags className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-charcoal-900 dark:text-white text-sm">{product.name}</p>
                                                    <p className="text-xs text-gray-500">Normal Price: <span className="font-bold">RWF {product.price.toLocaleString()}</span></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">RWF</span>
                                                    <input
                                                        type="number"
                                                        placeholder={product.price}
                                                        className={`w-32 pl-10 pr-3 py-2 bg-white dark:bg-charcoal-800 border-2 rounded-xl text-sm font-bold outline-none transition-all ${customPrice ? 'border-terracotta-500 text-terracotta-600' : 'border-gray-200 dark:border-charcoal-600 text-gray-400 focus:border-terracotta-500'}`}
                                                        value={customPrice || ""}
                                                        onChange={(e) => updatePrice(product._id, e.target.value)}
                                                    />
                                                </div>
                                                {customPrice && (
                                                    <button
                                                        onClick={() => removePrice(product._id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                        title="Remove override"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Debt Modal */}
            {showPayModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                <FaMoneyBillWave size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">Record Payment</h2>
                            <p className="text-gray-500 text-sm mt-1">{selectedClient.name} owes RWF {selectedClient.totalDebt.toLocaleString()}</p>
                        </div>
                        <form onSubmit={handlePayDebt} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Amount Paid (RWF)</label>
                                <input
                                    type="number"
                                    required
                                    max={selectedClient.totalDebt}
                                    className="w-full px-4 py-4 bg-gray-50 dark:bg-charcoal-700 border-2 border-gray-200 dark:border-charcoal-600 rounded-2xl outline-none focus:border-green-500 text-2xl font-black text-center dark:text-white"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-700 text-gray-600 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"
                                >
                                    Confirm Pay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fiche Modal */}
            {showFicheModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-5xl p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">Fiche de Client Abonné</h2>
                            <div className="flex gap-3">
                                <button onClick={printFiche} className="flex items-center gap-2 px-5 py-2.5 bg-charcoal-900 text-white rounded-xl font-bold hover:bg-charcoal-800 transition-all shadow-lg"><FaPrint /> Print Fiche</button>
                                <button onClick={() => setShowFicheModal(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-charcoal-700 rounded-full hover:bg-gray-200 transition-all"><FaTimes /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 bg-white" id="fiche-print-area">
                            <style>
                                {`
                                @media print {
                                    @page { margin: 15mm; }
                                    body { font-family: 'Inter', sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; }
                                    .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                                    .print-table th, .print-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
                                    .print-table th { background-color: #f3f4f6 !important; font-weight: 800; text-transform: uppercase; }
                                    .print-header { display: flex; justify-content: justify-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                                    .print-logo { height: 60px; width: auto; object-contain: contain; }
                                    .no-print { display: none; }
                                    .text-red-600 { color: #dc2626 !important; }
                                }
                                `}
                            </style>
                            <div className="p-8">
                                <div className="print-header flex justify-between items-center mb-8 border-b-[3px] border-black pb-6">
                                    <div className="flex items-center gap-4">
                                        {siteSettings.logo ? (
                                            <img src={siteSettings.logo} alt="Logo" className="print-logo h-16 w-auto" />
                                        ) : (
                                            <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-black text-3xl rounded-xl">
                                                {siteSettings.siteName.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-2xl font-black uppercase leading-tight">{siteSettings.siteName}</h1>
                                            <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Fiche de Suivi Client</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-black uppercase mb-1">FICHE DE CLIENT</h2>
                                        <p className="text-sm font-bold">CLIENT: <span className="underline decoration-black">{selectedClient.name}</span></p>
                                        <p className="text-xs font-mono mt-1 opacity-50">DATE: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <table className="print-table w-full border border-black text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black p-2">DATE</th>
                                            <th className="border border-black p-2">DESIGNATION / PRODUCT</th>
                                            <th className="border border-black p-2 text-center">QTY</th>
                                            <th className="border border-black p-2 text-right">PU (RWF)</th>
                                            <th className="border border-black p-2 text-right">PT (RWF)</th>
                                            <th className="border border-black p-2 text-right text-red-600">DEBT (RWF)</th>
                                            <th className="border border-black p-2">RESPONSIBLE</th>
                                            <th className="border border-black p-2">SIGNATURE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientFiche.map((tx, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-2">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="border border-black p-2 font-bold">{tx.designation}</td>
                                                <td className="border border-black p-2 text-center">{tx.quantity}</td>
                                                <td className="border border-black p-2 text-right">{tx.pu.toLocaleString()}</td>
                                                <td className="border border-black p-2 text-right">{tx.pt.toLocaleString()}</td>
                                                <td className="border border-black p-2 text-right font-bold text-red-600">{tx.debtAmount.toLocaleString()}</td>
                                                <td className="border border-black p-2 text-xs">{tx.responsible?.name || "System"}</td>
                                                <td className="border border-black p-2"></td>
                                            </tr>
                                        ))}
                                        {clientFiche.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-gray-500 italic">No unpaid transactions recorded.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {clientFiche.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-gray-50 font-black">
                                                <td colSpan="4" className="border border-black p-3 text-right text-xs">TOTAL GLOBAL (TG):</td>
                                                <td className="border border-black p-3 text-right">{clientFiche.reduce((sum, tx) => sum + tx.pt, 0).toLocaleString()}</td>
                                                <td className="border border-black p-3 text-right text-red-600">RWF {selectedClient.totalDebt.toLocaleString()}</td>
                                                <td colSpan="2" className="border border-black p-3 bg-white"></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>

                                <div className="mt-12 grid grid-cols-2 gap-20">
                                    <div className="text-center">
                                        <p className="font-bold border-b border-black pb-2 mb-20 uppercase text-xs tracking-widest">Le Client</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold border-b border-black pb-2 mb-20 uppercase text-xs tracking-widest">Le Gérant / {siteSettings.siteName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAbonne;
