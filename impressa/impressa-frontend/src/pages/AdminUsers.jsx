import { useState } from "react";
import UserTable from "../components/UserTable";
import UserCreateModal from "../components/UserCreateModal";

function AdminUsers() {
  const [showModal, setShowModal] = useState(false);

  const handleUserCreated = () => {
    // Optional: refresh user table or show toast
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Users</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Create User</button>
      </div>

      <UserTable />
      <UserCreateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}

export default AdminUsers;