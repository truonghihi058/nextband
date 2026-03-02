import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.nextband.site/api/v11";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Format any relative /uploads URLs to absolute URLs from backend responses
const formatRelativeUrls = (data: any): any => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => formatRelativeUrls(item));
  }

  if (typeof data === "object") {
    const formatted = { ...data };
    for (const key in formatted) {
      if (
        typeof formatted[key] === "string" &&
        formatted[key].startsWith("/uploads")
      ) {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const baseUrl = apiUrl.replace("/api/v1", "");
        formatted[key] = `${baseUrl}${formatted[key]}`;
      } else if (typeof formatted[key] === "object") {
        formatted[key] = formatRelativeUrls(formatted[key]);
      }
    }
    return formatted;
  }

  return data;
};

// Response interceptor - handle 401 errors and format URLs
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data) {
      response.data = formatRelativeUrls(response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on auth page
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);

// =============================================
// AUTH API
// =============================================
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  loginWithGoogle: async (credential: string) => {
    const { data } = await api.post("/auth/login/google", { credential });
    return data;
  },

  register: async (email: string, password: string, fullName?: string) => {
    const { data } = await api.post("/auth/register", {
      email,
      password,
      fullName,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },

  updateProfile: async (profile: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    const { data } = await api.put("/auth/profile", profile);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

// =============================================
// COURSES API
// =============================================
export const coursesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const { data } = await api.get("/courses", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/courses/${id}`);
    return data;
  },

  getBySlug: async (slug: string) => {
    const { data } = await api.get(`/courses/slug/${slug}`);
    return data;
  },

  create: async (course: {
    title: string;
    description?: string;
    level?: string;
    price?: number;
  }) => {
    const { data } = await api.post("/courses", course);
    return data;
  },

  update: async (
    id: string,
    course: Partial<{
      title: string;
      description: string;
      level: string;
      isPublished: boolean;
      isActive: boolean;
    }>,
  ) => {
    const { data } = await api.put(`/courses/${id}`, course);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/courses/${id}`);
    return data;
  },
};

// =============================================
// EXAMS API
// =============================================
export const examsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    courseId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    isPublished?: boolean;
    isActive?: boolean;
  }) => {
    const { data } = await api.get("/exams", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/exams/${id}`);
    return data;
  },

  create: async (exam: {
    courseId: string;
    title: string;
    description?: string;
    week?: number;
    durationMinutes?: number;
  }) => {
    const { data } = await api.post("/exams", exam);
    return data;
  },

  update: async (
    id: string,
    exam: Partial<{
      title: string;
      description: string;
      isPublished: boolean;
      isActive: boolean;
      week: number;
      durationMinutes: number;
    }>,
  ) => {
    const { data } = await api.put(`/exams/${id}`, exam);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/exams/${id}`);
    return data;
  },
};

// =============================================
// SECTIONS API
// =============================================
export const sectionsApi = {
  getById: async (id: string) => {
    const { data } = await api.get(`/sections/${id}`);
    return data;
  },

  create: async (section: {
    examId: string;
    sectionType: string;
    title: string;
    instructions?: string;
  }) => {
    const { data } = await api.post("/sections", section);
    return data;
  },

  update: async (id: string, section: any) => {
    const { data } = await api.put(`/sections/${id}`, section);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/sections/${id}`);
    return data;
  },
};

// =============================================
// QUESTIONS API
// =============================================
export const questionsApi = {
  createGroup: async (group: {
    sectionId: string;
    title?: string;
    instructions?: string;
    passage?: string;
  }) => {
    const { data } = await api.post("/questions/groups", group);
    return data;
  },

  updateGroup: async (id: string, group: any) => {
    const { data } = await api.put(`/questions/groups/${id}`, group);
    return data;
  },

  deleteGroup: async (id: string) => {
    const { data } = await api.delete(`/questions/groups/${id}`);
    return data;
  },

  create: async (question: {
    groupId: string;
    questionType: string;
    questionText: string;
    options?: any;
    correctAnswer?: string;
    audioUrl?: string;
  }) => {
    const { data } = await api.post("/questions", question);
    return data;
  },

  update: async (id: string, question: any) => {
    const { data } = await api.put(`/questions/${id}`, question);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/questions/${id}`);
    return data;
  },

  bulkCreate: async (groupId: string, questions: any[]) => {
    const { data } = await api.post("/questions/bulk", { groupId, questions });
    return data;
  },
};

