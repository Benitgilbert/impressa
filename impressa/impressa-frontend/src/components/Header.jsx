import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaShoppingCart, FaHeart, FaSearch } from "react-icons/fa";

export default function Header() {
  const { items = [] } = useCart();

  return (
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
            <Link to="/wishlist" className="text-gray-500 hover:text-blue-800 transition-colors">
              <FaHeart className="text-xl" />
            </Link>
            <Link to="/cart" className="relative text-gray-500 hover:text-blue-800 transition-colors">
              <FaShoppingCart className="text-xl" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
            </Link>
            <Link to="/login" className="text-gray-900 hover:text-blue-800 font-medium transition-colors duration-200">Login</Link>
            <Link to="/checkout" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Get Custom Printing Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
