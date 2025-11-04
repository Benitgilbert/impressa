import UserCreateForm from "./UserCreateForm";

function UserCreateModal({ isOpen, onClose, onUserCreated }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create New User</h2>

        <UserCreateForm
          onSuccess={() => {
            onUserCreated?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}

export default UserCreateModal;