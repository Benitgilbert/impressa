import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import axios from "../utils/axiosInstance";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function WeeklyProfitChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    axios.get("/analytics/weekly-profit").then(res => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const labels = res.data.map(item => dayNames[item.day - 1]);
      const profits = res.data.map(item => item.profit);

      setChartData({
        labels,
        datasets: [
          {
            label: "Profit",
            data: profits,
            backgroundColor: "#10b981",
          },
        ],
      });
    }).catch(err => {
      console.error("Failed to load weekly profit data:", err);
    });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Profit This Week</h3>
      {chartData ? <Bar data={chartData} options={options} /> : <p>Loading chart...</p>}
    </div>
  );
}

export default WeeklyProfitChart;