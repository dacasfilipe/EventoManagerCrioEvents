import nodemailer from 'nodemailer';
import { log } from './vite';
import { User, Event } from '@shared/schema';

// Configuração do transporte de email
let transporter: nodemailer.Transporter;

// Inicializa o serviço de email
export function initEmailService() {
  // Em ambiente de desenvolvimento, usamos o ethereal.email para testar
  // Em produção, você precisaria configurar um serviço real como Gmail, SendGrid, etc.
  try {
    // Criamos um transporter do Nodemailer
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    log('Serviço de email inicializado com sucesso', 'email');
  } catch (error) {
    log(`Erro ao inicializar serviço de email: ${error}`, 'email');
  }
}

// Função para enviar email
export async function sendEmail(options: nodemailer.SendMailOptions): Promise<boolean> {
  if (!transporter) {
    log('Transporter de email não inicializado', 'email');
    return false;
  }

  try {
    await transporter.sendMail(options);
    log(`Email enviado para ${options.to}`, 'email');
    return true;
  } catch (error) {
    log(`Erro ao enviar email: ${error}`, 'email');
    return false;
  }
}

// Função para notificar administrador sobre novo evento
export async function notifyAdminAboutNewEvent(event: Event, creator: User, adminEmail: string): Promise<boolean> {
  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@eventopro.com',
    to: adminEmail,
    subject: `[EventoPro] Novo evento criado: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Novo Evento Criado</h2>
        <p>Um novo evento foi criado e precisa de aprovação.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${event.title}</h3>
          <p><strong>Descrição:</strong> ${event.description}</p>
          <p><strong>Data:</strong> ${new Date(event.startDate).toLocaleDateString('pt-BR')}</p>
          <p><strong>Local:</strong> ${event.location}</p>
          <p><strong>Categoria:</strong> ${event.category}</p>
          <p><strong>Status:</strong> ${event.status}</p>
        </div>
        
        <p><strong>Criado por:</strong> ${creator.name} (${creator.email})</p>
        
        <p>Acesse o painel administrativo para aprovar ou rejeitar este evento.</p>
        
        <div style="margin-top: 30px; color: #6b7280; font-size: 0.9em;">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    `,
  };

  return sendEmail(mailOptions);
}

// Função para encontrar o email do administrador
export async function getAdminEmail(storage: any): Promise<string | null> {
  try {
    // Buscar todos os usuários admin
    const users = await storage.getUsers();
    const adminUsers = users.filter(user => user.role === 'admin');
    
    if (adminUsers.length === 0) {
      log('Nenhum administrador encontrado', 'email');
      return null;
    }
    
    // Retornar o email do primeiro admin encontrado
    return adminUsers[0].email;
  } catch (error) {
    log(`Erro ao buscar email do administrador: ${error}`, 'email');
    return null;
  }
}