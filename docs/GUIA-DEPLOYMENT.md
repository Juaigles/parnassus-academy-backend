# 🚀 GUÍA DE DEPLOYMENT Y CONFIGURACIÓN
# PARNASSUS ACADEMY BACKEND - Despliegue en Producción

## 📋 REQUISITOS DEL SISTEMA

### Requisitos Mínimos
- **Node.js**: 18.x o superior
- **MongoDB**: 5.0 o superior
- **RAM**: 2GB mínimo, 4GB recomendado
- **CPU**: 2 cores mínimo
- **Storage**: 20GB mínimo (escalable)
- **Network**: SSL/TLS certificado

### Requisitos de Producción
- **Node.js**: 20.x LTS
- **MongoDB**: 6.x (con replica set)
- **RAM**: 8GB o superior
- **CPU**: 4 cores o superior
- **Storage**: SSD con 100GB+ 
- **Load Balancer**: Nginx/CloudFlare
- **Monitoring**: DataDog/New Relic

---

## ⚙️ CONFIGURACIÓN DE VARIABLES DE ENTORNO

### .env.production
```bash
# === CONFIGURACIÓN BÁSICA ===
NODE_ENV=production
PORT=3001
API_VERSION=v3.0.0

# === CORS Y DOMINIO ===
CORS_ORIGIN=https://parnassus-academy.com,https://www.parnassus-academy.com
DOMAIN=parnassus-academy.com

# === BASE DE DATOS ===
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/parnassus?retryWrites=true&w=majority
MONGODB_MAX_POOL_SIZE=10
MONGODB_BUFFER_MAX_ENTRIES=0

# === SEGURIDAD ===
JWT_SECRET=your-super-secure-256-bit-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# === STRIPE PAYMENTS ===
STRIPE_SECRET_KEY=sk_live_51234567890abcdef
STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdef
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef

# === EMAIL SMTP ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@parnassus-academy.com
SMTP_PASS=your-app-password
EMAIL_FROM="Parnassus Academy <noreply@parnassus-academy.com>"

# === ANALYTICS ===
MIXPANEL_TOKEN=your-mixpanel-project-token
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# === CACHE Y PERFORMANCE ===
CACHE_TTL=300
REDIS_URL=redis://localhost:6379
# Si no tienes Redis, usa cache en memoria
USE_REDIS_CACHE=false

# === WEBSOCKETS ===
WEBSOCKET_ORIGINS=https://parnassus-academy.com
MAX_WEBSOCKET_CONNECTIONS=1000

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_PAYMENT_MAX=3

# === LOGGING ===
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_ACCESS_LOGS=true

# === FILE UPLOADS (Opcional) ===
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=parnassus-media

# === PUSH NOTIFICATIONS ===
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@parnassus-academy.com

# === MONITOREO ===
ENABLE_METRICS=true
HEALTH_CHECK_TIMEOUT=30000
```

---

## 🐳 DEPLOYMENT CON DOCKER

### Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Configurar permisos
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Backend API
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - parnassus-network
    volumes:
      - ./logs:/app/logs

  # MongoDB
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: parnassus
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped
    networks:
      - parnassus-network

  # Redis (Opcional para cache)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - parnassus-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - parnassus-network

volumes:
  mongodb_data:
  redis_data:

networks:
  parnassus-network:
    driver: bridge
```

---

## 🌐 CONFIGURACIÓN DE NGINX

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Backend upstream
    upstream api_backend {
        server api:3001;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name parnassus-academy.com www.parnassus-academy.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name parnassus-academy.com www.parnassus-academy.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;
            
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files (PWA)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://api_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            proxy_pass http://api_backend;
            access_log off;
        }
    }
}
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### mongo-init.js
```javascript
// mongo-init.js - Script de inicialización de MongoDB
db = db.getSiblingDB('parnassus');

// Crear usuario de aplicación
db.createUser({
  user: 'parnassus_app',
  pwd: 'secure_password_here',
  roles: [
    {
      role: 'readWrite',
      db: 'parnassus'
    }
  ]
});

// Crear índices críticos
db.users.createIndex({ email: 1 }, { unique: true });
db.courses.createIndex({ slug: 1 }, { unique: true });
db.courses.createIndex({ teacher: 1 });
db.courses.createIndex({ category: 1, level: 1 });
db.courses.createIndex({ isPublished: 1, createdAt: -1 });

db.purchases.createIndex({ userId: 1, courseId: 1 });
db.purchases.createIndex({ stripePaymentIntentId: 1 }, { unique: true });

db.progress.createIndex({ userId: 1, lessonId: 1 }, { unique: true });
db.progress.createIndex({ userId: 1, courseId: 1 });

// Configurar TTL para tokens expirados
db.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('Database initialized successfully');
```

---

## 🚀 SCRIPTS DE DEPLOYMENT

### deploy.sh
```bash
#!/bin/bash

# deploy.sh - Script de despliegue automatizado

set -e

echo "🚀 Starting deployment..."

# Variables
APP_NAME="parnassus-academy-backend"
DOCKER_IMAGE="parnassus/backend:latest"
CONTAINER_NAME="parnassus-api"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    log_warn "Not on main branch. Current branch: $BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    log_error "There are uncommitted changes. Please commit or stash them."
    exit 1
fi

# Backup de la base de datos
log_info "Creating database backup..."
mkdir -p ./backups
mongodump --uri="$MONGODB_URI" --out="./backups/backup-$(date +%Y%m%d-%H%M%S)"

