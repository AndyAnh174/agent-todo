"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { AnalysisResponse, TimeRange, AnalysisState } from "@/types/analysis";
import { apiService } from "@/services/api";
import { 
  ChartBarIcon, 
  ArrowPathIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

export default function AnalysisPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    loading: false,
    error: null,
    analysisData: null,
    isGenerating: false,
    isExporting: false
  });

  const generateAnalysis = async () => {
    setAnalysisState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      // Ensure token is set
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
      }
      
      const data = await apiService.generateAnalysis({
        time_range: timeRange,
        compare_with_previous: compareWithPrevious
      });
      
      setAnalysisState(prev => ({ 
        ...prev, 
        analysisData: data, 
        isGenerating: false 
      }));
    } catch (error) {
      setAnalysisState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        isGenerating: false 
      }));
    }
  };

  const exportReport = async (format: 'pdf' | 'json') => {
    setAnalysisState(prev => ({ ...prev, isExporting: true }));
    
    try {
      // Ensure token is set
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
      }
      
      const data = await apiService.exportAnalysisReport({
        format,
        include_charts: true,
        time_range: timeRange
      });
      
      if (format === 'json' && data.data) {
        // Download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      setAnalysisState(prev => ({ ...prev, isExporting: false }));
    } catch (error) {
      setAnalysisState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Export failed',
        isExporting: false 
      }));
    }
  };

  const loadLatestAnalysis = async () => {
    setAnalysisState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Ensure token is set
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
      }
      
      const data = await apiService.getLatestAnalysis(timeRange);
      setAnalysisState(prev => ({ 
        ...prev, 
        analysisData: data, 
        loading: false 
      }));
    } catch (error) {
      // If 404, that's okay - no cached analysis
      if (error instanceof Error && error.message.includes('404')) {
        setAnalysisState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      setAnalysisState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load analysis',
        loading: false 
      }));
    }
  };

  useEffect(() => {
    loadLatestAnalysis();
  }, [timeRange]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <Sidebar onClose={() => setSidebarOpen(false)} showCloseButton={true} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Phân tích</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                </select>
                
                <button
                  onClick={generateAnalysis}
                  disabled={analysisState.isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  {analysisState.isGenerating ? 'Đang phân tích...' : 'Phân tích ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {analysisState.error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                    <div className="mt-2 text-sm text-red-700">{analysisState.error}</div>
                  </div>
                </div>
              </div>
            )}

            {analysisState.loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải phân tích...</span>
              </div>
            )}

            {analysisState.analysisData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Tỷ lệ hoàn thành</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analysisState.analysisData.time.completion_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Hiệu suất</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analysisState.analysisData.productivity.efficiency_score.toFixed(0)}/100
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Tasks/ngày</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analysisState.analysisData.productivity.tasks_per_day.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {analysisState.analysisData.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gợi ý cải thiện</h3>
                    <div className="space-y-3">
                      {analysisState.analysisData.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            rec.priority === 'high' ? 'bg-red-500' : 
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export buttons */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Xuất báo cáo</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => exportReport('json')}
                      disabled={analysisState.isExporting}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      {analysisState.isExporting ? 'Đang xuất...' : 'Xuất JSON'}
                    </button>
                    <button
                      onClick={() => exportReport('pdf')}
                      disabled={analysisState.isExporting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      {analysisState.isExporting ? 'Đang xuất...' : 'Xuất PDF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!analysisState.loading && !analysisState.analysisData && !analysisState.error && (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu phân tích</h3>
                <p className="mt-1 text-sm text-gray-500">Nhấn "Phân tích ngay" để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
