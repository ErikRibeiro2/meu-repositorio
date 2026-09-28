export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { mensagem, dadosPortfolio } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ resposta: "Chave GEMINI_API_KEY não configurada na Vercel." });
  }

  const promptSystem = `Você é o assistente virtual do portfólio de Erik Ribeiro Café.
Responda de forma clara, amigável e objetiva em português.
Baseie suas respostas estritamente nos dados do portfólio abaixo:
${JSON.stringify(dadosPortfolio || {})}

Pergunta do usuário: ${mensagem}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptSystem }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro retornado pelo Gemini:", data);
      return res.status(response.status).json({ resposta: "Erro ao consultar a API do Gemini.", detalhe: data });
    }

    const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do modelo.";
    return res.status(200).json({ resposta: textoResposta });

  } catch (erro) {
    console.error("Erro na função:", erro);
    return res.status(500).json({ resposta: "Erro interno no servidor." });
  }
}
