import React from 'react';
import Icon from '../../../components/AppIcon';


const QuickActions = () => {
  const actions = [
    {
      id: 1,
      title: 'Télécharger le rapport',
      description: 'Rapport mensuel complet',
      icon: 'Download',
      iconColor: 'var(--color-primary)',
      action: () => console.log('Download report')
    },
    {
      id: 2,
      title: 'Partager les résultats',
      description: 'Sur les réseaux sociaux',
      icon: 'Share2',
      iconColor: 'var(--color-accent)',
      action: () => console.log('Share results')
    },
    {
      id: 3,
      title: 'Voir les produits',
      description: 'Catalogue complet',
      icon: 'Package',
      iconColor: 'var(--color-success)',
      action: () => console.log('View products')
    },
    {
      id: 4,
      title: 'Support',
      description: 'Contactez-nous',
      icon: 'MessageCircle',
      iconColor: 'var(--color-warning)',
      action: () => console.log('Contact support')
    }
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
      <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions?.map((action) => (
          <button
            key={action?.id}
            onClick={action?.action}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${action?.iconColor}15` }}
            >
              <Icon name={action?.icon} size={20} color={action?.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">
                {action?.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {action?.description}
              </p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;