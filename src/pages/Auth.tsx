import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  BookOpen,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "@/lib/api";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLogo } from "@/components/common/SiteLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const emailSchema = z.string().email("Email không hợp lệ");
const passwordSchema = z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự");

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberGoogleLogin, setRememberGoogleLogin] = useState(true);
  const [showGoogleHint, setShowGoogleHint] = useState(false);

  const { signIn, user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    const hidden = localStorage.getItem("google_login_hint_hidden") === "1";
    setShowGoogleHint(!hidden);
  }, []);

  const validateInputs = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: error.message,
      });
    } else {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-secondary to-primary/5 p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <SiteLogo alt="NextBand Logo" className="max-h-12 w-auto" />
          </h1>
          <p className="text-muted-foreground mt-2">
            {settings.authTagline}
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {settings.authFeatureOneTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {settings.authFeatureOneDescription}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {settings.authFeatureTwoTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {settings.authFeatureTwoDescription}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Homework. Tất cả quyền được bảo lưu.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <SiteLogo alt="NextBand Logo" className="max-h-10 w-auto" />
            </div>
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>Đăng nhập để tiếp tục học tập</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      setIsLoading(true);
                      const data = await authApi.loginWithGoogle(
                        credentialResponse.credential,
                      );
                      if (rememberGoogleLogin) {
                        localStorage.setItem("google_login_hint_hidden", "1");
                        localStorage.setItem("google_login_remember", "1");
                      } else {
                        localStorage.removeItem("google_login_remember");
                      }

                      localStorage.removeItem("token");
                      sessionStorage.removeItem("token");
                      if (rememberGoogleLogin) {
                        localStorage.setItem("token", data.token);
                      } else {
                        sessionStorage.setItem("token", data.token);
                      }
                      window.location.href = from;

                      toast({
                        title: "Đăng nhập thành công",
                        description: `Chào mừng ${data.user.fullName || data.user.email}!`,
                      });
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Đăng nhập thất bại",
                        description:
                          error.response?.data?.error || "Lỗi xác thực Google",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                onError={() => {
                  toast({
                    variant: "destructive",
                    title: "Đăng nhập thất bại",
                    description: "Không thể kết nối với Google",
                  });
                }}
              />
            </div>
            {showGoogleHint && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-2">
                <p>
                  Lần đầu đăng nhập bằng Google có thể cần xác nhận tài khoản.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberGoogleLogin}
                    onCheckedChange={(checked) =>
                      setRememberGoogleLogin(Boolean(checked))
                    }
                  />
                  <span>Ghi nhớ cho lần đăng nhập sau</span>
                </label>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc tiếp tục với Email
                </span>
              </div>
            </div>

            {/* Email/Password Sign In */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
