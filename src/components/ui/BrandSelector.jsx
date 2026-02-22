import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';

const BrandSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const dropdownRef = useRef(null);

  const brands = [
    {
      id: 'all',
      name: 'Toutes les marques',
      logo: '/assets/images/brands/all-brands.png',
      access: 'admin'
    },
    {
      id: 'ojena-beauty',
      name: 'OJENA Beauty',
      logo: '/assets/images/brands/ojena-beauty.png',
      access: 'both'
    },
    {
      id: 'luxe-cosmetics',
      name: 'Luxe Cosmetics',
      logo: '/assets/images/brands/luxe-cosmetics.png',
      access: 'both'
    },
    {
      id: 'glow-essentials',
      name: 'Glow Essentials',
      logo: '/assets/images/brands/glow-essentials.png',
      access: 'admin'
    },
    {
      id: 'radiance-pro',
      name: 'Radiance Pro',
      logo: '/assets/images/brands/radiance-pro.png',
      access: 'both'
    }
  ];

  useEffect(() => {
    if (!selectedBrand) {
      setSelectedBrand(brands?.[1]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands?.filter(brand =>
    brand?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border border-border"
        aria-label="Select brand"
      >
        {selectedBrand && (
          <>
            <Image 
              src={selectedBrand?.logo} 
              alt={selectedBrand?.name}
              className="w-6 h-6 rounded object-cover"
            />
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {selectedBrand?.name}
            </span>
          </>
        )}
        <Icon 
          name={isOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
          className="text-muted-foreground"
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-card rounded-lg shadow-soft-md border border-border z-[200] overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Rechercher une marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full pl-9 pr-3 py-2 bg-background rounded-md text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredBrands?.length > 0 ? (
              filteredBrands?.map((brand) => (
                <button
                  key={brand?.id}
                  onClick={() => handleBrandSelect(brand)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left
                    ${selectedBrand?.id === brand?.id ? 'bg-primary/10' : ''}
                  `}
                >
                  <Image 
                    src={brand?.logo} 
                    alt={brand?.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {brand?.name}
                  </span>
                  {selectedBrand?.id === brand?.id && (
                    <Icon name="Check" size={16} color="var(--color-primary)" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune marque trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSelector;