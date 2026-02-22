import React from 'react';
import Icon from '../../../components/AppIcon';

const KPISummaryCards = ({ kpiData }) => {
  const cards = [
    {
      id: 'total-products',
      title: 'Produits Actifs',
      value: kpiData?.totalProducts,
      change: '+12',
      changeType: 'positive',
      icon: 'Package',
      iconBg: 'bg-primary/10',
      iconColor: 'var(--color-primary)',
      sparkline: [45, 52, 48, 61, 58, 67, 72]
    },
    {
      id: 'top-performer',
      title: 'Meilleure Vente',
      value: kpiData?.topPerformer?.name,
      subtitle: `${kpiData?.topPerformer?.revenue?.toLocaleString('fr-FR')} €`,
      change: '+28%',
      changeType: 'positive',
      icon: 'TrendingUp',
      iconBg: 'bg-success/10',
      iconColor: 'var(--color-success)',
      sparkline: [30, 35, 42, 48, 55, 62, 70]
    },
    {
      id: 'low-margin',
      title: 'Alerte Marge Faible',
      value: kpiData?.lowMarginCount,
      subtitle: 'Produits < 30%',
      change: '-3',
      changeType: 'negative',
      icon: 'AlertTriangle',
      iconBg: 'bg-warning/10',
      iconColor: 'var(--color-warning)',
      sparkline: [15, 18, 16, 14, 12, 10, 8]
    },
    {
      id: 'inventory-turnover',
      title: 'Rotation Stock',
      value: `${kpiData?.inventoryTurnover}x`,
      subtitle: 'Par mois',
      change: '+0.8',
      changeType: 'positive',
      icon: 'RefreshCw',
      iconBg: 'bg-accent/10',
      iconColor: 'var(--color-accent)',
      sparkline: [3.2, 3.5, 3.8, 4.1, 4.3, 4.6, 4.8]
    }
  ];

  const renderSparkline = (data) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
        <polyline
          points={data?.map((value, index) => {
            const x = (index / (data?.length - 1)) * 100;
            const y = 20 - ((value - min) / range) * 20;
            return `${x},${y}`;
          })?.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary/40"
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards?.map((card) => (
        <div
          key={card?.id}
          className="bg-card rounded-lg p-4 md:p-6 border border-border hover:shadow-soft-md transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${card?.iconBg} flex items-center justify-center`}>
              <Icon name={card?.icon} size={20} color={card?.iconColor} />
            </div>
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${card?.changeType === 'positive' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
            `}>
              <Icon 
                name={card?.changeType === 'positive' ? 'TrendingUp' : 'TrendingDown'} 
                size={12} 
              />
              <span>{card?.change}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-xs md:text-sm text-muted-foreground mb-1">{card?.title}</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
              {card?.value}
            </p>
            {card?.subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{card?.subtitle}</p>
            )}
          </div>
          
          <div className="mt-3 md:mt-4">
            {renderSparkline(card?.sparkline)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPISummaryCards;