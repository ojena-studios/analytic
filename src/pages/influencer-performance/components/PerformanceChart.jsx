import React, { useState } from 'react';
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import Icon from '../../../components/AppIcon';

const PerformanceChart = ({ data, loading = false }) => {
  const [chartType, setChartType] = useState('combined');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-soft-md">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-muted-foreground">{entry?.name}:</span>
              <span className="font-semibold" style={{ color: entry?.color }}>
                {entry?.name === 'Taux de commission' ? `${entry?.value}%` : `${entry?.value}€`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 md:h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Performance des ventes
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Évolution du chiffre d'affaires et des commissions
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
          <button
            onClick={() => setChartType('combined')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              chartType === 'combined' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="BarChart3" size={14} className="inline mr-1" />
            Combiné
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              chartType === 'line' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="LineChart" size={14} className="inline mr-1" />
            Ligne
          </button>
        </div>
      </div>

      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Graphique de performance des ventes">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'combined' ? (
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                stroke="var(--color-border)"
                label={{ value: 'Ventes (€)', angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                stroke="var(--color-border)"
                label={{ value: 'Commission (%)', angle: 90, position: 'insideRight', fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar 
                yAxisId="left"
                dataKey="sales" 
                name="Ventes" 
                fill="var(--color-primary)" 
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="commission" 
                name="Taux de commission" 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
              <YAxis 
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                name="Ventes" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary)', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="commission" 
                name="Taux de commission" 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;