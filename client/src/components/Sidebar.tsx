"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [user, setUser] = useState<{
    full_name?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setUser(u);
    } catch (e) {
      setUser(null);
    }
  }, []);

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "GU"}
        </div>
        <div>
          <div className="text-sm font-semibold">
            {user?.full_name || "giau vo"}
          </div>
          <div className="text-xs text-gray-500">
            {user?.email || "minhgiauvo13@gmail.com"}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          className="w-full border rounded px-2 py-1"
          placeholder="Search"
        />
      </div>

      <nav className="space-y-2 text-sm">
        <Link
          href="/myday"
          className="block px-2 py-2 rounded hover:bg-gray-50"
        >
          My Day
        </Link>
        <Link
          href="important"
          className="block px-2 py-2 rounded hover:bg-gray-50"
        >
          Important
        </Link>
        <Link
          href="planned"
          className="block px-2 py-2 rounded hover:bg-gray-50"
        >
          Planned
        </Link>
        <Link href="/task" className="block px-2 py-2 rounded hover:bg-gray-50">
          Tasks
        </Link>
      </nav>

      <div className="mt-6">
        <button className="w-full text-left px-2 py-2 border rounded">
          + New list
        </button>
      </div>
    </aside>
  );
}
