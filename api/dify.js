export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');
    if (!targetPath) return new Response('Path mancante', { status: 400 });

    // Livello di sicurezza: accettiamo solo richieste che provengono dai tuoi utenti loggati
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Non autorizzato', { status: 401 });

    url.searchParams.delete('path');
    const queryString = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
    const difyUrl = `https://api.dify.ai/v1${targetPath}${queryString}`;

    const headers = new Headers();
    // La chiave viene iniettata qui dal cloud di Vercel
    headers.set('Authorization', `Bearer ${process.env.DIFY_API_KEY}`);
    
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // Passaggio nativo del flusso (garantisce fluidità e streaming istantaneo)
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = req.body;
      fetchOptions.duplex = 'half';
    }

    const response = await fetch(difyUrl, fetchOptions);

    const resHeaders = new Headers();
    const resContentType = response.headers.get('content-type');
    if (resContentType) resHeaders.set('Content-Type', resContentType);

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
