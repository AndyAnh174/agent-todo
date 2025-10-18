"use client";

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TagsManager from '@/components/TagsManager';
import { 
  TagIcon, 
  Bars3Icon
} from '@heroicons/react/24/outline';

export default function TagsPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          <div className="w-full h-full bg-gradient-to-b from-blue-500 to-blue-700 text-white relative overflow-hidden">
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
                  <TagIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Quản lý Tags</h1>
                </div>
                <p className="mt-2 text-lg text-blue-100">
                  Tổ chức và quản lý các thẻ phân loại cho tasks
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-4">
              <div className="p-4 max-w-6xl mx-auto">
                <div className="h-[70vh] md:h-[55vh] lg:h-[65vh] overflow-y-auto custom-scroll pr-2">
                  <TagsManager />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
