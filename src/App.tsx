/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Initiative, DataSourceState, PageView } from './types';
import { 
  DEFAULT_SHEET_URL, 
  DEFAULT_SHEET_ID, 
  DEFAULT_SHEET_GID,
  STATIC_INITIATIVES,
  RAW_COMMUNITY_CSV
} from './data/fallbackData';
import { fetchSpreadsheetData, parseRawCsvToInitiatives, extractSheetInfo } from './services/sheetsService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { InteractiveMap } from './components/InteractiveMap';
import { InitiativeDetailModal } from './components/InitiativeDetailModal';
import { DirectoryPage } from './pages/DirectoryPage';
import { StatsPage } from './pages/StatsPage';
import { 
  countryNameToCode, 
  matchesSelectedCountries, 
  DEFAULT_COMMUNITY_COUNTRY_CODES,
  extractUniqueCountryCodes 
} from './data/countries';
import { Menu, X } from 'lucide-react';

const HASH_TO_PAGE: Record<string, PageView> = {
  '#map': 'map',
  '#mapa': 'map',
  '#directory': 'directory',
  '#directorio': 'directory',
  '#stats': 'stats',
  '#estadisticas': 'stats',
};

const PAGE_TO_HASH: Record<PageView, string> = {
  map: '#map',
  directory: '#directory',
  stats: '#stats',
};

