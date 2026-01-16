import { useState, useEffect, useCallback } from "react";
import axios from "../../utils/axiosInstance";
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaMoneyBillWave, FaMobileAlt, FaBoxOpen, FaSpinner } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [showMomoModal, setShowMomoModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [pendingOrder, setPendingOrder] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch only Impressa's own products (admin-owned)
            const res = await axios.get("/orders/admin/pos-products");
            if (res.data.success) {
                setProducts(res.data.data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("Failed to fetch products");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Polling for Payment Status
    useEffect(() => {
        let interval;
        if (pendingOrder) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`/payments/status/${pendingOrder}`);
                    if (res.data.status === "completed" || res.data.status === "delivered") {
                        clearInterval(interval);
                        setPendingOrder(null);
                        setProcessing(false);
                        setShowMomoModal(false);

                        // Success Feedback
                        showSuccessNotification("Payment Confirmed! Sale Completed! 🎉");

                        setCart([]);
                        fetchProducts();
                    } else if (res.data.status === "failed") {
                        clearInterval(interval);
                        setPendingOrder(null);
                        setProcessing(false);
                        alert("Payment Failed. Please try again.");
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(interval);
    }, [pendingOrder, fetchProducts]);

    const showSuccessNotification = (message) => {
        const successMsg = document.createElement("div");
        successMsg.className = "fixed top-4 right-4 bg-sage-500 text-white px-6 py-3 rounded-xl shadow-lg z-[60] animate-bounce font-bold";
        successMsg.innerText = message;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    };



    const addToCart = (product) => {
        if (product.stock <= 0) return;
        const existing = cart.find((item) => item._id === product._id);
        if (existing) {
            if (existing.quantity >= product.stock) return;
            setCart(
                cart.map((item) =>
                    item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item._id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(
            cart.map((item) => {
                if (item._id === productId) {
                    const product = products.find(p => p._id === productId);
                    const newQty = Math.max(1, item.quantity + delta);
                    if (newQty > product.stock) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const initiateMomoPayment = () => {
        setShowMomoModal(true);
    };

    const confirmMomoPayment = async () => {
        if (!phoneNumber) return alert("Please enter a phone number");
        setShowMomoModal(false);
        handleCheckout("mtn_momo", phoneNumber);
    };

    const handleCheckout = async (method, phone = null) => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const res = await axios.post("/orders/pos", {
                items: cart.map((item) => ({
                    product: item._id,
                    quantity: item.quantity,
                })),
                paymentMethod: method,
                phone: phone
            });

            if (method === "mtn_momo" && res.data.status === "pending") {
                setPendingOrder(res.data._id);
                return;
            }

            // Cash Success Feedback
            showSuccessNotification("Sale Completed Successfully! 🎉");

            setCart([]);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process sale");
        } finally {
            if (method !== "mtn_momo") setProcessing(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || p.categories?.some(c => c.name === selectedCategory))
    );

    const categories = ["All", ...new Set(products.flatMap(p => p.categories?.map(c => c.name) || []))];

    return (
        <div className="flex h-screen bg-cream-50 dark:bg-charcoal-900 overflow-hidden font-sans">
            {/* MoMo Modal */}
            {showMomoModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
                        <h3 className="flex items-center gap-3 mb-4 font-bold text-xl text-charcoal-900 dark:text-white">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <FaMobileAlt className="text-yellow-600" />
                            </div>
                            MoMo Payment
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Enter the customer's phone number to initiate payment request.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="078..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-charcoal-900 dark:text-white transition-all font-mono"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowMomoModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmMomoPayment}
                                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    Request Pay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Polling Overlay */}
            {pendingOrder && (
                <div className="fixed inset-0 z-[80] bg-charcoal-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 border-4 border-charcoal-700 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
                        <FaMobileAlt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3">Confirming Payment...</h2>
                    <p className="text-gray-400 text-lg max-w-md text-center">Please ask the customer to approve the transaction on their mobile phone.</p>
                </div>
            )}

            {/* Fixed Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
                <Topbar />

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Product Grid */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header Bar */}
                        <div className="px-6 py-4 bg-white dark:bg-charcoal-800 border-b border-cream-200 dark:border-charcoal-700 flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shadow-sm">
                            <div className="relative w-full sm:w-72 md:w-96">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent focus:bg-white dark:focus:bg-charcoal-600 focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 rounded-xl outline-none text-charcoal-800 dark:text-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedCategory("All")}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === "All"
                                            ? "bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20"
                                            : "bg-white dark:bg-charcoal-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-charcoal-600 border border-gray-200 dark:border-charcoal-600"
                                            }`}
                                    >
                                        All Items
                                    </button>
                                    {categories.filter(c => c !== "All").map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                                                ? "bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20"
                                                : "bg-white dark:bg-charcoal-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-charcoal-600 border border-gray-200 dark:border-charcoal-600"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-cream-50 dark:bg-charcoal-900">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <FaSpinner className="animate-spin text-4xl text-terracotta-500 mb-4" />
                                    <p className="font-medium">Loading catalog...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            onClick={() => addToCart(product)}
                                            className={`group bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-cream-100 dark:border-charcoal-700 overflow-hidden flex flex-col ${product.stock <= 0 ? 'opacity-60 pointer-events-none grayscale' : ''}`}
                                        >
                                            <div className="aspect-square relative overflow-hidden bg-cream-100 dark:bg-charcoal-900">
                                                {product.image ? (
                                                    <img
                                                        src={`${process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${product.image}`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                                                        <FaBoxOpen className="text-4xl mb-2 opacity-50" />
                                                        <span className="text-xs font-medium">No Image</span>
                                                    </div>
                                                )}
                                                {product.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">Out of Stock</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-white/90 dark:bg-charcoal-800/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-charcoal-600">
                                                    Stock: {product.stock}
                                                </div>
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="font-bold text-charcoal-800 dark:text-white text-sm mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                                                <div className="mt-auto flex items-end justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Price</span>
                                                        <span className="text-lg font-black text-terracotta-500">
                                                            <span className="text-xs align-top opacity-70">RWF</span> {product.price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <button className="w-8 h-8 rounded-full bg-cream-100 dark:bg-charcoal-700 text-terracotta-500 flex items-center justify-center hover:bg-terracotta-500 hover:text-white transition-colors">
                                                        <FaPlus className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Cart Sidebar */}
                    <div className="w-96 bg-white dark:bg-charcoal-800 border-l border-cream-200 dark:border-charcoal-700 shadow-2xl z-20 flex flex-col">
                        <div className="p-6 border-b border-cream-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="flex items-center gap-2.5 font-black text-xl text-charcoal-900 dark:text-white">
                                    <FaShoppingCart className="text-terracotta-500" />
                                    Current Sale
                                </h2>
                                <span className="px-2.5 py-1 bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400 text-xs font-bold rounded-full">
                                    {cart.length} Items
                                </span>
                            </div>
                            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Order #{Math.floor(Math.random() * 10000)}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-charcoal-900/50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-charcoal-700 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
                                        <FaShoppingCart className="text-4xl" />
                                    </div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Your cart is empty</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Select products from the grid to start a new sale.</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item._id} className="bg-white dark:bg-charcoal-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-charcoal-700 flex flex-col gap-3 group hover:border-terracotta-200 dark:hover:border-terracotta-900 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-sm text-charcoal-800 dark:text-white line-clamp-1">{item.name}</h4>
                                                <div className="text-xs text-gray-500 mt-0.5 font-mono">
                                                    RWF {item.price.toLocaleString()} x {item.quantity}
                                                </div>
                                            </div>
                                            <div className="font-bold text-terracotta-600 dark:text-terracotta-400 text-sm">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-charcoal-700/50">
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-charcoal-700 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item._id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-charcoal-600 text-gray-600 dark:text-gray-300 shadow-sm hover:text-terracotta-500 transition-colors"
                                                >
                                                    <FaMinus size={8} />
                                                </button>
                                                <span className="w-6 text-center font-bold text-sm text-charcoal-800 dark:text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-charcoal-600 text-gray-600 dark:text-gray-300 shadow-sm hover:text-terracotta-500 transition-colors"
                                                >
                                                    <FaPlus size={8} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer / Checkout */}
                        <div className="p-6 bg-white dark:bg-charcoal-800 border-t border-cream-200 dark:border-charcoal-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono">RWF {calculateTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>Tax (0%)</span>
                                    <span className="font-mono">RWF 0</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-charcoal-900 dark:text-white pt-4 border-t border-dashed border-gray-200 dark:border-charcoal-600">
                                    <span>Total</span>
                                    <span className="text-terracotta-500">RWF {calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleCheckout("cash")}
                                    disabled={processing || cart.length === 0}
                                    className="flex flex-col items-center justify-center py-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <FaMoneyBillWave className="text-2xl mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-wider">Cash Pay</span>
                                </button>
                                <button
                                    onClick={initiateMomoPayment}
                                    disabled={processing || cart.length === 0}
                                    className="flex flex-col items-center justify-center py-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:border-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <FaMobileAlt className="text-2xl mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-wider">MoMo Pay</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
