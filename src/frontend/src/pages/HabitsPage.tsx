import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Flame, Loader2, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAllHabits,
  useCompleteHabit,
  useCreateHabit,
  useDeleteHabit,
} from "../hooks/useQueries";
import { getStreak, todayStr } from "../lib/streak";

export default function HabitsPage() {
  const today = todayStr();
  const { data: habits = [], isLoading } = useAllHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const deleteHabit = useDeleteHabit();
  const [newName, setNewName] = useState("");
  const [shownMilestones, setShownMilestones] = useState<Set<string>>(
    new Set(),
  );
  const prevHabitsRef = useRef<typeof habits>([]);

  useEffect(() => {
    for (const habit of habits) {
      const streak = getStreak(habit.completionDates);
      const key21 = `${String(habit.id)}-21`;
      const key90 = `${String(habit.id)}-90`;
      if (streak === 21 && !shownMilestones.has(key21)) {
        toast(
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-semibold font-display">Good job! 🎉</p>
              <p className="text-sm">
                21-day streak on <strong>{habit.name}</strong>!
              </p>
            </div>
          </div>,
          { duration: 6000 },
        );
        setShownMilestones((s) => new Set([...s, key21]));
      }
      if (streak === 90 && !shownMilestones.has(key90)) {
        toast(
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <p className="font-semibold font-display">Excellent! 🏆</p>
              <p className="text-sm">
                90-day streak on <strong>{habit.name}</strong>!
              </p>
            </div>
          </div>,
          { duration: 8000 },
        );
        setShownMilestones((s) => new Set([...s, key90]));
      }
    }
    prevHabitsRef.current = habits;
  }, [habits, shownMilestones]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Enter a habit name");
      return;
    }
    try {
      await createHabit.mutateAsync(newName.trim());
      setNewName("");
      toast.success("Habit created!");
    } catch {
      toast.error("Failed to create habit");
    }
  };

  const handleToggle = async (id: bigint, isCompleted: boolean) => {
    if (isCompleted) return;
    try {
      await completeHabit.mutateAsync({ id, date: today });
    } catch {
      toast.error("Failed to complete habit");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success("Habit removed");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  function getStreakBadgeStyle(streak: number) {
    if (streak >= 90)
      return "border-purple-500/60 text-purple-400 bg-purple-500/10";
    if (streak >= 21)
      return "border-amber-500/60 text-amber-400 bg-amber-500/10";
    if (streak >= 7) return "border-primary/60 text-primary bg-primary/10";
    return "border-border/50 text-muted-foreground";
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const item = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <Flame className="w-7 h-7 text-primary" /> Daily Habits
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Build consistency, one day at a time
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-shine border-border/50">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Input
                data-ocid="habit.input"
                placeholder="New habit name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="bg-secondary/40 border-border/50 flex-1"
              />
              <Button
                data-ocid="habit.add_button"
                onClick={handleAdd}
                disabled={createHabit.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
              >
                {createHabit.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Your Habits</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div
                className="flex justify-center py-8"
                data-ocid="habit.loading_state"
              >
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-10" data-ocid="habit.empty_state">
                <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No habits yet.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Add your first habit above to get started!
                </p>
              </div>
            ) : (
              <motion.ul
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <AnimatePresence>
                  {habits.map((habit, idx) => {
                    const streak = getStreak(habit.completionDates);
                    const isCompleted = habit.completionDates.includes(today);
                    const isMilestone21 = streak >= 21 && streak < 90;
                    const isMilestone90 = streak >= 90;
                    return (
                      <motion.li
                        key={String(habit.id)}
                        variants={item}
                        exit={{ opacity: 0, x: 16 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                          isMilestone90
                            ? "border-purple-500/30 bg-purple-500/8 glow-green"
                            : isMilestone21
                              ? "border-amber-500/30 bg-amber-500/8"
                              : "border-border/40 bg-secondary/20"
                        }`}
                        data-ocid={`habit.item.${idx + 1}`}
                      >
                        <Checkbox
                          data-ocid={`habit.checkbox.${idx + 1}`}
                          checked={isCompleted}
                          onCheckedChange={() =>
                            handleToggle(habit.id, isCompleted)
                          }
                          disabled={isCompleted || completeHabit.isPending}
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                          >
                            {habit.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {streak > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                {streak} day streak
                              </span>
                            )}
                            {isMilestone90 && (
                              <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/40">
                                🏆 90 days!
                              </Badge>
                            )}
                            {isMilestone21 && !isMilestone90 && (
                              <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40">
                                ⭐ 21 days!
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {streak > 0 && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStreakBadgeStyle(streak)}`}
                            >
                              {streak}d
                            </Badge>
                          )}
                          <Button
                            data-ocid={`habit.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/20"
                            onClick={() => handleDelete(habit.id)}
                            disabled={deleteHabit.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
