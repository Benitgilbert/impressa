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
import "./Home.css";

const placeholderProducts = [
  { _id: '1', name: 'Custom ID Cards', description: 'Professional identification cards for businesses and events.', price: 1299, image: '/images/popular-product-1.jpg' },
  { _id: '2', name: 'Photo Frames', description: 'Beautiful custom frames for your cherished memories.', price: 2499, image: '/images/popular-product-2.jpg' },
  { _id: '3', name: 'Custom Banners', description: 'Eye-catching banners for events and promotions.', price: 3999, image: '/images/popular-product-3.jpg' },
  { _id: '4', name: 'Custom Tote Bags', description: 'Personalized bags perfect for any occasion.', price: 1899, image: '/images/popular-product-4.jpg' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/products/featured/list", { params: { limit: 4 } });
        if (data && data.length > 0) {
          setFeatured(data);
        } else {
          setFeatured(placeholderProducts);
        }
      } catch (e) {
        console.error("Failed to load homepage products, using placeholders.", e);
        setFeatured(placeholderProducts);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return '';
    // For absolute URLs (like placeholders from cloudinary)
    if (path.startsWith('http')) return path;
    // For backend-provided paths
    if (path.startsWith('/uploads/')) return `http://localhost:5000${path}`;
    // For local public paths
    return process.env.PUBLIC_URL + path;
  };

  return (
    <div className="font-roboto">
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
        <section className="code-section relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-light-background-color to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md">
                  <FaStar className="text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">Trusted by 10,000+ Customers</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-poppins">
                  <span className="text-gray-900">Transform Your Ideas Into</span>
                  <span className="block mt-2 bg-gradient-to-r from-blue-800 via-green-500 to-yellow-500 bg-clip-text text-transparent">Premium Custom Prints</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0">
                  Professional printing for ID cards, photo frames, banners, and more. Design online, delivered fast with guaranteed quality.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/shop" className="group bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center">
                    Start Creating Now
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/about" className="bg-white text-blue-800 px-8 py-4 rounded-lg font-bold text-lg border-2 border-blue-800 hover:bg-blue-800 hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center">
                    See How It Works
                    <FaPlayCircle className="ml-2" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                  <div className="text-center lg:text-left"><div className="flex items-center justify-center lg:justify-start space-x-2"><FaShippingFast className="text-2xl text-green-500" /><span className="text-sm font-semibold text-gray-900">Fast Delivery</span></div></div>
                  <div className="text-center lg:text-left"><div className="flex items-center justify-center lg:justify-start space-x-2"><FaShieldAlt className="text-2xl text-green-500" /><span className="text-sm font-semibold text-gray-900">Quality Guaranteed</span></div></div>
                  <div className="text-center lg:text-left"><div className="flex items-center justify-center lg:justify-start space-x-2"><FaHeadset className="text-2xl text-green-500" /><span className="text-sm font-semibold text-gray-900">24/7 Support</span></div></div>
                </div>
              </div>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img src={process.env.PUBLIC_URL + '/images/hero-image.jpg'} alt="Custom printing products" className="w-full h-full object-cover" />
                  <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                    <div className="flex items-center space-x-3"><div className="bg-green-500 rounded-full p-3"><FaCheck className="text-white text-xl" /></div><div><p className="font-bold text-gray-900">Easy Customization</p><p className="text-sm text-gray-500">Design in minutes</p></div></div>
                  </div>
                </div>
                <div className="hidden lg:block absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl animate-float"><div className="text-center"><p className="text-3xl font-bold text-blue-800">10K+</p><p className="text-sm text-gray-500">Happy Customers</p></div></div>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"><FaChevronDown className="text-gray-500 text-2xl" /></div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-poppins">Popular Custom Products</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Browse our most-loved custom printing products. High-quality materials, fast turnaround, and stunning results.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {loading ? <div className="text-gray-500 col-span-full">Loading…</div> : featured.map((p) => (
                <div key={p._id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
                  <Link to={`/product/${p._id}`} className="relative overflow-hidden bg-gray-200 aspect-square block">
                    {p.image ? <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaTshirt className="text-8xl text-gray-400 opacity-50" /></div>}
                  </Link>
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-2 truncate">{p.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 h-10 overflow-hidden">{p.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-800">{formatRwf(p.price)}</span>
                      <div className="flex items-center space-x-1 text-yellow-500"><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStar className="text-sm" /><FaStarHalfAlt className="text-sm" /></div>
                    </div>
                    <Link to={`/product/${p._id}`} className="w-full block text-center bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform group-hover:scale-105">
                      <FaShoppingCart className="mr-2 inline" />View Product
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/shop" className="inline-flex items-center bg-white border-2 border-blue-800 text-blue-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl">
                View All Products<FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-gradient-to-br from-light-background-color via-white to-medium-background-color relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-800 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-poppins">
                Why Choose Impressa?
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                We combine cutting-edge technology with expert craftsmanship to deliver exceptional custom printing solutions
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="group text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                  <div className="bg-gradient-to-br from-blue-800 to-green-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FaGem className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3">
                    Premium Quality
                  </h3>
                  <p className="text-gray-500">
                    Professional-grade materials and printing technology for stunning results every time
                  </p>
                </div>
              </div>
              <div className="group text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FaRocket className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3">
                    Lightning Fast
                  </h3>
                  <p className="text-gray-500">
                    Quick turnaround times with same-day processing and express shipping options
                  </p>
                </div>
              </div>
              <div className="group text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                  <div className="bg-gradient-to-br from-green-500 to-green-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FaPalette className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3">
                    Easy Customization
                  </h3>
                  <p className="text-gray-500">
                    Intuitive design tools that make creating your perfect product simple and fun
                  </p>
                </div>
              </div>
              <div className="group text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                  <div className="bg-gradient-to-br from-red-500 to-red-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FaHeadset className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-3">
                    Expert Support
                  </h3>
                  <p className="text-gray-500">
                    Dedicated customer service team ready to help you 24/7 with any questions
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center border-r-0 sm:border-r border-gray-200 last:border-r-0">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-800 mb-2">
                    10,000+
                  </div>
                  <p className="text-gray-500 font-medium">
                    Happy Customers
                  </p>
                </div>
                <div className="text-center border-r-0 lg:border-r border-gray-200 last:border-r-0">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-800 mb-2">
                    50,000+
                  </div>
                  <p className="text-gray-500 font-medium">
                    Products Printed
                  </p>
                </div>
                <div className="text-center border-r-0 sm:border-r border-gray-200 last:border-r-0">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-800 mb-2">
                    24/7
                  </div>
                  <p className="text-gray-500 font-medium">
                    Customer Support
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-800 mb-2">
                    99.9%
                  </div>
                  <p className="text-gray-500 font-medium">
                    Satisfaction Rate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-green-500 rounded-3xl transform rotate-3"></div>
                  <img src={process.env.PUBLIC_URL + '/images/feature-image.jpg'} alt="Custom printing process" className="relative rounded-3xl shadow-2xl w-full h-full object-cover" />
                  <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-500 rounded-full p-4">
                        <FaThumbsUp className="text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          100%
                        </p>
                        <p className="text-sm text-gray-500">
                          Satisfaction
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-poppins">
                  Simple 3-Step Process
                </h2>
                <p className="text-lg text-gray-500 mb-12">
                  From design to delivery, we make custom printing effortless
                </p>
                <div className="flex gap-6 mb-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-800 to-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Choose Your Product
                    </h3>
                    <p className="text-gray-500">
                      Browse our catalog and select from ID cards, banners, frames, and more. Find exactly what you need for your project.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 mb-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-300 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Customize Your Design
                    </h3>
                    <p className="text-gray-500">
                      Use our easy online design tool to upload your artwork, add text, and personalize every detail to perfection.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 mb-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-300 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Receive Fast Delivery
                    </h3>
                    <p className="text-gray-500">
                      We print with precision and ship quickly. Track your order and receive your premium custom prints at your door.
                    </p>
                  </div>
                </div>
                <div className="mt-12">
                  <Link to="/shop" className="inline-flex items-center bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                    Get Started Now
                    <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-800 via-blue-700 to-green-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full filter blur-3xl"></div>
          </div>
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white"></circle>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)"></rect>
            </svg>
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-8 shadow-2xl">
              <FaPrint className="text-3xl text-blue-800" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-poppins">
              Ready to Bring Your Ideas to Life?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
              Join thousands of satisfied customers who trust Impressa for their custom printing needs. Start creating your perfect product today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/shop" className="bg-white text-blue-800 px-10 py-5 rounded-lg font-bold text-lg hover:bg-gray-200 transition-all duration-300 shadow-2xl hover:shadow-xl transform hover:-translate-y-1 flex items-center">
                Start Creating Now
                <FaArrowRight className="ml-2" />
              </Link>
              <Link to="/contact" className="border-2 border-white text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-800 transition-all duration-300 flex items-center">
                <FaPhone className="mr-2" />
                Contact Us
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-2 text-white">
                <FaShieldAlt className="text-2xl" />
                <span className="font-medium">Secure Checkout</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <FaTruck className="text-2xl" />
                <span className="font-medium">Free Shipping Over $50</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <FaUndo className="text-2xl" />
                <span className="font-medium">30-Day Money Back</span>
              </div>
            </div>
          </div>
        </section>


      </main>
      <LandingFooter />
    </div>
  );
}