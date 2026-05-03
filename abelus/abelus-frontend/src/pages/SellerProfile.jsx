import { useState, useEffect } from "react";
import { FaSave, FaStore, FaCamera, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import api from "../utils/axiosInstance";
import { useToast } from "../context/ToastContext";

const SellerProfile = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        storeName: "",
        storeDescription: "",
        storePhone: "",
        profileImage: null,
        storeLogo: null
    });
    const [previews, setPreviews] = useState({
        profileImage: null,
        storeLogo: null
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/auth/me");
                setFormData({
                    name: res.data.name || "",
                    email: res.data.email || "",
                    storeName: res.data.storeName || "",
                    storeDescription: res.data.storeDescription || "",
                    storePhone: res.data.storePhone || "",
                    profileImage: null,
                    storeLogo: null
                });
                setPreviews({
                    profileImage: res.data.profileImage,
                    storeLogo: res.data.storeLogo
                });
            } catch (err) {
                console.error("Failed to load profile", err);
                addToast("Failed to load profile data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [addToast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            setFormData(prev => ({ ...prev, [name]: file }));
            setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("storeName", formData.storeName);
            data.append("storeDescription", formData.storeDescription);
            data.append("storePhone", formData.storePhone);

            if (formData.profileImage) data.append("profileImage", formData.profileImage);
            if (formData.storeLogo) data.append("storeLogo", formData.storeLogo);

            await api.put("/auth/profile", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            addToast("Profile updated successfully!", "success");
        } catch (err) {
            console.error("Failed to update profile", err);
            addToast(err.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center">
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    Loading profile...
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Store Profile</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and store information</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Info Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <FaUser className="text-indigo-600 dark:text-indigo-400" /> Personal Information
                                </h3>

                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Profile Image Upload */}
                                    <div className="flex-shrink-0 mx-auto md:mx-0">
                                        <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-sm">
                                            {previews.profileImage ? (
                                                <img
                                                    src={previews.profileImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                    <FaUser size={48} />
                                                </div>
                                            )}
                                            <label htmlFor="profileImage" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <div className="flex flex-col items-center text-xs font-medium">
                                                    <FaCamera className="mb-1 text-lg" />
                                                    <span>Change</span>
                                                </div>
                                                <input type="file" id="profileImage" name="profileImage" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">Personal Photo</p>
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 w-full grid grid-cols-1 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUser className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaEnvelope className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Store Info Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <FaStore className="text-indigo-600 dark:text-indigo-400" /> Store Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Name</label>
                                        <input
                                            type="text"
                                            name="storeName"
                                            value={formData.storeName}
                                            onChange={handleChange}
                                            placeholder="My Awesome Store"
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Phone</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaPhone className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="storePhone"
                                                value={formData.storePhone}
                                                onChange={handleChange}
                                                placeholder="+250 7..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Description</label>
                                    <textarea
                                        name="storeDescription"
                                        value={formData.storeDescription}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Tell customers about your store..."
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm shadow-sm resize-y placeholder-gray-400 dark:placeholder-gray-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Logo</label>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-gray-700/30">
                                        <input type="file" id="storeLogo" name="storeLogo" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="storeLogo" className="flex items-center gap-5 cursor-pointer">
                                            {previews.storeLogo ? (
                                                <img
                                                    src={previews.storeLogo}
                                                    alt="Logo Preview"
                                                    className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-1"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                    <FaStore size={32} />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <span className="block font-medium text-gray-900 dark:text-white mb-1">Upload Store Logo</span>
                                                <span className="block text-sm text-gray-500 dark:text-gray-400">Recommended size: 500x500px. JPG, PNG supported.</span>
                                                <span className="inline-block mt-3 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                                    Choose File
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <FaSave /> {saving ? "Saving Changes..." : "Save Profile"}
                                </button>
                            </div>

                        </form>
                    </div>
        </main>
    );
};

export default SellerProfile;
