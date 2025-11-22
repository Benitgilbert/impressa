import StoreHeader from "../components/StoreHeader";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { formatRwf } from "../utils/currency";

export default function CartPage() {
  const { items, updateQty, removeItem, totals, setFile } = useCart();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white p-6 rounded border text-center">
            <div className="mb-2">Your cart is empty.</div>
            <Link to="/shop" className="text-blue-600 hover:underline">Continue shopping</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Subtotal</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-t align-top">
                      <td className="p-2">
                        <div className="font-medium">{it.product.name}</div>
                        {it.customText && <div className="text-xs text-gray-600">Text: {it.customText}</div>}
                        {it.cloudLink && <div className="text-xs text-gray-600">Cloud: {it.cloudLink}</div>}
                        <div className="mt-2">
                          <label className="text-xs text-gray-600">Customization file (image/PDF)</label>
                          <input type="file" accept="image/*,application/pdf" onChange={(e)=>setFile(idx, e.target.files?.[0] || null)} className="block text-xs" />
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <input type="number" min={1} value={it.quantity} onChange={(e)=>updateQty(idx, parseInt(e.target.value||"1"))} className="w-16 border rounded px-2 py-1" />
                      </td>
                      <td className="p-2 text-center">{formatRwf(it.product.price)}</td>
                      <td className="p-2 text-center">{formatRwf((it.product.price||0)*it.quantity)}</td>
                      <td className="p-2 text-right">
                        <button onClick={()=>removeItem(idx)} className="text-red-600 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded border p-4 h-max">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600">Items</div>
                <div className="font-medium">{totals.itemCount}</div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-600">Subtotal</div>
                <div className="font-semibold">${totals.subtotal.toLocaleString()}</div>
              </div>
              <button onClick={()=>nav("/checkout")} className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">Checkout</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
