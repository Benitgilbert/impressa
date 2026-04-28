import prisma from "../prisma.js";

/**
 * 🧾 Get all tax rates (Admin)
 */
export const getTaxRates = async (req, res, next) => {
    try {
        const rates = await prisma.taxRate.findMany({
            orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
        });
        res.json({ success: true, data: rates });
    } catch (error) {
        next(error);
    }
};

/**
 * 🧾 Create tax rate (Admin)
 */
export const createTaxRate = async (req, res, next) => {
    try {
        const rate = await prisma.taxRate.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        next(error);
    }
};

/**
 * 🧾 Update tax rate (Admin)
 */
export const updateTaxRate = async (req, res, next) => {
    try {
        const rate = await prisma.taxRate.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: rate });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Tax rate not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🧾 Delete tax rate (Admin)
 */
export const deleteTaxRate = async (req, res, next) => {
    try {
        await prisma.taxRate.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: "Tax rate deleted" });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Tax rate not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🧾 Calculate taxes for an order (Public)
 */
export const calculateTax = async (req, res, next) => {
    try {
        const { province, district, sector, cell, subtotal, shippingCost } = req.body;

        const rates = await prisma.taxRate.findMany({
            orderBy: { priority: 'asc' }
        });

        let totalTax = 0;
        const taxes = [];

        for (const rate of rates) {
            if (rate.province !== "*" && rate.province !== province) continue;
            if (rate.district !== "*") {
                if (!district || rate.district !== district) continue;
            }
            if (rate.sector !== "*") {
                if (!sector || rate.sector !== sector) continue;
            }
            if (rate.cell !== "*") {
                if (!cell || rate.cell !== cell) continue;
            }

            let taxableAmount = subtotal;
            if (rate.shipping) {
                taxableAmount += shippingCost;
            }

            const taxAmount = taxableAmount * (rate.rate / 100);
            totalTax += taxAmount;

            taxes.push({
                name: rate.name,
                amount: taxAmount,
                rate: rate.rate
            });
        }

        res.json({ success: true, data: { totalTax, taxes } });
    } catch (error) {
        next(error);
    }
};

/**
 * 🧾 Mock Fetch Live Rates (Rwanda Tax Simulation)
 */
export const fetchLiveRates = async (req, res, next) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const liveRates = [
            {
                name: "Rwanda VAT",
                province: "*",
                district: "*",
                sector: "*",
                cell: "*",
                rate: 18.0,
                priority: 1,
                shipping: true
            },
            {
                name: "Kigali City Tax",
                province: "Kigali City",
                district: "*",
                sector: "*",
                cell: "*",
                rate: 0.5,
                priority: 2,
                shipping: false
            }
        ];

        const addedRates = [];

        for (const rateData of liveRates) {
            const exists = await prisma.taxRate.findFirst({
                where: {
                    name: rateData.name,
                    province: rateData.province
                }
            });
            if (!exists) {
                const newRate = await prisma.taxRate.create({
                    data: rateData
                });
                addedRates.push(newRate);
            }
        }

        res.json({
            success: true,
            message: `Successfully fetched and synced ${addedRates.length} new rates.`,
            data: addedRates
        });
    } catch (error) {
        next(error);
    }
};
