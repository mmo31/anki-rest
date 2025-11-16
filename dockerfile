# Dockerfile
FROM node:20-bullseye

# Répertoire de travail
WORKDIR /usr/src/app

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
