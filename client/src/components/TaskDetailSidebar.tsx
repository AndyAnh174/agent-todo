"use client";

import { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  StarIcon, 
  SunIcon, 
  ClockIcon, 
  CalendarIcon, 
  ArrowPathIcon, 
  PaperClipIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_time?: string;
  is_completed: boolean;
  is_important: boolean;
  user_id?: string;
  group_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailSidebar({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete 
}: TaskDetailSidebarProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!editedTask) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to update task.");
        return;
      }

      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      
      const res = await fetch(`${backend}/api/v1/todos/${editedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          due_time: editedTask.due_time,
          is_important: editedTask.is_important,
          is_completed: editedTask.is_completed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update task");
        return;
      }

      const updatedTask = await res.json();
      onUpdate(updatedTask);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Cannot connect to backend.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to delete task.");
        return;
      }

      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      
      const res = await fetch(`${backend}/api/v1/todos/${task.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to delete task");
        return;
      }

      onDelete(task.id);
      onClose();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Cannot connect to backend.");
    }
  };

  const toggleImportant = () => {
    if (editedTask) {
      setEditedTask({ ...editedTask, is_important: !editedTask.is_important });
    }
  };

  const toggleCompleted = () => {
    if (editedTask) {
      setEditedTask({ ...editedTask, is_completed: !editedTask.is_completed });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getCreatedTime = () => {
    if (!task.created_at) return "";
    try {
      const created = new Date(task.created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return "Created just now";
      if (diffHours < 24) return `Created ${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Created ${diffDays} days ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Task Title and Actions */}
          <div className="flex items-start gap-3">
            <button
              onClick={toggleCompleted}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                editedTask?.is_completed 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "border-gray-300"
              }`}
            >
              {editedTask?.is_completed && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask?.title || ""}
                  onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full text-lg font-medium border-none outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              )}
            </div>
            
            <button
              onClick={toggleImportant}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {editedTask?.is_important ? (
                <StarSolidIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Add Step */}
          <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm">Add step</span>
          </div>

          {/* Task Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <SunIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Add to My Day</span>
            </div>
            
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Remind me</span>
            </div>
            
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Add due date</span>
            </div>
            
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <ArrowPathIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Repeat</span>
            </div>
            
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <PaperClipIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Add file</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add note
            </label>
            {isEditing ? (
              <textarea
                value={editedTask?.description || ""}
                onChange={(e) => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Add a note..."
              />
            ) : (
              <div className="w-full p-3 border border-gray-300 rounded-lg min-h-[80px] text-gray-500">
                {task.description || "Add a note..."}
              </div>
            )}
          </div>

          {/* Due Date */}
          {editedTask?.due_time && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due date
              </label>
              <div className="text-sm text-gray-600">
                {formatDate(editedTask.due_time)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {getCreatedTime()}
          </div>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
