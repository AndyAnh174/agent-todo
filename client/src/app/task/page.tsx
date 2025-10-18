"use client";

import {
  HomeIcon,
  StarIcon as StarOutline,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import TaskDetailSidebar from "@/components/TaskDetailSidebar";
import TodoTags from "@/components/TodoTags";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isOverdue, isDueToday, getDueDateStatus } from "@/utils/dateUtils";

// Sortable Task Component
function SortableTask({
  todo,
  handleTaskClick,
  handleToggleComplete,
  handleToggleImportant,
}: {
  todo: any;
  handleTaskClick: (task: any) => void;
  handleToggleComplete: (todo: any) => void;
  handleToggleImportant: (todo: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dueStatus = getDueDateStatus(todo.due_time);
  const isOverdueTodo = dueStatus === 'overdue';
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 touch-none ${
        isOverdueTodo 
          ? 'bg-red-50 border-l-4 border-red-500' 
          : 'bg-white'
      }`}
      onClick={() => handleTaskClick(todo)}
    >
      <div className="flex items-start gap-3">
        <div
          onClick={(e) => {
            e.stopPropagation();
            void handleToggleComplete(todo);
          }}
          className={`w-5 h-5 border rounded-full mt-1 flex items-center justify-center ${
            todo.is_completed
              ? "bg-blue-600 border-blue-600"
              : "border-gray-300"
          }`}
        >
          {todo.is_completed && (
            <svg
              className="w-3 h-3 text-white"
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
        </div>
        <div>
          <div
            className={`font-medium ${
              todo.is_completed 
                ? "line-through text-gray-500" 
                : isOverdueTodo 
                  ? "text-red-600 font-semibold" 
                  : "text-black"
            }`}
          >
            {todo.title}
            {isOverdueTodo && !todo.is_completed && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                QUÁ HẠN
              </span>
            )}
          </div>
          <TodoTags tags={todo.tags} />
        </div>
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleImportant(todo);
        }}
        className={`${todo.is_important ? "text-yellow-500" : "text-gray-400"}`}
        role="button"
        aria-pressed={todo.is_important}
      >
        {todo.is_important ? (
          <StarSolid className="w-5 h-5" aria-hidden />
        ) : (
          <StarOutline className="w-5 h-5" aria-hidden />
        )}
      </div>
    </div>
  );
}

export default function Task() {
  const [todos, setTodos] = useState<Array<any>>([]);
  const [localTodosOrder, setLocalTodosOrder] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Cần kéo 8px mới bắt đầu drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const url = `${base}/api/v1/todos?limit=50`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setTodos(data);
      } catch (e) {
        console.error(e);
      }
    }
    load();

    function onCreated(e: any) {
      const created = e?.detail;
      if (created) {
        setTodos((t) => [created, ...t]);
        // Add to front of local order if it's not completed
        if (!created.is_completed) {
          setLocalTodosOrder(prev => [created.id, ...prev]);
        }
      }
    }

    function onUpdated(e: any) {
      const updated = e?.detail;
      if (updated) {
        setTodos((prevTodos) =>
          prevTodos.map((todo) => (todo.id === updated.id ? updated : todo))
        );
        // Remove from local order if completed
        if (updated.is_completed) {
          setLocalTodosOrder(prev => prev.filter(id => id !== updated.id));
        }
      }
    }

    window.addEventListener("todo:created", onCreated as EventListener);
    window.addEventListener("todo:updated", onUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("todo:created", onCreated as EventListener);
      window.removeEventListener("todo:updated", onUpdated as EventListener);
    };
  }, []);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = (updatedTask: any) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === updatedTask.id ? updatedTask : todo))
    );
    // keep the sidebar focused on the updated task
    setSelectedTask(updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== taskId));
  };

  // optimistic toggle for completion
  const handleToggleComplete = async (todo: any) => {
    const prev = todos;
    const nextCompleted = !todo.is_completed;
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t.id === todo.id ? { ...t, is_completed: nextCompleted } : t
      )
    );
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${base}/api/v1/todos/${todo.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_completed: nextCompleted }),
      });
      if (!res.ok) {
        let body = "";
        try {
          body = await res.text();
        } catch (e) {}
        throw new Error(`Persist complete failed: ${res.status} ${body}`);
      }
      const updated = await res.json();
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error(err);
      setTodos(prev);
    }
  };

  const handleToggleImportant = async (todo: any) => {
    const prev = todos;
    const nextImportant = !todo.is_important;
    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t.id === todo.id ? { ...t, is_important: nextImportant } : t
      )
    );
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${base}/api/v1/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_important: nextImportant }),
      });
      if (!res.ok) throw new Error(`Persist important failed: ${res.status}`);
      const updated = await res.json();
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error(err);
      setTodos(prev);
    }
  };

  const completedTodos = todos.filter((t) => t.is_completed);
  
  // Apply local ordering to active todos
  const unorderedActiveTodos = todos.filter((t) => !t.is_completed);
  const activeTodos =
    localTodosOrder.length > 0
      ? localTodosOrder
          .map((id) => unorderedActiveTodos.find((todo) => todo.id === id))
          .filter(Boolean)
          .concat(
            unorderedActiveTodos.filter(
              (todo) => !localTodosOrder.includes(todo.id)
            )
          )
      : unorderedActiveTodos;

  // Persist todo order to backend
  const persistTodoOrder = async (todoIds: string[]) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const res = await fetch(`${base}/api/v1/todos/order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(todoIds),
      });

      if (!res.ok) {
        // Only log error if it's not a 500 (server error) or 422 (validation error)
        if (res.status !== 500 && res.status !== 422) {
          console.error("Failed to persist todo order:", res.statusText);
        }
      }
    } catch (err) {
      // Only log error if it's not a network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network error, server might be down
        return;
      }
      console.error("Error persisting todo order:", err);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activeTodos.findIndex((item) => item.id === active.id);
    const newIndex = activeTodos.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newActiveTodos = arrayMove(activeTodos, oldIndex, newIndex);
      const newOrder = newActiveTodos.map((todo) => todo.id);

      // Update local order state
      setLocalTodosOrder(newOrder);

      // Persist the new order to backend
      persistTodoOrder(newOrder);
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
          <div className="w-full h-full bg-gradient-to-b from-sky-400 to-sky-200 text-black relative overflow-hidden">
            <div className="px-4">
              <div className="p-4 max-w-4xl mx-auto">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md hover:bg-sky-600 hover:bg-opacity-20 transition-colors mb-2"
                >
                  <Bars3Icon className="w-6 h-6 text-sky-700" />
                </button>
                <div className="flex items-center gap-3">
                  <HomeIcon className="w-6 h-6 text-sky-700" />
                  <h1 className="text-2xl font-semibold text-sky-700">Tasks</h1>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="p-4 max-w-4xl mx-auto">
                <div className="space-y-2 h-[70vh] md:h-[55vh] lg:h-[65vh] overflow-y-auto custom-scroll pr-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={activeTodos.map((todo) => todo.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {activeTodos.map((todo: any) => (
                        <SortableTask
                          key={todo.id}
                          todo={todo}
                          handleTaskClick={handleTaskClick}
                          handleToggleComplete={handleToggleComplete}
                          handleToggleImportant={handleToggleImportant}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {completedTodos.length > 0 && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => setShowCompleted((s) => !s)}
                        className="flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm"
                      >
                        <ChevronDownIcon
                          className={`w-4 h-4 transform ${
                            showCompleted ? "rotate-0" : "-rotate-90"
                          }`}
                          aria-hidden
                        />
                        <span className="font-medium">Completed</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {completedTodos.length}
                        </span>
                      </button>

                      {showCompleted && (
                        <div className="mt-3 space-y-2">
                          {completedTodos.map((todo: any) => {
                            const dueStatus = getDueDateStatus(todo.due_time);
                            const isOverdueTodo = dueStatus === 'overdue';
                            
                            return (
                            <div
                              key={todo.id}
                              className={`rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                isOverdueTodo 
                                  ? 'bg-red-50 border-l-4 border-red-500' 
                                  : 'bg-white'
                              }`}
                              onClick={() => handleTaskClick(todo)}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleToggleComplete(todo);
                                  }}
                                  className={`w-5 h-5 border rounded-full mt-1 flex items-center justify-center ${
                                    todo.is_completed
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {todo.is_completed && (
                                    <svg
                                      className="w-3 h-3 text-white"
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
                                </div>
                                <div>
                                  <div
                                    className={`font-medium ${
                                      todo.is_completed
                                        ? isOverdueTodo 
                                          ? "line-through text-red-500"
                                          : "line-through text-gray-500"
                                        : isOverdueTodo 
                                          ? "text-red-600 font-semibold"
                                          : "text-black"
                                    }`}
                                  >
                                    {todo.title}
                                    {isOverdueTodo && !todo.is_completed && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                        QUÁ HẠN
                                      </span>
                                    )}
                                  </div>
                                  <TodoTags tags={todo.tags} />
                                </div>
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleToggleImportant(todo);
                                }}
                                className={`${
                                  todo.is_important
                                    ? "text-yellow-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {todo.is_important ? (
                                  <StarSolid className="w-5 h-5" aria-hidden />
                                ) : (
                                  <StarOutline
                                    className="w-5 h-5"
                                    aria-hidden
                                  />
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-20 px-4 md:px-8 z-10">
            <div className="p-4 max-w-4xl mx-auto">
              <TaskInput />
            </div>
          </div>
        </section>
      </div>

      <TaskDetailSidebar
        task={selectedTask}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
