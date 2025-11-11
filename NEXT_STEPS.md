# 🚀 Next Steps - Phase 1, Sprint 1.2: Data Model Extensions

**Status:** Ready to begin  
**Estimated Duration:** 1-2 weeks  
**Priority:** HIGH

---

## 📝 What We Just Completed

✅ **Phase 1, Sprint 1.1: Security & Configuration**
- Security middleware (helmet)
- Enhanced CORS configuration
- Global error handler
- Input validation for auth routes
- Environment configuration

**Current Server Status:** ✅ Running with enhanced security

---

## 🎯 Next Sprint Overview

We need to extend our data models to support a full e-commerce catalog with:
- Product variations (sizes, colors, etc.)
- Product categories (hierarchical)
- Multi-item orders
- Coupons and discounts

---

## 📋 Tasks for Sprint 1.2

### Task 1: Enhanced Product Model (Priority: CRITICAL)

**Current State:**
```javascript
Product {
  name, description, price, stock, image, images[],
  featured, tags[], customizable, customizationOptions[]
}
```

**Target State:**
```javascript
Product {
  // Existing fields +
  sku: String (unique, indexed),
  barcode: String,
  categories: [ObjectId Category],
  attributes: [{name, values: [String]}],
  variations: [{sku, attributes, price, stock, image}],
  visibility: enum['public', 'hidden', 'draft'],
  weight: Number,
  dimensions: {length, width, height}
}
```

**Action Items:**
1. Update `models/Product.js` with new fields
2. Add indexes for SKU and barcode
3. Create validation for product variations
4. Update product routes to handle new fields

---

### Task 2: Create Category Model (Priority: HIGH)

**New Model:**
```javascript
Category {
  name: String (required, unique),
  slug: String (unique, indexed),
  parent: ObjectId Category (optional),
  description: String,
  image: String,
  isActive: Boolean,
  order: Number,
  createdAt, updatedAt
}
```

**Action Items:**
1. Create `models/Category.js`
2. Create `routes/categoryRoutes.js`
3. Implement tree structure queries (nested categories)
4. Add category assignment to products

---

### Task 3: Enhanced Order Model (Priority: CRITICAL)

**Current State:**
```javascript
Order {
  product: ObjectId,
  customer, guestName, guestEmail, guestPhone,
  quantity, customText, customFile, status
}
```

**Target State:**
```javascript
Order {
  customer: ObjectId User (optional),
  guestInfo: {name, email, phone},
  items: [{
    product: ObjectId,
    quantity, 
    price, 
    customizations: {text, file, cloudLink}
  }],
  billingAddress: {...},
  shippingAddress: {...},
  totals: {
    subtotal, shipping, tax, discount, grandTotal
  },
  payment: {
    method, status, transactionId, paidAt
  },
  shipping: {
    method, cost, trackingNumber, carrier
  },
  notes: [{text, author, isCustomerVisible, createdAt}],
  couponCode, discountAmount,
  status, publicId
}
```

**Action Items:**
1. Backup current Order model (major refactor)
2. Update `models/Order.js` with new schema
3. Migrate existing orders (create migration script)
4. Update order routes and controllers
5. Test order creation with multiple items

---

### Task 4: Create Coupon Model (Priority: MEDIUM)

**New Model:**
```javascript
Coupon {
  code: String (unique, uppercase),
  type: enum['fixed', 'percentage', 'free_shipping'],
  value: Number,
  minSpend: Number,
  maxDiscount: Number (for percentage),
  usageLimit: Number,
  usageCount: Number,
  perUserLimit: Number,
  validFrom: Date,
  expiresAt: Date,
  isActive: Boolean,
  applicableCategories: [ObjectId],
  applicableProducts: [ObjectId]
}
```

**Action Items:**
1. Create `models/Coupon.js`
2. Create `routes/couponRoutes.js`
3. Implement coupon validation logic
4. Add admin CRUD for coupons

---

## 🛠️ Implementation Order

**Week 1:**
1. Day 1-2: Category Model + Routes
2. Day 3-4: Enhanced Product Model
3. Day 5: Product-Category integration

**Week 2:**
1. Day 1-3: Enhanced Order Model (careful migration)
2. Day 4: Coupon Model
3. Day 5: Testing & validation

---

## 📦 Dependencies to Install (Optional)

For better slug generation and validation:
```bash
npm install slugify validator mongoose-unique-validator
```

---

## 🧪 Testing Plan

After each model update:
1. Test CRUD operations
2. Test validation rules
3. Test relationships (populate)
4. Check indexes are created
5. Verify backward compatibility (if needed)

---

## ⚠️ Important Notes

### Order Model Migration
- **This is a breaking change!**
- Current orders have single product, new schema supports multiple items
- Create a migration script to convert old orders:
  ```javascript
  // Old: { product, quantity, customText, ... }
  // New: { items: [{ product, quantity, customizations: {text} }] }
  ```

### Backup Before Migration
```bash
# Export current orders
mongoexport --uri="YOUR_MONGO_URI" --collection=orders --out=orders_backup.json

# Import if needed
mongoimport --uri="YOUR_MONGO_URI" --collection=orders --file=orders_backup.json
```

---

## 📚 Resources

- **Mongoose Schema Types:** https://mongoosejs.com/docs/schematypes.html
- **Mongoose Indexes:** https://mongoosejs.com/docs/indexes.html
- **Tree Structures in MongoDB:** https://docs.mongodb.com/manual/applications/data-models-tree-structures/
- **Data Migration Best Practices:** https://mongoosejs.com/docs/migrating_to_6.html

---

## ✅ Success Criteria

Sprint 1.2 is complete when:
- [ ] Product model supports variations and categories
- [ ] Category tree structure works (parent-child)
- [ ] Order model supports multiple items per order
- [ ] Coupon model created with validation
- [ ] All existing functionality still works
- [ ] Database indexes created and verified
- [ ] Basic CRUD tests pass for new models

---

## 🤔 Questions to Resolve

1. **Product Variations:** How should we handle stock for variations? (Individual SKUs or parent product?)
2. **Categories:** Maximum nesting depth? (Recommend 3 levels)
3. **Order Migration:** Can we run the migration script on production? (Test on staging first)
4. **Coupons:** Should coupons stack or only one per order?

---

## 📞 Need Help?

- Review: `WOOCOMMERCE_INTEGRATION_PLAN.md` for full roadmap
- Reference: `PHASE1_SPRINT1.1_COMPLETE.md` for what we just finished
- Check: Existing models in `models/` directory

---

**Ready to Start?** Let's begin with **Task 1: Enhanced Product Model**!

Run:
```bash
# Make sure server is running
npm run dev

# In another terminal, start implementing
```

**Good luck! 🚀**
