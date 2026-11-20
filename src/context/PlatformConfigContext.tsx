import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PublicPlatformConfig } from '../types/superAdmin';

interface PlatformConfigContextValue {
  config: PublicPlatformConfig | null;
  loading: boolean;
  refreshPlatformConfig: () => Promise<void>;
  getFeatureConfig: (idOrRoute: string) => PublicPlatformConfig['features'][number] | undefined;
  isFeatureEnabled: (idOrRoute: string) => boolean;
}

const PlatformConfigContext = createContext<PlatformConfigContextValue | undefined>(undefined);

export const PlatformConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicPlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPlatformConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/public/site-config');
      if (res.ok) {
        const data = (await res.json()) as PublicPlatformConfig;
        setConfig(data);
      }
    } catch {
      // keep existing config on transient network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlatformConfig();
  }, [refreshPlatformConfig]);

  useEffect(() => {
    if (!config?.website) return;
    const { website } = config;
    const root = document.documentElement;
    if (website.primaryColor) root.style.setProperty('--kampus-primary', website.primaryColor);
    if (website.navyColor) root.style.setProperty('--kampus-navy', website.navyColor);
    if (website.accentColor) root.style.setProperty('--kampus-accent', website.accentColor);
    if (website.seoTitle || website.siteName) {
      document.title = website.seoTitle || `${website.siteName} — ${website.tagline}`;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && website.seoDescription) {
      metaDesc.setAttribute('content', website.seoDescription);
    }
  }, [config]);

  const getFeatureConfig = useCallback(
    (idOrRoute: string) => {
      if (!config?.features) return undefined;
      return config.features.find(
        (f) => f.id === idOrRoute || f.route === idOrRoute || idOrRoute.startsWith(`${f.route}/`)
      );
    },
    [config]
  );

  const isFeatureEnabled = useCallback(
    (idOrRoute: string) => {
      const f = getFeatureConfig(idOrRoute);
      if (!f) return true;
      return f.enabled;
    },
    [getFeatureConfig]
  );

  return (
    <PlatformConfigContext.Provider
      value={{
        config,
        loading,
        refreshPlatformConfig,
        getFeatureConfig,
        isFeatureEnabled,
      }}
    >
      {children}
    </PlatformConfigContext.Provider>
  );
};

export function usePlatformConfig(): PlatformConfigContextValue {
  const ctx = useContext(PlatformConfigContext);
  if (!ctx) {
    throw new Error('usePlatformConfig must be used inside PlatformConfigProvider');
  }
  return ctx;
}
