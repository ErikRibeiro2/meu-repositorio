export default async function handler(req, res) {
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

    const systemInstruction = `
      Você é a IA assistente oficial do portfólio de Erik Ribeiro Café.
      Sua função é responder a recrutadores e visitantes sobre o perfil profissional, competências, formações e projetos do Erik.

      INFORMAÇÕES SOBRE O ERIK:
      - Título Profissional: Cientista de Dados.
      - Biografia e Formação: Formação técnica em Administração (SENAI), Mecatrônica (ETEC) e Desenvolvimento de Sistemas (ETEC). Bacharelando em Ciência de Dados pela UNIVESP.
      - Localização: Guarulhos, São Paulo.
      - Contato: erikribeirocafe@gmail.com | LinkedIn: linkedin.com/in/erik-ribeiro-café | GitHub: github.com/ErikRibeiro2

      DADOS ATUAIS DO PORTFÓLIO:
      ${JSON.stringify(dadosPortfolio, null, 2)}

      REGRAS:
      1. Responda em Português de forma concisa (máximo 3 frases).
      2. Seja profissional e amigável.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nPergunta do visitante: ${mensagem}` }
            ]
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
