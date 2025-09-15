// Local IDE type shims for Deno-based Supabase Edge Functions.
// These silence Node/TS server errors in editors that don't understand Deno imports.
// Not used at runtime (Deno provides real types at deploy/run time).

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    opts?: { port?: number }
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.56.0" {
  export * from "@supabase/supabase-js";
}

// Minimal Deno env shim for IDE type checking
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
