import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  iconColor, 
  badge,
  loading = false 
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-foreground">
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
        <div className="flex items-center gap-1">
          <Icon name={getChangeIcon()} size={14} className={getChangeColor()} />
          <span className={`text-xs md:text-sm font-medium ${getChangeColor()}`}>
            {change}
          </span>
        </div>
        {badge && (
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;