import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatRwf } from "../utils/currency";
import assetUrl from "../utils/assetUrl";
import LandingFooter from "../components/LandingFooter";
import {
  FaSearch, FaHeart, FaShoppingCart, FaStar, FaStarHalfAlt,
  FaTshirt, FaChevronLeft, FaPlus, FaMinus
} from "react-icons/fa";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [cloudLink, setCloudLink] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (e) {
        console.error("Failed to load product", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, { quantity, customText, cloudLink, cloudPassword });
    nav("/cart");
  };

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

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
              <Link to="/about" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">About Us</Link>
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
              </Link>
              <Link to="/checkout" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Custom Printing Now
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/shop" className="inline-flex items-center text-gray-600 hover:text-blue-800 transition-colors">
              <FaChevronLeft className="mr-2" />
              Back to Products
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-20">Loading product details...</div>
          ) : !product ? (
            <div className="text-center text-red-600 py-20">
              <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
              <p>We couldn't find the product you're looking for.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                {product.image ? (
                  <img src={assetUrl(product.image)} alt={product.name} className="w-full h-auto object-cover" />
                ) : (
                  <div className="aspect-square w-full h-full flex items-center justify-center bg-gray-100">
                    <FaTshirt className="text-8xl text-gray-400 opacity-50" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900" style={{fontFamily: "'Poppins', sans-serif"}}>{product.name}</h1>
                <p className="text-gray-600 text-lg">{product.description || "No description available."}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-500">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
                  </div>
                  <span className="text-gray-500">(3.5k reviews)</span>
                </div>
                
                <div className="text-4xl font-bold text-blue-800 my-2">{formatRwf(product.price)}</div>

                <div className="flex items-center gap-4 mt-4">
                  <label className="text-lg font-medium text-gray-800">Quantity</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"><FaMinus /></button>
                    <input type="text" readOnly value={quantity} className="w-16 border-l border-r text-center text-lg font-semibold" />
                    <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"><FaPlus /></button>
                  </div>
                </div>

                {product.customizable && (
                  <div className="mt-6 p-6 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800" style={{fontFamily: "'Poppins', sans-serif"}}>Add Your Customization</h3>
                    {product.customizationOptions?.includes("text") && (
                      <textarea value={customText} onChange={(e)=>setCustomText(e.target.value)} placeholder="Enter custom text (e.g., name, message)" className="w-full border-gray-300 rounded-lg px-4 py-3 text-base transition focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                    )}
                    {product.customizationOptions?.includes("cloud") && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input value={cloudLink} onChange={(e)=>setCloudLink(e.target.value)} placeholder="Cloud link (eg. Google Drive)" className="border-gray-300 rounded-lg px-4 py-3 text-base transition focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                        <input value={cloudPassword} onChange={(e)=>setCloudPassword(e.target.value)} placeholder="Password (optional)" className="border-gray-300 rounded-lg px-4 py-3 text-base transition focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                      </div>
                    )}
                    {!product.customizationOptions?.length && (
                      <div className="text-sm text-gray-500">This item supports customization. Please provide details in the notes during checkout.</div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button onClick={handleAdd} className="w-full flex items-center justify-center gap-3 bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <FaShoppingCart /> Add to Cart
                  </button>
                  <button onClick={()=>toggle(product._id)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-lg transition-all duration-300 ${has(product._id) ? 'bg-pink-100 border-pink-500 text-pink-600' : 'border-gray-300 hover:border-blue-800 hover:text-blue-800'}`}>
                    <FaHeart /> {has(product._id) ? 'Wishlisted' : 'Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
