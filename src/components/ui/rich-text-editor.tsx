import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  Type,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
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

type AlignMode = "left" | "center" | "right" | "justify";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  minHeight = 180,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [alignMode, setAlignMode] = useState<AlignMode>("left");
  const [textColor, setTextColor] = useState("#000000");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const { toast } = useToast();

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  }, []);

  const detectAlignMode = useCallback(() => {
    if (document.queryCommandState("justifyCenter")) {
      setAlignMode("center");
      return;
    }
    if (document.queryCommandState("justifyRight")) {
      setAlignMode("right");
      return;
    }
    if (document.queryCommandState("justifyFull")) {
      setAlignMode("justify");
      return;
    }
    setAlignMode("left");
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    detectAlignMode();
  }, [value, detectAlignMode]);

  useEffect(() => {
    const syncEditorState = () => {
      detectAlignMode();
      saveSelection();
    };
    document.addEventListener("selectionchange", syncEditorState);
    return () =>
      document.removeEventListener("selectionchange", syncEditorState);
  }, [detectAlignMode, saveSelection]);

  const insertImageAtRange = (
    fullUrl: string,
    savedRange: Range | null,
    selection: Selection | null
  ) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

    try {
      if (savedRange && selection) {
        const img = document.createElement("img");
        img.src = fullUrl;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.className = "rounded-md my-2";

        savedRange.deleteContents();
        savedRange.insertNode(img);

        // Move caret after the inserted image
        savedRange.setStartAfter(img);
        savedRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } else {
        document.execCommand("insertImage", false, fullUrl);
      }
    } catch (e) {
      document.execCommand("insertImage", false, fullUrl);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }

    if (fullUrl) {
      window.dispatchEvent(
        new CustomEvent("rich-text-image-uploaded", {
          detail: { url: fullUrl },
        })
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Save current selection to restore after upload
    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
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

      insertImageAtRange(fullUrl, savedRange, selection);
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

    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    } else if (editorRef.current) {
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

      insertImageAtRange(fullUrl, savedRange, selection);
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

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current) return;

    editorRef.current?.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    detectAlignMode();
  };

  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextColor = e.target.value;
    setTextColor(nextColor);
    restoreSelection();
    exec("foreColor", nextColor);
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
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => colorInputRef.current?.click()}
          title="Màu chữ"
        >
          <span className="relative flex h-4 w-4 items-center justify-center text-[11px] font-bold leading-none">
            A
            <span
              className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full"
              style={{ backgroundColor: textColor }}
            />
          </span>
        </Button>
        <input
          ref={colorInputRef}
          type="color"
          value={textColor}
          onChange={handleTextColorChange}
          className="sr-only"
          tabIndex={-1}
          aria-label="Chọn màu chữ"
        />

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyLeft")}
          className={cn(alignMode === "left" && "bg-muted text-foreground")}
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyCenter")}
          className={cn(alignMode === "center" && "bg-muted text-foreground")}
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyRight")}
          className={cn(alignMode === "right" && "bg-muted text-foreground")}
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyFull")}
          className={cn(alignMode === "justify" && "bg-muted text-foreground")}
          title="Căn đều 2 lề"
        >
          <AlignJustify className="h-4 w-4" />
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
        className="p-3 text-sm outline-none rich-content-editor w-full"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onMouseUp={() => {
          detectAlignMode();
          saveSelection();
        }}
        onKeyUp={() => {
          detectAlignMode();
          saveSelection();
        }}
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
        .rich-content-editor {
          line-height: 1.5;
          word-break: break-word;
          overflow-wrap: break-word;
          width: 100%;
        }
        .rich-content-editor p {
          margin: 0 0 0.75em;
        }
        .rich-content-editor p:last-child {
          margin-bottom: 0;
        }
        .rich-content-editor ul,
        .rich-content-editor ol {
          margin: 0 0 0.75em;
          padding-left: 1.5em;
        }
        .rich-content-editor li {
          margin-bottom: 0.25em;
        }
        .rich-content-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
