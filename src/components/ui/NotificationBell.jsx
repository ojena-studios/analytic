import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      title: 'Paiement reçu',
      message: 'Commission de 2 450€ créditée',
      time: 'Il y a 5 min',
      read: false,
      icon: 'DollarSign',
      color: 'success'
    },
    {
      id: 2,
      type: 'milestone',
      title: 'Objectif atteint',
      message: 'Vous avez dépassé 10K ventes ce mois',
      time: 'Il y a 2 heures',
      read: false,
      icon: 'Trophy',
      color: 'accent'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Stock faible',
      message: 'Produit "Sérum Éclat" bientôt épuisé',
      time: 'Il y a 5 heures',
      read: true,
      icon: 'AlertTriangle',
      color: 'warning'
    },
    {
      id: 4,
      type: 'info',
      title: 'Nouveau rapport',
      message: 'Rapport mensuel disponible',
      time: 'Hier',
      read: true,
      icon: 'FileText',
      color: 'primary'
    }
  ]);

  const dropdownRef = useRef(null);
  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId) => {
    setNotifications(notifications?.map(n => 
      n?.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications?.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getIconColor = (color) => {
    const colorMap = {
      success: 'var(--color-success)',
      accent: 'var(--color-accent)',
      warning: 'var(--color-warning)',
      primary: 'var(--color-primary)',
      error: 'var(--color-error)'
    };
    return colorMap?.[color] || 'var(--color-muted-foreground)';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02]"
        aria-label="Notifications"
      >
        <Icon name="Bell" size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-card rounded-lg shadow-soft-md border border-border z-[300] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
              {notifications?.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Effacer tout
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications?.length > 0 ? (
              notifications?.map((notification) => (
                <button
                  key={notification?.id}
                  onClick={() => handleNotificationClick(notification?.id)}
                  className={`
                    w-full flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors text-left border-b border-border last:border-b-0
                    ${!notification?.read ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${notification?.color === 'success' ? 'bg-success/10' : ''}
                    ${notification?.color === 'accent' ? 'bg-accent/10' : ''}
                    ${notification?.color === 'warning' ? 'bg-warning/10' : ''}
                    ${notification?.color === 'primary' ? 'bg-primary/10' : ''}
                    ${notification?.color === 'error' ? 'bg-error/10' : ''}
                  `}>
                    <Icon 
                      name={notification?.icon} 
                      size={18} 
                      color={getIconColor(notification?.color)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {notification?.title}
                      </h4>
                      {!notification?.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification?.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {notification?.time}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <Icon name="BellOff" size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune notification
                </p>
              </div>
            )}
          </div>

          {notifications?.length > 0 && (
            <div className="p-3 border-t border-border">
              <button className="w-full text-center text-sm text-primary hover:underline font-medium">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;