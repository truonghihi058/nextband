import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileAudio, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  accept: string;
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
}

export default function FileUpload({
  bucket,
  folder = "",
  accept,
  currentUrl,
  onUploadComplete,
  onRemove,
  maxSizeMB = 10,
  disabled = false,
  label,
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const isImage = accept.includes("image");
  const isAudio = accept.includes("audio");

  const acceptLabel = isImage
    ? "Ảnh (JPG, PNG, WebP)"
    : isAudio
      ? "Audio (MP3, WAV, OGG)"
      : "File";

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (isImage && !file.type.startsWith("image/")) {
        toast({ title: "Lỗi", description: "Vui lòng chọn file ảnh", variant: "destructive" });
        return;
      }
      if (isAudio && !file.type.startsWith("audio/")) {
        toast({ title: "Lỗi", description: "Vui lòng chọn file audio", variant: "destructive" });
        return;
      }

      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast({
          title: "Lỗi",
          description: `File quá lớn. Giới hạn ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        // Generate unique file path
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filePath = folder
          ? `${folder}/${timestamp}-${randomStr}.${ext}`
          : `${timestamp}-${randomStr}.${ext}`;

        setProgress(30);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        setProgress(80);

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        setProgress(100);
        onUploadComplete(urlData.publicUrl);
        toast({ title: "Thành công", description: "Upload file thành công!" });
      } catch (error: any) {
        toast({
          title: "Lỗi upload",
          description: error.message || "Không thể upload file",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setProgress(0);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [bucket, folder, accept, maxSizeMB, onUploadComplete, toast, isImage, isAudio],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleRemove = () => {
    onRemove?.();
  };

  // Uploading state
  if (uploading) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Đang upload...</p>
            <Progress value={progress} className="mt-2 h-2" />
          </div>
        </div>
      </div>
    );
  }

  // Has file - show preview
  if (currentUrl) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={currentUrl}
                alt="Preview"
                className="h-20 w-20 rounded-md object-cover border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : isAudio ? (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {currentUrl.split("/").pop()}
                  </span>
                </div>
                <audio controls className="w-full h-8" src={currentUrl}>
                  <track kind="captions" />
                </audio>
              </div>
            ) : null}

            {!disabled && (
              <div className="flex flex-col gap-1 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Đổi file
                </Button>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemove}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Xóa
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // Empty state - drop zone
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => e.key === "Enter" && !disabled && fileInputRef.current?.click()}
      >
        {isImage ? (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">Kéo thả file vào đây hoặc nhấn để chọn</p>
          <p className="text-xs text-muted-foreground mt-1">
            {acceptLabel} · Tối đa {maxSizeMB}MB
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
