import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import Icon from '../../../components/AppIcon';

const MarginVolumeScatter = ({ scatterData }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-soft-md">
          <p className="text-sm font-semibold text-foreground mb-2">{data?.name}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Marge: <span className="font-medium text-foreground">{data?.margin}%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Volume: <span className="font-medium text-foreground">{data?.volume?.toLocaleString('fr-FR')}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Revenu: <span className="font-medium text-foreground">{data?.revenue?.toLocaleString('fr-FR')} €</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="ScatterChart" size={20} className="text-primary" />
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Corrélation Marge vs Volume
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Taille = Revenu</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            type="number"
            dataKey="volume"
            name="Volume"
            label={{ value: 'Unités vendues', position: 'insideBottom', offset: -10 }}
            stroke="var(--color-muted-foreground)"
          />
          <YAxis
            type="number"
            dataKey="margin"
            name="Marge"
            label={{ value: 'Marge (%)', angle: -90, position: 'insideLeft' }}
            stroke="var(--color-muted-foreground)"
          />
          <ZAxis type="number" dataKey="revenue" range={[100, 1000]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            name="Produits"
            data={scatterData}
            fill="var(--color-primary)"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Marge moyenne</p>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {(scatterData?.reduce((sum, p) => sum + p?.margin, 0) / scatterData?.length)?.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Volume moyen</p>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              {Math.round(scatterData?.reduce((sum, p) => sum + p?.volume, 0) / scatterData?.length)?.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Corrélation</p>
            <p className="text-lg md:text-xl font-semibold text-success">
              Positive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginVolumeScatter;