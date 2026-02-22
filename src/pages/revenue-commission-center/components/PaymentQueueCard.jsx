import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const PaymentQueueCard = ({ payment }) => {
  const priorityConfig = {
    high: { color: 'error', icon: 'AlertCircle', label: 'Haute' },
    medium: { color: 'warning', icon: 'Clock', label: 'Moyenne' },
    low: { color: 'success', icon: 'CheckCircle', label: 'Basse' }
  };

  const statusConfig = {
    pending: { color: 'warning', label: 'En attente' },
    scheduled: { color: 'primary', label: 'Planifié' },
    processing: { color: 'accent', label: 'En cours' }
  };

  const priority = priorityConfig?.[payment?.priority];
  const status = statusConfig?.[payment?.status];

  return (
    <div className="bg-background rounded-lg border border-border p-3 md:p-4 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start gap-3">
        <Image 
          src={payment?.avatar}
          alt={payment?.avatarAlt}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm md:text-base font-semibold text-foreground truncate">
                {payment?.name}
              </h4>
              <p className="text-xs text-muted-foreground">{payment?.brand}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-${priority?.color}/10 flex-shrink-0`}>
              <Icon name={priority?.icon} size={12} color={`var(--color-${priority?.color})`} />
              <span className={`text-xs font-medium text-${priority?.color}`}>
                {priority?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-lg md:text-xl font-heading font-bold text-foreground">
              {payment?.amount?.toLocaleString('fr-FR')}€
            </span>
            <span className={`text-xs px-2 py-1 rounded-full bg-${status?.color}/10 text-${status?.color} font-medium`}>
              {status?.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon name="Calendar" size={12} />
              <span>{payment?.dueDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="FileText" size={12} />
              <span>{payment?.transactions} transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentQueueCard;