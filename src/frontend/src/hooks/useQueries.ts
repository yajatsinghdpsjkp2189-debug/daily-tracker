import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CalendarEvent,
  Habit,
  ProductivityLog,
  RevisionTopic,
} from "../backend.d";
import { localActor } from "../lib/localStore";

export type { CalendarEvent, Habit, ProductivityLog, RevisionTopic };

export function useProductivityLog(date: string) {
  return useQuery<ProductivityLog | null>({
    queryKey: ["productivityLog", date],
    queryFn: () => localActor.getProductivityLog(date),
  });
}

export function useAllProductivityLogs() {
  return useQuery<Array<[string, ProductivityLog]>>({
    queryKey: ["allProductivityLogs"],
    queryFn: () => localActor.getAllProductivityLogs(),
  });
}

export function useSaveProductivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      date,
      rating,
      notes,
    }: { date: string; rating: number; notes: string }) =>
      localActor.saveProductivityLog(date, BigInt(rating), notes),
    onSuccess: (_data, { date }) => {
      qc.invalidateQueries({ queryKey: ["productivityLog", date] });
      qc.invalidateQueries({ queryKey: ["allProductivityLogs"] });
    },
  });
}

export function useAllCalendarEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: ["calendarEvents"],
    queryFn: () => localActor.getAllCalendarEvents(),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: {
      title: string;
      date: string;
      eventType: string;
      description: string;
    }) =>
      localActor.createCalendarEvent(
        e.title,
        e.date,
        e.eventType,
        e.description,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: {
      id: bigint;
      title: string;
      date: string;
      eventType: string;
      description: string;
    }) =>
      localActor.updateCalendarEvent(
        e.id,
        e.title,
        e.date,
        e.eventType,
        e.description,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => localActor.deleteCalendarEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useAllHabits() {
  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => localActor.getAllHabits(),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => localActor.createHabit(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: bigint; date: string }) =>
      localActor.completeHabit(id, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => localActor.deleteHabit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useAllRevisionTopics() {
  return useQuery<RevisionTopic[]>({
    queryKey: ["revisionTopics"],
    queryFn: () => localActor.getAllRevisionTopics(),
  });
}

export function useCreateRevisionTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      intervals,
    }: { title: string; intervals: number[] }) =>
      localActor.createRevisionTopic(title, intervals.map(BigInt)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revisionTopics"] }),
  });
}

export function useCompleteRevisionInterval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, interval }: { id: bigint; interval: bigint }) =>
      localActor.completeRevisionInterval(id, interval),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revisionTopics"] }),
  });
}

export function useDeleteRevisionTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => localActor.deleteRevisionTopic(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revisionTopics"] }),
  });
}
