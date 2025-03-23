import { 
  events, type Event, type InsertEvent,
  attendees, type Attendee, type InsertAttendee,
  activities, type Activity, type InsertActivity,
  users, type User, type InsertUser
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByCategory(category: string): Promise<Event[]>;
  getEventsByStatus(status: string): Promise<Event[]>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Attendee operations
  getAttendees(): Promise<Attendee[]>;
  getAttendee(id: number): Promise<Attendee | undefined>;
  getAttendeesByEvent(eventId: number): Promise<Attendee[]>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: number): Promise<boolean>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivitiesByEvent(eventId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  setUserRole(id: number, role: 'admin' | 'user'): Promise<User | undefined>;
  
  // Statistics
  getEventStats(): Promise<{
    upcoming: number;
    participants: number;
    completed: number;
    cancelled: number;
  }>;
  getEventsByMonth(year: number, month: number): Promise<Event[]>;
  getCategoryCounts(): Promise<{ category: string; count: number }[]>;
  
  // Session Store
  sessionStore: any; // express-session store
}

// Importando o módulo de sessão
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private events: Map<number, Event>;
  private attendees: Map<number, Attendee>;
  private activities: Map<number, Activity>;
  private users: Map<number, User>;
  private eventId: number;
  private attendeeId: number;
  private activityId: number;
  private userId: number;
  sessionStore: session.Store;

  constructor() {
    this.events = new Map();
    this.attendees = new Map();
    this.activities = new Map();
    this.users = new Map();
    this.eventId = 1;
    this.attendeeId = 1;
    this.activityId = 1;
    this.userId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 horas
    });
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByCategory(category: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.category === category
    );
  }

  async getEventsByStatus(status: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.status === status
    );
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      }
    );
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    // Garantir que todos os campos necessários estejam presentes
    const event: Event = { 
      ...eventData, 
      id,
      status: eventData.status || "pending",
      capacity: eventData.capacity === undefined ? null : eventData.capacity,
      createdBy: eventData.createdBy || null,
      imageUrl: eventData.imageUrl || "",
      eventLink: eventData.eventLink || null
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Attendee operations
  async getAttendees(): Promise<Attendee[]> {
    return Array.from(this.attendees.values());
  }

  async getAttendee(id: number): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }

  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values()).filter(
      (attendee) => attendee.eventId === eventId
    );
  }

  async createAttendee(attendeeData: InsertAttendee): Promise<Attendee> {
    const id = this.attendeeId++;
    const attendee: Attendee = { 
      ...attendeeData, 
      id,
      status: attendeeData.status || "pending"
    };
    this.attendees.set(id, attendee);
    return attendee;
  }

  async updateAttendee(id: number, attendeeData: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const attendee = this.attendees.get(id);
    if (!attendee) return undefined;

    const updatedAttendee = { ...attendee, ...attendeeData };
    this.attendees.set(id, updatedAttendee);
    return updatedAttendee;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    return this.attendees.delete(id);
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  async getActivitiesByEvent(eventId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.eventId === eventId)
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const activity: Activity = { 
      ...activityData, 
      id,
      eventId: activityData.eventId || null,
      attendeeId: activityData.attendeeId || null,
      userId: activityData.userId || null,
      timestamp: activityData.timestamp || new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.provider === provider && user.providerId === providerId
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = {
      ...userData,
      id,
      name: userData.name || null,
      password: userData.password || null,
      providerId: userData.providerId || null,
      avatarUrl: userData.avatarUrl || null,
      role: userData.role || "user",
      provider: userData.provider || "local",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async setUserRole(id: number, role: 'admin' | 'user'): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Statistics
  async getEventStats(): Promise<{
    upcoming: number;
    participants: number;
    completed: number;
    cancelled: number;
  }> {
    const now = new Date();
    const events = Array.from(this.events.values());
    
    const upcoming = events.filter(event => new Date(event.date) > now && event.status !== 'cancelled').length;
    const completed = events.filter(event => new Date(event.date) < now && event.status !== 'cancelled').length;
    const cancelled = events.filter(event => event.status === 'cancelled').length;
    
    const participants = Array.from(this.attendees.values()).filter(
      (attendee) => attendee.status === 'confirmed'
    ).length;

    return {
      upcoming,
      participants,
      completed,
      cancelled
    };
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => {
      const date = new Date(event.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }

  async getCategoryCounts(): Promise<{ category: string; count: number }[]> {
    const events = Array.from(this.events.values());
    const categoryCounts = new Map<string, number>();
    
    events.forEach(event => {
      const currentCount = categoryCounts.get(event.category) || 0;
      categoryCounts.set(event.category, currentCount + 1);
    });
    
    return Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}

export const storage = new MemStorage();
