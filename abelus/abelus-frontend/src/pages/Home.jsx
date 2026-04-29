// Abelus Home Page - Premium Marketplace Design
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight, FaHeart, FaRegHeart, FaStar, FaShieldAlt, FaTruck, FaUndo, FaHeadset
} from "react-icons/fa";
import { formatRwf } from "../utils/currency";
import api from "../utils/axiosInstance";
import LandingFooter from "../components/LandingFooter";
import Header from "../components/Header";
import { useWishlist } from "../context/WishlistContext";
import AIChatWidget from "../components/AdminChatBot"; // Using the generic Chatbot

import assetUrl from "../utils/assetUrl";

const getRating = (rating) => {
  if (!rating) return 0;
  if (Array.isArray(rating)) {
    if (rating.length === 0) return 0;
    const sum = rating.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / rating.length;
  }
  return Number(rating);
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
    <div className="group bg-white dark:bg-charcoal-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-300 dark:border-charcoal-600">
      <div className="relative aspect-square bg-cream-100 dark:bg-charcoal-900 overflow-hidden">
        <Link to={`/product/${product._id}`}>
          {(product.image || product.images?.[0]) ? (
            <img
              src={assetUrl(
                product.image || product.images?.[0])}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal-300 dark:text-charcoal-500">No Image</div>
          )}
        </Link>
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-charcoal-700 transition text-charcoal-400 hover:text-terracotta-500"
        >
          {isWishlisted ? <FaHeart className="text-terracotta-500" /> : <FaRegHeart />}
        </button>
      </div>
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-charcoal-800 dark:text-cream-100 line-clamp-2 mb-2 group-hover:text-terracotta-500 dark:group-hover:text-terracotta-400 transition">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={`${i < getRating(product.averageRating)
              ? "text-sand-400" : "text-charcoal-200 dark:text-charcoal-700"} text-xs`} />
          ))}
          <span className="text-xs text-charcoal-400 ml-1">({getRating(product.averageRating).toFixed(1)})</span>
        </div>
        <div className="flex flex-col gap-1">
          {product.flashSaleInfo ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-terracotta-500">{formatRwf(product.flashSaleInfo.flashSalePrice)}</span>
                <span className="text-sm text-charcoal-400 line-through">{formatRwf(product.price)}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600 bg-terracotta-50 px-1.5 py-0.5 rounded w-fit">Flash Sale</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-charcoal-900 dark:text-white">{formatRwf(product.price)}</span>
          )}
          <Link
            to={`/product/${product._id}`}
            className="text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-300 text-sm font-medium"
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
  'Electronics': { img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop', color: 'from-charcoal-600 to-charcoal-700' },
  'Fashion': { img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop', color: 'from-terracotta-400 to-terracotta-500' },
  'Home & Living': { img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300&h=300&fit=crop', color: 'from-sand-400 to-sand-500' },
  'Sports': { img: 'https://images.unsplash.com/photo-1461896836934-480c9e5d4c98?w=300&h=300&fit=crop', color: 'from-sage-400 to-sage-500' },
  'Beauty': { img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop', color: 'from-terracotta-300 to-terracotta-400' },
  'Accessories': { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', color: 'from-charcoal-500 to-charcoal-600' }
};

const defaultColors = [
  'from-terracotta-400 to-terracotta-500',
  'from-sage-400 to-sage-500',
  'from-sand-400 to-sand-500',
  'from-charcoal-500 to-charcoal-600',
  'from-terracotta-300 to-terracotta-400',
  'from-sage-500 to-sage-600'
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [brandPartners, setBrandPartners] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ loading: false, message: '', type: '' });

  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [promoBanner, setPromoBanner] = useState(null);

  // Flash sale polling function
  const fetchFlashSale = async () => {
    try {
      const res = await api.get('/flash-sales/active');
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setActiveFlashSale(res.data.data[0]);
      } else {
        setActiveFlashSale(null);
      }
    } catch (err) {
      console.error('Error polling flash sale:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [featuredRes, trendingRes, categoriesRes, flashSaleRes, bannersRes, testimonialsRes, brandPartnersRes, siteSettingsRes] = await Promise.all([
        api.get('/products/featured/list'),
        api.get('/products/trending'),
        api.get('/categories'),
        api.get('/flash-sales/active'),
        api.get('/banners/active?position=hero'),
        api.get('/testimonials/active?limit=6'),
        api.get('/brand-partners/active'),
        api.get('/site-settings/public')
      ]);

      const featuredData = featuredRes.data;
      const trendingData = trendingRes.data;
      const categoriesData = categoriesRes.data;
      const flashSaleData = flashSaleRes.data;
      const bannersData = bannersRes.data;
      const testimonialsData = testimonialsRes.data;
      const brandPartnersData = brandPartnersRes.data;
      const siteSettingsData = siteSettingsRes.data;

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
      } else {
        setActiveFlashSale(null);
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

  // Countdown timer for Flash Sale
  useEffect(() => {
    const getTargetTime = () => {
      if (activeFlashSale) return new Date(activeFlashSale.endDate).getTime();
      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999);
      return endTime.getTime();
    };

    const targetTime = getTargetTime();

    const timer = setInterval(() => {
      const now = Date.now() + serverTimeOffset;
      const distance = targetTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        fetchFlashSale(); // Refresh data when sale ends
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
  }, [activeFlashSale, serverTimeOffset]);

  // Initial fetch and time sync
  useEffect(() => {
    const syncTimeAndFetch = async () => {
      try {
        const serverTimeRes = await api.get('/time');
        const serverTimestamp = serverTimeRes.data.timestamp || Date.now();
        setServerTimeOffset(serverTimestamp - Date.now());
      } catch (err) {
        console.error('Time sync failed on Home:', err);
      }
      await fetchData();
    };

    syncTimeAndFetch();

    // Polling for updates every 30 seconds
    const pollInterval = setInterval(fetchFlashSale, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
      <Header />

      <main>
        {/* Hero Section - Warm Humanised Design */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 dark:from-charcoal-900 dark:via-black dark:to-charcoal-900"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?w=1920')] bg-cover bg-center opacity-10"></div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
            <div className="max-w-3xl">
              <span className="inline-block bg-terracotta-500/20 text-terracotta-200 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-terracotta-500/30">
                ✨ Welcome to the future of shopping
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-terracotta-300 to-sand-300">Premium</span> Products
              </h1>
              <p className="text-xl text-cream-300 dark:text-cream-400 mb-10 max-w-xl">
                Curated collections, exclusive deals, and a seamless shopping experience. Find everything you need in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 flex items-center gap-2">
                  Explore Now <FaArrowRight />
                </Link>
                <Link to="/daily-deals" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition backdrop-blur-sm border border-white/20">
                  View Deals
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-terracotta-500 rounded-full blur-[128px] opacity-30"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sand-400 rounded-full blur-[128px] opacity-20"></div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-charcoal-800 dark:text-white mb-2">Shop by Category</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400">Browse our curated collections</p>
              </div>
              <Link to="/shop" className="text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-300 font-semibold flex items-center gap-1">
                View All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.slice(0, 6).map((cat, idx) => (
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name || cat.slug)}`}
                    key={cat.id || idx}
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
              <div className="text-center py-12 text-charcoal-400 dark:text-charcoal-500">
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
        <section className="py-16 bg-white dark:bg-charcoal-800 border-y border-cream-200 dark:border-charcoal-700">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-charcoal-800 dark:text-white mb-2">Featured Products</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400">Handpicked just for you</p>
              </div>
              <Link to="/shop?sort=featured" className="text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-300 font-semibold flex items-center gap-1">
                See All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin"></div>
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
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-terracotta-500 to-terracotta-600">
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
                  <Link to="/daily-deals" className="inline-block bg-white text-terracotta-600 px-8 py-3 rounded-full font-bold hover:bg-cream-100 transition">
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
        <section className="py-16 bg-white dark:bg-charcoal-800 border-y border-cream-200 dark:border-charcoal-700">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-charcoal-800 dark:text-white mb-2">Trending Now</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400">What everyone's buying</p>
              </div>
              <Link to="/shop?sort=trending" className="text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-300 font-semibold flex items-center gap-1">
                See All <FaArrowRight className="text-sm" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin"></div>
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
        {testimonials.length > 0 && (
          <section className="py-20 bg-cream-100 dark:bg-charcoal-900">
            <div className="mx-auto max-w-7xl px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-charcoal-800 dark:text-white mb-2">What Our Customers Say</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400">Real reviews from real shoppers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.slice(0, 6).map((testimonial, idx) => (
                  <div key={testimonial._id || idx} className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <FaStar key={i} className="text-sand-400" />
                      ))}
                    </div>
                    <p className="text-charcoal-600 dark:text-cream-300 mb-6 leading-relaxed">"{testimonial.content || testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      {testimonial.avatar ? (
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-500 flex items-center justify-center text-white font-bold text-lg">
                          {testimonial.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-charcoal-800 dark:text-cream-100">{testimonial.name}</h4>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Brand Logos / Trusted By */}
        {brandPartners.length > 0 && (
          <section className="py-12 bg-white dark:bg-charcoal-800 border-y border-cream-200 dark:border-charcoal-700">
            <div className="mx-auto max-w-7xl px-4">
              <p className="text-center text-charcoal-400 text-sm uppercase tracking-wider mb-8">Trusted by leading brands</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                {brandPartners.map((partner, idx) => (
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
                      className="text-2xl font-bold text-charcoal-400 dark:text-charcoal-500 hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors cursor-pointer"
                    >
                      {partner.name}
                    </div>
                  )
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <section className="bg-white dark:bg-charcoal-800 border-b border-cream-200 dark:border-charcoal-700">
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
                    <div className="w-12 h-12 bg-terracotta-50 dark:bg-charcoal-700 rounded-xl flex items-center justify-center text-terracotta-500 dark:text-terracotta-400">
                      {iconMap[badge.icon] || <FaShieldAlt className="text-2xl" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-charcoal-800 dark:text-cream-100">{badge.title}</h4>
                      <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 bg-charcoal-700 dark:bg-charcoal-900">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-charcoal-300 mb-8 max-w-md mx-auto">
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
                  const { data } = await api.post('/newsletter/subscribe', {
                    email: newsletterEmail,
                    source: 'homepage'
                  });
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
                className="flex-1 bg-charcoal-600 dark:bg-charcoal-800 border border-charcoal-500 rounded-full px-6 py-3 text-white placeholder-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                disabled={newsletterStatus.loading}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white px-8 py-3 rounded-full font-semibold hover:from-terracotta-600 hover:to-terracotta-700 transition disabled:opacity-50"
                disabled={newsletterStatus.loading}
              >
                {newsletterStatus.loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {newsletterStatus.message && (
              <p className={`mt-4 text-sm ${newsletterStatus.type === 'success' ? 'text-sage-400' : 'text-terracotta-400'}`}>
                {newsletterStatus.message}
              </p>
            )}
          </div>
        </section>
      </main>

      <LandingFooter />
      <AIChatWidget endpoint="/chatbot/public" title="Client Support" storageKey="publicChat" />
    </div >
  );
}
