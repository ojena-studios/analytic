import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const ProductPerformanceCard = ({ product, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 border border-border shadow-soft-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border shadow-soft-sm hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] group">
      <div className="relative overflow-hidden aspect-[3/4]">
        <Image 
          src={product?.image} 
          alt={product?.imageAlt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {product?.badge && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-sm">
            {product?.badge}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4">
        <h4 className="text-sm md:text-base font-heading font-semibold text-foreground mb-2 line-clamp-2">
          {product?.name}
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ventes</span>
            <span className="text-sm font-semibold text-foreground">{product?.sales}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Commission/unité</span>
            <span className="text-sm font-semibold text-accent">{product?.commissionPerUnit}€</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">Total commission</span>
            <span className="text-base font-bold text-primary">{product?.totalCommission}€</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-1">
          <Icon 
            name={product?.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} 
            size={14} 
            className={product?.trend === 'up' ? 'text-success' : 'text-error'}
          />
          <span className={`text-xs font-medium ${product?.trend === 'up' ? 'text-success' : 'text-error'}`}>
            {product?.trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs mois dernier</span>
        </div>
      </div>
    </div>
  );
};

export default ProductPerformanceCard;