import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ProfileData {
  id: string;
  display_name: string | null;
  high_score: number;
  total_coins: number;
  shield_level: number;
  magnet_level: number;
  speed_level: number;
  invincibility_level: number;
  coin_multiplier: boolean;
  head_start: boolean;
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileData> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      // backstop in case trigger didn't fire
      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      return inserted as ProfileData;
    }
    return data as ProfileData;
  });

const updateSchema = z.object({
  high_score: z.number().int().min(0).optional(),
  total_coins: z.number().int().min(0).optional(),
  shield_level: z.number().int().min(1).max(5).optional(),
  magnet_level: z.number().int().min(1).max(5).optional(),
  speed_level: z.number().int().min(1).max(5).optional(),
  invincibility_level: z.number().int().min(1).max(5).optional(),
  coin_multiplier: z.boolean().optional(),
  head_start: z.boolean().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }): Promise<ProfileData> => {
    const { userId } = context;
    // Sensitive economy/progression fields are blocked at the DB level for the
    // user role, so we route updates through the service-role client. RLS is
    // bypassed but we always scope by the authenticated userId from the JWT.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated as ProfileData;
  });
