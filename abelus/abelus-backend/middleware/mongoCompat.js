/**
 * Middleware to ensure frontend compatibility by mapping Prisma 'id' to legacy '_id'
 */
export const mongoCompat = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const transform = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(transform);
      }

      const newObj = {};
      for (const key in obj) {
        let value = obj[key];
        
        // Recursively transform nested objects/arrays
        if (value && typeof value === 'object') {
          value = transform(value);
        }

        newObj[key] = value;
        
        // Map id to _id if it exists and _id doesn't
        if (key === 'id' && !obj._id) {
          newObj._id = value;
        }
      }
      return newObj;
    };

    const transformedData = transform(data);
    return originalJson.call(this, transformedData);
  };

  next();
};
