"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SunIcon,
  StarIcon,
  CalendarIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  TagIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function Sidebar(props: SidebarProps = {}) {
  const { onClose, showCloseButton = false } = props;
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

  const displayName =
    user?.full_name || (user?.email ? user.email.split("@")[0] : "");
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";
  const pathname = usePathname();
  const isActive = (p: string) => {
    if (!pathname) return false;
    if (p === "/") return pathname === "/";
    return pathname === p || pathname.startsWith(p + "/");
  };

  return (
    <aside className="w-64 bg-white min-h-screen p-4 flex flex-col">
      {/* Close button for mobile */}
      {showCloseButton && onClose && (
        <div className="flex justify-end pb-2 mb-2 lg:hidden border-b border-gray-300 ">
          <button
            onClick={onClose}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 " />
          </button>
        </div>
      )}

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
          <Link
            href="/"
            title="Đăng xuất"
            aria-label="logout"
            className="p-2 rounded hover:bg-gray-100 inline-flex"
            onClick={() => {
              try {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
              } catch (e) {}
            }}
          >
            <ArrowRightOnRectangleIcon
              className="h-5 w-5 text-gray-600"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <div className="mb-4 relative">
        <input
          className="w-full pr-12 rounded px-3 py-1 bg-gray-200 text-gray-700 placeholder-gray-500 focus:outline-none"
          placeholder="Search"
          aria-label="Search"
        />
        <MagnifyingGlassIcon className="w-8 h-6 hover:bg-gray-300 p-1 rounded-sm text-gray-600 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
      <div className="border-1 border-gray-200 mb-5"></div>
      <nav className="space-y-2 text-sm">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/dashboard") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <ChartBarIcon className="w-5 h-5 text-indigo-600" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/myday"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/myday") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <SunIcon className="w-5 h-5 text-gray-600" />
          <span>My Day</span>
        </Link>

        <Link
          href="/important"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/important") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <StarIcon className="w-5 h-5 text-pink-500" />
          <span>Important</span>
        </Link>

        <Link
          href="/planned"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/planned") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <span>Planned</span>
        </Link>

        <Link
          href="/task"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/task") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <HomeIcon className="w-5 h-5 text-sky-600" />
          <span>Tasks</span>
        </Link>

        <Link
          href="/tags"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/tags") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <TagIcon className="w-5 h-5 text-blue-600" />
          <span>Tags</span>
        </Link>

        <Link
          href="/groups"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/groups") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <FolderIcon className="w-5 h-5 text-green-600" />
          <span>Groups</span>
        </Link>

        <Link
          href="/chat"
          className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-200 ${
            isActive("/chat") ? "bg-gray-200 font-semibold" : ""
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
          <span>AI Chat</span>
        </Link>
      </nav>

      <div className="border-1 border-gray-200 my-5"></div>

      <div className="mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-3 text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 rounded">
          <PlusIcon className="w-5 h-5 text-gray-800" />
          <span>New list</span>
        </button>
      </div>
    </aside>
  );
}
