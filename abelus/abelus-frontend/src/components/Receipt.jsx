import { useRef } from 'react';

export default function Receipt({ order, seller, onClose, onPrint }) {
    const receiptRef = useRef(null);

    const handlePrint = () => {
        const printContent = receiptRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=300,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm;
                        margin: 0 auto;
                        padding: 10px;
                    }
                    .receipt-header { text-align: center; margin-bottom: 10px; }
                    .store-name { font-size: 16px; font-weight: bold; }
                    .store-info { font-size: 10px; color: #666; }
                    .divider { border-top: 1px dashed #333; margin: 8px 0; }
                    .receipt-meta { font-size: 10px; }
                    .items-table { width: 100%; }
                    .items-table td { padding: 2px 0; }
                    .item-name { max-width: 150px; }
                    .item-qty { text-align: center; width: 30px; }
                    .item-price { text-align: right; }
                    .totals { margin-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; }
                    .grand-total { font-size: 14px; font-weight: bold; }
                    .payment-info { margin-top: 10px; font-size: 10px; }
                    .thank-you { text-align: center; margin-top: 15px; font-style: italic; }
                    @media print {
                        body { width: 80mm; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        if (onPrint) onPrint();
    };

    const formatDate = (date) => {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return new Date().toLocaleString('en-RW');
            return d.toLocaleString('en-RW', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return new Date().toLocaleString('en-RW');
        }
    };

    const subtotal = order.subtotal || order.totals?.subtotal || 0;
    const grandTotal = order.grandTotal || order.totals?.grandTotal || 0;
    const tax = order.tax || order.totals?.tax || 0;
    const paymentMethod = order.paymentMethod || order.payment?.method || 'CASH';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
                <div className="p-6 overflow-y-auto" ref={receiptRef}>
                    {/* Header */}
                    <div className="text-center mb-4">
                        <div className="text-lg font-bold text-gray-900">{seller?.storeName || seller?.name || 'ABELUS STORE'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {seller?.storeAddress || 'Kigali, Rwanda'}
                        </div>
                        {seller?.phone && <div className="text-xs text-gray-500">Tel: {seller.phone}</div>}
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Meta */}
                    <div className="text-xs text-gray-600 space-y-0.5 font-mono">
                        <div>Date: {formatDate(order.createdAt)}</div>
                        <div>Receipt: {order.publicId}</div>
                        <div>Cashier: {order.cashierName || 'Staff'}</div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Items */}
                    <table className="w-full text-xs font-mono">
                        <tbody>
                            {order.items?.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-0.5 pr-2">{item.productName || item.name}</td>
                                    <td className="py-0.5 px-1 text-center">x{item.quantity}</td>
                                    <td className="py-0.5 pl-2 text-right">{(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Totals */}
                    <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>RWF {subtotal.toLocaleString()}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>RWF {tax.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-gray-900 mt-2">
                            <span>TOTAL:</span>
                            <span>RWF {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Payment */}
                    <div className="text-xs text-gray-600 font-mono space-y-0.5">
                        <div>Payment: {paymentMethod.toUpperCase()}</div>
                        {paymentMethod.toLowerCase() === 'cash' && order.cashReceived && (
                            <>
                                <div>Cash Received: RWF {order.cashReceived.toLocaleString()}</div>
                                <div>Change: RWF {(order.cashReceived - grandTotal).toLocaleString()}</div>
                            </>
                        )}
                    </div>

                    <div className="text-center mt-6 text-xs text-gray-500 italic font-serif">
                        Thank you for shopping!
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex gap-3">
                    <button
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                        onClick={handlePrint}
                    >
                        <span>🖨️</span> Print Receipt
                    </button>
                    <button
                        className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium border border-gray-300 rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
