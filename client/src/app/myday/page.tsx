"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import { useMemo, useEffect, useState } from "react";

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

  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        // fallback: if NEXT_PUBLIC_API_URL is not set, use same origin (so /api/v1/...)
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const url = `${base}/api/v1/todos?limit=50`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        console.log("MyDay: loaded todos", data);
        if (mounted) setTodos(data);
      } catch (e) {
        console.error(e);
      }
    }
    load();

    function onCreated(e: any) {
      const created = e?.detail;
      console.log("MyDay: todo:created event", created);
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
          {/* large gradient hero */}
          <div className="w-full min-h-screen bg-gradient-to-b from-gray-500 to-yellow-200 text-black relative">
            <div className="px-4 md:px-8">
              <div className="p-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold text-white">My Day</h1>
                <p className="mt-2 text-[16px] text-white">{today}</p>
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

          {/* input bar below hero, overlapping slightly */}
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

