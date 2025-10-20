"use client";

import { useState, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Đăng ký Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalysisData {
  user_id: string;
  time_range: string;
  generated_at: string;
  content: {
    category: string;
    count: number;
    trend: string;
    keywords: string[];
    summary: string;
  };
  time: {
    peak_hours: number[];
    productivity_pattern: string;
    time_distribution: Record<string, number>;
  };
  productivity: {
    completion_rate: number;
    efficiency_score: number;
    focus_areas: string[];
  };
  comparison?: {
    previous_period: {
      completion_rate: number;
      efficiency_score: number;
      task_count: number;
    };
    improvement: {
      completion_rate_change: number;
      efficiency_change: number;
      task_count_change: number;
    };
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

interface AnalysisReportProps {
  data: AnalysisData;
  onClose?: () => void;
}

export default function AnalysisReport({ data, onClose }: AnalysisReportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `analysis-report-${data.time_range}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi khi xuất PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Dữ liệu cho biểu đồ
  const completionData = {
    labels: ['Hoàn thành', 'Chưa hoàn thành'],
    datasets: [{
      data: [data.productivity.completion_rate || 0, 100 - (data.productivity.completion_rate || 0)],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0,
    }],
  };

  const timeDistributionData = {
    labels: Object.keys(data.time.time_distribution || {}),
    datasets: [{
      label: 'Số lượng task',
      data: Object.values(data.time.time_distribution || {}),
      backgroundColor: '#3B82F6',
      borderColor: '#1D4ED8',
      borderWidth: 1,
    }],
  };

  const productivityTrendData = {
    labels: ['Tuần trước', 'Tuần này'],
    datasets: [{
      label: 'Tỷ lệ hoàn thành (%)',
      data: data.comparison ? [
        data.comparison.previous_period?.completion_rate || 0,
        data.productivity.completion_rate || 0
      ] : [0, data.productivity.completion_rate || 0],
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
    }, {
      label: 'Hiệu suất (điểm)',
      data: data.comparison ? [
        data.comparison.previous_period?.efficiency_score || 0,
        data.productivity.efficiency_score || 0
      ] : [0, data.productivity.efficiency_score || 0],
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4,
    }],
  };

  const focusAreasData = {
    labels: data.productivity.focus_areas || [],
    datasets: [{
      data: (data.productivity.focus_areas || []).map(() => Math.random() * 100), // Mock data
      backgroundColor: [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
      ],
    }],
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Báo cáo phân tích</h2>
          <p className="text-gray-600">
            Khoảng thời gian: {data.time_range} | 
            Tạo lúc: {new Date(data.generated_at).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Tỷ lệ hoàn thành</p>
                <p className="text-3xl font-bold">{(data.productivity.completion_rate || 0).toFixed(1)}%</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Hiệu suất</p>
                <p className="text-3xl font-bold">{(data.productivity.efficiency_score || 0).toFixed(1)}/100</p>
              </div>
              <ChartBarIcon className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Tasks/ngày</p>
                <p className="text-3xl font-bold">{((data.content.count || 0) / 7).toFixed(1)}</p>
              </div>
              <ClockIcon className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Completion Rate Chart */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Tỷ lệ hoàn thành</h3>
            <div className="h-64">
              <Doughnut 
                data={completionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Time Distribution Chart */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Phân bố thời gian</h3>
            <div className="h-64">
              <Bar 
                data={timeDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Productivity Trend Chart */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Xu hướng năng suất</h3>
            <div className="h-64">
              <Line 
                data={productivityTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Focus Areas Chart */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Lĩnh vực tập trung</h3>
            <div className="h-64">
              <Doughnut 
                data={focusAreasData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Analysis */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Phân tích nội dung
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Danh mục chính</p>
                <p className="font-medium">{data.content.category || 'Không xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng số task</p>
                <p className="font-medium">{data.content.count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Xu hướng</p>
                <p className="font-medium capitalize">{data.content.trend || 'stable'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Từ khóa</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(data.content.keywords || []).map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {keyword}
                    </span>
                  ))}
                  {(data.content.keywords || []).length === 0 && (
                    <span className="text-sm text-gray-500">Không có từ khóa</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Phân tích thời gian
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Giờ cao điểm</p>
                <p className="font-medium">{(data.time.peak_hours || []).join(', ')}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mẫu năng suất</p>
                <p className="font-medium capitalize">{data.time.productivity_pattern || 'Không xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phân bố thời gian</p>
                <div className="space-y-2 mt-2">
                  {Object.entries(data.time.time_distribution || {}).map(([time, count]) => (
                    <div key={time} className="flex justify-between">
                      <span className="text-sm">{time}</span>
                      <span className="font-medium">{count} tasks</span>
                    </div>
                  ))}
                  {Object.keys(data.time.time_distribution || {}).length === 0 && (
                    <p className="text-sm text-gray-500">Không có dữ liệu phân bố thời gian</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            Gợi ý cải thiện
          </h3>
          <div className="space-y-4">
            {(data.recommendations || []).map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' : 
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{rec.title || 'Gợi ý'}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description || 'Không có mô tả'}</p>
                </div>
              </div>
            ))}
            {(data.recommendations || []).length === 0 && (
              <p className="text-sm text-gray-500">Không có gợi ý nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
