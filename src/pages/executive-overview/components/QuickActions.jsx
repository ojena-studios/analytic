import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActions = () => {
  const actions = [
    {
      id: 'export-report',
      label: 'Exporter rapport',
      icon: 'FileDown',
      color: 'var(--color-primary)',
      bgColor: 'var(--color-primary)'
    },
    {
      id: 'schedule-meeting',
      label: 'Planifier réunion',
      icon: 'Calendar',
      color: 'var(--color-accent)',
      bgColor: 'var(--color-accent)'
    },
    {
      id: 'view-alerts',
      label: 'Alertes critiques',
      icon: 'AlertCircle',
      color: 'var(--color-warning)',
      bgColor: 'var(--color-warning)',
      badge: 3
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'Settings',
      color: 'var(--color-muted-foreground)',
      bgColor: 'var(--color-muted-foreground)'
    }
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions?.map((action) => (
          <button
            key={action?.id}
            className="relative flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/30 transition-all duration-200 hover:scale-[1.02] group"
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: `${action?.bgColor}15` }}
            >
              <Icon name={action?.icon} size={20} color={action?.color} />
            </div>
            <span className="text-xs font-medium text-foreground text-center">
              {action?.label}
            </span>
            {action?.badge && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-error text-error-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {action?.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;