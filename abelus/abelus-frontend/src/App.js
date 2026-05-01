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
import SellerReports from "./pages/SellerReports";
import SellerTeam from "./pages/SellerTeam";
import PrintPortal from "./pages/PrintPortal";
// SellerAddProduct removed

import AdminCustomerQueries from "./pages/AdminCustomerQueries";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import SellerOrders from "./pages/SellerOrders";
import SellerPrintOrders from "./pages/SellerPrintOrders";
import SellerPayouts from "./pages/SellerPayouts";
import SellerProfile from "./pages/SellerProfile";
import SellerOrderDetails from "./pages/SellerOrderDetails";
import AdminNotifications from "./pages/AdminNotifications";
import SellerNotifications from "./pages/SellerNotifications";
import OrderSuccess from "./pages/OrderSuccess";
import GiftCards from "./pages/GiftCards";
import Unsubscribe from "./pages/Unsubscribe";
import SellerAbonne from "./pages/SellerAbonne";
import AdminAbonne from "./pages/admin/AdminAbonne";
import SellerShifts from "./pages/SellerShifts";
import AdminShifts from "./pages/admin/AdminShifts";


import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallApp from "./components/InstallApp";
import AdminLayout from "./components/AdminLayout";
import SellerLayout from "./components/SellerLayout";

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
                  <Route path="/print-portal" element={<PrintPortal />} />
                  <Route path="/orders" element={
                    <ProtectedRoute allowedRoles={['customer', 'seller', 'admin', 'cashier']}>
                      <OrderHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/daily-deals" element={<DailyDeals />} />
                  <Route path="/gift-cards" element={<GiftCards />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/success" element={<AuthSuccess />} />
                  {/* Admin Routes with Shared Layout */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
                    <Route path="/admin/gift-cards" element={<AdminGiftCards />} />
                    <Route path="/admin/gift-card-products" element={<AdminGiftCardProducts />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    <Route path="/admin/delivery" element={<AdminDelivery />} />
                    <Route path="/admin/taxes" element={<AdminTax />} />
                    <Route path="/admin/attributes" element={<AdminAttributes />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/flash-sales" element={<AdminFlashSales />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/testimonials" element={<AdminTestimonials />} />
                    <Route path="/admin/brand-partners" element={<AdminBrandPartners />} />
                    <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
                    <Route path="/admin/subscribers" element={<AdminSubscribers />} />
                    <Route path="/admin/sellers" element={<AdminSellers />} />
                    <Route path="/admin/commissions" element={<AdminCommissions />} />
                    <Route path="/admin/payouts" element={<AdminPayouts />} />
                    <Route path="/admin/product-approval" element={<AdminProductApproval />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route path="/admin/tickets" element={<AdminTickets />} />
                    <Route path="/admin/customer-queries" element={<AdminCustomerQueries />} />
                    <Route path="/admin/seller-verification" element={<AdminSellerVerification />} />
                    <Route path="/admin/blogs" element={<AdminBlogs />} />
                    <Route path="/admin/blogs/new" element={<AdminBlogEditor />} />
                    <Route path="/admin/blogs/edit/:id" element={<AdminBlogEditor />} />
                    <Route path="/admin/violations" element={<AdminViolations />} />
                    <Route path="/admin/seller-reports" element={<AdminSellerReports />} />
                    <Route path="/admin/finance" element={<FinanceDashboard />} />
                    <Route path="/admin/pos" element={<POS />} />
                    <Route path="/admin/notifications" element={<AdminNotifications />} />
                    <Route path="/admin/abonnes" element={<AdminAbonne />} />
                    <Route path="/admin/shifts" element={<AdminShifts />} />
                  </Route>

                  {/* Seller Routes with Shared Layout */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['seller', 'admin', 'cashier']}>
                      <SellerLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/seller/pos" element={<SellerPOS />} />
                    <Route path="/seller/products" element={<SellerProducts />} />
                    <Route path="/seller/orders" element={<SellerOrders />} />
                    <Route path="/seller/print-orders" element={<SellerPrintOrders />} />
                    <Route path="/seller/orders/:id" element={<SellerOrderDetails />} />
                    <Route path="/seller/payouts" element={<SellerPayouts />} />
                    <Route path="/seller/profile" element={<SellerProfile />} />
                    <Route path="/seller/abonnes" element={<SellerAbonne />} />
                    <Route path="/seller/reports" element={<SellerReports />} />
                    <Route path="/seller/team" element={<SellerTeam />} />
                    <Route path="/seller/notifications" element={<SellerNotifications />} />
                    <Route path="/seller/shifts" element={<SellerShifts />} />
                  </Route>

                  <Route path="/become-seller" element={<SellerRegistration />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/logout" element={<Logout />} />

                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['customer', 'seller', 'admin', 'cashier']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/guest" element={<div>Guest Page</div>} />


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
