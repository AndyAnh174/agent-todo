"use client";
import { CalendarIcon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import TaskDetailSidebar from "@/components/TaskDetailSidebar";
import { useEffect, useState } from "react";
import {
  StarIcon as StarOutline,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export default function Planned() {
  const [todos, setTodos] = useState<Array<any>>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showToday, setShowToday] = useState(true);
  const [showTomorrow, setShowTomorrow] = useState(true);
  const [showLater, setShowLater] = useState(true);
  const [showEarlier, setShowEarlier] = useState(true);
  const [noToken, setNoToken] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // load todos. If skipAuth is true we attempt to fetch without an Authorization header
    async function load(skipAuth = false) {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const token = skipAuth ? null : localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Cache-Control": "no-store",
        } as any;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${base}/api/v1/todos?limit=50`, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) {
          console.warn("Planned: fetch returned non-ok", res.status);
          return;
        }
        const data = await res.json();
        // include todos even if they don't have due_time so we can show a 'No date' bucket
        if (mounted) setTodos(data);
      } catch (e) {
        console.error(e);
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      // don't silently fail: record that there's no token so the UI can show a helpful message
      setNoToken(true);
    } else {
      setNoToken(false);
      void load();
    }

    function onCreated(e: any) {
      const created = e?.detail;
      // always prepend created todos so users see them immediately in Planned
      if (created) setTodos((t) => [created, ...t]);
    }

    function onUpdated(e: any) {
      const updated = e?.detail;
      if (updated) {
        setTodos((prevTodos) =>
          prevTodos.map((todo) => (todo.id === updated.id ? updated : todo))
        );
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

  // helper to try loading without Authorization header (dev/testing)
  const tryLoadWithoutAuth = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${base}/api/v1/todos?limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Planned: unauth fetch returned non-ok", res.status);
        return;
      }
      const data = await res.json();
      setTodos(data);
    } catch (e) {
      console.error(e);
    }
  };

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

  // optimistic toggle handlers
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
      if (!res.ok) throw new Error(`Persist complete failed: ${res.status}`);
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
          <div className="w-full h-full bg-gradient-to-b from-teal-400 to-teal-100 text-black relative overflow-hidden">
            <div className="px-4">
              <div className="p-4 max-w-4xl mx-auto">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md hover:bg-teal-600 hover:bg-opacity-20 transition-colors mb-2"
                >
                  <Bars3Icon className="w-6 h-6 text-teal-700" />
                </button>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-6 h-6 text-teal-700" />
                  <h1 className="text-2xl font-semibold text-teal-700">
                    Planned
                  </h1>
                </div>
              </div>
            </div>

            {todos.length > 0 && (
              <div className="px-4">
                <div className="p-4 max-w-4xl mx-auto">
                  <div className="space-y-4 h-[70vh] md:h-[55vh] lg:h-[65vh] overflow-y-auto custom-scroll pr-2">
                    {/* bucket todos by due date */}
                    {(() => {
                      const completedTodos = todos.filter(
                        (t) => t.is_completed
                      );
                      const active = todos.filter(
                        (t) => !t.is_completed && t.due_time
                      );
                      const today = new Date();
                      const startOfToday = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );
                      const MS_PER_DAY = 1000 * 60 * 60 * 24;

                      const buckets: {
                        today: any[];
                        tomorrow: any[];
                        later: any[];
                        earlier: any[];
                      } = {
                        today: [],
                        tomorrow: [],
                        later: [],
                        earlier: [],
                      };

                      active.forEach((t) => {
                        try {
                          const d = new Date(t.due_time);
                          const dueMid = new Date(
                            d.getFullYear(),
                            d.getMonth(),
                            d.getDate()
                          );
                          const diff = Math.round(
                            (dueMid.getTime() - startOfToday.getTime()) /
                              MS_PER_DAY
                          );
                          if (diff === 0) buckets.today.push(t);
                          else if (diff === 1) buckets.tomorrow.push(t);
                          else if (diff >= 2) buckets.later.push(t);
                          else buckets.earlier.push(t); // diff < 0
                        } catch (e) {
                          // fallback: treat as later
                          buckets.later.push(t);
                        }
                      });

                      const renderItem = (todo: any) => (
                      <div
                        key={todo.id}
                          className="bg-white rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
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
                                    : "text-black"
                                }`}
                              >
                              {todo.title}
                            </div>
                            <div className="text-xs text-gray-500">Tasks</div>
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
                              <StarOutline className="w-5 h-5" aria-hidden />
                            )}
                          </div>
                        </div>
                      );

                      return (
                        <>
                          {/* Items without a due_time were intentionally removed — only bucketed todos with due_time are shown */}

                          {/* Earlier (past) - show first */}
                          {buckets.earlier.length > 0 && (
                            <div className="mb-2">
                              <button
                                type="button"
                                onClick={() => setShowEarlier((s) => !s)}
                                className="flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm"
                              >
                                <ChevronDownIcon
                                  className={`w-4 h-4 transform ${
                                    showEarlier ? "rotate-0" : "-rotate-90"
                                  }`}
                                  aria-hidden
                                />
                                <span className="font-medium">Earlier</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {buckets.earlier.length}
                                </span>
                              </button>
                              {showEarlier && (
                                <div className="mt-3 space-y-2">
                                  {buckets.earlier.map(renderItem)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Today */}
                          {buckets.today.length > 0 && (
                            <div className="mb-2">
                              <button
                                type="button"
                                onClick={() => setShowToday((s) => !s)}
                                className="flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm"
                              >
                                <ChevronDownIcon
                                  className={`w-4 h-4 transform ${
                                    showToday ? "rotate-0" : "-rotate-90"
                                  }`}
                                  aria-hidden
                                />
                                <span className="font-medium">Today</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {buckets.today.length}
                                </span>
                              </button>
                              {showToday && (
                                <div className="mt-3 space-y-2">
                                  {buckets.today.map(renderItem)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tomorrow */}
                          {buckets.tomorrow.length > 0 && (
                            <div className="mb-2">
                              <button
                                type="button"
                                onClick={() => setShowTomorrow((s) => !s)}
                                className="flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm"
                              >
                                <ChevronDownIcon
                                  className={`w-4 h-4 transform ${
                                    showTomorrow ? "rotate-0" : "-rotate-90"
                                  }`}
                                  aria-hidden
                                />
                                <span className="font-medium">Tomorrow</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {buckets.tomorrow.length}
                                </span>
                              </button>
                              {showTomorrow && (
                                <div className="mt-3 space-y-2">
                                  {buckets.tomorrow.map(renderItem)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Later (>=2 days) */}
                          {buckets.later.length > 0 && (
                            <div className="mb-2">
                              <button
                                type="button"
                                onClick={() => setShowLater((s) => !s)}
                                className="flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm"
                              >
                                <ChevronDownIcon
                                  className={`w-4 h-4 transform ${
                                    showLater ? "rotate-0" : "-rotate-90"
                                  }`}
                                  aria-hidden
                                />
                                <span className="font-medium">Later</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {buckets.later.length}
                                </span>
                              </button>
                              {showLater && (
                                <div className="mt-3 space-y-2">
                                  {buckets.later.map(renderItem)}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Completed (moved to bottom) */}
                          {completedTodos.length > 0 && (
                            <div className="mb-2">
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
                                  {completedTodos.map(renderItem)}
                                </div>
                              )}
                      </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="-mt-20 px-4 md:px-8 z-10">
            <div className="p-4 max-w-4xl mx-auto">
              <TaskInput />
            </div>
          </div>
        </section>
      </div>

      {/* Task Detail Sidebar */}
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

