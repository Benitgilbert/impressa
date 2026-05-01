import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint, FaCheck, FaBox, FaUser, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import assetUrl from "../../utils/assetUrl";
import toast from "react-hot-toast";

const AdminOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch (err) {
                toast.error("Failed to load order details");
                navigate("/admin/orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            setOrder({ ...order, status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update order status");
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById("receipt-print-area");
        const windowUrl = "about:blank";
        const uniqueName = new Date().getTime();
        const windowFeatures = "left=500,top=500,width=400,height=400";
        const printWindow = window.open(windowUrl, uniqueName, windowFeatures);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        .receipt { width: 100%; max-width: 300px; margin: 0 auto; border: 1px solid #eee; padding: 10px; }
                        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
                        .total { border-top: 2px dashed #ccc; padding-top: 10px; margin-top: 10px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-gray-400 hover:text-terracotta-500 shadow-sm border border-cream-200 dark:border-charcoal-700 transition-all"
                            >
                                <FaArrowLeft />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-charcoal-900 dark:text-white">Order #{order.id.slice(-8).toUpperCase()}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-5 py-2.5 bg-charcoal-900 text-white rounded-xl font-bold hover:bg-charcoal-800 transition-all shadow-lg"
                            >
                                <FaPrint /> Print Receipt
                            </button>
                            <div className="relative">
                                <select
                                    disabled={updating}
                                    value={order.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className={`pl-4 pr-10 py-2.5 rounded-xl font-bold text-sm appearance-none cursor-pointer border-2 transition-all outline-none ${
                                        order.status === 'delivered' ? 'bg-green-50 border-green-200 text-green-600' :
                                        order.status === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                        order.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-600' :
                                        'bg-orange-50 border-orange-200 text-orange-600'
                                    }`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Order Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                                <div className="p-6 border-b border-cream-100 dark:border-charcoal-700 flex justify-between items-center">
                                    <h3 className="font-black text-charcoal-900 dark:text-white uppercase tracking-wider text-sm">Order Items</h3>
                                    <span className="text-xs font-bold text-gray-400">{order.items?.length || 0} Products</span>
                                </div>
                                <div className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="p-6 flex items-center gap-4 hover:bg-cream-50/50 dark:hover:bg-charcoal-700/30 transition-colors">
                                            <div className="w-16 h-16 rounded-xl bg-cream-100 dark:bg-charcoal-700 overflow-hidden flex-shrink-0">
                                                {item.product?.image ? (
                                                    <img src={assetUrl(item.product.image)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FaBox size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-charcoal-900 dark:text-white truncate">{item.product?.name || "Product Deleted"}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">Price: RWF {item.price?.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="font-black text-charcoal-900 dark:text-white">RWF {(item.price * item.quantity).toLocaleString()}</div>
                                                <div className="text-xs font-bold text-terracotta-500 mt-0.5">QTY: {item.quantity}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-cream-50/50 dark:bg-charcoal-900/30 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-bold text-charcoal-900 dark:text-white">RWF {order.totalAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="font-bold text-charcoal-900 dark:text-white">RWF 0</span>
                                    </div>
                                    <div className="pt-3 border-t border-cream-200 dark:border-charcoal-700 flex justify-between items-center">
                                        <span className="font-black text-charcoal-900 dark:text-white uppercase tracking-widest text-xs">Total Amount</span>
                                        <span className="text-2xl font-black text-terracotta-500">RWF {order.totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Customer & Shipping Info */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 p-6">
                                <h3 className="font-black text-charcoal-900 dark:text-white uppercase tracking-wider text-sm mb-6 pb-2 border-b border-cream-100 dark:border-charcoal-700">Customer Details</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-600 dark:text-white">
                                            <FaUser />
                                        </div>
                                        <div>
                                            <p className="font-bold text-charcoal-900 dark:text-white">{order.user?.name || "Guest Customer"}</p>
                                            <p className="text-xs text-gray-500">{order.user?.email || "No email provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-600 dark:text-white flex-shrink-0">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div>
                                            <p className="font-bold text-charcoal-900 dark:text-white text-sm">Shipping Address</p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {order.shippingAddress || "No shipping address provided"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cream-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-600 dark:text-white">
                                            <FaPhone />
                                        </div>
                                        <div>
                                            <p className="font-bold text-charcoal-900 dark:text-white text-sm">Phone Number</p>
                                            <p className="text-xs text-gray-500">{order.user?.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 p-6">
                                <h3 className="font-black text-charcoal-900 dark:text-white uppercase tracking-wider text-sm mb-6 pb-2 border-b border-cream-100 dark:border-charcoal-700">Payment Information</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Method</span>
                                        <span className="font-bold text-charcoal-800 dark:text-white text-sm">{order.paymentMethod || "COD"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hidden Print Area */}
                    <div className="hidden">
                        <div id="receipt-print-area">
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>ABELUS</h2>
                                <p style={{ fontSize: '10px', margin: '5px 0' }}>Official Receipt</p>
                                <p style={{ fontSize: '10px' }}>Order ID: #{order.id.slice(-8).toUpperCase()}</p>
                                <p style={{ fontSize: '10px' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                        <span>{item.quantity}x {item.product?.name}</span>
                                        <span>{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>TOTAL:</span>
                                <span>RWF {order.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminOrderDetails;
