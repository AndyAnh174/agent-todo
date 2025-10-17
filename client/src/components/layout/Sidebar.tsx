import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Star, 
  CheckSquare, 
  List, 
  Plus, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { useTodoStore } from '@/store/todo';
import type { GroupCreateRequest } from '@/types';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { path: '/dashboard/my-day', label: 'My Day', icon: Calendar },
  { path: '/dashboard/important', label: 'Important', icon: Star },
  { path: '/dashboard/planned', label: 'Planned', icon: Calendar },
  { path: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { createGroup } = useTodoStore() as any; // reuse todo store typing baseline
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-semibold text-gray-900">To Do</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Lists Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Lists
            </h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            onClick={() => setGroupOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Lists will be populated here */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-xs text-gray-400 px-3 py-1">
              No lists yet
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",
            location.pathname === '/settings' && "bg-blue-50 text-blue-700"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Create Group Modal */}
      <Modal
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        title="Create list"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={async () => {
              const name = groupName.trim();
              if (!name) return;
              try {
                await (useTodoStore.getState() as any).createGroup?.({ name } as GroupCreateRequest);
              } catch {}
              setGroupName('');
              setGroupOpen(false);
            }}>Create</Button>
          </div>
        )}
      >
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="List name"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </Modal>
    </div>
  );
}
