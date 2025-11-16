# Dockerfile
FROM node:20-bullseye

# Répertoire de travail
WORKDIR /usr/src/app
# Installer les dépendances nécessaires pour Chromium / Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1-7 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*
 
# Copier le fichier JS unique
COPY app.js .

# Initialiser un projet Node et installer les dépendances nécessaires
RUN npm init -y \
    && npm install express puppeteer \
    && npm cache clean --force

# Variable d'environnement (optionnelle) pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Exposer le port de l'API
EXPOSE 3000

# Commande de démarrage
CMD ["node", "app.js"]
