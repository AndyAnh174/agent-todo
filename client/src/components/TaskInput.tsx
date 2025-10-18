"use client";

import { useState, useRef, useEffect } from "react";

interface TaskInputProps {
  defaultIsImportant?: boolean;
}

export default function TaskInput({ defaultIsImportant }: TaskInputProps) {
  const [open, setOpen] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [pendingTask, setPendingTask] = useState<any>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (showDescriptionModal) descriptionRef.current?.focus();
  }, [showDescriptionModal]);

  const handleSaveDescription = async (description: string) => {
    if (!pendingTask) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const backend =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8000";

    try {
      const res = await fetch(`${backend}/api/v1/todos/${pendingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Emit both created and updated events for proper display
        window.dispatchEvent(
          new CustomEvent("todo:created", { detail: updated })
        );
        window.dispatchEvent(
          new CustomEvent("todo:updated", { detail: updated })
        );
      }
    } catch (err) {
      console.error("Failed to save description:", err);
    }

    setShowDescriptionModal(false);
    setPendingTask(null);
  };

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
              if (typeof defaultIsImportant === "boolean") {
                payload.is_important = defaultIsImportant;
              }
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

              // Show description modal instead of immediately dispatching event
              setPendingTask(created);
              setShowDescriptionModal(true);
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

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-white/45 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-400">
              <h3 className="text-lg font-semibold">Add Description</h3>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Task "{pendingTask?.title}" created successfully! You must add a
                description before continuing.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const description =
                    descriptionRef.current?.value?.trim() || "";
                  if (description) {
                    handleSaveDescription(description);
                  } else {
                    alert("Description is required!");
                  }
                }}
              >
                <textarea
                  ref={descriptionRef}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add more details about this task..."
                  required
                />

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Description
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
