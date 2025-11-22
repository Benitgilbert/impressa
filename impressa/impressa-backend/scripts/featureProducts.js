import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const featureProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);

    console.log('MongoDB Connected...');

    // Find up to 4 products that are not already featured
    const productsToFeature = await Product.find({ featured: { $ne: true } }).limit(4);

    if (productsToFeature.length === 0) {
      console.log('No products to feature. Either all products are already featured or the database is empty.');
      process.exit(0);
    }

    console.log(`Found ${productsToFeature.length} products to feature. Updating...`);

    // Update them to be featured
    for (const product of productsToFeature) {
      product.featured = true;
      await product.save();
      console.log(`- Marked '${product.name}' as featured.`);
    }

    console.log('\nSuccessfully updated products!');
    process.exit(0);
  } catch (error) {
    console.error('Error featuring products:', error);
    process.exit(1);
  }
};

featureProducts();
