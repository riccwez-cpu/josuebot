import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

const delay = ms => new Promise(res => setTimeout(res, ms));

export async function runLeadOperation(leadData, targetUrl) {
    console.log(`[BOT] Avvio operazione LEAD per: ${leadData.nome} ${leadData.cognome}`);
    
    // Genera un profilo utente "Mobile" casuale per ingannare i filtri
    const userAgent = new UserAgent({ deviceCategory: 'mobile' });
    
    // Avvia browser invisibile passando per il proxy
    const browser = await puppeteer.launch({
        headless: "new", // "new" è lo standard invisibile per VPS
        args: [
            `--proxy-server=http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=390,844' // Risoluzione iPhone
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 1. Autenticazione al Proxy Mobile
        await page.authenticate({
            username: process.env.PROXY_USER,
            password: process.env.PROXY_PASS
        });

        // 2. Camuffamento: Imposta lo User-Agent fittizio (es. iPhone 14 Safari)
        await page.setUserAgent(userAgent.toString());
        
        console.log(`[BOT] Navigazione verso ${targetUrl}... (con IP Nascosto)`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // 3. Simula Dwell Time (L'utente legge la pagina)
        const readTime = 3000 + Math.random() * 5000;
        console.log(`[BOT] Attesa lettura pagina simulata: ${Math.round(readTime/1000)}s`);
        await delay(readTime);

        // 4. Logica di compilazione Form (Da adattare al sito specifico)
        // Esempio:
        // await page.type('input[name="first_name"]', leadData.nome, { delay: 100 });
        // await page.type('input[name="last_name"]', leadData.cognome, { delay: 120 });
        // await page.type('input[name="email"]', leadData.email, { delay: 90 });
        // await page.type('input[name="phone"]', leadData.telefono, { delay: 110 });
        // await page.click('button[type="submit"]');
        
        console.log(`[BOT] ✅ Dati compilati con successo!`);
        
        await browser.close();
        return { success: true, message: 'Lead registrata' };
        
    } catch (error) {
        console.error(`[BOT] ❌ Errore:`, error.message);
        await browser.close();
        return { success: false, error: error.message };
    }
}
