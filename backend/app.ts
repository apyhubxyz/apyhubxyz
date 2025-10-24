// Sample app.ts
import express from 'express';
const app = express();

app.get('/api/pools', (req, res) => res.json([]));
app.get('/api/portfolio', (req, res) => res.json({}));
app.post('/api/strategy', (req, res) => res.json([]));

app.listen(3001, () => console.log('Server running'));
