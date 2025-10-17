"use client";

import Sidebar from "@/components/Sidebar";
import TaskInput from "@/components/TaskInput";
import { useMemo } from "react";

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
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <section className="relative w-full rounded-lg">
          {/* large gradient hero */}
          <div className="w-full min-h-screen bg-gradient-to-b from-teal-700 to-teal-400 text-white relative">
            <div className="p-8 md:p-12 max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-semibold">My Day</h1>
              <p className="mt-2 text-sm md:text-base">{today}</p>
            </div>
          </div>

          {/* input bar below hero, overlapping slightly */}
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

