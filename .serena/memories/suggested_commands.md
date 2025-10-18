Windows PowerShell (project root):

- Dev servers (frontend+backend): npm run dev:full
- Backend only (watch): npm run server:dev
- Frontend only: npm run dev
- Build frontend: npm run build
- Build server: npm run build:server
- Build both: npm run build:full
- Start prod server (serves built SPA): npm start
- Database reset + seed demo data: npm run db:reset
- Database deploy migrations + seed: npm run db:deploy
- Seed subsets: npm run db:seed, npm run db:seed-questionnaire, npm run db:seed-actions, npm run db:seed-correlations, npm run db:seed-models, npm run db:seed-gold-mines
- Test API locally: node test-api.js

Docker:
- Dev stack: docker-compose -f docker-compose.dev.yml up -d
- Prod stack: docker-compose -f docker-compose.prod.yml up -d

Ports:
- Backend: http://localhost:3002, Health: http://localhost:3002/health
- Frontend: http://localhost:5173

Windows helpers:
- scripts\restart-dev.bat [BACK_PORT] [FRONT_PORT]
- scripts\restart-app.bat [BACK_PORT] [FRONT_PORT]

Azure (see deployment/README.md and DEPLOYMENT.md):
- ./deployment/azure-setup.sh
- ./deployment/deploy.sh azure-app-service