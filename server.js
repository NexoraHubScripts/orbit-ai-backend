const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

const pairings = new Map();

// 1. Génère le code 6 chiffres pour le plugin Roblox
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

// 2. Vérifie si le site web a confirmé le code
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

// 3. Reçoit le code validé depuis le site web Site123
app.post("/api/web/verify", (req, res) => {
  const { code } = req.body;

  for (let [token, session] of pairings.entries()) {
    if (session.code === code) {
      session.connected = true;
      pairings.set(token, session);
      return res.json({ success: true, message: "Connecté avec succès !" });
    }
  }

  res.status(400).json({ success: false, message: "Code invalide ou expiré" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur en ligne sur le port ${PORT}`));
