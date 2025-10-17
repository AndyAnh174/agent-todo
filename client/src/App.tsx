import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { MyDayPage } from '@/pages/dashboard/MyDayPage';
import { ImportantPage } from '@/pages/dashboard/ImportantPage';
import { PlannedPage } from '@/pages/dashboard/PlannedPage';
import { TasksPage } from '@/pages/dashboard/TasksPage';
import { useAuthStore } from '@/store/auth';
import CalendarPage from '@/pages/calendar/CalendarPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="my-day" element={<MyDayPage />} />
            <Route path="important" element={<ImportantPage />} />
            <Route path="planned" element={<PlannedPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route index element={<Navigate to="/dashboard/my-day" replace />} />
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard/my-day" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;