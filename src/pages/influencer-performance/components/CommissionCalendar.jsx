import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const CommissionCalendar = ({ payouts, loading = false }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date()?.getMonth());
  const [selectedYear] = useState(new Date()?.getFullYear());

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'CheckCircle2';
      case 'pending':
        return 'Clock';
      case 'processing':
        return 'Loader2';
      default:
        return 'Circle';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En cours';
      default:
        return 'Prévu';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3]?.map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentMonthPayouts = payouts?.filter(p => p?.month === selectedMonth);

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-soft-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Calendrier des paiements
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Suivi des commissions mensuelles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1))}
            className="p-2 rounded-md hover:bg-muted/50 transition-colors"
            aria-label="Mois précédent"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[100px] text-center">
            {months?.[selectedMonth]}
          </span>
          <button
            onClick={() => setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1))}
            className="p-2 rounded-md hover:bg-muted/50 transition-colors"
            aria-label="Mois suivant"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {currentMonthPayouts?.length > 0 ? (
          currentMonthPayouts?.map((payout) => (
            <div
              key={payout?.id}
              className={`p-4 rounded-lg border ${getStatusColor(payout?.status)} transition-all duration-200 hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <Icon name={getStatusIcon(payout?.status)} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {payout?.date}
                      </h4>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background/50">
                        {getStatusLabel(payout?.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payout?.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base md:text-lg font-bold text-foreground whitespace-nowrap">
                    {payout?.amount}€
                  </p>
                  {payout?.method && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {payout?.method}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Icon name="CalendarOff" size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun paiement prévu pour {months?.[selectedMonth]}
            </p>
          </div>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total du mois</span>
          <span className="text-lg font-bold text-primary">
            {currentMonthPayouts?.reduce((sum, p) => sum + parseFloat(p?.amount?.replace(/\s/g, '')), 0)?.toLocaleString('fr-FR')}€
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommissionCalendar;