'use client';

import { useState, useEffect } from 'react';
import { ScheduledPipeline, getScheduledPipelines } from '@/app/actions/observability-api';

export default function ScheduledPipelinesTable() {
  const [pipelines, setPipelines] = useState<ScheduledPipeline[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedFabric, setSelectedFabric] = useState('');
  // const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPipelines() {
      try {
        setLoading(true);
        // const data = await getScheduledPipelines(selectedFabric, selectedProject);
        const data = await getScheduledPipelines();
        setPipelines(data);
      } catch (error) {
        console.error('Failed to fetch scheduled pipelines:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPipelines();
  }, []);

  const filteredPipelines = pipelines.filter(pipeline =>
    pipeline.pipeline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading scheduled pipelines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search pipeline"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters - commented out as requested */}
        {/* <div className="w-48">
          <select
            value={selectedFabric}
            onChange={(e) => setSelectedFabric(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Fabric</option>
            <option value="dev">dev</option>
            <option value="prod">prod</option>
          </select>
        </div>
        
        <div className="w-48">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Project</option>
          </select>
        </div> */}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pipeline
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fabric
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Triggers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last 5 runs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPipelines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No scheduled pipelines found
                </td>
              </tr>
            ) : (
              filteredPipelines.map((pipeline) => (
                <tr key={pipeline.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pipeline.pipeline}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.fabric}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.project}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pipeline.triggers.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {pipeline.last5Runs.map((run, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            run.status === 'success'
                              ? 'bg-green-500'
                              : run.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          title={`${run.status} - ${run.timestamp}`}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};