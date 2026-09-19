const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

const pairings = new Map();
const messages = [];

// Endpoint pour appairer le plugin Roblox
app.post("/api/plugin/pair", (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(16).toString("hex");

  pairings.set(token, {
    code: code,
    connected: false,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  res.json({ code: code, token: token });
});

// Endpoint pour vérifier le statut de la connexion
app.post("/api/plugin/status", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.replace("Bearer ", "");
  const session = pairings.get(token);

  if (!session) return res.json({ connected: false, expired: true });
  if (Date.now() > session.expiresAt) {
    pairings.delete(token);
    return res.json({ connected: false, expired: true });
  }

  res.json({ connected: session.connected, expired: false });
});

// Validation du code 6 chiffres depuis le site
app.post("/api/web/verify", (req, res) => {
  const { code } = req.body;

  for (let [token, session] of pairings.entries()) {
    if (session.code === code) {
      session.connected = true;
      pairings.set(token, session);
      return res.json({ success: true, message: "Plugin connecté avec succès !" });
    }
  }

  res.status(400).json({ success: false, message: "Code invalide ou expiré." });
});

// Envoi d'un message / prompt IA
app.post("/api/chat/send", (req, res) => {
  const { sender, text } = req.body;
  if (!text) return res.status(400).json({ error: "Message vide" });

  const userMsg = { sender: sender || "Créateur", text, timestamp: new Date() };
  messages.push(userMsg);

  // Simulation de réponse de l'IA de création de jeu
  let aiReplyText = "Je traite votre demande pour le jeu Roblox...";
  const lower = text.toLowerCase();

  if (lower.includes("script") || lower.includes("creer") || lower.includes("jeu")) {
    aiReplyText = "IA ORBIT: Analyse de la demande reçue. Préparation des éléments et scripts nécessaires pour Roblox Studio...";
  } else if (lower.includes("bonjour") || lower.includes("salut")) {
    aiReplyText = "IA ORBIT: Bonjour ! Que voulez-vous créer dans votre jeu Roblox aujourd'hui ?";
  }

  const aiMsg = { sender: "ORBIT AI", text: aiReplyText, timestamp: new Date() };
  messages.push(aiMsg);

  if (messages.length > 50) messages.splice(0, messages.length - 50);

  res.json({ success: true, messages: [userMsg, aiMsg] });
});

// Récupérer les messages du chat
app.get("/api/chat/messages", (req, res) => {
  res.json({ messages });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
