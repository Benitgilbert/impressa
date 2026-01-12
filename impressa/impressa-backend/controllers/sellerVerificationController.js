import User from "../models/User.js";
import { SELLER_TERMS_VERSION, SELLER_TERMS_CONTENT } from "../utils/sellerTerms.js";

/**
 * Get seller terms and conditions
 */
export const getSellerTerms = async (req, res) => {
    res.json({
        success: true,
        data: {
            version: SELLER_TERMS_VERSION,
            content: SELLER_TERMS_CONTENT
        }
    });
};

/**
 * Submit seller application with RDB documents
 */
export const submitSellerApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            storeName,
            storeDescription,
            storePhone,
            tinNumber,
            businessName,
            businessType,
            digitalSignature,
            termsAccepted
        } = req.body;

        // Validate required fields
        if (!storeName || !tinNumber || !businessName || !digitalSignature || !termsAccepted) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: storeName, tinNumber, businessName, digitalSignature, termsAccepted"
            });
        }

        // Validate TIN format (Rwanda TIN is typically 9 digits)
        const tinRegex = /^\d{9}$/;
        if (!tinRegex.test(tinNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                message: "Invalid TIN format. Rwanda TIN should be 9 digits."
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if already a seller
        if (user.role === 'seller' && user.sellerStatus !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: "You already have a pending or active seller account"
            });
        }

        // Handle file uploads
        let rdbCertificatePath = null;
        let nationalIdPath = null;

        if (req.files) {
            req.files.forEach(file => {
                if (file.fieldname === 'rdbCertificate') {
                    rdbCertificatePath = file.path;
                } else if (file.fieldname === 'nationalId') {
                    nationalIdPath = file.path;
                }
            });
        }

        if (!rdbCertificatePath) {
            return res.status(400).json({
                success: false,
                message: "RDB certificate document is required"
            });
        }

        // Update user to seller
        user.role = 'seller';
        user.sellerStatus = 'pending';
        user.storeName = storeName;
        user.storeDescription = storeDescription || '';
        user.storePhone = storePhone || '';

        // RDB Verification info
        user.rdbVerification = {
            tinNumber: tinNumber.replace(/\s/g, ''),
            businessName: businessName,
            businessType: businessType || 'sole_proprietor',
            rdbCertificate: rdbCertificatePath,
            nationalId: nationalIdPath,
            documentStatus: 'pending_review'
        };

        // Terms acceptance
        user.termsAcceptance = {
            accepted: true,
            acceptedAt: new Date(),
            version: SELLER_TERMS_VERSION,
            ipAddress: req.ip || req.connection.remoteAddress,
            digitalSignature: digitalSignature
        };

        await user.save();

        res.status(201).json({
            success: true,
            message: "Seller application submitted successfully. Your documents are under review.",
            data: {
                sellerId: user._id,
                sellerStatus: user.sellerStatus,
                documentStatus: user.rdbVerification.documentStatus
            }
        });

    } catch (error) {
        console.error("Seller application error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get pending seller verifications (admin)
 */
export const getPendingVerifications = async (req, res) => {
    try {
        const { status = 'pending_review', page = 1, limit = 20 } = req.query;

        const filter = {
            role: 'seller',
            'rdbVerification.documentStatus': status
        };

        const sellers = await User.find(filter)
            .select('name email storeName storePhone rdbVerification termsAcceptance createdAt sellerStatus')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        // Get counts for each status
        const pendingCount = await User.countDocuments({
            role: 'seller',
            'rdbVerification.documentStatus': 'pending_review'
        });
        const approvedCount = await User.countDocuments({
            role: 'seller',
            'rdbVerification.documentStatus': 'approved'
        });
        const rejectedCount = await User.countDocuments({
            role: 'seller',
            'rdbVerification.documentStatus': 'rejected'
        });

        res.json({
            success: true,
            data: sellers,
            stats: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get pending verifications error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Verify seller documents (admin)
 */
export const verifySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, rejectionReason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'approve' or 'reject'"
            });
        }

        if (action === 'reject' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const seller = await User.findOne({ _id: id, role: 'seller' });
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        if (action === 'approve') {
            seller.rdbVerification.documentStatus = 'approved';
            seller.rdbVerification.verifiedAt = new Date();
            seller.rdbVerification.verifiedBy = req.user._id;
            seller.sellerStatus = 'active';
            seller.approvedAt = new Date();
            seller.approvedBy = req.user._id;
        } else {
            seller.rdbVerification.documentStatus = 'rejected';
            seller.rdbVerification.rejectionReason = rejectionReason;
            seller.rdbVerification.verifiedAt = new Date();
            seller.rdbVerification.verifiedBy = req.user._id;
            seller.sellerStatus = 'rejected';
        }

        await seller.save();

        // TODO: Send email notification to seller

        res.json({
            success: true,
            message: action === 'approve'
                ? "Seller approved successfully"
                : "Seller application rejected",
            data: {
                sellerId: seller._id,
                storeName: seller.storeName,
                sellerStatus: seller.sellerStatus,
                documentStatus: seller.rdbVerification.documentStatus
            }
        });

    } catch (error) {
        console.error("Verify seller error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get seller verification details (admin)
 */
export const getSellerVerificationDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const seller = await User.findOne({ _id: id, role: 'seller' })
            .select('-password -refreshToken -otp -otpExpires')
            .populate('rdbVerification.verifiedBy', 'name email')
            .populate('approvedBy', 'name email');

        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        res.json({
            success: true,
            data: seller
        });

    } catch (error) {
        console.error("Get seller details error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    getSellerTerms,
    submitSellerApplication,
    getPendingVerifications,
    verifySeller,
    getSellerVerificationDetails
};
