import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FaUser, FaCalendarAlt } from "react-icons/fa";
import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import api from "../utils/axiosInstance";
import toast from "react-hot-toast";
import assetUrl from "../utils/assetUrl";

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/blogs/${id}`);
        setPost(data);
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setError("Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold text-gray-500 dark:text-gray-400 animate-pulse">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800 text-center max-w-lg">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500">
            <FaCalendarAlt className="text-4xl" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{error || "Post not found"}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">The blog post you're looking for might have been moved or deleted.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 bg-violet-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-violet-700 transition-all shadow-xl active:scale-95">
            &larr; Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />

      <main className="py-12 md:py-20 lg:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-black mb-12 hover:translate-x-[-8px] transition-transform duration-300"
          >
            &larr; Back to all posts
          </Link>

          <article className="bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
            {post.image && (
              <div className="aspect-[21/9] w-full relative">
                <img
                  src={assetUrl(post.image)}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
              </div>
            )}

            <div className="p-8 md:p-16 lg:p-20 relative">
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest mb-10">
                <div className="flex items-center gap-2">
                  <FaUser className="text-violet-600 dark:text-violet-400" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-violet-600 dark:text-violet-400" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="px-4 py-1.5 bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 rounded-full">
                  {post.category}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-10 leading-tight">
                {post.title}
              </h1>

              <div className="prose prose-xl prose-violet dark:prose-invert max-w-none">
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-8 italic border-l-8 border-violet-600/20 dark:border-violet-400/20 pl-8 py-4">
                  {post.excerpt}
                </p>
                <div className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed space-y-6 whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
            </div>
          </article>

          {/* Share or Newsletter Callout */}
          <div className="mt-20 bg-violet-600 rounded-[40px] p-12 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3 transform group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-md text-center md:text-left">
                <h2 className="text-3xl font-black mb-4">Enjoyed this article?</h2>
                <p className="text-xl text-violet-100 font-medium">Join our mailing list to receive more creative insights and printing tips directly in your inbox.</p>
              </div>
              <div className="flex-1 w-full max-w-md">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-white/20 border border-white/30 rounded-2xl py-5 px-6 text-white placeholder:text-violet-200 outline-none focus:bg-white/30 transition-all font-bold"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="bg-white text-violet-600 px-8 py-5 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95 shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
