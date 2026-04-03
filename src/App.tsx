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
import MySubmissions from "@/pages/MySubmissions";
import CourseDetail from "@/pages/CourseDetail";
import SubmissionDetail from "@/pages/SubmissionDetail";
import ExamInterface from "@/pages/ExamInterface";
import Profile from "@/pages/Profile";
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
import AdminLogViewer from "@/pages/admin/LogViewer";
import AdminClasses from "@/pages/admin/Classes";
import AdminClassEdit from "@/pages/admin/ClassEdit";
import AdminTeachers from "@/pages/admin/Teachers";
import AdminSettings from "@/pages/admin/Settings";

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
            <Route
              element={
                <ProtectedRoute>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/my-submissions" element={<MySubmissions />} />
              <Route path="/course/:slug" element={<CourseDetail />} />
              <Route path="/submissions/:id" element={<SubmissionDetail />} />
              <Route
                path="/exam/:examId/review"
                element={<SubmissionDetail />}
              />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Exam Interface - Minimal Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <MinimalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/exam/:examId" element={<ExamInterface />} />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute requiredRoles={["admin", "teacher"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses/create"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminCourseCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses/:id"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminCourseEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminExams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams/create"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminExamCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams/:id"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminExamEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sections/:id"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminSectionEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/check-attempt"
                element={<AdminCheckAttempt />}
              />
              <Route
                path="/admin/submissions/:id"
                element={<AdminSubmissionGrade />}
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminLogViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/classes"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminClasses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/classes/:id"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminClassEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/teachers"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminTeachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
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
