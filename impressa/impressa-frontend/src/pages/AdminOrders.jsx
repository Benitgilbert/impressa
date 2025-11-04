import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import OrderTable from "../components/OrderTable";

function AdminOrders() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">
          <OrderTable />
        </main>
      </div>
    </div>
  );
}

export default AdminOrders;