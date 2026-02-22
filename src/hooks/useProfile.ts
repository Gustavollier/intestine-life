import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  name: string;
  plan: string;
}

// Module-level cache
let cachedProfile: ProfileData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);

  const fetchProfile = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedProfile && (now - cacheTimestamp) < CACHE_TTL) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("name, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const result: ProfileData = { name: data.name || "", plan: data.plan || "free" };
      cachedProfile = result;
      cacheTimestamp = Date.now();
      setProfile(result);
    }
    setLoading(false);
  }, []);

  const invalidateCache = useCallback(() => {
    cachedProfile = null;
    cacheTimestamp = 0;
  }, []);

  const updateCachedName = useCallback((name: string) => {
    if (cachedProfile) {
      cachedProfile = { ...cachedProfile, name };
      setProfile(cachedProfile);
    }
  }, []);

  const updateCachedPlan = useCallback((plan: string) => {
    if (cachedProfile) {
      cachedProfile = { ...cachedProfile, plan };
      setProfile(cachedProfile);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    fetchProfile,
    invalidateCache,
    updateCachedName,
    updateCachedPlan,
  };
}
