import React, { useMemo, useState } from 'react';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, isSameDay, format } from 'date-fns';
import { ListHeader } from '@/components/layout/ListHeader';
import { useTodoStore } from '@/store/todo';

function generateMonthGrid(current: Date) {
  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const { todos } = useTodoStore();
  const days = useMemo(() => generateMonthGrid(cursor), [cursor]);
  const monthLabel = format(cursor, 'MMMM yyyy');

  return (
    <div>
      <ListHeader
        title={monthLabel}
        gradientClassName="bg-gradient-to-b from-sky-600 to-sky-700"
        rightActions={(
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setCursor(addMonths(cursor, -1))}>
              Prev
            </button>
            <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setCursor(new Date())}>
              Today
            </button>
            <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setCursor(addMonths(cursor, 1))}>
              Next
            </button>
          </div>
        )}
      />

      <div className="px-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((w) => (
            <div key={w} className="px-2 py-1">{w}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border rounded overflow-hidden">
          {days.map((date) => {
            const dayTodos = todos.filter((t) => t.due_time && isSameDay(new Date(t.due_time), date));
            return (
              <div key={date.toISOString()} className="min-h-[110px] border-r border-b p-2">
                <div className="text-xs text-gray-500">{format(date, 'd')}</div>
                <div className="mt-1 space-y-1">
                  {dayTodos.slice(0, 3).map((t) => {
                    const time = t.due_time ? format(new Date(t.due_time), 'HH:mm') : '';
                    return (
                      <div
                        key={t.id}
                        className={
                          'flex items-center gap-2 truncate text-xs px-2 py-1 rounded border ' +
                          (t.is_important
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200')
                        }
                        title={t.title}
                      >
                        {time && <span className="font-medium tabular-nums">{time}</span>}
                        <span className="truncate underline-offset-2 hover:underline cursor-pointer">{t.title}</span>
                        {t.is_important && <span className="ml-auto">★</span>}
                      </div>
                    );
                  })}
                  {dayTodos.length > 3 && (
                    <div className="text-[10px] text-gray-400">+{dayTodos.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;


