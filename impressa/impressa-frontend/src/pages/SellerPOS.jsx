import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/axiosInstance";
import assetUrl from "../utils/assetUrl";
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaMoneyBillWave, FaMobileAlt, FaBoxOpen, FaStore, FaBarcode, FaTimes } from "react-icons/fa";
import Header from "../components/Header";
import Receipt from "../components/Receipt";
import SellerSidebar from "../components/SellerSidebar";

// Beep sound for successful scan
const playBeep = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
    } catch (e) {
        console.log('Audio not available');
    }
};

export default function SellerPOS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [seller, setSeller] = useState(null);

    // Barcode scanning
    const [scanBuffer, setScanBuffer] = useState("");
    const [lastKeyTime, setLastKeyTime] = useState(0);
    const searchInputRef = useRef(null);

    // Modals
    const [showMomoModal, setShowMomoModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [pendingOrder, setPendingOrder] = useState(null);
    const [showCashConfirm, setShowCashConfirm] = useState(false);
    const [cashReceived, setCashReceived] = useState("");

    // Receipt
    const [showReceipt, setShowReceipt] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [scanError, setScanError] = useState("");

    const addToCart = useCallback((product, isVariation = false) => {
        if (product.stock <= 0) return;
        setCart(prevCart => {
            // Unique ID for cart item: ProductID + (VariationID or "")
            const uniqueId = isVariation ? `${product._id}-${product.variationId}` : product._id;

            const existing = prevCart.find((item) => (item.uniqueId || item._id) === uniqueId);

            if (existing) {
                if (existing.quantity >= product.stock) return prevCart;
                return prevCart.map((item) =>
                    (item.uniqueId || item._id) === uniqueId ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1, uniqueId, variationId: product.variationId }];
            }
        });
    }, []);

    const handleBarcodeScan = useCallback(async (barcode) => {
        setScanError("");

        // First check if product is in local list
        const localProduct = products.find(
            p => p.barcode?.toUpperCase() === barcode.toUpperCase() ||
                p.sku?.toUpperCase() === barcode.toUpperCase()
        );

        if (localProduct) {
            playBeep();
            addToCart(localProduct);
            return;
        }

        // Fallback to API lookup
        try {
            const res = await api.get(`/orders/pos/lookup?barcode=${barcode}`);
            if (res.data.success && res.data.product) {
                playBeep();
                addToCart(res.data.product);
            }
        } catch (err) {
            setScanError(`Product not found: ${barcode}`);
            setTimeout(() => setScanError(""), 3000);
        }
    }, [products, addToCart]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/orders/seller/pos-products");
            if (res.data.success) {
                setProducts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSellerInfo = useCallback(async () => {
        try {
            const res = await api.get("/auth/me");
            setSeller(res.data);
        } catch (err) {
            console.error("Failed to fetch seller info");
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchSellerInfo();
    }, [fetchProducts, fetchSellerInfo]);

    // Barcode scanner detection - rapid keypresses
    useEffect(() => {
        const handleKeyDown = (e) => {
            const now = Date.now();

            // If Enter is pressed, check if we have a barcode
            if (e.key === 'Enter' && scanBuffer.length >= 4) {
                e.preventDefault();
                handleBarcodeScan(scanBuffer);
                setScanBuffer("");
                return;
            }

            // If keystroke is fast (< 50ms) and alphanumeric, it's likely a scanner
            if (now - lastKeyTime < 50) {
                if (/^[a-zA-Z0-9-]$/.test(e.key)) {
                    setScanBuffer(prev => prev + e.key);
                }
            } else {
                // Too slow, reset buffer
                setScanBuffer(e.key);
            }

            setLastKeyTime(now);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scanBuffer, lastKeyTime, handleBarcodeScan]);



    // Manual barcode entry via search
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.length >= 4) {
            handleBarcodeScan(searchTerm);
            setSearchTerm("");
        }
    };





    // Variation Selection
    const [selectedProductForVariation, setSelectedProductForVariation] = useState(null);

    const handleProductClick = (product) => {
        if (product.type === 'variable' && product.variations && product.variations.length > 0) {
            setSelectedProductForVariation(product);
        } else {
            addToCart(product);
        }
    };

    const addVariationToCart = (variation) => {
        if (variation.stock <= 0) return;

        // Flatten attributes map/object to string for display
        let attrString = "";
        if (variation.attributes) {
            const attrs = typeof variation.attributes === 'object' ? Object.values(variation.attributes) : [];
            attrString = attrs.join(" / ");
        }

        const productToAdd = {
            ...selectedProductForVariation,
            _id: selectedProductForVariation._id, // Keep parent ID for later reference if needed, or use a composite
            variationId: variation.sku, // Crucial for backend
            name: `${selectedProductForVariation.name} - ${attrString}`,
            price: variation.price,
            stock: variation.stock,
            image: variation.image || selectedProductForVariation.image
        };

        addToCart(productToAdd, true); // Pass true to indicate it's a variation item
        setSelectedProductForVariation(null);
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const removeFromCart = (uniqueId) => {
        setCart(cart.filter((item) => (item.uniqueId || item._id) !== uniqueId));
    };

    const updateQuantity = (uniqueId, delta) => {
        setCart(
            cart.map((item) => {
                if ((item.uniqueId || item._id) === uniqueId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    if (newQty > (item.stock || 0)) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    // Cash payment - show confirmation modal first
    const initiateCashPayment = () => {
        setCashReceived(calculateTotal().toString());
        setShowCashConfirm(true);
    };

    const confirmCashPayment = () => {
        setShowCashConfirm(false);
        handleCheckout("cash", null, parseFloat(cashReceived));
    };

    const initiateMomoPayment = () => {
        setShowMomoModal(true);
    };

    const confirmMomoPayment = async () => {
        if (!phoneNumber) return alert("Please enter a phone number");
        setShowMomoModal(false);
        handleCheckout("mtn_momo", phoneNumber);
    };

    const handleCheckout = async (method, phone = null, receivedAmount = null) => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const res = await api.post("/orders/seller/pos", {
                items: cart.map((item) => ({
                    product: item._id,
                    quantity: item.quantity,
                    variationId: item.variationId // Pass variationId
                })),
                paymentMethod: method,
                phone: phone
            });

            if (method === "mtn_momo" && res.data.status === "pending") {
                setPendingOrder(res.data._id);
                return;
            }

            // Payment confirmed - show receipt
            const order = {
                ...res.data,
                cashReceived: receivedAmount,
                cashierName: seller?.name,
                items: cart.map(item => ({
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            setCompletedOrder(order);
            setShowReceipt(true);
            setCart([]);
            fetchProducts(); // Refresh stock
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process sale");
        } finally {
            if (method !== "mtn_momo") setProcessing(false);
        }
    };

    // MoMo polling
    useEffect(() => {
        let interval;
        if (pendingOrder) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/payments/status/${pendingOrder}`);
                    if (res.data.status === "completed" || res.data.status === "delivered") {
                        clearInterval(interval);
                        setPendingOrder(null);
                        setProcessing(false);

                        // Show receipt
                        setCompletedOrder({
                            ...res.data,
                            cashierName: seller?.name,
                            items: cart.map(item => ({
                                productName: item.name,
                                quantity: item.quantity,
                                price: item.price
                            }))
                        });
                        setShowReceipt(true);
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
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [pendingOrder, cart, seller, fetchProducts]);

    const handleReceiptClose = () => {
        setShowReceipt(false);
        setCompletedOrder(null);
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || p.categories?.some(c => c.name === selectedCategory))
    );

    const categories = ["All", ...new Set(products.flatMap(p => p.categories?.map(c => c.name) || []))];
    const changeAmount = parseFloat(cashReceived || 0) - calculateTotal();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            <SellerSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Header />
                <main className="flex-1 p-4 md:p-6 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 relative">

                    {/* Variation Selection Modal */}
                    {selectedProductForVariation && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                        Select Option
                                    </h3>
                                    <button onClick={() => setSelectedProductForVariation(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <FaTimes size={24} />
                                    </button>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Choose a variation for <span className="font-bold text-gray-900 dark:text-white">{selectedProductForVariation.name}</span>
                                </p>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {selectedProductForVariation.variations.map((v, idx) => {
                                        // Handle attribute display
                                        let attrDisplay = "";
                                        if (v.attributes && typeof v.attributes === 'object') {
                                            attrDisplay = Object.values(v.attributes).join(" / ");
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => addVariationToCart(v)}
                                                className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all ${v.stock > 0
                                                    ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                                    : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white">{attrDisplay || `Option ${idx + 1}`}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {v.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">RWF {v.price.toLocaleString()}</p>
                                                    <p className={`text-xs font-bold ${v.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {v.stock > 0 ? `${v.stock} in stock` : 'Out of Stock'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scan Error Toast */}
                    {scanError && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce flex items-center gap-2">
                            <FaTimes /> {scanError}
                        </div>
                    )}

                    {/* Receipt & Cash Modals (Same as before) ... */}
                    {showReceipt && completedOrder && (
                        <Receipt
                            order={completedOrder}
                            seller={seller}
                            onClose={handleReceiptClose}
                        />
                    )}

                    {showCashConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                    <FaMoneyBillWave className="text-green-600" /> Cash Payment
                                </h3>

                                <div className="text-center mb-6">
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                                    <p className="text-4xl font-extrabold text-gray-900 dark:text-white">RWF {calculateTotal().toLocaleString()}</p>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cash Received:</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">RWF</div>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            autoFocus
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-lg dark:text-white"
                                        />
                                    </div>
                                </div>

                                {changeAmount > 0 && (
                                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-100 dark:border-green-800 mb-6 text-center">
                                        <p className="text-sm text-green-700 dark:text-green-400">Change to Return</p>
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">RWF {changeAmount.toLocaleString()}</p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                                        onClick={() => setShowCashConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={confirmCashPayment}
                                        disabled={parseFloat(cashReceived) < calculateTotal()}
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showMomoModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                    <FaMobileAlt className="text-yellow-500" /> MoMo Payment
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Enter customer's phone number to trigger payment request.</p>

                                <input
                                    type="text"
                                    placeholder="078..."
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    autoFocus
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 dark:text-white mb-6 text-lg"
                                />

                                <div className="flex gap-4">
                                    <button className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors" onClick={() => setShowMomoModal(false)}>Cancel</button>
                                    <button className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all" onClick={confirmMomoPayment}>Request Pay</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingOrder && (
                        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <h2 className="text-3xl font-bold mb-2">Waiting for Confirmation...</h2>
                            <p className="text-gray-300 animate-pulse">Ask customer to approve payment on their phone</p>
                        </div>
                    )}

                    <div className="md:col-span-8 flex flex-col min-w-0 h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaStore className="text-indigo-600" /> {seller?.storeName || 'My Store'} POS
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <FaBarcode /> Scan barcode or select products
                                </p>
                            </div>

                            <div className="relative w-full sm:w-96">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Scan barcode or search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-gray-800/50">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin dark:scrollbar-thumb-gray-600">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                    Loading products...
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                    <FaBoxOpen size={48} className="mb-4 opacity-50" />
                                    <p>No products found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            onClick={() => handleProductClick(product)} // Updated handler
                                            className={`group bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative ${product.stock <= 0 && product.type !== 'variable' ? 'opacity-60 pointer-events-none grayscale' : ''
                                                }`}
                                        >
                                            <div className="aspect-square bg-gray-100 dark:bg-gray-600 relative overflow-hidden">
                                                {product.image ? (
                                                    <img
                                                        src={assetUrl(product.image)}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                                                        <FaBoxOpen size={32} />
                                                    </div>
                                                )}
                                                {product.stock <= 0 && product.type !== 'variable' && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm transform -rotate-12">OUT OF STOCK</span>
                                                    </div>
                                                )}
                                                {product.type === 'variable' && (
                                                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                                        OPTIONS
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate mb-1" title={product.name}>{product.name}</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">RWF {product.price.toLocaleString()}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                                                        {product.type === 'variable' ? 'Var' : `${product.stock} left`}
                                                    </span>
                                                </div>
                                                {product.barcode && (
                                                    <p className="text-[10px] text-gray-400 mt-1 font-mono truncate">{product.barcode}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FaShoppingCart className="text-indigo-600" /> Current Sale
                            </h2>
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">
                                {cart.length} items
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin dark:scrollbar-thumb-gray-600">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl m-2">
                                    <FaShoppingCart size={32} className="mb-3 opacity-30" />
                                    <p className="text-sm">Cart is empty</p>
                                    <p className="text-xs mt-1">Scan or click products to add</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.uniqueId || item._id} className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 shadow-sm flex justify-between items-center group">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <h5 className="font-bold text-gray-800 dark:text-white text-sm truncate">{item.name}</h5>
                                            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                                                RWF {item.price.toLocaleString()} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <button
                                                onClick={() => updateQuantity(item.uniqueId || item._id, -1)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <FaMinus size={10} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.uniqueId || item._id, 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.uniqueId || item._id)}
                                            className="ml-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-5 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
                                    <span>Subtotal</span>
                                    <span>RWF {calculateTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-900 dark:text-white text-xl font-bold pt-2 border-t border-dashed border-gray-200 dark:border-gray-600">
                                    <span>Total</span>
                                    <span>RWF {calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={initiateCashPayment}
                                    disabled={processing || cart.length === 0}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <FaMoneyBillWave /> Cash
                                </button>
                                <button
                                    onClick={initiateMomoPayment}
                                    disabled={processing || cart.length === 0}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <FaMobileAlt /> MoMo
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
