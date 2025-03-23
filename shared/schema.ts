import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for event status
export const eventStatusEnum = pgEnum('event_status', ['confirmed', 'pending', 'cancelled', 'planning']);
export const eventCategoryEnum = pgEnum('event_category', ['conference', 'workshop', 'training', 'webinar', 'meeting', 'other']);

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
});

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(), // References events.id
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default('confirmed'), // confirmed, cancelled, pending
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id"), // References events.id
  attendeeId: integer("attendee_id"), // References attendees.id
  action: text("action").notNull(), // created, updated, rsvp, cancelled
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  description: text("description").notNull(),
});

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertAttendeeSchema = createInsertSchema(attendees).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });

// Extended schema for validation
export const eventFormSchema = insertEventSchema.extend({
  date: z.coerce.date(),
  capacity: z.coerce.number().min(1).optional(),
  imageUrl: z.string().url().optional(),
});

export const attendeeFormSchema = insertAttendeeSchema.extend({
  email: z.string().email()
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
