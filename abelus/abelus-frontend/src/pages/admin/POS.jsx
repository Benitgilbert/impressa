import React, { useState, useEffect } from "react";
import { FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaMoneyBillWave, FaTabletAlt, FaCheckCircle, FaBox } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import assetUrl from "../../utils/assetUrl";
import toast from "react-hot-toast";

const POS = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [cart, setCart] = useState([]);
    const [subtotal, setSubtotal] = useState(0);

    const categories = ["All", "Clothing", "Electronics", "Home", "Beauty", "Books"];

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setSubtotal(total);
    }, [cart]);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/products");
            setProducts(data.data || data.products || data);
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        if (product.stock <= 0) {
            toast.error("Out of stock");
            return;
        }
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            await api.post("/orders/pos", {
                items: cart,
                total: subtotal,
                paymentMethod: "Cash"
            });
            toast.success("Transaction completed!");
            clearCart();
            fetchProducts(); // Refresh stock
        } catch (error) {
            toast.error("Checkout failed");
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto h-[calc(100vh-2rem)] overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        {/* Product Selection Area */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                            {/* POS Header */}
                            <div className="p-4 border-b border-cream-100 dark:border-charcoal-700 flex flex-col sm:flex-row gap-4 items-center justify-between bg-cream-50/50 dark:bg-charcoal-900/50">
                                <div className="relative w-full sm:w-64">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Scan barcode or search..."
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-sm outline-none focus:border-terracotta-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                selectedCategory === cat 
                                                ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/20' 
                                                : 'bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-400 border border-cream-200 dark:border-charcoal-600'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredProducts.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`group text-left bg-cream-50 dark:bg-charcoal-900/50 rounded-xl p-3 border border-transparent hover:border-terracotta-500 hover:bg-white dark:hover:bg-charcoal-700 transition-all active:scale-95 relative overflow-hidden ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                            >
                                                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white dark:bg-charcoal-800">
                                                    {product.image ? (
                                                        <img src={assetUrl(product.image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <FaBox size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-charcoal-900 dark:text-white text-sm line-clamp-1">{product.name}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-terracotta-500 font-black text-xs">RWF {product.price.toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Stock: {product.stock}</span>
                                                </div>
                                                {cart.find(item => item.id === product.id) && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-terracotta-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                                                        {cart.find(item => item.id === product.id).quantity}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart Area */}
                        <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                            <div className="p-4 border-b border-cream-100 dark:border-charcoal-700 bg-charcoal-900 text-white flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <FaShoppingCart /> Current Order
                                </h3>
                                <button onClick={clearCart} className="text-[10px] font-bold uppercase tracking-tighter hover:text-terracotta-400 transition-colors">Clear All</button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                        <FaShoppingCart size={40} className="mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 bg-cream-50 dark:bg-charcoal-900/30 p-2 rounded-xl group">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                                <img src={assetUrl(item.image)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-xs text-charcoal-900 dark:text-white truncate">{item.name}</h5>
                                                <p className="text-[10px] text-terracotta-500 font-black">RWF {item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white dark:bg-charcoal-700 rounded-lg p-1 border border-cream-100 dark:border-charcoal-600">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-terracotta-500 transition-colors"><FaMinus size={10} /></button>
                                                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-terracotta-500 transition-colors"><FaPlus size={10} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Summary & Checkout */}
                            <div className="p-4 bg-cream-50 dark:bg-charcoal-900/50 border-t border-cream-100 dark:border-charcoal-700 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-bold text-charcoal-900 dark:text-white">RWF {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Tax (0%)</span>
                                        <span className="font-bold text-charcoal-900 dark:text-white">RWF 0</span>
                                    </div>
                                    <div className="pt-2 border-t border-cream-200 dark:border-charcoal-700 flex justify-between items-center">
                                        <span className="font-black text-charcoal-900 dark:text-white uppercase tracking-widest text-[10px]">Total Payable</span>
                                        <span className="text-2xl font-black text-terracotta-500">RWF {subtotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex flex-col items-center justify-center p-3 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl hover:border-terracotta-500 transition-all">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Cash</span>
                                        <FaMoneyBillWave className="text-sage-500" />
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-3 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-xl hover:border-terracotta-500 transition-all">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile Money</span>
                                        <FaTabletAlt className="text-blue-500" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full py-4 bg-terracotta-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-terracotta-600 transition-all shadow-xl shadow-terracotta-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    <FaCheckCircle /> Process Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default POS;
