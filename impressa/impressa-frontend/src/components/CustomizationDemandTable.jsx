import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function CustomizationDemandTable() {
  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomizationDemand = async () => {
      try {
        const res = await axios.get("/analytics/customization-demand");
        setDemandData(res.data);
      } catch (err) {
        console.error("Failed to fetch customization demand:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomizationDemand();
  }, []);

  if (loading) return <div className="p-4">Loading customization data...</div>;
  if (!demandData) return <div className="p-4">No data available</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Customization Demand</h3>
      <table className="w-full text-sm text-left border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Customization Type</th>
            <th className="p-3">Count</th>
            <th className="p-3">Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">Custom Text</td>
            <td className="p-3">{demandData.customText}</td>
            <td className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(demandData.customText / demandData.total * 100)}%` }}
                  ></div>
                </div>
                <span>{((demandData.customText / demandData.total * 100) || 0).toFixed(1)}%</span>
              </div>
            </td>
          </tr>
          <tr className="border-t">
            <td className="p-3">Custom File Upload</td>
            <td className="p-3">{demandData.customFile}</td>
            <td className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(demandData.customFile / demandData.total * 100)}%` }}
                  ></div>
                </div>
                <span>{((demandData.customFile / demandData.total * 100) || 0).toFixed(1)}%</span>
              </div>
            </td>
          </tr>
          <tr className="border-t">
            <td className="p-3">Cloud Link</td>
            <td className="p-3">{demandData.cloudLink}</td>
            <td className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(demandData.cloudLink / demandData.total * 100)}%` }}
                  ></div>
                </div>
                <span>{((demandData.cloudLink / demandData.total * 100) || 0).toFixed(1)}%</span>
              </div>
            </td>
          </tr>
          <tr className="border-t bg-gray-50 font-semibold">
            <td className="p-3">Total Customizations</td>
            <td className="p-3">{demandData.total}</td>
            <td className="p-3">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CustomizationDemandTable;