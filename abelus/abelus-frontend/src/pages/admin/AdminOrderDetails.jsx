import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { FaArrowLeft, FaBox, FaMapMarkerAlt, FaUser, FaCreditCard } from "react-icons/fa";

const AdminOrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedItems, setEditedItems] = useState([]);
    const [noteText, setNoteText] = useState("");
    const [isCustomerNote, setIsCustomerNote] = useState(false);
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        if (order) {
            setEditedItems(order.items.map(item => ({
                ...item,
                product: item.product?._id || item.product, // Ensure ID is kept
                productName: item.productName || item.product?.name,
                price: item.price,
                quantity: item.quantity
            })));
        }
    }, [order]);

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
        if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;

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

    const handleSaveItems = async () => {
        if (!window.confirm("Save changes to order items? Totals will be recalculated.")) return;
        setUpdating(true);
        try {
            const { data } = await api.put(`/orders/${id}/items`, { items: editedItems });
            setOrder(data);
            setIsEditing(false);
            alert("Order items updated successfully");
        } catch (error) {
            console.error("Failed to update items:", error);
            alert("Failed to update items: " + (error.response?.data?.message || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const updateItemQuantity = (index, newQty) => {
        const updated = [...editedItems];
        updated[index].quantity = parseInt(newQty) || 0;
        setEditedItems(updated);
    };

    const removeItem = (index) => {
        if (!window.confirm("Remove this item?")) return;
        const updated = [...editedItems];
        updated.splice(index, 1);
        setEditedItems(updated);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        setAddingNote(true);
        try {
            const { data } = await api.post(`/orders/${id}/notes`, {
                text: noteText,
                isCustomerVisible: isCustomerNote
            });
            setOrder(data);
            setNoteText("");
            setIsCustomerNote(false);
            alert("Note added successfully");
        } catch (error) {
            console.error("Failed to add note:", error);
            alert("Failed to add note");
        } finally {
            setAddingNote(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <Link to="/admin/orders" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <FaArrowLeft className="mr-2" /> Back to Orders
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-gray-900">Order #{order.publicId}</h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                order.orderType === 'pos' 
                                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {order.orderType === 'pos' ? 'POS' : 'Online'}
                            </span>
                        </div>
                        <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <select
                            className={`p-2 rounded-lg border font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-white text-gray-700 border-gray-300'
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
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Items */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><FaBox className="text-blue-500" /> Order Items</span>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Edit Items
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-sm text-gray-600 hover:text-gray-800 font-medium px-3 py-1 border rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveItems}
                                            disabled={updating}
                                            className="text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium px-3 py-1 rounded"
                                        >
                                            {updating ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                )}
                            </h2>
                            <div className="divide-y">
                                {(isEditing ? editedItems : order.items)?.map((item, index) => (
                                    <div key={index} className="py-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {/* Placeholder for image if available */}
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.productName}</h3>
                                            {!isEditing ? (
                                                <p className="text-sm text-gray-500">Qty: {item.quantity} × {item.price.toLocaleString()} Rwf</p>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <label className="text-xs text-gray-600">Qty:</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                                                        className="w-16 p-1 border rounded text-sm"
                                                    />
                                                    <span className="text-sm text-gray-500">× {item.price.toLocaleString()} Rwf</span>
                                                </div>
                                            )}
                                            {item.customizations?.customText && (
                                                <p className="text-xs text-gray-500 mt-1">Custom Text: "{item.customizations.customText}"</p>
                                            )}
                                        </div>
                                        <div className="font-medium text-gray-900 text-right">
                                            <div>{(item.price * item.quantity).toLocaleString()} Rwf</div>
                                            {isEditing && (
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{order.totals.subtotal.toLocaleString()} Rwf</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>{order.totals.shipping.toLocaleString()} Rwf</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>{order.totals.tax.toLocaleString()} Rwf</span>
                                </div>
                                {order.totals.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{order.totals.discount.toLocaleString()} Rwf</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                                    <span>Total</span>
                                    <span>{order.totals.grandTotal.toLocaleString()} Rwf</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline / History (Placeholder) */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">Order History</h2>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-2 bg-gray-200 rounded-full relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                                    </div>
                                    <div className="pb-4">
                                        <p className="font-medium text-gray-900">Order Placed</p>
                                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                {/* More history items could be added here if backend supported it */}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">

                        {/* Customer */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FaUser className="text-gray-400" /> Customer
                            </h2>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-gray-900">
                                    {order.customer?.name || order.guestInfo?.name || "Guest"}
                                </p>
                                <p className="text-gray-500">
                                    {order.customer?.email || order.guestInfo?.email}
                                </p>
                                <p className="text-gray-500">
                                    {order.guestInfo?.phone || "No phone provided"}
                                </p>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-gray-400" /> Shipping Address
                            </h2>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                <p>{order.shippingAddress?.country} {order.shippingAddress?.zip}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FaCreditCard className="text-gray-400" /> Payment
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Method:</span>
                                    <span className="font-medium capitalize">{order.payment?.method?.replace("_", " ")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.payment?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.payment?.status}
                                    </span>
                                </div>
                                {order.payment?.transactionId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Trans ID:</span>
                                        <span className="font-mono text-xs">{order.payment.transactionId}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4">Order Notes</h2>

                            {/* Notes List */}
                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                                {order.notes?.length > 0 ? (
                                    order.notes.slice().reverse().map((note, index) => (
                                        <div key={index} className={`p-3 rounded-lg text-sm ${note.isCustomerVisible ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50 border border-gray-100'}`}>
                                            <p className="text-gray-800 mb-1">{note.text}</p>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{note.authorName || "System"}</span>
                                                <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                            {note.isCustomerVisible && (
                                                <span className="text-xs text-yellow-600 font-medium mt-1 block">Customer Note</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">No notes yet.</p>
                                )}
                            </div>

                            {/* Add Note Form */}
                            <form onSubmit={handleAddNote} className="space-y-3">
                                <textarea
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows="3"
                                    placeholder="Add a note..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    required
                                ></textarea>
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isCustomerNote}
                                            onChange={(e) => setIsCustomerNote(e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        Customer Note
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={addingNote}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {addingNote ? "Adding..." : "Add Note"}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetails;
