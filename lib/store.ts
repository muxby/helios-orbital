import { create } from "zustand";
import type {
  CameraPreset,
  CatalogEntry,
  CatalogSource,
  CatalogStatus,
  Observer,
  OrbitClassFilter,
  SimClock,
} from "./types";
import { DEFAULT_CITY_ID, DEFAULT_OBSERVER, matchCityId, observerFromCity } from "./observers";
import { parseHeliosSearch } from "./share";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export interface HeliosSettingsSlice {
  showLabels: boolean;
  showGroundTrack: boolean;
  showTerminator: boolean;
  maxRender: number;
  reducedMotion: boolean;
  showMap2d: boolean;
  observerCityId: string;
}

export interface HeliosState {
  catalog: CatalogEntry[];
  catalogStatus: CatalogStatus;
  catalogError: string | null;
  catalogSource: CatalogSource;
  selectedNoradId: number | null;
  compareNoradId: number | null;
  watchlist: number[];
  observer: Observer;
  clock: SimClock;
  groupsLoaded: string[];
  activeGroup: string;
  searchQuery: string;
  orbitClassFilter: OrbitClassFilter;
  showLabels: boolean;
  showGroundTrack: boolean;
  showTerminator: boolean;
  maxRender: number;
  reducedMotion: boolean;
  showMap2d: boolean;
  cameraPreset: CameraPreset;
  catalogUpdatedAt: string | null;
  hoveredNoradId: number | null;
  cameraFocusNorad: number | null;
  cameraFocusGen: number;
  cameraHomeGen: number;
  observerCityId: string;
  setCatalog: (entries: CatalogEntry[], source?: CatalogSource) => void;
  setCatalogStatus: (status: CatalogStatus, error?: string | null) => void;
  setCatalogSource: (source: CatalogSource) => void;
  setSelected: (noradId: number | null) => void;
  setCompare: (noradId: number | null) => void;
  toggleWatch: (noradId: number) => void;
  setObserver: (observer: Observer) => void;
  setClock: (partial: Partial<SimClock>) => void;
  setRate: (rate: number) => void;
  togglePlaying: () => void;
  setSearch: (query: string) => void;
  setFilter: (filter: OrbitClassFilter) => void;
  setActiveGroup: (group: string) => void;
  setShowLabels: (value: boolean) => void;
  setShowGroundTrack: (value: boolean) => void;
  setShowTerminator: (value: boolean) => void;
  setMaxRender: (n: number) => void;
  setReducedMotion: (value: boolean) => void;
  setShowMap2d: (value: boolean) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  hydrateFromUrl: () => void;
  setHovered: (noradId: number | null) => void;
  setCatalogUpdatedAt: (iso: string | null) => void;
  focusCamera: (noradId: number) => void;
  resetCamera: () => void;
  setObserverCity: (cityId: string) => void;
}

function persistSettings(s: HeliosSettingsSlice) {
  writeJson("helios-settings", s);
}

function persistWatch(watchlist: number[]) {
  writeJson("helios-watchlist", watchlist);
}

function persistObserver(observer: Observer) {
  writeJson("helios-observer", observer);
}

function syncNoradUrl(noradId: number | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (noradId != null) url.searchParams.set("norad", String(noradId));
  else url.searchParams.delete("norad");
  window.history.replaceState({}, "", url);
}

