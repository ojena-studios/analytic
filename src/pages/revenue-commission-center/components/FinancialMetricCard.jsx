import React from 'react';
import Icon from '../../../components/AppIcon';

const FinancialMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  status = 'default',
  loading = false 
}) => {
  const statusColors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${statusColors?.[status]}`}>
          <Icon name={icon} size={20} className="md:w-6 md:h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColors?.[trend]}`}>
            <Icon 
              name={trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus'} 
              size={16} 
            />
            <span className="text-xs md:text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="space-y-1 md:space-y-2">
        <p className="text-xs md:text-sm text-muted-foreground font-medium">{title}</p>
        {loading ? (
          <div className="h-8 md:h-10 bg-muted/30 rounded animate-pulse" />
        ) : (
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
            {value}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default FinancialMetricCard;