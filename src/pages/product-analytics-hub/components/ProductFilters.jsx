import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const ProductFilters = ({ onFilterChange, activeFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  const categoryOptions = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'skincare', label: 'Soins de la peau' },
    { value: 'makeup', label: 'Maquillage' },
    { value: 'fragrance', label: 'Parfums' },
    { value: 'haircare', label: 'Soins capillaires' },
    { value: 'bodycare', label: 'Soins du corps' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'low-stock', label: 'Stock faible' },
    { value: 'out-of-stock', label: 'Rupture de stock' }
  ];

  const marginRangeOptions = [
    { value: 'all', label: 'Toutes marges' },
    { value: 'high', label: 'Élevée (>50%)' },
    { value: 'medium', label: 'Moyenne (30-50%)' },
    { value: 'low', label: 'Faible (<30%)' }
  ];

  const performanceOptions = [
    { value: 'all', label: 'Toutes performances' },
    { value: 'top', label: 'Top performers' },
    { value: 'average', label: 'Performance moyenne' },
    { value: 'underperforming', label: 'Sous-performants' }
  ];

  const handleFilterUpdate = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsExpanded(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      category: 'all',
      status: 'all',
      marginRange: 'all',
      performance: 'all',
      searchQuery: '',
      minRevenue: '',
      maxRevenue: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = Object.values(localFilters)?.filter(
    v => v && v !== 'all' && v !== ''
  )?.length;

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Filtres Avancés
          </h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden p-2 hover:bg-muted/30 rounded-md transition-colors"
        >
          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={20} />
        </button>
      </div>
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Catégorie"
            options={categoryOptions}
            value={localFilters?.category}
            onChange={(value) => handleFilterUpdate('category', value)}
          />

          <Select
            label="Statut"
            options={statusOptions}
            value={localFilters?.status}
            onChange={(value) => handleFilterUpdate('status', value)}
          />

          <Select
            label="Marge"
            options={marginRangeOptions}
            value={localFilters?.marginRange}
            onChange={(value) => handleFilterUpdate('marginRange', value)}
          />

          <Select
            label="Performance"
            options={performanceOptions}
            value={localFilters?.performance}
            onChange={(value) => handleFilterUpdate('performance', value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Rechercher produit"
            type="search"
            placeholder="Nom, SKU, marque..."
            value={localFilters?.searchQuery}
            onChange={(e) => handleFilterUpdate('searchQuery', e?.target?.value)}
          />

          <Input
            label="Revenu minimum (€)"
            type="number"
            placeholder="0"
            value={localFilters?.minRevenue}
            onChange={(e) => handleFilterUpdate('minRevenue', e?.target?.value)}
          />

          <Input
            label="Revenu maximum (€)"
            type="number"
            placeholder="100000"
            value={localFilters?.maxRevenue}
            onChange={(e) => handleFilterUpdate('maxRevenue', e?.target?.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Button
            variant="default"
            iconName="Check"
            iconPosition="left"
            onClick={handleApplyFilters}
            fullWidth
            className="sm:w-auto"
          >
            Appliquer les filtres
          </Button>
          <Button
            variant="outline"
            iconName="RotateCcw"
            iconPosition="left"
            onClick={handleResetFilters}
            fullWidth
            className="sm:w-auto"
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;