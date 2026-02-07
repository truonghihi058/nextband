import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts
import ClientLayout from "@/layouts/ClientLayout";
import AdminLayout from "@/layouts/AdminLayout";
import MinimalLayout from "@/layouts/MinimalLayout";

// Pages
import Auth from "@/pages/Auth";
import HomePage from "@/pages/HomePage";
import MyCourses from "@/pages/MyCourses";
import CourseDetail from "@/pages/CourseDetail";
import ExamInterface from "@/pages/ExamInterface";
import NotFound from "@/pages/NotFound";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCourses from "@/pages/admin/Courses";
import AdminCourseCreate from "@/pages/admin/CourseCreate";
import AdminCourseEdit from "@/pages/admin/CourseEdit";
import AdminExams from "@/pages/admin/Exams";
import AdminExamCreate from "@/pages/admin/ExamCreate";
import AdminExamEdit from "@/pages/admin/ExamEdit";
import AdminSectionEdit from "@/pages/admin/SectionEdit";
import AdminUsers from "@/pages/admin/Users";
import AdminCheckAttempt from "@/pages/admin/CheckAttempt";
import AdminSubmissionGrade from "@/pages/admin/SubmissionGrade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<Auth />} />

            {/* Client Routes */}
            <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/course/:slug" element={<CourseDetail />} />
            </Route>

            {/* Exam Interface - Minimal Layout */}
            <Route element={<ProtectedRoute><MinimalLayout /></ProtectedRoute>}>
              <Route path="/exam/:examId" element={<ExamInterface />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute requiredRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/create" element={<AdminCourseCreate />} />
              <Route path="/admin/courses/:id" element={<AdminCourseEdit />} />
              <Route path="/admin/exams" element={<AdminExams />} />
              <Route path="/admin/exams/create" element={<AdminExamCreate />} />
              <Route path="/admin/exams/:id" element={<AdminExamEdit />} />
              <Route path="/admin/sections/:id" element={<AdminSectionEdit />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/check-attempt" element={<AdminCheckAttempt />} />
              <Route path="/admin/submissions/:id" element={<AdminSubmissionGrade />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
