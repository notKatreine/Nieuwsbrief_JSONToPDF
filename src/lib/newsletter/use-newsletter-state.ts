import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseFromRaw } from "./parse";
import { sampleEn, sampleNl } from "./sample-data";
import {
  DEFAULT_HEADER_EN,
  DEFAULT_HEADER_NL,
  DEFAULT_SECTIONS,
  type Item,
  type Lang,
  type NavSection,
  type NewsletterState,
} from "./types";

const STORAGE_KEY = "rso-newsletter-builder-v1";

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

export function emptyState(): NewsletterState {
  const now = new Date();
  return {
    month: MONTHS[now.getMonth()],
    year: String(now.getFullYear()),
    nl: [],
    en: [],
    headerNl: { ...DEFAULT_HEADER_NL },
    headerEn: { ...DEFAULT_HEADER_EN },
    sections: DEFAULT_SECTIONS.map((section) => ({ ...section, categories: [...section.categories] })),
    dismissedFindings: [],
  };
}

export function sampleState(): NewsletterState {
  return {
    ...emptyState(),
    nl: parseFromRaw(sampleNl, "nl"),
    en: parseFromRaw(sampleEn, "en"),
  };
}

export function useNewsletterState() {
  const [state, setState] = useState<NewsletterState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const dirty = useRef(false);

  // Any user edit before hydration wins over whatever is in storage.
  const commit = useCallback<typeof setState>((updater) => {
    dirty.current = true;
    setState(updater);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && !dirty.current) {
        const parsed = JSON.parse(stored) as NewsletterState;
        setState({
          ...emptyState(),
          ...parsed,
          headerNl: { ...DEFAULT_HEADER_NL, ...parsed.headerNl },
          headerEn: { ...DEFAULT_HEADER_EN, ...parsed.headerEn },
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, hydrated]);

  const setItems = useCallback((lang: Lang, items: Item[]) => {
    commit((prev) => ({ ...prev, [lang]: items }) as NewsletterState);
  }, []);

  const updateItem = useCallback((lang: Lang, id: string, patch: Partial<Item>) => {
    commit((prev) => ({
      ...prev,
      [lang]: prev[lang].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }) as NewsletterState);
  }, []);

  const removeItem = useCallback((lang: Lang, id: string) => {
    commit((prev) => ({
      ...prev,
      [lang]: prev[lang].filter((item) => item.id !== id),
    }) as NewsletterState);
  }, []);

  const moveItem = useCallback((lang: Lang, id: string, direction: -1 | 1) => {
    commit((prev) => {
      const items = [...prev[lang]];
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, [lang]: items } as NewsletterState;
    });
  }, []);

  /** Creates a blank item at the end of a language list and returns its id. */
  const addItem = useCallback(
    (lang: Lang, category: string) => {
      const id = `${lang}-manual-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
      commit((prev) => {
        const item: Item = {
          id,
          category,
          title: "",
          organization: "",
          description: "",
          deadline: "",
          url: "",
          included: true,
        };
        return { ...prev, [lang]: [...prev[lang], item] } as NewsletterState;
      });
      return id;
    },
    [commit],
  );

  /** Copies an item into the other language list and returns the new id. */
  const copyToOtherLanguage = useCallback(
    (lang: Lang, id: string) => {
      const other: Lang = lang === "nl" ? "en" : "nl";
      const newId = `${other}-copy-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
      commit((prev) => {
        const source = prev[lang].find((item) => item.id === id);
        if (!source) return prev;
        return {
          ...prev,
          [other]: [...prev[other], { ...source, id: newId }],
        } as NewsletterState;
      });
      return { lang: other, id: newId };
    },
    [commit],
  );

  const dismissFinding = useCallback(
    (findingId: string) => {
      commit((prev) => ({
        ...prev,
        dismissedFindings: prev.dismissedFindings.includes(findingId)
          ? prev.dismissedFindings
          : [...prev.dismissedFindings, findingId],
      }));
    },
    [commit],
  );


  const setSections = useCallback((sections: NavSection[]) => {
    commit((prev) => ({ ...prev, sections }));
  }, []);

  const patch = useCallback((changes: Partial<NewsletterState>) => {
    commit((prev) => ({ ...prev, ...changes }));
  }, []);

  const reset = useCallback(() => commit(emptyState()), [commit]);
  const loadSample = useCallback(() => commit(sampleState()), [commit]);

  const allCategories = useMemo(() => {
    const seen: string[] = [];
    for (const item of [...state.nl, ...state.en]) {
      if (!seen.includes(item.category)) seen.push(item.category);
    }
    return seen.sort((a, b) => a.localeCompare(b));
  }, [state.nl, state.en]);

  return {
    state,
    hydrated,
    allCategories,
    setItems,
    updateItem,
    removeItem,
    moveItem,
    addItem,
    copyToOtherLanguage,
    dismissFinding,
    setSections,
    patch,
    reset,
    loadSample,
  };
}

export { MONTHS };
