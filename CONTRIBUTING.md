# 🤝 Contribuindo para o Event Management Platform

Obrigado por considerar contribuir para o nosso projeto! Este guia te ajudará a começar.

## 🚀 Como Começar

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub, depois:
git clone https://github.com/seu-usuario/EventoManagerCrioEvents.git
cd EventoManagerCrioEvents
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure suas variáveis de ambiente
# DATABASE_URL é obrigatória para desenvolvimento
```

### 4. Configurar Banco de Dados
```bash
npm run db:push
```

### 5. Iniciar Desenvolvimento
```bash
npm run dev
```

## 📝 Padrões de Código

- **TypeScript**: Sempre use tipos explícitos
- **ESLint**: Execute `npm run check` antes de commits
- **Commits**: Use commits descritivos em português
- **Componentes**: Use shadcn/ui quando possível
- **API**: Mantenha rotas RESTful e validação com Zod

## 🐛 Reportando Bugs

1. Verifique se o bug já não foi reportado
2. Use o template de issue fornecido
3. Inclua steps para reproduzir
4. Anexe screenshots se necessário

## ✨ Sugerindo Melhorias

1. Abra uma issue descrevendo a melhoria
2. Explique o problema que resolve
3. Proponha uma solução
4. Aguarde feedback antes de implementar

## 🔧 Processo de Development

1. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
2. Faça seus commits: `git commit -m 'Adiciona nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📋 Checklist de Pull Request

- [ ] Código testado localmente
- [ ] Tipos TypeScript verificados (`npm run check`)
- [ ] Commits bem descritos
- [ ] Documentação atualizada se necessário
- [ ] Screenshots/GIFs para mudanças visuais

## 📚 Recursos Úteis

- [Documentação do Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)

## 📞 Dúvidas?

Abra uma issue com a label "question" ou entre em contato através dos canais oficiais do projeto.

---

Obrigado por contribuir! 🎉