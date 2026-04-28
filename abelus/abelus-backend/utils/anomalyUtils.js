import prisma from "../prisma.js";

/**
 * 📊 Detect anomalies in order patterns
 */
export const getAnomalyAlerts = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [cancelledLastWeek, cancelledPrevWeek, itemsLastWeek, itemsPrevWeek] = await Promise.all([
      prisma.order.count({ where: { status: "cancelled", createdAt: { gte: oneWeekAgo } } }),
      prisma.order.count({ where: { status: "cancelled", createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.orderItem.findMany({ where: { order: { createdAt: { gte: oneWeekAgo } } } }),
      prisma.orderItem.findMany({ where: { order: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } } })
    ]);

    const countCustom = (items) => items.filter(i => {
        const c = i.customizations || {};
        return c.customText || c.customFile || c.cloudLink;
    }).length;

    const customLastWeek = countCustom(itemsLastWeek);
    const customPrevWeek = countCustom(itemsPrevWeek);

    const anomalies = [];

    // Cancelled spike
    if (cancelledPrevWeek > 0) {
      const spike = ((cancelledLastWeek - cancelledPrevWeek) / cancelledPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Cancelled Orders",
          spike: `+${Math.round(spike)}%`,
          message: "High cancellation rate detected this week."
        });
      }
    }

    // Custom order surge
    if (customPrevWeek > 0) {
      const spike = ((customLastWeek - customPrevWeek) / customPrevWeek) * 100;
      if (spike >= 100) {
        anomalies.push({
          type: "Custom Orders",
          spike: `+${Math.round(spike)}%`,
          message: "Significant increase in personalized orders."
        });
      }
    }

    return anomalies;
  } catch (err) {
    console.error("Anomaly detection failed:", err);
    return [];
  }
};