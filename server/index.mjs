import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.server") });

const app = express();
const PORT = process.env.PORT || 3001;

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
  console.error(
    "❌ Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.server",
  );
  process.exit(1);
}

// ── Initialisation du client Shopify officiel ──────────────────────────────
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "offline-proxy",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "offline-proxy",
  adminApiAccessToken: SHOPIFY_TOKEN,
  apiVersion: ApiVersion.January26,
  isCustomStoreApp: true, // token d'accès permanent (app privée)
  isEmbeddedApp: false,
  hostName: SHOPIFY_DOMAIN,
  scopes: [],
});

// Client GraphQL Admin réutilisable
function getGraphqlClient() {
  return new shopify.clients.Graphql({
    session: shopify.session.customAppSession(SHOPIFY_DOMAIN),
  });
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:4028")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
  }),
);

app.use(express.json());

// ── /api/shopify  ──────────────────────────────────────────────────────────
// Reçoit { query, variables } du frontend et exécute la requête GraphQL
// via le client @shopify/shopify-api — le token ne quitte jamais le serveur.
app.post("/api/shopify", async (req, res) => {
  const { query, variables } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing GraphQL query" });
  }

  try {
    const client = getGraphqlClient();
    const response = await client.request(query, { variables });
    res.json(response.data);
  } catch (err) {
    const gqlErrors = err?.response?.errors;
    console.error("❌ Shopify GraphQL error:", gqlErrors || err.message);
    res
      .status(err?.response?.status || 502)
      .json({ errors: gqlErrors || [{ message: err.message }] });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    store: SHOPIFY_DOMAIN,
    version: ApiVersion.January26,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Shopify proxy server running on http://localhost:${PORT}`);
  console.log(`   Store  : ${SHOPIFY_DOMAIN}`);
  console.log(`   Version: ${ApiVersion.January26}`);
});
