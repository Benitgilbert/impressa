import prisma from "../prisma.js";
import { processSellerAutoApproval } from "../utils/autoApproval.js";
import { notifyUserRegistered } from "./notificationController.js";

/**
 * Handle post-signup registration completion
 * (Used to add metadata like storeName that isn't in auth.users)
 */
export const completeRegistration = async (req, res) => {
  try {
    const { role, storeName, storeDescription, storePhone } = req.body;
    const userId = req.user.id;

    const updateData = {
      role: role || "customer",
      ...(role === 'seller' && {
        storeName,
        storeDescription,
        storePhone,
        sellerStatus: 'pending'
      })
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // If registering as seller, check for auto-approval
    let approvalResult = null;
    if (role === 'seller') {
      try {
        approvalResult = await processSellerAutoApproval(user.id);
      } catch (e) {
        console.error("Auto-approval failed:", e);
      }
    }

    // 🔔 Notify Admin
    try {
      notifyUserRegistered(user.name, user.role);
    } catch (e) { }

    res.json({
      success: true,
      user,
      ...(approvalResult && {
        sellerApproval: {
          approved: approvalResult.approved,
          score: approvalResult.score,
          message: approvalResult.message
        }
      })
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete registration", error: err.message });
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        storeName: true,
        storeDescription: true,
        storePhone: true,
        sellerStatus: true,
        storeLogo: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found in our database" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, storeName, storeDescription, storePhone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (storeName) updateData.storeName = storeName;
    if (storeDescription) updateData.storeDescription = storeDescription;
    if (storePhone) updateData.storePhone = storePhone;

    if (req.files) {
      if (req.files.profileImage) updateData.profileImage = req.files.profileImage[0].path;
      if (req.files.storeLogo) updateData.storeLogo = req.files.storeLogo[0].path;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

/**
 * Get all team members (admins)
 */
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        role: true,
        profileImage: true
      }
    });
    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
};

/**
 * Admin: Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sellerStatus: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * Admin: Delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/**
 * Admin: Update a user
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// Legacy stubs for routes
export const login = (req, res) => res.status(410).json({ message: "Ghone: Use Supabase Auth on frontend" });
export const register = (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" });
export const refreshToken = (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" });
export const adminLoginStep1 = (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" });
export const adminLoginStep2 = (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" });

/**
 * Admin: Create a new user (staff/seller/customer)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Create user in Supabase Auth using Admin Client
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) throw authError;

    // Note: The database trigger 'on_auth_user_created' will handle 
    // creating the record in public.User. We just need to ensure 
    // the role is updated if the trigger didn't catch it correctly 
    // or if we want to ensure it.
    
    // The trigger uses user_metadata.role, so it should be fine.
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: authUser.user
    });
  } catch (error) {
    console.error("Admin createUser error:", error);
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

export default {
  completeRegistration,
  getMe,
  updateProfile,
  getTeamMembers,
  getAllUsers,
  deleteUser,
  updateUser,
  createUser,
  login,
  register,
  refreshToken,
  adminLoginStep1,
  adminLoginStep2
};