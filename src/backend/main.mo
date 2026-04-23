import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

actor {
  type Id = Nat;
  type Date = Text;

  type ProductivityLog = {
    rating : Nat;
    notes : Text;
  };

  type CalendarEvent = {
    id : Id;
    title : Text;
    date : Date;
    eventType : Text;
    description : Text;
  };

  type Habit = {
    id : Id;
    name : Text;
    completionDates : [Date];
  };

  type RevisionTopic = {
    id : Id;
    title : Text;
    createdAt : Int;
    intervals : [Nat];
    completedIntervals : [Nat];
  };

  module CalendarEvent {
    public func compare(event1 : CalendarEvent, event2 : CalendarEvent) : Order.Order {
      switch (Int.compare(event1.date.size(), event2.date.size())) {
        case (#equal) { Nat.compare(event1.id, event2.id) };
        case (order) { order };
      };
    };
  };

  module RevisionTopic {
    public func compare(topic1 : RevisionTopic, topic2 : RevisionTopic) : Order.Order {
      switch (Int.compare(topic1.createdAt, topic2.createdAt)) {
        case (#equal) { Nat.compare(topic1.id, topic2.id) };
        case (order) { order };
      };
    };
  };

  type UserData = {
    productivityLogs : List.List<(Date, ProductivityLog)>;
    calendarEvents : List.List<CalendarEvent>;
    habits : List.List<Habit>;
    revisionTopics : List.List<RevisionTopic>;
  };

  let users = Map.empty<Principal, UserData>();
  var nextId = 0;

  func getNextId() : Id {
    let id = nextId;
    nextId += 1;
    id;
  };

  func getUserData(caller : Principal) : UserData {
    switch (users.get(caller)) {
      case (null) {
        let newUserData = {
          productivityLogs = List.empty<(Date, ProductivityLog)>();
          calendarEvents = List.empty<CalendarEvent>();
          habits = List.empty<Habit>();
          revisionTopics = List.empty<RevisionTopic>();
        };
        users.add(caller, newUserData);
        newUserData;
      };
      case (?userData) { userData };
    };
  };

  // Productivity Logs
  public shared ({ caller }) func saveProductivityLog(date : Date, rating : Nat, notes : Text) : async () {
    let userData = getUserData(caller);
    if (rating < 1 or rating > 5) { Runtime.trap("Rating must be between 1 and 5") };

    let newLog : ProductivityLog = {
      rating;
      notes;
    };

    userData.productivityLogs.add((date, newLog));
  };

  public query ({ caller }) func getProductivityLog(date : Date) : async ProductivityLog {
    let userData = getUserData(caller);
    switch (userData.productivityLogs.find(func((d, _)) { d == date })) {
      case (null) { Runtime.trap("No log found for this date") };
      case (?(d, log)) { log };
    };
  };

  public query ({ caller }) func getAllProductivityLogs() : async [(Date, ProductivityLog)] {
    let userData = getUserData(caller);
    userData.productivityLogs.toArray();
  };

  // Calendar Events
  public shared ({ caller }) func createCalendarEvent(title : Text, date : Date, eventType : Text, description : Text) : async Id {
    let userData = getUserData(caller);
    let id = getNextId();

    let newEvent : CalendarEvent = {
      id;
      title;
      date;
      eventType;
      description;
    };

    userData.calendarEvents.add(newEvent);
    id;
  };

  public query ({ caller }) func getCalendarEvent(id : Id) : async CalendarEvent {
    let userData = getUserData(caller);
    switch (userData.calendarEvents.find(func(event) { event.id == id })) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) { event };
    };
  };

  public query ({ caller }) func getAllCalendarEvents() : async [CalendarEvent] {
    let userData = getUserData(caller);
    userData.calendarEvents.toArray().sort();
  };

  public shared ({ caller }) func updateCalendarEvent(id : Id, title : Text, date : Date, eventType : Text, description : Text) : async () {
    let userData = getUserData(caller);
    let index = userData.calendarEvents.toArray().findIndex(func(event) { event.id == id });
    switch (index) {
      case (null) { Runtime.trap("Event not found") };
      case (?i) {
        let updatedEvent : CalendarEvent = {
          id;
          title;
          date;
          eventType;
          description;
        };
        userData.calendarEvents.toArray().toVarArray<CalendarEvent>()[i] := updatedEvent;
      };
    };
  };

  public shared ({ caller }) func deleteCalendarEvent(id : Id) : async () {
    let userData = getUserData(caller);
    let filteredEvents = userData.calendarEvents.filter(func(event) { event.id != id });
    if (filteredEvents.size() == userData.calendarEvents.size()) {
      Runtime.trap("Event not found");
    } else {
      let updatedUserData = {
        productivityLogs = userData.productivityLogs;
        calendarEvents = filteredEvents;
        habits = userData.habits;
        revisionTopics = userData.revisionTopics;
      };
      users.add(caller, updatedUserData);
    };
  };

  // Habits
  public shared ({ caller }) func createHabit(name : Text) : async Id {
    let userData = getUserData(caller);
    let id = getNextId();

    let newHabit : Habit = {
      id;
      name;
      completionDates = [];
    };

    userData.habits.add(newHabit);
    id;
  };

  public shared ({ caller }) func completeHabit(id : Id, date : Date) : async () {
    let userData = getUserData(caller);
    let index = userData.habits.toArray().findIndex(func(habit) { habit.id == id });
    switch (index) {
      case (null) { Runtime.trap("Habit not found") };
      case (?i) {
        let habit = userData.habits.toArray()[i];
        let updatedHabit = {
          id = habit.id;
          name = habit.name;
          completionDates = habit.completionDates.concat([date]);
        };
        userData.habits.toArray().toVarArray<Habit>()[i] := updatedHabit;
      };
    };
  };

  public query ({ caller }) func getHabitCompletionDates(id : Id) : async [Date] {
    let userData = getUserData(caller);
    switch (userData.habits.find(func(habit) { habit.id == id })) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habit) { habit.completionDates };
    };
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    let userData = getUserData(caller);
    userData.habits.toArray();
  };

  public shared ({ caller }) func deleteHabit(id : Id) : async () {
    let userData = getUserData(caller);
    let filteredHabits = userData.habits.filter(func(habit) { habit.id != id });
    if (filteredHabits.size() == userData.habits.size()) {
      Runtime.trap("Habit not found");
    } else {
      let updatedUserData = {
        productivityLogs = userData.productivityLogs;
        calendarEvents = userData.calendarEvents;
        habits = filteredHabits;
        revisionTopics = userData.revisionTopics;
      };
      users.add(caller, updatedUserData);
    };
  };

  // Revision Topics
  public shared ({ caller }) func createRevisionTopic(title : Text, intervals : [Nat]) : async Id {
    let userData = getUserData(caller);
    let id = getNextId();
    let createdAt = Time.now();

    let newTopic : RevisionTopic = {
      id;
      title;
      createdAt;
      intervals;
      completedIntervals = [];
    };

    userData.revisionTopics.add(newTopic);
    id;
  };

  public query ({ caller }) func getAllRevisionTopics() : async [RevisionTopic] {
    let userData = getUserData(caller);
    userData.revisionTopics.toArray().sort();
  };

  public shared ({ caller }) func completeRevisionInterval(id : Id, interval : Nat) : async () {
    let userData = getUserData(caller);
    let index = userData.revisionTopics.toArray().findIndex(func(topic) { topic.id == id });
    switch (index) {
      case (null) { Runtime.trap("Topic not found") };
      case (?i) {
        let topic = userData.revisionTopics.toArray()[i];
        let updatedTopic = {
          id = topic.id;
          title = topic.title;
          createdAt = topic.createdAt;
          intervals = topic.intervals;
          completedIntervals = topic.completedIntervals.concat([interval]);
        };
        userData.revisionTopics.toArray().toVarArray<RevisionTopic>()[i] := updatedTopic;
      };
    };
  };

  public shared ({ caller }) func deleteRevisionTopic(id : Id) : async () {
    let userData = getUserData(caller);
    let filteredTopics = userData.revisionTopics.filter(func(topic) { topic.id != id });
    if (filteredTopics.size() == userData.revisionTopics.size()) {
      Runtime.trap("Topic not found");
    } else {
      let updatedUserData = {
        productivityLogs = userData.productivityLogs;
        calendarEvents = userData.calendarEvents;
        habits = userData.habits;
        revisionTopics = filteredTopics;
      };
      users.add(caller, updatedUserData);
    };
  };
};
