"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import TaskDetailSidebar from "@/components/TaskDetailSidebar";
import { useMemo, useEffect, useState } from "react";
import {
  StarIcon as StarOutline,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export default function MyDay() {
  const today = useMemo(() => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);
    } catch (e) {
      return "";
    }
  }, []);

  const [todos, setTodos] = useState<Array<any>>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

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
      } catch (err) {
        console.error(err);
      }
    }

    load();

    function onCreated(e: any) {
      const created = e?.detail;
      if (created) setTodos((t) => [created, ...t]);
    }

    window.addEventListener("todo:created", onCreated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("todo:created", onCreated as EventListener);
    };
  }, []);

  const isCreatedToday = (todo: any) => {
    if (!todo) return false;
    const created = todo.created_at || todo.createdAt || todo.created;
    if (!created) return false;
    try {
      const d = new Date(created);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch (e) {
      return false;
    }
  };

  const todaysTodos = todos.filter(isCreatedToday);
  const completedTodos = todaysTodos.filter((t) => t.is_completed);
  const activeTodos = todaysTodos.filter((t) => !t.is_completed);

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
  };

  const handleDeleteTask = (taskId: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== taskId));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <section className="relative w-full">
          <div className="w-full min-h-screen bg-gradient-to-b from-gray-500 to-yellow-200 text-black relative">
            <div className="px-4 md:px-8">
              <div className="p-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold text-white">My Day</h1>
                <p className="mt-2 text-[16px] text-white">{today}</p>
              </div>
            </div>

            <div className="px-4">
              <div className="p-4 max-w-4xl mx-auto">
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
                        {completedTodos.map((todo: any) => (
                          <div
                            key={todo.id}
                            className="bg-white rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                            onClick={() => handleTaskClick(todo)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTodos((prev) =>
                                    prev.map((t) =>
                                      t.id === todo.id
                                        ? {
                                            ...t,
                                            is_completed: !t.is_completed,
                                          }
                                        : t
                                    )
                                  );
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
                                <div className="text-xs text-gray-500">
                                  Tasks
                                </div>
                              </div>
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setTodos((prev) =>
                                  prev.map((t) =>
                                    t.id === todo.id
                                      ? { ...t, is_important: !t.is_important }
                                      : t
                                  )
                                );
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
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-[60vh] lg:max-h-[55vh] overflow-y-auto custom-scroll pr-2">
                  {activeTodos.map((todo: any) => (
                    <div
                      key={todo.id}
                      className="bg-white rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => handleTaskClick(todo)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setTodos((prev) =>
                              prev.map((t) =>
                                t.id === todo.id
                                  ? { ...t, is_completed: !t.is_completed }
                                  : t
                              )
                            );
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
                          setTodos((prev) =>
                            prev.map((t) =>
                              t.id === todo.id
                                ? { ...t, is_important: !t.is_important }
                                : t
                            )
                          );
                        }}
                        className={`${
                          todo.is_important
                            ? "text-yellow-500"
                            : "text-gray-400"
                        }`}
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
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-24 px-4 md:px-8 z-10">
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

