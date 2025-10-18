"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SmartInsights from '@/components/SmartInsights';
import ServerStatus from '@/components/ServerStatus';
import SlashCommandExamples from '@/components/SlashCommandExamples';
import { 
  ChartBarIcon, 
  Bars3Icon,
  BellIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { SmartInsights as SmartInsightsType } from '@/types';
import { apiService } from '@/services/api';

export default function Dashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [insights, setInsights] = useState<SmartInsightsType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSmartInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-white/45 bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative bg-white w-64 h-full shadow-xl">
            <Sidebar
              onClose={() => setIsMobileSidebarOpen(false)}
              showCloseButton={true}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-screen overflow-hidden">
        <section className="relative w-full h-screen">
          <div className="w-full h-full bg-gradient-to-b from-indigo-500 to-purple-600 text-white relative overflow-hidden">
            {/* Header */}
            <div className="px-4">
              <div className="p-4 max-w-6xl mx-auto">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md hover:bg-white/20 transition-colors mb-2"
                >
                  <Bars3Icon className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                </div>
                <p className="mt-2 text-lg text-indigo-100">
                  Tổng quan năng suất và thống kê thông minh
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-4">
              <div className="p-4 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-[70vh] md:h-[55vh] lg:h-[65vh] overflow-y-auto custom-scroll pr-2">
                  {/* Smart Insights */}
                  <div className="lg:col-span-2 xl:col-span-2">
                    <SmartInsights />
                  </div>

                  {/* Server Status */}
                  <div>
                    <ServerStatus />
                  </div>

                  {/* Slash Commands Examples */}
                  <div className="lg:col-span-2 xl:col-span-1">
                    <SlashCommandExamples />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <SparklesIcon className="w-6 h-6 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push('/myday')}
                        className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">M</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">My Day</div>
                          <div className="text-sm text-gray-500">Xem tasks hôm nay</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/important')}
                        className="w-full flex items-center gap-3 p-3 text-left bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">I</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Important</div>
                          <div className="text-sm text-gray-500">Tasks quan trọng</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/planned')}
                        className="w-full flex items-center gap-3 p-3 text-left bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">P</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Planned</div>
                          <div className="text-sm text-gray-500">Tasks đã lên kế hoạch</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/task')}
                        className="w-full flex items-center gap-3 p-3 text-left bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">T</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">All Tasks</div>
                          <div className="text-sm text-gray-500">Tất cả tasks</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Notifications Preview */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <BellIcon className="w-6 h-6 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                    </div>
                    
                    <div className="text-center py-8">
                      <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Chưa có thông báo mới</p>
                      <button
                        onClick={() => router.push('/notifications')}
                        className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                      >
                        Xem tất cả
                      </button>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CogIcon className="w-6 h-6 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Cài đặt</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push('/settings')}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CogIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Preferences</div>
                          <div className="text-sm text-gray-500">Cài đặt cá nhân</div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/automation')}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <SparklesIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Automation</div>
                          <div className="text-sm text-gray-500">Quy tắc tự động</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
