import { useEffect } from 'react';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import { useTodoStore } from '@/store/todo';
import { cn } from '@/lib/utils';

interface TodoListProps {
  filter?: {
    is_completed?: boolean;
    is_important?: boolean;
    group_id?: string;
  };
  title?: string;
  hideHeader?: boolean; // allow external header/banner
}

export function TodoList({ filter, title = "Tasks", hideHeader = false }: TodoListProps) {
  const { todos, isLoading, error, fetchTodos } = useTodoStore();

  useEffect(() => {
    fetchTodos(filter);
  }, [filter]);

  const filteredTodos = todos.filter(todo => {
    if (filter?.is_completed !== undefined && todo.is_completed !== filter.is_completed) {
      return false;
    }
    if (filter?.is_important !== undefined && todo.is_important !== filter.is_important) {
      return false;
    }
    if (filter?.group_id && todo.group_id !== filter.group_id) {
      return false;
    }
    return true;
  });

  const completedTodos = filteredTodos.filter(todo => todo.is_completed);
  const pendingTodos = filteredTodos.filter(todo => !todo.is_completed);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading todos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {!hideHeader && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
          <AddTodoForm />
        </div>
      )}

      {/* Pending Todos */}
      {pendingTodos.length > 0 && (
        <div className="space-y-1">
          {pendingTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm text-gray-500 px-2">
              Completed ({completedTodos.length})
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="space-y-1">
            {completedTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTodos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500">Add a task to get started</p>
        </div>
      )}
    </div>
  );
}
