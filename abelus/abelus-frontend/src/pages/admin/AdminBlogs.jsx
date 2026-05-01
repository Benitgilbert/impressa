import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaUser, FaNewspaper } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import assetUrl from "../../utils/assetUrl";
import toast from "react-hot-toast";

const AdminBlogs = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const { data } = await api.get("/blogs");
            setBlogs(data);
        } catch (error) {
            console.error("Failed to fetch blogs:", error);
            toast.error("Failed to load blog posts");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this blog post?")) return;

        try {
            await api.delete(`/blogs/${id}`);
            toast.success("Blog post deleted");
            fetchBlogs();
        } catch (error) {
            toast.error("Failed to delete blog post");
        }
    };

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <div className="min-h-screen flex flex-col transition-all duration-300">
                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-charcoal-900 dark:text-white">Blog Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage articles for your platform</p>
                        </div>
                        <Link
                            to="/admin/blogs/new"
                            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-terracotta-500/30"
                        >
                            <FaPlus /> Write New Post
                        </Link>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title or author..."
                                className="w-full pl-11 pr-4 py-2.5 bg-cream-50 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-xl text-sm text-charcoal-800 dark:text-white outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            Total Posts: <span className="font-bold text-charcoal-900 dark:text-white">{filteredBlogs.length}</span>
                        </div>
                    </div>

                    {/* Blog Content */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading blog posts...</p>
                            </div>
                        ) : filteredBlogs.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-500 dark:text-charcoal-400 italic">
                                No blog posts found. Create one to get started!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cream-50 dark:bg-charcoal-900">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Image</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Title</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Author</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-100 dark:divide-charcoal-700">
                                        {filteredBlogs.map((blog) => (
                                            <tr key={blog.id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-cream-100 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600">
                                                        {blog.image ? (
                                                            <img src={assetUrl(blog.image)} alt={blog.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                                                                <FaNewspaper />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-charcoal-800 dark:text-white max-w-xs truncate group-hover:text-terracotta-500 transition-colors">
                                                    {blog.title}
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-600 dark:text-charcoal-300">
                                                    <div className="flex items-center gap-2">
                                                        <FaUser className="text-gray-300 text-xs" />
                                                        {blog.author || "Admin"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-terracotta-50 dark:bg-terracotta-900/10 text-terracotta-600 dark:text-terracotta-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        {blog.category || "General"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-500 dark:text-charcoal-400 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-gray-300 text-xs" />
                                                        {new Date(blog.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-terracotta-500 hover:text-white transition-all"
                                                            title="Edit"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(blog.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream-50 dark:bg-charcoal-700 text-charcoal-600 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-end gap-1 group-hover:hidden">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-charcoal-600"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-charcoal-600"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-charcoal-600"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminBlogs;
