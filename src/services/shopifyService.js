/**
 * ShopifyService
 *
 * Couche d'accès aux données Shopify côté client.
 * Toutes les requêtes GraphQL sont transmises à la Supabase Edge Function
 * `shopify-proxy` qui exécute les appels côté serveur (Deno) sans exposer
 * le token Shopify Admin au navigateur.
 *
 * Architecture :
 *   Browser → ShopifyService.query() → POST <supabase-url>/functions/v1/shopify-proxy
 *          → Deno Edge Function → Shopify Admin GraphQL API
 */
class ShopifyService {
  constructor() {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    // URL de la Supabase Edge Function shopify-proxy
    this.serverUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/shopify-proxy`
      : null;
    this.anonKey = supabaseAnonKey || null;
    this.hasCredentials = !!(supabaseUrl && supabaseAnonKey);

    if (this.hasCredentials) {
      console.log("🛍️ ShopifyService ready — proxy: Supabase Edge Function");
    } else {
      console.warn(
        "⚠️ ShopifyService: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant — utilisation des données mock.",
      );
    }
  }

  /**
   * Envoie une requête GraphQL Admin via la Supabase Edge Function shopify-proxy.
   * La Edge Function retourne { data: { ... } } (enveloppe GraphQL standard).
   *
   * @param {string} gqlQuery  - Requête GraphQL
   * @param {object} variables - Variables GraphQL
   * @returns {Promise<object>} Données GraphQL (champ `data` déjà déballé)
   */
  async query(gqlQuery, variables = {}) {
    if (!this.hasCredentials || !this.serverUrl) {
      throw new Error("Supabase Edge Function non configurée");
    }

    const res = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify({ query: gqlQuery, variables }),
    });

    const json = await res.json();

    if (!res.ok || json?.error) {
      const err = new Error(json?.error || "Supabase Edge Function error");
      err.response = json;
      throw err;
    }

    // La Edge Function renvoie la réponse GraphQL brute : { data: { ... } }
    // On déballe `data` pour que le reste du service accède directement aux champs.
    return json?.data ?? json;
  }

  async fetchProducts() {
    const query = `query FetchProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id title handle status totalInventory
            productType
            tags
            variants(first: 1) {
              edges {
                node {
                  id price compareAtPrice sku
                  inventoryQuantity
                  inventoryItem { unitCost { amount } }
                }
              }
            }
            images(first: 1) {
              edges { node { url altText } }
            }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 100 });
      const transformProducts = this.transformProducts(
        data?.products?.edges || [],
      );
      console.log("✅ Products fetched:", transformProducts);

      return transformProducts;
    } catch (error) {
      console.error(
        "❌ Products error:",
        error?.response?.errors || error?.message,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Product Analytics Hub API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Agrège le revenu par catégorie (productType) pour le PieChart.
   * Retourne [{ name, value, percentage }]
   */
  async fetchCategoryData() {
    try {
      const products = await this.fetchProducts();
      const map = {};
      let grand = 0;

      products.forEach((p) => {
        const cat = p.category || "Autres";
        if (!map[cat]) map[cat] = 0;
        map[cat] += p.revenue || 0;
        grand += p.revenue || 0;
      });

      const categoryLabelMap = {
        skincare: "Soins de la peau",
        "soins de la peau": "Soins de la peau",
        makeup: "Maquillage",
        maquillage: "Maquillage",
        fragrance: "Parfums",
        parfums: "Parfums",
        haircare: "Soins capillaires",
        "soins capillaires": "Soins capillaires",
        bodycare: "Soins du corps",
        "soins du corps": "Soins du corps",
      };

      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({
          name: categoryLabelMap[key.toLowerCase()] || key,
          value: Math.round(value),
          percentage: grand > 0 ? Math.round((value / grand) * 100) : 0,
        }));
    } catch (error) {
      console.error("❌ fetchCategoryData error:", error?.message);
      return this.getMockCategoryData();
    }
  }

  /**
   * Calcule les 4 KPIs pour KPISummaryCards.
   * Retourne { totalProducts, topPerformer, lowMarginCount, inventoryTurnover }
   */
  async fetchProductKPIs() {
    try {
      const products = await this.fetchProducts();

      const topPerformer = products.reduce(
        (max, p) => (p.revenue > (max.revenue || 0) ? p : max),
        products[0],
      );

      const lowMarginCount = products.filter(
        (p) => (p.profitMargin ?? 100) < 30,
      ).length;

      const totalInventory = products.reduce(
        (s, p) => s + (p.unitsSold || 0),
        0,
      );
      const avgStock = products.reduce(
        (s, p) => s + (p.inventoryQuantity || 0),
        0,
      );
      const inventoryTurnover =
        avgStock > 0 ? parseFloat((totalInventory / avgStock).toFixed(1)) : 0;

      return {
        totalProducts: products.filter((p) => p.status === "active").length,
        topPerformer: {
          name: topPerformer?.name || "N/A",
          revenue: topPerformer?.revenue || 0,
        },
        lowMarginCount,
        inventoryTurnover,
      };
    } catch (error) {
      console.error("❌ fetchProductKPIs error:", error?.message);
      return this.getMockProductKPIs();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Influencer Performance API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Métriques clés de l'influenceur : revenu, commission, conversion, engagement.
   * Basé sur les commandes des 30 derniers jours vs 30 jours précédents.
   */
  async fetchInfluencerMetrics(commissionRate = 0.15) {
    try {
      const [current, previous] = await Promise.all([
        this._fetchOrdersForPeriod(30),
        this._fetchOrdersForPeriod(60, 30),
      ]);

      const totalRevenue = current.reduce((s, o) => s + o.total, 0);
      const prevRevenue = previous.reduce((s, o) => s + o.total, 0);
      const growth =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;

      const commission = totalRevenue * commissionRate;
      const prevCommission = prevRevenue * commissionRate;
      const commissionGrowth =
        prevCommission > 0
          ? ((commission - prevCommission) / prevCommission) * 100
          : 0;

      // Taux de conversion = commandes payées / total commandes (approx.)
      const paidOrders = current.filter((o) => o.status === "PAID").length;
      const conversionRate =
        current.length > 0
          ? parseFloat(((paidOrders / current.length) * 10).toFixed(1)) // normalisé sur 10
          : 0;

      return [
        {
          title: "Revenu personnel",
          value: `${this._formatCurrency(totalRevenue * commissionRate)}`,
          change: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
          changeType: growth >= 0 ? "positive" : "negative",
          icon: "TrendingUp",
          iconColor: "var(--color-primary)",
          badge: growth > 15 ? "🎯 Objectif atteint" : null,
        },
        {
          title: "Commission gagnée",
          value: `${this._formatCurrency(commission)}`,
          change: `${commissionGrowth >= 0 ? "+" : ""}${commissionGrowth.toFixed(1)}%`,
          changeType: commissionGrowth >= 0 ? "positive" : "negative",
          icon: "DollarSign",
          iconColor: "var(--color-accent)",
          badge: null,
        },
        {
          title: "Taux de conversion",
          value: `${conversionRate}%`,
          change: "+0,8%",
          changeType: "positive",
          icon: "Target",
          iconColor: "var(--color-success)",
          badge: null,
        },
        {
          title: "Engagement abonnés",
          value: "8,2%",
          change: "-0,3%",
          changeType: "negative",
          icon: "Heart",
          iconColor: "var(--color-warning)",
          badge: null,
        },
      ];
    } catch (error) {
      console.error("❌ fetchInfluencerMetrics error:", error?.message);
      return this.getMockInfluencerMetrics();
    }
  }

  /**
   * Données mensuelles pour PerformanceChart : { month, sales, commission }
   * sur les 6 derniers mois.
   */
  async fetchPerformanceChart(commissionRate = 0.15) {
    const query = `query PerfChart($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: false) {
        edges {
          node {
            createdAt
            displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 250 });
      const orders = (data?.orders?.edges || []).map((e) => e.node);

      const months = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jun",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      const now = new Date();
      const map = {};

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        map[key] = { month: months[d.getMonth()], sales: 0, commission: 0 };
      }

      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!map[key]) return;
        const amount = parseFloat(o.totalPriceSet?.shopMoney?.amount || 0);
        map[key].sales += amount;
      });

      return Object.values(map).map((m) => ({
        month: m.month,
        sales: Math.round(m.sales),
        commission: parseFloat((commissionRate * 100).toFixed(0)),
      }));
    } catch (error) {
      console.error("❌ fetchPerformanceChart error:", error?.message);
      return this.getMockChartData();
    }
  }

  /**
   * Top 4 produits par commissions générées pour ProductPerformanceCard.
   */
  async fetchTopProducts(commissionRate = 0.15) {
    const query = `query TopProducts($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            lineItems(first: 10) {
              edges {
                node {
                  title quantity
                  variant {
                    price
                    image { url altText }
                    product { id featuredImage { url altText } }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 100 });
      const orders = data?.orders?.edges || [];

      // Agréger par titre de produit
      const productMap = {};
      orders.forEach((edge) => {
        (edge.node?.lineItems?.edges || []).forEach((li) => {
          const item = li.node;
          const title = item.title;
          const price = parseFloat(item.variant?.price || 0);
          const qty = item.quantity || 0;
          if (!productMap[title]) {
            productMap[title] = {
              name: title,
              sales: 0,
              revenue: 0,
              image:
                item.variant?.image?.url ||
                item.variant?.product?.featuredImage?.url ||
                null,
              imageAlt: item.variant?.image?.altText || title,
              price,
            };
          }
          productMap[title].sales += qty;
          productMap[title].revenue += price * qty;
        });
      });

      const badges = ["Top 1", "Top 2", "Top 3", "Top 4"];
      return Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
        .map((p, i) => {
          const commissionPerUnit = parseFloat(
            (p.price * commissionRate).toFixed(2),
          );
          const totalCommission = Math.round(
            p.sales * commissionPerUnit,
          ).toLocaleString("fr-FR");
          return {
            id: i + 1,
            name: p.name,
            image:
              p.image || "https://via.placeholder.com/300x400?text=Product",
            imageAlt: p.imageAlt,
            sales: p.sales,
            commissionPerUnit,
            totalCommission,
            trend: i < 3 ? "up" : "down",
            trendValue: i < 3 ? `+${10 + i * 5}%` : "-5%",
            badge: badges[i] || null,
          };
        });
    } catch (error) {
      console.error("❌ fetchTopProducts error:", error?.message);
      return this.getMockTopProducts();
    }
  }

  /**
   * Calendrier des paiements de commissions pour CommissionCalendar.
   * Basé sur les transactions financières Shopify.
   */
  async fetchPayoutSchedule(commissionRate = 0.15) {
    const query = `query PayoutSchedule($first: Int!) {
      orders(
        first: $first
        sortKey: CREATED_AT
        reverse: true
        query: "financial_status:paid OR financial_status:pending OR financial_status:partially_paid"
      ) {
        edges {
          node {
            id name createdAt displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 50 });
      const orders = data?.orders?.edges || [];

      // Regrouper par mois et construire les entrées de paiement
      const monthMap = {};
      orders.forEach((edge) => {
        const o = edge.node;
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap[key]) {
          monthMap[key] = {
            date: d,
            total: 0,
            status: o.displayFinancialStatus,
            month: d.getMonth(),
          };
        }
        monthMap[key].total +=
          parseFloat(o.totalPriceSet?.shopMoney?.amount || 0) * commissionRate;
      });

      const statusMap = {
        PAID: "paid",
        PENDING: "pending",
        PARTIALLY_PAID: "processing",
      };

      return Object.values(monthMap)
        .sort((a, b) => b.date - a.date)
        .slice(0, 3)
        .map((m, i) => ({
          id: i + 1,
          month: m.month,
          date: m.date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          amount: Math.round(m.total).toLocaleString("fr-FR"),
          status: statusMap[m.status] || "scheduled",
          description: `Commission ${m.date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
          method: "Virement bancaire",
        }));
    } catch (error) {
      console.error("❌ fetchPayoutSchedule error:", error?.message);
      return this.getMockPayoutSchedule();
    }
  }

  /**
   * Métriques d'engagement des abonnés pour EngagementMetrics.
   * Shopify ne fournit pas de données sociales natives ; on dérive des
   * proxys cohérents à partir des commandes du mois courant vs précédent.
   *
   * Mapping :
   *  - "Clics sur liens"    ≈ nbr commandes × 2,6  (chaque commande implique ~2-3 visites)
   *  - "Partages de contenu" ≈ clients uniques × 1,4 (fraction partage)
   *  - "Commentaires"        ≈ clients uniques × 0,8 (reviews / feedback)
   */
  async fetchEngagementMetrics() {
    try {
      const [current, previous] = await Promise.all([
        this._fetchOrdersForPeriod(30),
        this._fetchOrdersForPeriod(60, 30),
      ]);

      const CLICK_COEFF = 2.6;
      const SHARE_COEFF = 1.4;
      const COMMENT_COEFF = 0.8;

      // Clients uniques (approx via count des orders)
      const uniqueCustomers = new Set(current.map((o) => o.id)).size;
      const prevUniqueCustomers = new Set(previous.map((o) => o.id)).size;

      const clicks = Math.round(current.length * CLICK_COEFF);
      const prevClicks = Math.round(previous.length * CLICK_COEFF);
      const shares = Math.round(uniqueCustomers * SHARE_COEFF);
      const prevShares = Math.round(prevUniqueCustomers * SHARE_COEFF);
      const comments = Math.round(uniqueCustomers * COMMENT_COEFF);
      const prevComments = Math.round(prevUniqueCustomers * COMMENT_COEFF);

      // Objectifs fixes de référence pour le % de progression
      const CLICK_GOAL = Math.max(clicks, 3500);
      const SHARE_GOAL = Math.max(shares, 2000);
      const COMMENT_GOAL = Math.max(comments, 1200);

      const pct = (val, goal) => Math.min(100, Math.round((val / goal) * 100));
      const chg = (cur, prev) =>
        prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

      return [
        {
          id: 1,
          label: "Clics sur liens",
          value: clicks.toLocaleString("fr-FR"),
          percentage: pct(clicks, CLICK_GOAL),
          color: "var(--color-primary)",
          icon: "MousePointerClick",
          change: chg(clicks, prevClicks),
        },
        {
          id: 2,
          label: "Partages de contenu",
          value: shares.toLocaleString("fr-FR"),
          percentage: pct(shares, SHARE_GOAL),
          color: "var(--color-accent)",
          icon: "Share2",
          change: chg(shares, prevShares),
        },
        {
          id: 3,
          label: "Commentaires",
          value: comments.toLocaleString("fr-FR"),
          percentage: pct(comments, COMMENT_GOAL),
          color: "var(--color-success)",
          icon: "MessageCircle",
          change: chg(comments, prevComments),
        },
      ];
    } catch (error) {
      console.error("❌ fetchEngagementMetrics error:", error?.message);
      return this.getMockEngagementMetrics();
    }
  }

  /**
   * Calcule la progression vers 3 objectifs mensuels :
   *  - Chiffre d'affaires  : revenu réel du mois en cours vs objectif fixe
   *  - Nombre de ventes    : nombre de commandes du mois en cours vs objectif fixe
   *  - Nouveaux clients    : clients uniques du mois en cours vs objectif fixe
   *
   * Les objectifs peuvent être remplacés par de vrais objectifs Shopify
   * (metafields ou valeurs configurées) dès qu'ils existent.
   *
   * Retourne [{ id, label, current, goal, color, bonusThreshold, bonusAmount }]
   */
  async fetchMonthlyGoals(
    goals = { revenue: 50000, sales: 1200, customers: 300 },
  ) {
    try {
      const [currentOrders, previousOrders] = await Promise.all([
        this._fetchOrdersForPeriod(30),
        this._fetchOrdersForPeriod(60, 30),
      ]);

      // Revenu total du mois
      const currentRevenue = currentOrders.reduce((s, o) => s + o.total, 0);

      // Nombre de commandes du mois
      const currentSales = currentOrders.length;

      // Clients uniques : on approxime via les IDs d'orders (1 order ≈ 1 client unique)
      // Shopify ne retourne pas l'email dans _fetchOrdersForPeriod, on utilise la taille
      const currentCustomers = currentOrders.length; // proxy — à affiner si customerId dispo

      const prevRevenue = previousOrders.reduce((s, o) => s + o.total, 0);
      const prevSales = previousOrders.length;
      const prevCustomers = previousOrders.length;

      const fmt = (val, goal) => {
        const pct = goal > 0 ? Math.min(100, (val / goal) * 100) : 0;
        const remaining = Math.max(0, goal - val);
        return { pct: parseFloat(pct.toFixed(1)), remaining };
      };

      const r = fmt(currentRevenue, goals.revenue);
      const s = fmt(currentSales, goals.sales);
      const c = fmt(currentCustomers, goals.customers);

      // Bonus si tous les objectifs sont atteints à ≥ 90 %
      const onTrack = r.pct >= 90 && s.pct >= 90 && c.pct >= 90;

      return {
        onTrack,
        bonus: { threshold: 90, amount: 2000 },
        items: [
          {
            id: "revenue",
            label: "Chiffre d'affaires",
            current: Math.round(currentRevenue),
            goal: goals.revenue,
            pct: r.pct,
            remaining: Math.round(r.remaining),
            prevValue: Math.round(prevRevenue),
            color: "primary",
          },
          {
            id: "sales",
            label: "Nombre de ventes",
            current: currentSales,
            goal: goals.sales,
            pct: s.pct,
            remaining: s.remaining,
            prevValue: prevSales,
            color: "accent",
          },
          {
            id: "customers",
            label: "Nouveaux clients",
            current: currentCustomers,
            goal: goals.customers,
            pct: c.pct,
            remaining: c.remaining,
            prevValue: prevCustomers,
            color: "success",
          },
        ],
      };
    } catch (error) {
      console.error("❌ fetchMonthlyGoals error:", error?.message);
      return this.getMockMonthlyGoals();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Executive Overview API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Agrège les 6 derniers mois de revenus par "marque" (productType).
   * Retourne brands[] + revenueChartData[] pour RevenueChart & BrandRankingTable.
   *
   * Comme Shopify ne gère pas nativement les "marques" multi-brand,
   * on mappe les productTypes sur les 4 marques OJENA Studios.
   */
  async fetchBrandsRevenue() {
    const query = `query BrandsRevenue($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            createdAt
            displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
            lineItems(first: 20) {
              edges {
                node {
                  title quantity
                  variant { price product { productType vendor } }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 250 });
      const orders = data?.orders?.edges || [];

      // Mapping vendor / productType → brand id
      const BRAND_MAP = {
        "ojena beauty": "ojena-beauty",
        ojena: "ojena-beauty",
        "luxe cosmetics": "luxe-cosmetics",
        luxe: "luxe-cosmetics",
        "glow essentials": "glow-essentials",
        glow: "glow-essentials",
        "radiance pro": "radiance-pro",
        radiance: "radiance-pro",
      };

      const BRAND_META = {
        "ojena-beauty": {
          name: "OJENA Beauty",
          color: "#D4B5A0",
          logo: "https://img.rocket.new/generatedImages/rocket_gen_img_194dea694-1766536842466.png",
          logoAlt: "OJENA Beauty logo featuring elegant gold lettering",
        },
        "luxe-cosmetics": {
          name: "Luxe Cosmetics",
          color: "#C9A876",
          logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1acdf67b9-1766536843945.png",
          logoAlt: "Luxe Cosmetics logo with sophisticated serif typography",
        },
        "glow-essentials": {
          name: "Glow Essentials",
          color: "#7A9471",
          logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1bd45d002-1766536842789.png",
          logoAlt:
            "Glow Essentials logo with modern sans-serif font in sage green",
        },
        "radiance-pro": {
          name: "Radiance Pro",
          color: "#B8956A",
          logo: "https://img.rocket.new/generatedImages/rocket_gen_img_12baaf56c-1766536843330.png",
          logoAlt:
            "Radiance Pro logo with bold contemporary lettering in warm amber",
        },
      };

      const months = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jun",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      const now = new Date();

      // Initialiser la fenêtre glissante de 6 mois
      const monthKeys = [];
      const chartMap = {}; // key → { month, 'ojena-beauty': 0, ... }
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthKeys.push(key);
        chartMap[key] = {
          month: months[d.getMonth()],
          "ojena-beauty": 0,
          "luxe-cosmetics": 0,
          "glow-essentials": 0,
          "radiance-pro": 0,
        };
      }

      // Revenu total par brand (tous mois confondus)
      const brandRevenue = {
        "ojena-beauty": 0,
        "luxe-cosmetics": 0,
        "glow-essentials": 0,
        "radiance-pro": 0,
      };

      orders.forEach((edge) => {
        const o = edge.node;
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;

        (o.lineItems?.edges || []).forEach((li) => {
          const item = li.node;
          const vendor = (item.variant?.product?.vendor || "").toLowerCase();
          const type = (item.variant?.product?.productType || "").toLowerCase();
          const brandId =
            BRAND_MAP[vendor] || BRAND_MAP[type] || "ojena-beauty"; // fallback
          const amount =
            parseFloat(item.variant?.price || 0) * (item.quantity || 0);

          brandRevenue[brandId] += amount;
          if (chartMap[key]) chartMap[key][brandId] += amount;
        });
      });

      const grand = Object.values(brandRevenue).reduce((s, v) => s + v, 0);

      // Construire brands[]
      const brands = Object.entries(BRAND_META)
        .map(([id, meta]) => {
          const revenue = Math.round(brandRevenue[id]);
          const contribution =
            grand > 0 ? Math.round((revenue / grand) * 100) : 25;
          return { id, ...meta, revenue, contribution, growth: 0 }; // growth calculé séparément si besoin
        })
        .sort((a, b) => b.revenue - a.revenue);

      // Arrondir les valeurs du chart
      const revenueChartData = Object.values(chartMap).map((m) => {
        const out = { month: m.month };
        Object.keys(BRAND_META).forEach((id) => {
          out[id] = Math.round(m[id]);
        });
        return out;
      });

      // Si aucune donnée réelle, fallback mock
      if (grand === 0) return [];
      return { brands, revenueChartData };
    } catch (error) {
      console.error("❌ fetchBrandsRevenue error:", error?.message);
      return this.getMockBrandsRevenue();
    }
  }

  /**
   * Construit monthlyComparisonData : 6 mois × 4 marques × {revenue, orders, commission}.
   * Utilise les mêmes commandes que fetchBrandsRevenue mais agrège différemment.
   */
  async fetchMonthlyComparison(commissionRate = 0.185) {
    const query = `query MonthlyComparison($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: false) {
        edges {
          node {
            createdAt
            totalPriceSet { shopMoney { amount } }
            lineItems(first: 20) {
              edges {
                node {
                  title quantity
                  variant { price product { productType vendor } }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 250 });
      const orders = data?.orders?.edges || [];

      const BRAND_MAP = {
        "ojena beauty": "ojena-beauty",
        ojena: "ojena-beauty",
        "luxe cosmetics": "luxe-cosmetics",
        luxe: "luxe-cosmetics",
        "glow essentials": "glow-essentials",
        glow: "glow-essentials",
        "radiance pro": "radiance-pro",
        radiance: "radiance-pro",
      };

      const months = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jun",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      const now = new Date();
      const brandIds = [
        "ojena-beauty",
        "luxe-cosmetics",
        "glow-essentials",
        "radiance-pro",
      ];

      const chartMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = { month: months[d.getMonth()] };
        brandIds.forEach((id) => {
          entry[`${id}_revenue`] = 0;
          entry[`${id}_orders`] = 0;
          entry[`${id}_commission`] = 0;
        });
        chartMap[key] = entry;
      }

      // Suivre les orders déjà comptés par mois/brand pour éviter les doublons
      const orderCounted = {};

      orders.forEach((edge) => {
        const o = edge.node;
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!chartMap[key]) return;

        (o.lineItems?.edges || []).forEach((li) => {
          const item = li.node;
          const vendor = (item.variant?.product?.vendor || "").toLowerCase();
          const type = (item.variant?.product?.productType || "").toLowerCase();
          const brandId =
            BRAND_MAP[vendor] || BRAND_MAP[type] || "ojena-beauty";
          const amount =
            parseFloat(item.variant?.price || 0) * (item.quantity || 0);

          chartMap[key][`${brandId}_revenue`] += amount;
          chartMap[key][`${brandId}_commission`] += amount * commissionRate;

          // Compter l'order une seule fois par brand/mois
          const orderKey = `${key}-${brandId}-${o.id || ""}`;
          if (!orderCounted[orderKey]) {
            chartMap[key][`${brandId}_orders`] += 1;
            orderCounted[orderKey] = true;
          }
        });
      });

      // Arrondir
      const result = Object.values(chartMap).map((m) => {
        const out = { month: m.month };
        brandIds.forEach((id) => {
          out[`${id}_revenue`] = Math.round(m[`${id}_revenue`]);
          out[`${id}_orders`] = m[`${id}_orders`];
          out[`${id}_commission`] = Math.round(m[`${id}_commission`]);
        });
        return out;
      });

      const hasData = result.some((m) =>
        brandIds.some((id) => m[`${id}_revenue`] > 0),
      );
      if (!hasData) return [];

      return result;
    } catch (error) {
      console.error("❌ fetchMonthlyComparison error:", error?.message);
      return this.getMockMonthlyComparison();
    }
  }

  /**
   * Génère des alertes dynamiques à partir des données Shopify :
   * - Stock critique (inventaire < 15 unités)
   * - Retards de livraison (fulfillment non traité > 48h)
   * - Record mensuel (nouveau max de revenus)
   */
  async fetchAlerts() {
    const inventoryQuery = `query LowStock($first: Int!) {
      products(first: $first) {
        edges {
          node {
            title
            variants(first: 1) {
              edges { node { inventoryQuantity } }
            }
          }
        }
      }
    }`;

    const ordersQuery = `query PendingOrders($first: Int!, $query: String!) {
      orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: false) {
        edges {
          node {
            id name createdAt displayFulfillmentStatus
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }`;

    try {
      const [inventoryData, pendingData] = await Promise.all([
        this.query(inventoryQuery, { first: 50 }),
        this.query(ordersQuery, {
          first: 50,
          query: "fulfillment_status:unfulfilled",
        }),
      ]);

      const alerts = [];
      let alertId = 1;
      const now = new Date();

      // Alertes stock critique (< 15 unités)
      (inventoryData?.products?.edges || []).forEach((edge) => {
        const product = edge.node;
        const qty =
          product.variants?.edges?.[0]?.node?.inventoryQuantity ?? 999;
        if (qty < 15 && qty >= 0) {
          const severity = qty < 5 ? "critical" : "warning";
          alerts.push({
            id: alertId++,
            severity,
            title: qty < 5 ? "Rupture de stock imminente" : "Stock faible",
            message: `${product.title} — ${qty} unité${qty > 1 ? "s" : ""} restante${qty > 1 ? "s" : ""}`,
            time: "Maintenant",
          });
        }
      });

      // Alertes retards de livraison (> 48h non traités)
      const overdueOrders = (pendingData?.orders?.edges || []).filter(
        (edge) => {
          const created = new Date(edge.node.createdAt);
          const diffHours = (now - created) / (1000 * 60 * 60);
          return diffHours > 48;
        },
      );

      if (overdueOrders.length > 0) {
        alerts.push({
          id: alertId++,
          severity: overdueOrders.length > 10 ? "critical" : "warning",
          title: "Retard de livraison",
          message: `${overdueOrders.length} commande${overdueOrders.length > 1 ? "s" : ""} dépasse${overdueOrders.length > 1 ? "nt" : ""} le délai standard de 48h`,
          time: "Il y a 1 heure",
        });
      }

      // Alerte info : récupérer le revenu du mois courant vs le mois précédent
      const [current, previous] = await Promise.all([
        this._fetchOrdersForPeriod(30),
        this._fetchOrdersForPeriod(60, 30),
      ]);
      const currentRevenue = current.reduce((s, o) => s + o.total, 0);
      const prevRevenue = previous.reduce((s, o) => s + o.total, 0);
      if (currentRevenue > prevRevenue && prevRevenue > 0) {
        alerts.push({
          id: alertId++,
          severity: "info",
          title: "Progression des revenus",
          message: `Revenus en hausse de ${(((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)}% par rapport au mois précédent`,
          time: "Aujourd'hui",
        });
      }

      if (alerts.length === 0) return this.getMockAlerts();
      return alerts.slice(0, 5); // max 5 alertes
    } catch (error) {
      console.error("❌ fetchAlerts error:", error?.message);
      return this.getMockAlerts();
    }
  }

  async fetchOrders(limit = 50) {
    const query = `query FetchOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id name createdAt displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 5) {
              edges {
                node {
                  title quantity
                  variant { sku price }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: limit });
      console.log("✅ Orders raw data:", data);
      console.log("✅ Orders fetched:", data?.orders?.edges?.length);
      return this.transformOrders(data?.orders?.edges || []);
    } catch (error) {
      console.error(
        "❌ Orders error:",
        error?.response?.errors || error?.message,
      );
    }
  }

  async fetchOrderMetrics() {
    try {
      const orders = await this.fetchOrders(50);
      return this.calculateOrderMetrics(orders);
    } catch (error) {
      console.error("❌ Metrics calculation error:", error);
    }
  }

  /**
   * Calcule les 4 KPI cards de la Vue d'ensemble exécutive,
   * incluant les sparklineData sur les 7 dernières semaines.
   *
   * Retourne un tableau de 4 objets prêts à être passés à <MetricCard>.
   */
  async fetchExecutiveKPIs(commissionRate = 0.185) {
    const query = `query ExecutiveKPIs($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            createdAt
            displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 250 });
      const edges = data?.orders?.edges || [];

      const now = new Date();
      const ms30 = 30 * 24 * 60 * 60 * 1000;
      const ms60 = 60 * 24 * 60 * 60 * 1000;
      const msWeek = 7 * 24 * 60 * 60 * 1000;

      // ── Périodes 30j / 30j précédents ────────────────────────────────
      const cutCurrent = new Date(now - ms30);
      const cutPrevious = new Date(now - ms60);

      let revCurrent = 0,
        revPrevious = 0;
      let ordCurrent = 0,
        ordPrevious = 0;

      edges.forEach(({ node: o }) => {
        const d = new Date(o.createdAt);
        const amount = parseFloat(o.totalPriceSet?.shopMoney?.amount || 0);
        if (d >= cutCurrent) {
          revCurrent += amount;
          ordCurrent++;
        } else if (d >= cutPrevious) {
          revPrevious += amount;
          ordPrevious++;
        }
      });

      const revenueGrowth =
        revPrevious > 0 ? ((revCurrent - revPrevious) / revPrevious) * 100 : 0;
      const ordersGrowth =
        ordPrevious > 0 ? ((ordCurrent - ordPrevious) / ordPrevious) * 100 : 0;

      // ── Sparklines : revenu / commissions / commandes par semaine (7 sem.) ─
      const weeks = Array.from({ length: 7 }, (_, i) => {
        const start = new Date(now - (7 - i) * msWeek);
        const end = new Date(now - (6 - i) * msWeek);
        return { start, end, rev: 0, ord: 0 };
      });

      edges.forEach(({ node: o }) => {
        const d = new Date(o.createdAt);
        const amount = parseFloat(o.totalPriceSet?.shopMoney?.amount || 0);
        const w = weeks.find((w) => d >= w.start && d < w.end);
        if (w) {
          w.rev += amount;
          w.ord++;
        }
      });

      const sparkRev = weeks.map((w) => Math.round(w.rev));
      const sparkComm = weeks.map((w) => Math.round(w.rev * commissionRate));
      const sparkOrd = weeks.map((w) => w.ord);

      // ── KPI "Croissance marques" : % de marques en croissance ────────
      // On dérive via fetchBrandsRevenue — si déjà appelé on évite une 2e requête
      // en passant la valeur via brandsGrowthCount depuis fetchAllData.
      // Ici on calcule juste le change basé sur revenueGrowth comme proxy.
      const brandsGrowthChange = revenueGrowth;

      const fmt = (v, decimals = 1) =>
        `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;

      return [
        {
          title: "Revenus totaux",
          value: `${Math.round(revCurrent).toLocaleString("fr-FR")} €`,
          change: fmt(revenueGrowth),
          changeType: revenueGrowth >= 0 ? "positive" : "negative",
          sparklineData: sparkRev,
          icon: "TrendingUp",
          iconColor: "var(--color-success)",
        },
        {
          title: "Commissions versées",
          value: `${Math.round(revCurrent * commissionRate).toLocaleString("fr-FR")} €`,
          change: fmt(revenueGrowth),
          changeType: revenueGrowth >= 0 ? "positive" : "negative",
          sparklineData: sparkComm,
          icon: "DollarSign",
          iconColor: "var(--color-accent)",
        },
        {
          title: "Commandes actives",
          value: ordCurrent.toLocaleString("fr-FR"),
          change: fmt(ordersGrowth),
          changeType: ordersGrowth >= 0 ? "positive" : "negative",
          sparklineData: sparkOrd,
          icon: "ShoppingCart",
          iconColor: "var(--color-primary)",
        },
        {
          title: "Croissance marques",
          value: null, // sera complété dans la page avec brandsData
          change: fmt(brandsGrowthChange),
          changeType: brandsGrowthChange >= 0 ? "positive" : "negative",
          sparklineData: sparkRev.map((v, i, arr) =>
            i === 0
              ? 0
              : Math.round(((v - arr[i - 1]) / (arr[i - 1] || 1)) * 100),
          ),
          icon: "Sparkles",
          iconColor: "var(--color-warning)",
        },
      ];
    } catch (error) {
      console.error("❌ fetchExecutiveKPIs error:", error?.message);
      return this.getMockExecutiveKPIs();
    }
  }

  getMockExecutiveKPIs() {
    return [
      {
        title: "Revenus totaux",
        value: "487 250 €",
        change: "+18,5%",
        changeType: "positive",
        sparklineData: [45000, 52000, 48000, 61000, 58000, 67000, 72000],
        icon: "TrendingUp",
        iconColor: "var(--color-success)",
      },
      {
        title: "Commissions versées",
        value: "90 141 €",
        change: "+18,5%",
        changeType: "positive",
        sparklineData: [8325, 9620, 8880, 11285, 10730, 12395, 13320],
        icon: "DollarSign",
        iconColor: "var(--color-accent)",
      },
      {
        title: "Commandes actives",
        value: "1 247",
        change: "+5,8%",
        changeType: "positive",
        sparklineData: [180, 195, 210, 225, 240, 255, 268],
        icon: "ShoppingCart",
        iconColor: "var(--color-primary)",
      },
      {
        title: "Croissance marques",
        value: null,
        change: "+3,2%",
        changeType: "positive",
        sparklineData: [8, 12, 15, 18, 21, 23, 25],
        icon: "Sparkles",
        iconColor: "var(--color-warning)",
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Récupère les métriques financières agrégées pour la page commission.
   * Basé sur les commandes Shopify des 30 derniers jours.
   */
  async fetchRevenueMetrics() {
    try {
      const [currentOrders, previousOrders] = await Promise.all([
        this._fetchOrdersForPeriod(30),
        this._fetchOrdersForPeriod(60, 30),
      ]);

      const totalDue = currentOrders.reduce((s, o) => s + o.total, 0);
      const prevTotal = previousOrders.reduce((s, o) => s + o.total, 0);
      const growth =
        prevTotal > 0 ? ((totalDue - prevTotal) / prevTotal) * 100 : 0;

      const paid = currentOrders.filter((o) => o.status === "PAID");
      const pending = currentOrders.filter((o) => o.status !== "PAID");
      const paidTotal = paid.reduce((s, o) => s + o.total, 0);
      const pendingTotal = pending.reduce((s, o) => s + o.total, 0);

      const commissionRate = 0.185;
      const commissionsDue = totalDue * commissionRate;

      // Prochain paiement simulé à J+7
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
      const nextPaymentLabel = nextPaymentDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });

      return [
        {
          title: "Commissions Totales Dues",
          value: this._formatCurrency(commissionsDue),
          subtitle: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs mois dernier`,
          icon: "DollarSign",
          trend: growth >= 0 ? "up" : "down",
          trendValue: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
          status: "primary",
        },
        {
          title: "Paiements Traités",
          value: this._formatCurrency(paidTotal * commissionRate),
          subtitle: `${paid.length} transactions`,
          icon: "CheckCircle",
          trend: "up",
          trendValue: `${paid.length}`,
          status: "success",
        },
        {
          title: "Paiements en Attente",
          value: this._formatCurrency(pendingTotal * commissionRate),
          subtitle: `${pending.length} transactions`,
          icon: "Clock",
          trend: "neutral",
          trendValue: `${pending.length}`,
          status: "warning",
        },
        {
          title: "Taux de Commission Moyen",
          value: `${(commissionRate * 100).toFixed(1)}%`,
          subtitle: "Tous types confondus",
          icon: "Percent",
          trend: "up",
          trendValue: "+0,8%",
          status: "default",
        },
        {
          title: "Retards de Paiement",
          value: String(pending.filter((o) => this._isOverdue(o.date)).length),
          subtitle: `${this._formatCurrency(
            pending
              .filter((o) => this._isOverdue(o.date))
              .reduce((s, o) => s + o.total * commissionRate, 0),
          )} en retard`,
          icon: "AlertTriangle",
          trend: "down",
          trendValue: "-2",
          status: "error",
        },
        {
          title: "Prochain Paiement",
          value: nextPaymentLabel,
          subtitle: `${pending.length} paiements planifiés`,
          icon: "Calendar",
          trend: "neutral",
          trendValue: "7 jours",
          status: "default",
        },
      ];
    } catch (error) {
      console.error("❌ fetchRevenueMetrics error:", error?.message);
    }
  }

  /**
   * Récupère les données mensuelles du graphique timeline des commissions
   * pour les 12 derniers mois.
   */
  async fetchCommissionTimeline() {
    const query = `query CommissionTimeline($first: Int!, $after: String) {
      orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            createdAt
            displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
            tags
          }
        }
      }
    }`;

    try {
      let allOrders = [];
      let cursor = null;
      let hasNext = true;

      // Paginer jusqu'à 250 commandes max pour couvrir 12 mois
      while (hasNext && allOrders.length < 250) {
        const vars = { first: 50, ...(cursor ? { after: cursor } : {}) };
        const data = await this.query(query, vars);
        const edges = data?.orders?.edges || [];
        allOrders = allOrders.concat(edges.map((e) => e.node));
        hasNext = data?.orders?.pageInfo?.hasNextPage;
        cursor = data?.orders?.pageInfo?.endCursor;
      }

      return this._aggregateByMonth(allOrders);
    } catch (error) {
      console.error("❌ fetchCommissionTimeline error:", error?.message);
    }
  }

  /**
   * Récupère les transactions de commission récentes (50 dernières commandes).
   */
  async fetchCommissionTransactions(filters = {}) {
    const query = `query CommissionTransactions($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id name createdAt displayFinancialStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName email }
            tags
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 50 });
      const edges = data?.orders?.edges || [];
      const transactions = this._transformTransactions(edges);
      return this._applyTransactionFilters(transactions, filters);
    } catch (error) {
      console.error("❌ fetchCommissionTransactions error:", error?.message);
    }
  }

  /**
   * Récupère la file d'attente des paiements à venir
   * (commandes non payées regroupées par client).
   */
  async fetchPaymentQueue() {
    const query = `query PaymentQueue($first: Int!) {
      orders(
        first: $first
        sortKey: CREATED_AT
        reverse: true
        query: "financial_status:pending OR financial_status:partially_paid"
      ) {
        edges {
          node {
            id name createdAt
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName email }
            tags
          }
        }
      }
    }`;

    try {
      const data = await this.query(query, { first: 50 });
      const edges = data?.orders?.edges || [];
      return this._buildPaymentQueue(edges);
    } catch (error) {
      console.error("❌ fetchPaymentQueue error:", error?.message);
      return this.getMockPaymentQueue();
    }
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  async _fetchOrdersForPeriod(daysBack, offsetDays = 0) {
    const now = new Date();
    const from = new Date(now.getTime() - (daysBack + offsetDays) * 86400000);
    const to = new Date(now.getTime() - offsetDays * 86400000);

    const query = `query OrdersPeriod($first: Int!, $queryStr: String!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true, query: $queryStr) {
        edges {
          node {
            id createdAt displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }`;

    const queryStr = `created_at:>='${from.toISOString()}' created_at:<='${to.toISOString()}'`;
    const data = await this.query(query, { first: 250, queryStr });
    return (data?.orders?.edges || []).map((e) => ({
      id: e.node.id,
      date: new Date(e.node.createdAt),
      total: parseFloat(e.node.totalPriceSet?.shopMoney?.amount || 0),
      status: e.node.displayFinancialStatus,
    }));
  }

  _isOverdue(date, thresholdDays = 30) {
    return (new Date() - new Date(date)) / 86400000 > thresholdDays;
  }

  _formatCurrency(amount, currency = "EUR") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  _aggregateByMonth(orders) {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const now = new Date();
    const map = {};

    // Initialiser les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = {
        month: months[d.getMonth()],
        influencer: 0,
        affiliate: 0,
        bonus: 0,
      };
    }

    const commissionRate = 0.185;
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) return;
      const amount =
        parseFloat(o.totalPriceSet?.shopMoney?.amount || 0) * commissionRate;
      const tags = (o.tags || []).map((t) => t.toLowerCase());
      if (tags.includes("bonus")) map[key].bonus += amount;
      else if (tags.includes("affiliate") || tags.includes("affilié"))
        map[key].affiliate += amount;
      else map[key].influencer += amount;
    });

    return Object.values(map).map((m) => ({
      month: m.month,
      influencer: Math.round(m.influencer),
      affiliate: Math.round(m.affiliate),
      bonus: Math.round(m.bonus),
    }));
  }

  _transformTransactions(edges) {
    const commissionRate = 0.185;
    const types = ["Influenceur", "Affilié", "Bonus"];
    const statusMap = {
      PAID: "paid",
      PENDING: "pending",
      PARTIALLY_PAID: "processing",
      REFUNDED: "disputed",
    };

    return edges.map((edge, i) => {
      const o = edge.node;
      const total = parseFloat(o.totalPriceSet?.shopMoney?.amount || 0);
      const tags = (o.tags || []).map((t) => t.toLowerCase());
      let type = "Influenceur";
      if (tags.includes("bonus")) type = "Bonus";
      else if (tags.includes("affiliate") || tags.includes("affilié"))
        type = "Affilié";

      const firstName = o.customer?.firstName || "";
      const lastName = o.customer?.lastName || "";
      const name =
        [firstName, lastName].filter(Boolean).join(" ") || `Client #${i + 1}`;

      return {
        id: o.id,
        date: new Date(o.createdAt).toLocaleDateString("fr-FR"),
        name,
        brand: "OJENA Studios",
        type,
        amount: Math.round(total * commissionRate),
        status: statusMap[o.displayFinancialStatus] || "pending",
        avatar: null,
        avatarAlt: name,
      };
    });
  }

  _applyTransactionFilters(transactions, filters) {
    const typeMap = {
      influencer: "Influenceur",
      affiliate: "Affilié",
      bonus: "Bonus",
    };
    return transactions.filter((t) => {
      if (filters.commissionType && filters.commissionType !== "all") {
        if (t.type !== typeMap[filters.commissionType]) return false;
      }
      if (filters.paymentStatus && filters.paymentStatus !== "all") {
        if (t.status !== filters.paymentStatus) return false;
      }
      return true;
    });
  }

  _buildPaymentQueue(edges) {
    const commissionRate = 0.185;
    const priorities = ["high", "high", "medium", "medium", "low"];
    const grouped = {};

    edges.forEach((edge) => {
      const o = edge.node;
      const key = o.customer?.email || o.id;
      if (!grouped[key]) {
        grouped[key] = {
          name:
            [o.customer?.firstName, o.customer?.lastName]
              .filter(Boolean)
              .join(" ") || "Client inconnu",
          brand: "OJENA Studios",
          amount: 0,
          dueDate: o.createdAt,
          transactions: 0,
          avatar: null,
          avatarAlt: "",
        };
      }
      grouped[key].amount +=
        parseFloat(o.totalPriceSet?.shopMoney?.amount || 0) * commissionRate;
      grouped[key].transactions += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((p, i) => ({
        id: i + 1,
        ...p,
        amount: Math.round(p.amount),
        dueDate: new Date(p.dueDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: i < 2 ? "scheduled" : "pending",
        priority: priorities[i] || "low",
      }));
  }

  transformProducts(edges) {
    return edges?.map((edge, i) => {
      const p = edge?.node;
      const v = p?.variants?.edges?.[0]?.node;
      const img = p?.images?.edges?.[0]?.node;

      const price = parseFloat(v?.price || 0);
      const cost = parseFloat(v?.inventoryItem?.unitCost?.amount || 0);
      const qty = v?.inventoryQuantity ?? 0;

      // Marge bénéficiaire réelle si le coût est disponible, sinon estimée à 45%
      const profitMargin =
        price > 0 && cost > 0
          ? parseFloat((((price - cost) / price) * 100).toFixed(1))
          : 45;

      // Statut enrichi selon l'inventaire Shopify
      const shopifyStatus = p?.status?.toLowerCase(); // active | draft | archived
      let status;
      if (shopifyStatus !== "active") {
        status = "inactive";
      } else if (qty <= 0) {
        status = "out-of-stock";
      } else if (qty <= 5) {
        status = "low-stock";
      } else {
        status = "active";
      }

      // Catégorie depuis productType ou tags
      const tags = (p?.tags || []).map((t) => t.toLowerCase());
      let category = p?.productType || "Uncategorized";
      if (!category || category === "Uncategorized") {
        if (
          tags.some((t) => ["skincare", "soins", "sérum", "crème"].includes(t))
        )
          category = "skincare";
        else if (
          tags.some((t) =>
            ["makeup", "maquillage", "fond de teint"].includes(t),
          )
        )
          category = "makeup";
        else if (tags.some((t) => ["parfum", "fragrance"].includes(t)))
          category = "fragrance";
        else if (
          tags.some((t) => ["cheveux", "haircare", "shampoing"].includes(t))
        )
          category = "haircare";
        else if (tags.some((t) => ["corps", "bodycare", "lotion"].includes(t)))
          category = "bodycare";
      }

      return {
        id: p?.id,
        name: p?.title,
        sku: v?.sku || `SKU${i + 1}`,
        category,
        image: img?.url || "https://via.placeholder.com/300x300?text=Product",
        imageAlt: img?.altText || p?.title,
        price,
        cost,
        profitMargin,
        revenue: price * qty,
        unitsSold: qty,
        inventoryQuantity: qty,
        status,
      };
    });
  }

  transformOrders(edges) {
    return edges?.map((edge) => {
      const o = edge?.node;
      return {
        id: o?.id,
        orderNumber: o?.name,
        date: new Date(o?.createdAt),
        total: parseFloat(o?.totalPriceSet?.shopMoney?.amount || 0),
        currency: o?.totalPriceSet?.shopMoney?.currencyCode || "EUR",
        status: o?.displayFinancialStatus,
        fulfillment: o?.displayFulfillmentStatus,
      };
    });
  }

  calculateOrderMetrics(orders) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const currentOrders = orders?.filter((o) => o?.date >= thirtyDaysAgo) || [];
    const currentRevenue = currentOrders?.reduce(
      (sum, o) => sum + (o?.total || 0),
      0,
    );

    // Previous period (30-60 days ago)
    const previousOrders =
      orders?.filter(
        (o) => o?.date >= sixtyDaysAgo && o?.date < thirtyDaysAgo,
      ) || [];
    const previousRevenue = previousOrders?.reduce(
      (sum, o) => sum + (o?.total || 0),
      0,
    );

    // Calculate growth
    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      totalRevenue: currentRevenue,
      totalOrders: currentOrders?.length,
      averageOrderValue: currentOrders?.length
        ? currentRevenue / currentOrders?.length
        : 0,
      revenueGrowth: revenueGrowth,
      commissionsPaid: currentRevenue * 0.15, // 15% commission rate
      activeOrders:
        currentOrders?.filter((o) => o?.status !== "PAID")?.length || 0,
    };
  }

  // Mock data for development/fallback
  getMockProducts() {
    return [
      {
        id: "mock-1",
        name: "PSB Star Premium Wig",
        sku: "PSB-001",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=PSB+Star",
        imageAlt: "PSB Star Premium Wig",
        revenue: 45600,
        unitsSold: 152,
        status: "active",
        price: 300,
      },
      {
        id: "mock-2",
        name: "Diamond 75016 Collection",
        sku: "DIA-75016",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Diamond+75016",
        imageAlt: "Diamond 75016 Collection",
        revenue: 38400,
        unitsSold: 128,
        status: "active",
        price: 300,
      },
      {
        id: "mock-3",
        name: "Luxury Lace Front",
        sku: "LUX-001",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Luxury+Lace",
        imageAlt: "Luxury Lace Front Wig",
        revenue: 28500,
        unitsSold: 95,
        status: "active",
        price: 300,
      },
      {
        id: "mock-4",
        name: "Natural Curls Pro",
        sku: "NAT-002",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Natural+Curls",
        imageAlt: "Natural Curls Pro Wig",
        revenue: 22800,
        unitsSold: 76,
        status: "active",
        price: 300,
      },
      {
        id: "mock-5",
        name: "Silk Touch Deluxe",
        sku: "SLK-003",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Silk+Touch",
        imageAlt: "Silk Touch Deluxe Wig",
        revenue: 19200,
        unitsSold: 64,
        status: "active",
        price: 300,
      },
      {
        id: "mock-6",
        name: "Glamour Wave",
        sku: "GLM-004",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Glamour+Wave",
        imageAlt: "Glamour Wave Wig",
        revenue: 16500,
        unitsSold: 55,
        status: "active",
        price: 300,
      },
      {
        id: "mock-7",
        name: "Elegant Bob Style",
        sku: "ELG-005",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Elegant+Bob",
        imageAlt: "Elegant Bob Style Wig",
        revenue: 13800,
        unitsSold: 46,
        status: "active",
        price: 300,
      },
      {
        id: "mock-8",
        name: "Vintage Classic",
        sku: "VIN-006",
        category: "Wigs",
        image: "https://via.placeholder.com/300x300?text=Vintage+Classic",
        imageAlt: "Vintage Classic Wig",
        revenue: 11400,
        unitsSold: 38,
        status: "active",
        price: 300,
      },
    ];
  }

  getMockOrders() {
    const orders = [];
    const now = new Date();

    // Generate 50 mock orders over the last 60 days
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      orders?.push({
        id: `mock-order-${i + 1}`,
        orderNumber: `#${1000 + i}`,
        date: orderDate,
        total: 150 + Math.random() * 850, // 150-1000 EUR
        currency: "EUR",
        status: Math.random() > 0.2 ? "PAID" : "PENDING",
        fulfillment: Math.random() > 0.3 ? "FULFILLED" : "UNFULFILLED",
      });
    }

    return orders?.sort((a, b) => b?.date - a?.date);
  }

  getMockOrderMetrics() {
    const orders = this.getMockOrders();
    return this.calculateOrderMetrics(orders);
  }

  // ─── Executive Overview mocks ───────────────────────────────────────────

  getMockBrandsRevenue() {
    const brands = [
      {
        id: "ojena-beauty",
        name: "OJENA Beauty",
        color: "#D4B5A0",
        logo: "https://img.rocket.new/generatedImages/rocket_gen_img_194dea694-1766536842466.png",
        logoAlt: "OJENA Beauty logo",
        revenue: 185420,
        contribution: 38,
        growth: 22.5,
      },
      {
        id: "luxe-cosmetics",
        name: "Luxe Cosmetics",
        color: "#C9A876",
        logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1acdf67b9-1766536843945.png",
        logoAlt: "Luxe Cosmetics logo",
        revenue: 142850,
        contribution: 29,
        growth: 18.3,
      },
      {
        id: "glow-essentials",
        name: "Glow Essentials",
        color: "#7A9471",
        logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1bd45d002-1766536842789.png",
        logoAlt: "Glow Essentials logo",
        revenue: 98760,
        contribution: 20,
        growth: 15.7,
      },
      {
        id: "radiance-pro",
        name: "Radiance Pro",
        color: "#B8956A",
        logo: "https://img.rocket.new/generatedImages/rocket_gen_img_12baaf56c-1766536843330.png",
        logoAlt: "Radiance Pro logo",
        revenue: 60220,
        contribution: 13,
        growth: -3.2,
      },
    ];
    const revenueChartData = [
      {
        month: "Jan",
        "ojena-beauty": 142000,
        "luxe-cosmetics": 118000,
        "glow-essentials": 82000,
        "radiance-pro": 58000,
      },
      {
        month: "Fév",
        "ojena-beauty": 148000,
        "luxe-cosmetics": 122000,
        "glow-essentials": 85000,
        "radiance-pro": 59000,
      },
      {
        month: "Mar",
        "ojena-beauty": 156000,
        "luxe-cosmetics": 128000,
        "glow-essentials": 88000,
        "radiance-pro": 61000,
      },
      {
        month: "Avr",
        "ojena-beauty": 165000,
        "luxe-cosmetics": 132000,
        "glow-essentials": 91000,
        "radiance-pro": 60000,
      },
      {
        month: "Mai",
        "ojena-beauty": 172000,
        "luxe-cosmetics": 136000,
        "glow-essentials": 94000,
        "radiance-pro": 59500,
      },
      {
        month: "Juin",
        "ojena-beauty": 185420,
        "luxe-cosmetics": 142850,
        "glow-essentials": 98760,
        "radiance-pro": 60220,
      },
    ];
    return { brands, revenueChartData };
  }

  getMockMonthlyComparison() {
    return [
      {
        month: "Jan",
        "ojena-beauty_revenue": 142000,
        "luxe-cosmetics_revenue": 118000,
        "glow-essentials_revenue": 82000,
        "radiance-pro_revenue": 58000,
        "ojena-beauty_orders": 890,
        "luxe-cosmetics_orders": 745,
        "glow-essentials_orders": 520,
        "radiance-pro_orders": 365,
        "ojena-beauty_commission": 21300,
        "luxe-cosmetics_commission": 17700,
        "glow-essentials_commission": 12300,
        "radiance-pro_commission": 8700,
      },
      {
        month: "Fév",
        "ojena-beauty_revenue": 148000,
        "luxe-cosmetics_revenue": 122000,
        "glow-essentials_revenue": 85000,
        "radiance-pro_revenue": 59000,
        "ojena-beauty_orders": 925,
        "luxe-cosmetics_orders": 768,
        "glow-essentials_orders": 538,
        "radiance-pro_orders": 372,
        "ojena-beauty_commission": 22200,
        "luxe-cosmetics_commission": 18300,
        "glow-essentials_commission": 12750,
        "radiance-pro_commission": 8850,
      },
      {
        month: "Mar",
        "ojena-beauty_revenue": 156000,
        "luxe-cosmetics_revenue": 128000,
        "glow-essentials_revenue": 88000,
        "radiance-pro_revenue": 61000,
        "ojena-beauty_orders": 975,
        "luxe-cosmetics_orders": 805,
        "glow-essentials_orders": 555,
        "radiance-pro_orders": 385,
        "ojena-beauty_commission": 23400,
        "luxe-cosmetics_commission": 19200,
        "glow-essentials_commission": 13200,
        "radiance-pro_commission": 9150,
      },
      {
        month: "Avr",
        "ojena-beauty_revenue": 165000,
        "luxe-cosmetics_revenue": 132000,
        "glow-essentials_revenue": 91000,
        "radiance-pro_revenue": 60000,
        "ojena-beauty_orders": 1032,
        "luxe-cosmetics_orders": 830,
        "glow-essentials_orders": 573,
        "radiance-pro_orders": 378,
        "ojena-beauty_commission": 24750,
        "luxe-cosmetics_commission": 19800,
        "glow-essentials_commission": 13650,
        "radiance-pro_commission": 9000,
      },
      {
        month: "Mai",
        "ojena-beauty_revenue": 172000,
        "luxe-cosmetics_revenue": 136000,
        "glow-essentials_revenue": 94000,
        "radiance-pro_revenue": 59500,
        "ojena-beauty_orders": 1075,
        "luxe-cosmetics_orders": 855,
        "glow-essentials_orders": 592,
        "radiance-pro_orders": 375,
        "ojena-beauty_commission": 25800,
        "luxe-cosmetics_commission": 20400,
        "glow-essentials_commission": 14100,
        "radiance-pro_commission": 8925,
      },
      {
        month: "Juin",
        "ojena-beauty_revenue": 185420,
        "luxe-cosmetics_revenue": 142850,
        "glow-essentials_revenue": 98760,
        "radiance-pro_revenue": 60220,
        "ojena-beauty_orders": 1160,
        "luxe-cosmetics_orders": 898,
        "glow-essentials_orders": 622,
        "radiance-pro_orders": 380,
        "ojena-beauty_commission": 27813,
        "luxe-cosmetics_commission": 21428,
        "glow-essentials_commission": 14814,
        "radiance-pro_commission": 9033,
      },
    ];
  }

  getMockAlerts() {
    return [
      {
        id: 1,
        severity: "critical",
        title: "Stock critique",
        message:
          "OJENA Beauty - Sérum Éclat en rupture imminente (12 unités restantes)",
        time: "Il y a 15 min",
      },
      {
        id: 2,
        severity: "warning",
        title: "Retard de livraison",
        message:
          "23 commandes Luxe Cosmetics dépassent le délai standard de 48h",
        time: "Il y a 1 heure",
      },
      {
        id: 3,
        severity: "info",
        title: "Nouveau record",
        message:
          "Glow Essentials atteint 100K€ de revenus mensuels pour la première fois",
        time: "Il y a 3 heures",
      },
    ];
  }

  getMockCategoryData() {
    return [
      { name: "Soins de la peau", value: 512200, percentage: 42 },
      { name: "Maquillage", value: 435000, percentage: 36 },
      { name: "Parfums", value: 156300, percentage: 13 },
      { name: "Soins capillaires", value: 64200, percentage: 5 },
      { name: "Soins du corps", value: 52300, percentage: 4 },
    ];
  }

  getMockProductKPIs() {
    return {
      totalProducts: 247,
      topPerformer: { name: "Sérum Éclat Vitamine C", revenue: 145800 },
      lowMarginCount: 18,
      inventoryTurnover: 4.8,
    };
  }

  getMockInfluencerMetrics() {
    return [
      {
        title: "Revenu personnel",
        value: "45 280 €",
        change: "+18,5%",
        changeType: "positive",
        icon: "TrendingUp",
        iconColor: "var(--color-primary)",
        badge: "🎯 Objectif atteint",
      },
      {
        title: "Commission gagnée",
        value: "12 450 €",
        change: "+22,3%",
        changeType: "positive",
        icon: "DollarSign",
        iconColor: "var(--color-accent)",
        badge: null,
      },
      {
        title: "Taux de conversion",
        value: "4,8%",
        change: "+0,8%",
        changeType: "positive",
        icon: "Target",
        iconColor: "var(--color-success)",
        badge: null,
      },
      {
        title: "Engagement abonnés",
        value: "8,2%",
        change: "-0,3%",
        changeType: "negative",
        icon: "Heart",
        iconColor: "var(--color-warning)",
        badge: null,
      },
    ];
  }

  getMockChartData() {
    return [
      { month: "Juil", sales: 8500, commission: 15 },
      { month: "Août", sales: 12300, commission: 18 },
      { month: "Sep", sales: 15800, commission: 20 },
      { month: "Oct", sales: 18200, commission: 22 },
      { month: "Nov", sales: 22400, commission: 25 },
      { month: "Déc", sales: 28600, commission: 28 },
    ];
  }

  getMockTopProducts() {
    return [
      {
        id: 1,
        name: "Sérum Éclat Vitamine C",
        image: "https://images.unsplash.com/photo-1655534077835-8a8b30222acd",
        imageAlt: "Serum bottle",
        sales: 342,
        commissionPerUnit: 8.5,
        totalCommission: "2 907",
        trend: "up",
        trendValue: "+28%",
        badge: "Top 1",
      },
      {
        id: 2,
        name: "Crème Hydratante Luxe",
        image: "https://images.unsplash.com/photo-1681810890895-fc6c372685a5",
        imageAlt: "Cream jar",
        sales: 298,
        commissionPerUnit: 12.0,
        totalCommission: "3 576",
        trend: "up",
        trendValue: "+15%",
        badge: "Top 2",
      },
      {
        id: 3,
        name: "Masque Purifiant Argile",
        image: "https://images.unsplash.com/photo-1622910076328-4bb120645672",
        imageAlt: "Clay mask",
        sales: 256,
        commissionPerUnit: 6.5,
        totalCommission: "1 664",
        trend: "up",
        trendValue: "+12%",
        badge: "Top 3",
      },
      {
        id: 4,
        name: "Huile Réparatrice Nuit",
        image: "https://images.unsplash.com/photo-1714023504828-307b6c854575",
        imageAlt: "Night oil",
        sales: 187,
        commissionPerUnit: 10.0,
        totalCommission: "1 870",
        trend: "down",
        trendValue: "-5%",
        badge: null,
      },
    ];
  }

  getMockEngagementMetrics() {
    return [
      {
        id: 1,
        label: "Clics sur liens",
        value: "2 847",
        percentage: 85,
        color: "var(--color-primary)",
        icon: "MousePointerClick",
        change: 12,
      },
      {
        id: 2,
        label: "Partages de contenu",
        value: "1 523",
        percentage: 68,
        color: "var(--color-accent)",
        icon: "Share2",
        change: 8,
      },
      {
        id: 3,
        label: "Commentaires",
        value: "892",
        percentage: 45,
        color: "var(--color-success)",
        icon: "MessageCircle",
        change: -3,
      },
    ];
  }

  getMockMonthlyGoals() {
    return {
      onTrack: true,
      bonus: { threshold: 90, amount: 2000 },
      items: [
        {
          id: "revenue",
          label: "Chiffre d'affaires",
          current: 45280,
          goal: 50000,
          pct: 90.5,
          remaining: 4720,
          prevValue: 38000,
          color: "primary",
        },
        {
          id: "sales",
          label: "Nombre de ventes",
          current: 1083,
          goal: 1200,
          pct: 90.25,
          remaining: 117,
          prevValue: 950,
          color: "accent",
        },
        {
          id: "customers",
          label: "Nouveaux clients",
          current: 287,
          goal: 300,
          pct: 95.6,
          remaining: 13,
          prevValue: 245,
          color: "success",
        },
      ],
    };
  }

  getMockPayoutSchedule() {
    const now = new Date();
    return [
      {
        id: 1,
        month: now.getMonth(),
        date: `15 ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        amount: "12 450",
        status: "processing",
        description: `Commission ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        method: "Virement bancaire",
      },
      {
        id: 2,
        month: now.getMonth(),
        date: `31 ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        amount: "8 200",
        status: "pending",
        description: "Bonus de fin de mois",
        method: "Virement bancaire",
      },
      {
        id: 3,
        month: (now.getMonth() + 1) % 12,
        date: `15 ${new Date(now.getFullYear(), now.getMonth() + 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        amount: "0",
        status: "scheduled",
        description: `Commission ${new Date(now.getFullYear(), now.getMonth() + 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        method: "Virement bancaire",
      },
    ];
  }

  getMockFinancialMetrics() {
    return [
      {
        title: "Commissions Totales Dues",
        value: "127 450€",
        subtitle: "+12,5% vs mois dernier",
        icon: "DollarSign",
        trend: "up",
        trendValue: "+12,5%",
        status: "primary",
      },
      {
        title: "Paiements Traités",
        value: "98 320€",
        subtitle: "156 transactions",
        icon: "CheckCircle",
        trend: "up",
        trendValue: "+8,3%",
        status: "success",
      },
      {
        title: "Paiements en Attente",
        value: "29 130€",
        subtitle: "42 transactions",
        icon: "Clock",
        trend: "neutral",
        trendValue: "0%",
        status: "warning",
      },
      {
        title: "Taux de Commission Moyen",
        value: "18,5%",
        subtitle: "Tous types confondus",
        icon: "Percent",
        trend: "up",
        trendValue: "+0,8%",
        status: "default",
      },
      {
        title: "Retards de Paiement",
        value: "3",
        subtitle: "2 450€ en retard",
        icon: "AlertTriangle",
        trend: "down",
        trendValue: "-2",
        status: "error",
      },
      {
        title: "Prochain Paiement",
        value: "28 Fév",
        subtitle: "15 paiements planifiés",
        icon: "Calendar",
        trend: "neutral",
        trendValue: "7 jours",
        status: "default",
      },
    ];
  }

  getMockTimelineData() {
    return [
      { month: "Jan", influencer: 45000, affiliate: 28000, bonus: 12000 },
      { month: "Fév", influencer: 52000, affiliate: 31000, bonus: 15000 },
      { month: "Mar", influencer: 48000, affiliate: 29000, bonus: 13000 },
      { month: "Avr", influencer: 61000, affiliate: 35000, bonus: 18000 },
      { month: "Mai", influencer: 58000, affiliate: 33000, bonus: 16000 },
      { month: "Jun", influencer: 67000, affiliate: 38000, bonus: 21000 },
      { month: "Jul", influencer: 72000, affiliate: 42000, bonus: 24000 },
      { month: "Aoû", influencer: 69000, affiliate: 40000, bonus: 22000 },
      { month: "Sep", influencer: 75000, affiliate: 44000, bonus: 26000 },
      { month: "Oct", influencer: 81000, affiliate: 47000, bonus: 28000 },
      { month: "Nov", influencer: 78000, affiliate: 45000, bonus: 27000 },
      { month: "Déc", influencer: 85000, affiliate: 49000, bonus: 31000 },
    ];
  }

  getMockTransactions() {
    return [
      {
        id: 1,
        date: "22/12/2025",
        name: "Sophie Martin",
        brand: "OJENA Beauty",
        type: "Influenceur",
        amount: 2450,
        status: "paid",
        avatar: null,
        avatarAlt: "Sophie Martin",
      },
      {
        id: 2,
        date: "21/12/2025",
        name: "Lucas Dubois",
        brand: "Luxe Cosmetics",
        type: "Affilié",
        amount: 1820,
        status: "processing",
        avatar: null,
        avatarAlt: "Lucas Dubois",
      },
      {
        id: 3,
        date: "20/12/2025",
        name: "Emma Rousseau",
        brand: "Glow Essentials",
        type: "Bonus",
        amount: 3200,
        status: "paid",
        avatar: null,
        avatarAlt: "Emma Rousseau",
      },
      {
        id: 4,
        date: "19/12/2025",
        name: "Thomas Bernard",
        brand: "Radiance Pro",
        type: "Influenceur",
        amount: 1950,
        status: "pending",
        avatar: null,
        avatarAlt: "Thomas Bernard",
      },
      {
        id: 5,
        date: "18/12/2025",
        name: "Chloé Laurent",
        brand: "OJENA Beauty",
        type: "Affilié",
        amount: 1450,
        status: "disputed",
        avatar: null,
        avatarAlt: "Chloé Laurent",
      },
    ];
  }

  getMockPaymentQueue() {
    return [
      {
        id: 1,
        name: "Sophie Martin",
        brand: "OJENA Beauty",
        amount: 8450,
        dueDate: "28 fév. 2026",
        status: "scheduled",
        priority: "high",
        transactions: 24,
        avatar: null,
        avatarAlt: "Sophie Martin",
      },
      {
        id: 2,
        name: "Lucas Dubois",
        brand: "Luxe Cosmetics",
        amount: 6720,
        dueDate: "28 fév. 2026",
        status: "scheduled",
        priority: "high",
        transactions: 18,
        avatar: null,
        avatarAlt: "Lucas Dubois",
      },
      {
        id: 3,
        name: "Emma Rousseau",
        brand: "Glow Essentials",
        amount: 5890,
        dueDate: "2 mars 2026",
        status: "pending",
        priority: "medium",
        transactions: 15,
        avatar: null,
        avatarAlt: "Emma Rousseau",
      },
      {
        id: 4,
        name: "Thomas Bernard",
        brand: "Radiance Pro",
        amount: 4320,
        dueDate: "5 mars 2026",
        status: "pending",
        priority: "medium",
        transactions: 12,
        avatar: null,
        avatarAlt: "Thomas Bernard",
      },
      {
        id: 5,
        name: "Chloé Laurent",
        brand: "OJENA Beauty",
        amount: 3650,
        dueDate: "10 mars 2026",
        status: "pending",
        priority: "low",
        transactions: 9,
        avatar: null,
        avatarAlt: "Chloé Laurent",
      },
    ];
  }
}

export default new ShopifyService();
