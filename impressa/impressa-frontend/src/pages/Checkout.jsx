import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatRwf } from "../utils/currency";
import { FaShoppingCart, FaCreditCard, FaMoneyBillWave, FaLock, FaHeart, FaSearch } from "react-icons/fa";
import LandingFooter from "../components/LandingFooter";

export default function CheckoutPage() {
  const { items, totals } = useCart();
  const nav = useNavigate();

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    // Here you would typically handle form validation, payment processing, and order creation.
    // For now, we'll just navigate to a success page (which you can create).
    alert("Order placed successfully! (This is a placeholder)");
    // nav("/order-success");
  };

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
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <FaLock className="inline mr-3 text-green-500" />
              Secure Checkout
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto">
              Almost there! Please provide your details to complete the order.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-12">
              {/* Billing Details */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Billing & Shipping</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" id="firstName" name="firstName" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" id="lastName" name="lastName" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" name="email" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="phone" name="phone" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input type="text" id="address" name="address" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" id="city" name="city" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" id="country" name="country" value="Rwanda" readOnly className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100" />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-xl p-6 sticky top-36">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Your Order</h2>
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900">{formatRwf(item.quantity * (item.product.price || 0))}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Subtotal</p>
                      <p className="font-semibold text-gray-800">{formatRwf(totals.subtotal)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Shipping</p>
                      <p className="font-semibold text-gray-800">{formatRwf(5000)}</p>
                    </div>
                    <div className="flex items-center justify-between text-xl font-bold pt-4 border-t">
                      <p className="text-gray-900">Total</p>
                      <p className="text-blue-800">{formatRwf(totals.subtotal + 5000)}</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition-all">
                        <input id="payment-cc" name="payment-method" type="radio" defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <label htmlFor="payment-cc" className="ml-3 flex-grow flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">Credit Card</span>
                          <FaCreditCard className="text-gray-400 text-xl" />
                        </label>
                      </div>
                      <div className="flex items-center p-4 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked:border-blue-500] transition-all">
                        <input id="payment-momo" name="payment-method" type="radio" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <label htmlFor="payment-momo" className="ml-3 flex-grow flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-800">Mobile Money</span>
                          <FaMoneyBillWave className="text-gray-400 text-xl" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button 
                      type="submit"
                      className="w-full flex items-center justify-center bg-green-600 text-white rounded-lg py-4 font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaLock className="mr-2" />
                      Place Order
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By placing your order, you agree to our <Link to="/terms" className="underline hover:text-blue-700">terms and conditions</Link>.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}