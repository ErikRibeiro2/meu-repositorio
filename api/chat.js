export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { mensagem, dadosPortfolio } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERRO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
    return res.status(500).json({ resposta: "Chave de API não configurada no servidor." });
  }

  const promptSystem = `Você é o assistente virtual do portfólio de Erik Ribeiro Café.
Responda de forma clara, amigável e objetiva em português.
Baseie suas respostas estritamente nos dados do portfólio abaixo:
${JSON.stringify(dadosPortfolio || {})}

Pergunta do usuário: ${mensagem}`;

  try {
    // Usando o modelo v1beta com o parâmetro de chave correto
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptSystem }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da API Gemini:", JSON.stringify(data));
      return res.status(response.status).json({ 
        resposta: "Tive um problema ao consultar as informações da IA.",
        detalhe: data.error?.message || "Erro de requisição" 
      });
    }

    const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoResposta) {
      return res.status(200).json({ resposta: "Não encontrei detalhes sobre isso no portfólio do Erik." });
    }

    return res.status(200).json({ resposta: textoResposta });

  } catch (erro) {
    console.error("Erro interno na função serverless:", erro);
    return res.status(500).json({ resposta: "Erro interno no servidor ao conectar com a IA." });
  }
}
