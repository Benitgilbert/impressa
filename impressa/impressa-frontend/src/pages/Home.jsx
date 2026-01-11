// Impressa Home Page - Premium Marketplace Design
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight, FaHeart, FaRegHeart, FaStar, FaShieldAlt, FaTruck, FaUndo, FaHeadset
} from "react-icons/fa";
import { formatRwf } from "../utils/currency";
import LandingFooter from "../components/LandingFooter";
import Header from "../components/Header";
import { useWishlist } from "../context/WishlistContext";

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5000${path}`;
  return process.env.PUBLIC_URL + path;
};

// Product Card Component
const ProductCard = ({ product }) => {
  const { ids, toggle } = useWishlist();
  const isWishlisted = ids.includes(product._id);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700">
      <div className="relative aspect-square bg-gray-50 dark:bg-slate-900 overflow-hidden">
        <Link to={`/product/${product._id}`}>
          {product.image ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">No Image</div>
          )}
        </Link>
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-700 transition text-gray-400 hover:text-red-500"
        >
          {isWishlisted ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
        </button>
      </div>
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-gray-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className="text-amber-400 text-xs" />
          ))}
          <span className="text-xs text-gray-400 ml-1">(24)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatRwf(product.price)}</span>
          <Link
            to={`/product/${product._id}`}
            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
};

// Default category images and colors for fallback
const categoryDefaults = {
  'Electronics': { img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop', color: 'from-blue-500 to-cyan-500' },
  'Fashion': { img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop', color: 'from-pink-500 to-rose-500' },
  'Home & Living': { img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300&h=300&fit=crop', color: 'from-amber-500 to-orange-500' },
  'Sports': { img: 'https://images.unsplash.com/photo-1461896836934-480c9e5d4c98?w=300&h=300&fit=crop', color: 'from-green-500 to-emerald-500' },
  'Beauty': { img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop', color: 'from-purple-500 to-violet-500' },
  'Accessories': { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', color: 'from-slate-500 to-gray-600' }
};

const defaultColors = [
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-slate-500 to-gray-600'
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [promoBanner, setPromoBanner] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [brandPartners, setBrandPartners] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ loading: false, message: '', type: '' });

  // Countdown timer for Flash Sale
  useEffect(() => {
    if (!activeFlashSale) {
      // Default to midnight if no active sale
      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999);

      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime.getTime() - now;

        if (distance < 0) {
          clearInterval(timer);
          return;
        }

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }, 1000);

      return () => clearInterval(timer);
    }

    // Use actual flash sale end time
    const endTime = new Date(activeFlashSale.endDate);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeFlashSale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, trendingRes, categoriesRes, flashSaleRes, bannersRes, testimonialsRes, brandPartnersRes, siteSettingsRes] = await Promise.all([
          fetch('http://localhost:5000/api/products/featured/list'),
          fetch('http://localhost:5000/api/products/trending'),
          fetch('http://localhost:5000/api/categories'),
          fetch('http://localhost:5000/api/flash-sales/active'),
          fetch('http://localhost:5000/api/banners/active?position=hero'),
          fetch('http://localhost:5000/api/testimonials/active?limit=6'),
          fetch('http://localhost:5000/api/brand-partners/active'),
          fetch('http://localhost:5000/api/site-settings/public')
        ]);

        const featuredData = await featuredRes.json();
        const trendingData = await trendingRes.json();
        const categoriesData = await categoriesRes.json();
        const flashSaleData = await flashSaleRes.json();
        const bannersData = await bannersRes.json();
        const testimonialsData = await testimonialsRes.json();
        const brandPartnersData = await brandPartnersRes.json();
        const siteSettingsData = await siteSettingsRes.json();

        if (Array.isArray(featuredData)) {
          setFeatured(featuredData.filter(item => item && item._id));
        } else if (featuredData.success && Array.isArray(featuredData.products)) {
          setFeatured(featuredData.products.filter(item => item && item._id));
        }

        if (Array.isArray(trendingData)) {
          setTrending(trendingData.filter(item => item && item._id));
        }

        // Process categories with fallback images/colors
        if (categoriesData.success && Array.isArray(categoriesData.data)) {
          const processedCategories = categoriesData.data.map((cat, idx) => {
            const defaults = categoryDefaults[cat.name] || {};
            return {
              ...cat,
              img: cat.image || defaults.img || `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&h=300&fit=crop`,
              color: cat.color || defaults.color || defaultColors[idx % defaultColors.length]
            };
          });
          setCategories(processedCategories);
        }

        // Set active flash sale
        if (flashSaleData.success && flashSaleData.data && flashSaleData.data.length > 0) {
          setActiveFlashSale(flashSaleData.data[0]);
        }

        // Set promotional banner
        if (bannersData.success && bannersData.data && bannersData.data.length > 0) {
          setPromoBanner(bannersData.data[0]);
        }

        // Set testimonials
        if (testimonialsData.success && testimonialsData.data) {
          setTestimonials(testimonialsData.data);
        }

        // Set brand partners
        if (brandPartnersData.success && brandPartnersData.data) {
          setBrandPartners(brandPartnersData.data);
        }

        // Set trust badges
        if (siteSettingsData.success && siteSettingsData.data?.trustBadges) {
          setTrustBadges(siteSettingsData.data.trustBadges);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />

      <main>
        {/* Hero Section - Gradient Split Design */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 dark:from-black dark:via-violet-950 dark:to-black"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?w=1920')] bg-cover bg-center opacity-10"></div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
            <div className="max-w-3xl">
              <span className="inline-block bg-violet-500/20 text-violet-300 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-violet-500/30">
                ✨ Welcome to the future of shopping
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Premium</span> Products
              </h1>
              <p className="text-xl text-gray-300 dark:text-gray-400 mb-10 max-w-xl">
                Curated collections, exclusive deals, and a seamless shopping experience. Find everything you need in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 flex items-center gap-2">
                  Explore Now <FaArrowRight />
                </Link>
                <Link to="/daily-deals" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition backdrop-blur-sm border border-white/20">
                  View Deals
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-violet-500 rounded-full blur-[128px] opacity-30"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-500 rounded-full blur-[128px] opacity-20"></div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shop by Category</h2>
                <p className="text-gray-500 dark:text-gray-400">Browse our curated collections</p>
              </div>
              <Link to="/shop" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1">
                View All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.slice(0, 6).map((cat, idx) => (
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name || cat.slug)}`}
                    key={cat._id || idx}
                    className="group relative aspect-square rounded-2xl overflow-hidden shadow-md"
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60 group-hover:opacity-70 transition`}></div>
                    <div className="absolute inset-0 flex items-end p-4">
                      <span className="text-white font-bold text-lg drop-shadow-lg">{cat.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                <p>No categories available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Promotional Banner - Dynamic from Admin */}
        {promoBanner && (
          <section className="py-8">
            <div className="mx-auto max-w-7xl px-4">
              <div
                className="relative rounded-2xl overflow-hidden min-h-[200px] flex items-center"
                style={{
                  background: promoBanner.backgroundImage
                    ? `url(${promoBanner.backgroundImage}) center/cover`
                    : `linear-gradient(135deg, ${promoBanner.gradientFrom}, ${promoBanner.gradientTo})`
                }}
              >
                {/* Overlay pattern */}
                <div className="absolute inset-0 opacity-10 bg-black"></div>
                {/* Large decorative text */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-20 pointer-events-none overflow-hidden">
                  <span className="text-[200px] font-black text-white whitespace-nowrap -mr-20">SALE</span>
                </div>
                {/* Content */}
                <div className="relative z-10 p-8 md:p-12">
                  {promoBanner.badge && (
                    <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
                      {promoBanner.badge}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
                    {promoBanner.title}
                  </h2>
                  {promoBanner.subtitle && (
                    <p className="text-white/90 text-lg mb-6 max-w-lg">
                      {promoBanner.subtitle}
                    </p>
                  )}
                  <Link
                    to={promoBanner.buttonLink || '/shop'}
                    className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
                  >
                    {promoBanner.buttonText || 'Shop Now'}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Flash Sale with Countdown */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className={`bg-gradient-to-r ${activeFlashSale?.bannerColor || 'from-red-500 to-orange-500'} rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
              <div className="text-center md:text-left">
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  ⚡ Flash Sale
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  {activeFlashSale ? activeFlashSale.name : 'Ends in:'}
                </h3>
              </div>
              <div className="flex gap-3">
                {[
                  { value: String(timeLeft.days).padStart(2, '0'), label: 'Days' },
                  { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                  { value: String(timeLeft.minutes).padStart(2, '0'), label: 'Mins' },
                  { value: String(timeLeft.seconds).padStart(2, '0'), label: 'Secs' }
                ].map((unit, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center min-w-[60px]">
                    <div className="text-2xl md:text-3xl font-bold text-white">{unit.value}</div>
                    <div className="text-xs text-white/80 uppercase">{unit.label}</div>
                  </div>
                ))}
              </div>
              <Link to="/daily-deals" className="bg-white text-red-500 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition whitespace-nowrap">
                Shop Flash Sale →
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Featured Products</h2>
                <p className="text-gray-500 dark:text-gray-400">Handpicked just for you</p>
              </div>
              <Link to="/shop?sort=featured" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1">
                See All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featured.slice(0, 8).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Banner Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920')] bg-cover bg-center opacity-20"></div>
              <div className="relative px-8 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                    Limited Time Offer
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    Up to 50% Off
                  </h2>
                  <p className="text-white/80 text-lg mb-6 max-w-md">
                    Don't miss out on our biggest sale of the season. Shop now and save big on premium products.
                  </p>
                  <Link to="/daily-deals" className="inline-block bg-white text-violet-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition">
                    Shop the Sale
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
                    alt="Sale"
                    className="w-80 h-80 object-cover rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Trending Now</h2>
                <p className="text-gray-500 dark:text-gray-400">What everyone's buying</p>
              </div>
              <Link to="/shop?sort=trending" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1">
                See All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trending.slice(0, 8).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">What Our Customers Say</h2>
              <p className="text-gray-500 dark:text-gray-400">Real reviews from real shoppers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(testimonials.length > 0 ? testimonials : [
                {
                  name: 'Sarah M.',
                  role: 'Verified Buyer',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                  rating: 5,
                  content: "Absolutely love this store! The quality of products exceeded my expectations. Fast shipping and excellent customer service."
                },
                {
                  name: 'James K.',
                  role: 'Verified Buyer',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                  rating: 5,
                  content: "Best online shopping experience I've had in years. The website is easy to navigate and prices are competitive."
                },
                {
                  name: 'Emily R.',
                  role: 'Verified Buyer',
                  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
                  rating: 5,
                  content: "I was hesitant to order online, but Impressa made it so easy. The product was exactly as described."
                }
              ]).slice(0, 6).map((testimonial, idx) => (
                <div key={testimonial._id || idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <FaStar key={i} className="text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">"{testimonial.content || testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-slate-100">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Logos / Trusted By */}
        <section className="py-12 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-center text-gray-400 text-sm uppercase tracking-wider mb-8">Trusted by leading brands</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              {(brandPartners.length > 0 ? brandPartners : [
                { name: 'TechCorp' },
                { name: 'StyleHub' },
                { name: 'HomeMax' },
                { name: 'SportZone' },
                { name: 'BeautyPro' }
              ]).map((partner, idx) => (
                partner.logo ? (
                  <a
                    key={partner._id || idx}
                    href={partner.websiteUrl || '#'}
                    target={partner.websiteUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="hover:opacity-100 transition-opacity"
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-10 md:h-12 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <div
                    key={partner._id || idx}
                    className="text-2xl font-bold text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                  >
                    {partner.name}
                  </div>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(trustBadges.length > 0 ? trustBadges : [
                { icon: 'truck', title: 'Free Shipping', description: 'On orders over 50,000 Rwf' },
                { icon: 'shield', title: 'Secure Payment', description: '100% protected' },
                { icon: 'undo', title: 'Easy Returns', description: '30-day policy' },
                { icon: 'headset', title: '24/7 Support', description: 'Always here to help' }
              ]).map((badge, idx) => {
                const iconMap = {
                  truck: <FaTruck className="text-2xl" />,
                  shield: <FaShieldAlt className="text-2xl" />,
                  undo: <FaUndo className="text-2xl" />,
                  headset: <FaHeadset className="text-2xl" />,
                  clock: <FaHeadset className="text-2xl" />,
                  star: <FaStar className="text-2xl" />,
                  check: <FaShieldAlt className="text-2xl" />,
                  heart: <FaHeart className="text-2xl" />
                };
                return (
                  <div key={badge._id || idx} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                      {iconMap[badge.icon] || <FaShieldAlt className="text-2xl" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-slate-100">{badge.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 bg-slate-900 dark:bg-black">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Subscribe to get exclusive deals, new arrivals, and special offers delivered to your inbox.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newsletterEmail || !newsletterEmail.includes('@')) {
                  setNewsletterStatus({ loading: false, message: 'Please enter a valid email', type: 'error' });
                  return;
                }
                setNewsletterStatus({ loading: true, message: '', type: '' });
                try {
                  const res = await fetch('http://localhost:5000/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: newsletterEmail, source: 'homepage' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setNewsletterStatus({ loading: false, message: data.message, type: 'success' });
                    setNewsletterEmail('');
                  } else {
                    setNewsletterStatus({ loading: false, message: data.message, type: 'error' });
                  }
                } catch (err) {
                  setNewsletterStatus({ loading: false, message: 'Something went wrong. Please try again.', type: 'error' });
                }
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={newsletterStatus.loading}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-3 rounded-full font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition disabled:opacity-50"
                disabled={newsletterStatus.loading}
              >
                {newsletterStatus.loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {newsletterStatus.message && (
              <p className={`mt-4 text-sm ${newsletterStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {newsletterStatus.message}
              </p>
            )}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div >
  );
}
