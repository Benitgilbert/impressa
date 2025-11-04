import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import EditUserModal from "./EditUserModal"; // ✅ Make sure this component exists

function UserTable() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filteredUsers = users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      return matchesSearch && matchesRole;
    });
    setFiltered(filteredUsers);
  }, [search, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get("/auth/users", {
  headers: { Authorization: `Bearer ${token}` }
});
      setUsers(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setMessage("❌ Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = (updatedUser) => {
    setUsers(users.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
    setMessage("✅ User updated");
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      setMessage("✅ User deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage("❌ Failed to delete user");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get("/reports/generate?type=users&format=csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users-report.csv");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  };

const handleExportPDF = async () => {
  try {
    const res = await axios.get("/reports/generate?type=users&format=pdf", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.pdf");
    document.body.appendChild(link);
    link.click();
  } catch (err) {
    console.error("PDF export failed:", err);
  }
};
const handleExportUserTablePDF = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    const res = await axios.get("/reports/generate-users-table", {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` }
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user-table.pdf");
    document.body.appendChild(link);
    link.click();
  } catch (err) {
    console.error("User table PDF export failed:", err);
  }
};

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-6xl">
      <h2 className="text-xl font-semibold mb-4">User List</h2>

      {message && (
        <div className={`mb-4 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded w-full sm:w-1/2"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded w-full sm:w-1/3"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="inventory">Inventory</option>
          <option value="delivery">Delivery</option>
          <option value="customer">Customer</option>
          <option value="guest">Guest</option>
        </select>
       <button
  onClick={handleExportCSV}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
>
  Export CSV
</button>

<button
  onClick={handleExportPDF}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
>
  Export User Table PDF
</button>


      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr key={user._id}>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2 capitalize">{user.role}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

export default UserTable;