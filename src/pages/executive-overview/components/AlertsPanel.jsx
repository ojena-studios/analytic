import React from 'react';
import Icon from '../../../components/AppIcon';

const AlertsPanel = ({ alerts }) => {
  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-error/10',
          text: 'text-error',
          icon: 'AlertCircle',
          iconColor: 'var(--color-error)'
        };
      case 'warning':
        return {
          bg: 'bg-warning/10',
          text: 'text-warning',
          icon: 'AlertTriangle',
          iconColor: 'var(--color-warning)'
        };
      case 'info':
        return {
          bg: 'bg-primary/10',
          text: 'text-primary',
          icon: 'Info',
          iconColor: 'var(--color-primary)'
        };
      default:
        return {
          bg: 'bg-muted/30',
          text: 'text-muted-foreground',
          icon: 'Bell',
          iconColor: 'var(--color-muted-foreground)'
        };
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Alertes système
        </h3>
        <button className="text-sm text-primary hover:underline font-medium">
          Tout voir
        </button>
      </div>
      <div className="space-y-3">
        {alerts?.map((alert) => {
          const style = getAlertStyle(alert?.severity);
          return (
            <div 
              key={alert?.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${style?.bg} hover:opacity-80 transition-opacity cursor-pointer`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon name={style?.icon} size={18} color={style?.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${style?.text} mb-1`}>
                  {alert?.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {alert?.message}
                </p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {alert?.time}
                </span>
              </div>
              <button className="flex-shrink-0 p-1 hover:bg-background/50 rounded transition-colors">
                <Icon name="X" size={14} className="text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;