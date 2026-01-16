import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaNewspaper, FaPenNib } from "react-icons/fa";
import api from "../../utils/axiosInstance";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import assetUrl from "../../utils/assetUrl";

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const { data } = await api.get("/blogs");
            setBlogs(data);
        } catch (err) {
            console.error("Failed to fetch blogs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this blog post?")) return;
        try {
            await api.delete(`/blogs/${id}`);
            setBlogs(blogs.filter(blog => blog._id !== id));
        } catch (err) {
            console.error("Failed to delete blog", err);
            alert("Failed to delete blog post");
        }
    };

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Topbar onMenuClick={() => setSidebarOpen(true)} title="Blog Management" />

                <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white flex items-center gap-2">
                                <FaNewspaper className="text-terracotta-500" /> Blog Posts
                            </h1>
                            <p className="text-charcoal-500 dark:text-charcoal-400 mt-1">
                                Manage your blog posts and articles.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
                                <input
                                    type="text"
                                    placeholder="Search blogs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-2.5 rounded-xl border border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-800 dark:text-white focus:border-terracotta-500 outline-none w-64 transition-colors"
                                />
                            </div>
                            <Link
                                to="/admin/blogs/new"
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-400 hover:to-terracotta-500 text-white font-bold rounded-xl shadow-lg shadow-terracotta-500/20 transition-all active:scale-95"
                            >
                                <FaPenNib /> Write New Post
                            </Link>
                        </div>
                    </div>

                    {/* Blog Table */}
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal-500 dark:text-charcoal-400">Loading blog posts...</p>
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-500 dark:text-charcoal-400">
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
                                            <tr key={blog._id} className="hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-cream-100 dark:bg-charcoal-700">
                                                        {blog.image ? (
                                                            <img src={assetUrl(blog.image)} alt={blog.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-charcoal-400 bg-cream-200 dark:bg-charcoal-600">
                                                                <FaNewspaper />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-charcoal-800 dark:text-white max-w-xs truncate">{blog.title}</td>
                                                <td className="px-6 py-4 text-charcoal-600 dark:text-charcoal-300">{blog.author}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-terracotta-50 dark:bg-terracotta-900/10 text-terracotta-600 dark:text-terracotta-400 rounded-full text-xs font-bold">
                                                        {blog.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-charcoal-500 dark:text-charcoal-400 whitespace-nowrap">
                                                    {new Date(blog.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/admin/blogs/edit/${blog._id}`}
                                                            className="p-2 text-charcoal-400 hover:text-terracotta-500 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(blog._id)}
                                                            className="p-2 text-charcoal-400 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
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
}
