import StoreHeader from "../components/StoreHeader";
import { useCart } from "../context/CartContext";
import api from "../utils/axiosInstance";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckoutPage() {
  const { items, totals, clear, getFile } = useCart();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [guest, setGuest] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });
  const nav = useNavigate();

  useEffect(() => {
    if (items.length === 0) setMessage("Your cart is empty.");
  }, [items.length]);

  const placeOrders = async () => {
    setMessage("");
    if (items.length === 0) return;
    const token = localStorage.getItem("authToken");
    if (!token && !guest) {
      setMessage("Please log in or checkout as guest.");
      return;
    }
    if (guest && (!guestInfo.email || !guestInfo.name)) {
      setMessage("Please provide name and email for guest checkout.");
      return;
    }
    try {
      setPlacing(true);
      const placed = [];
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const file = getFile(idx);
        const form = new FormData();
        form.append("product", it.product._id);
        form.append("quantity", String(it.quantity));
        if (it.customText) form.append("customText", it.customText);
        if (it.cloudLink) form.append("cloudLink", it.cloudLink);
        if (it.cloudPassword) form.append("cloudPassword", it.cloudPassword);
        if (guest) {
          form.append("guestName", guestInfo.name);
          form.append("guestEmail", guestInfo.email);
          if (guestInfo.phone) form.append("guestPhone", guestInfo.phone);
        }
        if (file) form.append("customFile", file);
        const url = guest ? "/orders/public" : "/orders";
        const resp = await fetch(api.defaults.baseURL.replace(/\/$/, "") + url, {
          method: "POST",
          headers: token && !guest ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(()=>({message:"Failed"}));
          throw new Error(err.message || "Order failed");
        }
        const data = await resp.json();
        placed.push(data);
      }
      clear();
      setMessage(`✅ Orders placed. Your tracking IDs: ${placed.map(p=>p.publicId).join(", ")}`);
    } catch (e) {
      console.error("Checkout failed", e?.response?.data || e.message);
      const backend = e?.response?.data?.message;
      setMessage(`❌ Checkout failed${backend ? `: ${backend}` : ""}`);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        {message && <div className={`mb-3 text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
        <div className="bg-white rounded border p-4">
          <div className="mb-3 flex items-center gap-2">
            <input id="guest" type="checkbox" checked={guest} onChange={(e)=>setGuest(e.target.checked)} />
            <label htmlFor="guest" className="text-sm text-gray-700">Checkout as guest</label>
          </div>
          {guest && (
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <input placeholder="Full name" value={guestInfo.name} onChange={(e)=>setGuestInfo({...guestInfo, name:e.target.value})} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Email" type="email" value={guestInfo.email} onChange={(e)=>setGuestInfo({...guestInfo, email:e.target.value})} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={guestInfo.phone} onChange={(e)=>setGuestInfo({...guestInfo, phone:e.target.value})} className="border rounded px-3 py-2 text-sm" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Items</div>
            <div className="font-medium">{totals.itemCount}</div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-gray-600">Subtotal</div>
            <div className="font-semibold">${totals.subtotal.toLocaleString()}</div>
          </div>
          <button disabled={placing || items.length===0} onClick={placeOrders} className={`mt-4 w-full rounded py-2 text-white ${placing? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {placing ? "Placing order…" : "Place Order"}
          </button>
          <p className="text-xs text-gray-500 mt-2">Note: You must be logged in as a customer to place orders.</p>
        </div>
      </main>
    </div>
  );
}