export default function App() {
  // Hash-based routing for 100% static hosting without 404s
  const getInitialPage = (): PageView => {
    if (typeof window !== 'undefined') {
      const cleanHash = window.location.hash.toLowerCase().split('?')[0];
      if (HASH_TO_PAGE[cleanHash]) {
        return HASH_TO_PAGE[cleanHash];
      }
    }
    return 'map';
  };

  // Parse shareable country selection (?c=BR,AR,CL) from URL, default to "All"
  const getInitialCountryCodes = (): string[] => {
    if (typeof window === 'undefined') return DEFAULT_COMMUNITY_COUNTRY_CODES;
    try {
      // 1. Check standard query params (?c=...)
      const params = new URLSearchParams(window.location.search);
      let cParam = params.get('c');

      // 2. Also check if query params are placed inside hash (#map?c=...)
      if (!cParam && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        cParam = hashParams.get('c');
      }

      if (cParam) {
        const cleanParam = cParam.trim().toUpperCase();
        if (cleanParam === 'ALL') {
          return DEFAULT_COMMUNITY_COUNTRY_CODES;
        }
        const codes = cleanParam
          .split(',')
          .map((code) => countryNameToCode(code.trim()))
          .filter(Boolean);

        if (codes.length > 0) {
          return codes;
        }
      }
    } catch (e) {
      console.warn('Error parsing country query param from URL:', e);
    }
    // Default: start with the "All" selection by default
    return DEFAULT_COMMUNITY_COUNTRY_CODES;
  };

  const [activePage, setActivePage] = useState<PageView>(getInitialPage);

  // Initialize with the community dataset
  const [initiatives, setInitiatives] = useState<Initiative[]>(STATIC_INITIATIVES);

  const [dataSource, setDataSource] = useState<DataSourceState>({
    type: 'google_sheets',
    sheetUrl: DEFAULT_SHEET_URL,
    sheetId: DEFAULT_SHEET_ID,
    gid: DEFAULT_SHEET_GID,
    lastFetched: new Date(),
    status: 'success',
    rowCount: STATIC_INITIATIVES.length,
    autoRefresh: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  // Starts with "All" countries selected by default
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(getInitialCountryCodes);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync selectedCountryCodes to URL query parameter (?c=BR,AR,CL) for shareable state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const isAll = 
        selectedCountryCodes.length === 0 || 
        selectedCountryCodes.length >= DEFAULT_COMMUNITY_COUNTRY_CODES.length;

      // Only set ?c= if a specific subset is selected, keeping default URL clean
      if (!isAll && selectedCountryCodes.length > 0) {
        url.searchParams.set('c', selectedCountryCodes.join(','));
      } else {
        url.searchParams.delete('c');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      console.warn('Error updating URL params:', e);
    }
  }, [selectedCountryCodes]);

  // Listen to hash and popstate changes (browser back/forward & static links)
  useEffect(() => {
    const handleUrlChange = () => {
      const cleanHash = window.location.hash.toLowerCase().split('?')[0];
      if (HASH_TO_PAGE[cleanHash]) {
        setActivePage(HASH_TO_PAGE[cleanHash]);
      }
      // Re-read URL country param if changed
      const codes = getInitialCountryCodes();
      setSelectedCountryCodes((prev) => {
        const isSame = prev.length === codes.length && prev.every((c, i) => c === codes[i]);
        return isSame ? prev : codes;
      });
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Update page title for static navigation and accessibility
  useEffect(() => {
    const titles: Record<PageView, string> = {
      map: 'Interactive Map - ACM LAC Regional Signal Mining',
      directory: 'Directory - ACM LAC Regional Signal Mining',
      stats: 'Statistics - ACM LAC Regional Signal Mining',
    };
    if (typeof document !== 'undefined') {
      document.title = titles[activePage] || 'ACM LAC Regional Signal Mining';
    }
  }, [activePage]);

  const navigateToPage = (page: PageView) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = PAGE_TO_HASH[page];
    }
  };

  // Show transient toast notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Detect active Google Sheet config (hidden from UI)
  const getActiveSheetConfig = useCallback(() => {
    let url = DEFAULT_SHEET_URL;
    let sheetId = DEFAULT_SHEET_ID;
    let gid = DEFAULT_SHEET_GID;

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const querySheet = params.get('sheet') || params.get('spreadsheet') || params.get('url');
        if (querySheet) {
          url = querySheet;
        }
      } catch (e) {
        console.warn('URL parsing error:', e);
      }
    }

    if (url) {
      const extracted = extractSheetInfo(url);
      sheetId = extracted.sheetId;
      gid = extracted.gid;
    }

    return { url, sheetId, gid };
  }, []);

  // Client-side loader to refresh spreadsheet data
  const loadSheetData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setDataSource((prev) => ({ ...prev, status: 'loading' }));
    }

    const config = getActiveSheetConfig();

    if (config.sheetId) {
      try {
        const data = await fetchSpreadsheetData(config.sheetId, config.gid);
        setInitiatives(data);
        setDataSource((prev) => ({
          ...prev,
          type: 'google_sheets',
          sheetId: config.sheetId,
          gid: config.gid,
          status: 'success',
          lastFetched: new Date(),
          rowCount: data.length,
          errorMessage: undefined,
        }));
        if (!isSilent) {
          showNotification(`Planilla actualizada (${data.length} iniciativas)`);
        }
        return;
      } catch (err: any) {
        console.warn('Error fetching live Google Sheet data:', err);
        setDataSource((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: err.message,
        }));
        if (!isSilent) {
          showNotification(err.message || 'Error al conectar con la planilla');
        }
        return;
      }
    }

    // Fallback if no remote Google Sheet ID is set
    try {
      const data = parseRawCsvToInitiatives(RAW_COMMUNITY_CSV);
      setInitiatives(data);
      setDataSource((prev) => ({
        ...prev,
        type: 'google_sheets',
        status: 'success',
        lastFetched: new Date(),
        rowCount: data.length,
        errorMessage: undefined,
      }));
      if (!isSilent) {
        showNotification(`Planilla actualizada (${data.length} iniciativas)`);
      }
    } catch {
      setInitiatives(STATIC_INITIATIVES);
    }
  }, [getActiveSheetConfig]);

  // Initial client-side attempt to sync latest data
  useEffect(() => {
    loadSheetData(true);
  }, [loadSheetData]);

  // Periodic Auto-refresh (every 60s if autoRefresh enabled)
  useEffect(() => {
    if (!dataSource.autoRefresh) return;

    const intervalId = setInterval(() => {
      loadSheetData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [dataSource.autoRefresh, loadSheetData]);

  // Filtered list
  const filteredInitiatives = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const isAll = 
      selectedCountryCodes.length === 0 || 
      selectedCountryCodes.length >= DEFAULT_COMMUNITY_COUNTRY_CODES.length;

    return initiatives.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.topic.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.country.toLowerCase().includes(query) ||
        (item.scope && item.scope.toLowerCase().includes(query)) ||
        (item.locationRaw && item.locationRaw.toLowerCase().includes(query));

      const matchesCountry = isAll || matchesSelectedCountries(item.country, selectedCountryCodes);
      const matchesCategory =
        selectedCategory === 'all' || item.category.trim() === selectedCategory;

      return matchesSearch && matchesCountry && matchesCategory;
    });
  }, [initiatives, searchTerm, selectedCountryCodes, selectedCategory]);

  const handleSelectInitiative = (item: Initiative) => {
    setSelectedInitiative(item);
    setIsDetailModalOpen(true);
  };

  const handleGoToMapWithInitiative = (item: Initiative) => {
    setSelectedInitiative(item);
    navigateToPage('map');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCountryCodes(DEFAULT_COMMUNITY_COUNTRY_CODES);
    setSelectedCategory('all');
  };

  return (
    <div className="bg-slate-50 text-slate-800 h-screen w-screen overflow-hidden flex flex-col font-sans">
      
      {/* Top Header with static pages navigation */}
      <Header
        dataSource={dataSource}
        onRefresh={() => loadSheetData(false)}
        filteredCount={filteredInitiatives.length}
        totalCount={initiatives.length}
        activePage={activePage}
        onNavigate={navigateToPage}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 right-4 sm:right-6 z-[600] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Dynamic View Router (100% Client-Side Static Pages) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {activePage === 'map' && (
          <>
            {/* Sidebar with search & listing */}
            <Sidebar
              initiatives={initiatives}
              filteredInitiatives={filteredInitiatives}
              selectedInitiative={selectedInitiative}
              onSelectInitiative={handleSelectInitiative}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCountryCodes={selectedCountryCodes}
              onCountryCodesChange={setSelectedCountryCodes}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onResetFilters={handleResetFilters}
              dataSource={dataSource}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Floating Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden absolute bottom-5 right-5 z-[500] bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-2xl transition-transform active:scale-95 cursor-pointer"
              title={isMobileSidebarOpen ? "Close panel" : "Open panel"}
            >
              {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Interactive Leaflet Map */}
            <main className="flex-1 h-full relative overflow-hidden">
              <InteractiveMap
                initiatives={filteredInitiatives}
                selectedInitiative={selectedInitiative}
                selectedCountryCodes={selectedCountryCodes}
                onSelectInitiative={(init) => {
                  setSelectedInitiative(init);
                  setIsDetailModalOpen(true);
                }}
                onResetView={() => {
                  setSelectedInitiative(null);
                  setSelectedCountryCodes(DEFAULT_COMMUNITY_COUNTRY_CODES);
                }}
              />
            </main>
          </>
        )}

        {activePage === 'directory' && (
          <DirectoryPage
            initiatives={initiatives}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCountryCodes={selectedCountryCodes}
            onCountryCodesChange={setSelectedCountryCodes}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onResetFilters={handleResetFilters}
            onSelectInitiative={(item) => {
              setSelectedInitiative(item);
              setIsDetailModalOpen(true);
            }}
            onGoToMapWithInitiative={handleGoToMapWithInitiative}
          />
        )}

        {activePage === 'stats' && (
          <StatsPage
            initiatives={filteredInitiatives}
            allInitiatives={initiatives}
            selectedCountryCodes={selectedCountryCodes}
            onCountryCodesChange={setSelectedCountryCodes}
            onFilterByCountry={(country) => {
              const code = countryNameToCode(country);
              setSelectedCountryCodes([code]);
              navigateToPage('directory');
            }}
            onFilterByCategory={(cat) => {
              setSelectedCategory(cat);
              navigateToPage('directory');
            }}
            onGoToDirectory={() => navigateToPage('directory')}
          />
        )}

      </div>

      {/* Initiative Detail Modal */}
      {isDetailModalOpen && (
        <InitiativeDetailModal
          initiative={selectedInitiative}
          onClose={() => setIsDetailModalOpen(false)}
          onLocateOnMap={(init) => {
            setSelectedInitiative(init);
            navigateToPage('map');
            setIsDetailModalOpen(false);
          }}
        />
      )}

    </div>
  );
}
