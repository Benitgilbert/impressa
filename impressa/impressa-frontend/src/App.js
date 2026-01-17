import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import SellerDashboard from "./pages/SellerDashboard"; // Import SellerDashboard
import UserDashboard from "./pages/UserDashboard";
import AuthSuccess from "./pages/AuthSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUsers from "./pages/AdminUsers";
import Logout from "./pages/Logout";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminGiftCards from "./pages/admin/AdminGiftCards";
import AdminGiftCardProducts from "./pages/admin/AdminGiftCardProducts";
import AdminProducts from "./pages/AdminProducts";
import AdminCoupons from "./pages/AdminCoupons";
import AdminDelivery from "./pages/AdminShipping"; // Renamed from AdminShipping
import AdminTax from "./pages/AdminTax";
import AdminReports from "./pages/AdminReports";
import AdminAttributes from "./pages/AdminAttributes";
import AdminSettings from "./pages/AdminSettings";
import AdminCategories from "./pages/AdminCategories";
import FinanceDashboard from "./pages/admin/FinanceDashboard";
import POS from "./pages/admin/POS";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import Home from "./pages/Home";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import FAQ from "./pages/FAQ";
import OrderHistory from "./pages/OrderHistory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DailyDeals from "./pages/DailyDeals";
import AdminFlashSales from "./pages/AdminFlashSales";
import AdminBanners from "./pages/AdminBanners";
import AdminTestimonials from "./pages/AdminTestimonials";
import AdminBrandPartners from "./pages/AdminBrandPartners";
import AdminSiteSettings from "./pages/AdminSiteSettings";
import AdminSubscribers from "./pages/AdminSubscribers";
import AdminSellers from "./pages/AdminSellers";
import AdminCommissions from "./pages/AdminCommissions";
import AdminPayouts from "./pages/AdminPayouts";
import AdminProductApproval from "./pages/AdminProductApproval";
import AdminReviews from "./pages/AdminReviews";
import AdminTickets from "./pages/AdminTickets";
import AdminSellerVerification from "./pages/AdminSellerVerification";
import AdminViolations from "./pages/AdminViolations";
import AdminSellerReports from "./pages/AdminSellerReports";
import SellerRegistration from "./pages/SellerRegistration";
import SellerPOS from "./pages/SellerPOS";
import SellerProducts from "./pages/SellerProducts";
// SellerAddProduct removed

import AdminCustomerQueries from "./pages/AdminCustomerQueries";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import SellerOrders from "./pages/SellerOrders";
import SellerPayouts from "./pages/SellerPayouts";
import SellerProfile from "./pages/SellerProfile";
import SellerOrderDetails from "./pages/SellerOrderDetails";
import AdminNotifications from "./pages/AdminNotifications";
import SellerNotifications from "./pages/SellerNotifications";
import OrderSuccess from "./pages/OrderSuccess";
import GiftCards from "./pages/GiftCards";
import Unsubscribe from "./pages/Unsubscribe";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallApp from "./components/InstallApp";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
                <InstallApp />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/track" element={<TrackOrder />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/orders" element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <OrderHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/daily-deals" element={<DailyDeals />} />
                  <Route path="/gift-cards" element={<GiftCards />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/success" element={<AuthSuccess />} />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/guest" element={<div>Guest Page</div>} />

                  {/* Seller Routes */}
                  <Route path="/seller/dashboard" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/pos" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerPOS />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/products" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerProducts />
                    </ProtectedRoute>
                  } />
                  {/* SellerAddProduct route removed */}

                  <Route path="/seller/orders" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/orders/:id" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerOrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/payouts" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerPayouts />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/profile" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/become-seller" element={<SellerRegistration />} />

                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/admin/orders" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/orders/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminOrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/gift-cards" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminGiftCards />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/gift-card-products" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminGiftCardProducts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/products" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminProducts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/coupons" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCoupons />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/delivery" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDelivery />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/taxes" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminTax />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/attributes" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAttributes />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/categories" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCategories />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/flash-sales" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminFlashSales />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/banners" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBanners />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/testimonials" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminTestimonials />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/brand-partners" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBrandPartners />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/site-settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSiteSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/subscribers" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSubscribers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/sellers" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSellers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/commissions" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCommissions />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/payouts" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPayouts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/product-approval" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminProductApproval />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reviews" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminReviews />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/tickets" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminTickets />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/customer-queries" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCustomerQueries />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/seller-verification" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSellerVerification />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/blogs" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBlogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/blogs/new" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBlogEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/blogs/edit/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBlogEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/violations" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminViolations />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/seller-reports" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSellerReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/finance" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <FinanceDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/pos" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <POS />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/notifications" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminNotifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/notifications" element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerNotifications />
                    </ProtectedRoute>
                  } />

                </Routes>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
