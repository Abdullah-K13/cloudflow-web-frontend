'use client';

import { useState, useEffect } from 'react';
import { RunHistoryItem, getRunHistory, FilterOptions } from '@/src/app/actions/observability-api';

const RUN_TYPES = [
  'Scheduled',
  'Pipeline Run', 
  'App Run',
  'Scheduled App Run',
  'API Pipeline Run'
];

export default function RunHistoryTable() {
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    runTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [showRunTypeDropdown, setShowRunTypeDropdown] = useState(false);

  useEffect(() => {
    async function fetchRunHistory() {
      try {
        setLoading(true);
        const data = await getRunHistory(filters);
        setRunHistory(data);
      } catch (error) {
        console.error('Failed to fetch run history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRunHistory();
  }, [filters]);

  const handleRunTypeToggle = (runType: string) => {
    const currentTypes = filters.runTypes || [];
    const newTypes = currentTypes.includes(runType)
      ? currentTypes.filter(type => type !== runType)
      : [...currentTypes, runType];
    
    setFilters({ ...filters, runTypes: newTypes });
  };

  const removeRunTypeFilter = (runType: string) => {
    const newTypes = (filters.runTypes || []).filter(type => type !== runType);
    setFilters({ ...filters, runTypes: newTypes });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading run history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Date Range */}
        <div className="space-y-2 w-full">
        <label className="text-sm font-medium text-gray-700">Date Range</label>
        <div className="flex items-center space-x-2 w-full max-w-[280px]">
            <input
            type="date"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-400">—</span>
            <input
            type="date"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
        </div>
        </div>


        {/* Fabric Filter - commented out */}
        {/* <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Fabric</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Fabric</option>
            <option value="dev">dev</option>
            <option value="prod">prod</option>
          </select>
        </div> */}

        {/* Project Filter - commented out */}
        {/* <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Project</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Project</option>
          </select>
        </div> */}

        {/* Run Type Filter */}
        <div className="space-y-2 relative w-full">
          <label className="text-sm font-medium text-gray-700">Run Type</label>
          <div className="relative w-full">
            <div
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              onClick={() => setShowRunTypeDropdown(!showRunTypeDropdown)}
            >
              <div className="flex flex-wrap gap-1">
                {filters.runTypes && filters.runTypes.length > 0 ? (
                  filters.runTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {type}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRunTypeFilter(type);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Select Run Types</span>
                )}
              </div>
              <svg 
                className={`absolute right-3 top-3 h-4 w-4 text-gray-400 transition-transform ${showRunTypeDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </div>
            
            {showRunTypeDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {RUN_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.runTypes?.includes(type) || false}
                      onChange={() => handleRunTypeToggle(type)}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                    {filters.runTypes?.includes(type) && (
                      <svg className="ml-auto h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fabric
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pipeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Run Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runHistory.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No run history found
                </td>
              </tr>
            ) : (
              runHistory.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.id}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.fabric}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.pipeline}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.project}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.runType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.startTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {run.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      run.result === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : run.result === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {run.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}