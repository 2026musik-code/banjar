interface Env {
  datauser: any; // R2Bucket
}

export async function onRequestGet(context: { env: Env }) {
  try {
    const obj = await context.env.datauser.get('api_keys.json');
    if (!obj) {
      return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(obj.body, { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost(context: { request: Request, env: Env }) {
  try {
    const { key, name } = await context.request.json() as { key: string, name: string };
    
    if (!key) {
      return new Response(JSON.stringify({ error: 'API Key is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let keys = [];
    const obj = await context.env.datauser.get('api_keys.json');
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
    
    await context.env.datauser.put('api_keys.json', JSON.stringify(keys));
    
    return new Response(JSON.stringify(newKey), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestDelete(context: { request: Request, env: Env }) {
  try {
    const { id } = await context.request.json() as { id: string };
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let keys = [];
    const obj = await context.env.datauser.get('api_keys.json');
    if (obj) {
      keys = await obj.json();
    }
    
    keys = keys.filter((k: any) => k.id !== id);
    await context.env.datauser.put('api_keys.json', JSON.stringify(keys));
    
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
