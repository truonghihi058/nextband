import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi } from "@/lib/api";

export type AppRole = "admin" | "teacher" | "student";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  roles: AppRole[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        roles: userData.roles as AppRole[],
      });
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      // Save token
      localStorage.setItem("token", response.token);
      setToken(response.token);

      // Set user
      setUser({
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        avatarUrl: response.user.avatarUrl,
        roles: response.user.roles as AppRole[],
      });

      return { error: null };
    } catch (error: any) {
      const message = error.response?.data?.error || "Đăng nhập thất bại";
      return { error: new Error(message) };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await authApi.register(email, password, fullName);

      // Save token
      localStorage.setItem("token", response.token);
      setToken(response.token);

      // Set user
      setUser({
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        avatarUrl: response.user.avatarUrl,
        roles: response.user.roles as AppRole[],
      });

      return { error: null };
    } catch (error: any) {
      const message = error.response?.data?.error || "Đăng ký thất bại";
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await loadUser();
    }
  };

  const roles = user?.roles || [];
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        isLoading,
        isAdmin,
        isTeacher,
        isStudent,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
