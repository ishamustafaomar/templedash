import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in user's account and all associated data.
 * Required by Apple Guideline 5.1.1(v) and Google Play "Data deletion" policy.
 *
 * Deletes the auth.users row, which cascades to public.profiles and
 * public.coin_purchases via their foreign keys.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort: explicitly remove app data first so we never leave orphans
    // even if FK cascade isn't configured on every table.
    await supabaseAdmin.from("coin_purchases").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
