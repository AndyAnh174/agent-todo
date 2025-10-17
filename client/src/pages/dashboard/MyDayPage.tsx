import { TodoList } from '@/components/todo/TodoList';
import { ListHeader } from '@/components/layout/ListHeader';
import { SuggestionsPanel } from '@/components/todo/SuggestionsPanel';
import { BottomAddBar } from '@/components/todo/BottomAddBar';

export function MyDayPage() {
  return (
    <>
    <div className="flex w-full">
      {/* Main content */}
      <div className="flex-1">
        <ListHeader
          title="My Day"
          subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          backgroundImageUrl={'/myday-hero.jpg'}
        />
        <div className="px-6">
          <TodoList
            hideHeader
            title="My Day"
            filter={{
              is_completed: false,
            }}
          />
        </div>
      </div>

      <SuggestionsPanel />
    </div>
    <BottomAddBar />
    </>
  );
}
