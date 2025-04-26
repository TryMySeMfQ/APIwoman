import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';  // Caminho relativo dentro de src

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

// Middleware para servir arquivos estáticos da raiz do projeto
app.use(express.static(path.join(__dirname, '../')));

// Rotas da API
app.use('/api', apiRoutes);

// Rota principal (index.html na raiz)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Rota do legado (legado.html na raiz)
app.get('/legado', (req, res) => {
  res.sendFile(path.join(__dirname, '../legado.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});