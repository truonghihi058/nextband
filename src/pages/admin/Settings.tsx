import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/admin/FileUpload";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users } from "lucide-react";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";
import { siteSettingsApi } from "@/lib/api";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [data, setData] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const { data: remoteSettings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SiteSettings) => siteSettingsApi.update(payload),
    onSuccess: (saved) => {
      const normalized = normalizeSiteSettings(saved);
      setData(normalized);
      queryClient.setQueryData(["site-settings"], saved);
      toast({ title: "Đã lưu cài đặt hệ thống" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.error || "Không thể lưu cài đặt",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (remoteSettings) {
      setData(normalizeSiteSettings(remoteSettings));
    }
  }, [remoteSettings]);

  const persistSettings = (next: SiteSettings) => {
    setData(next);
  };

  const updateSettings = (updater: (prev: SiteSettings) => SiteSettings) => {
    const next = updater(data);
    persistSettings(next);
  };

  const handleSave = () => {
    saveMutation.mutate(data);
  };

  const getPreviewLogoUrl = (url: string) => {
    if (url.startsWith("/uploads")) {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      return `${baseUrl}${url}`;
    }
    return url || "/logo.png";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground text-sm">
          Thiết lập tên site, logo, màu highlight và slogan trang chủ.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nhận diện thương hiệu</CardTitle>
            <CardDescription>Tên site và logo hiển thị trên giao diện</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tên site</Label>
              <Input
                value={data.siteName}
                onChange={(e) =>
                  updateSettings((prev) => ({ ...prev, siteName: e.target.value }))
                }
                placeholder="Nhập tên site"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <FileUpload
                accept="image/*"
                currentUrl={data.logoUrl || null}
                onUploadComplete={(url) =>
                  updateSettings((prev) => ({ ...prev, logoUrl: url || "" }))
                }
                onRemove={() =>
                  updateSettings((prev) => ({ ...prev, logoUrl: "" }))
                }
                label="Tải lên logo (PNG/JPG)"
              />
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Màu highlight</CardTitle>
            <CardDescription>Áp dụng cho highlight passage và trạng thái điểm danh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Có mặt</Label>
                <Input
                  type="color"
                  value={data.highlightPresent}
                  onChange={(e) =>
                    updateSettings(
                      (prev) => ({ ...prev, highlightPresent: e.target.value }),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Vắng</Label>
                <Input
                  type="color"
                  value={data.highlightAbsent}
                  onChange={(e) =>
                    updateSettings(
                      (prev) => ({ ...prev, highlightAbsent: e.target.value }),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tạm nghỉ</Label>
                <Input
                  type="color"
                  value={data.highlightInactive}
                  onChange={(e) =>
                    updateSettings(
                      (prev) => ({ ...prev, highlightInactive: e.target.value }),
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nội dung màn đăng nhập</CardTitle>
          <CardDescription>
            Quản lý phần giới thiệu và 2 khối nội dung bên trái của trang đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Dòng mô tả đầu trang</Label>
            <Textarea
              value={data.authTagline}
              rows={2}
              maxLength={120}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  authTagline: e.target.value.slice(0, 120),
                }))
              }
              placeholder="Nhập mô tả ngắn cho màn đăng nhập"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Khối nội dung 1</p>
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={data.authFeatureOneTitle}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      authFeatureOneTitle: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Khóa học chất lượng"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={data.authFeatureOneDescription}
                  rows={3}
                  maxLength={160}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      authFeatureOneDescription: e.target.value.slice(0, 160),
                    }))
                  }
                  placeholder="Nhập mô tả khối nội dung 1"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Khối nội dung 2</p>
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={data.authFeatureTwoTitle}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      authFeatureTwoTitle: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Giáo viên uy tín"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={data.authFeatureTwoDescription}
                  rows={3}
                  maxLength={160}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      authFeatureTwoDescription: e.target.value.slice(0, 160),
                    }))
                  }
                  placeholder="Nhập mô tả khối nội dung 2"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-secondary to-primary/5 p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview màn đăng nhập
            </p>
            <div className="space-y-8">
              <div>
                <img
                  src={getPreviewLogoUrl(data.logoUrl)}
                  alt={`${data.siteName} Logo`}
                  className="max-h-12 w-auto object-contain"
                />
                <p className="mt-2 text-muted-foreground">
                  {data.authTagline || "Nhập mô tả đầu trang"}
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {data.authFeatureOneTitle || "Tiêu đề khối 1"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {data.authFeatureOneDescription || "Mô tả khối 1"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {data.authFeatureTwoTitle || "Tiêu đề khối 2"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {data.authFeatureTwoDescription || "Mô tả khối 2"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slogan Trang Chủ</CardTitle>
          <CardDescription>
            Tuỳ chỉnh nội dung và style slogan hiển thị ở Hero trang học viên
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Câu slogan (tối đa 100 ký tự)</Label>
            <Input
              value={data.sloganText}
              maxLength={100}
              onChange={(e) =>
                updateSettings(
                  (prev) => ({ ...prev, sloganText: e.target.value.slice(0, 100) }),
                )
              }
              placeholder="Nhập slogan..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {data.sloganText.length}/100
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Font</Label>
              <Select
                value={data.sloganFontFamily}
                onValueChange={(value) =>
                  updateSettings((prev) => ({ ...prev, sloganFontFamily: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="'Be Vietnam Pro', sans-serif">
                    Be Vietnam Pro
                  </SelectItem>
                  <SelectItem value="'Montserrat', sans-serif">
                    Montserrat
                  </SelectItem>
                  <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                  <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font weight</Label>
              <Select
                value={data.sloganFontWeight}
                onValueChange={(value) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sloganFontWeight: value as "light" | "regular" | "bold",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vị trí</Label>
              <Select
                value={data.sloganAlign}
                onValueChange={(value) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sloganAlign: value as "left" | "center" | "right",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Kích thước desktop (px)</Label>
              <Input
                type="number"
                min={20}
                max={96}
                value={data.sloganDesktopSize}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sloganDesktopSize: Math.min(
                      96,
                      Math.max(20, Number(e.target.value || 20)),
                    ),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Kích thước mobile (px)</Label>
              <Input
                type="number"
                min={14}
                max={72}
                value={data.sloganMobileSize}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sloganMobileSize: Math.min(
                      72,
                      Math.max(14, Number(e.target.value || 14)),
                    ),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Line height</Label>
              <Input
                type="number"
                step={0.1}
                min={1}
                max={2}
                value={data.sloganLineHeight}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    sloganLineHeight: Math.min(
                      2,
                      Math.max(1, Number(e.target.value || 1.2)),
                    ),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Màu chữ</Label>
              <Input
                type="color"
                value={data.sloganColor}
                onChange={(e) =>
                  updateSettings((prev) => ({ ...prev, sloganColor: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <h3
              style={{
                fontFamily: data.sloganFontFamily,
                fontWeight:
                  data.sloganFontWeight === "light"
                    ? 300
                    : data.sloganFontWeight === "regular"
                      ? 400
                      : 700,
                fontSize: `${data.sloganDesktopSize}px`,
                color: data.sloganColor,
                lineHeight: data.sloganLineHeight,
                textAlign: data.sloganAlign,
              }}
            >
              {data.sloganText || "Nhập slogan để xem trước"}
            </h3>
          </div>

          <div className="border-t pt-5 space-y-5">
            <div className="space-y-2">
              <Label>Mô tả phụ Hero (tối đa 200 ký tự)</Label>
              <Input
                value={data.heroDescriptionText}
                maxLength={200}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    heroDescriptionText: e.target.value.slice(0, 200),
                  }))
                }
                placeholder="Nhập mô tả phụ..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {data.heroDescriptionText.length}/200
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Font mô tả</Label>
                <Select
                  value={data.heroDescriptionFontFamily}
                  onValueChange={(value) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionFontFamily: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="'Be Vietnam Pro', sans-serif">
                      Be Vietnam Pro
                    </SelectItem>
                    <SelectItem value="'Montserrat', sans-serif">
                      Montserrat
                    </SelectItem>
                    <SelectItem value="'Merriweather', serif">
                      Merriweather
                    </SelectItem>
                    <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Weight mô tả</Label>
                <Select
                  value={data.heroDescriptionFontWeight}
                  onValueChange={(value) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionFontWeight: value as
                        | "light"
                        | "regular"
                        | "bold",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vị trí mô tả</Label>
                <Select
                  value={data.heroDescriptionAlign}
                  onValueChange={(value) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionAlign: value as "left" | "center" | "right",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Size desktop mô tả (px)</Label>
                <Input
                  type="number"
                  min={14}
                  max={56}
                  value={data.heroDescriptionDesktopSize}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionDesktopSize: Math.min(
                        56,
                        Math.max(14, Number(e.target.value || 14)),
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Size mobile mô tả (px)</Label>
                <Input
                  type="number"
                  min={12}
                  max={40}
                  value={data.heroDescriptionMobileSize}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionMobileSize: Math.min(
                        40,
                        Math.max(12, Number(e.target.value || 12)),
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Line height mô tả</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={1}
                  max={2.2}
                  value={data.heroDescriptionLineHeight}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionLineHeight: Math.min(
                        2.2,
                        Math.max(1, Number(e.target.value || 1.6)),
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Màu chữ mô tả</Label>
                <Input
                  type="color"
                  value={data.heroDescriptionColor}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      heroDescriptionColor: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
  );
}
