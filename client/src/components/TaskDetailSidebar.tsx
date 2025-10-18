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
  const [isEditing, setIsEditing] = useState(true);

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

      const backend =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

      const backend =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      suppressHydrationWarning
    >
      <div className="absolute inset-0 bg-white/45" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-base font-medium text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          {/* Task Title and Actions */}
          <div className="flex items-start gap-3">
            <button
              onClick={toggleCompleted}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                editedTask?.is_completed
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300"
              }`}
            >
              {editedTask?.is_completed && (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask?.title || ""}
                  onChange={(e) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, title: e.target.value } : null
                    )
                  }
                  className="w-full text-sm font-medium border-none outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <h3 className="text-sm font-medium text-gray-900">
                  {task.title}
                </h3>
              )}
            </div>

            <button
              onClick={toggleImportant}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {editedTask?.is_important ? (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Task Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <SunIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-700">Add to My Day</span>
            </div>

            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-700">Remind me</span>
            </div>

            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-700">Add due date</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Add note
            </label>
            {isEditing ? (
              <textarea
                value={editedTask?.description || ""}
                onChange={(e) =>
                  setEditedTask((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Add a note..."
              />
            ) : (
              <div className="w-full p-2 border border-gray-300 rounded-lg min-h-[64px] text-gray-500">
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
          <div className="flex gap-2 pt-3">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Save
            </button>

            <button
              onClick={handleDelete}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-center">
          <div className="text-sm text-gray-700">
            {formatDateOnly(task.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
