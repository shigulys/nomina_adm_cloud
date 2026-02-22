import express from 'express';
const app = express();
const PORT = 3005;
app.get('/', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log('Minimal server on 3005'));
