import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

function ProductCreateEditModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    customizable: false,
    customizationOptions: [], // ["image", "text", "cloud", "pdf"]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price ?? "",
        stock: product.stock ?? "",
        image: product.image || "",
        customizable: !!product.customizable,
        customizationOptions: Array.isArray(product.customizationOptions) ? product.customizationOptions : [],
      });
    }
  }, [isEdit, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price" || name === "stock") {
      setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
    } else if (name === "customizable") {
      setForm((f) => ({ ...f, customizable: e.target.checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const toggleOption = (opt) => {
    setForm((f) => {
      const has = f.customizationOptions.includes(opt);
      const next = has ? f.customizationOptions.filter((o) => o !== opt) : [...f.customizationOptions, opt];
      return { ...f, customizationOptions: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      if (form.price !== "") fd.append("price", String(form.price));
      if (form.stock !== "") fd.append("stock", String(form.stock));
      fd.append("customizable", String(form.customizable));
      fd.append("customizationOptions", JSON.stringify(form.customizationOptions));
      if (form.image instanceof File) {
        fd.append("image", form.image);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = isEdit
        ? await api.put(`/products/${product._id}`, fd, config)
        : await api.post("/products", fd, config);
      onSaved(res.data);
    } catch (err) {
      console.error("Save product failed:", err?.response?.data || err.message);
      setError(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded shadow-lg">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{isEdit ? "Edit Product" : "Create Product"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">×</button>
        </div>

        {error && <div className="px-4 pt-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Price</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Stock</label>
              <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm"></textarea>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setForm((f) => ({ ...f, image: file }));
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="mt-2">
              {form.image instanceof File ? (
                <img src={URL.createObjectURL(form.image)} alt="preview" className="h-16 w-16 object-cover rounded border" />
              ) : form.image ? (
                <img src={form.image} alt="current" className="h-16 w-16 object-cover rounded border" />
              ) : null}
            </div>
          </div>

          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input type="checkbox" name="customizable" checked={form.customizable} onChange={handleChange} />
              This product allows customer customization
            </label>
            {form.customizable && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.customizationOptions.includes("image")} onChange={() => toggleOption("image")} />
                  Custom Image Upload
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.customizationOptions.includes("text")} onChange={() => toggleOption("text")} />
                  Custom Text
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.customizationOptions.includes("cloud")} onChange={() => toggleOption("cloud")} />
                  Cloud Link (multiple assets)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.customizationOptions.includes("pdf")} onChange={() => toggleOption("pdf")} />
                  PDF Instructions
                </label>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border text-sm">Cancel</button>
            <button type="submit" disabled={saving} className={`px-3 py-2 rounded text-sm text-white ${saving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>
              {saving ? "Saving…" : (isEdit ? "Save Changes" : "Create Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductCreateEditModal;


