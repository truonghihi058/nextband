import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, FileText, Download } from "lucide-react";
import { toast } from "sonner"; // Using toast directly

export default function LogViewer() {
  const [lines, setLines] = useState<string>("100");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: logs,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["admin-logs", lines],
    queryFn: () => {
      if (lines === "all") return logsApi.getLogs();
      return logsApi.getLastLogs(parseInt(lines));
    },
    refetchInterval: 5000, // Auto refresh every 5s
  });

  // Auto scroll to bottom when logs update
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    if (logs) {
      navigator.clipboard.writeText(logs);
      toast.success("Đã sao chép log vào clipboard");
    }
  };

  const handleDownload = () => {
    if (!logs) return;
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            System Logs
          </h1>
          <p className="text-muted-foreground">
            Xem nhật ký hệ thống thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={lines} onValueChange={setLines}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Số dòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Last 50 lines</SelectItem>
              <SelectItem value="100">Last 100 lines</SelectItem>
              <SelectItem value="500">Last 500 lines</SelectItem>
              <SelectItem value="1000">Last 1000 lines</SelectItem>
              <SelectItem value="all">Toàn bộ log (Nặng)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading || isRefetching ? "animate-spin" : ""}`}
            />
          </Button>

          <Button variant="outline" onClick={handleCopy} title="Sao chép">
            Copy
          </Button>

          <Button variant="outline" onClick={handleDownload} title="Tải xuống">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col border-slate-800 shadow-md">
        <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500" : "bg-green-500"}`}
            />
            <CardTitle className="text-sm font-medium">
              Console Output
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-scroll
            </label>
            <span className="text-muted-foreground">
              {logs ? `${logs.split("\n").length} lines` : "0 lines"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 bg-black text-green-400 font-mono text-xs overflow-hidden">
          {error ? (
            <div className="p-4 text-red-400">
              Error loading logs: {(error as any).message}
            </div>
          ) : (
            <ScrollArea className="h-full w-full" ref={scrollRef}>
              <div className="p-4 min-h-full whitespace-pre-wrap break-all">
                {logs || "No logs available..."}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
