"use client";

import { useState, useRef, useEffect } from "react";

export default function TaskInput() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative z-20">
      {!open ? (
        <div
          className="bg-white rounded-sm shadow-sm p-3 flex items-center gap-3 cursor-text"
          onClick={() => setOpen(true)}
        >
          <div className="w-6 h-6 flex items-center justify-center">+</div>
          <div className="text-sm text-gray-700">Add a task</div>
        </div>
      ) : (
        <form
          className="bg-white rounded-sm shadow-sm p-3 flex items-center gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const title = inputRef.current?.value?.trim();
            if (!title) return;

            const token = localStorage.getItem("token");
            if (!token) {
              alert("Please log in to add a task.");
              return;
            }

            // prefer NEXT_PUBLIC_API_BASE_URL but keep legacy NEXT_PUBLIC_BACKEND_URL as fallback
            const backend =
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              process.env.NEXT_PUBLIC_BACKEND_URL ||
              "http://localhost:8000";

            try {
              console.log("TaskInput: creating todo", title);

              (inputRef.current as HTMLInputElement).disabled = true;

              // default due_time to now so newly created todos appear in "Today"
              const payload: any = { title };
              if (!payload.due_time)
                payload.due_time = new Date().toISOString();

              const res = await fetch(`${backend}/api/v1/todos`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("TaskInput: create todo failed", err);
                alert(err.message || "Failed to create todo");
                return;
              }

              const created = await res.json();
              console.log("TaskInput: created todo", created);

              if (inputRef.current) inputRef.current.value = "";
              setOpen(false);

              // Gửi sự kiện để component khác cập nhật
              window.dispatchEvent(
                new CustomEvent("todo:created", { detail: created })
              );
            } catch (err) {
              console.error("TaskInput: network error", err);
              alert("Cannot connect to backend.");
            } finally {
              if (inputRef.current)
                (inputRef.current as HTMLInputElement).disabled = false;
            }
          }}
        >
          <div className="w-6 h-6 border rounded-full" />
          <input
            ref={inputRef}
            className="flex-1 outline-none text-sm"
            placeholder="Try typing 'Pay utilities bill by Friday 6pm'"
          />
        </form>
      )}
    </div>
  );
}
