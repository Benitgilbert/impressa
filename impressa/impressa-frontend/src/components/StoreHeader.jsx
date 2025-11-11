import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function StoreHeader() {
  const { totals } = useCart();
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/shop" className="text-xl font-bold text-blue-700">impressa</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/shop" className="hover:text-blue-700">Shop</Link>
          <Link to="/track" className="hover:text-blue-700">Track Order</Link>
          <Link to="/cart" className="relative hover:text-blue-700">
            Cart
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full bg-blue-600 text-white">
              {totals.itemCount}
            </span>
          </Link>
          <Link to="/login" className="ml-2 px-3 py-1.5 border rounded hover:bg-gray-50">Login</Link>
        </nav>
      </div>
    </header>
  );
}
