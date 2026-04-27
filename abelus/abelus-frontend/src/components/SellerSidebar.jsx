import { FaChartBar, FaBox, FaSignOutAlt, FaStore, FaList, FaShoppingCart, FaPlus, FaMoneyBillWave, FaTimes, FaUserFriends } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

function SellerSidebar({ isOpen, onClose }) {
    const location = useLocation();

    const getLinkClass = (path) => {
        const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group";
        const activeClass = "bg-indigo-600/20 text-indigo-400 font-semibold border-l-4 border-indigo-500 rounded-l-none";
        const inactiveClass = "text-gray-400 hover:text-white hover:bg-white/5";

        return `${baseClass} ${location.pathname === path ? activeClass : inactiveClass}`;
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside className={`
                fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0 
                bg-[#0f172a] text-white flex flex-col border-r border-white/5 
                overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800
                transition-transform duration-300 ease-in-out lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                            ABELUS
                        </h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">Seller Portal</p>
                    </div>
                    {/* Close Button for Mobile */}
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 px-3 space-y-6">
                    <div className="space-y-1">
                        <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Overview</div>
                        <Link to="/seller/dashboard" className={getLinkClass('/seller/dashboard')} onClick={onClose}>
                            <FaChartBar className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/seller/profile" className={getLinkClass('/seller/profile')} onClick={onClose}>
                            <FaStore className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>My Store</span>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Actions</div>
                        <Link to="/seller/pos" className={getLinkClass('/seller/pos')} onClick={onClose}>
                            <FaShoppingCart className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>Open POS</span>
                        </Link>
                        <Link to="/seller/products" className={getLinkClass('/seller/products')} onClick={onClose}>
                            <FaPlus className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>Add Product</span>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Management</div>
                        <Link to="/seller/products" className={getLinkClass('/seller/products')} onClick={onClose}>
                            <FaBox className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>My Products</span>
                        </Link>
                        <Link to="/seller/orders" className={getLinkClass('/seller/orders')} onClick={onClose}>
                            <FaList className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>My Orders</span>
                        </Link>
                        <Link to="/seller/abonnes" className={getLinkClass('/seller/abonnes')} onClick={onClose}>
                            <FaUserFriends className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>Client Abonnés</span>
                        </Link>
                        <Link to="/seller/payouts" className={getLinkClass('/seller/payouts')} onClick={onClose}>
                            <FaMoneyBillWave className="text-lg opacity-70 group-hover:opacity-100" />
                            <span>Payouts</span>
                        </Link>
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-white/5">
                    <Link to="/logout" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
                        <FaSignOutAlt className="text-lg" />
                        <span className="font-medium">Logout</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

export default SellerSidebar;
