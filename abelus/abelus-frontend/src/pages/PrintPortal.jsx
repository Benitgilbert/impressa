import { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaPrint, FaFileAlt, FaCheckCircle, FaCalculator, FaInfoCircle } from "react-icons/fa";
import api from "../utils/axiosInstance";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PrintPortal = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [file, setFile] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get("/products?type=service");
                // Filters are handled by backend or manually here
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setServices(data.filter(p => p.type === 'service'));
            } catch (err) {
                console.error("Failed to fetch services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedService || !file) return alert("Please select a service and upload a file.");

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("serviceId", selectedService.id || selectedService._id);
            fd.append("file", file);
            fd.append("quantity", quantity);
            fd.append("notes", notes);

            // We use a specific inquiry endpoint
            await api.post("/orders/inquiry", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setSuccess(true);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send inquiry");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <Header />
                <div className="max-w-2xl mx-auto py-20 px-6 text-center">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <FaCheckCircle className="text-5xl text-green-600" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Request Sent!</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 font-medium">
                        The seller has received your files and details. They will review it and send you a quote shortly. You can track this in your dashboard.
                    </p>
                    <button 
                        onClick={() => window.location.href = "/"}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                    >
                        Return Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header />
            
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 py-20 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                                Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">Print Portal</span>
                            </h1>
                            <p className="text-indigo-100 text-xl font-medium opacity-90 max-w-xl">
                                Professional printing, binding, and document services at your fingertips. Upload your documents and get a custom quote today.
                            </p>
                        </div>
                        <div className="hidden md:block w-72 h-72 bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 p-8 transform rotate-6 animate-pulse">
                            <FaPrint className="text-8xl text-white/20 absolute bottom-4 right-4" />
                            <FaFileAlt className="text-6xl text-white/40" />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-16 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Form Side */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-700 transition-colors">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                                <FaCalculator className="text-indigo-600" /> Service Details
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Select Service</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {loading ? (
                                                <div className="animate-pulse flex space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                                    <div className="flex-1 space-y-2 py-1">
                                                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                                                    </div>
                                                </div>
                                            ) : services.map(s => (
                                                <button
                                                    key={s.id || s._id}
                                                    type="button"
                                                    onClick={() => setSelectedService(s)}
                                                    className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                                        selectedService?.id === s.id || selectedService?._id === s._id
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                                        : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-800'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className={`font-bold ${selectedService?.id === s.id || selectedService?._id === s._id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>{s.name}</p>
                                                        <p className="text-xs text-gray-500">Starting from RWF {s.price.toLocaleString()}</p>
                                                    </div>
                                                    {selectedService?.id === s.id || selectedService?._id === s._id ? <FaCheckCircle className="text-indigo-600" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Upload File(s)</label>
                                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[2rem] cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group overflow-hidden">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <FaCloudUploadAlt className="text-4xl text-gray-400 group-hover:text-indigo-500 transition-colors mb-2" />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
                                                        {file ? file.name : "Drop file here or click"}
                                                    </p>
                                                </div>
                                                <input type="file" className="hidden" onChange={handleFileChange} />
                                            </label>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Pages / Quantity</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-bold text-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Additional Instructions</label>
                                    <textarea 
                                        rows="4"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="E.g. Double sided, specific binding type, delivery instructions..."
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-3xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !selectedService || !file}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCloudUploadAlt /> Request Custom Quote
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Info Side */}
                    <div className="space-y-8">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-600/30">
                            <h3 className="text-2xl font-black mb-6">How it works</h3>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black shrink-0">1</div>
                                    <p className="font-medium opacity-90">Upload your PDF, Word, or image files directly here.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black shrink-0">2</div>
                                    <p className="font-medium opacity-90">The seller reviews your requirements and sets a final price.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black shrink-0">3</div>
                                    <p className="font-medium opacity-90">You receive a notification to pay online and start production.</p>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <FaInfoCircle className="text-yellow-500" /> Guidelines
                            </h3>
                            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                <p>• Supported formats: PDF, DOCX, JPG, PNG.</p>
                                <p>• Max file size: 50MB.</p>
                                <p>• For large files, please provide a cloud link in instructions.</p>
                                <p>• Estimated response time: 30-60 minutes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrintPortal;
