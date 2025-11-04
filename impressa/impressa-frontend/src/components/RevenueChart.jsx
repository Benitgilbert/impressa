import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import axios from "../utils/axiosInstance";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

function RevenueChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    axios.get("/analytics/revenue").then(res => {
      const labels = res.data.map(item => monthName(item.month));
      const revenue = res.data.map(item => item.revenue);
      const sales = res.data.map(item => item.sales);

      setChartData({
        labels,
        datasets: [
          {
            label: "Total Revenue",
            data: revenue,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Total Sales",
            data: sales,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      });
    });
  }, []);

  const monthName = (num) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][num - 1];

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Total Revenue and Total Sales</h3>
        <select className="border px-2 py-1 rounded text-sm">
          <option>Day</option>
          <option>Week</option>
          <option selected>Month</option>
        </select>
      </div>
      {chartData ? <Line data={chartData} options={options} /> : <p>Loading chart...</p>}
    </div>
  );
}

export default RevenueChart;