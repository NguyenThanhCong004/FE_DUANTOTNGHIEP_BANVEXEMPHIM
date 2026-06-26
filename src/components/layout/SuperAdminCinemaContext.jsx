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

  const refreshCinemas = useCallback(async () => {
    try {
      const res = await apiJson(CINEMAS.LIST);
      if (!res.ok) return [];

      const list = res.data || [];
      const normalized = (Array.isArray(list) ? list : []).map((c) => ({
        id: c.cinemaId ?? c.id,
        name: c.name ?? "",
        address: c.address ?? "",
      }));
      setCinemas(normalized);
      return normalized;
    } catch (error) {
      console.error("Error fetching cinemas:", error);
      setCinemas([]);
      return [];
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void refreshCinemas();
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshCinemas]);

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
      refreshCinemas,
    }),
    [cinemas, selectedCinemaId, setSelectedCinemaId, selectedCinemaName, refreshCinemas]
  );

  return <SuperAdminCinemaContext.Provider value={value}>{children}</SuperAdminCinemaContext.Provider>;
}

export { SuperAdminCinemaContext };
