import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import KPISummaryCards from "./components/KPISummaryCards";
import ProductFilters from "./components/ProductFilters";
import ProductPerformanceTable from "./components/ProductPerformanceTable";
import CategoryPerformanceChart from "./components/CategoryPerformanceChart";
import MarginVolumeScatter from "./components/MarginVolumeScatter";
import ComparisonModal from "./components/ComparisonModal";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import shopifyService from "../../services/shopifyService";

const ProductAnalyticsHub = () => {
  const [viewMode, setViewMode] = useState("table");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    status: "all",
    marginRange: "all",
    performance: "all",
    searchQuery: "",
    minRevenue: "",
    maxRevenue: "",
  });
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalProducts: 0,
    topPerformer: { name: "—", revenue: 0 },
    lowMarginCount: 0,
    inventoryTurnover: 0,
  });

  useEffect(() => {
    fetchShopifyProducts();

    const interval = setInterval(() => {
      fetchShopifyProducts();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchShopifyProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const [shopifyProducts, kpis, categories] = await Promise.all([
        shopifyService.fetchProducts(),
        shopifyService.fetchProductKPIs(),
        shopifyService.fetchCategoryData(),
      ]);
      setProducts(shopifyProducts);
      setKpiData(kpis);
      setCategoryData(categories);
    } catch (error) {
      console.error("Error fetching Shopify products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const scatterData = products?.map((p) => ({
    name: p?.name,
    margin: p?.profitMargin,
    volume: p?.unitsSold,
    revenue: p?.revenue,
  }));

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
  };

  const handleStatusChange = (productId, currentStatus) => {
    console.log(
      `Changing status for product ${productId} from ${currentStatus}`,
    );
  };

  const handleCompare = (productIds) => {
    const selectedProducts = products?.filter((p) =>
      productIds?.includes(p?.id),
    );
    setComparisonProducts(selectedProducts);
    setShowComparison(true);
  };

  console.log({
    products,
    kpiData,
    categoryData,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Hub Analytique Produits
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Surveillance complète des performances produits avec analyse de
                marge avancée
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                iconName="Table"
                onClick={() => setViewMode("table")}
              >
                <span className="hidden sm:inline">Tableau</span>
              </Button>
              <Button
                variant={viewMode === "scatter" ? "default" : "outline"}
                size="sm"
                iconName="ScatterChart"
                onClick={() => setViewMode("scatter")}
              >
                <span className="hidden sm:inline">Graphique</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Clock" size={16} />
            <span>
              Dernière mise à jour:{" "}
              {new Date()?.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <KPISummaryCards kpiData={kpiData} />

          <ProductFilters
            onFilterChange={handleFilterChange}
            activeFilters={activeFilters}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              {viewMode === "table" ? (
                <ProductPerformanceTable
                  products={products}
                  onStatusChange={handleStatusChange}
                  onCompare={handleCompare}
                />
              ) : (
                <MarginVolumeScatter scatterData={scatterData} />
              )}
            </div>

            <div className="lg:col-span-4">
              <CategoryPerformanceChart categoryData={categoryData} />
            </div>
          </div>
        </div>
      </main>
      {showComparison && (
        <ComparisonModal
          products={comparisonProducts}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default ProductAnalyticsHub;
