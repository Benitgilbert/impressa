import { useState, useEffect, useCallback } from "react";
import { 
    FaPrint, FaFileDownload, FaClock, FaCheckCircle, 
    FaCalculator, FaChevronRight 
} from "react-icons/fa";
import api from "../utils/axiosInstance";
import SellerSidebar from "../components/SellerSidebar";
import Header from "../components/Header";
import assetUrl from "../utils/assetUrl";
import { toast } from "react-hot-toast";

const SellerPrintOrders = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInquiry, setActiveInquiry] = useState(null);
    const [quoteAmount, setQuoteAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchInquiries = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/orders/seller/my-orders");
            if (res.data.success) {
                // Filter only print inquiries (quote_requested)
                const filtered = res.data.data.filter(o => o.status === "quote_requested");
                setInquiries(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch print inquiries", err);
            toast.error("Failed to load inquiries");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleSelectInquiry = (inquiry) => {
        setActiveInquiry(inquiry);
        setQuoteAmount("");
    };

    const handleSubmitQuote = async (e) => {
        e.preventDefault();
        if (!quoteAmount || isNaN(quoteAmount)) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post("/orders/submit-quote", {
                orderId: activeInquiry._id,
                quoteAmount: Number(quoteAmount)
            });

            if (res.data.success) {
                toast.success("Quote submitted successfully!");
                setActiveInquiry(null);
                fetchInquiries();
            }
        } catch (err) {
            console.error("Submit quote error:", err);
            toast.error(err.response?.data?.message || "Failed to submit quote");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            <SellerSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        
                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <FaPrint className="text-indigo-600" /> Print Management Center
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Review files and provide custom quotes for print requests.</p>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
                            
                            {/* Inquiry Inbox */}
                            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                                    <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        Incoming Requests <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full">{inquiries.length}</span>
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-8 text-center text-gray-500">Loading...</div>
                                    ) : inquiries.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400">
                                            <FaClock className="text-4xl mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-medium">No pending inquiries</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {inquiries.map(inq => (
                                                <button
                                                    key={inq._id}
                                                    onClick={() => handleSelectInquiry(inq)}
                                                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group ${activeInquiry?._id === inq._id ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-r-4 border-indigo-600' : ''}`}
                                                >
                                                    <div>
                                                        <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold mb-1">#{inq.publicId}</p>
                                                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                                                            {inq.items?.[0]?.productName || 'Print Service'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(inq.createdAt).toLocaleDateString()} • {inq.user?.name || inq.guestInfo?.name || 'Guest'}
                                                        </p>
                                                    </div>
                                                    <FaChevronRight className={`text-gray-300 group-hover:text-indigo-400 transition-transform ${activeInquiry?._id === inq._id ? 'translate-x-1 text-indigo-500' : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Inquiry Workspace */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {activeInquiry ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-200">Quote Requested</span>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Inquiry #{activeInquiry.publicId}</h2>
                                                <p className="text-gray-500 dark:text-gray-400">Received on {new Date(activeInquiry.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{activeInquiry.user?.name || activeInquiry.guestInfo?.name || 'Guest User'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{activeInquiry.user?.email || activeInquiry.guestInfo?.email || 'No email provided'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Service Details</h3>
                                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                                        <p className="font-bold text-gray-900 dark:text-white">{activeInquiry.items?.[0]?.productName}</p>
                                                        <p className="text-sm text-gray-500 mt-1">Quantity: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{activeInquiry.items?.[0]?.quantity} units</span></p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Notes</h3>
                                                    <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900/30">
                                                        <p className="text-gray-700 dark:text-gray-300 italic text-sm">
                                                            {activeInquiry.items?.[0]?.customizations?.customerNotes || "No notes provided by customer."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Attached File</h3>
                                                {activeInquiry.items?.[0]?.customizations?.customFile ? (
                                                    <div className="group relative bg-gray-900 rounded-2xl aspect-video overflow-hidden shadow-lg">
                                                        {/* Simple image preview if it's an image */}
                                                        {activeInquiry.items[0].customizations.customFile.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                                            <img 
                                                                src={assetUrl(activeInquiry.items[0].customizations.customFile)} 
                                                                alt="Attachment" 
                                                                className="w-full h-full object-cover opacity-60"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                                                                <FaPrint className="text-4xl mb-2" />
                                                                <span className="text-xs uppercase font-bold tracking-tighter">Document File</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-900/60 backdrop-blur-sm">
                                                            <a 
                                                                href={assetUrl(activeInquiry.items[0].customizations.customFile)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                                                            >
                                                                <FaFileDownload /> Download File
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl h-40 flex items-center justify-center text-gray-400 italic">
                                                        No file attached
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quoting Tool */}
                                        <div className="mt-auto border-t border-gray-100 dark:border-gray-700 pt-8">
                                            <form onSubmit={handleSubmitQuote} className="flex flex-col md:flex-row items-end gap-6">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Quote Amount (RWF)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RWF</div>
                                                        <input 
                                                            type="number"
                                                            value={quoteAmount}
                                                            onChange={(e) => setQuoteAmount(e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-xl text-gray-900 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3 disabled:opacity-50"
                                                >
                                                    {submitting ? 'Sending...' : (
                                                        <><FaCheckCircle /> Submit Quote</>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                                            <FaCalculator className="text-3xl text-indigo-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Workspace Ready</h2>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">Select an incoming request from the list to start reviewing files and providing quotes.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerPrintOrders;
