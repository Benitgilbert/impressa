import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

function ProductCreateEditModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [activeTab, setActiveTab] = useState("general");
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [shippingClasses, setShippingClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Helper to parse attributes from backend format to frontend format
  const parseAttributes = (attrs) => {
    if (!attrs) return [];
    return attrs.map(a => ({
      key: a.name,
      value: Array.isArray(a.values) ? a.values.join(", ") : a.values,
      isVariation: a.variation || false
    }));
  };

  // Helper to parse variations
  const parseVariations = (vars) => {
    if (!vars) return [];
    return vars.map(v => ({
      ...v,
      attributes: v.attributes || {}
    }));
  };

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    stock: product?.stock || "",
    category: product?.category || "",
    image: product?.image || "",
    type: product?.type || "simple",
    customizable: product?.customizable || false,
    featured: product?.featured || false,
    customizationOptions: product?.customizationOptions || [],
    isDigital: product?.isDigital || false,
    downloadLink: product?.downloadLink || "",
    upSells: product?.upSells?.map((p) => (typeof p === "object" ? p._id : p)) || [],
    crossSells: product?.crossSells?.map((p) => (typeof p === "object" ? p._id : p)) || [],
    shippingClass: product?.shippingClass || "",
    attributes: parseAttributes(product?.attributes),
    variations: parseVariations(product?.variations),
  });

  useEffect(() => {
    fetchGlobalAttributes();
    fetchAllProducts();
    fetchShippingClasses();
    fetchCategories();
  }, []);

  const fetchGlobalAttributes = async () => {
    try {
      const res = await api.get("/attributes");
      setGlobalAttributes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch global attributes:", err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await api.get("/products?limit=100");
      setAllProducts(res.data.data?.products || res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchShippingClasses = async () => {
    try {
      const res = await api.get("/shipping-classes");
      setShippingClasses(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch shipping classes:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
    }
  };

  // Attributes Logic
  const handleAddAttribute = (key = "", value = "") => {
    setForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { key, value, isVariation: false }],
    }));
  };

  const handleAttributeChange = (index, field, value) => {
    const updated = [...form.attributes];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, attributes: updated }));
  };

  const handleRemoveAttribute = (index) => {
    const updated = [...form.attributes];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, attributes: updated }));
  };

  // Variations Logic
  const generateVariations = () => {
    const variationAttributes = form.attributes.filter(a => a.isVariation && a.key && a.value);
    if (variationAttributes.length === 0) {
      alert("Please add attributes and mark them as 'Used for variations' first.");
      return;
    }

    // Group attributes by name to handle multiple rows with same key (e.g. Size: Small, Size: Large)
    const groupedAttributes = {};
    variationAttributes.forEach(a => {
      const key = a.key.trim();
      const values = a.value.split(',').map(v => v.trim()).filter(Boolean);

      if (groupedAttributes[key]) {
        groupedAttributes[key] = [...new Set([...groupedAttributes[key], ...values])];
      } else {
        groupedAttributes[key] = values;
      }
    });

    // Convert to array format for cartesian product
    const attrs = Object.entries(groupedAttributes).map(([name, values]) => ({
      name,
      values
    }));

    const combine = (list) => {
      if (list.length === 0) return [{}];
      const first = list[0];
      const rest = combine(list.slice(1));
      const combinations = [];
      first.values.forEach(val => {
        rest.forEach(r => {
          combinations.push({ [first.name]: val, ...r });
        });
      });
      return combinations;
    };

    const existingVariations = [...form.variations];
    const combinations = combine(attrs);

    const newVariations = combinations.map(combo => {
      // Check if exists
      const existing = existingVariations.find(v =>
        JSON.stringify(v.attributes) === JSON.stringify(combo)
      );
      if (existing) return existing;

      // Create SKU
      const skuSuffix = Object.values(combo).join('-').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const sku = `${form.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${skuSuffix}`;

      return {
        attributes: combo,
        price: form.price,
        stock: form.stock, // Default to main stock
        sku: sku,
        image: null
      };
    });

    setForm(prev => ({ ...prev, variations: newVariations }));
  };

  const handleVariationChange = (index, field, value) => {
    const updated = [...form.variations];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, variations: updated }));
  };

  const handleRemoveVariation = (index) => {
    const updated = [...form.variations];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, variations: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("type", form.type);

      // Handle Price Logic
      let finalPrice = form.price;
      // Handle Stock Logic
      let finalStock = form.stock;

      if (form.type === 'variable' && form.variations.length > 0) {
        // 1. Calculate Min Price from Variations if base price is missing
        const variationPrices = form.variations
          .map(v => Number(v.price))
          .filter(p => !isNaN(p) && p >= 0);

        if ((!finalPrice || finalPrice === "") && variationPrices.length > 0) {
          finalPrice = Math.min(...variationPrices);
        }

        // 2. Calculate Total Stock from Variations
        const variationStocks = form.variations
          .map(v => Number(v.stock))
          .filter(s => !isNaN(s));

        if (variationStocks.length > 0) {
          finalStock = variationStocks.reduce((a, b) => a + b, 0);
        }
      }

      if (finalPrice !== "" && finalPrice !== null && finalPrice !== undefined) {
        fd.append("price", String(finalPrice));
      }

      // Use the calculated total stock for variable products
      if (finalStock !== "" && finalStock !== null && finalStock !== undefined) {
        fd.append("stock", String(finalStock));
      }

      fd.append("customizable", String(form.customizable));
      fd.append("featured", String(form.featured));
      fd.append("isDigital", String(form.isDigital));
      fd.append("downloadLink", form.downloadLink);

      // Transform attributes for backend
      // Group them first to ensure we send clean data
      const groupedForBackend = {};
      form.attributes.forEach(a => {
        if (!a.key) return;
        const key = a.key.trim();
        const vals = a.value.split(',').map(v => v.trim()).filter(Boolean);
        if (groupedForBackend[key]) {
          groupedForBackend[key].values = [...new Set([...groupedForBackend[key].values, ...vals])];
          groupedForBackend[key].variation = groupedForBackend[key].variation || a.isVariation;
        } else {
          groupedForBackend[key] = {
            name: key,
            values: vals,
            variation: a.isVariation,
            visible: true
          };
        }
      });

      const backendAttributes = Object.values(groupedForBackend);
      fd.append("attributes", JSON.stringify(backendAttributes));

      // Transform variations for backend
      // Backend expects array of objects with 'attributes' Map
      const backendVariations = form.variations.map(v => ({
        attributes: v.attributes,
        price: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku
        // Handling images would require separate FormData logic or existing logic
      }));
      fd.append("variations", JSON.stringify(backendVariations));

      fd.append("upSells", JSON.stringify(form.upSells));
      fd.append("crossSells", JSON.stringify(form.crossSells));

      if (form.shippingClass) fd.append("shippingClass", form.shippingClass);
      if (form.category) fd.append("category", form.category);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl sticky top-0 z-10 transition-colors">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{isEdit ? "Edit Product" : "Create Product"}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-800 transition-colors">
          {["general", "attributes", "variations", "linked products", "shipping"].map((tab) => {
            if (tab === "variations" && form.type !== "variable") return null;
            return (
              <button
                key={tab}
                className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none ${activeTab === tab
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-600"
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-gray-800 transition-colors">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-start">
              <div className="flex-shrink-0 text-red-400 mt-0.5">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm"
                >
                  <option value="simple">Simple Product</option>
                  <option value="variable">Variable Product</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id || cat.name} value={cat.name || cat}>
                      {cat.name || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Product Name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Base Price</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock (Total)</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detail your product features..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm resize-y placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-all">
                    <span>Choose File</span>
                    <input type="file" onChange={handleImageChange} className="sr-only" />
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {form.image instanceof File ? form.image.name : (form.image ? "Image Selected" : "No file chosen")}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="customizable"
                    checked={form.customizable}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 dark:bg-gray-700 transition-all"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">This product allows customer customization</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isDigital"
                    checked={form.isDigital}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 dark:bg-gray-700 transition-all"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">This is a Digital Product (Downloadable)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 dark:bg-gray-700 transition-all"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Featured Product (Show on Home Page)</span>
                </label>
              </div>

              {form.isDigital && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Download Link</label>
                  <input
                    type="url"
                    name="downloadLink"
                    value={form.downloadLink}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "attributes" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">Product Attributes</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define characteristics like color, size, or material.</p>
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAttribute(e.target.value, "");
                        e.target.value = ""; // Reset select
                      }
                    }}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">+ Add Global Attribute</option>
                    {globalAttributes.map(attr => (
                      <option key={attr._id} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddAttribute("", "")}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-md font-medium transition-all shadow-sm"
                  >
                    + Add Custom
                  </button>
                </div>
              </div>
              {form.attributes.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                  No attributes added yet. Select a global attribute or add a custom one.
                </div>
              )}
              {form.attributes.map((attr, index) => {
                const globalAttr = globalAttributes.find(ga => ga.name.toLowerCase() === attr.key.toLowerCase());
                return (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Key</label>
                        <input
                          type="text"
                          placeholder="e.g. Color"
                          value={attr.key}
                          onChange={(e) => handleAttributeChange(index, "key", e.target.value)}
                          list={`global-attributes-${index}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <datalist id={`global-attributes-${index}`}>
                          {globalAttributes.map(ga => <option key={ga._id} value={ga.name} />)}
                        </datalist>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Value(s) <span className="text-[10px] normal-case font-normal">(comma separated for variations)</span></label>
                        {globalAttr && globalAttr.values && globalAttr.values.length > 0 ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={`e.g. Red, Blue, Green`}
                              value={attr.value}
                              onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                              list={`attr-values-${index}`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <datalist id={`attr-values-${index}`}>
                              {globalAttr.values.map(val => (
                                <option key={val._id} value={val.name} />
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. Red, Blue"
                            value={attr.value}
                            onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                          />
                        )}
                      </div>
                      <div className="md:col-span-1 flex items-center h-[42px]">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attr.isVariation}
                            onChange={(e) => handleAttributeChange(index, "isVariation", e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-300">Variation?</span>
                        </label>
                      </div>
                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(index)}
                          className="w-full py-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-800 rounded-md text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "variations" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                <div>
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">Product Variations</h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Manage stock and prices for different versions.</p>
                </div>
                <button
                  type="button"
                  onClick={generateVariations}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-all shadow-sm"
                >
                  Generate Variations
                </button>
              </div>

              {form.variations.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                  No variations added yet. Add attributes and mark them for variation, then click Generate.
                </div>
              )}

              {form.variations.map((v, idx) => (
                <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {Object.entries(v.attributes).map(([key, val]) => `${key}: ${val}`).join(' / ')}
                    </h5>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleVariationChange(idx, "sku", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Price</label>
                      <input
                        type="number"
                        placeholder="Override Price"
                        value={v.price}
                        onChange={(e) => handleVariationChange(idx, "price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Stock</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={v.stock}
                        onChange={(e) => handleVariationChange(idx, "stock", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "linked products" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Up-Sells</label>
                <select
                  multiple
                  value={form.upSells}
                  onChange={(e) => setForm({ ...form, upSells: Array.from(e.target.selectedOptions, o => o.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm h-48"
                >
                  {allProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl (Windows) or cmd (Mac) to select multiple.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cross-Sells</label>
                <select
                  multiple
                  value={form.crossSells}
                  onChange={(e) => setForm({ ...form, crossSells: Array.from(e.target.selectedOptions, o => o.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm h-48"
                >
                  {allProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Products to promote in the cart.</p>
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Shipping Class</label>
                <select
                  name="shippingClass"
                  value={form.shippingClass}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-all text-sm"
                >
                  <option value="">No Shipping Class</option>
                  {shippingClasses.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end gap-3 transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving Product..." : (isEdit ? "Save Changes" : "Create Product")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCreateEditModal;
