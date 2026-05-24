import { useCallback, useEffect, useRef, useState } from "react";

export default function useRealtimeSync({
  enabled = true,
  intervalMs = 12000,
  hasPendingChanges = false,
  onSync,
  channelName = "java6-admin-sync",
}) {
  const enabledRef = useRef(enabled);
  const pendingRef = useRef(hasPendingChanges);
  const onSyncRef = useRef(onSync);
  const inFlightRef = useRef(false);
  const channelRef = useRef(null);

  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    enabledRef.current = enabled;
    pendingRef.current = hasPendingChanges;
    onSyncRef.current = onSync;
  }, [enabled, hasPendingChanges, onSync]);

  const runSync = useCallback(async (reason = "interval") => {
    if (!enabledRef.current || !onSyncRef.current) return false;
    if (pendingRef.current) {
      setSkipped(true);
      return false;
    }
    if (inFlightRef.current) return false;

    inFlightRef.current = true;
    setSyncing(true);
    try {
      await onSyncRef.current(reason);
      setLastSyncedAt(new Date());
      setSkipped(false);
      return true;
    } finally {
      inFlightRef.current = false;
      setSyncing(false);
    }
  }, []);

  const notifySync = useCallback(
    (reason = "manual") => {
      if (!channelName || typeof window === "undefined") return;
      const payload = { type: "java6-sync", reason, at: Date.now() };

      if (channelRef.current) {
        channelRef.current.postMessage(payload);
      }

      try {
        window.localStorage.setItem(`${channelName}:ping`, JSON.stringify(payload));
      } catch {
        // Storage can be disabled; BroadcastChannel/polling still covers sync.
      }
    },
    [channelName]
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        runSync("interval");
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, runSync]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const handleFocus = () => runSync("focus");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") runSync("visible");
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, runSync]);

  useEffect(() => {
    if (!enabled || !channelName || typeof window === "undefined") return undefined;

    let channel;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(channelName);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === "java6-sync") {
          runSync(event.data.reason || "broadcast");
        }
      };
    }

    const storageKey = `${channelName}:ping`;
    const handleStorage = (event) => {
      if (event.key === storageKey) runSync("storage");
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [enabled, channelName, runSync]);

  return {
    lastSyncedAt,
    syncing,
    skipped,
    notifySync,
    runSync,
  };
}