export const useHeliosStore = create<HeliosState>((set, get) => ({
  catalog: [],
  catalogStatus: "idle",
  catalogError: null,
  catalogSource: "unknown",
  selectedNoradId: null,
  compareNoradId: null,
  watchlist: [],
  observer: DEFAULT_OBSERVER,
  clock: { epochMs: Date.now(), playing: true, rate: 1 },
  groupsLoaded: [],
  activeGroup: "stations",
  searchQuery: "",
  orbitClassFilter: "all",
  showLabels: true,
  showGroundTrack: true,
  showTerminator: true,
  maxRender: 800,
  reducedMotion: false,
  showMap2d: false,
  cameraPreset: null,
  catalogUpdatedAt: null,
  hoveredNoradId: null,
  cameraFocusNorad: null,
  cameraFocusGen: 0,
  cameraHomeGen: 0,
  observerCityId: DEFAULT_CITY_ID,
  setCatalog: (entries, source) =>
    set((s) => ({
      catalog: entries,
      catalogStatus: "ready",
      catalogError: null,
      catalogSource: source ?? s.catalogSource,
      groupsLoaded: s.groupsLoaded.includes(s.activeGroup)
        ? s.groupsLoaded
        : [...s.groupsLoaded, s.activeGroup],
    })),
  setCatalogStatus: (status, error = null) =>
    set({ catalogStatus: status, catalogError: error }),
  setCatalogSource: (catalogSource) => set({ catalogSource }),
  setSelected: (noradId) => {
    syncNoradUrl(noradId);
    set({ selectedNoradId: noradId });
  },
  setCompare: (noradId) => set({ compareNoradId: noradId }),
  toggleWatch: (noradId) => {
    const watchlist = get().watchlist.includes(noradId)
      ? get().watchlist.filter((id) => id !== noradId)
      : [...get().watchlist, noradId];
    persistWatch(watchlist);
    set({ watchlist });
  },
  setObserver: (observer) => {
    persistObserver(observer);
    const observerCityId = matchCityId(observer.lat, observer.lon);
    set({ observer, observerCityId });
    persistSettings(settingsFrom({ ...get(), observerCityId }));
  },
  setObserverCity: (cityId) => {
    const next = observerFromCity(cityId);
    if (!next) {
      set({ observerCityId: "custom" });
      persistSettings(settingsFrom({ ...get(), observerCityId: "custom" }));
      return;
    }
    persistObserver(next);
    set({ observer: next, observerCityId: cityId });
    persistSettings(settingsFrom({ ...get(), observerCityId: cityId }));
  },
  setClock: (partial) => set((s) => ({ clock: { ...s.clock, ...partial } })),
  setRate: (rate) => set((s) => ({ clock: { ...s.clock, rate } })),
  togglePlaying: () =>
    set((s) => ({ clock: { ...s.clock, playing: !s.clock.playing } })),
  setSearch: (searchQuery) => set({ searchQuery }),
  setFilter: (orbitClassFilter) => set({ orbitClassFilter }),
  setActiveGroup: (activeGroup) => set({ activeGroup }),
  setShowLabels: (showLabels) => {
    set({ showLabels });
    persistSettings(settingsFrom(get()));
  },
  setShowGroundTrack: (showGroundTrack) => {
    set({ showGroundTrack });
    persistSettings(settingsFrom(get()));
  },
  setShowTerminator: (showTerminator) => {
    set({ showTerminator });
    persistSettings(settingsFrom(get()));
  },
  setMaxRender: (maxRender) => {
    set({ maxRender });
    persistSettings(settingsFrom(get()));
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
    persistSettings(settingsFrom(get()));
  },
  setShowMap2d: (showMap2d) => {
    set({ showMap2d });
    persistSettings(settingsFrom(get()));
  },
  setCameraPreset: (cameraPreset) => {
    if (cameraPreset === "iss") {
      get().focusCamera(25544);
    }
    set({ cameraPreset });
  },
  hydrateFromUrl: () => {
    const watchlist = readJson<number[]>("helios-watchlist", []);
    const observer = readJson<Observer>("helios-observer", DEFAULT_OBSERVER);
    const settings = readJson<Partial<HeliosSettingsSlice>>("helios-settings", {});
    let selectedNoradId: number | null = get().selectedNoradId;
    let lat = Number.isFinite(observer.lat) ? observer.lat : DEFAULT_OBSERVER.lat;
    let lon = Number.isFinite(observer.lon) ? observer.lon : DEFAULT_OBSERVER.lon;
    const altM = Number.isFinite(observer.altM) ? observer.altM : DEFAULT_OBSERVER.altM;
    let epochMs: number | null = null;
    if (typeof window !== "undefined") {
      const parsed = parseHeliosSearch(window.location.search);
      if (parsed.norad != null) selectedNoradId = parsed.norad;
      if (parsed.lat != null) lat = parsed.lat;
      if (parsed.lon != null) lon = parsed.lon;
      if (parsed.t != null) epochMs = parsed.t;
    }
    const observerCityId = matchCityId(lat, lon);
    set({
      watchlist: Array.isArray(watchlist) ? watchlist.filter((n) => Number.isFinite(n)) : [],
      observer: { lat, lon, altM },
      observerCityId,
      showLabels: settings.showLabels ?? true,
      showGroundTrack: settings.showGroundTrack ?? true,
      showTerminator: settings.showTerminator ?? true,
      maxRender:
        typeof settings.maxRender === "number" && settings.maxRender > 0
          ? Math.min(4000, settings.maxRender)
          : 800,
      reducedMotion: settings.reducedMotion ?? false,
      showMap2d: settings.showMap2d ?? false,
      selectedNoradId,
      ...(epochMs != null ? { clock: { ...get().clock, epochMs, playing: false } } : {}),
    });
    if (selectedNoradId != null) syncNoradUrl(selectedNoradId);
  },
  setHovered: (hoveredNoradId) => set({ hoveredNoradId }),
  setCatalogUpdatedAt: (catalogUpdatedAt) => set({ catalogUpdatedAt }),
  focusCamera: (noradId) =>
    set((s) => ({
      cameraFocusNorad: noradId,
      cameraFocusGen: s.cameraFocusGen + 1,
      selectedNoradId: noradId,
    })),
  resetCamera: () =>
    set((s) => ({
      cameraHomeGen: s.cameraHomeGen + 1,
      cameraFocusNorad: null,
      cameraPreset: null,
    })),
}));

function settingsFrom(s: HeliosState): HeliosSettingsSlice {
  return {
    showLabels: s.showLabels,
    showGroundTrack: s.showGroundTrack,
    showTerminator: s.showTerminator,
    maxRender: s.maxRender,
    reducedMotion: s.reducedMotion,
    showMap2d: s.showMap2d,
    observerCityId: s.observerCityId,
  };
}

export function filteredCatalog(s: HeliosState): CatalogEntry[] {
  const q = s.searchQuery.trim().toLowerCase();
  return s.catalog.filter((e) => {
    if (s.orbitClassFilter !== "all" && e.orbitClass !== s.orbitClassFilter) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      String(e.noradId).includes(q) ||
      (e.intlDes ?? "").toLowerCase().includes(q)
    );
  });
}
