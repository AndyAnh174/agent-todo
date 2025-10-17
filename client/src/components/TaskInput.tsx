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
        <div className="bg-white rounded-sm shadow-sm p-3 flex items-center gap-3">
          <div className="w-6 h-6 border rounded-full" />
          <input
            ref={inputRef}
            className="flex-1 outline-none text-sm"
            placeholder="Try typing 'Pay utilities bill by Friday 6pm'"
          />
        </div>
      )}
    </div>
  );
}
