import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import BrandSelector from './BrandSelector';
import DateRangePicker from './DateRangePicker';
import NotificationBell from './NotificationBell';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: "Vue d\'ensemble",
      path: '/executive-overview',
      icon: 'LayoutDashboard',
      tooltip: 'Tableau de bord exécutif'
    },
    {
      label: 'Performance',
      path: '/influencer-performance',
      icon: 'TrendingUp',
      tooltip: 'Analyse des performances'
    },
    {
      label: 'Produits',
      path: '/product-analytics-hub',
      icon: 'Package',
      tooltip: 'Analyse des produits'
    },
    {
      label: 'Revenus',
      path: '/revenue-commission-center',
      icon: 'DollarSign',
      tooltip: 'Centre de commissions'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location?.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-[100] bg-card shadow-soft-sm backdrop-blur-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Sparkles" size={24} color="var(--color-primary)" />
              </div>
              <span className="text-xl font-heading font-semibold text-foreground hidden sm:block">
                OJENA Studios
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className={`
                    relative px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ease-out
                    hover:bg-muted/50 hover:scale-[1.02]
                    ${isActive(item?.path) 
                      ? 'text-primary' :'text-muted-foreground hover:text-foreground'
                    }
                  `}
                  title={item?.tooltip}
                >
                  <span className="flex items-center gap-2">
                    <Icon name={item?.icon} size={18} />
                    {item?.label}
                  </span>
                  {isActive(item?.path) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <BrandSelector />
              <DateRangePicker />
            </div>
            <NotificationBell />
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Toggle menu"
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={24} />
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[400] lg:hidden">
          <div 
            className="absolute inset-0 bg-background"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-card shadow-soft-md">
            <nav className="flex flex-col p-4 gap-2">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md text-left transition-all duration-200
                    hover:bg-muted/50
                    ${isActive(item?.path) 
                      ? 'bg-primary/10 text-primary font-medium' :'text-foreground'
                    }
                  `}
                >
                  <Icon name={item?.icon} size={20} />
                  <span className="flex-1">{item?.label}</span>
                  {isActive(item?.path) && (
                    <Icon name="ChevronRight" size={16} color="var(--color-accent)" />
                  )}
                </button>
              ))}
              
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <BrandSelector />
                <DateRangePicker />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;