import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LuSearch,
  LuShoppingCart,
  LuHeart,
  LuMoon,
  LuSun,
  LuTruck,
  LuChevronDown,
  LuUser,
  LuLogOut,
  LuMenu,
  LuX
} from "react-icons/lu";
import RoleSwitcher from "./RoleSwitcher";
import api from "../utils/axiosInstance";
import assetUrl from "../utils/assetUrl";
import { formatRwf } from "../utils/currency";

export default function Header() {
  const { items = [] } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isSellerOrAdminView = location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin');

  useEffect(() => {
    setCategoryDropdownOpen(false);
    setAccountDropdownOpen(false);
    setShowSuggestions(false);
  }, [location]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const data = res.data;
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.get(`/products/suggestions?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleLogout = () => {
    logout();
    setAccountDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-charcoal-800 text-white shadow-xl border-b border-charcoal-700">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">

        {/* Mobile Menu Button - Left */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <LuMenu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-lg shadow-terracotta-500/20">
            <span className="text-xl font-bold text-white">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">Impressa</span>
        </Link>

        {/* Navigation - DESKTOP ONLY */}
        {!isSellerOrAdminView && (
          <nav className="hidden md:flex items-center gap-2">
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Categories <LuChevronDown className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setCategoryDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-60 bg-charcoal-800 border border-charcoal-600 rounded-xl shadow-2xl z-40 overflow-hidden">
                    <Link
                      to="/shop"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="block px-4 py-3 text-sm text-terracotta-400 font-semibold hover:bg-charcoal-700 transition-colors"
                    >
                      All Products
                    </Link>
                    <div className="h-px bg-charcoal-700 mx-2" />
                    <div className="max-h-80 overflow-y-auto p-1">
                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/shop?category=${encodeURIComponent(cat.name)}`}
                          onClick={() => setCategoryDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-cream-300 hover:text-white hover:bg-charcoal-700 rounded-lg transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/shop" className="px-3 py-2 text-sm font-medium text-cream-300 hover:text-white transition-colors">Shop</Link>
            <Link to="/daily-deals" className="px-3 py-2 text-sm font-medium text-sand-400 hover:text-sand-300 transition-colors">Deals</Link>
            <Link to="/track" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream-300 hover:text-white transition-colors">
              <LuTruck className="w-4 h-4" /> Track
            </Link>
            <Link to="/blog" className="px-3 py-2 text-sm font-medium text-cream-300 hover:text-white transition-colors">Blog</Link>
          </nav>
        )}

        {/* Search Bar - DESKTOP ONLY */}
        {!isSellerOrAdminView && (
          <div className="hidden md:block flex-1 max-w-md px-4">
            <div className="relative w-full group">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search products..."
                  className="w-full h-10 pl-4 pr-10 rounded-full bg-charcoal-700/50 border border-charcoal-600 focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 text-sm text-white placeholder-charcoal-400 outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 group-focus-within:text-terracotta-400 transition-colors">
                  <LuSearch className="w-5 h-5" />
                </button>
              </form>

              {showSuggestions && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-charcoal-800 border border-charcoal-600 rounded-2xl shadow-xl z-40 overflow-hidden">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-charcoal-400">Searching...</div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-1">
                        {suggestions.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleSuggestionClick(item._id)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal-700 cursor-pointer transition-colors"
                          >
                            <img src={assetUrl(item.image)} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-charcoal-700" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-cream-200 truncate">{item.name}</div>
                              <div className="text-xs text-terracotta-400 font-semibold">{formatRwf(item.price)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Icons & Auth - ALWAYS VISIBLE */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-charcoal-300 hover:text-white transition-colors"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <LuMoon className="w-5 h-5" /> : <LuSun className="w-5 h-5" />}
          </button>

          {/* Role Switcher (Admin Only) */}
          <RoleSwitcher user={user} theme={theme} />

          {!isSellerOrAdminView && (
            <>
              {/* Wishlist */}
              <Link to="/wishlist" className="p-2.5 text-charcoal-300 hover:text-white transition-colors">
                <LuHeart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-2.5 text-charcoal-300 hover:text-white transition-colors">
                <LuShoppingCart className="w-5 h-5" />
                {items.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white border-2 border-charcoal-800">
                    {items.length}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* User Account / Sign In */}
          {isAuthenticated ? (
            <div className="relative ml-2">
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-charcoal-700 border border-charcoal-600 text-terracotta-400 hover:border-terracotta-500 transition-colors"
              >
                <LuUser className="w-5 h-5" />
              </button>

              {accountDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAccountDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-charcoal-800 border border-charcoal-600 rounded-xl shadow-2xl z-40">
                    <div className="p-4 border-b border-charcoal-700">
                      <p className="text-xs text-charcoal-400 uppercase font-bold tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link to={isSellerOrAdminView ? "/seller/profile" : "/dashboard"} className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream-300 hover:text-white hover:bg-charcoal-700 rounded-lg transition-colors">
                        <LuUser className="w-4 h-4" /> {isSellerOrAdminView ? 'Seller Profile' : 'Dashboard'}
                      </Link>
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream-300 hover:text-white hover:bg-charcoal-700 rounded-lg transition-colors">
                        <LuTruck className="w-4 h-4" /> My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-terracotta-400 hover:bg-terracotta-500/10 rounded-lg transition-colors text-left"
                      >
                        <LuLogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-6 py-2.5 bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-400 hover:to-terracotta-500 text-white text-sm font-bold rounded-full shadow-lg shadow-terracotta-900/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {
        mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-charcoal-900/95 backdrop-blur-sm md:hidden overflow-y-auto">
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-charcoal-400 hover:text-white"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={(e) => {
                handleSearchSubmit(e);
                setMobileMenuOpen(false);
              }} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-charcoal-800 border border-charcoal-700 text-white placeholder-charcoal-500 focus:border-terracotta-500 outline-none"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400">
                  <LuSearch className="w-5 h-5" />
                </button>
              </form>

              <nav className="flex flex-col gap-2">
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-4 rounded-xl bg-charcoal-800 text-cream-200 font-medium hover:bg-charcoal-700"
                >
                  Shop All
                </Link>
                <Link
                  to="/daily-deals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-4 rounded-xl bg-charcoal-800 text-sand-400 font-medium hover:bg-charcoal-700"
                >
                  Daily Deals
                </Link>
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-4 rounded-xl bg-charcoal-800 text-cream-200 font-medium hover:bg-charcoal-700 flex items-center gap-2"
                >
                  <LuTruck className="w-4 h-4" /> Track Order
                </Link>
                <Link
                  to="/blog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-4 rounded-xl bg-charcoal-800 text-cream-200 font-medium hover:bg-charcoal-700"
                >
                  Blog
                </Link>

                <div className="h-px bg-charcoal-800 my-2" />

                <div className="text-xs font-bold text-charcoal-500 uppercase tracking-wider px-2 mb-2">Categories</div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 8).map(cat => (
                    <Link
                      key={cat._id}
                      to={`/shop?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 rounded-lg bg-charcoal-800/50 text-sm text-charcoal-300 hover:text-white hover:bg-charcoal-700 truncate"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )
      }
    </header >
  );
}
