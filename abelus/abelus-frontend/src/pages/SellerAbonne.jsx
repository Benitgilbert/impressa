import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import { FaUserPlus, FaFileInvoiceDollar, FaTimes, FaMoneyBillWave, FaPrint, FaTag, FaPlus, FaTrash } from "react-icons/fa";

import SellerSidebar from "../components/SellerSidebar";
import Topbar from "../components/Topbar";


const SellerAbonne = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFicheModal, setShowFicheModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);

    const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [clientFiche, setClientFiche] = useState([]);
    const [payAmount, setPayAmount] = useState("");

    // Contract Prices State
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [contractPrices, setContractPrices] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [newPrice, setNewPrice] = useState({ productId: "", price: "" });
    const [savingPrice, setSavingPrice] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");

    useEffect(() => {
        fetchClients();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get("/orders/seller/pos-products");
            if (res.data.success) {
                setAllProducts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch products");
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

    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (!payAmount || isNaN(payAmount) || payAmount <= 0) return alert("Enter a valid amount");

        try {
            const res = await axios.post(`/abonnes/${selectedClient._id}/pay`, { amount: Number(payAmount) });
            if (res.data.success) {
                // Update client in list
                setClients(clients.map(c => c._id === selectedClient._id ? res.data.data : c));
                setShowPayModal(false);
                setPayAmount("");
                alert("Payment recorded successfully!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to record payment");
        }
    };

    const handleViewPrices = async (client) => {
        setSelectedClient(client);
        try {
            const res = await axios.get(`/abonnes/${client._id}/prices`);
            if (res.data.success) {
                setContractPrices(res.data.data);
                setShowPriceModal(true);
            }
        } catch (err) {
            alert("Failed to load contract prices");
        }
    };

    const handleAddContractPrice = async (e) => {
        e.preventDefault();
        if (!newPrice.productId || !newPrice.price) return alert("Select product and enter price");
        
        try {
            setSavingPrice(true);
            const res = await axios.post(`/abonnes/${selectedClient._id}/prices`, newPrice);
            if (res.data.success) {
                // Refresh prices
                const freshRes = await axios.get(`/abonnes/${selectedClient._id}/prices`);
                setContractPrices(freshRes.data.data);
                setNewPrice({ productId: "", price: "" });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to set price");
        } finally {
            setSavingPrice(false);
        }
    };

    const handleDeletePrice = async (priceId) => {
        if (!window.confirm("Remove this contract price?")) return;
        try {
            const res = await axios.delete(`/abonnes/${selectedClient._id}/prices/${priceId}`);
            if (res.data.success) {
                setContractPrices(contractPrices.filter(p => p.id !== priceId));
            }
        } catch (err) {
            alert("Failed to remove price");
        }
    };

    const printFiche = () => {
        const printContent = document.getElementById("fiche-print-area").innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore React state bindings
    };

    return (
        <div className="flex h-screen bg-cream-50 dark:bg-charcoal-900 font-sans">
            <SellerSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">

                <Topbar />
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Clients Abonnés</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage regular clients and their tabs</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-terracotta-500/30"
                        >
                            <FaUserPlus /> New Client
                        </button>
                    </div>

                    {/* Client Search Bar */}
                    <div className="relative mb-6">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search client by name or phone..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-charcoal-800 border border-gray-100 dark:border-charcoal-700 rounded-2xl outline-none focus:border-terracotta-500 dark:text-white shadow-sm"
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-bold">Loading clients...</div>
                    ) : (
                        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-charcoal-700/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-bold">Client Name</th>
                                        <th className="p-4 font-bold">Contact</th>
                                        <th className="p-4 font-bold">Total Debt (RWF)</th>
                                        <th className="p-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-700">
                                    {clients
                                        .filter(c => 
                                            c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
                                            (c.phone && c.phone.includes(clientSearchTerm))
                                        )
                                        .map(client => (
                                        <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors">
                                            <td className="p-4 font-bold text-charcoal-900 dark:text-white">{client.name}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                                                {client.phone || client.email || "N/A"}
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-black ${client.totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {client.totalDebt.toLocaleString()}
                                                </span>

                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedClient(client);
                                                        setShowPayModal(true);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors"
                                                    title="Record Payment"
                                                >
                                                    <FaMoneyBillWave /> Pay
                                                </button>
                                                <button
                                                    onClick={() => handleViewFiche(client)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                                                    title="View Fiche"
                                                >
                                                    <FaFileInvoiceDollar /> Fiche
                                                </button>
                                                <button
                                                    onClick={() => handleViewPrices(client)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors"
                                                    title="Contract Prices"
                                                >
                                                    <FaTag /> Prices
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {clients.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No abonné clients found. Add one to get started!</td>
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
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-black mb-4 text-charcoal-900 dark:text-white">Add Client Abonné</h2>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 dark:text-white"
                                    value={newClient.phone}
                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-terracotta-500 text-white rounded-xl font-bold hover:bg-terracotta-600 transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Debt Modal */}
            {showPayModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-black mb-1 text-charcoal-900 dark:text-white">Record Bank Payment</h2>
                        <p className="text-gray-500 text-sm mb-6">For: {selectedClient.name} (Owes RWF {selectedClient.totalDebt.toLocaleString()})</p>
                        <form onSubmit={handlePayDebt} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount Paid (RWF)</label>
                                <input
                                    type="number"
                                    required
                                    max={selectedClient.totalDebt}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl outline-none focus:border-terracotta-500 text-xl font-bold dark:text-white"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-charcoal-700 text-charcoal-800 dark:text-white rounded-xl font-bold hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
                                >
                                    Confirm Payment
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
                                <button onClick={printFiche} className="flex items-center gap-2 px-4 py-2 bg-charcoal-900 text-white rounded-lg font-bold hover:bg-charcoal-800"><FaPrint /> Print</button>
                                <button onClick={() => setShowFicheModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg font-bold hover:bg-gray-300"><FaTimes /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 bg-white" id="fiche-print-area">
                            <style>
                                {`
                                @media print {
                                    @page { margin: 20px; }
                                    body { font-family: sans-serif; background: white; color: black; }
                                    .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                                    .print-table th, .print-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                                    .print-header { margin-bottom: 30px; }
                                    .no-print { display: none; }
                                }
                                `}
                            </style>

                            <div className="p-8">
                                <div className="print-header flex justify-between items-end mb-8 border-b-2 border-black pb-4">
                                    <div>
                                        <h1 className="text-3xl font-black uppercase mb-1">FICHE DE CLIENT ABONNÉ</h1>
                                        <p className="text-lg font-bold">NOM DU CLIENT: <span className="underline decoration-dotted underline-offset-4">{selectedClient.name}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">Total Debt: <span className="font-black text-lg">RWF {selectedClient.totalDebt.toLocaleString()}</span></p>
                                    </div>
                                </div>

                                <table className="print-table w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 p-2">DATE</th>
                                            <th className="border border-gray-300 p-2">DESIGNATION</th>
                                            <th className="border border-gray-300 p-2">QUANTITY</th>
                                            <th className="border border-gray-300 p-2">PU (RWF)</th>
                                            <th className="border border-gray-300 p-2">PT (RWF)</th>
                                            <th className="border border-gray-300 p-2 text-red-600">OWED (RWF)</th>
                                            <th className="border border-gray-300 p-2">RESPONSIBLE</th>
                                            <th className="border border-gray-300 p-2">SIGNATURE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientFiche.map((tx, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-gray-300 p-2">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="border border-gray-300 p-2 font-bold">{tx.designation}</td>
                                                <td className="border border-gray-300 p-2 text-center">{tx.quantity}</td>
                                                <td className="border border-gray-300 p-2 text-right">{tx.pu.toLocaleString()}</td>
                                                <td className="border border-gray-300 p-2 text-right">{tx.pt.toLocaleString()}</td>
                                                <td className="border border-gray-300 p-2 text-right font-bold text-red-600">{tx.debtAmount.toLocaleString()}</td>
                                                <td className="border border-gray-300 p-2">{tx.responsible?.name || "System"}</td>
                                                <td className="border border-gray-300 p-2"></td>
                                            </tr>
                                        ))}
                                        {clientFiche.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-gray-500">No unpaid transactions.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {clientFiche.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-gray-100 font-black">
                                                <td colSpan="4" className="border border-gray-300 p-2 text-right">TOTAL GLOBAL (TG):</td>
                                                <td className="border border-gray-300 p-2 text-right">{clientFiche.reduce((sum, tx) => sum + tx.pt, 0).toLocaleString()}</td>
                                                <td className="border border-gray-300 p-2 text-right text-red-600">{selectedClient.totalDebt.toLocaleString()}</td>
                                                <td colSpan="2" className="border border-gray-300 p-2"></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contract Prices Modal */}
            {showPriceModal && selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-charcoal-900 dark:text-white">Contract Prices</h2>
                                <p className="text-sm text-gray-500">Custom pricing for <span className="font-bold text-charcoal-800 dark:text-white">{selectedClient.name}</span></p>
                            </div>
                            <button onClick={() => setShowPriceModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"><FaTimes /></button>
                        </div>

                        {/* Add New Price Form */}
                        <form onSubmit={handleAddContractPrice} className="bg-gray-50 dark:bg-charcoal-700/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-charcoal-600 flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Product</label>
                                <select 
                                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 rounded-lg text-sm outline-none focus:border-terracotta-500"
                                    value={newPrice.productId}
                                    onChange={e => setNewPrice({ ...newPrice, productId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a product...</option>
                                    {allProducts
                                        .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                        .map(p => (
                                            <option key={p._id || p.id} value={p._id || p.id}>
                                                {p.name} (Normal: {p.price.toLocaleString()})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search/Filter Products</label>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                    <input 
                                        type="text"
                                        placeholder="Type to filter list..."
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 rounded-lg text-sm outline-none focus:border-terracotta-500"
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-32">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contract Price</label>
                                <input 
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 rounded-lg text-sm outline-none focus:border-terracotta-500"
                                    value={newPrice.price}
                                    onChange={e => setNewPrice({ ...newPrice, price: e.target.value })}
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={savingPrice}
                                className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <FaPlus /> {savingPrice ? '...' : 'Add'}
                            </button>
                        </form>

                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white dark:bg-charcoal-800 z-10 border-b-2 border-gray-100 dark:border-charcoal-700">
                                    <tr className="text-[10px] font-bold text-gray-400 uppercase">
                                        <th className="p-3">Product</th>
                                        <th className="p-3">Standard</th>
                                        <th className="p-3">Contract</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-charcoal-700">
                                    {contractPrices.map(cp => (
                                        <tr key={cp.id} className="text-sm">
                                            <td className="p-3 font-bold text-charcoal-800 dark:text-white">{cp.product?.name}</td>
                                            <td className="p-3 text-gray-500">{cp.product?.price?.toLocaleString()}</td>
                                            <td className="p-3 text-terracotta-500 font-black">{cp.price.toLocaleString()}</td>
                                            <td className="p-3 text-right">
                                                <button 
                                                    onClick={() => handleDeletePrice(cp.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {contractPrices.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400 italic">No special prices set for this client.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerAbonne;
