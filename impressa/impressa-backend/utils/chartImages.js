import https from "https";

// Fetch a chart image from QuickChart given a Chart.js config
export const getChartImage = (config, { width = 800, height = 320, format = "png" } = {}) => {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(JSON.stringify({
      ...config,
      options: { responsive: true, maintainAspectRatio: false, ...(config.options || {}) },
    }));
    const url = `https://quickchart.io/chart?format=${format}&width=${width}&height=${height}&c=${encoded}`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Chart fetch failed with status ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
};

export const buildRevenueTimeConfig = (labels, data) => ({
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Revenue",
      data,
      borderColor: "#1E40AF",
      backgroundColor: "rgba(30,64,175,0.15)",
      fill: true,
      tension: 0.3,
    }]
  },
  options: {
    plugins: { legend: { display: true } },
    scales: { y: { ticks: { callback: (v) => `$${v}` } } }
  }
});

export const buildOrdersVolumeConfig = (labels, data) => ({
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Orders",
      data,
      backgroundColor: "#111827",
      borderRadius: 4
    }]
  },
  options: { plugins: { legend: { display: true } } }
});

export const buildTopProductsConfig = (labels, data) => ({
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Revenue",
      data,
      backgroundColor: "#10B981"
    }]
  },
  options: {
    indexAxis: "y",
    plugins: { legend: { display: true } },
    scales: { x: { ticks: { callback: (v) => `$${v}` } } }
  }
});
