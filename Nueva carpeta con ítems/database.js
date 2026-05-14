import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inizializza il database SQLite locale (creerà un file leads.db)
const dbPath = path.resolve(__dirname, 'leads.db');
const db = new sqlite3.Database(dbPath);

export function initDatabase() {
    console.log('[DB] Inizializzazione Database in corso...');
    
    // Tabella delle anagrafiche
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        cognome TEXT,
        email TEXT UNIQUE,
        telefono TEXT,
        status TEXT DEFAULT 'nuovo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Tabella dello storico operazioni (successi/errori)
    db.run(`CREATE TABLE IF NOT EXISTS log_campagne (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operazione TEXT, -- 'LEAD' o 'CLICK'
        target_url TEXT,
        status TEXT, -- 'SUCCESS' o 'ERROR'
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

// Inserisce una nuova lead ignorando i duplicati (basato sull'email)
export function insertLead(nome, cognome, email, telefono) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT OR IGNORE INTO leads (nome, cognome, email, telefono) VALUES (?, ?, ?, ?)`,
            [nome, cognome, email, telefono],
            function(err) {
                if (err) reject(err);
                else resolve(this.changes); // Ritorna 1 se inserito, 0 se duplicato
            }
        );
    });
}

// Prende una lead "nuova" per farla lavorare al bot e la segna come "in_uso"
export function getNextAvailableLead() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM leads WHERE status = 'nuovo' LIMIT 1`, (err, row) => {
            if (err) return reject(err);
            if (row) {
                db.run(`UPDATE leads SET status = 'usato' WHERE id = ?`, [row.id]);
            }
            resolve(row);
        });
    });
}
