import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set((Deno.env.get("BADMINTON_ALLOWED_ORIGINS") || "https://badminkton.netlify.app,https://scaniagotaxi.github.io").split(",").map(s => s.trim()).filter(Boolean));
const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  });
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.has(origin)) return reply(403, {ok:false,error:"Webbplatsen är inte tillåten."});
  if (req.method === "OPTIONS") return new Response(null, {status:204,headers});
  if (req.method !== "POST") return reply(405, {ok:false,error:"Använd POST."});
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const redirectTo = Deno.env.get("BADMINTON_INVITE_REDIRECT_URL");
    if (!url || !key || !redirectTo || new URL(redirectTo).protocol !== "https:") return reply(503,{ok:false,error:"Serverns inbjudningsinställningar saknas."});
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return reply(401,{ok:false,error:"Logga in som Super Admin."});
    const admin = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:identity,error:authError} = await admin.auth.getUser(token);
    if (authError || !identity?.user) return reply(401,{ok:false,error:"Inloggningen är ogiltig. Logga in igen."});
    const {data:role,error:roleError} = await admin.from("badminton_admins").select("role").eq("user_id",identity.user.id).maybeSingle();
    if (roleError) return reply(503,{ok:false,error:"Behörigheten kunde inte kontrolleras."});
    if (role?.role !== "super_admin") return reply(403,{ok:false,error:"Endast Super Admin får bjuda in."});
    let body;
    try { body = await req.json(); } catch { return reply(400,{ok:false,error:"Ogiltig begäran."}); }
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400,{ok:false,error:"Ange en giltig e-postadress."});
    const {data:invited,error:inviteError} = await admin.auth.admin.inviteUserByEmail(email,{redirectTo});
    if (inviteError || !invited?.user) return reply(400,{ok:false,error:"Inbjudan kunde inte skickas. Kontot kan redan finnas eller e-posttjänsten kan ha begränsat utskicken."});
    // Insert only: never overwrite an existing role or downgrade a Super Admin.
    const {error:saveError} = await admin.from("badminton_admins").upsert(
      {user_id:invited.user.id,role:"admin"},
      {onConflict:"user_id",ignoreDuplicates:true}
    );
    if (saveError) return reply(500,{ok:false,error:"Inbjudningsmejlet skickades, men Admin-behörigheten kunde inte sparas. Kontrollera badminton_admins innan en ny inbjudan skickas."});
    return reply(200,{ok:true});
  } catch {
    return reply(500,{ok:false,error:"Serverfel vid inbjudan. Kontrollera funktionens loggar i Supabase."});
  }
};
Deno.serve(handler);
