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
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

// Função para fazer hash de senha
const scryptAsync = promisify(scrypt);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
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
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Você precisa estar logado para criar um evento" });
    }

    try {
      const eventData = eventFormSchema.parse(req.body);
      
      // Format date and time appropriately
      const formattedDate = eventData.date;
      
      // Define o status inicial com base no papel do usuário
      // Admins podem criar eventos já confirmados, usuários comuns criam eventos pendentes
      const status = req.user.role === "admin" ? "confirmed" : "pending";
      
      // Associar o evento ao usuário que o criou
      const newEvent = await storage.createEvent({
        ...eventData,
        date: formattedDate,
        status,
        userId: req.user.id
      });

      // Create an activity for this new event
      await storage.createActivity({
        eventId: newEvent.id,
        userId: req.user.id,
        action: "created",
        timestamp: new Date(),
        description: `Evento "${newEvent.name}" foi criado por ${req.user.username}`
      });

      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      return handleZodError(error, res);
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Você precisa estar logado para atualizar um evento" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar permissão: apenas o criador ou um admin pode editar
      if (event.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ 
          message: "Você não tem permissão para editar este evento" 
        });
      }

      const eventData = eventFormSchema.parse(req.body);
      
      // Se o usuário não for admin, remover campos que ele não deveria alterar
      let updatedFields: any = { ...eventData };
      if (req.user.role !== "admin") {
        // Usuário comum não pode mudar o status do evento
        delete updatedFields.status;
      }
      
      const updatedEvent = await storage.updateEvent(id, updatedFields);

      // Create an activity for this update
      await storage.createActivity({
        eventId: id,
        userId: req.user.id,
        action: "updated",
        timestamp: new Date(),
        description: `Evento "${updatedEvent?.name}" foi atualizado por ${req.user.username}`
      });

      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      return handleZodError(error, res);
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Você precisa estar logado para atualizar um evento" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar permissão: apenas o criador ou um admin pode editar
      if (event.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ 
          message: "Você não tem permissão para editar este evento" 
        });
      }

      // A diferença do PATCH é que validamos apenas os campos enviados
      const eventData = req.body;
      
      // Se o usuário não for admin, remover campos que ele não deveria alterar
      let updatedFields: any = { ...eventData };
      if (req.user.role !== "admin") {
        // Usuário comum não pode mudar o status do evento
        delete updatedFields.status;
      }
      
      // Tratar a data corretamente
      if (updatedFields.date) {
        try {
          // Converter para objeto Date se for string
          if (typeof updatedFields.date === 'string') {
            updatedFields.date = new Date(updatedFields.date);
          }
          
          // Verificar se a data é válida
          if (isNaN(updatedFields.date.getTime())) {
            return res.status(400).json({ message: "Data inválida" });
          }
        } catch (error) {
          console.error("Erro ao processar data:", error);
          return res.status(400).json({ message: "Formato de data inválido" });
        }
      }
      
      const updatedEvent = await storage.updateEvent(id, updatedFields);

      // Create an activity for this update
      await storage.createActivity({
        eventId: id,
        userId: req.user.id,
        action: "updated",
        timestamp: new Date(),
        description: `Evento "${updatedEvent?.name}" foi atualizado por ${req.user.username}`
      });

      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      return res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Você precisa estar logado para excluir um evento" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar permissão: apenas o criador ou um admin pode excluir
      if (event.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ 
          message: "Você não tem permissão para excluir este evento" 
        });
      }

      await storage.deleteEvent(id);

      // Create an activity for this deletion
      await storage.createActivity({
        eventId: id,
        userId: req.user.id,
        action: "deleted",
        timestamp: new Date(),
        description: `Evento "${event.name}" foi excluído por ${req.user.username}`
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Attendees API
  app.get("/api/attendees", async (req, res) => {
    try {
      const attendees = await storage.getAttendees();
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching all attendees:", error);
      res.status(500).json({ message: "Failed to fetch all attendees" });
    }
  });
  
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

  // Activities API - Somente admins podem acessar todas as atividades
  app.get("/api/activities", async (req, res) => {
    // Verificar se o usuário está autenticado e é admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Somente administradores podem acessar esta funcionalidade." });
    }
    
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

  // Stats API - requer autenticação de administrador
  app.get("/api/stats", async (req, res) => {
    // Verificar se o usuário está autenticado e é admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Somente administradores podem acessar esta funcionalidade." });
    }
    
    try {
      const stats = await storage.getEventStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/categories/counts", async (req, res) => {
    // Verificar se o usuário está autenticado e é admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Somente administradores podem acessar esta funcionalidade." });
    }
    
    try {
      const categoryCounts = await storage.getCategoryCounts();
      res.json(categoryCounts);
    } catch (error) {
      console.error("Error fetching category counts:", error);
      res.status(500).json({ message: "Failed to fetch category counts" });
    }
  });

  // Upload de imagens - requer autenticação
  app.post("/api/upload", (req, res, next) => {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Você precisa estar logado para fazer upload de imagens" });
    }
    next();
  }, upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Construir a URL para a imagem
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Registrar atividade
      storage.createActivity({
        action: "upload",
        description: `${req.user.username} fez upload de uma imagem`,
        userId: req.user.id,
        timestamp: new Date()
      }).catch(console.error);
      
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

  // Rota temporária para criar o primeiro administrador - sem verificação de chave para facilitar o teste
  // Esta rota deve ser removida em produção!
  app.post("/api/create-admin", express.json(), async (req, res) => {
    // Forçar o conteúdo a ser do tipo application/json
    res.type('application/json');
    try {
      // Verificar o corpo da requisição
      console.log("Corpo da requisição:", req.body);
      
      // Verificar se o admin (com username 'admin') já existe
      let adminUser = await storage.getUserByUsername("admin");
      
      if (!adminUser) {
        // Criar um usuário admin caso não exista
        adminUser = await storage.createUser({
          username: "admin",
          email: "admin@eventopro.com",
          password: await hashPassword("admin123"),
          name: "Administrador do Sistema",
          role: "admin",
          provider: "local"
        });
        
        // Registrar atividade
        await storage.createActivity({
          action: "setup",
          description: "Administrador inicial configurado pelo sistema",
          userId: adminUser.id,
          timestamp: new Date()
        });
        
        return res.json({ 
          message: "Administrador inicial criado com sucesso",
          credentials: {
            username: adminUser.username,
            password: "admin123"
          }
        });
      }
      
      // Se o usuário já existe, verificar se é admin e promover caso não seja
      if (adminUser.role !== "admin") {
        const updatedUser = await storage.setUserRole(adminUser.id, "admin");
        return res.json({ 
          message: "Usuário 'admin' promovido a administrador",
          credentials: {
            username: adminUser.username,
            password: "Senha definida anteriormente"
          }
        });
      }
      
      return res.json({ 
        message: "Administrador já existe",
        credentials: {
          username: adminUser.username,
          password: "Senha definida anteriormente"
        }
      });
    } catch (error) {
      console.error("Erro ao configurar admin:", error);
      return res.status(500).json({ message: "Erro interno ao configurar administrador" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
