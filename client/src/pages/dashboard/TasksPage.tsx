import { TodoList } from '@/components/todo/TodoList';
import { ListHeader } from '@/components/layout/ListHeader';
import { BottomAddBar } from '@/components/todo/BottomAddBar';

export function TasksPage() {
  return (
    <div>
      <ListHeader title="Tasks" gradientClassName="bg-gradient-to-b from-indigo-600 to-indigo-700" />
      <div className="px-6">
        <TodoList hideHeader title="Tasks" filter={{}} />
      </div>
      <BottomAddBar />
    </div>
  );
}
