import StoreHeader from "../components/StoreHeader";
import { useCart } from "../context/CartContext";
import * as api from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatRwf } from "../utils/currency";

export default function CheckoutPage() {
  const { items, totals, clear, applyCoupon } = useCart();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [orderInfo, setOrderInfo] = useState(null); // { publicId, total, status }

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Rwanda",
  });

  const [billingAddress, setBillingAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Rwanda",
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("");

  const [shippingCost, setShippingCost] = useState(0);
  const [shippingEta, setShippingEta] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" or "mtn_momo"
  const [mtnPhone, setMtnPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const nav = useNavigate();

  useEffect(() => {
    if (items.length === 0) setMessage("Your cart is empty.");
  }, [items.length]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponStatus("Applying coupon...");
      await applyCoupon(couponCode.trim());
      setCouponStatus("Coupon applied.");
    } catch (err) {
      setCouponStatus(err?.response?.data?.message || "Failed to apply coupon.");
    }
  };

  const updateShippingEstimate = async () => {
    try {
      if (!shippingAddress.country || !shippingAddress.city) return;
      const res = await api.calculateShipping({ address: shippingAddress, items });
      const data = res.data || res;
      setShippingCost(data.cost || 0);
      setShippingEta(data.estimatedDays || "");
    } catch (err) {
      console.error("Shipping calc failed", err);
    }
  };

  const updateTaxEstimate = async () => {
    try {
      if (!shippingAddress.country || !totals.subtotal) return;
      const res = await api.calculateTax({ subtotal: totals.subtotal, address: shippingAddress });
      const data = res.data || res;
      setTaxAmount(data.taxAmount || 0);
    } catch (err) {
      console.error("Tax calc failed", err);
    }
  };

  useEffect(() => {
    updateShippingEstimate();
    updateTaxEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingAddress.country, shippingAddress.city, totals.subtotal]);

  const handlePlaceOrder = async () => {
    setMessage("");
    setOrderInfo(null);
    setPaymentStatus("");

    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city) {
      setMessage("Please fill in at least name, address and city for shipping.");
      return;
    }

    if (!shippingAddress.email) {
      setMessage("Please provide an email address for order confirmation.");
      return;
    }

    if (paymentMethod === "mtn_momo" && !mtnPhone) {
      setMessage("Please provide an MTN MoMo phone number.");
      return;
    }

    try {
      setPlacing(true);

      const orderData = {
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        sameAsShipping,
        paymentMethod: paymentMethod === "mtn_momo" ? "mtn_momo" : "cash",
        shippingMethod: "standard",
      };

      const res = await api.createOrder(orderData);
      const payload = res.data || res;
      const info = payload.data || payload;

      setOrderInfo(info);
      setMessage("✅ Order created. You can now proceed to payment.");

      if (paymentMethod === "mtn_momo") {
        try {
          setPaymentStatus("Initiating MTN MoMo payment...");
          const payRes = await api.initiateMTNPayment(info.publicId, mtnPhone.trim());
          const payData = payRes.data || payRes;
          if (payData.success) {
            setPaymentStatus("Payment initiated. Please confirm on your phone.");
          } else {
            setPaymentStatus(payData.message || "Failed to initiate payment.");
          }
        } catch (err) {
          console.error("Payment init failed", err);
          setPaymentStatus(err?.response?.data?.message || "Failed to initiate payment.");
        }
      }
    } catch (e) {
      console.error("Checkout failed", e?.response?.data || e.message);
      const backend = e?.response?.data?.message;
      setMessage(`❌ Checkout failed${backend ? `: ${backend}` : ""}`);
    } finally {
      setPlacing(false);
    }
  };

  const grandTotalWithEstimates = totals.subtotal - totals.discount + shippingCost + taxAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        {message && (
          <div className={`mb-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}
        <div className="bg-white rounded border p-4 space-y-5">
          {/* Order summary */}
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Items in cart</div>
            <div className="font-medium">{totals.itemCount}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Subtotal</div>
            <div className="font-semibold">{formatRwf(totals.subtotal)}</div>
          </div>
          {totals.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-700">
              <div>Discount</div>
              <div>-{formatRwf(totals.discount)}</div>
            </div>
          )}

          {/* Coupon */}
          <div className="mt-3">
            <div className="flex gap-2 items-center">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="border rounded px-3 py-2 text-sm flex-1"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Apply
              </button>
            </div>
            {couponStatus && (
              <div className="mt-1 text-xs text-gray-600">{couponStatus}</div>
            )}
          </div>

          {/* Shipping & tax estimates */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Shipping address</h2>
              <div className="space-y-2 text-sm">
                <input
                  placeholder="Full name"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  placeholder="Phone"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  placeholder="Address line 1"
                  value={shippingAddress.addressLine1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  placeholder="Address line 2 (optional)"
                  value={shippingAddress.addressLine2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="State/Province"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Postal code"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Billing & payment</h2>
              <div className="mb-2 text-sm flex items-center gap-2">
                <input
                  id="sameBilling"
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                />
                <label htmlFor="sameBilling">Billing same as shipping</label>
              </div>
              {!sameAsShipping && (
                <div className="space-y-2 text-sm mb-3">
                  <input
                    placeholder="Billing name"
                    value={billingAddress.fullName}
                    onChange={(e) => setBillingAddress({ ...billingAddress, fullName: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Billing email"
                    type="email"
                    value={billingAddress.email}
                    onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Billing phone"
                    value={billingAddress.phone}
                    onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
              )}

              <div className="mt-2 text-sm">
                <div className="font-medium mb-1">Payment method</div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pay"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <span>Cash / manual payment</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pay"
                      value="mtn_momo"
                      checked={paymentMethod === "mtn_momo"}
                      onChange={() => setPaymentMethod("mtn_momo")}
                    />
                    <span>MTN MoMo</span>
                  </label>
                </div>
                {paymentMethod === "mtn_momo" && (
                  <input
                    placeholder="MTN MoMo phone (250XXXXXXXXX)"
                    value={mtnPhone}
                    onChange={(e) => setMtnPhone(e.target.value)}
                    className="mt-2 border rounded px-3 py-2 text-sm w-full"
                  />
                )}
                {paymentStatus && (
                  <div className="mt-1 text-xs text-gray-600">{paymentStatus}</div>
                )}
              </div>

              <div className="mt-4 border-t pt-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span>Estimated shipping</span>
                  <span>{formatRwf(shippingCost)}{shippingEta && ` · ${shippingEta} days`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated tax</span>
                  <span>{formatRwf(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold mt-1">
                  <span>Estimated total</span>
                  <span>{formatRwf(grandTotalWithEstimates)}</span>
                </div>
              </div>
            </div>
          </div>

          {orderInfo && (
            <div className="mt-4 p-3 rounded border border-green-200 bg-green-50 text-sm">
              <div className="font-medium text-green-800 mb-1">Order created</div>
              <div className="text-gray-700 mb-1">
                Tracking ID: <code className="px-2 py-0.5 bg-white border rounded">{orderInfo.publicId}</code>
              </div>
              <div className="text-gray-700 mb-2">Total: {formatRwf(orderInfo.total || orderInfo.grandTotal || totals.subtotal)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(orderInfo.publicId)}
                  className="px-3 py-1.5 text-xs border rounded hover:bg-white"
                >
                  Copy ID
                </button>
                <button
                  onClick={() => nav("/track")}
                  className="px-3 py-1.5 text-xs border rounded hover:bg-white"
                >
                  Track order
                </button>
                <button
                  onClick={() => clear()}
                  className="ml-auto px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear cart
                </button>
              </div>
            </div>
          )}

          <button
            disabled={placing || items.length === 0}
            onClick={handlePlaceOrder}
            className={`mt-4 w-full rounded py-2 text-white ${placing ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {placing ? "Placing order…" : "Place Order"}
          </button>
        </div>
      </main>
    </div>
  );
}
