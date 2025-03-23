import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertEventSchema, 
  eventFormSchema, 
  insertAttendeeSchema, 
  attendeeFormSchema,
  insertActivitySchema
} from "@shared/schema";
import { format } from "date-fns";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração de upload com multer
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Certifique-se de que o diretório de uploads exista
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configuração de armazenamento para o multer
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = uuidv4();
      const fileExt = path.extname(file.originalname);
      cb(null, uniqueSuffix + fileExt);
    }
  });

  // Filtro para aceitar apenas imagens
  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado. Apenas JPEG, PNG, GIF e WEBP são aceitos."));
    }
  };

  const upload = multer({ 
    storage: multerStorage, 
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });
  
  // Servir arquivos estáticos
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Error handling middleware for zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = eventFormSchema.parse(req.body);
      
      // Format date and time appropriately
      const formattedDate = eventData.date;
      
      const newEvent = await storage.createEvent({
        ...eventData,
        date: formattedDate
      });

      // Create an activity for this new event
      await storage.createActivity({
        eventId: newEvent.id,
        attendeeId: null,
        action: "created",
        timestamp: new Date(),
        description: `Evento "${newEvent.name}" foi criado`
      });

      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      return handleZodError(error, res);
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const eventData = eventFormSchema.parse(req.body);
      
      const updatedEvent = await storage.updateEvent(id, {
        ...eventData
      });

      // Create an activity for this update
      await storage.createActivity({
        eventId: id,
        attendeeId: null,
        action: "updated",
        timestamp: new Date(),
        description: `Evento "${updatedEvent?.name}" foi atualizado`
      });

      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      return handleZodError(error, res);
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      await storage.deleteEvent(id);

      // Create an activity for this deletion
      await storage.createActivity({
        eventId: id,
        attendeeId: null,
        action: "deleted",
        timestamp: new Date(),
        description: `Evento "${event.name}" foi excluído`
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Attendees API
  app.get("/api/events/:eventId/attendees", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const attendees = await storage.getAttendeesByEvent(eventId);
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  app.post("/api/events/:eventId/attendees", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const attendeeData = attendeeFormSchema.parse({
        ...req.body,
        eventId
      });

      const newAttendee = await storage.createAttendee(attendeeData);

      // Create an activity for this new attendee
      await storage.createActivity({
        eventId,
        attendeeId: newAttendee.id,
        action: "rsvp",
        timestamp: new Date(),
        description: `${newAttendee.name} confirmou presença no evento "${event.name}"`
      });

      res.status(201).json(newAttendee);
    } catch (error) {
      console.error("Error creating attendee:", error);
      return handleZodError(error, res);
    }
  });

  app.put("/api/attendees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }

      const attendee = await storage.getAttendee(id);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }

      const event = await storage.getEvent(attendee.eventId);
      if (!event) {
        return res.status(404).json({ message: "Associated event not found" });
      }

      const attendeeData = insertAttendeeSchema.parse(req.body);
      const updatedAttendee = await storage.updateAttendee(id, attendeeData);

      // Create an activity for this update
      await storage.createActivity({
        eventId: attendee.eventId,
        attendeeId: id,
        action: "updated",
        timestamp: new Date(),
        description: `Status de ${updatedAttendee?.name} foi atualizado para ${updatedAttendee?.status}`
      });

      res.json(updatedAttendee);
    } catch (error) {
      console.error("Error updating attendee:", error);
      return handleZodError(error, res);
    }
  });

  // Activities API
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/events/:eventId/activities", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const activities = await storage.getActivitiesByEvent(eventId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Stats API
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getEventStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/categories/counts", async (req, res) => {
    try {
      const categoryCounts = await storage.getCategoryCounts();
      res.json(categoryCounts);
    } catch (error) {
      console.error("Error fetching category counts:", error);
      res.status(500).json({ message: "Failed to fetch category counts" });
    }
  });

  // Upload de imagens
  app.post("/api/upload", upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Construir a URL para a imagem
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        imageUrl,
        message: "Imagem enviada com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      res.status(500).json({ message: "Falha ao fazer upload da imagem" });
    }
  });

  // Filter events
  app.get("/api/events/filter", async (req, res) => {
    try {
      const { status, category, startDate, endDate } = req.query;
      
      let filteredEvents = await storage.getEvents();
      
      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }
      
      if (category) {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= start && eventDate <= end;
          });
        }
      }
      
      res.json(filteredEvents);
    } catch (error) {
      console.error("Error filtering events:", error);
      res.status(500).json({ message: "Failed to filter events" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
