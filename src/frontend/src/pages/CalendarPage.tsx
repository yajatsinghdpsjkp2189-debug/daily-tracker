import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Swords,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllCalendarEvents,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
} from "../hooks/useQueries";
import type { CalendarEvent } from "../hooks/useQueries";
import { useTasks } from "../hooks/useTasks";

const EVENT_TYPES = [
  { value: "task", label: "Task", color: "bg-primary/80" },
  { value: "event", label: "Event", color: "bg-accent/80" },
  { value: "reminder", label: "Reminder", color: "bg-chart-3/80" },
  { value: "plan", label: "Plan", color: "bg-chart-4/80" },
];

function getEventColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? "bg-muted";
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface EventFormData {
  title: string;
  date: string;
  eventType: string;
  description: string;
}

const EMPTY_FORM: EventFormData = {
  title: "",
  date: "",
  eventType: "task",
  description: "",
};

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);

  const { data: events = [], isLoading } = useAllCalendarEvents();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const { tasks } = useTasks();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const eventsForDay = (dateStr: string) =>
    events.filter((e) => e.date === dateStr);
  const tasksForDay = (dateStr: string) =>
    tasks.filter((t) => t.deadline === dateStr);
  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];
  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

  const openAddForDay = (dateStr: string) => {
    setForm({ ...EMPTY_FORM, date: dateStr });
    setEditingEvent(null);
    setShowAddDialog(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setForm({
      title: e.title,
      date: e.date,
      eventType: e.eventType,
      description: e.description,
    });
    setEditingEvent(e);
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.date) {
      toast.error("Date is required");
      return;
    }
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, ...form });
        toast.success("Event updated!");
      } else {
        await createEvent.mutateAsync(form);
        toast.success("Event added!");
      }
      setShowAddDialog(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event deleted");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Pre-generate stable keys for empty cells
  const emptyCells = Array.from({ length: firstDay }, (_, i) => `empty-${i}`);

  // Check if a day has any tasks (for dot indicator)
  const hasTasksForDay = (dateStr: string) =>
    tasks.some((t) => t.deadline === dateStr);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary" /> Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage tasks, events, and plans
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                data-ocid="calendar.prev_month.button"
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="hover:bg-secondary/60"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-display font-bold text-lg">{monthName}</h2>
              <Button
                data-ocid="calendar.next_month.button"
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="hover:bg-secondary/60"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted-foreground font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            {isLoading ? (
              <div
                className="flex justify-center py-8"
                data-ocid="calendar.loading_state"
              >
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {emptyCells.map((k) => (
                  <div key={k} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDateStr(year, month, day);
                  const dayEvents = eventsForDay(dateStr);
                  const hasTasks = hasTasksForDay(dateStr);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDay;
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        setSelectedDay(isSelected ? null : dateStr)
                      }
                      className={`relative min-h-[44px] p-1 rounded-lg flex flex-col items-center transition-all duration-150 ${
                        isSelected
                          ? "bg-primary/20 border border-primary/50"
                          : isToday
                            ? "bg-secondary/60 border border-primary/30"
                            : "hover:bg-secondary/40 border border-transparent"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${isToday ? "text-primary font-bold" : ""}`}
                      >
                        {day}
                      </span>
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <span
                            key={String(ev.id)}
                            className={`w-1.5 h-1.5 rounded-full ${getEventColor(ev.eventType)}`}
                          />
                        ))}
                        {hasTasks && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="card-shine border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">
                    {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </CardTitle>
                  <Button
                    data-ocid="calendar.add_event.button"
                    size="sm"
                    onClick={() => openAddForDay(selectedDay)}
                    className="bg-primary/90 hover:bg-primary text-primary-foreground gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Calendar Events */}
                {selectedEvents.length === 0 ? (
                  <p
                    className="text-muted-foreground text-sm text-center py-2"
                    data-ocid="calendar.empty_state"
                  >
                    No events — click Add to create one.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedEvents.map((ev, idx) => (
                      <li
                        key={String(ev.id)}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getEventColor(ev.eventType)}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[10px] mt-1 border-border/50"
                          >
                            {ev.eventType}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-secondary"
                            onClick={() => openEdit(ev)}
                          >
                            <span className="text-xs">✏️</span>
                          </Button>
                          <Button
                            data-ocid={`event.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/20"
                            onClick={() => setDeleteConfirmId(ev.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Side Quest Tasks */}
                {selectedTasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border/30" />
                      <span className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Swords className="w-3 h-3" /> Side Quests
                      </span>
                      <div className="h-px flex-1 bg-border/30" />
                    </div>
                    <ul className="space-y-2">
                      {selectedTasks.map((task) => {
                        const overdue =
                          !task.completed && task.deadline < todayStr;
                        return (
                          <li
                            key={task.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border-l-[3px] ${
                              overdue
                                ? "border-l-destructive bg-destructive/5 border-y border-r border-destructive/20"
                                : task.completed
                                  ? "border-l-border/40 bg-secondary/10 border-y border-r border-border/20"
                                  : "border-l-amber-400/70 bg-amber-400/5 border-y border-r border-amber-400/20"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
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
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] flex-shrink-0 ${
                                    overdue
                                      ? "border-destructive/40 text-destructive"
                                      : "border-amber-400/40 text-amber-400/80"
                                  }`}
                                >
                                  {overdue ? "Overdue" : "Side Quest"}
                                </Badge>
                              </div>
                              {task.note && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {task.note}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="bg-card border-border/60 max-w-sm"
          data-ocid="calendar.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingEvent ? "Edit Event" : "Add Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Title
              </Label>
              <Input
                data-ocid="event.title.input"
                placeholder="Event title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary/40 border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Date
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="bg-secondary/40 border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Type
              </Label>
              <Select
                value={form.eventType}
                onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}
              >
                <SelectTrigger className="bg-secondary/40 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60">
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Description
              </Label>
              <Textarea
                placeholder="Optional notes..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-secondary/40 border-border/50 resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(false)}
              data-ocid="calendar.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="event.save.button"
              onClick={handleSubmit}
              disabled={createEvent.isPending || updateEvent.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createEvent.isPending || updateEvent.isPending ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : null}
              {editingEvent ? "Update" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent
          className="bg-card border-border/60 max-w-sm"
          data-ocid="calendar.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Delete Event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              data-ocid="calendar.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="calendar.delete.confirm_button"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
