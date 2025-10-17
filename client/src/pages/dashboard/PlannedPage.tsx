import { TodoList } from '@/components/todo/TodoList';

export function PlannedPage() {
  return (
    <TodoList
      title="Planned"
      filter={{
        is_completed: false,
      }}
    />
  );
}
