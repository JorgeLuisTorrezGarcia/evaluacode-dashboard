import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { useAuthStore } from "@/stores/auth-store";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseForm from "./pages/CourseForm";
import CourseDetail from "./pages/CourseDetail";
import Exams from './pages/Exams';
import ExamForm from './pages/ExamForm';
import ExamDetail from './pages/ExamDetail';
import StudentExamAttempt from './pages/StudentExamAttempt';
import SubmissionReview from './pages/SubmissionReview';
import Rubrics from "./pages/Rubrics";
import RubricForm from "./pages/RubricForm";
import RubricDetail from "./pages/RubricDetail";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
            />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Courses />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <CourseForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CourseDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <CourseForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Exams />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <ExamForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/exams/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <ExamForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ExamDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/:id/tomar"
              element={
                <ProtectedRoute allowedRoles={["estudiante"]}>
                  <AppLayout>
                    <StudentExamAttempt />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <ExamForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/:examId/submissions/:submissionId/review"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <SubmissionReview />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rubrics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Rubrics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rubrics/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <RubricForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rubrics/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RubricDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rubrics/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'docente']}>
                  <AppLayout>
                    <RubricForm />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
