// MichiHub - Edge Function de PRUEBA: enviar-push-prueba
// Aislada de la función real "enviar-push". Manda un push a todas las
// suscripciones guardadas en push_prueba_suscripciones, sin tocar nada
// de mensajes/publicaciones.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

webpush.setVapidDetails("mailto:michihub@hotmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try{
    const payload = await req.json();
    const mensaje = (payload.record && payload.record.mensaje) || payload.mensaje || "Prueba de MichiHub";

    const { data: suscripciones, error } = await supabase
      .from("push_prueba_suscripciones")
      .select("endpoint,p256dh,auth");
    if(error) throw error;

    const payloadPush = JSON.stringify({ title: "🐱 Prueba MichiHub", body: mensaje, url: "./push-test.html" });

    const resultados = await Promise.allSettled((suscripciones || []).map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payloadPush
      )
    ));

    return new Response(JSON.stringify({ intentados: resultados.length }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  }catch(err){
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
});
