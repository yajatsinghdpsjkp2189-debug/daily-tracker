import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Clock, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useTasks } from "../hooks/useTasks";

const MAX_NOTE_WORDS = 50;

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function formatDeadline(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const wordCount = countWords(note);
  const wordLimitReached = wordCount >= MAX_NOTE_WORDS;

  const handleNoteChange = (val: string) => {
    const words = val.trim() === "" ? [] : val.trim().split(/\s+/);
    if (words.length <= MAX_NOTE_WORDS) {
      setNote(val);
    } else {
      // Allow editing within limit
      setNote(words.slice(0, MAX_NOTE_WORDS).join(" "));
    }
  };

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!deadline) {
      toast.error("Deadline is required");
      return;
    }
    addTask({ title: title.trim(), deadline, note: note.trim() });
    toast.success("Task added!");
    setTitle("");
    setDeadline("");
    setNote("");
  };

  const sorted = [...tasks].sort((a, b) =>
    a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0,
  );

  const isOverdue = (t: { deadline: string; completed: boolean }) =>
    !t.completed && t.deadline < todayStr;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-primary" /> Tasks
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track deadlines and side quests
        </p>
      </motion.div>

      {/* Add Task Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="tasks.title.input"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="bg-secondary/40 border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Deadline <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  data-ocid="tasks.deadline.input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-secondary/40 border-border/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>Note (optional)</span>
                <span
                  className={`text-[10px] ${
                    wordLimitReached
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {wordCount}/{MAX_NOTE_WORDS} words
                </span>
              </Label>
              <Textarea
                data-ocid="tasks.note.textarea"
                placeholder="Brief summary — max 50 words..."
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                className="bg-secondary/40 border-border/50 resize-none h-16 text-sm"
              />
            </div>
            <Button
              data-ocid="tasks.add.submit_button"
              onClick={handleAdd}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Task List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        {sorted.length === 0 ? (
          <div
            data-ocid="tasks.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tasks yet</p>
            <p className="text-xs mt-1">
              Add your first task above to get started
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sorted.map((task, idx) => {
              const overdue = isOverdue(task);
              return (
                <motion.div
                  key={task.id}
                  data-ocid={`tasks.item.${idx + 1}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    overdue
                      ? "border-destructive/50 bg-destructive/5"
                      : task.completed
                        ? "border-border/20 bg-secondary/10"
                        : "border-border/40 bg-secondary/30"
                  }`}
                >
                  <Checkbox
                    data-ocid={`tasks.checkbox.${idx + 1}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : overdue
                            ? "text-destructive"
                            : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.note && (
                      <p
                        className={`text-xs mt-0.5 line-clamp-2 ${
                          task.completed
                            ? "text-muted-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {task.note}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 ${
                          overdue
                            ? "border-destructive/50 text-destructive"
                            : task.completed
                              ? "border-border/30 text-muted-foreground"
                              : "border-primary/30 text-primary"
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {overdue ? "Overdue · " : ""}
                        {formatDeadline(task.deadline)}
                      </Badge>
                      {task.completed && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border/30 text-muted-foreground"
                        >
                          Done
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    data-ocid={`tasks.delete_button.${idx + 1}`}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 hover:bg-destructive/20"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
