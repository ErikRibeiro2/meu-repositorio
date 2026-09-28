export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { mensagem, dadosPortfolio } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERRO: GEMINI_API_KEY não configurada.");
    return res.status(500).json({ resposta: "Erro de configuração: Chave da API ausente no servidor." });
  }

  const promptSystem = `Você é o assistente virtual do portfólio de Erik Ribeiro Café.
Responda de forma clara, amigável e concisa em português.
Baseie suas respostas estritamente nos dados do portfólio abaixo:
${JSON.stringify(dadosPortfolio || {})}

Pergunta do usuário: ${mensagem}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptSystem }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro retornado pelo Gemini:", data);
      return res.status(response.status).json({ resposta: "Erro ao processar resposta no modelo de IA." });
    }

    const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui encontrar uma resposta adequada.";
    return res.status(200).json({ resposta: textoResposta });

  } catch (erro) {
    console.error("Erro interno no servidor:", erro);
    return res.status(500).json({ resposta: "Erro interno no servidor de chat." });
  }
}
