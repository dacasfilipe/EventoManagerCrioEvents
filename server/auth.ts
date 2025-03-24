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
    // Usar o domínio de desenvolvimento do Replit se estiver em ambiente Replit
    const callbackURL = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/google/callback`
      : "/auth/google/callback";
      
    console.log(`Google OAuth callback URL: ${callbackURL}`);
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
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

  // Endpoint para verificar configuração OAuth
  app.get("/auth/config", (req, res) => {
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : "não definido",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "configurado" : "não definido",
      callbackUrl: process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/google/callback`
        : "/auth/google/callback",
      replitDomain: process.env.REPLIT_DEV_DOMAIN || "não disponível"
    };
    
    res.json({
      googleConfig,
      env: {
        nodeEnv: process.env.NODE_ENV || "não definido",
        port: process.env.PORT || 5000
      }
    });
  });
  
  // Rota de desenvolvimento para login direto (use apenas em ambiente de desenvolvimento)
  app.get("/auth/dev/login", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(404).send("Not Found");
      }
      
      const email = req.query.email as string || "dev@example.com";
      const name = req.query.name as string || "Desenvolvedor";
      const username = email.split("@")[0].toLowerCase();
      
      // Verificar se usuário já existe
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Criar usuário de desenvolvimento
        user = await storage.createUser({
          username,
          email,
          name,
          provider: "dev",
          providerId: "dev-account",
          role: req.query.admin === "true" ? "admin" : "user"
        });
        
        // Registrar atividade
        await storage.createActivity({
          action: "register",
          description: `Usuário de desenvolvimento criado: ${username}`,
          userId: user.id,
          timestamp: new Date()
        });
        
        console.log(`Usuário de desenvolvimento criado: ${username} (${email})`);
      }
      
      // Login automático
      req.login(user, (err) => {
        if (err) {
          console.error("Erro no login dev:", err);
          return res.redirect("/auth?error=dev_login_error");
        }
        
        console.log(`Login de desenvolvimento bem-sucedido: ${username} (${user.role})`);
        
        // Registrar atividade
        storage.createActivity({
          action: "login",
          description: `Login de desenvolvimento: ${username}`,
          userId: user.id,
          timestamp: new Date()
        }).catch(console.error);
        
        return res.redirect("/");
      });
    } catch (error) {
      console.error("Erro no login de desenvolvimento:", error);
      return res.redirect("/auth?error=dev_error");
    }
  });

  // Google Auth rotas
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/auth/google", (req, res, next) => {
      console.log("Iniciando autenticação Google...");
      passport.authenticate("google", { 
        scope: ["profile", "email"],
        prompt: "select_account"
      })(req, res, next);
    });

    app.get("/auth/google/callback", (req, res, next) => {
      console.log("Recebendo callback do Google OAuth...");
      
      passport.authenticate("google", { 
        failureRedirect: "/auth"
      }, (err, user, info) => {
        console.log("Resultado autenticação:", { erro: !!err, usuário: !!user });
        
        if (err) {
          console.error("Erro na autenticação Google:", err);
          return res.redirect("/auth?error=auth_error");
        }
        
        if (!user) {
          console.error("Autenticação Google falhou:", info);
          return res.redirect("/auth?error=auth_failed");
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Erro no login após autenticação Google:", loginErr);
            return res.redirect("/auth?error=login_error");
          }
          
          // Registrar atividade de login
          storage.createActivity({
            action: "login",
            description: `Usuário logado via Google: ${user.username}`,
            userId: user.id,
            timestamp: new Date()
          }).catch(console.error);
          
          // Redirecionar para a página inicial após login
          return res.redirect("/");
        });
      })(req, res, next);
    });
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

  // Rota para atualizar o perfil do usuário
  app.patch("/api/users/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const userId = parseInt(req.params.id);
    
    // Verificar se o usuário está atualizando seu próprio perfil ou é um admin
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Você só pode atualizar seu próprio perfil." });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Campos permitidos para atualização
      const { name, email, avatarUrl } = req.body;
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) {
        // Verificar se o email está sendo usado por outro usuário
        if (email !== user.email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: "Este email já está em uso" });
          }
        }
        updateData.email = email;
      }
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      
      // Atualizar usuário
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Registrar atividade
      await storage.createActivity({
        action: "profile_update",
        description: `Perfil de ${user.username} atualizado`,
        userId: req.user.id,
        timestamp: new Date()
      });
      
      return res.json(updatedUser);
    } catch (error) {
      return next(error);
    }
  });
  
  // Rota para alterar senha
  app.post("/api/users/:id/change-password", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const userId = parseInt(req.params.id);
    
    // Usuário só pode alterar sua própria senha
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Acesso negado. Você só pode alterar sua própria senha." });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se é um usuário com provider local
      if (user.provider !== "local") {
        return res.status(400).json({ 
          message: `Não é possível alterar a senha para contas de ${user.provider}. Use o provedor de autenticação original.` 
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Verificar senha atual
      if (!user.password || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });
      
      // Registrar atividade
      await storage.createActivity({
        action: "password_change",
        description: `${user.username} alterou sua senha`,
        userId: userId,
        timestamp: new Date()
      });
      
      return res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      return next(error);
    }
  });
  
  // Rota para atualizar preferências de notificação
  app.patch("/api/users/:id/notifications", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const userId = parseInt(req.params.id);
    
    // Usuário só pode atualizar suas próprias preferências
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Acesso negado. Você só pode atualizar suas próprias preferências." });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar preferências
      // Por enquanto, estamos apenas simulando esta funcionalidade
      // Em um sistema real, você salvaria essas preferências no banco de dados
      
      return res.json({ 
        message: "Preferências de notificação atualizadas com sucesso",
        preferences: req.body
      });
    } catch (error) {
      return next(error);
    }
  });

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