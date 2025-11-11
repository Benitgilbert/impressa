import { body, validationResult } from "express-validator";

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.errors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return next(error);
  }
  next();
};

/**
 * Registration validation rules
 */
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  body("phone")
    .optional()
    .trim()
    .matches(/^(\+?25)?(078|079|072|073)\d{7}$/)
    .withMessage("Must be a valid Rwandan phone number"),
  
  body("role")
    .optional()
    .isIn(["customer", "admin", "staff"])
    .withMessage("Role must be customer, admin, or staff"),
  
  handleValidationErrors,
];

/**
 * Login validation rules
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors,
];

/**
 * Admin login step 1 validation
 */
export const validateAdminLoginStep1 = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors,
];

/**
 * Admin login step 2 validation (OTP verification)
 */
export const validateAdminLoginStep2 = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
  
  handleValidationErrors,
];

/**
 * Request password reset validation
 */
export const validatePasswordResetRequest = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  handleValidationErrors,
];

/**
 * Confirm password reset validation
 */
export const validatePasswordResetConfirm = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("resetToken")
    .notEmpty()
    .withMessage("Reset token is required"),
  
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  handleValidationErrors,
];

/**
 * Update user validation
 */
export const validateUpdateUser = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("phone")
    .optional()
    .trim()
    .matches(/^(\+?25)?(078|079|072|073)\d{7}$/)
    .withMessage("Must be a valid Rwandan phone number"),
  
  body("role")
    .optional()
    .isIn(["customer", "admin", "staff"])
    .withMessage("Role must be customer, admin, or staff"),
  
  handleValidationErrors,
];

/**
 * Resend OTP validation
 */
export const validateResendOTP = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  handleValidationErrors,
];
