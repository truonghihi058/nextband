import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
  confirmKeyword?: string;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa không?",
  loading = false,
  confirmKeyword,
}: DeleteConfirmDialogProps) {
  const [typedKeyword, setTypedKeyword] = useState("");

  useEffect(() => {
    if (!open) {
      setTypedKeyword("");
    }
  }, [open]);

  const canConfirm =
    !confirmKeyword ||
    typedKeyword.trim().toLowerCase() === confirmKeyword.toLowerCase();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{description}</p>
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-left">
              <p className="text-xs font-medium text-destructive">Danger zone</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thao tác xóa là vĩnh viễn và có thể gây mất dữ liệu.
              </p>
            </div>
            {confirmKeyword && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nhập <span className="font-semibold">{confirmKeyword}</span> để xác nhận lần 2.
                </p>
                <Input
                  value={typedKeyword}
                  onChange={(e) => setTypedKeyword(e.target.value)}
                  placeholder={confirmKeyword}
                  disabled={loading}
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading || !canConfirm}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
