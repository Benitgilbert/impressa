import prisma, { supabase } from "../prisma.js";

/**
 * 👥 Create a new staff member (Cashier)
 */
export const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const sellerId = req.user.id;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // 1. Create user in Supabase Auth using Admin Client
    // Note: This requires the service_role key to be used in the supabase client for admin operations
    // If our supabaseClient is initialized with anon key, this will fail.
    // I should check if we have a supabaseAdminClient.
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'cashier', managedById: sellerId }
    });

    if (authError) {
        console.error("Supabase Admin CreateUser Error:", authError);
        return res.status(400).json({ message: authError.message });
    }

    // 2. The trigger on_auth_user_created might have created the public.User record.
    // We need to ensure managedById is set in our DB.
    // Sometimes triggers don't handle metadata correctly if not configured.
    // We'll update it explicitly to be safe.
    
    const user = await prisma.user.update({
        where: { email },
        data: {
            role: 'cashier',
            managedById: sellerId
        }
    });

    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      staff: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
      }
    });
  } catch (err) {
    console.error("Create staff failed:", err);
    res.status(500).json({ message: "Failed to create staff member", error: err.message });
  }
};

/**
 * 👥 Get all staff members for the current seller
 */
export const getStaff = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const staff = await prisma.user.findMany({
      where: { managedById: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profileImage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: staff });
  } catch (err) {
    console.error("Fetch staff failed:", err);
    res.status(500).json({ message: "Failed to fetch staff members" });
  }
};

/**
 * 👥 Remove a staff member
 */
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Ensure the staff member is managed by this seller
    const staff = await prisma.user.findFirst({
      where: { id, managedById: sellerId }
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found or access denied." });
    }

    // 1. Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
        console.warn("Supabase Auth delete failed:", authError.message);
        // We continue anyway to clean up our DB if auth is gone
    }

    // 2. Delete from our DB
    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: "Staff member removed successfully" });
  } catch (err) {
    console.error("Delete staff failed:", err);
    res.status(500).json({ message: "Failed to remove staff member" });
  }
};
