import { useState, useRef } from 'react';
import { Check, Star, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Todo } from '@/types/todo';
import { useTodoStore } from '@/store/todo';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toggleComplete, updateTodo, deleteTodo } = useTodoStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleToggleComplete = async () => {
    try {
      await toggleComplete(todo.id, !todo.is_completed);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleToggleImportant = async () => {
    try {
      await updateTodo(todo.id, { is_important: !todo.is_important });
    } catch (error) {
      console.error('Failed to toggle importance:', error);
    }
  };

  const formatDueDate = (dueTime: string) => {
    const date = new Date(dueTime);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `In ${diffDays} days`;
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
        todo.is_completed && "opacity-60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleComplete}
        className={cn(
          "p-1 h-6 w-6 rounded-full border-2 transition-colors",
          todo.is_completed
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-gray-300 hover:border-blue-500"
        )}
      >
        {todo.is_completed && <Check className="h-3 w-3" />}
      </Button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "text-sm font-medium text-gray-900 truncate",
              todo.is_completed && "line-through text-gray-500"
            )}
          >
            {todo.title}
          </h3>
          {todo.is_important && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
        
        {todo.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {todo.description}
          </p>
        )}
        
        {todo.due_time && (
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDueDate(todo.due_time)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isHovered && "opacity-100"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleImportant}
          className={cn(
            "p-1 h-6 w-6",
            todo.is_important && "text-yellow-500"
          )}
        >
          <Star className="h-4 w-4" />
        </Button>
        
        <div className="relative">
          <Button
            ref={menuBtnRef as any}
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={(e) => {
              // close if focus leaves the button and menu
              setTimeout(() => setMenuOpen(false), 150);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-md border bg-white shadow-md z-20">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setEditTitle(todo.title);
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
              >
                Edit title
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  await updateTodo(todo.id, { is_important: !todo.is_important });
                  setMenuOpen(false);
                }}
              >
                {todo.is_important ? 'Unmark important' : 'Mark important'}
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  const current = todo.due_time ? new Date(todo.due_time).toISOString().slice(0,16) : '';
                  const val = window.prompt('Set due date (YYYY-MM-DDTHH:mm)', current) ?? '';
                  if (val) {
                    const iso = new Date(val).toISOString();
                    await updateTodo(todo.id, { due_time: iso });
                  }
                  setMenuOpen(false);
                }}
              >
                Set due date
              </button>
              {todo.due_time && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={async () => {
                    await updateTodo(todo.id, { due_time: undefined });
                    setMenuOpen(false);
                  }}
                >
                  Clear due date
                </button>
              )}
              <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  if (confirm('Delete this task?')) {
                    await deleteTodo(todo.id);
                  }
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Title Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit task title"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={async () => {
                const t = editTitle.trim();
                if (!t) return;
                await updateTodo(todo.id, { title: t });
                setEditOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        )}
      >
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
}
