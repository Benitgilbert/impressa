import { useState } from "react";
import axios from "../utils/axiosInstance";
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // axiosInstance will add Authorization header from localStorage.authToken
    const res = await axios.put(`/auth/users/${user._id}`, form);

    onSave(res.data);
    onClose();
  } catch (err) {
    console.error("Update failed:", err);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h3 className="text-lg font-semibold">Edit User</h3>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="inventory">Inventory</option>
          <option value="delivery">Delivery</option>
          <option value="customer">Customer</option>
          <option value="guest">Guest</option>
        </select>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-gray-600 hover:underline">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUserModal;