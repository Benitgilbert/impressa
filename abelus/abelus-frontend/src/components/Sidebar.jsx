import { FaChartBar, FaUser, FaBox, FaFileAlt, FaSignOutAlt, FaTags, FaTicketAlt, FaTruck, FaPercentage, FaCog, FaMoneyBillWave, FaFolder, FaFire, FaDesktop, FaQuoteLeft, FaHandshake, FaGlobe, FaEnvelope, FaStore, FaPercent, FaDollarSign, FaClipboardCheck, FaStar, FaHeadset, FaExclamationTriangle, FaChartLine, FaTimes, FaGift, FaRobot, FaNewspaper, FaUserFriends, FaClock, FaQuestionCircle, FaUniversity, FaHistory } from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { useRef, useLayoutEffect } from "react";
import AdminChatbot from "./AdminChatBot";
import { useAuth } from "../context/AuthContext";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const sidebarRef = useRef(null);
  const { user } = useAuth();
  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'cashier' || role === 'inventory';

  // Restore scroll position immediately after DOM updates
  useLayoutEffect(() => {
    const savedPos = sessionStorage.getItem('sidebarScrollPos');
    if (sidebarRef.current && savedPos) {
      requestAnimationFrame(() => {
        if (sidebarRef.current) {
          sidebarRef.current.scrollTop = parseInt(savedPos, 10);
        }
      });
    }
  }, [location.pathname]);

  // Save scroll position before navigation
  const handleLinkClick = () => {
    if (sidebarRef.current) {
      sessionStorage.setItem('sidebarScrollPos', sidebarRef.current.scrollTop.toString());
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, iconColor, children }) => (
    <Link
      to={to}
      onClick={handleLinkClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
        transition-all duration-200 group
        ${isActive(to)
          ? 'bg-terracotta-500/20 text-white font-semibold shadow-inner'
          : 'text-charcoal-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
        }
      `}
    >
      <Icon className={`text-base flex-shrink-0 ${isActive(to) ? 'text-terracotta-400' : iconColor || 'text-charcoal-400'}`} />
      <span>{children}</span>
    </Link>
  );

  const NavSection = ({ label, children }) => (
    <div className="px-3 pt-6 pb-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-500 mb-3 px-4">
        {label}
      </p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-screen w-64 z-50
          bg-gradient-to-b from-charcoal-800 to-charcoal-900
          border-r border-charcoal-700/50
          flex flex-col
          overflow-y-auto overflow-x-hidden
          scrollbar-thin scrollbar-thumb-charcoal-600 scrollbar-track-transparent
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-charcoal-700/50 bg-charcoal-800/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-terracotta-400 to-sand-400 bg-clip-text text-transparent">
                ABELUS
              </h1>
              <p className="text-[10px] text-charcoal-400 uppercase tracking-[0.2em] mt-0.5">
                Admin Portal
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-700 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pb-4">
          <NavSection label="Overview">
            <NavLink to="/admin" icon={FaChartBar} iconColor="text-terracotta-400">
              Dashboard
            </NavLink>
          </NavSection>

          <NavSection label="Management">
            {isAdmin && <NavLink to="/admin/users" icon={FaUser}>Users</NavLink>}
            {isAdmin && <NavLink to="/admin/sellers" icon={FaStore} iconColor="text-amber-400">Sellers</NavLink>}
            {isAdmin && <NavLink to="/admin/violations" icon={FaExclamationTriangle} iconColor="text-red-400">Violations</NavLink>}
            {isAdmin && <NavLink to="/admin/seller-reports" icon={FaChartLine} iconColor="text-indigo-400">Seller Reports</NavLink>}
            {isStaff && <NavLink to="/admin/orders" icon={FaBox} iconColor="text-blue-400">Orders</NavLink>}
            {isAdmin && <NavLink to="/admin/orders?status=quote_requested" icon={FaQuestionCircle} iconColor="text-teal-400">Inquiries</NavLink>}
            {isStaff && <NavLink to="/admin/products" icon={FaBox} iconColor="text-sage-400">Products</NavLink>}
            {isAdmin && <NavLink to="/admin/product-approval" icon={FaClipboardCheck} iconColor="text-orange-400">Product Approval</NavLink>}
            {isAdmin && <NavLink to="/admin/shifts" icon={FaHistory} iconColor="text-terracotta-400">Shifts</NavLink>}
            {isAdmin && <NavLink to="/admin/categories" icon={FaFolder} iconColor="text-sand-400">Categories</NavLink>}
            {isAdmin && <NavLink to="/admin/attributes" icon={FaTags} iconColor="text-purple-400">Attributes</NavLink>}
            {isAdmin && <NavLink to="/admin/reviews" icon={FaStar} iconColor="text-yellow-400">Reviews</NavLink>}
            {isAdmin && <NavLink to="/admin/tickets" icon={FaHeadset} iconColor="text-indigo-400">Support Tickets</NavLink>}
            {isAdmin && <NavLink to="/admin/customer-queries" icon={FaRobot} iconColor="text-teal-400">AI Customer Queries</NavLink>}
            {isAdmin && <NavLink to="/admin/abonnes" icon={FaUserFriends} iconColor="text-emerald-400">Abonnés</NavLink>}
          </NavSection>


          <NavSection label="Marketing">
            <NavLink to="/admin/coupons" icon={FaTicketAlt} iconColor="text-pink-400">Coupons</NavLink>
            <NavLink to="/admin/gift-cards" icon={FaGift} iconColor="text-orange-400">Gift Cards</NavLink>
            <NavLink to="/admin/gift-card-products" icon={FaGift} iconColor="text-emerald-400">Gift Card Products</NavLink>
            <NavLink to="/admin/flash-sales" icon={FaFire} iconColor="text-red-500">Flash Sales</NavLink>
            <NavLink to="/admin/banners" icon={FaDesktop} iconColor="text-violet-400">Banners</NavLink>
            <NavLink to="/admin/testimonials" icon={FaQuoteLeft} iconColor="text-cyan-400">Testimonials</NavLink>
            <NavLink to="/admin/blogs" icon={FaNewspaper} iconColor="text-terracotta-400">Blogs</NavLink>
            <NavLink to="/admin/brand-partners" icon={FaHandshake} iconColor="text-amber-400">Brand Partners</NavLink>
          </NavSection>

          <NavSection label="Finance">
            {isAdmin && <NavLink to="/admin/finance" icon={FaMoneyBillWave} iconColor="text-sage-400">Finance</NavLink>}
            {isAdmin && <NavLink to="/admin/commissions" icon={FaPercent} iconColor="text-emerald-400">Commissions</NavLink>}
            {isAdmin && <NavLink to="/admin/payouts" icon={FaDollarSign} iconColor="text-violet-400">Payouts</NavLink>}
          </NavSection>

          <NavSection label="Configuration">
            <NavLink to="/admin/site-settings" icon={FaGlobe} iconColor="text-sage-400">Site Settings</NavLink>
            <NavLink to="/admin/subscribers" icon={FaEnvelope} iconColor="text-pink-400">Subscribers</NavLink>
            <NavLink to="/admin/delivery" icon={FaTruck} iconColor="text-blue-400">Delivery</NavLink>
            <NavLink to="/admin/taxes" icon={FaPercentage} iconColor="text-orange-400">Taxes</NavLink>
            <NavLink to="/admin/reports" icon={FaFileAlt} iconColor="text-charcoal-400">Reports</NavLink>
            <NavLink to="/admin/settings" icon={FaCog} iconColor="text-charcoal-400">Settings</NavLink>
          </NavSection>
        </nav>

        {/* Logout */}
        <div className="sticky bottom-0 p-4 border-t border-charcoal-700/50 bg-charcoal-800/95 backdrop-blur-sm">
          <Link
            to="/logout"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <FaSignOutAlt className="text-base" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      <AdminChatbot />
    </>
  );
}

export default Sidebar;
