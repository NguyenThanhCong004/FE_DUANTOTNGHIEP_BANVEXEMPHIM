import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "../../utils/apiClient";
import { CINEMAS } from "../../constants/apiEndpoints";

const SuperAdminCinemaContext = createContext(null);

const STORAGE_KEY = "superadmin_selectedCinemaId";

export function SuperAdminCinemaProvider({ children }) {
  const [selectedCinemaId, setSelectedCinemaIdState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : null;
    return Number.isFinite(parsed) ? (parsed === 0 ? null : parsed) : null;
  });

  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiJson(CINEMAS.LIST);
        if (!mounted || !res.ok) return;
        
        const list = res.data || [];
        const normalized = (Array.isArray(list) ? list : []).map((c) => ({
          id: c.cinemaId ?? c.id,
          name: c.name ?? "",
          address: c.address ?? "",
        }));
        setCinemas(normalized);
      } catch (error) {
        console.error("Error fetching cinemas:", error);
        if (mounted) setCinemas([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setSelectedCinemaId = useCallback((id) => {
    const normalized = id ? parseInt(id, 10) : null;
    const next = normalized && Number.isFinite(normalized) ? normalized : null;
    setSelectedCinemaIdState(next);
    if (next) localStorage.setItem(STORAGE_KEY, String(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selectedCinemaName = useMemo(() => {
    if (selectedCinemaId == null) return null;
    const c = cinemas.find((x) => String(x.id) === String(selectedCinemaId));
    return c?.name ?? null;
  }, [cinemas, selectedCinemaId]);

  const value = useMemo(
    () => ({
      cinemas,
      selectedCinemaId,
      setSelectedCinemaId,
      selectedCinemaName,
    }),
    [cinemas, selectedCinemaId, setSelectedCinemaId, selectedCinemaName]
  );

  return <SuperAdminCinemaContext.Provider value={value}>{children}</SuperAdminCinemaContext.Provider>;
}

export { SuperAdminCinemaContext };
