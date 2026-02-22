import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ProductPerformanceTable = ({ products, onStatusChange, onCompare }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const sortedProducts = [...products]?.sort((a, b) => {
    const aValue = a?.[sortConfig?.key];
    const bValue = b?.[sortConfig?.key];
    const modifier = sortConfig?.direction === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string') {
      return aValue?.localeCompare(bValue) * modifier;
    }
    return (aValue - bValue) * modifier;
  });

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev?.includes(productId) 
        ? prev?.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts?.length === products?.length 
        ? [] 
        : products?.map(p => p?.id)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-success/10 text-success',
      inactive: 'bg-muted text-muted-foreground',
      'low-stock': 'bg-warning/10 text-warning',
      'out-of-stock': 'bg-error/10 text-error'
    };
    return colors?.[status] || colors?.inactive;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      'low-stock': 'Stock faible',
      'out-of-stock': 'Rupture'
    };
    return labels?.[status] || status;
  };

  const getMarginColor = (margin) => {
    if (margin >= 50) return 'text-success';
    if (margin >= 30) return 'text-accent';
    return 'text-error';
  };

  const columns = [
    { key: 'name', label: 'Produit', sortable: true },
    { key: 'category', label: 'Catégorie', sortable: true },
    { key: 'revenue', label: 'Revenu', sortable: true },
    { key: 'unitsSold', label: 'Unités', sortable: true },
    { key: 'conversionRate', label: 'Conversion', sortable: true },
    { key: 'profitMargin', label: 'Marge', sortable: true },
    { key: 'status', label: 'Statut', sortable: true }
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="Table" size={20} className="text-primary" />
            <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
              Performance des Produits
            </h3>
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
              {products?.length}
            </span>
          </div>
          
          {selectedProducts?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedProducts?.length} sélectionné(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                iconName="GitCompare"
                iconPosition="left"
                onClick={() => onCompare(selectedProducts)}
                disabled={selectedProducts?.length < 2 || selectedProducts?.length > 5}
              >
                Comparer
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                Exporter
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts?.length === products?.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border"
                />
              </th>
              {columns?.map((column) => (
                <th
                  key={column?.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {column?.sortable ? (
                    <button
                      onClick={() => handleSort(column?.key)}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {column?.label}
                      <Icon
                        name={
                          sortConfig?.key === column?.key
                            ? sortConfig?.direction === 'asc' ?'ChevronUp' :'ChevronDown' :'ChevronsUpDown'
                        }
                        size={14}
                      />
                    </button>
                  ) : (
                    column?.label
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedProducts?.map((product) => (
              <tr
                key={product?.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts?.includes(product?.id)}
                    onChange={() => handleSelectProduct(product?.id)}
                    className="w-4 h-4 rounded border-border"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={product?.image}
                      alt={product?.imageAlt}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {product?.sku}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">{product?.category}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-foreground">
                    {product?.revenue?.toLocaleString('fr-FR')} €
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">
                    {product?.unitsSold?.toLocaleString('fr-FR')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">{product?.conversionRate}%</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-semibold ${getMarginColor(product?.profitMargin)}`}>
                    {product?.profitMargin}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onStatusChange(product?.id, product?.status)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product?.status)}`}
                  >
                    {getStatusLabel(product?.status)}
                  </button>
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="p-2 hover:bg-muted/30 rounded-md transition-colors">
                    <Icon name="MoreVertical" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Affichage de {sortedProducts?.length} produits
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconName="ChevronLeft">
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {[1, 2, 3]?.map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  page === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted/30 text-foreground'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" iconName="ChevronRight" iconPosition="right">
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPerformanceTable;