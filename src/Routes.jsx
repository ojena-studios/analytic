import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import InfluencerPerformance from './pages/influencer-performance';
import ExecutiveOverview from './pages/executive-overview';
import RevenueCommissionCenter from './pages/revenue-commission-center';
import ProductAnalyticsHub from './pages/product-analytics-hub';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<ExecutiveOverview />} />
        <Route path="/influencer-performance" element={<InfluencerPerformance />} />
        <Route path="/executive-overview" element={<ExecutiveOverview />} />
        <Route path="/revenue-commission-center" element={<RevenueCommissionCenter />} />
        <Route path="/product-analytics-hub" element={<ProductAnalyticsHub />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
