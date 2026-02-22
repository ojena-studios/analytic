import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CommissionDetailsTable = ({ transactions }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSelectAll = (e) => {
    if (e?.target?.checked) {
      setSelectedRows(transactions?.map(t => t?.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev?.includes(id) ? prev?.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const statusConfig = {
    paid: { color: 'success', icon: 'CheckCircle', label: 'Payé' },
    pending: { color: 'warning', icon: 'Clock', label: 'En attente' },
    processing: { color: 'accent', icon: 'Loader', label: 'En cours' },
    disputed: { color: 'error', icon: 'AlertTriangle', label: 'Contesté' }
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
              Détails des Commissions
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {transactions?.length} transactions • {selectedRows?.length} sélectionnées
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              iconName="Download"
              disabled={selectedRows?.length === 0}
            >
              Exporter
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              iconName="Send"
              disabled={selectedRows?.length === 0}
            >
              Traiter les paiements
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows?.length === transactions?.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button 
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Date
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground">Influenceur</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground">Marque</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground">Type</span>
              </th>
              <th className="px-4 py-3 text-right">
                <button 
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-2 ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Montant
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-muted-foreground">Statut</span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions?.map((transaction) => {
              const status = statusConfig?.[transaction?.status];
              return (
                <tr 
                  key={transaction?.id}
                  className={`hover:bg-muted/20 transition-colors ${
                    selectedRows?.includes(transaction?.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows?.includes(transaction?.id)}
                      onChange={() => handleSelectRow(transaction?.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground whitespace-nowrap">
                      {transaction?.date}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Image 
                        src={transaction?.avatar}
                        alt={transaction?.avatarAlt}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {transaction?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{transaction?.brand}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-foreground font-medium">
                      {transaction?.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {transaction?.amount?.toLocaleString('fr-FR')}€
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full bg-${status?.color}/10 text-${status?.color} text-xs font-medium`}>
                        <Icon name={status?.icon} size={12} />
                        {status?.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        className="p-1.5 hover:bg-muted/50 rounded transition-colors"
                        title="Voir détails"
                      >
                        <Icon name="Eye" size={16} className="text-muted-foreground" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-muted/50 rounded transition-colors"
                        title="Télécharger reçu"
                      >
                        <Icon name="Download" size={16} className="text-muted-foreground" />
                      </button>
                      {transaction?.status === 'disputed' && (
                        <button 
                          className="p-1.5 hover:bg-error/10 rounded transition-colors"
                          title="Gérer le litige"
                        >
                          <Icon name="AlertTriangle" size={16} className="text-error" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Affichage de 1 à {transactions?.length} sur {transactions?.length} transactions
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconName="ChevronLeft" disabled>
            Précédent
          </Button>
          <Button variant="outline" size="sm" iconName="ChevronRight" disabled>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommissionDetailsTable;