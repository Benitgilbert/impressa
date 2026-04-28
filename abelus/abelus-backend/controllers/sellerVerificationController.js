import prisma from "../prisma.js";
import { SELLER_TERMS_VERSION, SELLER_TERMS_CONTENT } from "../utils/sellerTerms.js";
import { sendSellerApprovedEmail, sendSellerRejectedEmail } from "../utils/emailService.js";

/**
 * 📄 Get seller terms and conditions
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
 * 📄 Submit seller application with RDB documents
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

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if already a seller
        if (user.role === 'seller' && user.sellerStatus !== 'rejected') {
            if (user.sellerStatus === 'active') {
                return res.status(400).json({ success: false, message: "You already have an active seller account" });
            }

            const rdb = user.rdbVerification || {};
            if (rdb.documentStatus === 'pending_review') {
                return res.status(400).json({ success: false, message: "Your seller application is already under review" });
            }
        }

        // Handle file uploads
        let rdbCertificatePath = null;
        let nationalIdPath = null;

        if (req.files) {
            if (req.files.rdbCertificate && req.files.rdbCertificate[0]) {
                rdbCertificatePath = req.files.rdbCertificate[0].path;
            }
            if (req.files.nationalId && req.files.nationalId[0]) {
                nationalIdPath = req.files.nationalId[0].path;
            }
        }

        if (!rdbCertificatePath) {
            return res.status(400).json({ success: false, message: "RDB certificate document is required" });
        }

        // Update user to seller
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'seller',
                sellerStatus: 'pending',
                storeName: storeName,
                storeDescription: storeDescription || '',
                storePhone: storePhone || '',
                rdbVerification: {
                    tinNumber: tinNumber.replace(/\s/g, ''),
                    businessName: businessName,
                    businessType: businessType || 'sole_proprietor',
                    rdbCertificate: rdbCertificatePath,
                    nationalId: nationalIdPath,
                    documentStatus: 'pending_review'
                },
                termsAcceptance: {
                    accepted: true,
                    acceptedAt: new Date(),
                    version: SELLER_TERMS_VERSION,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    digitalSignature: digitalSignature
                }
            }
        });

        res.status(201).json({
            success: true,
            message: "Seller application submitted successfully. Your documents are under review.",
            data: {
                sellerId: updatedUser.id,
                sellerStatus: updatedUser.sellerStatus,
                documentStatus: updatedUser.rdbVerification.documentStatus
            }
        });

    } catch (error) {
        console.error("Seller application error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 📄 Get pending seller verifications (admin)
 */
export const getPendingVerifications = async (req, res) => {
    try {
        const { status = 'pending_review', page = 1, limit = 20 } = req.query;

        // In Prisma with Postgres, we can filter by JSON path
        const sellers = await prisma.user.findMany({
            where: {
                role: 'seller',
                rdbVerification: {
                    path: ['documentStatus'],
                    equals: status
                }
            },
            select: {
                id: true, name: true, email: true, storeName: true, storePhone: true,
                rdbVerification: true, termsAcceptance: true, createdAt: true, sellerStatus: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.user.count({
            where: {
                role: 'seller',
                rdbVerification: {
                    path: ['documentStatus'],
                    equals: status
                }
            }
        });

        // Get counts for each status
        const pendingCount = await prisma.user.count({
            where: { role: 'seller', rdbVerification: { path: ['documentStatus'], equals: 'pending_review' } }
        });
        const approvedCount = await prisma.user.count({
            where: { role: 'seller', rdbVerification: { path: ['documentStatus'], equals: 'approved' } }
        });
        const rejectedCount = await prisma.user.count({
            where: { role: 'seller', rdbVerification: { path: ['documentStatus'], equals: 'rejected' } }
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
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error("Get pending verifications error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 📄 Verify seller documents (admin)
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

        const seller = await prisma.user.findUnique({ where: { id, role: 'seller' } });
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        let updatedData = {};
        const currentRdb = seller.rdbVerification || {};

        if (action === 'approve') {
            updatedData = {
                rdbVerification: {
                    ...currentRdb,
                    documentStatus: 'approved',
                    verifiedAt: new Date(),
                    verifiedById: req.user.id
                },
                sellerStatus: 'active',
                approvedAt: new Date(),
                approvedById: req.user.id
            };

            // 📧 Send Approval Email
            try {
                await sendSellerApprovedEmail(seller);
            } catch (emailErr) {
                console.error("Failed to send approval email:", emailErr);
            }

        } else {
            updatedData = {
                rdbVerification: {
                    ...currentRdb,
                    documentStatus: 'rejected',
                    rejectionReason: rejectionReason,
                    verifiedAt: new Date(),
                    verifiedById: req.user.id
                },
                sellerStatus: 'rejected'
            };

            // 📧 Send Rejection Email
            try {
                await sendSellerRejectedEmail(seller, rejectionReason);
            } catch (emailErr) {
                console.error("Failed to send rejection email:", emailErr);
            }
        }

        const updatedSeller = await prisma.user.update({
            where: { id },
            data: updatedData
        });

        res.json({
            success: true,
            message: action === 'approve'
                ? "Seller approved successfully"
                : "Seller application rejected",
            data: {
                sellerId: updatedSeller.id,
                storeName: updatedSeller.storeName,
                sellerStatus: updatedSeller.sellerStatus,
                documentStatus: updatedSeller.rdbVerification.documentStatus
            }
        });

    } catch (error) {
        console.error("Verify seller error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 📄 Get seller verification details (admin)
 */
export const getSellerVerificationDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const seller = await prisma.user.findUnique({
            where: { id, role: 'seller' },
            select: {
                id: true, name: true, email: true, storeName: true, storePhone: true,
                rdbVerification: true, termsAcceptance: true, createdAt: true, sellerStatus: true,
                approvedAt: true, approvedBy: { select: { id: true, name: true, email: true } }
            }
        });

        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        // Note: verifiedBy in rdbVerification is just an ID, if we want the object we'd need more complex logic
        // But for now this matches legacy populates where possible

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
