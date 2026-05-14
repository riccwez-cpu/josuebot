# Usa l'immagine ufficiale di Puppeteer (contiene già Chrome e tutte le librerie grafiche)
FROM ghcr.io/puppeteer/puppeteer:latest

# Usa root per avere i permessi per scrivere il file database SQLite
USER root

# Crea e imposta la cartella di lavoro
WORKDIR /app

# Copia i file delle dipendenze
COPY package*.json ./

# Installa tutte le librerie Node.js
RUN npm install

# Copia tutto il resto del codice
COPY . .

# Esponi la porta 3000
EXPOSE 3000

# Avvia il server
CMD ["npm", "start"]
