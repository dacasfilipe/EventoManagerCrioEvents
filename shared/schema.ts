import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for event status
export const eventStatusEnum = pgEnum('event_status', ['confirmed', 'pending', 'cancelled', 'planning']);
export const eventCategoryEnum = pgEnum('event_category', ['conference', 'workshop', 'training', 'webinar', 'meeting', 'other']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const authProviderEnum = pgEnum('auth_provider', ['local', 'google', 'facebook']);

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  category: eventCategoryEnum("category").notNull(),
  status: eventStatusEnum("status").notNull().default('pending'),
  capacity: integer("capacity"),
  createdBy: text("created_by"),
  imageUrl: text("image_url"),
  eventLink: text("event_link"),
});

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(), // References events.id
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default('confirmed'), // confirmed, cancelled, pending
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password"), // Hashed password for local auth
  name: text("name"),
  role: userRoleEnum("role").notNull().default("user"),
  provider: authProviderEnum("provider").notNull().default("local"),
  providerId: text("provider_id"), // ID from social provider
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(table.email),
  };
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id"), // References events.id
  attendeeId: integer("attendee_id"), // References attendees.id
  userId: integer("user_id"), // References users.id
  action: text("action").notNull(), // created, updated, rsvp, cancelled, login
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  description: text("description").notNull(),
});

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertAttendeeSchema = createInsertSchema(attendees).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Extended schema for validation
export const eventFormSchema = insertEventSchema.extend({
  date: z.coerce.date(),
  capacity: z.coerce.number().min(1).optional(),
  imageUrl: z.string().optional(),
  eventLink: z.string().url("O link do evento deve ser uma URL válida").optional(),
});

export const attendeeFormSchema = insertAttendeeSchema.extend({
  email: z.string().email()
});

// User schemas for registration and login
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventFormValues = z.infer<typeof eventFormSchema>;

export type Attendee = typeof attendees.$inferSelect;
export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type AttendeeFormValues = z.infer<typeof attendeeFormSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUserValues = z.infer<typeof registerUserSchema>; 
export type LoginUserValues = z.infer<typeof loginUserSchema>;

// Categories with display information
export const eventCategories = [
  { value: 'conference', label: 'Conferência', color: 'blue' },
  { value: 'workshop', label: 'Workshop', color: 'green' },
  { value: 'training', label: 'Treinamento', color: 'purple' },
  { value: 'webinar', label: 'Webinar', color: 'indigo' },
  { value: 'meeting', label: 'Reunião', color: 'orange' },
  { value: 'other', label: 'Outro', color: 'gray' },
];

// Status with display information
export const eventStatuses = [
  { value: 'confirmed', label: 'Confirmado', color: 'green' },
  { value: 'pending', label: 'Pendente', color: 'yellow' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' },
  { value: 'planning', label: 'Planejamento', color: 'blue' },
];
