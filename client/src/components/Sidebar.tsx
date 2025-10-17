"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

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

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    // redirect to login page
    window.location.href = "/";
  };

  const displayName =
    user?.full_name || (user?.email ? user.email.split("@")[0] : "");
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">
            {avatarInitial}
          </div>
          <div>
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-gray-500">{user?.email || ""}</div>
          </div>
        </div>
        <div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            aria-label="logout"
            className="p-2 rounded hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon
              className="h-5 w-5 text-gray-600"
              aria-hidden="true"
            />
          </button>
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
          href="/important"
          className="block px-2 py-2 rounded hover:bg-gray-50"
        >
          Important
        </Link>
        <Link
          href="/planned"
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
