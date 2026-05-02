import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaSearch, FaHeart, FaShoppingCart, FaStar, FaTshirt, FaRegHeart, FaFilter, FaTimes
} from "react-icons/fa";
import { LuSlidersHorizontal, LuSparkles, LuTrendingUp, LuPackage } from "react-icons/lu";

import api from "../utils/axiosInstance";
import { formatRwf } from "../utils/currency";
import assetUrl from "../utils/assetUrl";
import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import Breadcrumbs from "../components/Breadcrumbs";

const getRating = (rating) => {
  if (!rating) return 0;
  if (Array.isArray(rating)) {
    if (rating.length === 0) return 0;
    const sum = rating.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / rating.length;
  }
  return Number(rating);
};

const WishlistButton = ({ product }) => {
  const { ids, toggle } = useWishlist();
  const isWishlisted = ids.includes(product.id);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <button
      onClick={toggleWishlist}
      className="absolute top-4 right-4 w-10 h-10 bg-white/95 dark:bg-charcoal-800/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 z-10 group/heart"
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isWishlisted ? (
        <FaHeart className="text-terracotta-500 text-lg group-hover/heart:scale-110 transition-transform" />
      ) : (
        <FaRegHeart className="text-charcoal-400 group-hover/heart:text-terracotta-500 text-lg transition-colors" />
      )}
    </button>
  );
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || searchParams.get("search") || "");
  const [localSearch, setLocalSearch] = useState(searchParams.get("q") || searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    const query = searchParams.get("q") || searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "newest";
    const min = searchParams.get("minPrice") || "";
    const max = searchParams.get("maxPrice") || "";

    if (category !== selectedCategory) setSelectedCategory(category);

    // Only update local search if q matches URL (to allow typing without interference)
    if (query !== q) {
      setQ(query);
      setLocalSearch(query);
    }
    if (category !== selectedCategory) setSelectedCategory(category);
    if (sort !== sortBy) setSortBy(sort);
    if (min !== minPrice) setMinPrice(min);
    if (max !== maxPrice) setMaxPrice(max);
  }, [searchParams, q, selectedCategory, sortBy, minPrice, maxPrice]);

  const { addItem } = useCart();
  const { showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [debouncedQ, setDebouncedQ] = useState(q);

  const handleAddToCart = async (product) => {
    if (product.customizable) {
      window.location.href = `/product/${product.id}`;
      return;
    }
    try {
      await addItem(product, { quantity: 1 });
    } catch (err) {
      showError("Failed to add to cart");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedQ) {
      newParams.set("q", debouncedQ);
    } else {
      newParams.delete("q");
      newParams.delete("search");
    }
    if (newParams.get("q") !== searchParams.get("q") || (searchParams.has("search") && !debouncedQ)) {
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedQ, searchParams, setSearchParams]);

  useEffect(() => {
    (async () => {
      try {
        const catRes = await api.get("/categories");
        setCategories(catRes.data.data || []);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (sortBy === "featured") {
          const { data } = await api.get("/products/featured/list");
          const productList = Array.isArray(data) ? data : (data.data || data.products || []);
          setProducts(productList);
          setLoading(false);
          return;
        }

        if (sortBy === "trending") {
          const { data } = await api.get("/products/trending");
          const productList = Array.isArray(data) ? data : [];
          setProducts(productList);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (debouncedQ) params.append("search", debouncedQ);

        if (selectedCategory) {
          const isId = /^[a-f\d]{24}$/i.test(selectedCategory) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory);
          if (isId) {
            params.append("category", selectedCategory);
          } else {
            const cat = categories.find(c =>
              c.name.toLowerCase() === selectedCategory.toLowerCase() ||
              c.slug?.toLowerCase() === selectedCategory.toLowerCase()
            );
            if (cat) {
              params.append("category", cat.id);
            } else {
              params.append("category", selectedCategory);
            }
          }
        }

        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (sortBy && sortBy !== "newest") params.append("sort", sortBy);

        const { data } = await api.get(`/products?${params.toString()}`);
        let productList = Array.isArray(data) ? data : (data.data || data.products || []);

        if (sortBy === "price-asc") {
          productList = [...productList].sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-desc") {
          productList = [...productList].sort((a, b) => b.price - a.price);
        } else if (sortBy === "newest") {
          productList = [...productList].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
        }

        setProducts(productList);
      } catch (e) {
        console.error("Failed to load products", e);
        if (e.name !== "CanceledError") showError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQ, selectedCategory, minPrice, maxPrice, sortBy, categories, showError]);

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    if (newSort && newSort !== "newest") {
      newParams.set("sort", newSort);
    } else {
      newParams.delete("sort");
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set("category", categoryId);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
    setMobileFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setQ("");
    setLocalSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams({});
  };

  const getPageTitle = () => {
    if (sortBy === "featured") return "Featured Products";
    if (sortBy === "trending") return "Trending Now";
    if (selectedCategory) {
      const cat = categories.find(c => c.id === selectedCategory || c.name === selectedCategory);
      return cat ? cat.name : "Shop";
    }
    return "All Products";
  };

  const getPageIcon = () => {
    if (sortBy === "featured") return <LuSparkles className="text-sand-500" />;
    if (sortBy === "trending") return <LuTrendingUp className="text-terracotta-500" />;
    return <LuPackage className="text-terracotta-500" />;
  };

  const hasActiveFilters = q || selectedCategory || minPrice || maxPrice;

  // Sidebar filters content (rendered as function to avoid remounting/focus loss)
  const renderFilters = () => (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">
          <FaSearch className="text-terracotta-500" /> Search
        </label>
        <div className="relative">
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQ(localSearch);
                setDebouncedQ(localSearch); // Trigger immediately
              }
            }}
            placeholder="Find products... (Press Enter)"
            className="w-full pl-4 pr-10 py-3 bg-cream-100 dark:bg-charcoal-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-terracotta-500 outline-none transition-all dark:text-white placeholder:text-charcoal-400"
          />
          <button
            onClick={() => {
              setQ(localSearch);
              setDebouncedQ(localSearch);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-terracotta-500 transition-colors"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">
          <LuSlidersHorizontal className="text-terracotta-500" /> Categories
        </label>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          <button
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === ""
              ? "bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white shadow-lg shadow-terracotta-500/25"
              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-800"
              }`}
            onClick={() => handleCategoryChange("")}
          >
            All Categories
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === c.id || selectedCategory === c.name
                ? "bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white shadow-lg shadow-terracotta-500/25"
                : "text-charcoal-600 dark:text-charcoal-400 hover:bg-cream-100 dark:hover:bg-charcoal-800"
                }`}
              onClick={() => handleCategoryChange(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-charcoal-800 dark:text-white mb-3 uppercase tracking-wider">
          Price Range (RWF)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full px-4 py-3 bg-cream-100 dark:bg-charcoal-800 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-terracotta-500 dark:text-white placeholder:text-charcoal-400"
          />
          <span className="text-charcoal-400 font-bold">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full px-4 py-3 bg-cream-100 dark:bg-charcoal-800 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-terracotta-500 dark:text-white placeholder:text-charcoal-400"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-3 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <FaTimes /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-300">
      <Header />

      <main className="pb-16">
        {/* Compact Hero Banner */}
        <div className="relative bg-gradient-to-r from-terracotta-500 via-terracotta-600 to-charcoal-700 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                  {getPageIcon()}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">{getPageTitle()}</h1>
                  <p className="text-white/70 text-sm">{products.length} products</p>
                </div>
              </div>
              <Breadcrumbs items={[{ label: 'Shop' }]} className="text-white/70 hidden sm:flex" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 mt-6">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Filter Button - Always Visible */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 bg-gradient-to-r from-terracotta-500 to-terracotta-600 shadow-xl rounded-2xl px-6 py-4 font-bold text-white hover:from-terracotta-600 hover:to-terracotta-700 transition-all"
            >
              <FaFilter /> Filters & Categories
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-white rounded-full" />
              )}
            </button>

            {/* Filters Drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-charcoal-800 shadow-2xl p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-charcoal-800 dark:text-white">Filters</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-10 h-10 bg-cream-100 dark:bg-charcoal-700 rounded-full flex items-center justify-center text-charcoal-500 hover:text-charcoal-700 dark:hover:text-white transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  {renderFilters()}
                </div>
              </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 shrink-0">
              <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-6 shadow-xl border border-cream-200 dark:border-charcoal-700 sticky top-24">
                <div className="flex items-center gap-3 text-lg font-black text-charcoal-800 dark:text-white mb-8 pb-4 border-b border-cream-200 dark:border-charcoal-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-xl flex items-center justify-center text-white">
                    <FaFilter className="text-sm" />
                  </div>
                  Filters
                </div>
                {renderFilters()}
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              {/* Sort Bar */}
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl border border-cream-200 dark:border-charcoal-700 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {hasActiveFilters && (
                    <>
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-2 bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-700 dark:text-terracotta-400 px-3 py-1.5 rounded-full text-sm font-medium">
                          {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                          <button onClick={() => handleCategoryChange("")} className="hover:text-terracotta-900 dark:hover:text-terracotta-200">
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      )}
                      {q && (
                        <span className="inline-flex items-center gap-2 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400 px-3 py-1.5 rounded-full text-sm font-medium">
                          "{q}"
                          <button onClick={() => setQ("")} className="hover:text-sage-900 dark:hover:text-sage-200">
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-charcoal-500 dark:text-charcoal-400 whitespace-nowrap font-medium">Sort by:</span>
                  <select
                    className="bg-cream-100 dark:bg-charcoal-700 border-0 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-terracotta-500 dark:text-white cursor-pointer min-w-[160px]"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="featured">Featured</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-charcoal-800 rounded-3xl shadow-xl border border-cream-200 dark:border-charcoal-700">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-terracotta-200 dark:border-terracotta-900 rounded-full" />
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-terracotta-500 rounded-full animate-spin" />
                  </div>
                  <p className="mt-6 text-charcoal-500 dark:text-charcoal-400 font-medium animate-pulse">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-16 text-center shadow-xl border border-cream-200 dark:border-charcoal-700">
                  <div className="w-24 h-24 bg-gradient-to-br from-cream-100 to-cream-200 dark:from-charcoal-700 dark:to-charcoal-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FaSearch className="text-4xl text-charcoal-300 dark:text-charcoal-500" />
                  </div>
                  <h3 className="text-2xl font-black text-charcoal-800 dark:text-white mb-3">No Products Found</h3>
                  <p className="text-charcoal-500 dark:text-charcoal-400 max-w-md mx-auto mb-8">
                    We couldn't find any products matching your current filters. Try adjusting your search or category selection.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-terracotta-500/25"
                  >
                    <FaTimes /> Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="group bg-white dark:bg-charcoal-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-cream-200 dark:border-charcoal-700 flex flex-col"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square bg-cream-100 dark:bg-charcoal-700 overflow-hidden">
                        <Link to={`/product/${p.id}`} className="block h-full">
                          {(p.image || p.images?.[0]) ? (
                            <img
                              src={assetUrl(p.image || p.images?.[0])}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-terracotta-100 to-terracotta-200 dark:from-charcoal-700 dark:to-charcoal-600">
                              <FaTshirt className="text-5xl text-terracotta-300 dark:text-terracotta-600" />
                            </div>
                          )}
                        </Link>

                        {/* Wishlist Button */}
                        <WishlistButton product={p} />

                        {/* Price Badge */}
                        <div className="absolute top-4 left-4 flex flex-col gap-1 items-start z-10">
                          {p.flashSaleInfo ? (
                            <>
                              <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                {formatRwf(p.flashSaleInfo.flashSalePrice)}
                              </div>
                              <div className="bg-white/90 backdrop-blur-sm text-charcoal-400 px-2 py-0.5 rounded-full text-[10px] font-bold line-through shadow-sm">
                                {formatRwf(p.price)}
                              </div>
                              <div className="bg-amber-400 text-charcoal-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                FLASH SALE
                              </div>
                            </>
                          ) : (
                            <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                              {formatRwf(p.price)}
                            </div>
                          )}
                        </div>

                        {/* Quick Add Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
                            className="bg-white text-charcoal-800 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-terracotta-500 hover:text-white"
                          >
                            {p.customizable ? (
                              <>✨ Customize</>
                            ) : (
                              <><FaShoppingCart /> Add to Cart</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <Link to={`/product/${p.id}`}>
                          <h3 className="font-bold text-charcoal-800 dark:text-white mb-2 line-clamp-1 group-hover:text-terracotta-500 dark:group-hover:text-terracotta-400 transition-colors text-base">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                          {p.description || "Premium quality product"}
                        </p>

                        {/* Rating & Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="flex text-sand-400 text-sm">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < getRating(p.averageRating) ? "text-sand-400" : "text-charcoal-200 dark:text-charcoal-700"} />
                              ))}
                            </div>
                            <span className="text-xs text-charcoal-400 ml-1">({getRating(p.averageRating).toFixed(1)})</span>
                          </div>
                          <Link
                            to={`/product/${p.id}`}
                            className="text-terracotta-500 dark:text-terracotta-400 text-sm font-bold hover:underline"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
