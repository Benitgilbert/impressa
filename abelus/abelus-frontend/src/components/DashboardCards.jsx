import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { FaShoppingCart, FaBox, FaCheckCircle, FaTimesCircle, FaDollarSign, FaPalette, FaStar, FaUserPlus, FaUsers, FaClock, FaBuilding, FaArrowUp, FaArrowDown } from "react-icons/fa";

function DashboardCards({ refreshKey, setRefreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError(false);
        const res = await api.get("/dashboard/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard analytics:", err);
        setError(true);
      }
    };

    fetchAnalytics();
  }, [refreshKey]);

  const cards = data
    ? [
      {
        title: "Total Orders",
        value: data.totalOrders?.toLocaleString() || "0",
        change: `${data.changes?.ordersChange || "0"}`,
        icon: FaShoppingCart,
        iconBg: "bg-blue-100 dark:bg-blue-900/20",
        iconColor: "text-blue-500",
      },
      {
        title: "Items Sold",
        value: data.totalItems?.toLocaleString() || "0",
        change: data.changes?.itemsChange || "0%",
        icon: FaBox,
        iconBg: "bg-indigo-100 dark:bg-indigo-900/20",
        iconColor: "text-indigo-500",
      },
      {
        title: "Unique Products",
        value: data.totalProducts?.toLocaleString() || "0",
        change: "Listings",
        icon: FaBox,
        iconBg: "bg-cyan-100 dark:bg-cyan-900/20",
        iconColor: "text-cyan-500",
      },
      {
        title: "Total Inventory",
        value: data.totalInventory?.toLocaleString() || "0",
        change: "Stock",
        icon: FaBuilding,
        iconBg: "bg-teal-100 dark:bg-teal-900/20",
        iconColor: "text-teal-500",
      },
      {
        title: "Delivered",
        value: data.deliveredOrders?.toLocaleString() || "0",
        change: `${data.changes?.deliveredChange || "0"}`,
        icon: FaCheckCircle,
        iconBg: "bg-sage-100 dark:bg-sage-900/20",
        iconColor: "text-sage-500",
      },
      {
        title: "Cancelled",
        value: data.cancelledOrders?.toLocaleString() || "0",
        change: `${data.changes?.cancelledChange || "0"}`,
        icon: FaTimesCircle,
        iconBg: "bg-red-100 dark:bg-red-900/20",
        iconColor: "text-red-500",
      },
      {
        title: "Revenue (Month)",
        value: `${data.revenueThisMonth?.toLocaleString() || "0"} RWF`,
        change: `${data.changes?.revenueChange || "0"}`,
        icon: FaDollarSign,
        iconBg: "bg-terracotta-100 dark:bg-terracotta-900/20",
        iconColor: "text-terracotta-500",
      },
      {
        title: "Custom Orders",
        value: data.customOrders?.toLocaleString() || "0",
        change: `${data.changes?.customChange || "0"}`,
        icon: FaPalette,
        iconBg: "bg-purple-100 dark:bg-purple-900/20",
        iconColor: "text-purple-500",
      },
      {
        title: "Top Product",
        value: data.topProductName || "N/A",
        change: data.topProductChange || "",
        icon: FaStar,
        iconBg: "bg-sand-100 dark:bg-sand-900/20",
        iconColor: "text-sand-500",
      },
      {
        title: "New Customers",
        value: data.newCustomersThisMonth?.toLocaleString() || "0",
        change: `${data.changes?.usersChange || "0"}`,
        icon: FaUserPlus,
        iconBg: "bg-pink-100 dark:bg-pink-900/20",
        iconColor: "text-pink-500",
      },
      {
        title: "Active Users",
        value: data.activeUsers?.toLocaleString() || "0",
        change: `${data.changes?.activeChange || "0"}`,
        icon: FaUsers,
        iconBg: "bg-cyan-100 dark:bg-cyan-900/20",
        iconColor: "text-cyan-500",
      },
      {
        title: "Pending",
        value: data.pendingOrders?.toLocaleString() || "0",
        change: `${data.changes?.pendingChange || "0"}`,
        icon: FaClock,
        iconBg: "bg-orange-100 dark:bg-orange-900/20",
        iconColor: "text-orange-500",
      }
    ]
    : [];

  const getBadgeStyles = (change) => {
    if (!change) return { bg: "", text: "", arrow: null };
    if (change.startsWith("-")) return {
      bg: "bg-red-100 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
      arrow: FaArrowDown
    };
    if (change === "New" || change === "Stock" || change === "Listings") return {
      bg: "bg-blue-100 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      arrow: null
    };
    return {
      bg: "bg-sage-100 dark:bg-sage-900/20",
      text: "text-sage-600 dark:text-sage-400",
      arrow: FaArrowUp
    };
  };

  const getChangeText = (change) => {
    if (!change) return "";
    if (change.startsWith("-") || change === "New" || change === "Stock" || change === "Listings") return change;
    return `+${change}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load dashboard analytics.</p>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="mt-4 text-sm font-bold text-red-700 dark:text-red-300 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-charcoal-800 rounded-2xl p-5 border border-cream-200 dark:border-charcoal-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cream-200 dark:bg-charcoal-700 rounded-xl"></div>
              <div className="w-16 h-6 bg-cream-200 dark:bg-charcoal-700 rounded-full"></div>
            </div>
            <div className="w-24 h-4 bg-cream-200 dark:bg-charcoal-700 rounded mb-2"></div>
            <div className="w-32 h-8 bg-cream-200 dark:bg-charcoal-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const badgeStyles = getBadgeStyles(card.change);
        const ArrowIcon = badgeStyles.arrow;

        return (
          <div
            key={idx}
            className="group bg-white dark:bg-charcoal-800 rounded-2xl p-5 border border-cream-200 dark:border-charcoal-700 hover:shadow-lg hover:border-terracotta-200 dark:hover:border-terracotta-900/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`text-xl ${card.iconColor}`} />
              </div>
              {card.change && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${badgeStyles.bg} ${badgeStyles.text} rounded-full text-xs font-semibold`}>
                  {ArrowIcon && <ArrowIcon className="text-[10px]" />}
                  {getChangeText(card.change)}
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <h3 className="text-xl font-bold text-charcoal-800 dark:text-white truncate">
              {card.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardCards;
