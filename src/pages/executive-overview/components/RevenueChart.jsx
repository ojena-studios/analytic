import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const RevenueChart = ({ data, brands }) => {
  const [visibleBrands, setVisibleBrands] = useState(brands?.map(b => b?.id));
  const [chartType, setChartType] = useState('line');

  const toggleBrand = (brandId) => {
    setVisibleBrands(prev => 
      prev?.includes(brandId) 
        ? prev?.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

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
                  style={{ backgroundColor: entry?.color }}
                />
                <span className="text-muted-foreground">{entry?.name}</span>
              </div>
              <span className="font-medium text-foreground">{entry?.value?.toLocaleString('fr-FR')} €</span>
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
            Performance des revenus
          </h3>
          <p className="text-sm text-muted-foreground">
            Évolution comparative par marque
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-md transition-colors ${
              chartType === 'line' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
            }`}
            title="Vue linéaire"
          >
            <Icon name="LineChart" size={18} />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-md transition-colors ${
              chartType === 'area' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
            }`}
            title="Vue en aires"
          >
            <Icon name="AreaChart" size={18} />
          </button>
          <button className="p-2 rounded-md text-muted-foreground hover:bg-muted/30 transition-colors" title="Exporter">
            <Icon name="Download" size={18} />
          </button>
        </div>
      </div>
      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Graphique de performance des revenus">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000)?.toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              onClick={(e) => toggleBrand(e?.dataKey)}
            />
            {brands?.map((brand, index) => (
              visibleBrands?.includes(brand?.id) && (
                <Line
                  key={brand?.id}
                  type="monotone"
                  dataKey={brand?.id}
                  name={brand?.name}
                  stroke={brand?.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
        {brands?.map((brand) => (
          <button
            key={brand?.id}
            onClick={() => toggleBrand(brand?.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              visibleBrands?.includes(brand?.id)
                ? 'bg-primary/10 text-primary' :'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: brand?.color }}
            />
            {brand?.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;