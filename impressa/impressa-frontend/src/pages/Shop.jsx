import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaHeart, FaShoppingCart, FaStar, FaPlayCircle, FaArrowRight,
  FaShippingFast, FaShieldAlt, FaHeadset, FaChevronDown, FaCheck,
  FaRegHeart, FaStarHalfAlt, FaGem, FaRocket, FaPalette, FaPrint,
  FaTruck, FaUndo, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaPaperPlane, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTshirt, FaThumbsUp
} from "react-icons/fa";

import api from "../utils/axiosInstance";
import { formatRwf } from "../utils/currency";
import LandingFooter from "../components/LandingFooter";
import { useCart } from "../context/CartContext";
import "./Home.css";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/products");
        setProducts(data || []);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `http://localhost:5000${path}`;
    return process.env.PUBLIC_URL + path;
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{fontFamily: "'Roboto', sans-serif"}}>
      <header id="global-header" className="code-section sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            <Link to="/" className="flex-shrink-0 transition-transform hover:scale-105 duration-300">
              <img src={process.env.PUBLIC_URL + '/images/logo.png'} alt="Impressa Logo" className="h-28 py-2 w-auto" />
            </Link>
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/shop" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Product Listing</Link>
              <Link to="/about" className="text-blue-800 font-bold">About Us</Link>
              <Link to="/contact" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Contact</Link>
              <Link to="/blog" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Blog</Link>
            </nav>
            <div className="hidden lg:flex items-center space-x-6">
              <button className="text-gray-500 hover:text-blue-800 transition-colors">
                <FaSearch className="text-xl" />
              </button>
              <Link to="/wishlist" className="text-gray-500 hover:text-blue-800 transition-colors relative">
                <FaHeart className="text-xl" />
              </Link>
              <Link to="/cart" className="text-gray-500 hover:text-blue-800 transition-colors relative">
                <FaShoppingCart className="text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
              </Link>
              <Link to="/checkout" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Custom Printing Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="code-section relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-light-background-color to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{fontFamily: "'Poppins', sans-serif"}}>
              <span className="text-gray-900">Explore Our Collection of</span>
              <span className="block mt-2 bg-gradient-to-r from-blue-800 via-green-500 to-yellow-500 bg-clip-text text-transparent">Customizable Products</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto">
              Find the perfect canvas for your creativity. From professional business essentials to unique personal gifts, we have it all.
            </p>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{fontFamily: "'Poppins', sans-serif"}}>All Products</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Browse our wide selection of customizable products. High-quality materials, fast turnaround, and stunning results.</p>
              <div className="mt-8 relative max-w-md mx-auto">
                <input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="Search for products like 'banners', 'ID cards'..." 
                  className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md" 
                />
                <FaSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {loading ? <div className="text-gray-500 col-span-full text-center">Loading…</div> : filtered.map((p) => (
                <div key={p._id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
                  <Link to={`/product/${p._id}`} className="relative overflow-hidden bg-gray-200 aspect-square block">
                    {p.image ? <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center"><FaTshirt className="text-8xl text-gray-400 opacity-50" /></div>}
                  </Link>
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-2 truncate">{p.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 h-10 overflow-hidden">{p.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-800">{formatRwf(p.price)}</span>
                      <div className="flex items-center space-x-1 text-yellow-500"><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStarHalfAlt className="text-sm" /></div>
                    </div>
                    <button 
                        onClick={() => p.customizable ? window.location.href=`/product/${p._id}` : addItem(p, { quantity: 1 })} 
                        className="w-full block text-center bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform group-hover:scale-105"
                    >
                      <FaShoppingCart className="mr-2 inline" />{p.customizable ? 'Customize' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-12">
                <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
                <p>Try adjusting your search or check back later for new arrivals.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  );
}