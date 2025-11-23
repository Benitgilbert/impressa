import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatRwf } from "../utils/currency";
import { FaShoppingCart, FaTrashAlt, FaArrowRight, FaHeart, FaSearch } from "react-icons/fa";
import LandingFooter from "../components/LandingFooter";

export default function CartPage() {
  const { items, updateQty, removeItem, totals, setFile } = useCart();
  const nav = useNavigate();

  return (
    <div className="font-roboto bg-gray-50">
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
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
              </Link>
              <Link to="/checkout" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Custom Printing Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="code-section relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-light-background-color to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1
            className="text-4xl font-bold text-gray-900 mb-8" 
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            <FaShoppingCart className="inline mr-3 text-blue-800" />
            Your Shopping Cart
        </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto">
              Review your items, make any changes, and proceed to checkout.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <div className="bg-white p-10 rounded-xl shadow-lg text-center">
                <div className="mb-4 text-gray-600 text-lg">Your cart is empty. Time to find some amazing products!</div>
                <Link 
                to="/shop" 
                className="inline-flex items-center bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
            >
                Continue Shopping <FaArrowRight className="ml-2" />
            </Link>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="p-4 text-left font-bold text-gray-700 uppercase tracking-wider">Product</th>
                        <th className="p-4 font-bold text-gray-700 hidden sm:table-cell uppercase tracking-wider">Price</th>
                        <th className="p-4 font-bold text-gray-700 uppercase tracking-wider">Qty</th>
                        <th className="p-4 font-bold text-gray-700 uppercase tracking-wider">Subtotal</th>
                        <th className="p-4 font-bold text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors duration-150 align-top">
                          <td className="p-4">
                            <div className="font-bold text-base text-gray-900 mb-1">{it.product.name}</div>
                            {it.customText && <div className="text-xs text-gray-600">Text: <strong>{it.customText}</strong></div>}
                            {it.cloudLink && <div className="text-xs text-gray-600 truncate">Cloud: <strong>{it.cloudLink}</strong></div>}
                            <div className="mt-3">
                              <label className="text-xs text-gray-600 font-medium block mb-1">Customization file (image/PDF)</label>
                              <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={(e)=>setFile(idx, e.target.files?.[0] || null)} 
                                className="block text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                            />
                            </div>
                          </td>
                          <td className="p-4 text-center font-medium text-gray-800 hidden sm:table-cell">
                        {formatRwf(it.product.price)}
                    </td>
                          <td className="p-4 text-center">
                            <input 
                            type="number" 
                            min={1} 
                            value={it.quantity} 
                            onChange={(e)=>updateQty(idx, parseInt(e.target.value||"1"))} 
                            className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        />
                          </td>
                          <td className="p-4 text-center font-bold text-blue-800">
                        {formatRwf((it.product.price||0)*it.quantity)}
                    </td>
                          <td className="p-4 text-center">
                            <button 
                            onClick={()=>removeItem(idx)} 
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                        >
                            <FaTrashAlt />
                        </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:col-span-1 bg-white rounded-xl shadow-xl p-6 h-max border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600 font-medium">Items Count</div>
                      <div className="font-semibold text-gray-800">{totals.itemCount}</div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xl font-bold text-gray-800">Order Total</div>
                      <div className="text-2xl font-bold text-blue-800">{formatRwf(totals.subtotal)}</div>
                    </div>
                  </div>
                  <button 
                    onClick={()=>nav("/checkout")} 
                    className="w-full mt-6 flex items-center justify-center bg-blue-800 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
                >
                    Proceed to Checkout <FaArrowRight className="ml-2" />
                </button>
                <Link to="/shop" className="block text-center mt-4 text-blue-700 hover:text-blue-900 transition-colors font-medium text-sm">
                    Continue Shopping
                </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}