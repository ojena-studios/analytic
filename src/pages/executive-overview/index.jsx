import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import MetricCard from "./components/MetricCard";
import RevenueChart from "./components/RevenueChart";
import BrandRankingTable from "./components/BrandRankingTable";
import MonthlyComparisonChart from "./components/MonthlyComparisonChart";
import QuickActions from "./components/QuickActions";
import AlertsPanel from "./components/AlertsPanel";
import shopifyService from "../../services/shopifyService";

const ExecutiveOverview = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoadingShopify, setIsLoadingShopify] = useState(false);

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      fetchAllData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setIsLoadingShopify(true);
    try {
      const [kpis, brandsData, monthlyData, alertsData] = await Promise.all([
        shopifyService.fetchExecutiveKPIs(),
        shopifyService.fetchBrandsRevenue(),
        shopifyService.fetchMonthlyComparison(),
        shopifyService.fetchAlerts(),
      ]);

      const brandsGrowingCount =
        brandsData?.brands?.filter((b) => b.growth > 0).length ?? 3;

      // Injecter la valeur "Croissance marques" calculée depuis brandsData
      const enrichedKpis = kpis.map((kpi) =>
        kpi.title === "Croissance marques"
          ? { ...kpi, value: `+${brandsGrowingCount}/4` }
          : kpi,
      );

      setKpiData(enrichedKpis);
      setBrands(brandsData?.brands ?? []);
      setRevenueChartData(brandsData?.revenueChartData ?? []);
      setMonthlyComparisonData(monthlyData ?? []);
      setAlerts(alertsData ?? []);
    } catch (error) {
      console.error("Error fetching executive data:", error);
    } finally {
      setIsLoadingShopify(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-2">
              Vue d'ensemble exécutive
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Dernière mise à jour :{" "}
              {lastUpdate?.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <MetricCard key={i} loading />
              ))
            : kpiData?.map((kpi, index) => <MetricCard key={index} {...kpi} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="lg:col-span-8">
            <RevenueChart data={revenueChartData} brands={brands} />
          </div>
          <div className="lg:col-span-4">
            <BrandRankingTable brands={brands} />
          </div>
        </div>

        <div className="mb-6 md:mb-8">
          <MonthlyComparisonChart
            data={monthlyComparisonData}
            brands={brands}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="lg:col-span-4">
            <QuickActions />
          </div>
          <div className="lg:col-span-8">
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveOverview;
