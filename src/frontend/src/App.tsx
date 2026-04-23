import { Toaster } from "@/components/ui/sonner";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Download,
  Flame,
  LayoutDashboard,
  Upload,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { exportAllData, importAllData } from "./lib/localStore";
import CalendarPage from "./pages/CalendarPage";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/HabitsPage";
import RevisionPage from "./pages/RevisionPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0, retry: 1 } },
});

type Tab =
  | "dashboard"
  | "calendar"
  | "schedule"
  | "habits"
  | "revision"
  | "tasks";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "schedule", label: "Schedule", icon: Wand2 },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "revision", label: "Revision", icon: BookOpen },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
];

function BackupButtons() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded!");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importAllData(ev.target?.result as string);
        qc.invalidateQueries();
        toast.success("Data restored successfully!");
      } catch {
        toast.error("Failed to restore — invalid backup file.");
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        data-ocid="backup.export.button"
        onClick={handleExport}
        title="Download backup"
        className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        data-ocid="backup.import.button"
        onClick={() => fileInputRef.current?.click()}
        title="Restore from backup"
        className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "calendar":
        return <CalendarPage />;
      case "schedule":
        return <SchedulePage />;
      case "habits":
        return <HabitsPage />;
      case "revision":
        return <RevisionPage />;
      case "tasks":
        return <TasksPage />;
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-green">
              <span className="text-primary-foreground text-xs font-bold font-display">
                D
              </span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              DailyTracker
            </span>
          </div>
          <div className="flex items-center gap-3">
            <BackupButtons />
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-2xl mx-auto px-1 py-2 flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.${tab.id}.tab`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-[44px] ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`relative p-1.5 rounded-lg transition-all duration-200 ${
                    isActive ? "bg-primary/15" : "hover:bg-secondary/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-all ${isActive ? "scale-110" : ""}`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/15"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] font-medium transition-all ${isActive ? "text-primary font-semibold" : ""}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster richColors position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
