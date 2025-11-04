import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCards from "../components/DashboardCards";
import RevenueChart from "../components/RevenueChart";
import WeeklyProfitChart from "../components/WeeklyProfitChart";
import RecentOrderTable from "../components/RecentOrderTable";
import CustomizationDemandTable from "../components/CustomizationDemandTable";
import TopOrderedProductsTable from "../components/TopOrderedProductsTable";
import AdminChatbot from "../components/AdminChatBot";



function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="p-8 space-y-8 overflow-y-auto bg-gray-50">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600 text-lg">Monitor your business performance in real-time</p>
          </div>

          {/* Metrics Cards */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              Key Metrics
            </h2>
            <DashboardCards />
          </section>

          {/* Charts Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              Performance Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              <WeeklyProfitChart />
            </div>
          </section>

          {/* AI Chatbot Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              AI Assistant
            </h2>
            <AdminChatbot />
          </section>

          {/* Tables Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              Recent Activity
            </h2>
            <div className="space-y-6">
              {/* Recent Orders - Full Width */}
              <RecentOrderTable />
              
              {/* Bottom Row - Two Tables Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopOrderedProductsTable />
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