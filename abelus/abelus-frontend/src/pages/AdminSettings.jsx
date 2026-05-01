import { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { FaUser, FaEnvelope, FaLock, FaCamera, FaSave, FaSpinner, FaIdBadge, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function AdminSettings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: "", email: "", password: "", profileImage: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (message.text) {
            const t = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const fetchData = async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
            setProfileForm({
                name: response.data.name,
                email: response.data.email,
                password: "",
                profileImage: null
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileForm({ ...profileForm, profileImage: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", profileForm.name);
            formData.append("email", profileForm.email);
            if (profileForm.password) formData.append("password", profileForm.password);
            if (profileForm.profileImage) formData.append("profileImage", profileForm.profileImage);

            await api.put("/auth/me", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            fetchData();
        } catch (error) {
            console.error("Update failed:", error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-cream-100 dark:bg-charcoal-900">
            <div className="w-12 h-12 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">Profile Settings</h1>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Manage your account information and preferences</p>
                    </div>

                    {/* Alerts */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${message.type === 'success' ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 border-sage-200 dark:border-sage-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden relative group">
                                <div className="h-32 bg-gradient-to-r from-terracotta-500 to-terracotta-600"></div>
                                <div className="px-6 pb-6 relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-charcoal-800 shadow-md -mt-12 bg-white dark:bg-charcoal-700 relative overflow-hidden group-hover:border-terracotta-200 dark:group-hover:border-terracotta-900 transition-colors">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : user?.profileImage ? (
                                            <img src={`${process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-cream-200 dark:bg-charcoal-600 text-charcoal-500 dark:text-charcoal-300 text-3xl font-bold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <FaCamera />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>

                                    <div className="mt-4 text-center lg:text-left">
                                        <h2 className="text-xl font-bold text-charcoal-800 dark:text-white">{user?.name}</h2>
                                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 font-medium">{user?.role?.toUpperCase()}</p>

                                        <div className="flex flex-wrap gap-2 mt-4 justify-center lg:justify-start">
                                            <span className="px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 text-xs font-bold border border-sage-200 dark:border-sage-800">Verified</span>
                                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info / Tips */}
                            <div className="mt-6 bg-cream-50 dark:bg-charcoal-700/50 rounded-2xl p-6 border border-cream-200 dark:border-charcoal-700">
                                <h3 className="font-bold text-charcoal-800 dark:text-white mb-3">Security Tips</h3>
                                <ul className="space-y-3 text-sm text-charcoal-600 dark:text-charcoal-400">
                                    <li className="flex items-start gap-2">
                                        <FaCheckCircle className="text-sage-500 mt-0.5 shrink-0" />
                                        <span>Use a strong password with mixed characters.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <FaCheckCircle className="text-sage-500 mt-0.5 shrink-0" />
                                        <span>Update your password regularly.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <FaCheckCircle className="text-sage-500 mt-0.5 shrink-0" />
                                        <span>Keep your email address up to date.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Settings Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-cream-100 dark:border-charcoal-700">
                                    <div className="w-10 h-10 bg-terracotta-100 dark:bg-terracotta-900/20 rounded-xl flex items-center justify-center text-terracotta-600 dark:text-terracotta-400">
                                        <FaIdBadge />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-charcoal-800 dark:text-white">Profile Details</h3>
                                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Update your personal information</p>
                                    </div>
                                </div>

                                <form onSubmit={updateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group">
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                                                    <FaUser />
                                                </div>
                                                <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all" />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                                                    <FaEnvelope />
                                                </div>
                                                <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">New Password <span className="text-xs text-charcoal-400 font-normal ml-1">(Leave blank to keep current)</span></label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                                                <FaLock />
                                            </div>
                                            <input type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600 rounded-xl text-charcoal-800 dark:text-white outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-cream-100 dark:border-charcoal-700">
                                        <button type="button" onClick={() => fetchData()}
                                            className="px-6 py-2.5 text-charcoal-600 dark:text-charcoal-300 font-medium hover:bg-cream-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all">
                                            {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
    );
}

export default AdminSettings;
