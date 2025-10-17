import { TodoList } from '@/components/todo/TodoList';

export function ImportantPage() {
  return (
    <TodoList
      title="Important"
      filter={{
        is_important: true,
      }}
    />
  );
}
