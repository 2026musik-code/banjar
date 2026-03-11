// Ini adalah contoh Cloudflare Worker (Pages Function).
// File ini akan otomatis di-deploy sebagai endpoint API `/api/hello`
// di Cloudflare Pages.

export async function onRequest(context: any) {
  // Anda bisa mengakses Environment Variables (seperti GEMINI_API_KEY) melalui `context.env`
  // const apiKey = context.env.GEMINI_API_KEY;

  return new Response(
    JSON.stringify({ 
      message: "Halo dari Cloudflare Worker!",
      status: "success"
    }), 
    {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    }
  );
}
