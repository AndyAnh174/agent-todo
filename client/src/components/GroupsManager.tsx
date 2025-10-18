"use client";

import { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Group, GroupFormData } from '@/types';
import { apiService } from '@/services/api';

interface GroupsManagerProps {
  className?: string;
  onGroupSelect?: (group: Group) => void;
  selectedGroup?: Group | null;
  showSelectedOnly?: boolean;
}

export default function GroupsManager({ 
  className = '', 
  onGroupSelect,
  selectedGroup,
  showSelectedOnly = false
}: GroupsManagerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GroupFormData>({ name: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const newGroup = await apiService.createGroup(formData);
      setGroups(prev => [newGroup, ...prev]);
      setFormData({ name: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo group');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !formData.name.trim()) return;

    try {
      const updatedGroup = await apiService.updateGroup(editingGroup.id, formData);
      setGroups(prev => prev.map(group => group.id === editingGroup.id ? updatedGroup : group));
      setEditingGroup(null);
      setFormData({ name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật group');
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Bạn có chắc muốn xóa group "${group.name}"?`)) return;

    try {
      await apiService.deleteGroup(group.id);
      setGroups(prev => prev.filter(g => g.id !== group.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa group');
    }
  };

  const handleGroupClick = (group: Group) => {
    onGroupSelect?.(group);
  };

  const isGroupSelected = (group: Group) => {
    return selectedGroup?.id === group.id;
  };

  const displayGroups = showSelectedOnly && selectedGroup ? [selectedGroup] : groups;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showSelectedOnly ? 'Group đã chọn' : 'Quản lý Groups'}
          </h3>
        </div>
        {!showSelectedOnly && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Thêm group</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingGroup) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {editingGroup ? 'Chỉnh sửa group' : 'Tạo group mới'}
            </h4>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingGroup(null);
                setFormData({ name: '' });
              }}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Nhập tên group..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingGroup ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups List */}
      {displayGroups.length === 0 ? (
        <div className="text-center py-8">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {showSelectedOnly ? 'Chưa có group nào được chọn' : 'Chưa có group nào'}
          </p>
          {!showSelectedOnly && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Tạo group đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayGroups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                isGroupSelected(group)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleGroupClick(group)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isGroupSelected(group) ? 'bg-green-600' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="font-medium text-gray-900">{group.name}</span>
                {group.created_at && (
                  <span className="text-xs text-gray-500">
                    {new Date(group.created_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              
              {!showSelectedOnly && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setFormData({ name: group.name });
                    }}
                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group);
                    }}
                    className="p-1 hover:bg-red-100 rounded-md transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {!showSelectedOnly && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={loadGroups}
            className="w-full px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
          >
            Làm mới danh sách
          </button>
        </div>
      )}
    </div>
  );
}
