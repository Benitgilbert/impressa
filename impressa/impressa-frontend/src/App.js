import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUsers from "./pages/AdminUsers";
import Logout from "./pages/Logout";
import AdminOrders from "./pages/AdminOrders";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/guest" element={<div>Guest Page</div>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/admin/orders" element={<AdminOrders />} />

      </Routes>
    </Router>
  );
}

export default App;