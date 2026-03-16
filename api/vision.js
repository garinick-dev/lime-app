export const config = {
  runtime: 'edge', // Essenziale per la massima velocità e fluidità
};

export default async function handler(req) {
  // Accettiamo solo richieste POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non consentito' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Nessuna immagine fornita' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Qui entra in gioco la tua chiave segreta, prelevata in totale sicurezza dalle variabili d'ambiente di GitHub/Vercel
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("Chiave API mancante sul server!");
      return new Response(JSON.stringify({ error: 'Configurazione server mancante' }), { status: 500 });
    }

    // Chiamata diretta e pulita a OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Velocità estrema e precisione visiva
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Estrai accuratamente tutto il testo leggibile da questa immagine. Se non c'è testo rilevante, descrivi dettagliatamente cosa vedi (soggetti, colori, contesto). Restituisci SOLO il testo o la descrizione, niente saluti o introduzioni." 
              },
              { 
                type: "image_url", 
                image_url: { 
                  url: image // Inseriamo la nostra leggerissima stringa Base64
                } 
              }
            ]
          }
        ],
        max_tokens: 1000 // Un limite sicuro per evitare risposte inutilmente lunghe
      })
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      console.error("Errore da OpenAI:", errorData);
      throw new Error("Errore durante l'analisi visiva");
    }

    const data = await openAiResponse.json();
    
    // Estraiamo la risposta pulita
    const description = data.choices[0].message.content;

    // Restituiamo il testo al tuo HTML
    return new Response(JSON.stringify({ description }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Errore Backend Endpoint Vision:", error);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
