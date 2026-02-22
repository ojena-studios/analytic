import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ title, value, change, changeType, sparklineData, icon, iconColor }) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';
  
  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground">
            {value}
          </h3>
        </div>
        <div 
          className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon name={icon} size={20} color={iconColor} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
            isPositive ? 'bg-success/10' : isNegative ? 'bg-error/10' : 'bg-muted/30'
          }`}>
            <Icon 
              name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} 
              size={14} 
              color={isPositive ? 'var(--color-success)' : isNegative ? 'var(--color-error)' : 'var(--color-muted-foreground)'}
            />
            <span className={`text-xs font-medium ${
              isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-muted-foreground'
            }`}>
              {change}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">vs période précédente</span>
        </div>
        
        {sparklineData && (
          <div className="flex items-end gap-0.5 h-6">
            {sparklineData?.map((value, index) => (
              <div
                key={index}
                className="w-1 bg-primary/30 rounded-t transition-all hover:bg-primary"
                style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;