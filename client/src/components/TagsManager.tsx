"use client";

import { useState, useEffect } from 'react';
import { 
  TagIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Tag, TagFormData } from '@/types';
import { apiService } from '@/services/api';

interface TagsManagerProps {
  className?: string;
  onTagSelect?: (tag: Tag) => void;
  selectedTags?: Tag[];
  showSelectedOnly?: boolean;
}

export default function TagsManager({ 
  className = '', 
  onTagSelect,
  selectedTags = [],
  showSelectedOnly = false
}: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>({ name: '' });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTags();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const newTag = await apiService.createTag(formData);
      setTags(prev => [newTag, ...prev]);
      setFormData({ name: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo tag');
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !formData.name.trim()) return;

    try {
      const updatedTag = await apiService.updateTag(editingTag.id, formData);
      setTags(prev => prev.map(tag => tag.id === editingTag.id ? updatedTag : tag));
      setEditingTag(null);
      setFormData({ name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật tag');
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`Bạn có chắc muốn xóa tag "${tag.name}"?`)) return;

    try {
      await apiService.deleteTag(tag.id);
      setTags(prev => prev.filter(t => t.id !== tag.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tag');
    }
  };

  const handleTagClick = (tag: Tag) => {
    onTagSelect?.(tag);
  };

  const isTagSelected = (tag: Tag) => {
    return selectedTags.some(selectedTag => selectedTag.id === tag.id);
  };

  const displayTags = showSelectedOnly ? selectedTags : tags;

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
          <TagIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showSelectedOnly ? 'Tags đã chọn' : 'Quản lý Tags'}
          </h3>
        </div>
        {!showSelectedOnly && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Thêm tag</span>
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
      {(showCreateForm || editingTag) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {editingTag ? 'Chỉnh sửa tag' : 'Tạo tag mới'}
            </h4>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingTag(null);
                setFormData({ name: '' });
              }}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag}>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Nhập tên tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingTag ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      {displayTags.length === 0 ? (
        <div className="text-center py-8">
          <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {showSelectedOnly ? 'Chưa có tag nào được chọn' : 'Chưa có tag nào'}
          </p>
          {!showSelectedOnly && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tạo tag đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isTagSelected(tag)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isTagSelected(tag) ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="font-medium text-gray-900">{tag.name}</span>
                {tag.created_at && (
                  <span className="text-xs text-gray-500">
                    {new Date(tag.created_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              
              {!showSelectedOnly && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTag(tag);
                      setFormData({ name: tag.name });
                    }}
                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag)}
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
            onClick={loadTags}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Làm mới danh sách
          </button>
        </div>
      )}
    </div>
  );
}
