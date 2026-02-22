/// <reference lib="deno.ns" />

// Supabase Edge Function — Shopify Admin API proxy
// Authentification : client credentials grant (Dev Dashboard)
// Le token expire après 24h et est automatiquement renouvelé.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache du token en mémoire (durée de vie de l'instance Deno)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(shop: string, clientId: string, clientSecret: string): Promise<string> {
  // Retourne le token en cache s'il est encore valide (marge de 60s)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const response = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  const { access_token, expires_in } = await response.json();
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + expires_in * 1000;

  console.log(`[shopify-proxy] Token renouvelé, expire dans ${expires_in}s`);
  return cachedToken;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SHOPIFY_SHOP = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const SHOPIFY_CLIENT_ID = Deno.env.get('SHOPIFY_CLIENT_ID');
    const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') || '2026-01';

    if (!SHOPIFY_SHOP || !SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error: 'Shopify credentials not configured',
          missing: {
            domain: !SHOPIFY_SHOP,
            clientId: !SHOPIFY_CLIENT_ID,
            clientSecret: !SHOPIFY_CLIENT_SECRET,
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, variables } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'GraphQL query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtient (ou renouvelle) le token automatiquement
    const accessToken = await getAccessToken(SHOPIFY_SHOP, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET);

    const shopifyUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

    const shopifyResponse = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await shopifyResponse.json();

    if (data?.errors) {
      console.error('[shopify-proxy] GraphQL errors:', JSON.stringify(data.errors));
      return new Response(
        JSON.stringify({ error: 'Shopify API error', details: data.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[shopify-proxy] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
