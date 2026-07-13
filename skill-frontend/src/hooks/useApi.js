import { useRef, useCallback } from "react";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function useApi(setLoading, minMs = 1000) {
  const busy = useRef(false);

  const call = useCallback(
    async (fn) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      try {
        const [result] = await Promise.all([fn(), delay(minMs)]);
        return result;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
        busy.current = false;
      }
    },
    [setLoading, minMs]
  );

  return call;
}