# Construir imagen Docker
log_info "Building Docker image..."
docker build -t $DOCKER_IMAGE .

# Parar contenedor anterior (si existe)
if [ $(docker ps -q -f name=$CONTAINER_NAME) ]; then
    log_info "Stopping existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Ejecutar nuevo contenedor
log_info "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    --env-file .env.production \
    -p 3001:3001 \
    -v $(pwd)/logs:/app/logs \
    $DOCKER_IMAGE

# Verificar que el contenedor está corriendo
sleep 10
if [ $(docker ps -q -f name=$CONTAINER_NAME) ]; then
    log_info "Container started successfully"
else
    log_error "Container failed to start"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Health check
log_info "Performing health check..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Health check failed after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Limpiar imágenes Docker antiguas
log_info "Cleaning up old Docker images..."
docker image prune -f

log_info "✅ Deployment completed successfully!"
echo "🌐 API is running at: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"
echo "📈 Metrics: http://localhost:3001/api/admin/metrics"
```

### package.json Scripts
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon --watch src --ext js,mjs,cjs --exec node src/server.js",
    "build": "echo 'No build step needed for Node.js'",
    "test": "vitest",
    "test:e2e": "node test-suite-complete.js",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "docker:build": "docker build -t parnassus/backend .",
    "docker:run": "docker run -p 3001:3001 --env-file .env.production parnassus/backend",
    "deploy": "./deploy.sh",
    "backup:db": "mongodump --uri=$MONGODB_URI --out=./backups/$(date +%Y%m%d)",
    "restore:db": "mongorestore --uri=$MONGODB_URI --drop",
    "logs": "tail -f logs/app.log",
    "health": "curl http://localhost:3001/health",
    "metrics": "curl http://localhost:3001/api/admin/metrics",
    "seed:prod": "NODE_ENV=production node src/scripts/seed.js"
  }
}
```

---

## 📊 MONITORING Y LOGGING

### PM2 Configuration (Alternativa a Docker)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'parnassus-api',
    script: 'src/server.js',
    instances: 'max', // Usar todos los CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

// Comandos PM2:
// pm2 start ecosystem.config.js --env production
// pm2 reload parnassus-api
// pm2 logs parnassus-api
// pm2 monit
```

### Log Rotation
```bash
# /etc/logrotate.d/parnassus
/path/to/parnassus/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        /usr/bin/killall -SIGUSR1 node || true
    endscript
}
```

---

## 🔐 CONFIGURACIÓN SSL/TLS

### Obtener Certificado SSL (Let's Encrypt)
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d parnassus-academy.com -d www.parnassus-academy.com

# Renovación automática
sudo crontab -e
# Añadir línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚨 BACKUP Y RECOVERY

### Script de Backup Automático
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/parnassus"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongo_$DATE"

# Backup de archivos de aplicación
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /path/to/app

# Subir a AWS S3 (opcional)
aws s3 sync $BACKUP_DIR s3://parnassus-backups/

# Limpiar backups antiguos (mantener 30 días)
find $BACKUP_DIR -name "mongo_*" -mtime +30 -delete
find $BACKUP_DIR -name "app_*" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Cron Job para Backups
```bash
# Ejecutar backup diario a las 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 📈 CONFIGURACIÓN DE CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/parnassus-academy-backend
          git pull origin main
          ./deploy.sh
```

---

## 🔍 TROUBLESHOOTING

### Comandos de Diagnóstico
```bash
# Verificar estado del contenedor
docker ps
docker logs parnassus-api

# Verificar conectividad de base de datos
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Verificar puertos
netstat -tulpn | grep :3001

# Verificar logs de aplicación
tail -f logs/app.log

# Verificar uso de recursos
docker stats parnassus-api

# Verificar health check
curl http://localhost:3001/health

# Test de conectividad completo
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Problemas Comunes

#### 1. Base de datos no conecta
```bash
# Verificar conexión
mongosh "$MONGODB_URI"

# Verificar variables de entorno
echo $MONGODB_URI

# Verificar permisos de usuario
```

#### 2. Errores de memoria
```bash
# Aumentar límite de memoria Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# Monitorear uso de memoria
node --inspect src/server.js
```

#### 3. Rate limiting muy agresivo
```bash
# Ajustar en .env
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=900000
```

---

## ✅ CHECKLIST DE DEPLOYMENT

### Pre-deployment
- [ ] Variables de entorno configuradas
- [ ] Certificado SSL instalado
- [ ] Base de datos configurada con índices
- [ ] Backup reciente realizado
- [ ] Tests pasando
- [ ] Logs configurados

### Post-deployment
- [ ] Health check exitoso
- [ ] Métricas funcionando
- [ ] WebSockets conectando
- [ ] Notificaciones enviándose
- [ ] Pagos procesándose
- [ ] Emails siendo enviados
- [ ] Analytics rastreando eventos

### Monitoring Continuo
- [ ] Logs siendo escritos correctamente
- [ ] Base de datos performando bien
- [ ] Cache funcionando
- [ ] Rate limits apropiados
- [ ] SSL certificado válido
- [ ] Backups automáticos ejecutándose

---

**Guía de Deployment actualizada**: 14 de Agosto 2025
**Probado en**: Ubuntu 22.04, CentOS 8, Amazon Linux 2
**Compatible con**: Docker 20+, Node.js 18+, MongoDB 5+
