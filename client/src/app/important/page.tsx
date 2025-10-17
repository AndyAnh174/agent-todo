"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import TaskDetailSidebar from "@/components/TaskDetailSidebar";
import { StarIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function Important() {
  const [todos, setTodos] = useState<Array<any>>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const url = `${base}/api/v1/todos?is_important=true&limit=50`;
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
      if (created) setTodos((t) => [created, ...t]);
    }
    window.addEventListener("todo:created", onCreated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("todo:created", onCreated as EventListener);
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
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === updatedTask.id ? updatedTask : todo
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== taskId));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <section className="relative w-full">
          <div className="w-full min-h-screen bg-gradient-to-b from-pink-300 to-pink-100 text-pink-600 relative">
            <div className="px-4 md:px-8">
              <div className="p-4 max-w-4xl mx-auto flex items-center gap-3">
                <StarIcon className="w-6 h-6 text-pink-600" />
                <h1 className="text-2xl font-semibold">Important</h1>
              </div>
            </div>
            {todos.length > 0 && (
              <div className="px-4">
                <div className="p-4 max-w-4xl mx-auto">
                  <div className="space-y-2">
                    {todos.map((todo: any) => (
                      <div
                        key={todo.id}
                        className="bg-white rounded-md shadow-sm p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => handleTaskClick(todo)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 border rounded-full mt-1 flex items-center justify-center ${
                            todo.is_completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {todo.is_completed && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className={`font-medium ${todo.is_completed ? 'line-through text-gray-500' : 'text-black'}`}>
                              {todo.title}
                            </div>
                            <div className="text-xs text-gray-500">Tasks</div>
                          </div>
                        </div>
                        <div className={`${todo.is_important ? 'text-yellow-500' : 'text-gray-400'}`}>
                          ★
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="-mt-24 px-4 md:px-8 z-10">
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
