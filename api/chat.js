export default async function handler(req, res) {
  // Configuração dos cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { mensagem, dadosPortfolio } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('ERRO: Variável GEMINI_API_KEY não configurada na Vercel.');
      return res.status(500).json({ error: 'Chave de API não encontrada no servidor.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `Você é a IA assistente oficial do portfólio de Erik Ribeiro Café.
Sua função é responder a recrutadores e visitantes sobre o perfil profissional, competências, formações e projetos do Erik.

DADOS ATUAIS DO PORTFÓLIO:
${JSON.stringify(dadosPortfolio, null, 2)}

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Responda DIRETAMENTE à pergunta feita pelo usuário. Não dê respostas genéricas nem diga apenas o que você pode responder.
2. Se o usuário perguntar pelas formações, liste as formações do Erik diretamente.
3. Se o usuário perguntar por uma tecnologia específica (ex: Flutter, Python), verifique no JSON e confirme objetivamente se ele domina/utiliza ou não essa tecnologia.
4. Mantenha um tom profissional, amigável e objetivo (no máximo 3 frases por resposta).`
            }
          ]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: mensagem }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta do Gemini:', data);
      return res.status(500).json({ error: 'Erro de comunicação com a API do Gemini.', detalhes: data });
    }

    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (respostaIA) {
      return res.status(200).json({ resposta: respostaIA });
    } else {
      return res.status(500).json({ error: 'Resposta vazia retornada pela IA.' });
    }

  } catch (erro) {
    console.error('Erro interno na Serverless Function:', erro);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
