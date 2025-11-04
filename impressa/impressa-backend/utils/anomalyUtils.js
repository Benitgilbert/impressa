import Order from "../models/Order.js";

export const getAnomalyAlerts = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const countByStatus = async (status, start, end) =>
      await Order.countDocuments({
        status,
        createdAt: { $gte: start, $lt: end }
      });

    const cancelledLastWeek = await countByStatus("cancelled", oneWeekAgo, now);
    const cancelledPrevWeek = await countByStatus("cancelled", twoWeeksAgo, oneWeekAgo);

    const customLastWeek = await Order.countDocuments({
      createdAt: { $gte: oneWeekAgo, $lt: now },
      $or: [
        { customText: { $exists: true, $ne: null } },
        { customFile: { $exists: true, $ne: null } },
        { cloudLink: { $exists: true, $ne: null } }
      ]
    });

    const customPrevWeek = await Order.countDocuments({
      createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
      $or: [
        { customText: { $exists: true, $ne: null } },
        { customFile: { $exists: true, $ne: null } },
        { cloudLink: { $exists: true, $ne: null } }
      ]
    });

    const anomalies = [];

    if (cancelledPrevWeek > 0) {
      const spike = ((cancelledLastWeek - cancelledPrevWeek) / cancelledPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Cancelled Orders",
          spike: `+${Math.round(spike)}%`,
          message: "Investigate production delays or customer issues."
        });
      }
    }

    if (customPrevWeek > 0) {
      const spike = ((customLastWeek - customPrevWeek) / customPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Custom Orders",
          spike: `+${Math.round(spike)}%`,
          message: "High demand for personalization this week."
        });
      }
    }

    return anomalies;
  } catch (err) {
    console.error("Anomaly detection failed:", err);
    return [];
  }
};