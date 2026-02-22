import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import MetricCard from "./components/MetricCard";
import PerformanceChart from "./components/PerformanceChart";
import ProductPerformanceCard from "./components/ProductPerformanceCard";
import CommissionCalendar from "./components/CommissionCalendar";
import QuickActions from "./components/QuickActions";
import EngagementMetrics from "./components/EngagementMetrics";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import shopifyService from "../../services/shopifyService";

const InfluencerPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [payoutSchedule, setPayoutSchedule] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [monthlyGoals, setMonthlyGoals] = useState(null);

  useEffect(() => {
    fetchShopifyData().finally(() => setLoading(false));

    const interval = setInterval(fetchShopifyData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchShopifyData = async () => {
    try {
      const [metrics, chart, products, payouts, engagement, goals] =
        await Promise.all([
          shopifyService.fetchInfluencerMetrics(),
          shopifyService.fetchPerformanceChart(),
          shopifyService.fetchTopProducts(),
          shopifyService.fetchPayoutSchedule(),
          shopifyService.fetchEngagementMetrics(),
          shopifyService.fetchMonthlyGoals(),
        ]);
      setKeyMetrics(metrics);
      setChartData(chart);
      setTopProducts(products);
      setPayoutSchedule(payouts);
      setEngagementData(engagement);
      setMonthlyGoals(goals);
    } catch (error) {
      console.error("Error fetching Shopify data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShopifyData();
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Performance Influenceur - OJENA Studios Analytics</title>
        <meta
          name="description"
          content="Tableau de bord personnel pour suivre vos performances de vente, commissions et engagement des abonnés"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Tableau de bord personnel
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Suivez vos performances et vos commissions en temps réel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={handleRefresh}
                loading={refreshing}
                className="whitespace-nowrap"
              >
                Actualiser
              </Button>
              <Button
                variant="default"
                iconName="Download"
                iconPosition="left"
                className="whitespace-nowrap"
              >
                Exporter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {keyMetrics?.map((metric, index) => (
              <MetricCard key={index} {...metric} loading={loading} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <PerformanceChart data={chartData} loading={loading} />
            </div>
            <div className="space-y-4 md:space-y-6">
              <EngagementMetrics metrics={engagementData} loading={loading} />
              <QuickActions />
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                  Produits les plus performants
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Vos meilleures ventes du mois
                </p>
              </div>
              <Button
                variant="ghost"
                iconName="ArrowRight"
                iconPosition="right"
              >
                Voir tout
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {topProducts?.map((product) => (
                <ProductPerformanceCard
                  key={product?.id}
                  product={product}
                  loading={loading}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <CommissionCalendar payouts={payoutSchedule} loading={loading} />

            <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                    Objectifs du mois
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Progression vers vos objectifs
                  </p>
                </div>
                <Icon name="Target" size={24} color="var(--color-accent)" />
              </div>

              <div className="space-y-6">
                {monthlyGoals?.items?.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className={`text-sm font-bold text-${item.color}`}>
                        {item.id === "revenue"
                          ? `${item.current.toLocaleString("fr-FR")}€ / ${item.goal.toLocaleString("fr-FR")}€`
                          : `${item.current.toLocaleString("fr-FR")} / ${item.goal.toLocaleString("fr-FR")}`}
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full bg-${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.pct}% atteint — Il reste{" "}
                      {item.id === "revenue"
                        ? `${item.remaining.toLocaleString("fr-FR")}€`
                        : `${item.remaining.toLocaleString("fr-FR")} ${item.id === "customers" ? "clients" : "ventes"}`}
                    </p>
                  </div>
                ))}
              </div>

              {monthlyGoals?.onTrack && (
                <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="Trophy"
                      size={20}
                      color="var(--color-accent)"
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Vous êtes sur la bonne voie ! 🎉
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Continuez comme ça pour débloquer le bonus de{" "}
                        {monthlyGoals.bonus.amount.toLocaleString("fr-FR")}€ en
                        fin de mois
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon
                    name="Sparkles"
                    size={24}
                    color="var(--color-primary)"
                  />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
                    Prochaine mise à jour dans 3h 24min
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Les données sont actualisées toutes les 4 heures pour vous
                    offrir les informations les plus récentes
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                iconName="Bell"
                iconPosition="left"
                className="whitespace-nowrap"
              >
                Me notifier
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default InfluencerPerformance;
