import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "impressa_uploads", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"], // Allowed formats
    // public_id: (req, file) => 'computed-filename-using-request',
  },
});

// Profile Filter (Images only) - still useful to fail early if possible, 
// though CloudinaryStorage handles formats too.
const profileFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed for profiles (jpeg, jpg, png, gif, webp)"));
  }
};

// General Filter (Images + PDF)
const generalFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed"));
  }
};

// Named export for profiles
export const uploadProfileImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: profileFileFilter,
});

// Default export for general use (products, orders, etc.)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: generalFileFilter,
});

export default upload;