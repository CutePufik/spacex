const express = require('express');
const app = express();

const PORT = 3001;
const LL2 = 'https://ll.thespacedevs.com/2.3.0';

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
});

async function proxy(res, url) {
    try {
        const upstream = await fetch(url);
        if (!upstream.ok) throw new Error('upstream ' + upstream.status);
        res.json(await upstream.json());
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
}

app.get('/proxy/launches', (_, res) =>
    proxy(res, `${LL2}/launches/?lsp__id=121&limit=100&ordering=-net`));

app.get('/proxy/pads', (_, res) =>
    proxy(res, `${LL2}/pads/?agencies_ids=121&limit=100`));

app.get('/proxy/pads/:id', (req, res) =>
    proxy(res, `${LL2}/pads/${req.params.id}/`));

app.listen(PORT, '127.0.0.1', () =>
    console.log(`Proxy: http://127.0.0.1:${PORT}`));