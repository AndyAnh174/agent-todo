"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import { StarIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function Important() {
  const [todos, setTodos] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
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
                        className="bg-white rounded-md shadow-sm p-2 flex items-center justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 border rounded-full mt-1" />
                          <div>
                            <div className="font-medium text-black">
                              {todo.title}
                            </div>
                            <div className="text-xs text-gray-500">Tasks</div>
                          </div>
                        </div>
                        <div className="text-gray-400">★</div>
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
    </div>
  );
}
