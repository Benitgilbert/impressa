import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaTimes, FaImage } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import assetUrl from "../../utils/assetUrl";
import toast from "react-hot-toast";

const AdminBlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: "",
        image: "",
        status: "draft"
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEditMode);

    useEffect(() => {
        if (isEditMode) {
            const fetchBlog = async () => {
                try {
                    const { data } = await api.get(`/blogs/${id}`);
                    setFormData({
                        title: data.title || "",
                        excerpt: data.excerpt || "",
                        content: data.content || "",
                        author: data.author || "",
                        category: data.category || "",
                        image: data.image || "",
                        status: data.status || "draft"
                    });
                    if (data.image) {
                        setImagePreview(assetUrl(data.image));
                    }
                } catch (err) {
                    toast.error("Failed to load blog post");
                    navigate("/admin/blogs");
                } finally {
                    setFetchLoading(false);
                }
            };
            fetchBlog();
        }
    }, [id, isEditMode, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image;

            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append("image", imageFile);
                const uploadRes = await api.post("/upload", uploadData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                imageUrl = uploadRes.data.data?.url || uploadRes.data.url || uploadRes.data.data?.filename;
            }

            const payload = { ...formData, image: imageUrl };

            if (isEditMode) {
                await api.put(`/blogs/${id}`, payload);
                toast.success("Blog post updated successfully!");
            } else {
                await api.post("/blogs", payload);
                toast.success("Blog post created successfully!");
            }

            navigate("/admin/blogs");
        } catch (err) {
            toast.error("Failed to save blog post");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">
                                {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
                            </h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">
                                {isEditMode ? "Update your existing blog post content" : "Draft a new article for the platform"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/admin/blogs")}
                                className="px-4 py-2 text-charcoal-600 dark:text-charcoal-400 hover:text-terracotta-500 font-medium transition-colors flex items-center gap-2"
                            >
                                <FaTimes /> Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-terracotta-500/20 disabled:opacity-50"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                                {isEditMode ? "Update Post" : "Publish Post"}
                            </button>
                        </div>
                    </div>

                    {/* Editor Form */}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Post Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors font-bold text-lg"
                                            placeholder="Enter a compelling title..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Excerpt / Summary</label>
                                        <textarea
                                            name="excerpt"
                                            required
                                            value={formData.excerpt}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors h-24 resize-none"
                                            placeholder="A short summary for search results and cards..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Content</label>
                                        <textarea
                                            name="content"
                                            required
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-charcoal-800 dark:text-white outline-none transition-colors min-h-[500px] resize-y font-mono text-sm leading-relaxed"
                                            placeholder="Write your article content here..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Options */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700">
                                <h3 className="font-bold text-charcoal-800 dark:text-white mb-4 border-b border-cream-100 dark:border-charcoal-700 pb-2">Publishing Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none cursor-pointer"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Author Name</label>
                                        <input
                                            type="text"
                                            name="author"
                                            required
                                            value={formData.author}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none"
                                            placeholder="Author Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider mb-2">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a category</option>
                                            <option value="Seller Guides">Seller Guides</option>
                                            <option value="E-commerce Trends">E-commerce Trends</option>
                                            <option value="Platform Updates">Platform Updates</option>
                                            <option value="Success Stories">Success Stories</option>
                                            <option value="Marketing 101">Marketing 101</option>
                                            <option value="Customer Tips">Customer Tips</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700">
                                <h3 className="font-bold text-charcoal-800 dark:text-white mb-4 border-b border-cream-100 dark:border-charcoal-700 pb-2">Featured Image</h3>
                                <div className="space-y-4">
                                    <div className="aspect-video rounded-xl overflow-hidden bg-cream-100 dark:bg-charcoal-900 border-2 border-dashed border-charcoal-200 dark:border-charcoal-600 flex items-center justify-center relative group">
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <FaImage className="mx-auto text-3xl text-charcoal-300 mb-2" />
                                                <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">Upload Image</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    {imageFile && (
                                        <p className="text-[10px] text-charcoal-500 text-center truncate px-2 italic">
                                            {imageFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default AdminBlogEditor;
