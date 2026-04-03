import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/admin/FileUpload";
import { useToast } from "@/hooks/use-toast";

type SettingsData = {
  siteName: string;
  logoUrl: string;
  highlightPresent: string;
  highlightAbsent: string;
  highlightInactive: string;
  uploads: string[];
};

const STORAGE_KEY = "nb_admin_settings";

export default function AdminSettings() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData>({
    siteName: "NextBand",
    logoUrl: "",
    highlightPresent: "#fff7a5",
    highlightAbsent: "#ffd7d7",
    highlightInactive: "#e5e7eb",
    uploads: [],
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn("Invalid settings cache", e);
      }
    }
  }, []);

  const persistSettings = (next: SettingsData, showToast = false) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (showToast) {
      toast({ title: "Đã lưu cài đặt cục bộ" });
    }
  };

  const updateSettings = (
    updater: (prev: SettingsData) => SettingsData,
    showToast = false,
  ) => {
    const next = updater(data);
    persistSettings(next, showToast);
  };

  const handleSave = () => {
    persistSettings(data, true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground text-sm">
          Thiết lập tên site, logo và màu highlight cho điểm danh/đọc.
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
                  updateSettings(
                    (prev) => ({ ...prev, siteName: e.target.value }),
                    false,
                  )
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
                  updateSettings(
                    (prev) => ({ ...prev, logoUrl: url || "" }),
                    true,
                  )
                }
                onRemove={() =>
                  updateSettings((prev) => ({ ...prev, logoUrl: "" }), true)
                }
                label="Tải lên logo (PNG/JPG)"
              />
            </div>

            <div className="space-y-2">
              <Label>File uploads</Label>
              <FileUpload
                accept="image/*,audio/*"
                currentUrl={null}
                onUploadComplete={(url) => {
                  if (!url) return;
                  updateSettings(
                    (prev) => ({
                      ...prev,
                      uploads: [url, ...prev.uploads].slice(0, 20),
                    }),
                    false,
                  );
                  toast({ title: "Đã tải lên", description: url });
                }}
                label="Tải lên nhanh (lưu URL gần đây nhất)"
              />
              {data.uploads.length > 0 ? (
                <ul className="text-sm list-disc list-inside space-y-1">
                  {data.uploads.map((u, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="truncate max-w-xs">{u}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateSettings(
                            (prev) => ({
                              ...prev,
                              uploads: prev.uploads.filter(
                                (url) => url !== u,
                              ),
                            }),
                            true,
                          )
                        }
                      >
                        Xóa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(u).catch(() => {});
                          toast({ title: "Đã copy URL" });
                        }}
                      >
                        Copy
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Chưa có file nào</p>
              )}
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
                      false,
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
                      false,
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
                      false,
                    )
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Lưu ý: hiện lưu cục bộ trình duyệt. Cần API settings để đồng bộ giữa thiết bị.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Lưu cài đặt</Button>
      </div>
    </div>
  );
}
