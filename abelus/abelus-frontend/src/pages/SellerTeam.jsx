import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaUserShield, FaUserFriends, FaEnvelope, FaLock, FaTimes } from "react-icons/fa";
import api from "../utils/axiosInstance";
import SellerSidebar from "../components/SellerSidebar";
import Header from "../components/Header";

const SellerTeam = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get("/staff");
            if (res.data.success) {
                setStaff(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch staff:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await api.post("/staff", form);
            if (res.data.success) {
                setStaff([res.data.staff, ...staff]);
                setShowModal(false);
                setForm({ name: "", email: "", password: "" });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create staff member");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this staff member? They will lose access to the POS immediately.")) {
            try {
                await api.delete(`/staff/${id}`);
                setStaff(staff.filter(s => s.id !== id));
            } catch (err) {
                alert("Failed to remove staff member");
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            <SellerSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <FaUserShield className="text-indigo-600" /> Team Management
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your cashiers and store staff</p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                            >
                                <FaPlus /> Add New Cashier
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64 text-gray-400">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mr-3"></div>
                                <span className="font-bold">Loading your team...</span>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaUserFriends className="text-4xl text-indigo-500 opacity-50" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No staff members yet</h2>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 font-medium">
                                    Hire a cashier to help you manage sales at your physical store location.
                                </p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                >
                                    Get Started
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {staff.map((member) => (
                                    <div key={member.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg">{member.name}</h3>
                                                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <FaEnvelope className="text-indigo-400" /> {member.email}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2 border-t dark:border-gray-700">
                                                Hired on {new Date(member.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaTrash size={12} /> Remove Access
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10">
                        <div className="p-8 pb-0 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Add New Cashier</h2>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"><FaTimes /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <FaUserFriends />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                                        placeholder="Enter cashier's name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <FaEnvelope />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                                        placeholder="cashier@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Temporary Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <FaLock />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={form.password}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                                        placeholder="Create a password"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1">Give this password to your staff member to login.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Staff Account"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerTeam;
