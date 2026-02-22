import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const DateRangePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('last-30-days');
  const [customRange, setCustomRange] = useState({
    startDate: '',
    endDate: ''
  });
  const dropdownRef = useRef(null);

  const presets = [
    { id: 'today', label: "Aujourd\'hui", icon: 'Calendar' },
    { id: 'yesterday', label: 'Hier', icon: 'Calendar' },
    { id: 'last-7-days', label: '7 derniers jours', icon: 'CalendarDays' },
    { id: 'last-30-days', label: '30 derniers jours', icon: 'CalendarDays' },
    { id: 'this-month', label: 'Ce mois', icon: 'CalendarRange' },
    { id: 'last-month', label: 'Mois dernier', icon: 'CalendarRange' },
    { id: 'this-quarter', label: 'Ce trimestre', icon: 'CalendarRange' },
    { id: 'this-year', label: 'Cette année', icon: 'CalendarRange' },
    { id: 'custom', label: 'Personnalisé', icon: 'CalendarClock' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPresetLabel = () => {
    const preset = presets?.find(p => p?.id === selectedPreset);
    return preset ? preset?.label : '30 derniers jours';
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleCustomRangeApply = () => {
    if (customRange?.startDate && customRange?.endDate) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border border-border"
        aria-label="Select date range"
      >
        <Icon name="CalendarDays" size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground hidden sm:inline">
          {getPresetLabel()}
        </span>
        <Icon 
          name={isOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
          className="text-muted-foreground"
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-card rounded-lg shadow-soft-md border border-border z-[200] overflow-hidden">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Sélectionner une période</h3>
          </div>

          <div className="p-2">
            {presets?.map((preset) => (
              <button
                key={preset?.id}
                onClick={() => handlePresetSelect(preset?.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30 transition-colors text-left
                  ${selectedPreset === preset?.id ? 'bg-primary/10 text-primary' : 'text-foreground'}
                `}
              >
                <Icon name={preset?.icon} size={16} />
                <span className="flex-1 text-sm font-medium">{preset?.label}</span>
                {selectedPreset === preset?.id && (
                  <Icon name="Check" size={16} color="var(--color-primary)" />
                )}
              </button>
            ))}
          </div>

          {selectedPreset === 'custom' && (
            <div className="p-4 border-t border-border space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={customRange?.startDate}
                  onChange={(e) => setCustomRange({ ...customRange, startDate: e?.target?.value })}
                  className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={customRange?.endDate}
                  onChange={(e) => setCustomRange({ ...customRange, endDate: e?.target?.value })}
                  className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={handleCustomRangeApply}
                disabled={!customRange?.startDate || !customRange?.endDate}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Appliquer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;