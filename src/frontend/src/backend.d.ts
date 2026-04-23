import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProductivityLog {
    notes: string;
    rating: bigint;
}
export interface Habit {
    id: Id;
    completionDates: Array<Date_>;
    name: string;
}
export type Date_ = string;
export interface CalendarEvent {
    id: Id;
    title: string;
    date: Date_;
    description: string;
    eventType: string;
}
export interface RevisionTopic {
    id: Id;
    title: string;
    completedIntervals: Array<bigint>;
    intervals: Array<bigint>;
    createdAt: bigint;
}
export type Id = bigint;
export interface backendInterface {
    completeHabit(id: Id, date: Date_): Promise<void>;
    completeRevisionInterval(id: Id, interval: bigint): Promise<void>;
    createCalendarEvent(title: string, date: Date_, eventType: string, description: string): Promise<Id>;
    createHabit(name: string): Promise<Id>;
    createRevisionTopic(title: string, intervals: Array<bigint>): Promise<Id>;
    deleteCalendarEvent(id: Id): Promise<void>;
    deleteHabit(id: Id): Promise<void>;
    deleteRevisionTopic(id: Id): Promise<void>;
    getAllCalendarEvents(): Promise<Array<CalendarEvent>>;
    getAllHabits(): Promise<Array<Habit>>;
    getAllProductivityLogs(): Promise<Array<[Date_, ProductivityLog]>>;
    getAllRevisionTopics(): Promise<Array<RevisionTopic>>;
    getCalendarEvent(id: Id): Promise<CalendarEvent>;
    getHabitCompletionDates(id: Id): Promise<Array<Date_>>;
    getProductivityLog(date: Date_): Promise<ProductivityLog>;
    saveProductivityLog(date: Date_, rating: bigint, notes: string): Promise<void>;
    updateCalendarEvent(id: Id, title: string, date: Date_, eventType: string, description: string): Promise<void>;
}
