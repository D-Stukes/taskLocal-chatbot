import express from "express";
import dotenv from "dotenv";
import chatHandler from "./api/chat.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: "2mb" }));

app.post("/api/chat", async (req, res) => {
  await chatHandler({ method: "POST", body: req.body }, res);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tasklocal-chat-api" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`TaskLocal chat API listening on http://localhost:${port}`);
});