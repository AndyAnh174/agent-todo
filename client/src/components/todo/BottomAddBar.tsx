import React from 'react';
import { AddTodoForm } from './AddTodoForm';

export function BottomAddBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="pointer-events-none px-4 sm:px-6 pb-4">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow pointer-events-auto">
          <div className="p-2 sm:p-3">
            <AddTodoForm />
          </div>
        </div>
      </div>
    </div>
  );
}


