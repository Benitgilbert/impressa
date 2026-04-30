import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCards from "../components/DashboardCards";
import RevenueChart from "../components/RevenueChart";
import WeeklyProfitChart from "../components/WeeklyProfitChart";
import RecentOrderTable from "../components/RecentOrderTable";
import CustomizationDemandTable from "../components/CustomizationDemandTable";
import TopOrderedProductsTable from "../components/TopOrderedProductsTable";
import TopSellersWidget from "../components/TopSellersWidget";
import LowStockWidget from "../components/LowStockWidget";
import PendingApprovalsWidget from "../components/PendingApprovalsWidget";
import OrderStatusChart from "../components/OrderStatusChart";

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Poll every 15 seconds
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Dashboard Overview" />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">

          {/* Metrics Cards */}
          <section className="mb-8">
            <DashboardCards refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
          </section>

          {/* Performance Analytics */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">
              Performance Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <RevenueChart />
              </div>
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <WeeklyProfitChart />
              </div>
            </div>
          </section>

          {/* Marketplace Insights */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">
              Marketplace Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <TopSellersWidget />
              </div>
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <PendingApprovalsWidget />
              </div>
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
                <OrderStatusChart />
              </div>
            </div>
          </section>

          {/* Inventory & Orders */}
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <LowStockWidget />
              </div>
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <RecentOrderTable refreshKey={refreshKey} />
              </div>
            </div>
          </section>

          {/* Products Analysis */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <TopOrderedProductsTable />
              </div>
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-cream-200 dark:border-charcoal-700 hover:shadow-lg transition-shadow">
                <CustomizationDemandTable />
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
