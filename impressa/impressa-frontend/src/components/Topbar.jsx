function Topbar() {
  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <input
        type="text"
        placeholder="Search..."
        className="px-4 py-2 border rounded w-1/3"
      />
      <div className="flex items-center space-x-4">
        <img
          src="https://ui-avatars.com/api/?name=Benit"
          alt="Admin"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="text-sm font-semibold">Benit</p>
          <p className="text-xs text-gray-500">Admin</p>
        </div>
      </div>
    </header>
  );
}

export default Topbar;