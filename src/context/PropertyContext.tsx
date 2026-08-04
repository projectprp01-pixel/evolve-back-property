import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type Property, PROPERTIES, DEFAULT_PROPERTY } from '@/config/properties';
import { useAuth } from '@/context/AuthContext';

interface PropertyContextValue {
  selectedProperty: Property;
  setSelectedProperty: (p: Property) => void;
  properties: Property[];
}

const PropertyContext = createContext<PropertyContextValue | null>(null);
const STORAGE_KEY = 'eb-selected-property';

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { staff } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = staff?.role === 'Admin';

  const resolveProperty = (): Property => {
    if (staff && !isAdmin) {
      return PROPERTIES.find(p => p.id === staff.propertyId) ?? DEFAULT_PROPERTY;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return PROPERTIES.find(p => p.id === saved) ?? DEFAULT_PROPERTY;
  };

  const [selectedProperty, setSelectedPropertyState] = useState<Property>(resolveProperty);

  // Re-sync whenever the logged-in staff member changes (login / logout / role change)
  useEffect(() => {
    const resolved = resolveProperty();
    setSelectedPropertyState(prev => {
      if (prev.id !== resolved.id) {
        queryClient.clear();
      }
      return resolved;
    });
  }, [staff?._id, staff?.propertyId, staff?.role]);

  const setSelectedProperty = (p: Property) => {
    if (!isAdmin) return;
    localStorage.setItem(STORAGE_KEY, p.id);
    setSelectedPropertyState(p);
    queryClient.clear();
  };

  return (
    <PropertyContext.Provider value={{ selectedProperty, setSelectedProperty, properties: PROPERTIES }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty must be used within PropertyProvider');
  return ctx;
}
