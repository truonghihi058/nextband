import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadsApi } from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  minHeight = 180,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Save current selection to restore after upload
    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0);
    } else if (editorRef.current) {
      // Create a new range at the end of the editor if no selection exists
      savedRange = document.createRange();
      savedRange.selectNodeContents(editorRef.current);
      savedRange.collapse(false);
    }

    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);

      let fullUrl = result.url;
      if (fullUrl.startsWith("/uploads")) {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const baseUrl = apiUrl.replace("/api/v1", "");
        fullUrl = `${baseUrl}${fullUrl}`;
      }

      // Restore selection to ensure image is inserted properly
      if (editorRef.current) {
        editorRef.current.focus();
        if (savedRange && selection) {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        }
      }

      document.execCommand("insertImage", false, fullUrl);

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tải lên ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Shared helper to upload a File and insert the image at caret
  const uploadAndInsertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);

      let fullUrl = result.url;
      if (fullUrl.startsWith("/uploads")) {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const baseUrl = apiUrl.replace("/api/v1", "");
        fullUrl = `${baseUrl}${fullUrl}`;
      }

      if (editorRef.current) {
        editorRef.current.focus();
      }

      document.execCommand("insertImage", false, fullUrl);

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tải lên ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          uploadAndInsertImage(file);
        }
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        e.preventDefault();
        uploadAndInsertImage(files[i]);
        return;
      }
    }
  };

  const exec = (command: string) => {
    document.execCommand(command);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      <div className="flex items-center gap-1 border-b p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyLeft")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyCenter")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyRight")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("removeFormat")}
          title="Xóa định dạng"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Chèn ảnh"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />

        <div className="h-4 w-px bg-border mx-1" />

        <Select
          onValueChange={(value) => {
            document.execCommand("fontSize", false, value);
            if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
            }
          }}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <Type className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Cỡ chữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Rất nhỏ</SelectItem>
            <SelectItem value="2">Nhỏ</SelectItem>
            <SelectItem value="3">Bình thường</SelectItem>
            <SelectItem value="4">Lớn</SelectItem>
            <SelectItem value="5">Rất lớn</SelectItem>
            <SelectItem value="6">Cực lớn</SelectItem>
            <SelectItem value="7">Khổng lồ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="p-3 text-sm outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
