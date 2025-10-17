"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import { useEffect, useState } from "react";

export default function Task() {
  const [todos, setTodos] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/todos?limit=50`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
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
          <div className="w-full min-h-screen bg-gradient-to-b from-teal-700 to-teal-400 text-white relative">
            <div className="p-8 md:p-12 max-w-4xl">
              <h1 className="text-2xl font-semibold">Tasks</h1>
            </div>
            {todos.length > 0 && (
              <div className="p-8 md:p-12 max-w-4xl">
                <div className="bg-white rounded-md shadow-sm p-3">
                  {todos.map((todo: any) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 border rounded-full mt-1" />
                        <div>
                          <div className="font-medium">{todo.title}</div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>
                      </div>
                      <div className="text-gray-400">★</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="-mt-24 px-4 md:px-8 z-10">
            <div className="max-w-4xl mx-auto">
              <TaskInput />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
