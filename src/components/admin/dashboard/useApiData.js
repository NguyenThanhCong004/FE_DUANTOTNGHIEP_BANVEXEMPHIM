import { useEffect, useRef, useState } from "react";

/**
 * Fetch-and-track hook for dashboard widgets — centralizes the loading/error
 * boilerplate that used to be duplicated per useEffect across dashboard pages.
 *
 * @param {() => Promise<{ok:boolean,data:any,message?:string}>} fetcher apiJson(...) call
 * @param {Array} deps re-fetch when these change
 */
export function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetcherRef.current();
        if (!mounted) return;
        if (!res || res.ok === false) {
          setError(res?.message || "Không tải được dữ liệu");
          setData(null);
          return;
        }
        setData(res.data ?? null);
      } catch {
        if (mounted) {
          setError("Lỗi kết nối máy chủ");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadTick]);

  const reload = () => setReloadTick((t) => t + 1);

  return { data, loading, error, reload };
}
