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
            try {
              console.log("TaskInput: creating todo", title);
              (inputRef.current as HTMLInputElement).disabled = true;
              let res: Response | null = null;
              try {
                res = await fetch("/api/v1/todos", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ title }),
                });
              } catch (err) {
                console.warn("TaskInput: relative fetch failed", err);
              }

              if (!res) {
                // fallback to explicit backend host
                try {
                  const backend =
                    (window as any).__BACKEND_URL__ || "http://localhost:8000";
                  console.log(
                    "TaskInput: trying fallback backend",
                    backend + "/api/v1/todos"
                  );
                  res = await fetch(backend + "/api/v1/todos", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title }),
                  });
                } catch (err) {
                  console.error("TaskInput: fallback fetch failed", err);
                }
              }

              if (!res) {
                alert(
                  "Failed to reach backend to create todo. Check console for details."
                );
                return;
              }

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("TaskInput: create todo failed", err);
                alert(err.detail || "Failed to create todo");
                return;
              }

              const created = await res.json();
              console.log("TaskInput: created todo", created);
              // clear and close
              if (inputRef.current) inputRef.current.value = "";
              setOpen(false);
              // emit a CustomEvent so parent pages/components can listen and refresh if needed
              try {
                const ev = new CustomEvent("todo:created", { detail: created });
                window.dispatchEvent(ev);
              } catch (e) {}
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
