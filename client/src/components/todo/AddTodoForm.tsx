import { useState } from 'react';
import { Plus, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { useTodoStore } from '@/store/todo';
import type { TodoCreateRequest, Group, Tag } from '@/types';

export function AddTodoForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<TodoCreateRequest>({
    title: '',
    description: '',
    is_important: false,
  });
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTodo, groups, tags, fetchGroups, fetchTags, createTag } = useTodoStore() as any;
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTodo(formData);
      setFormData({
        title: '',
        description: '',
        is_important: false,
      });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setFormData({
        title: '',
        description: '',
        is_important: false,
      });
      setShowDuePicker(false);
    }
  };

  // load groups/tags once expanded
  const ensureMeta = async () => {
    try { await fetchGroups?.(); } catch {}
    try { await fetchTags?.(); } catch {}
  };

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
          <Plus className="h-3 w-3 text-gray-400" />
        </div>
        <button
          onClick={() => { setIsExpanded(true); ensureMeta(); }}
          className="flex-1 text-left text-gray-500 hover:text-gray-700 transition-colors"
        >
          Add a task
        </button>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
        <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
          <Plus className="h-3 w-3 text-gray-400" />
        </div>
        <Input
          placeholder="Add a task"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          onKeyDown={handleKeyDown}
          autoFocus
          className="border-0 p-0 text-sm focus-visible:ring-0"
        />
      </div>

      {isExpanded && (
        <div className="ml-9 space-y-3">
          <Input
            placeholder="Add details"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />

          {/* Group select */}
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 w-20">List</label>
            <select
              className="flex-1 border rounded px-2 py-1"
              value={formData.group_id || ''}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value || undefined })}
            >
              <option value="">None</option>
              {(groups as Group[] | undefined)?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Tags multiselect simple */}
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tags</span>
              <Button variant="ghost" size="sm" onClick={() => setTagModalOpen(true)}>+ New tag</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(tags as Tag[] | undefined)?.map((t) => {
                const selected = (formData.tag_ids || []).includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={"px-2 py-1 rounded border text-xs " + (selected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600')}
                    onClick={() => {
                      const set = new Set(formData.tag_ids || []);
                      if (selected) set.delete(t.id); else set.add(t.id);
                      setFormData({ ...formData, tag_ids: Array.from(set) });
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormData({ ...formData, is_important: !formData.is_important })}
              className={formData.is_important ? "text-yellow-600" : "text-gray-500"}
            >
              <Star className="h-4 w-4 mr-1" />
              Important
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={() => setShowDuePicker((v) => !v)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Due date
            </Button>
          </div>

          {showDuePicker && (
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="datetime-local"
                value={formData.due_time ? new Date(formData.due_time).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setFormData({ ...formData, due_time: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                }
              />
              {formData.due_time && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, due_time: undefined })}>
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Recurrence */}
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <label className="text-gray-500 w-20">Repeat</label>
              <select
                className="border rounded px-2 py-1"
                value={formData.recurrence_pattern || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setFormData({ ...formData, recurrence_pattern: undefined, recurrence_interval: undefined });
                  } else if (val === 'custom') {
                    setFormData({ ...formData, recurrence_pattern: 'custom', recurrence_interval: 1 });
                  } else {
                    setFormData({ ...formData, recurrence_pattern: val, recurrence_interval: 1 });
                  }
                }}
              >
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom…</option>
              </select>
              {formData.recurrence_pattern && formData.recurrence_pattern !== '' && (
                <>
                  <span className="text-gray-500">every</span>
                  <input
                    type="number"
                    min={1}
                    className="w-20 border rounded px-2 py-1"
                    value={formData.recurrence_interval || 1}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <span className="text-gray-500">
                    {formData.recurrence_pattern === 'daily' && 'day(s)'}
                    {formData.recurrence_pattern === 'weekly' && 'week(s)'}
                    {formData.recurrence_pattern === 'monthly' && 'month(s)'}
                    {formData.recurrence_pattern === 'custom' && 'unit(s)'}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-gray-500 w-20" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, recurrence_pattern: 'daily', recurrence_interval: 1 })}>Daily</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, recurrence_pattern: 'weekly', recurrence_interval: 1 })}>Weekly</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, recurrence_pattern: 'monthly', recurrence_interval: 1 })}>Monthly</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, recurrence_pattern: undefined, recurrence_interval: undefined })}>None</Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!formData.title.trim() || isSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? 'Adding...' : 'Add task'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setFormData({
                  title: '',
                  description: '',
                  is_important: false,
                });
                setShowDuePicker(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </form>

    {/* Create Tag Modal */}
    <Modal
      open={tagModalOpen}
      onClose={() => setTagModalOpen(false)}
      title="Create tag"
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setTagModalOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={async () => {
            const name = newTagName.trim();
            if (!name) return;
            try { await createTag?.({ name }); await fetchTags?.(); } catch {}
            setNewTagName('');
            setTagModalOpen(false);
          }}>Create</Button>
        </div>
      )}
    >
      <input
        value={newTagName}
        onChange={(e) => setNewTagName(e.target.value)}
        placeholder="Tag name"
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </Modal>
    </>
  );
}
