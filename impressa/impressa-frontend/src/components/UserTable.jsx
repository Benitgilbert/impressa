import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axiosInstance";
import EditUserModal from "./EditUserModal"; // ✅ Make sure this component exists

function UserTable({ onCreate }) {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounced search + role filtering
  useEffect(() => {
    const id = setTimeout(() => {
      const filteredUsers = users.filter((user) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = q
          ? (user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q))
          : true;
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesRole;
      });
      setFiltered(filteredUsers);
      setPage(1);
    }, 200);
    return () => clearTimeout(id);
  }, [search, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      // axiosInstance auto-injects `authToken` from localStorage (key: authToken)
      const res = await axios.get("/auth/users");
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
        // route is mounted under /api/auth on the backend
        await axios.delete(`/auth/users/${userId}`);
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
      const res = await axios.get("/reports/generate?type=users&format=pdf", {
        responseType: "blob",
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

  const sorted = useMemo(() => {
    const s = [...filtered].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const setSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow-md max-w-6xl">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded shadow-md w-full">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold">User List</h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-gray-500">{total} users</div>
            <button
              onClick={onCreate}
              className="inline-flex items-center justify-center px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow"
            >
              + Create User
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="inventory">Inventory</option>
          <option value="delivery">Delivery</option>
          <option value="customer">Customer</option>
          <option value="guest">Guest</option>
        </select>
        <div className="ml-auto flex gap-2 w-full sm:w-auto">
       <button
  onClick={handleExportCSV}
  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
>
  Export CSV
</button>

<button
  onClick={handleExportPDF}
  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
>
  Export User Table PDF
</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th onClick={() => setSort("name")} className="border px-4 py-2 text-left cursor-pointer select-none">
                Name {sortKey === "name" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => setSort("email")} className="border px-4 py-2 text-left cursor-pointer select-none">
                Email {sortKey === "email" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => setSort("role")} className="border px-4 py-2 text-left cursor-pointer select-none">
                Role {sortKey === "role" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={4} className="border px-4 py-10 text-center text-gray-500">
                  No users match your filters.
                </td>
              </tr>
            )}
            {pageItems.map((user, idx) => (
              <tr key={user._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border px-4 py-2">
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="sm:hidden text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="border px-4 py-2 hidden sm:table-cell">{user.email}</td>
                <td className="border px-4 py-2 capitalize">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 border text-gray-700">
                    {user.role}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <div className="flex items-center gap-2 ml-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded border text-sm ${page === 1 ? "text-gray-400 border-gray-200" : "hover:bg-gray-50"}`}
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded border text-sm ${page === totalPages ? "text-gray-400 border-gray-200" : "hover:bg-gray-50"}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

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