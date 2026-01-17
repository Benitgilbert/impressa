import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { formatRwf } from "../utils/currency";
import assetUrl from "../utils/assetUrl";
import LandingFooter from "../components/LandingFooter";
import Header from "../components/Header";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  FaHeart, FaShoppingCart, FaStar,
  FaTshirt, FaPlus, FaMinus
} from "react-icons/fa";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [cloudLink, setCloudLink] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // Variable product state
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [currentVariation, setCurrentVariation] = useState(null);

  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const { showError } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);

        // Fetch Reviews
        try {
          const reviewsRes = await api.get(`/reviews/product/${id}`);
          setReviews(reviewsRes.data);

          // Calculate average rating locally if not on product
          if (reviewsRes.data.length > 0) {
            const avg = reviewsRes.data.reduce((acc, r) => acc + r.rating, 0) / reviewsRes.data.length;
            setProduct(prev => ({ ...prev, averageRating: avg }));
          }
        } catch (err) {
          console.error("Failed to fetch reviews", err);
        }

        // Fetch Related Products
        try {
          const relatedRes = await api.get(`/products/${id}/related`);
          setRelatedProducts(relatedRes.data);
        } catch (err) {
          console.error("Failed to fetch related products", err);
        }

        // Fetch Recommendations (Smart Picks)
        try {
          const recRes = await api.get(`/products/recommendations?productId=${id}`);
          setRecommendations(recRes.data);
        } catch (err) {
          // Silently fail if no recommendations
          setRecommendations([]);
        }

        // Initialize attributes if variable
        if (res.data.type === 'variable' && res.data.attributes) {
          const initialAttrs = {};
          res.data.attributes.forEach(attr => {
            if (attr.variation && attr.values.length > 0) {
              initialAttrs[attr.name] = ""; // Start empty to force selection
            }
          });
          setSelectedAttributes(initialAttrs);
        }
      } catch (e) {
        console.error("Failed to load product", e);
        showError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, showError]);



  // Handle variation selection
  useEffect(() => {
    if (product?.type === 'variable' && product.variations) {
      // Check if all attributes are selected
      const allSelected = Object.values(selectedAttributes).every(v => v !== "");

      if (allSelected) {
        // Robust matching: trim and case-insensitive check
        const match = product.variations.find(v => {
          if (!v.attributes) return false;
          const vAttrs = v.attributes;

          return Object.entries(selectedAttributes).every(([selKey, selVal]) => {
            const varKey = Object.keys(vAttrs).find(k => k.trim().toLowerCase() === selKey.trim().toLowerCase());
            if (!varKey) return false;

            const varVal = vAttrs[varKey];
            return String(varVal).trim().toLowerCase() === String(selVal).trim().toLowerCase();
          });
        });
        setCurrentVariation(match || null);
      } else {
        setCurrentVariation(null);
      }
    }
  }, [selectedAttributes, product]);

  const handleAdd = () => {
    if (!product) return;

    if (product.type === 'variable') {
      if (!currentVariation) {
        showError("Please select all options first.");
        return;
      }
      if (currentVariation.stock < quantity) {
        showError("Not enough stock for this variation");
        return;
      }

      addItem({
        ...product,
        name: `${product.name} - ${Object.values(currentVariation.attributes).join(" / ")}`,
        image: currentVariation.image || product.image
      }, {
        quantity,
        customText,
        cloudLink,
        cloudPassword,
        variationId: currentVariation.sku,
        price: currentVariation.price
      });
    } else {
      addItem(product, { quantity, customText, cloudLink, cloudPassword });
    }
    nav("/cart");
  };

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAttributeSelect = (name, value) => {
    setSelectedAttributes(prev => ({ ...prev, [name]: value }));
  };

  // Determine display price and stock
  const displayPrice = currentVariation ? currentVariation.price : product?.price;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />

      <main className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Shop', link: '/shop' },
              ...(product?.category ? [{ label: product.category, link: `/shop?category=${product.category}` }] : []),
              { label: product?.name || 'Loading...' }
            ]}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
              <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin mb-4"></div>
              <p>Loading product details...</p>
            </div>
          ) : !product ? (
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400">We couldn't find the product you're looking for.</p>
              <Link to="/shop" className="mt-6 inline-block text-violet-600 dark:text-violet-400 font-bold hover:underline">Back to Shop</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Image Section */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl">
                {product.image ? (
                  <img src={assetUrl(product.image)} alt={product.name} className="w-full h-auto object-cover" />
                ) : (
                  <div className="aspect-square w-full flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                    <FaTshirt className="text-8xl text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{product.name}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{product.description || "No description available."}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 py-4 border-y border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < (product.averageRating || 0) ? "text-amber-400" : "text-gray-300 dark:text-gray-600"} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({reviews.length} reviews)</span>
                  </div>
                  {product.seller && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Sold by:</span>
                      <Link to={`/shop?seller=${product.seller._id}`} className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                        {product.seller.storeName || product.seller.name}
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  {product.flashSaleInfo ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold text-terracotta-500">
                          {formatRwf(product.flashSaleInfo.flashSalePrice)}
                        </span>
                        <span className="text-xl text-gray-400 line-through">
                          {formatRwf(product.price)}
                        </span>
                      </div>
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg text-sm font-bold w-fit border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        ACTIVE FLASH SALE
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                      {product.type === 'variable' && !currentVariation ? (
                        <span className="text-2xl text-gray-500">From {formatRwf(product.price)}</span>
                      ) : (
                        formatRwf(displayPrice)
                      )}
                    </div>
                  )}
                </div>

                {/* Variable Product Options */}
                {product.type === 'variable' && product.attributes && (
                  <div className="space-y-6 pt-2">
                    {product.attributes.filter(a => a.variation).map(attr => (
                      <div key={attr.name}>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{attr.name}</label>
                        <div className="flex flex-wrap gap-3">
                          {attr.values.map(val => (
                            <button
                              key={val}
                              onClick={() => handleAttributeSelect(attr.name, val)}
                              className={`px-6 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selectedAttributes[attr.name] === val
                                ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-violet-600'}`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {currentVariation && (
                      <div className="text-sm">
                        {currentVariation.stock > 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            In Stock ({currentVariation.stock})
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold">Out of Stock</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <label className="text-lg font-bold text-gray-900 dark:text-white">Quantity</label>
                  <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <button onClick={() => handleQuantityChange(-1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-300"><FaMinus /></button>
                    <input type="text" readOnly value={quantity} className="w-14 text-center bg-transparent font-bold text-gray-900 dark:text-white outline-none" />
                    <button onClick={() => handleQuantityChange(1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-300"><FaPlus /></button>
                  </div>
                </div>

                {product.customizable && (
                  <div className="bg-violet-50 dark:bg-slate-900 rounded-2xl p-6 border border-violet-100 dark:border-slate-800 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-violet-900 dark:text-violet-300">Add Your Customization</h3>
                    {product.customizationOptions?.includes("text") && (
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Enter custom text (e.g., name, message)"
                        className="w-full bg-white dark:bg-slate-800 border border-violet-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white"
                        rows="3"
                      />
                    )}
                    {product.customizationOptions?.includes("cloud") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          value={cloudLink}
                          onChange={(e) => setCloudLink(e.target.value)}
                          placeholder="Cloud link (eg. Drive)"
                          className="bg-white dark:bg-slate-800 border border-violet-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white"
                        />
                        <input
                          value={cloudPassword}
                          onChange={(e) => setCloudPassword(e.target.value)}
                          placeholder="Password (optional)"
                          className="bg-white dark:bg-slate-800 border border-violet-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-all dark:text-white"
                        />
                      </div>
                    )}
                    {!product.customizationOptions?.length && (
                      <div className="text-sm text-violet-600 dark:text-violet-400">This item supports customization. Please provide details in the notes during checkout.</div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <button
                    onClick={handleAdd}
                    disabled={product.type === 'variable' && (!currentVariation || currentVariation.stock === 0)}
                    className="flex-[2] bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]"
                  >
                    <FaShoppingCart /> {product.type === 'variable' && !currentVariation ? 'Select Options' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => toggle(product._id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl font-bold border-2 transition-all ${has(product._id)
                      ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-900/30'
                      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-red-400'}`}
                  >
                    <FaHeart className={has(product._id) ? "text-red-500" : ""} /> {has(product._id) ? 'Saved' : 'Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* RECOMMENDATIONS (FREQUENTLY BOUGHT TOGETHER) */}
          {recommendations.length > 0 && (
            <div className="mt-20">
              <div className="flex items-center gap-2 mb-8">
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                  Smart Pick
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Bought Together</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map(rec => (
                  <Link key={rec._id} to={`/product/${rec.slug || rec._id}`} className="flex bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-amber-100 dark:border-slate-800 group">
                    <div className="w-1/3 bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
                      {rec.image ? (
                        <img src={assetUrl(rec.image)} alt={rec.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <FaStar className="text-2xl" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-800 dark:text-white flex items-center gap-1">
                        <FaHeart className="text-red-500" /> {Math.round(rec.recommendationScore * 100)}% Match
                      </div>
                    </div>
                    <div className="w-2/3 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-800 dark:text-white leading-tight mb-2 line-clamp-2">{rec.name}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-violet-600 dark:text-violet-400 font-bold">{formatRwf(rec.price)}</span>
                        <span className="text-xs text-gray-400">
                          {rec.boughtTogetherCount > 5 ? `${rec.boughtTogetherCount} sold together` : 'Popular Combo'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">You may also like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <Link key={p._id} to={`/product/${p.slug || p._id}`} className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-800">
                    <div className="aspect-square overflow-hidden bg-gray-50 dark:bg-slate-950">
                      {p.image ? (
                        <img src={assetUrl(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <FaTshirt className="text-4xl" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{p.name}</h3>
                      <div className="text-violet-600 dark:text-violet-400 font-bold">{formatRwf(p.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
