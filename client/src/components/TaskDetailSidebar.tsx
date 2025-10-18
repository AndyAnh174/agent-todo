"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  StarIcon,
  SunIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon as XIcon,
  TagIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import TodoTags from "./TodoTags";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_time?: string;
  is_completed: boolean;
  is_important: boolean;
  user_id?: string;
  group_id?: string;
  tags?: Array<{
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
  }>;
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
  onDelete,
}: TaskDetailSidebarProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  // due date picker state (declare early so hooks order is stable)
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [duePickerDate, setDuePickerDate] = useState<string | null>(null);
  const [duePickerTime, setDuePickerTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // CRUD states
  const [availableTags, setAvailableTags] = useState<Array<{id: string; name: string}>>([]);
  const [availableGroups, setAvailableGroups] = useState<Array<{id: string; name: string}>>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const showToast = (msg: string, ms = 2500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), ms);
  };

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      // open directly in edit mode
      setIsEditing(true);
    }
  }, [task]);

  // Load available tags and groups
  useEffect(() => {
    const loadTagsAndGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        
        // Load tags
        const tagsRes = await fetch(`${base}/api/v1/tags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tagsRes.ok) {
          const tags = await tagsRes.json();
          setAvailableTags(tags);
        }

        // Load groups
        const groupsRes = await fetch(`${base}/api/v1/groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (groupsRes.ok) {
          const groups = await groupsRes.json();
          setAvailableGroups(groups);
        }
      } catch (err) {
        console.error("Error loading tags/groups:", err);
      }
    };

    if (isOpen) {
      loadTagsAndGroups();
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  // Save only the description field (used by the Save button under the note textarea)
  const handleSaveDescription = async () => {
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
        body: JSON.stringify({ description: editedTask.description }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update description");
        return;
      }

      const updated = await res.json();
      setEditedTask(updated);
      onUpdate(updated);
      setIsEditing(false);
      try {
        showToast("success!");
      } catch {}
    } catch (err) {
      console.error("Error updating description:", err);
      alert("Cannot connect to backend.");
    }
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
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
    if (!editedTask) return;
    const prev = { ...editedTask };
    const optimistic = {
      ...editedTask,
      is_important: !editedTask.is_important,
    };
    // optimistic local update
    setEditedTask(optimistic);
    try {
      onUpdate(optimistic);
    } catch (e) {}

    // persist to backend
    void (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please log in to update task.");
          setEditedTask(prev);
          onUpdate(prev);
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
            title: optimistic.title,
            description: optimistic.description,
            due_time: optimistic.due_time,
            is_important: optimistic.is_important,
            is_completed: optimistic.is_completed,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.detail || "Failed to update task");
          setEditedTask(prev);
          onUpdate(prev);
          return;
        }

        const updated = await res.json();
        setEditedTask(updated);
        onUpdate(updated);
      } catch (err) {
        console.error("toggleImportant error:", err);
        alert("Cannot connect to backend.");
        setEditedTask(prev);
        onUpdate(prev);
      }
    })();
  };

  const toggleCompleted = () => {
    if (!editedTask) return;
    const prev = { ...editedTask };
    const optimistic = {
      ...editedTask,
      is_completed: !editedTask.is_completed,
    };
    setEditedTask(optimistic);
    try {
      onUpdate(optimistic);
    } catch (e) {}

    void (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please log in to update task.");
          setEditedTask(prev);
          onUpdate(prev);
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
            title: optimistic.title,
            description: optimistic.description,
            due_time: optimistic.due_time,
            is_important: optimistic.is_important,
            is_completed: optimistic.is_completed,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.detail || "Failed to update task");
          setEditedTask(prev);
          onUpdate(prev);
          return;
        }

        const updated = await res.json();
        setEditedTask(updated);
        onUpdate(updated);
      } catch (err) {
        console.error("toggleCompleted error:", err);
        alert("Cannot connect to backend.");
        setEditedTask(prev);
        onUpdate(prev);
      }
    })();
  };

  // Save title when input blurs or on Enter. Uses same pattern as toggles.
  const handleSaveTitle = async () => {
    if (!editedTask) return;
    // if title hasn't changed relative to incoming task prop, skip
    if (editedTask.title === task?.title) {
      return;
    }

    const prev = { ...editedTask, title: task?.title ?? editedTask.title };
    const optimistic = { ...editedTask };
    setEditedTask(optimistic);
    try {
      onUpdate(optimistic);
    } catch (e) {}

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to update task.");
        setEditedTask(prev);
        onUpdate(prev);
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
          title: optimistic.title,
          description: optimistic.description,
          due_time: optimistic.due_time,
          is_important: optimistic.is_important,
          is_completed: optimistic.is_completed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update title");
        setEditedTask(prev);
        onUpdate(prev);
        return;
      }

      const updated = await res.json();
      setEditedTask(updated);
      onUpdate(updated);
    } catch (err) {
      console.error("handleSaveTitle error:", err);
      alert("Cannot connect to backend.");
      setEditedTask(prev);
      onUpdate(prev);
    }
  };

  const handleAddToMyDay = async () => {
    if (!editedTask) return;

    const prev = { ...editedTask };
    const nowIso = new Date().toISOString();
    const optimistic = { ...editedTask, due_time: nowIso };

    // optimistic update locally and inform parent
    setEditedTask(optimistic);
    try {
      onUpdate(optimistic);
      try {
        showToast("success!");
      } catch {}
    } catch (e) {
      // parent may not expect optimistic update, continue
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to update task.");
        // rollback
        setEditedTask(prev);
        onUpdate(prev);
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
          due_time: nowIso,
          is_important: editedTask.is_important,
          is_completed: editedTask.is_completed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to add to My Day");
        // rollback
        setEditedTask(prev);
        onUpdate(prev);
        return;
      }

      const updated = await res.json();
      setEditedTask(updated);
      onUpdate(updated);
      // show success toast
      try {
        showToast("Success!");
      } catch {}
    } catch (err) {
      console.error("Add to My Day error:", err);
      alert("Cannot connect to backend.");
      // rollback
      setEditedTask(prev);
      onUpdate(prev);
    }
  };

  const handleSetDueDate = async () => {
    if (!editedTask || !duePickerDate) return;

    const prev = { ...editedTask };
    // Interpret the selected date/time as local time (date + optional time)
    const [year, month, day] = (duePickerDate || "").split("-").map(Number);
    let hours = 0;
    let minutes = 0;
    if (duePickerTime) {
      const [hh, mm] = duePickerTime.split(":").map(Number);
      hours = hh || 0;
      minutes = mm || 0;
    }
    const iso = new Date(
      year,
      (month || 1) - 1,
      day || 1,
      hours,
      minutes,
      0
    ).toISOString();

    const optimistic = { ...editedTask, due_time: iso };
    setEditedTask(optimistic);
    try {
      onUpdate(optimistic);
      try {
        showToast("success!");
      } catch {}
    } catch (e) {}

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to update task.");
        setEditedTask(prev);
        onUpdate(prev);
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
          due_time: iso,
          is_important: editedTask.is_important,
          is_completed: editedTask.is_completed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to set due date");
        setEditedTask(prev);
        onUpdate(prev);
        return;
      }

      const updated = await res.json();
      setEditedTask(updated);
      onUpdate(updated);
      setShowDuePicker(false);
      setDuePickerDate(null);
      setDuePickerTime(null);
      try {
        showToast("success!");
      } catch {}
    } catch (err) {
      console.error("Set due date error:", err);
      alert("Cannot connect to backend.");
      setEditedTask(prev);
      onUpdate(prev);
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
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch {
      return "";
    }
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch {
      return "";
    }
  };

  // CRUD Functions
  const handleCreateTag = async () => {
    if (!newTagName.trim() || !editedTask) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      // Create new tag
      const res = await fetch(`${base}/api/v1/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags(prev => [...prev, newTag]);
        setNewTagName("");
        showToast("Tag created successfully!");
      }
    } catch (err) {
      console.error("Error creating tag:", err);
      showToast("Error creating tag");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !editedTask) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      // Create new group
      const res = await fetch(`${base}/api/v1/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        setAvailableGroups(prev => [...prev, newGroup]);
        setNewGroupName("");
        showToast("Group created successfully!");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      showToast("Error creating group");
    }
  };

  const handleToggleTag = async (tagId: string) => {
    if (!editedTask) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const isCurrentlyTagged = editedTask.tags?.some(tag => tag.id === tagId);
      
      if (isCurrentlyTagged) {
        // Remove tag
        const res = await fetch(`${base}/api/v1/todos/${editedTask.id}/tags/${tagId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const updatedTask = { ...editedTask };
          updatedTask.tags = updatedTask.tags?.filter(tag => tag.id !== tagId) || [];
          setEditedTask(updatedTask);
          onUpdate(updatedTask);
          showToast("Tag removed!");
        }
      } else {
        // Add tag
        const res = await fetch(`${base}/api/v1/todos/${editedTask.id}/tags?tag_id=${tagId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const updatedTask = { ...editedTask };
          const tagToAdd = availableTags.find(tag => tag.id === tagId);
          if (tagToAdd) {
            updatedTask.tags = [...(updatedTask.tags || []), tagToAdd];
            setEditedTask(updatedTask);
            onUpdate(updatedTask);
            showToast("Tag added!");
          }
        }
      }
    } catch (err) {
      console.error("Error toggling tag:", err);
      showToast("Error updating tag");
    }
  };

  const handleChangeGroup = async (groupId: string) => {
    if (!editedTask) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const res = await fetch(`${base}/api/v1/todos/${editedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ group_id: groupId }),
      });

      if (res.ok) {
        const updatedTask = { ...editedTask, group_id: groupId };
        setEditedTask(updatedTask);
        onUpdate(updatedTask);
        showToast("Group updated!");
      }
    } catch (err) {
      console.error("Error changing group:", err);
      showToast("Error updating group");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      suppressHydrationWarning
    >
      <div className="absolute inset-0 bg-white/45" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-50">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded shadow">
              {toastMessage}
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">Task Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-gray-100 rounded-full"
              title={isEditing ? "View mode" : "Edit mode"}
            >
              {isEditing ? (
                <XIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <PencilIcon className="w-4 h-4 text-blue-600" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
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
                  onBlur={() => void handleSaveTitle()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSaveTitle();
                    }
                  }}
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleAddToMyDay();
              }}
              className="w-full hover:bg-gray-200 flex items-center gap-2 p-2 rounded"
            >
              <SunIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-700">Add to My Day</span>
            </button>

            <div className="w-full hover:bg-gray-200 flex items-center gap-2 p-2 rounded cursor-pointer">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-700">Remind me</span>
            </div>

            <div>
              {!showDuePicker ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // prefill with existing due date if present
                    if (editedTask?.due_time) {
                      try {
                        const d = new Date(editedTask.due_time);
                        const isoDate = d.toISOString().slice(0, 10);
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        setDuePickerDate(isoDate);
                        setDuePickerTime(`${hh}:${mm}`);
                      } catch {}
                    } else {
                      const now = new Date();
                      const todayIso = now.toISOString().slice(0, 10);
                      const hh = String(now.getHours()).padStart(2, "0");
                      const mm = String(now.getMinutes()).padStart(2, "0");
                      setDuePickerDate(todayIso);
                      setDuePickerTime(`${hh}:${mm}`);
                    }
                    setShowDuePicker(true);
                  }}
                  className="w-full hover:bg-gray-200 flex items-center gap-2 p-2 rounded"
                >
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-700">Add due date</span>
                </button>
              ) : (
                <div className="p-2 bg-gray-200 rounded space-y-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={duePickerDate || ""}
                      onChange={(e) => setDuePickerDate(e.target.value)}
                      className="text-sm p-1 bg-white rounded"
                    />
                    <input
                      type="time"
                      value={duePickerTime || ""}
                      onChange={(e) => setDuePickerTime(e.target.value)}
                      className="text-sm p-1 bg-white rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleSetDueDate();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDuePicker(false);
                        setDuePickerDate(null);
                        setDuePickerTime(null);
                      }}
                      className="px-3 py-1 bg-white rounded text-sm hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Add note
            </label>
            {isEditing ? (
              <>
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
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium shadow-md"
                  >
                    Save Note
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full p-2 border border-gray-300 rounded-lg min-h-[64px] text-gray-500">
                {task.description || "Add a note..."}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <TagIcon className="w-3 h-3" />
                Manage
              </button>
            </div>
            
            {editedTask?.tags && editedTask.tags.length > 0 && (
              <TodoTags tags={editedTask.tags} />
            )}
            
            {showTagManager && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  {/* Create new tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="New tag name"
                      className="flex-1 text-xs px-2 py-1 border rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                    />
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckIcon className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Available tags */}
                  <div className="max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-600 mb-1">Available tags:</div>
                    <div className="space-y-1">
                      {availableTags.map(tag => {
                        const isTagged = editedTask?.tags?.some(t => t.id === tag.id);
                        return (
                          <div key={tag.id} className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTag(tag.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isTagged 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-gray-300'
                              }`}
                            >
                              {isTagged && <CheckIcon className="w-2 h-2" />}
                            </button>
                            <span className="text-xs">{tag.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Due Date */}
          {editedTask?.due_time && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg w-fit">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span>{formatDate(editedTask.due_time)}</span>
              </div>
            </div>
          )}

          {/* Group */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Group
              </label>
              <button
                onClick={() => setShowGroupManager(!showGroupManager)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <FolderIcon className="w-3 h-3" />
                Manage
              </button>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
              {editedTask?.group_id ? 
                availableGroups.find(g => g.id === editedTask.group_id)?.name || 'Unknown Group' :
                'No group assigned'
              }
            </div>
            
            {showGroupManager && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  {/* Create new group */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New group name"
                      className="flex-1 text-xs px-2 py-1 border rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateGroup();
                        }
                      }}
                    />
                    <button
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Available groups */}
                  <div className="max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-600 mb-1">Available groups:</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleChangeGroup('')}
                        className={`w-full text-left px-2 py-1 text-xs rounded ${
                          !editedTask?.group_id 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        No Group
                      </button>
                      {availableGroups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => handleChangeGroup(group.id)}
                          className={`w-full text-left px-2 py-1 text-xs rounded ${
                            editedTask?.group_id === group.id 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save (left) and Delete (right) */}
          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm bg-red-600 hover:bg-red-700 rounded-md font-medium shadow-sm"
              aria-label="Delete task"
            >
              Delete Task
            </button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-md p-4 shadow-md w-72">
              <div className="text-sm font-medium mb-3">Confirm delete</div>
              <div className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-sm text-gray-700">
            {formatDateOnly(task.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
