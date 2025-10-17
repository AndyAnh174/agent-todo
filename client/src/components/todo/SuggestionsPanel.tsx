import React from 'react';
import type { TodoCreateRequest } from '@/types';
import { apiService } from '@/services/api';
import { useTodoStore } from '@/store/todo';

interface SuggestionsPanelProps {
  title?: string;
  suggestions?: string[];
}

export function SuggestionsPanel({ title = 'Suggestions', suggestions }: SuggestionsPanelProps) {
  const createTodo = useTodoStore((s) => s.createTodo);

  const list = suggestions || ['Bananas', 'Potatoes', 'Butter', 'Bread', 'Milk'];

  const handleAdd = async (name: string) => {
    const payload: TodoCreateRequest = { title: name };
    await createTodo(payload);
  };

  return (
    <aside className="hidden xl:block w-80 border-l bg-white">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="mt-3 space-y-2">
          {list.map((s) => (
            <div key={s} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="truncate text-gray-700">{s}</span>
              <button onClick={() => handleAdd(s)} className="text-primary hover:underline">Add</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


