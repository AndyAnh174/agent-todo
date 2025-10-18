"use client";

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  StarIcon,
  ClockIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import type { SmartInsights as SmartInsightsType } from '@/types';
import { apiService } from '@/services/api';
import { checkServerHealth, checkAuth } from '@/utils/healthCheck';

interface SmartInsightsProps {
  className?: string;
}

export default function SmartInsights({ className = '' }: SmartInsightsProps) {
  const [insights, setInsights] = useState<SmartInsightsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication first
      if (!checkAuth()) {
        setError('Vui lòng đăng nhập để xem insights');
        return;
      }

      // Check server health
      const healthCheck = await checkServerHealth();
      if (!healthCheck.isHealthy) {
        setError(`Server không khả dụng: ${healthCheck.error}`);
        return;
      }

      const data = await apiService.getSmartInsights();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProductivityBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Smart Insights</h2>
      </div>

      {/* Productivity Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Điểm năng suất</span>
          <span className={`text-2xl font-bold ${getProductivityColor(insights.productivity_score)}`}>
            {insights.productivity_score.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProductivityBgColor(insights.productivity_score)}`}
            style={{ width: `${Math.min(insights.productivity_score, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Hoàn thành</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.completed_todos}</div>
          <div className="text-xs text-gray-500">/{insights.total_todos} tasks</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <StarIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Quan trọng</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.important_todos}</div>
          <div className="text-xs text-gray-500">tasks</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Quá hạn</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.overdue_todos}</div>
          <div className="text-xs text-gray-500">tasks</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Tỷ lệ</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.completion_rate}%</div>
          <div className="text-xs text-gray-500">hoàn thành</div>
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-gray-900">Gợi ý thông minh</h3>
          </div>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md"
              >
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={loadInsights}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
}
