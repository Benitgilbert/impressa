import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { FaArrowLeft, FaBox, FaMapMarkerAlt, FaUser, FaCreditCard } from "react-icons/fa";

const SellerOrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        // Removed window.confirm to fix popup issue
        // if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;

        setUpdating(true);
        try {
            const { data } = await api.put(`/orders/${id}/status`, { status: newStatus });
            setOrder(data);
            alert(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        setAddingNote(true);
        try {
            const { data } = await api.post(`/orders/${id}/notes`, {
                text: noteText,
                isCustomerVisible: true // Sellers usually add customer-facing updates
            });
            setOrder(data);
            setNoteText("");
            alert("Update added successfully");
        } catch (error) {
            console.error("Failed to add note:", error);
            alert("Failed to add note");
        } finally {
            setAddingNote(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <SellerSidebar />
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </div>
    );

    if (!order) return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <SellerSidebar />
            <div className="flex-1 flex flex-col items-center justify-center text-red-500">
                Order not found
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <Link to="/seller/orders" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
                <FaArrowLeft className="mr-2" /> Back to Orders
            </Link>

            {/* Order Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order #{order.publicId}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.orderType === 'pos' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}>
                            {order.orderType === 'pos' ? 'POS' : 'Online'}
                        </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                    <select
                        className={`p-2 rounded-lg border font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:bg-gray-700 ${order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 dark:text-red-400' :
                            order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200 dark:text-green-400' :
                                'bg-white text-gray-700 border-gray-300 dark:text-gray-200'
                            }`}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={updating}
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <FaBox className="text-indigo-500" /> My Products In This Order
                        </h2>
                        <div className="divide-y dark:divide-gray-700">
                            {order.items?.map((item, index) => (
                                <div key={index} className="py-4 flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {item.product?.image ? (
                                            <img src={item.product.image} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <FaBox className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{item.productName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity} × {item.price.toLocaleString()} Rwf</p>
                                        {item.customizations?.customText && (
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 italic">Note: "{item.customizations.customText}"</p>
                                        )}
                                    </div>
                                    <div className="font-bold text-gray-900 dark:text-white text-right">
                                        {(item.price * item.quantity).toLocaleString()} Rwf
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t dark:border-gray-700 mt-6 pt-6 space-y-3">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span className="font-medium">{(order.subtotal || 0).toLocaleString()} Rwf</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Delivery</span>
                                <span className="font-medium">{(order.shippingCost || 0).toLocaleString()} Rwf</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t dark:border-gray-700">
                                <span>Total (Grand Total)</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{(order.grandTotal || 0).toLocaleString()} Rwf</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Delivery Updates & Notes</h2>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {order.notes?.length > 0 ? (
                                order.notes.slice().reverse().map((note, index) => (
                                    <div key={index} className={`p-4 rounded-xl text-sm transition-all ${note.isCustomerVisible
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600'
                                        }`}>
                                        <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">{note.text}</p>
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-medium">{note.authorName || "Seller"}</span>
                                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-8 text-gray-500 dark:text-gray-400 italic">No updates posted yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleAddNote} className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                            <textarea
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all dark:text-white"
                                rows="3"
                                placeholder="Update customer on delivery progress..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                required
                            ></textarea>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={addingNote}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                >
                                    {addingNote ? "Posting..." : "Post Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaUser className="text-indigo-500" /> Customer Info
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">Name</p>
                                <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                                    {order.customer?.name || order.guestInfo?.name || "Guest"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">Email</p>
                                <p className="text-gray-700 dark:text-gray-300 mt-0.5 break-all">
                                    {order.customer?.email || order.guestInfo?.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">Phone</p>
                                <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                                    {order.guestInfo?.phone || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-indigo-500" /> Delivery Address
                        </h2>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="font-medium">{order.shippingAddress?.address}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            <p>{order.shippingAddress?.country} {order.shippingAddress?.zip}</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaCreditCard className="text-indigo-500" /> Payment Info
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Method:</span>
                                <span className="font-bold capitalize dark:text-white">{order.paymentMethod?.replace("_", " ")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.paymentStatus === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerOrderDetails;
