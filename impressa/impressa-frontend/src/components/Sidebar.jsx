import { FaChartBar, FaUser, FaBox, FaFileAlt, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md fixed h-screen overflow-y-auto">
      <div className="p-6 font-bold text-xl text-blue-600 border-b">impressa Admin</div>
      <nav className="space-y-2 p-4">
        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <FaChartBar className="text-lg" /> 
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <FaUser className="text-lg" /> 
          <span className="font-medium">Users</span>
        </Link>
        <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <FaBox className="text-lg" /> 
          <span className="font-medium">Orders</span>
        </Link>
        <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <FaBox className="text-lg" /> 
          <span className="font-medium">Products</span>
        </Link>
        <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <FaFileAlt className="text-lg" /> 
          <span className="font-medium">Reports</span>
        </Link>
        <div className="border-t my-2"></div>
        <Link to="/logout" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
          <FaSignOutAlt className="text-lg" /> 
          <span className="font-medium">Logout</span>
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;