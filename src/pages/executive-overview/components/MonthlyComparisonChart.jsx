import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const MonthlyComparisonChart = ({ data, brands }) => {
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const metrics = [
    { id: 'revenue', label: 'Revenus', icon: 'DollarSign' },
    { id: 'orders', label: 'Commandes', icon: 'ShoppingCart' },
    { id: 'commission', label: 'Commissions', icon: 'Percent' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-soft-md">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry?.fill }}
                />
                <span className="text-muted-foreground">{entry?.name}</span>
              </div>
              <span className="font-medium text-foreground">
                {selectedMetric === 'revenue' || selectedMetric === 'commission' 
                  ? `${entry?.value?.toLocaleString('fr-FR')} €`
                  : entry?.value?.toLocaleString('fr-FR')
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
            Comparaison mensuelle
          </h3>
          <p className="text-sm text-muted-foreground">
            Performance détaillée par marque
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {metrics?.map((metric) => (
            <button
              key={metric?.id}
              onClick={() => setSelectedMetric(metric?.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedMetric === metric?.id
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <Icon name={metric?.icon} size={14} />
              <span className="hidden sm:inline">{metric?.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-64 md:h-80" aria-label="Graphique de comparaison mensuelle">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => 
                selectedMetric === 'revenue' || selectedMetric === 'commission'
                  ? `${(value / 1000)?.toFixed(0)}K`
                  : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {brands?.map((brand) => (
              <Bar
                key={brand?.id}
                dataKey={`${brand?.id}_${selectedMetric}`}
                name={brand?.name}
                fill={brand?.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="Filter" size={14} />
          Filtrer
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors">
          <Icon name="Download" size={14} />
          Exporter
        </button>
      </div>
    </div>
  );
};

export default MonthlyComparisonChart;