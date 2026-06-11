import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile, type ProfileData } from "@/lib/profile.functions";

const LOCAL_KEY = "templeDash.guestProfile.v1";

export function defaultProfile(): ProfileData {
  return {
    id: "guest",
    display_name: "Guest",
    high_score: 0,
    total_coins: 0,
    shield_level: 1,
    magnet_level: 1,
    speed_level: 1,
    invincibility_level: 1,
    coin_multiplier: false,
    head_start: false,
  };
}

function readLocal(): ProfileData {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultProfile();
  }
}

function writeLocal(p: ProfileData) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(p)); } catch {}
}

function clearLocal() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(LOCAL_KEY); } catch {}
}

export function mergeProfiles(local: ProfileData, cloud: ProfileData): Partial<ProfileData> {
  return {
    high_score: Math.max(local.high_score, cloud.high_score),
    total_coins: cloud.total_coins + local.total_coins,
    shield_level: Math.max(local.shield_level, cloud.shield_level),
    magnet_level: Math.max(local.magnet_level, cloud.magnet_level),
    speed_level: Math.max(local.speed_level, cloud.speed_level),
    invincibility_level: Math.max(local.invincibility_level, cloud.invincibility_level),
    coin_multiplier: local.coin_multiplier || cloud.coin_multiplier,
    head_start: local.head_start || cloud.head_start,
  };
}

export type UseProfile = {
  profile: ProfileData | undefined;
  isGuest: boolean;
  ready: boolean;
  save: (updates: Partial<ProfileData>) => Promise<void>;
};

export function useProfile(): UseProfile {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [localProfile, setLocalProfile] = useState<ProfileData>(() => readLocal());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isGuest = userId === null;
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);

  const { data: cloudProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    enabled: !!userId,
  });

  // On first cloud load after sign-in, merge any guest progress
  useEffect(() => {
    if (!userId || !cloudProfile) return;
    const local = readLocal();
    const hasLocalProgress =
      local.high_score > 0 || local.total_coins > 0 ||
      local.shield_level > 1 || local.magnet_level > 1 ||
      local.speed_level > 1 || local.invincibility_level > 1 ||
      local.coin_multiplier || local.head_start;
    if (!hasLocalProgress) return;
    const merged = mergeProfiles(local, cloudProfile);
    saveProfile({ data: merged as any }).then((updated) => {
      qc.setQueryData(["profile"], updated);
      clearLocal();
    }).catch(() => {});
  }, [userId, cloudProfile, saveProfile, qc]);

  const cloudMut = useMutation({
    mutationFn: (data: Partial<ProfileData>) => saveProfile({ data: data as any }),
    onSuccess: (data) => qc.setQueryData(["profile"], data),
  });

  const save = useCallback(async (updates: Partial<ProfileData>) => {
    if (userId) {
      await cloudMut.mutateAsync(updates);
    } else {
      const next = { ...readLocal(), ...updates };
      writeLocal(next);
      setLocalProfile(next);
    }
  }, [userId, cloudMut]);

  const profile = userId ? cloudProfile : localProfile;
  const ready = userId === null || (!!userId && !!cloudProfile);

  return { profile, isGuest, ready, save };
}
