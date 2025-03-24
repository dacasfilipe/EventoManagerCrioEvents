import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";

// Declare Google profile type
interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: { value: string }[];
  photos?: { value: string }[];
}

// Extend Express Request with User
declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Estratégia Local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Credenciais inválidas" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Estratégia Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
          proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Verificar se o usuário já existe
            let user = await storage.getUserByProviderId("google", profile.id);
            
            if (!user) {
              // Criar um novo usuário
              user = await storage.createUser({
                username: profile.displayName.replace(/\s+/g, ".").toLowerCase(),
                email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
                name: profile.displayName,
                provider: "google",
                providerId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || null,
                role: "user" // Todos os novos usuários começam como "user"
              });
              
              // Registrar atividade
              await storage.createActivity({
                action: "register",
                description: `Novo usuário registrado via Google: ${user.name}`,
                userId: user.id,
                timestamp: new Date()
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  /* Facebook login comentado por enquanto
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
          profileFields: ["id", "displayName", "email", "photos"]
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByProviderId("facebook", profile.id);
            
            if (!user) {
              user = await storage.createUser({
                username: profile.displayName.replace(/\s+/g, ".").toLowerCase(),
                email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
                name: profile.displayName,
                provider: "facebook",
                providerId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || null,
                role: "user"
              });
              
              await storage.createActivity({
                action: "register",
                description: `Novo usuário registrado via Facebook: ${user.name}`,
                userId: user.id,
                timestamp: new Date()
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  */

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Rotas de autenticação
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Verificar se usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Criar novo usuário
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name: name || null,
        role: "user",
        provider: "local"
      });
      
      // Registrar atividade
      await storage.createActivity({
        action: "register",
        description: `Novo usuário registrado: ${username}`,
        userId: user.id,
        timestamp: new Date()
      });
      
      // Autenticar o usuário após registro
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl
        });
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Credenciais inválidas" });
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Registrar atividade
        await storage.createActivity({
          action: "login",
          description: `Usuário logado: ${user.username}`,
          userId: user.id,
          timestamp: new Date()
        });
        
        return res.json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const user = req.user;
    
    req.logout((err) => {
      if (err) return next(err);
      
      if (user) {
        // Registrar atividade de logout
        storage.createActivity({
          action: "logout",
          description: `Usuário saiu: ${user.username}`,
          userId: user.id,
          timestamp: new Date()
        }).catch(console.error);
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user;
      return res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl
      });
    } else {
      return res.status(401).json({ message: "Não autenticado" });
    }
  });

  // Google Auth rotas
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/auth/google/callback", 
      passport.authenticate("google", { 
        failureRedirect: "/auth"
      }), (req, res) => {
        // Registrar atividade de login
        if (req.user) {
          storage.createActivity({
            action: "login",
            description: `Usuário logado via Google: ${req.user.username}`,
            userId: req.user.id,
            timestamp: new Date()
          }).catch(console.error);
        }
        
        // Redirecionar para a página inicial após login
        res.redirect("/");
      }
    );
  }

  /* Facebook Auth routes - comentadas por enquanto
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get("/auth/facebook", 
      passport.authenticate("facebook", { scope: ["email"] })
    );

    app.get("/auth/facebook/callback", 
      passport.authenticate("facebook", { 
        failureRedirect: "/auth",
        successRedirect: "/"
      })
    );
  }
  */

  // Rota para admin tornar outro usuário admin
  app.post("/api/user/:id/make-admin", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const adminUser = req.user;
    if (adminUser.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Somente administradores podem realizar esta operação." });
    }
    
    const userId = parseInt(req.params.id);
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const updatedUser = await storage.setUserRole(userId, "admin");
      
      // Registrar atividade
      await storage.createActivity({
        action: "admin",
        description: `Usuário ${user.username} promovido a administrador por ${adminUser.username}`,
        userId: adminUser.id,
        timestamp: new Date()
      });
      
      return res.json({ 
        message: "Usuário promovido a administrador com sucesso",
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          role: updatedUser!.role
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  // Rota para aprovar eventos
  app.post("/api/events/:id/approve", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const adminUser = req.user;
    if (adminUser.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Somente administradores podem aprovar eventos." });
    }
    
    const eventId = parseInt(req.params.id);
    
    try {
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, { status: "confirmed" });
      
      // Registrar atividade
      await storage.createActivity({
        action: "approved",
        description: `Evento "${event.name}" aprovado por ${adminUser.username}`,
        eventId: event.id,
        userId: adminUser.id,
        timestamp: new Date()
      });
      
      return res.json({ 
        message: "Evento aprovado com sucesso",
        event: updatedEvent
      });
    } catch (error) {
      return next(error);
    }
  });

  // Middleware para proteger rotas que requerem admin
  app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    res.locals.isAdmin = req.isAuthenticated() && req.user.role === "admin";
    next();
  });
}