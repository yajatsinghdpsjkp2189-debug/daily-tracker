import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllRevisionTopics,
  useCompleteRevisionInterval,
  useCreateRevisionTopic,
  useDeleteRevisionTopic,
} from "../hooks/useQueries";
import type { RevisionTopic } from "../hooks/useQueries";
import { isIntervalDue } from "../lib/streak";

const DEFAULT_INTERVALS = [1, 3, 7, 30, 60, 90];

export default function RevisionPage() {
  const { data: topics = [], isLoading } = useAllRevisionTopics();
  const createTopic = useCreateRevisionTopic();
  const completeInterval = useCompleteRevisionInterval();
  const deleteTopic = useDeleteRevisionTopic();

  const [title, setTitle] = useState("");
  const [intervals, setIntervals] = useState<number[]>([...DEFAULT_INTERVALS]);
  const [customInterval, setCustomInterval] = useState("");

  const addCustomInterval = () => {
    const v = Number.parseInt(customInterval);
    if (!v || v < 1) {
      toast.error("Enter a valid number of days");
      return;
    }
    if (intervals.includes(v)) {
      toast.error("Interval already exists");
      return;
    }
    setIntervals((prev) => [...prev, v].sort((a, b) => a - b));
    setCustomInterval("");
  };

  const removeInterval = (iv: number) => {
    setIntervals((prev) => prev.filter((x) => x !== iv));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Enter a topic title");
      return;
    }
    if (intervals.length === 0) {
      toast.error("Add at least one interval");
      return;
    }
    try {
      await createTopic.mutateAsync({ title: title.trim(), intervals });
      setTitle("");
      setIntervals([...DEFAULT_INTERVALS]);
      toast.success("Revision topic created!");
    } catch {
      toast.error("Failed to create topic");
    }
  };

  const handleComplete = async (topic: RevisionTopic, interval: bigint) => {
    try {
      await completeInterval.mutateAsync({ id: topic.id, interval });
      toast.success("Interval marked complete! 📚");
    } catch {
      toast.error("Failed to mark complete");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteTopic.mutateAsync(id);
      toast.success("Topic removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const getIntervalLabel = (days: bigint) => {
    const d = Number(days);
    if (d < 7) return `${d}d`;
    if (d < 30) return `${Math.round(d / 7)}w`;
    if (d < 365) return `${Math.round(d / 30)}mo`;
    return `${Math.round(d / 365)}y`;
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-accent" /> Revision Topics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Spaced repetition to lock in knowledge
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-shine border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">
              Add New Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              data-ocid="revision.topic_title.input"
              placeholder="Topic title, e.g. 'React Hooks', 'Calculus derivatives'..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-secondary/40 border-border/50"
            />

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Revision intervals (days)
              </p>
              <div className="flex flex-wrap gap-2">
                {intervals.map((iv) => (
                  <span
                    key={iv}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30"
                  >
                    {iv}d
                    <button
                      type="button"
                      onClick={() => removeInterval(iv)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Custom interval (days)"
                type="number"
                min="1"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomInterval()}
                className="bg-secondary/40 border-border/50 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomInterval}
                className="border-border/50 hover:bg-secondary gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add interval
              </Button>
            </div>

            <Button
              data-ocid="revision.add_topic.button"
              onClick={handleCreate}
              disabled={createTopic.isPending}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              {createTopic.isPending ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : null}
              Create Revision Topic
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="revision.loading_state"
        >
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : topics.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
          data-ocid="revision.empty_state"
        >
          <BookOpen className="w-14 h-14 text-muted-foreground/25 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No revision topics yet.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Create your first topic above to start spaced repetition.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
            {topics.map((topic, idx) => {
              const createdDate = new Date(
                Number(topic.createdAt / 1_000_000n),
              );
              const allDone = topic.intervals.every((iv) =>
                topic.completedIntervals.includes(iv),
              );
              const progress =
                topic.intervals.length > 0
                  ? Math.round(
                      (topic.completedIntervals.length /
                        topic.intervals.length) *
                        100,
                    )
                  : 0;

              return (
                <motion.div
                  key={String(topic.id)}
                  variants={item}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card
                    className={`card-shine border-border/50 ${allDone ? "border-primary/40 bg-primary/5" : ""}`}
                    data-ocid={`revision.item.${idx + 1}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-display truncate flex items-center gap-2">
                            {topic.title}
                            {allDone && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                                ✓ Complete
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Started{" "}
                            {createdDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {" · "}
                            {progress}% done
                          </p>
                        </div>
                        <Button
                          data-ocid={`revision.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/20 flex-shrink-0"
                          onClick={() => handleDelete(topic.id)}
                          disabled={deleteTopic.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-2 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {topic.intervals.map((iv) => {
                          const isCompleted =
                            topic.completedIntervals.includes(iv);
                          const isDue = isIntervalDue(topic.createdAt, iv);
                          const canComplete = !isCompleted && isDue;
                          return (
                            <button
                              type="button"
                              key={String(iv)}
                              data-ocid="revision.complete_interval.button"
                              onClick={() =>
                                canComplete && handleComplete(topic, iv)
                              }
                              disabled={
                                !canComplete || completeInterval.isPending
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                                isCompleted
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : canComplete
                                    ? "bg-accent/15 border-accent/50 text-accent hover:bg-accent/25 cursor-pointer"
                                    : "bg-secondary/30 border-border/30 text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-3 h-3" />
                              ) : null}
                              {getIntervalLabel(iv)}
                              {canComplete && !isCompleted && (
                                <span className="text-accent">●</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
