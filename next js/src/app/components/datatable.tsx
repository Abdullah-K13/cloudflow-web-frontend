// src/app/components/datatable.tsx
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getProjects, getPipelines, getModels,
  deleteProject, deletePipeline, deleteModel,
  type Project, type Pipeline, type Model
} from '@/src/app/actions/data_actions';

type Section = 'projects' | 'pipelines' | 'models';
type DataItem = Project | Pipeline | Model;

interface DataTableProps {
  section: Section;
  initialData: DataItem[];
}

const DataTable: React.FC<DataTableProps> = ({ section, initialData }) => {
  const [data, setData] = useState<DataItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Column definitions for each section
  const columnsMap: Record<Section, string[]> = {
    projects: ['Name', 'Description', 'Team', 'Language', 'Author', 'Created at'],
    pipelines: ['Name', 'Description', 'Project', 'Language', 'Mode', 'Author', 'Created at'],
    models: ['Name', 'Description', 'Project', 'Language', 'Author', 'Created at']
  };

  const columns = columnsMap[section] || [];

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      setData(initialData);
    }
  }, [searchTerm, initialData]);

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    try {
      let result: DataItem[] = [];
      
      switch (section) {
        case 'projects':
          result = await getProjects(searchTerm);
          break;
        case 'pipelines':
          result = await getPipelines(searchTerm);
          break;
        case 'models':
          result = await getModels(searchTerm);
          break;
      }
      
      setData(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${section.slice(0, -1)}?`)) {
      return;
    }

    startTransition(async () => {
      try {
        let result: { success: boolean; message?: string };
        
        switch (section) {
          case 'projects':
            result = await deleteProject(id);
            break;
          case 'pipelines':
            result = await deletePipeline(id);
            break;
          case 'models':
            result = await deleteModel(id);
            break;
          default:
            return;
        }

        if (result.success) {
          // Optimistically remove from UI
          setData(prev => prev.filter(item => item.id !== id));
          router.refresh(); // Refresh server data
        } else {
          alert(result.message || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete item');
      }
    });
  };

  const handleEdit = (id: string) => {
    // Navigate to edit page or open modal
    console.log('Edit', section, id);
    // You can implement edit modal or navigate to edit page
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch && searchTerm) {
      setSearchTerm('');
      setData(initialData);
    }
  };

  const formatColumnName = (name: string) => {
    return name.toLowerCase().replace(' ', '');
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return value.toString();
  };

  return (
    <div className="w-full ml-3">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th 
                  key={column} 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
                >
                  {column === 'Name' ? (
                    <div className="flex items-center gap-2">
                      {showSearch ? (
                        <input
                          type="text"
                          placeholder={`Search ${section}...`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onBlur={() => {
                            if (!searchTerm) {
                              setShowSearch(false);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span>Name</span>
                          <button
                            onClick={toggleSearch}
                            className="p-1 hover:bg-gray-200 rounded opacity-60 hover:opacity-100"
                            title={`Search ${section}`}
                          >
                            <Search className="w-5 h-5 text-gray-600" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    column
                  )}
                </th>
              ))}
              {/* Actions header - always present to maintain layout */}
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading || isPending ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No {section} found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-blue-50 transition-colors duration-150 ${
                    hoverRow === index ? 'bg-blue-50' : ''
                  }`}
                  onMouseEnter={() => setHoverRow(index)}
                  onMouseLeave={() => setHoverRow(null)}
                >
                  {columns.map((column) => {
                    const key = formatColumnName(column);
                    const value = (row as any)[key];
                    
                    return (
                      <td key={column} className="px-4 py-3 text-sm text-gray-900">
                        {column === 'Name' ? (
                          <div className="font-medium text-blue-600">
                            {formatValue(value)}
                          </div>
                        ) : column === 'Team' && value ? (
                          <div className="text-gray-600 truncate max-w-xs" title={value}>
                            {formatValue(value)}
                          </div>
                        ) : column === 'Language' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {formatValue(value)}
                          </span>
                        ) : column === 'Author' ? (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                            {formatValue(value)}
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            {formatValue(value)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Actions Column - Always present, icons only visible on hover */}
                  <td className="px-4 py-3 text-right w-24">
                    <div className="flex items-center justify-end gap-2">
                      {section === 'pipelines' && (
                        <button
                          onClick={() => handleEdit(row.id)}
                          className={`p-1 transition-all duration-150 ${
                            hoverRow === index 
                              ? 'text-gray-400 hover:text-blue-600 opacity-100' 
                              : 'text-transparent opacity-0'
                          }`}
                          title="Edit"
                          disabled={isPending}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(row.id)}
                        className={`p-1 transition-all duration-150 ${
                          hoverRow === index 
                            ? 'text-gray-400 hover:text-red-600 opacity-100' 
                            : 'text-transparent opacity-0'
                        }`}
                        title="Delete"
                        disabled={isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default DataTable;