import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAllHabits,
  useAllRevisionTopics,
  useCompleteHabit,
  useProductivityLog,
  useSaveProductivityLog,
} from "../hooks/useQueries";
import { getStreak, isIntervalDue, todayStr } from "../lib/streak";

const RATING_EMOJIS = [
  { value: 1, emoji: "😴", label: "Unproductive", color: "text-red-400" },
  { value: 2, emoji: "😐", label: "Below average", color: "text-orange-400" },
  { value: 3, emoji: "🙂", label: "Average", color: "text-yellow-400" },
  { value: 4, emoji: "😊", label: "Good", color: "text-lime-400" },
  { value: 5, emoji: "🚀", label: "Excellent!", color: "text-green-400" },
];

export default function Dashboard() {
  const today = todayStr();
  const { data: log, isLoading: logLoading } = useProductivityLog(today);
  const { data: habits = [], isLoading: habitsLoading } = useAllHabits();
  const { data: topics = [] } = useAllRevisionTopics();
  const saveLog = useSaveProductivityLog();
  const completeHabit = useCompleteHabit();

  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (log) {
      setRating(Number(log.rating));
      setNotes(log.notes);
      setSaved(true);
    }
  }, [log]);

  const handleSave = async () => {
    if (!rating) {
      toast.error("Please select a rating first");
      return;
    }
    try {
      await saveLog.mutateAsync({ date: today, rating, notes });
      setSaved(true);
      toast.success("Productivity logged! Keep it up 💪");
    } catch {
      toast.error("Failed to save log");
    }
  };

  const handleHabitToggle = async (habitId: bigint, isCompleted: boolean) => {
    if (isCompleted) return;
    try {
      await completeHabit.mutateAsync({ id: habitId, date: today });
      toast.success("Habit completed! 🎯");
    } catch {
      toast.error("Failed to complete habit");
    }
  };

  const dueRevisions = topics.filter((t) =>
    t.intervals.some(
      (iv) =>
        isIntervalDue(t.createdAt, iv) && !t.completedIntervals.includes(iv),
    ),
  );

  const totalStreaks = habits.reduce(
    (sum, h) => sum + getStreak(h.completionDates),
    0,
  );
  const nextRevision = topics
    .flatMap((t) =>
      t.intervals
        .filter((iv) => !t.completedIntervals.includes(iv))
        .map((iv) => ({
          title: t.title,
          dueDate: new Date(
            Number(t.createdAt / 1_000_000n) + Number(iv) * 86400000,
          ),
        })),
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">How was your day?</p>
      </motion.div>

      {/* Quick Summary */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        <motion.div variants={item}>
          <Card className="card-shine border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Streaks</p>
                <p className="text-xl font-display font-bold text-primary">
                  {totalStreaks}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="card-shine border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Revision</p>
                <p className="text-sm font-display font-semibold truncate max-w-[90px]">
                  {nextRevision ? nextRevision.title : "All clear!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Productivity Rating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Today's Productivity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logLoading ? (
              <div
                className="flex justify-center py-4"
                data-ocid="productivity.loading_state"
              >
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div
                  className="flex justify-between gap-2"
                  data-ocid="productivity.rating.input"
                >
                  {RATING_EMOJIS.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => {
                        setRating(r.value);
                        setSaved(false);
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                        rating === r.value
                          ? "border-primary bg-primary/15 scale-105"
                          : "border-border/40 bg-secondary/30 hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{r.emoji}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
                <Textarea
                  data-ocid="productivity.notes.textarea"
                  placeholder="Reflect on your day — wins, blockers, learnings..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setSaved(false);
                  }}
                  className="bg-secondary/40 border-border/50 resize-none h-24 text-sm"
                />
                <Button
                  data-ocid="productivity.save.button"
                  onClick={handleSave}
                  disabled={saveLog.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saveLog.isPending ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : null}
                  {saved ? "✓ Update Log" : "Save Today's Log"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Habits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Today's Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habitsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : habits.length === 0 ? (
              <p
                className="text-muted-foreground text-sm text-center py-4"
                data-ocid="habit.empty_state"
              >
                No habits yet — add some in the Habits tab!
              </p>
            ) : (
              <ul className="space-y-2">
                {habits.map((habit, idx) => {
                  const isCompleted = habit.completionDates.includes(today);
                  const streak = getStreak(habit.completionDates);
                  return (
                    <li
                      key={String(habit.id)}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          data-ocid={`habit.checkbox.${idx + 1}`}
                          checked={isCompleted}
                          onCheckedChange={() =>
                            handleHabitToggle(habit.id, isCompleted)
                          }
                          disabled={isCompleted || completeHabit.isPending}
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span
                          className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                        >
                          {habit.name}
                        </span>
                      </div>
                      {streak > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/40 text-primary gap-1"
                        >
                          <Flame className="w-3 h-3" />
                          {streak}d
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Due Revisions */}
      {dueRevisions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Due for Revision
                <Badge className="bg-accent/20 text-accent border-accent/30 ml-auto">
                  {dueRevisions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {dueRevisions.map((topic) => (
                  <li
                    key={String(topic.id)}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20"
                  >
                    <span className="text-sm font-medium">{topic.title}</span>
                    <Badge
                      variant="outline"
                      className="text-xs border-accent/40 text-accent"
                    >
                      Review now
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
