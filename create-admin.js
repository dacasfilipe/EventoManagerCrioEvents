// Script para criar um usuário administrador
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { storage } from './server/storage.js';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdmin() {
  try {
    // Verificar se existe um usuário admin
    let adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log('Criando usuário admin...');
      adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@eventopro.com',
        password: await hashPassword('admin123'),
        name: 'Administrador do Sistema',
        role: 'admin',
        provider: 'local'
      });
      
      console.log('Usuário admin criado com sucesso:', adminUser);
      
      // Registrar atividade
      await storage.createActivity({
        action: 'setup',
        description: 'Administrador inicial configurado pelo sistema',
        userId: adminUser.id,
        timestamp: new Date()
      });
    } else {
      console.log('Usuário admin já existe, verificando papel...');
      
      if (adminUser.role !== 'admin') {
        console.log('Promovendo usuário para administrador...');
        const updatedUser = await storage.setUserRole(adminUser.id, 'admin');
        console.log('Usuário promovido com sucesso:', updatedUser);
      } else {
        console.log('Usuário já é administrador:', adminUser);
      }
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  }
}

createAdmin();