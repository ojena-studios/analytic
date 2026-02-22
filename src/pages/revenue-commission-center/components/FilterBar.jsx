import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FilterBar = ({ onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState({
    commissionType: 'all',
    paymentStatus: 'all',
    period: 'month'
  });

  const commissionTypes = [
    { id: 'all', label: 'Tous les types', icon: 'Layers' },
    { id: 'influencer', label: 'Influenceur', icon: 'Users' },
    { id: 'affiliate', label: 'Affilié', icon: 'Link' },
    { id: 'bonus', label: 'Bonus', icon: 'Gift' }
  ];

  const paymentStatuses = [
    { id: 'all', label: 'Tous les statuts', icon: 'Filter' },
    { id: 'paid', label: 'Payé', icon: 'CheckCircle' },
    { id: 'pending', label: 'En attente', icon: 'Clock' },
    { id: 'processing', label: 'En cours', icon: 'Loader' },
    { id: 'disputed', label: 'Contesté', icon: 'AlertTriangle' }
  ];

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon name="Filter" size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtres:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {commissionTypes?.map((type) => (
              <button
                key={type?.id}
                onClick={() => handleFilterChange('commissionType', type?.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${activeFilters?.commissionType === type?.id
                    ? 'bg-primary text-primary-foreground shadow-soft-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon name={type?.icon} size={14} />
                {type?.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border hidden lg:block" />

          <div className="flex flex-wrap items-center gap-2">
            {paymentStatuses?.map((status) => (
              <button
                key={status?.id}
                onClick={() => handleFilterChange('paymentStatus', status?.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${activeFilters?.paymentStatus === status?.id
                    ? 'bg-accent text-accent-foreground shadow-soft-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon name={status?.icon} size={14} />
                {status?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconName="Download">
            Exporter
          </Button>
          <Button variant="default" size="sm" iconName="Calendar">
            Planifier rapport
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;