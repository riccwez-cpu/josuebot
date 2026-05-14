import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { initDatabase, insertLead } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configura Multer per salvare i file temporanei
const upload = multer({ dest: 'uploads/' });

// Avvia SQLite
initDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Stato del server
app.get('/api/status', (req, res) => {
    res.json({ status: 'online' });
});

// Upload CSV Leads
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
    
    const results = [];
    let conteggioInseriti = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv({ separator: ',' })) // Gestisce separatori standard
      .on('data', (data) => results.push(data))
      .on('end', async () => {
          // Quando ha finito di leggere, inserisce nel database riga per riga
          for (const row of results) {
              try {
                  // Cerca le colonne con nomi flessibili (Nome/nome, Email/email)
                  const nome = row.Nome || row.nome || row.NAME || '';
                  const cognome = row.Cognome || row.cognome || '';
                  const email = row.Email || row.email || row.EMAIL || '';
                  const telefono = row.Telefono || row.telefono || row.Phone || '';
                  
                  if(email) {
                      const inserito = await insertLead(nome, cognome, email, telefono);
                      if (inserito) conteggioInseriti++;
                  }
              } catch (e) {
                  // Se l'email esiste già, SQLite restituirà errore che ignoriamo in silenzio
              }
          }
          
          // Elimina file temporaneo
          fs.unlinkSync(req.file.path);
          res.json({ 
              success: true, 
              message: `Elaborazione completata. ${conteggioInseriti} nuove leads caricate!` 
          });
      });
});

// Start server
app.listen(PORT, () => {
    console.log(`AffiGenius SaaS Server in esecuzione sulla porta ${PORT}`);
});
