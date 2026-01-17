import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaImage } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../utils/axiosInstance";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import assetUrl from "../../utils/assetUrl";

export default function AdminBlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: "",
        image: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEditMode);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchBlog = useCallback(async () => {
        try {
            const { data } = await api.get(`/blogs/${id}`);
            setFormData({
                title: data.title,
                excerpt: data.excerpt,
                content: data.content,
                author: data.author,
                category: data.category,
                image: data.image
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
    }, [id, navigate]);

    useEffect(() => {
        if (isEditMode) {
            fetchBlog();
        }
    }, [isEditMode, fetchBlog]);

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
                imageUrl = uploadRes.data.data?.url || uploadRes.data.url || uploadRes.data.data?.filename; // Handle nested data structure
            }

            const payload = { ...formData, image: imageUrl };

            if (isEditMode) {
                await api.put(`/blogs/${id}`, payload);
            } else {
                await api.post("/blogs", payload);
            }

            navigate("/admin/blogs");
        } catch (err) {
            // Error handled by UI, no console log needed in production
            toast.error("Failed to save blog post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-charcoal-900 text-charcoal-500">Loading editor...</div>;
    }

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title={isEditMode ? "Edit Post" : "New Post"} />

                <main className="flex-1 p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/blogs")}
                                className="flex items-center gap-2 text-charcoal-500 hover:text-terracotta-500 transition-colors font-medium"
                            >
                                <FaArrowLeft /> Back to Blogs
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl shadow-lg shadow-terracotta-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                                {isEditMode ? "Update Post" : "Publish Post"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none transition-colors font-bold text-lg"
                                            placeholder="Enter post title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Excerpt / Subtitle</label>
                                        <textarea
                                            name="excerpt"
                                            value={formData.excerpt}
                                            onChange={handleInputChange}
                                            rows="3"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none transition-colors resize-none"
                                            placeholder="Short summary for preview cards..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Content</label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            rows="15"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none transition-colors font-mono text-sm leading-relaxed"
                                            placeholder="Write your article content here (Markdown or HTML supported if rendered)..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Settings */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 space-y-4">
                                    <h3 className="font-bold text-charcoal-800 dark:text-white border-b border-cream-100 dark:border-charcoal-700 pb-2">Publishing</h3>
                                    <div>
                                        <label className="block text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Author</label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none transition-colors"
                                            placeholder="Author Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-charcoal-700 dark:text-charcoal-300 mb-2">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-cream-50 dark:bg-charcoal-900 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none transition-colors appearance-none cursor-pointer"
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

                                <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 space-y-4">
                                    <h3 className="font-bold text-charcoal-800 dark:text-white border-b border-cream-100 dark:border-charcoal-700 pb-2">Featured Image</h3>
                                    <div className="space-y-4">
                                        <div className="aspect-video rounded-xl overflow-hidden bg-cream-100 dark:bg-charcoal-900 border-2 border-dashed border-charcoal-200 dark:border-charcoal-600 flex items-center justify-center relative group">
                                            {imagePreview ? (
                                                <>
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-medium">Change Image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <FaImage className="mx-auto text-3xl text-charcoal-300 mb-2" />
                                                    <span className="text-sm text-charcoal-400">No image selected</span>
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
                                            <p className="text-xs text-charcoal-500 text-center truncate px-2">
                                                Selected: {imageFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
