// app.js
//
// API HTTP simple : POST /add-cards
// Body JSON : { "user": "...", "password": "...", "deckName": "...", "csv": "front,back\n..." }
//
// Pour chaque ligne du CSV, une carte est ajoutée dans le deck donné via Puppeteer sur AnkiWeb.

const express = require('express');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '2mb' }));

/**
 * Parse un CSV très simple : chaque ligne = "front,back"
 * - ignore les lignes vides
 * - pas de gestion avancée des guillemets ou virgules échappées
 */
function parseSimpleCsv(csvText) {
  return csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
        console.log('Parsing line:', line);
      const parts = line.split(',');
      console.log('Parts:', parts);
      return {
        front: (parts[0] || '').trim(),
        back: (parts[1] || '').trim(),
        tags: (parts[2] || '').trim() || '',
      };
    })
    .filter(row => row.front !== '' || row.back !== '');
}

function sleep (time) {
   return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   });
}

/**
 * Ajoute des cartes dans AnkiWeb via Puppeteer.
 * Hypothèses :
 * - Page de login : https://ankiweb.net/account/login
 * - Champs "username" et "password"
 * - Après login, page des decks : https://ankiweb.net/decks/
 * - Le deck est un lien <a> contenant le nom du deck
 * - Une page "Add" avec deux champs de note pour front/back (ex. f0, f1) et un bouton "Add"
 *
 * Ces sélecteurs peuvent nécessiter des ajustements.
 */
async function addCardsToAnki({ user, password, deckName, cards }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let page;
  try {
    page = await browser.newPage();
    await page.setDefaultTimeout(60000);

    // 1. Login
    await page.goto('https://ankiweb.net/account/login', { waitUntil: 'networkidle2' });
    await sleep(500);
 

    await page.locator('input[type=text]').fill(user);
    await sleep(100);
    
    await page.locator('input[type=password]').fill(password);
    
    
    await sleep(100);
    await page.locator('button[class="btn btn-primary btn-lg"').click();

    await sleep(1000);
   

    // 2. Aller à la page des decks
    await page.goto('https://ankiweb.net/decks/', { waitUntil: 'networkidle2' });

        await sleep(500);
    // 3. Cliquer sur le deck correspondant au nom fourni
   
    await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  const btn = buttons.find(b => b.textContent.trim().includes("test"));
  if (btn) btn.click();
});


    await sleep(500);
    
    await page.goto('https://ankiuser.net/add', { waitUntil: 'networkidle2' });
await sleep(500);

    // 4. Pour chaque carte, ouvrir le formulaire d'ajout et envoyer la note
    let created = 0;

    for (const card of cards) {
      await page.evaluate((value) => {
    const el = document.querySelectorAll('.form-control.field')[0];
    el.innerText = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}, card.front);
        await sleep(100);
        await page.evaluate((value) => {
    const el = document.querySelectorAll('.form-control.field')[1];
    el.innerText = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}, card.back);

await page.evaluate((value) => {
    const el = document.querySelector('input.form-control');
    el.value = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}, card.tags);


await page.evaluate(() => {
    document.querySelector('button.btn.btn-primary.btn-large.mt-2').click();
});

      created += 1;
      // Petit délai pour éviter de spammer le serveur
      await sleep(500);
    }

    return { created };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.post('/add-cards', async (req, res) => {
  const { user, password, deckName, csv } = req.body || {};

  if (!user || !password || !deckName || !csv) {
    return res.status(400).json({
      error: 'Paramètres manquants. Il faut : user, password, deckName, csv.',
    });
  }

  const cards = parseSimpleCsv(csv);
  if (cards.length === 0) {
    return res.status(400).json({
      error: 'Le CSV ne contient aucune ligne valide.',
    });
  }

  try {
    const result = await addCardsToAnki({ user, password, deckName, cards });
    return res.json({
      ok: true,
      deckName,
      totalCards: cards.length,
      created: result.created,
    });
  } catch (err) {
    console.error('Erreur lors de l’ajout des cartes :', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Erreur interne lors de l’ajout des cartes.',
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    endpoint: 'POST /add-cards',
    bodyExample: {
      user: 'email@exemple.com',
      password: 'motdepasse',
      deckName: 'Mon deck',
      csv: 'Question 1, Réponse 1\nQuestion 2, Réponse 2',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});
