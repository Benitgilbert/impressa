import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaCalendarAlt, FaSearch } from "react-icons/fa";
import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import api from "../utils/axiosInstance";
import assetUrl from "../utils/assetUrl";
import toast from "react-hot-toast";

export default function Blog() {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const categories = ["All", "Seller Guides", "E-commerce Trends", "Platform Updates", "Success Stories", "Marketing 101", "Customer Tips"];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get("/blogs");
        setBlogPosts(data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("Failed to load blogs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      await api.post("/newsletter/subscribe", { email });
      toast.success("Successfully subscribed to our newsletter!");
      setEmail("");
    } catch (err) {
      console.error("Subscription failed:", err);
      toast.error(err.response?.data?.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (post.title?.toLowerCase() || "").includes(searchLower) ||
      (post.excerpt?.toLowerCase() || "").includes(searchLower) ||
      (post.author?.toLowerCase() || "").includes(searchLower);

    const matchesCategory = selectedCategory === "All" ||
      (post.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-white dark:bg-charcoal-800 border-b border-cream-200 dark:border-charcoal-700 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-terracotta-200 dark:bg-terracotta-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-sand-200 dark:bg-sand-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
          <div className="relative mx-auto max-w-7xl px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-black text-charcoal-800 dark:text-white mb-6">Impressa <span className="text-terracotta-500 dark:text-terracotta-400">Blog</span></h1>
            <p className="text-xl text-charcoal-600 dark:text-charcoal-400 max-w-2xl mx-auto leading-relaxed">
              Insights, tips, and inspiration for your printing projects and creative vision.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Content Column */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="space-y-12">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-white dark:bg-charcoal-800 rounded-[40px] p-8 border border-cream-200 dark:border-charcoal-700">
                      <div className="w-full h-64 bg-cream-200 dark:bg-charcoal-700 rounded-3xl mb-8"></div>
                      <div className="h-4 bg-cream-200 dark:bg-charcoal-700 rounded w-1/4 mb-4"></div>
                      <div className="h-8 bg-cream-200 dark:bg-charcoal-700 rounded w-3/4 mb-6"></div>
                      <div className="h-4 bg-cream-200 dark:bg-charcoal-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-cream-200 dark:bg-charcoal-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 bg-terracotta-50 dark:bg-terracotta-900/10 border-2 border-terracotta-500/20 rounded-[40px] text-center">
                  <p className="text-xl font-bold text-terracotta-600 dark:text-terracotta-400">{error}</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-20 bg-white dark:bg-charcoal-800 rounded-[40px] border-2 border-dashed border-cream-300 dark:border-charcoal-700 text-center text-charcoal-400 font-bold text-xl">
                  No blog posts found matching your criteria.
                </div>
              ) : (
                <div className="space-y-16">
                  {filteredPosts.map((post) => (
                    <article key={post._id} className="group bg-white dark:bg-charcoal-800 rounded-[40px] shadow-sm hover:shadow-2xl border border-cream-200 dark:border-charcoal-700 transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                      {post.image && (
                        <div className="aspect-[21/9] overflow-hidden">
                          <img
                            src={assetUrl(post.image)}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="p-8 md:p-12">
                        <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest mb-6">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-terracotta-500 dark:text-terracotta-400" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-terracotta-500 dark:text-terracotta-400" />
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => setSelectedCategory(post.category)}
                            className="px-4 py-1.5 bg-terracotta-50 dark:bg-terracotta-900/10 text-terracotta-500 dark:text-terracotta-400 rounded-full hover:bg-terracotta-500 hover:text-white transition-all"
                          >
                            {post.category}
                          </button>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-charcoal-800 dark:text-white mb-6 leading-tight group-hover:text-terracotta-500 dark:group-hover:text-terracotta-400 transition-colors">
                          <Link to={`/blog/${post._id}`}>{post.title}</Link>
                        </h2>
                        <p className="text-lg text-charcoal-500 dark:text-charcoal-400 mb-8 leading-relaxed line-clamp-3">{post.excerpt}</p>
                        <Link
                          to={`/blog/${post._id}`}
                          className="inline-flex items-center gap-2 text-terracotta-500 dark:text-terracotta-400 font-black text-lg group/link"
                        >
                          Read More <span className="group-hover:translate-x-2 transition-transform duration-300">&rarr;</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <aside className="lg:col-span-4 space-y-12">
              {/* Search */}
              <div className="bg-white dark:bg-charcoal-800 p-8 rounded-[40px] shadow-sm border border-cream-200 dark:border-charcoal-700">
                <h3 className="text-2xl font-black text-charcoal-800 dark:text-white mb-6">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search blogs..."
                    className="w-full bg-cream-100 dark:bg-charcoal-700 border border-transparent focus:border-terracotta-500 rounded-3xl py-4 pl-6 pr-14 text-charcoal-800 dark:text-white outline-none transition-all shadow-inner"
                  />
                  <FaSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-charcoal-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white dark:bg-charcoal-800 p-8 rounded-[40px] shadow-sm border border-cream-200 dark:border-charcoal-700">
                <h3 className="text-2xl font-black text-charcoal-800 dark:text-white mb-6">Categories</h3>
                <ul className="space-y-4">
                  {categories.map((category) => (
                    <li key={category}>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full flex items-center justify-between group p-4 rounded-2xl transition-all border ${selectedCategory === category
                          ? "bg-terracotta-500 text-white border-terracotta-500"
                          : "hover:bg-cream-100 dark:hover:bg-charcoal-700 border-transparent hover:border-cream-200 dark:hover:border-charcoal-600"
                          }`}
                      >
                        <span className={`font-bold ${selectedCategory === category
                          ? "text-white"
                          : "text-charcoal-600 dark:text-charcoal-400 group-hover:text-terracotta-500 dark:group-hover:text-terracotta-400"
                          }`}>{category}</span>
                        {selectedCategory === category && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter Placeholder */}
              <div className="bg-terracotta-500 p-10 rounded-[40px] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-1/2 -translate-y-1/2 transform group-hover:scale-150 transition-transform duration-1000"></div>
                <h3 className="text-2xl font-black mb-4">Never Miss a Post</h3>
                <p className="text-terracotta-100 mb-8 font-medium">Get the latest printing tips and design inspiration delivered to your inbox.</p>
                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/20 border border-white/30 rounded-2xl py-4 px-6 text-white placeholder:text-terracotta-200 outline-none focus:bg-white/30 transition-all font-bold"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="w-full bg-white text-terracotta-500 py-4 rounded-2xl font-black hover:bg-cream-100 transition-all active:scale-95 shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
