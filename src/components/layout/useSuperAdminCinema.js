import { useContext } from "react";
import { SuperAdminCinemaContext } from "./SuperAdminCinemaContext";

export function useSuperAdminCinema() {
  const ctx = useContext(SuperAdminCinemaContext);
  if (!ctx) throw new Error("useSuperAdminCinema must be used within SuperAdminCinemaProvider");
  return ctx;
}

