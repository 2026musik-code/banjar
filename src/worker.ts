interface Env {
  datauser: any; // R2Bucket
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route: /api/hello
    if (url.pathname === '/api/hello') {
      return new Response("Hello from Cloudflare Worker!");
    }

    // Route: /api/keys
    if (url.pathname === '/api/keys') {
      if (request.method === 'GET') {
        try {
          const obj = await env.datauser.get('api_keys.json');
          if (!obj) {
            return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(obj.body, { headers: { 'Content-Type': 'application/json' } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      if (request.method === 'POST') {
        try {
          const { key, name } = await request.json() as { key: string, name: string };
          
          if (!key) {
            return new Response(JSON.stringify({ error: 'API Key is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          let keys = [];
          const obj = await env.datauser.get('api_keys.json');
          if (obj) {
            keys = await obj.json();
          }
          
          const newKey = { 
            id: Date.now().toString(), 
            key, 
            name: name || 'Unnamed Key',
            createdAt: new Date().toISOString()
          };
          
          keys.push(newKey);
          
          await env.datauser.put('api_keys.json', JSON.stringify(keys));
          
          return new Response(JSON.stringify(newKey), { headers: { 'Content-Type': 'application/json' } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      if (request.method === 'DELETE') {
        try {
          const { id } = await request.json() as { id: string };
          
          if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          let keys = [];
          const obj = await env.datauser.get('api_keys.json');
          if (obj) {
            keys = await obj.json();
          }
          
          keys = keys.filter((k: any) => k.id !== id);
          await env.datauser.put('api_keys.json', JSON.stringify(keys));
          
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
    }

    // Fallback for unknown API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response("Not Found", { status: 404 });
    }

    // For all other requests, serve the static assets
    try {
      // First try to fetch the exact asset (e.g., /assets/index.js)
      let response = await env.ASSETS.fetch(request);
      
      // If asset not found (e.g., /chat or /settings), serve index.html for SPA routing
      if (response.status === 404) {
        response = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
      }
      
      return response;
    } catch (e) {
      return new Response("Not Found", { status: 404 });
    }
  }
};
