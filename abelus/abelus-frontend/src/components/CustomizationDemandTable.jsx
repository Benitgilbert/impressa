import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

function CustomizationDemandTable({ refreshKey }) {
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
  }, [refreshKey]);

  if (loading) return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">Loading customization data...</div>
    </div>
  );

  if (!demandData) return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-gray-400 dark:text-gray-500 text-sm">No data available</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-charcoal-800 dark:text-white mb-4">Customization Demand</h3>
      <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-charcoal-600">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-charcoal-700">
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customization Type</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
              <th className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-charcoal-700/50">
            {/* Custom Text */}
            <tr className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors">
              <td className="py-3 text-sm text-charcoal-700 dark:text-gray-200 font-medium">Custom Text</td>
              <td className="py-3 text-sm text-charcoal-600 dark:text-gray-400 font-semibold">{demandData.customText}</td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-charcoal-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(demandData.customText / demandData.total * 100) || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {((demandData.customText / demandData.total * 100) || 0).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>

            {/* Custom File */}
            <tr className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors">
              <td className="py-3 text-sm text-charcoal-700 dark:text-gray-200 font-medium">File Upload</td>
              <td className="py-3 text-sm text-charcoal-600 dark:text-gray-400 font-semibold">{demandData.customFile}</td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-charcoal-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(demandData.customFile / demandData.total * 100) || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {((demandData.customFile / demandData.total * 100) || 0).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>

            {/* Cloud Link */}
            <tr className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition-colors">
              <td className="py-3 text-sm text-charcoal-700 dark:text-gray-200 font-medium">Cloud Link</td>
              <td className="py-3 text-sm text-charcoal-600 dark:text-gray-400 font-semibold">{demandData.cloudLink}</td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-charcoal-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(demandData.cloudLink / demandData.total * 100) || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {((demandData.cloudLink / demandData.total * 100) || 0).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>

            {/* Total */}
            <tr className="bg-gray-50/50 dark:bg-charcoal-700/20 font-semibold">
              <td className="py-3 text-sm text-charcoal-800 dark:text-white pl-2">Total Customizations</td>
              <td className="py-3 text-sm text-charcoal-800 dark:text-white">{demandData.total}</td>
              <td className="py-3 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CustomizationDemandTable;