// =============================================
// SUBMISSIONS API
// =============================================
export const submissionsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    examId?: string;
    studentId?: string;
    status?: string;
  }) => {
    const { data } = await api.get("/submissions", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/submissions/${id}`);
    return data;
  },

  start: async (examId: string) => {
    const { data } = await api.post("/submissions", { examId });
    return data;
  },

  saveAnswers: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: string;
      audioUrl?: string;
    }>,
  ) => {
    const { data } = await api.put(`/submissions/${id}`, { answers });
    return data;
  },

  submit: async (
    id: string,
    answers: Array<{
      questionId: string;
      answerText?: string;
      audioUrl?: string;
    }>,
  ) => {
    const { data } = await api.put(`/submissions/${id}`, {
      answers,
      submit: true,
    });
    return data;
  },

  grade: async (
    id: string,
    grades: Array<{ answerId: string; score: number; feedback?: string }>,
    totalScore: number,
  ) => {
    const { data } = await api.post(`/submissions/${id}/grade`, {
      grades,
      totalScore,
    });
    return data;
  },
};

// =============================================
// USERS API
// =============================================
export const usersApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const { data } = await api.get("/users", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  create: async (user: {
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }) => {
    const { data } = await api.post("/users", user);
    return data;
  },

  update: async (
    id: string,
    user: Partial<{ fullName: string; isActive: boolean; role: string }>,
  ) => {
    const { data } = await api.put(`/users/${id}`, user);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

// =============================================
// ENROLLMENTS API
// =============================================
export const enrollmentsApi = {
  list: async () => {
    const { data } = await api.get("/enrollments");
    return data;
  },

  listByCourse: async (courseId: string) => {
    const { data } = await api.get(`/enrollments/course/${courseId}`);
    return data;
  },

  enroll: async (courseId: string) => {
    const { data } = await api.post("/enrollments", { courseId });
    return data;
  },

  enrollUser: async (courseId: string, studentId: string) => {
    const { data } = await api.post("/enrollments", { courseId, studentId });
    return data;
  },

  updateProgress: async (id: string, progressPercent: number) => {
    const { data } = await api.put(`/enrollments/${id}`, { progressPercent });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/enrollments/${id}`);
    return data;
  },

  unenroll: async (id: string) => {
    const { data } = await api.delete(`/enrollments/${id}`);
    return data;
  },
};

// =============================================
// UPLOADS API
// =============================================
export const uploadsApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  uploadAudio: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/uploads/audio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteFile: async (url: string) => {
    const { data } = await api.delete("/uploads", { data: { url } });
    return data;
  },
};

// =============================================
// STATS API (for admin dashboard)
// =============================================
export const statsApi = {
  getAdminStats: async () => {
    // Get counts from list endpoints
    const [courses, users, exams] = await Promise.all([
      api.get("/courses", { params: { limit: 1 } }),
      api.get("/users", { params: { limit: 1 } }),
      api.get("/exams", { params: { limit: 1 } }),
    ]);

    return {
      courses: courses.data.meta?.total || 0,
      users: users.data.meta?.total || 0,
      exams: exams.data.meta?.total || 0,
    };
  },
};

// =============================================
// LOGS API
// =============================================
export const logsApi = {
  getLogs: async () => {
    const { data } = await api.get("/admin/log-viewer");
    return data;
  },

  getLastLogs: async (lines: number = 100) => {
    const { data } = await api.get("/admin/log-viewer/last", {
      params: { lines },
    });
    return data;
  },
};

export default api;

// =============================================
// CLASSES API
// =============================================
export const classesApi = {
  list: async (params?: any) => {
    const { data } = await api.get("/classes", { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/classes/${id}`);
    return data;
  },

  create: async (body: {
    name: string;
    description?: string;
    teacherId?: string;
  }) => {
    const { data } = await api.post("/classes", body);
    return data;
  },

  update: async (
    id: string,
    body: {
      name?: string;
      description?: string;
      teacherId?: string | null;
      isActive?: boolean;
    },
  ) => {
    const { data } = await api.put(`/classes/${id}`, body);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/classes/${id}`);
    return data;
  },

  addStudents: async (classId: string, studentIds: string[]) => {
    const { data } = await api.post(`/classes/${classId}/students`, {
      studentIds,
    });
    return data;
  },

  removeStudent: async (classId: string, studentId: string) => {
    const { data } = await api.delete(
      `/classes/${classId}/students/${studentId}`,
    );
    return data;
  },
};
