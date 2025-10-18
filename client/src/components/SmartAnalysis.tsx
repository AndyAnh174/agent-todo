"use client";

import { useState } from 'react';
import { 
  SparklesIcon, 
  TagIcon, 
  CalendarIcon, 
  StarIcon,
  ClockIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { SmartAnalysis as SmartAnalysisType } from '@/types';
import { apiService } from '@/services/api';
import { checkServerHealth, checkAuth } from '@/utils/healthCheck';

interface SmartAnalysisProps {
  title: string;
  description?: string;
  onAnalysisComplete?: (analysis: SmartAnalysisType) => void;
  onClose?: () => void;
  className?: string;
}

export default function SmartAnalysis({ 
  title, 
  description = '', 
  onAnalysisComplete,
  onClose,
  className = '' 
}: SmartAnalysisProps) {
  const [analysis, setAnalysis] = useState<SmartAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication first
      if (!checkAuth()) {
        setError('Vui lòng đăng nhập để sử dụng tính năng phân tích');
        return;
      }

      // Check server health
      const healthCheck = await checkServerHealth();
      if (!healthCheck.isHealthy) {
        setError(`Server không khả dụng: ${healthCheck.error}`);
        return;
      }

      const data = await apiService.analyzeTodoContent(title, description);
      setAnalysis(data);
      onAnalysisComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể phân tích nội dung');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }
    return `${hours} giờ ${remainingMinutes} phút`;
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">Phân tích thông minh</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Analysis Button */}
        {!analysis && (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Phân tích nội dung task
            </h4>
            <p className="text-gray-500 mb-6">
              AI sẽ phân tích và đưa ra gợi ý thông minh cho task của bạn
            </p>
            <button
              onClick={analyzeContent}
              disabled={loading || !title.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-4 text-sm">
              {typeof error === 'string' ? error : 'Có lỗi xảy ra khi phân tích'}
            </div>
            <button
              onClick={analyzeContent}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Priority */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StarIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Độ ưu tiên</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(analysis.suggested_priority)}`}>
                {getPriorityText(analysis.suggested_priority)}
              </span>
            </div>

            {/* Suggested Tags */}
            {analysis.suggested_tags && analysis.suggested_tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Tags gợi ý</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggested_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Deadline */}
            {analysis.suggested_deadline && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Deadline gợi ý</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(analysis.suggested_deadline).toLocaleString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {/* Complexity & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChartBarIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Độ phức tạp</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{analysis.complexity_score}/10</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(analysis.complexity_score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Thời gian ước tính</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(analysis.estimated_duration)}
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Độ tin cậy phân tích</span>
                <span className="text-sm font-medium text-gray-600">
                  {formatConfidence(analysis.confidence)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Re-analyze Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={analyzeContent}
                className="w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
              >
                Phân tích lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
