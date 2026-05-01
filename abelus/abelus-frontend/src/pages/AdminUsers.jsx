import { useState } from "react";
import UserTable from "../components/UserTable";
import UserCreateModal from "../components/UserCreateModal";

function AdminUsers() {
  const [showModal, setShowModal] = useState(false);

  const handleUserCreated = () => {
    // Optional: refresh user table or show toast
  };

  return (
    <div className="min-h-screen flex flex-col transition-all duration-300">
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-charcoal-800 dark:text-white">
              User Management
            </h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">
              Manage all registered users and their roles
            </p>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden">
            <UserTable onCreate={() => setShowModal(true)} />
          </div>

          <UserCreateModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onUserCreated={handleUserCreated}
          />
        </main>
    </div>
  );
}

export default AdminUsers;
