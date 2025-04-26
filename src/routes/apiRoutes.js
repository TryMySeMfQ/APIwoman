import { Router } from 'express';
const router = Router();

/**
 * @route GET /api/contatos-emergencia
 * @description Retorna uma lista de contatos de emergência para mulheres.
 */
router.get('/contatos-emergencia', (req, res) => {
  const contatos = [
    { nome: "Disque 180", telefone: "180", descricao: "Central de Atendimento à Mulher" },
    { nome: "Polícia Militar", telefone: "190", descricao: "Emergências" },
    { nome: "SAMU", telefone: "192", descricao: "Atendimento médico de urgência" }
  ];
  res.json(contatos);
});

/**
 * @route GET /api/localizacao-segura?lat=XX&lng=XX
 * @description Retorna locais seguros próximos (ex.: delegacias, hospitais).
 */
router.get('/localizacao-segura', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ erro: "Coordenadas necessárias (lat, lng)" });

  // Simulação de resposta (em um app real, integraria com Google Maps API)
  const locais = [
    { nome: "Delegacia da Mulher", endereco: "Rua Segura, 123", distancia: "1.2km" },
    { nome: "Hospital Municipal", endereco: "Av. Principal, 456", distancia: "2.5km" }
  ];
  res.json({ lat, lng, locais });
});

/**
 * @route GET /api/dicas-seguranca
 * @description Retorna dicas de segurança para mulheres.
 */
router.get('/dicas-seguranca', (req, res) => {
  const dicas = [
    "Compartilhe sua localização em tempo real com pessoas de confiança.",
    "Evite caminhar sozinha em áreas desertas à noite.",
    "Use apps de transporte com compartilhamento de rota."
  ];
  res.json(dicas);
});

export default router;