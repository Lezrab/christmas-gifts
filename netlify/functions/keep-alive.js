// netlify/functions/keep-alive.js
export default async () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_KEY;

  try {
    const res = await fetch(`${url}/rest/v1/keep_alive`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ pinged_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      console.error("Keep-alive KO:", res.status, await res.text());
      return new Response("error", { status: 500 });
    }

    console.log("Keep-alive OK — ligne ajoutée", new Date().toISOString());
    return new Response("ok");
  } catch (err) {
    console.error("Keep-alive exception:", err);
    return new Response("error", { status: 500 });
  }
};

export const config = {
  schedule: "0 6 * * 1,3,5",
};