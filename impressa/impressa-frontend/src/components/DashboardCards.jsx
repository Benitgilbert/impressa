import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { FaShoppingCart, FaBox, FaCheckCircle, FaTimesCircle, FaDollarSign, FaPalette, FaStar, FaUserPlus, FaUsers, FaClock } from "react-icons/fa";

function DashboardCards() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/dashboard/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard analytics:", err);
      }
    };

    fetchAnalytics();
  }, []);

  const cards = data
    ? [
        {
          title: "Total Orders",
          value: data.totalOrders?.toLocaleString() || "0",
          change: `${data.changes?.ordersChange || "0"}`,
          icon: FaShoppingCart,
          iconColor: "text-blue-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
          borderColor: "border-blue-200"
        },
        {
          title: "Total Items Ordered",
          value: data.totalItems?.toLocaleString() || "0",
          change: data.changes?.itemsChange || "0%",
          icon: FaBox,
          iconColor: "text-indigo-600",
          bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
          borderColor: "border-indigo-200"
        },
        {
          title: "Delivered Orders",
          value: data.deliveredOrders?.toLocaleString() || "0",
          change: `${data.changes?.deliveredChange || "0"}`,
          icon: FaCheckCircle,
          iconColor: "text-green-600",
          bgColor: "bg-gradient-to-br from-green-50 to-green-100",
          borderColor: "border-green-200"
        },
        {
          title: "Cancelled Orders",
          value: data.cancelledOrders?.toLocaleString() || "0",
          change: `${data.changes?.cancelledChange || "0"}`,
          icon: FaTimesCircle,
          iconColor: "text-red-600",
          bgColor: "bg-gradient-to-br from-red-50 to-red-100",
          borderColor: "border-red-200"
        },
        {
          title: "Revenue This Month",
          value: `${data.revenueThisMonth?.toLocaleString() || "0"} RWF`,
          change: `${data.changes?.revenueChange || "0"}`,
          icon: FaDollarSign,
          iconColor: "text-yellow-600",
          bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100",
          borderColor: "border-yellow-200"
        },
        {
          title: "Custom Orders",
          value: data.customOrders?.toLocaleString() || "0",
          change: `${data.changes?.customChange || "0"}`,
          icon: FaPalette,
          iconColor: "text-purple-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
          borderColor: "border-purple-200"
        },
        {
          title: "Top Product",
          value: data.topProductName || "N/A",
          change: data.topProductChange || "",
          icon: FaStar,
          iconColor: "text-amber-600",
          bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
          borderColor: "border-amber-200"
        },
        {
          title: "New Customers",
          value: data.newCustomersThisMonth?.toLocaleString() || "0",
          change: `${data.changes?.usersChange || "0"}`,
          icon: FaUserPlus,
          iconColor: "text-pink-600",
          bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
          borderColor: "border-pink-200"
        },
        {
          title: "Active Users",
          value: data.activeUsers?.toLocaleString() || "0",
          change: `${data.changes?.activeChange || "0"}`,
          icon: FaUsers,
          iconColor: "text-teal-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
          borderColor: "border-teal-200"
        },
        {
          title: "Pending Orders",
          value: data.pendingOrders?.toLocaleString() || "0",
          change: `${data.changes?.pendingChange || "0"}`,
          icon: FaClock,
          iconColor: "text-orange-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
          borderColor: "border-orange-200"
        }
      ]
    : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className={`${card.bgColor} ${card.borderColor} border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-4 transform hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.iconColor} bg-white p-2 rounded-md shadow-sm`}>
                <Icon className="text-lg" />
              </div>
              {card.change && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    card.change.startsWith("-") 
                      ? "bg-red-100 text-red-700" 
                      : card.change === "New" 
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {card.change.startsWith("-") ? "" : card.change === "New" ? "" : "↑ "}
                  {card.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">{card.title}</p>
              <h3 className="text-xl font-bold text-gray-800">{card.value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardCards;