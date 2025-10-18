"use client";

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { checkServerHealth, getApiBaseUrl } from '@/utils/healthCheck';

interface ServerStatusProps {
  className?: string;
}

export default function ServerStatus({ className = '' }: ServerStatusProps) {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      const healthCheck = await checkServerHealth();
      if (healthCheck.isHealthy) {
        setStatus('healthy');
        setError(null);
      } else {
        setStatus('unhealthy');
        setError(healthCheck.error || 'Server không khả dụng');
      }
    } catch (err) {
      setStatus('unhealthy');
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
    
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'healthy':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Đang kiểm tra...';
      case 'healthy':
        return 'Server hoạt động bình thường';
      case 'unhealthy':
        return 'Server không khả dụng';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600';
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <button
          onClick={checkStatus}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Kiểm tra lại
        </button>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}
      
      {lastChecked && (
        <div className="mt-2 text-xs text-gray-500">
          Kiểm tra lần cuối: {lastChecked.toLocaleTimeString('vi-VN')}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Server: {getApiBaseUrl()}
      </div>
    </div>
  );
}
