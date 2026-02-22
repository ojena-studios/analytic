import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ComparisonModal = ({ products, onClose }) => {
  if (!products || products?.length === 0) return null;

  const metrics = [
    { key: 'revenue', label: 'Revenu', format: (v) => `${v?.toLocaleString('fr-FR')} €` },
    { key: 'unitsSold', label: 'Unités vendues', format: (v) => v?.toLocaleString('fr-FR') },
    { key: 'conversionRate', label: 'Taux de conversion', format: (v) => `${v}%` },
    { key: 'profitMargin', label: 'Marge bénéficiaire', format: (v) => `${v}%` },
    { key: 'avgOrderValue', label: 'Panier moyen', format: (v) => `${v?.toLocaleString('fr-FR')} €` },
    { key: 'returnRate', label: 'Taux de retour', format: (v) => `${v}%` }
  ];

  const getBestPerformer = (key) => {
    const values = products?.map(p => p?.[key]);
    const maxValue = Math.max(...values);
    return products?.findIndex(p => p?.[key] === maxValue);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-soft-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon name="GitCompare" size={24} className="text-primary" />
            <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
              Comparaison de Produits
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/30 rounded-md transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Métrique
                  </th>
                  {products?.map((product) => (
                    <th key={product?.id} className="px-4 py-3 text-center min-w-[150px]">
                      <div className="flex flex-col items-center gap-2">
                        <Image
                          src={product?.image}
                          alt={product?.imageAlt}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <p className="text-sm font-semibold text-foreground">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">{product?.category}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics?.map((metric) => {
                  const bestIndex = getBestPerformer(metric?.key);
                  return (
                    <tr key={metric?.key} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-foreground">
                        {metric?.label}
                      </td>
                      {products?.map((product, index) => (
                        <td key={product?.id} className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-sm font-semibold ${
                              index === bestIndex ? 'text-success' : 'text-foreground'
                            }`}>
                              {metric?.format(product?.[metric?.key])}
                            </span>
                            {index === bestIndex && (
                              <Icon name="TrendingUp" size={16} color="var(--color-success)" />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Lightbulb" size={20} className="text-accent flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Recommandations
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Le produit avec la meilleure marge pourrait bénéficier d'une promotion accrue</li>
                  <li>• Analysez les stratégies du produit le plus performant pour les appliquer aux autres</li>
                  <li>• Les produits à faible conversion nécessitent une optimisation de leur page produit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="default" iconName="Download" iconPosition="left">
            Exporter la comparaison
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;