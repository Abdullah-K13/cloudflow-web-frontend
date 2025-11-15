'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import DeployedProjectsTable from './DeployedProjectsTable';
import ScheduledPipelinesTable from './ScheduledPipelinesTable';
import RunHistoryTable from './RunHistoryTable';

type TabType = 'deployed-projects' | 'scheduled-pipelines' | 'run-history';

const tabs = [
  { id: 'deployed-projects', label: 'Deployed Projects' },
  { id: 'scheduled-pipelines', label: 'Scheduled Pipelines' },
  { id: 'run-history', label: 'Run History' }
] as const;

export default function ObservabilityTabs() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract section from URL (last segment after /observability/)
  const sectionFromUrl = pathname.split('/').pop() as TabType | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('deployed-projects');

  // Validate section from URL or default
  useEffect(() => {
    if (sectionFromUrl && tabs.some(tab => tab.id === sectionFromUrl)) {
      setActiveTab(sectionFromUrl);
    } else {
      // If invalid or missing, redirect to default tab
      router.replace('/observability/deployed-projects');
    }
  }, [sectionFromUrl, router]);

  // Handle tab change
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`/observability/${tabId}`);
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'deployed-projects' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployed Projects</h2>
            <DeployedProjectsTable />
          </div>
        )}

        {activeTab === 'scheduled-pipelines' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Pipelines</h2>
            <ScheduledPipelinesTable />
          </div>
        )}

        {activeTab === 'run-history' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Run History</h2>
            <RunHistoryTable />
          </div>
        )}
      </div>
    </div>
  );
}
