import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProductTable from "../components/ProductTable";

function AdminProducts() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="p-6 overflow-auto">
          <div className="mb-3">
            <h2 className="text-2xl font-semibold text-gray-800">Manage Products</h2>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and organize your catalog.</p>
          </div>
          <ProductTable />
        </main>
      </div>
    </div>
  );
}

export default AdminProducts;


