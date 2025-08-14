// Vercel serverless function entry point
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { initEmailService } from "../server/email";
import type { IncomingMessage, ServerResponse } from 'http';

const app = express();

// Initialize app once
let isInitialized = false;
const initApp = async () => {
  if (isInitialized) return;
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Initialize email service
  initEmailService();
  
  // Register routes
  await registerRoutes(app);
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  isInitialized = true;
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initApp();
  return app(req, res);
}