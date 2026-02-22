import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const BrandRankingTable = ({ brands }) => {
  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
            Classement des marques
          </h3>
          <p className="text-sm text-muted-foreground">
            Performance par contribution
          </p>
        </div>
        <button className="p-2 rounded-md text-muted-foreground hover:bg-muted/30 transition-colors" title="Actualiser">
          <Icon name="RefreshCw" size={18} />
        </button>
      </div>
      <div className="space-y-3">
        {brands?.map((brand, index) => (
          <div 
            key={brand?.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
              {index + 1}
            </div>
            
            <Image 
              src={brand?.logo}
              alt={brand?.logoAlt}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {brand?.name}
                </h4>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {brand?.revenue?.toLocaleString('fr-FR')} €
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${brand?.contribution}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {brand?.contribution}%
                </span>
              </div>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md flex-shrink-0 ${
              brand?.growth >= 0 ? 'bg-success/10' : 'bg-error/10'
            }`}>
              <Icon 
                name={brand?.growth >= 0 ? 'TrendingUp' : 'TrendingDown'} 
                size={12} 
                color={brand?.growth >= 0 ? 'var(--color-success)' : 'var(--color-error)'}
              />
              <span className={`text-xs font-medium ${
                brand?.growth >= 0 ? 'text-success' : 'text-error'
              }`}>
                {Math.abs(brand?.growth)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors">
        Voir toutes les marques
      </button>
    </div>
  );
};

export default BrandRankingTable;