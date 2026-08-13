// netlify/functions/keep-alive.js
export default async () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  try {
    const res = await fetch(
      `${url}/rest/v1/keep_alive?select=id&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Keep-alive KO:", res.status, await res.text());
      return new Response("error", { status: 500 });
    }

    console.log("Keep-alive OK", new Date().toISOString());
    return new Response("ok");
  } catch (err) {
    console.error("Keep-alive exception:", err);
    return new Response("error", { status: 500 });
  }
};

export const config = {
  schedule: "0 6 * * 1,3,5", // lun/mer/ven à 6h UTC
};