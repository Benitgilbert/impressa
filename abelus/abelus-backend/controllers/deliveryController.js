import prisma from "../prisma.js";

/**
 * 🗺️ Get all zones (Admin)
 */
export const getZones = async (req, res, next) => {
    try {
        const zones = await prisma.shippingZone.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: zones });
    } catch (error) {
        next(error);
    }
};

/**
 * 🗺️ Create zone (Admin)
 */
export const createZone = async (req, res, next) => {
    try {
        const zone = await prisma.shippingZone.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        next(error);
    }
};

/**
 * 🗺️ Update zone (Admin)
 */
export const updateZone = async (req, res, next) => {
    try {
        const zone = await prisma.shippingZone.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: zone });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Zone not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🗺️ Delete zone (Admin)
 */
export const deleteZone = async (req, res, next) => {
    try {
        await prisma.shippingZone.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: "Zone deleted" });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Zone not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🚚 Calculate delivery methods for an address (Public)
 */
export const calculateDelivery = async (req, res, next) => {
    try {
        const { province, district, sector, cell, total, items } = req.body;

        // 1. Find matching zone using cascading hierarchy
        // We fetch all active zones and find the match in memory for better JSON flexibility
        const activeZones = await prisma.shippingZone.findMany({
            where: { isActive: true }
        });

        let matchedZone = null;

        // Helper to check region match
        const checkMatch = (regions, p, d, s, c) => {
            return regions.some(r => 
                (p === (r.province || null)) && 
                (d === (r.district || null)) && 
                (s === (r.sector || null)) && 
                (c === (r.cell || null))
            );
        };

        // Priority: Full Match > Sector > District > Province > Default
        if (province && district && sector && cell) {
            matchedZone = activeZones.find(z => checkMatch(z.regions, province, district, sector, cell));
        }
        if (!matchedZone && province && district && sector) {
            matchedZone = activeZones.find(z => checkMatch(z.regions, province, district, sector, null));
        }
        if (!matchedZone && province && district) {
            matchedZone = activeZones.find(z => checkMatch(z.regions, province, district, null, null));
        }
        if (!matchedZone && province) {
            matchedZone = activeZones.find(z => checkMatch(z.regions, province, null, null, null));
        }
        if (!matchedZone) {
            matchedZone = activeZones.find(z => z.name === "Default");
        }

        if (!matchedZone || !matchedZone.methods) {
            return res.json({ success: true, data: [] });
        }

        // 2. Filter and Adjust methods based on shipping classes and conditions
        const methods = matchedZone.methods.map(method => {
            if (!method.isActive) return null;

            // Check free shipping threshold
            if (method.type === "free_shipping" && total < (method.minOrderAmount || 0)) return null;

            let finalCost = Number(method.cost || 0);

            // Add class costs per item
            if (items && items.length > 0) {
                items.forEach(item => {
                    const shippingClassId = item.product?.shippingClass;
                    // In Prisma/JSON, classCosts is a plain object { classId: cost }
                    if (shippingClassId && method.classCosts && method.classCosts[shippingClassId]) {
                        const classCost = Number(method.classCosts[shippingClassId]);
                        finalCost += (classCost * Number(item.quantity || 1));
                    }
                });
            }

            return {
                ...method,
                cost: finalCost
            };
        }).filter(Boolean);

        res.json({ success: true, data: methods });
    } catch (error) {
        console.error("Calculate delivery error:", error);
        next(error);
    }
};
