import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import FinancialMetricCard from "./components/FinancialMetricCard";
import CommissionTimelineChart from "./components/CommissionTimelineChart";
import PaymentQueueCard from "./components/PaymentQueueCard";
import CommissionDetailsTable from "./components/CommissionDetailsTable";
import FilterBar from "./components/FilterBar";
import shopifyService from "../../services/shopifyService";

const RevenueCommissionCenter = () => {
  const [filters, setFilters] = useState({
    commissionType: "all",
    paymentStatus: "all",
    period: "month",
  });

  const [financialMetrics, setFinancialMetrics] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [metrics, timeline, queue, transactions] = await Promise.all([
        shopifyService.fetchRevenueMetrics(),
        shopifyService.fetchCommissionTimeline(),
        shopifyService.fetchPaymentQueue(),
        shopifyService.fetchCommissionTransactions(),
      ]);
      setFinancialMetrics(metrics);
      setTimelineData(timeline);
      setUpcomingPayments(queue);
      setCommissionTransactions(transactions);
      setLoading(false);
    };
    load();
  }, []);

  // Re-filtre les transactions côté client quand les filtres changent
  useEffect(() => {
    if (loading) return;
    shopifyService
      .fetchCommissionTransactions(filters)
      .then(setCommissionTransactions);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Helmet>
        <title>Centre de Commissions & Revenus - OJENA Studios Analytics</title>
        <meta
          name="description"
          content="Gestion complète des commissions et paiements pour les marques de beauté OJENA Studios. Suivi en temps réel des transactions, planification des paiements et analyse financière."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Centre de Commissions & Revenus
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestion financière et suivi des paiements multi-marques
            </p>
          </div>

          <FilterBar onFilterChange={handleFilterChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
            {financialMetrics?.map((metric, index) => (
              <FinancialMetricCard key={index} {...metric} loading={loading} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <CommissionTimelineChart data={timelineData} />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6 h-full">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      File d'Attente des Paiements
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {upcomingPayments?.length} paiements à venir
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {upcomingPayments?.map((payment) => (
                    <PaymentQueueCard key={payment?.id} payment={payment} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <CommissionDetailsTable transactions={commissionTransactions} />
        </main>
      </div>
    </>
  );
};

export default RevenueCommissionCenter;
