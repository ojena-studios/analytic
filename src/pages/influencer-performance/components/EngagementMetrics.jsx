import React from 'react';
import Icon from '../../../components/AppIcon';

const EngagementMetrics = ({ metrics, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3]?.map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
      <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
        Engagement des abonnés
      </h3>
      <div className="space-y-4">
        {metrics?.map((metric) => (
          <div key={metric?.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={metric?.icon} size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{metric?.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{metric?.value}</span>
            </div>
            
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${metric?.percentage}%`,
                  backgroundColor: metric?.color 
                }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{metric?.percentage}% de l'objectif</span>
              <span className={metric?.change >= 0 ? 'text-success' : 'text-error'}>
                {metric?.change >= 0 ? '+' : ''}{metric?.change}% ce mois
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngagementMetrics;