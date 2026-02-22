import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const CategoryPerformanceChart = ({ categoryData }) => {
  const COLORS = [
    'var(--color-primary)',
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-secondary)'
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-soft-md">
          <p className="text-sm font-semibold text-foreground mb-1">{data?.name}</p>
          <p className="text-xs text-muted-foreground">
            Revenu: {data?.value?.toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-muted-foreground">
            Part: {data?.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="space-y-2 mt-4">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry?.color }}
              />
              <span className="text-xs md:text-sm text-foreground">{entry?.value}</span>
            </div>
            <span className="text-xs md:text-sm font-semibold text-foreground">
              {entry?.payload?.percentage}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <Icon name="PieChart" size={20} className="text-primary" />
        <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
          Performance par Catégorie
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {categoryData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Catégorie leader</p>
            <p className="text-sm md:text-base font-semibold text-foreground">
              {categoryData?.[0]?.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revenu total</p>
            <p className="text-sm md:text-base font-semibold text-foreground">
              {categoryData?.reduce((sum, cat) => sum + cat?.value, 0)?.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPerformanceChart;