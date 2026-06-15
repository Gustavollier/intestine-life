import { supabase } from "@/integrations/supabase/client";

type Clearer = () => void;
const clearers = new Set<Clearer>();

export function registerCacheClearer(fn: Clearer) {
  clearers.add(fn);
  return () => clearers.delete(fn);
}

export function clearAllCaches() {
  clearers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Cache clear error:", e);
    }
  });
}

let lastUserId: string | null | undefined = undefined;

supabase.auth.onAuthStateChange((event, session) => {
  const currentUserId = session?.user?.id ?? null;
  if (event === "SIGNED_OUT" || (lastUserId !== undefined && currentUserId !== lastUserId)) {
    clearAllCaches();
  }
  lastUserId = currentUserId;
});
