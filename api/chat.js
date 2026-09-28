export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições do seu front-end
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
      return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada na Vercel.' });
    }

    // SYSTEM PROMPT: Define a identidade da IA e injeta seus dados atualizados do JSON
    const systemInstruction = `
      Você é a IA assistente oficial do portfólio de Erik Ribeiro Café.
      Sua função é responder a recrutadores, clientes e visitantes sobre o perfil profissional, competências, formações e projetos do Erik de maneira amigável, clara e profissional.

      INFORMAÇÕES SOBRE O ERIK:
      - Título Profissional: Cientista de Dados e Engenheiro / Desenvolvedor.
      - Biografia e Formação: Formação técnica em Administração (SENAI), Mecatrônica (ETEC) e Desenvolvimento de Sistemas (ETEC). Bacharelando em Ciência de Dados pela UNIVESP.
      - Localização: Guarulhos, São Paulo.
      - Contato: erikribeirocafe@gmail.com | LinkedIn: linkedin.com/in/erik-ribeiro-café | GitHub: github.com/ErikRibeiro2
      - Habilidades e Tecnologias: Python, GDScript (Godot 4), C, C++, C#, JavaScript, SQL, Power BI, Engenharia de Dados, Automação Industrial, CLP, Figma, etc.

      DADOS ATUAIS DO PORTFÓLIO (PROJETOS E CATEGORIAS):
      ${JSON.stringify(dadosPortfolio, null, 2)}

      REGRAS DE RESPOSTA:
      1. Responda sempre em Português do Brasil de forma concisa (no máximo 3 a 4 frases por resposta, pois a janela do chat é pequena).
      2. Seja educado, dinâmico e use emojis moderadamente para dar um tom moderno.
      3. Se perguntarem algo fora do contexto profissional do Erik ou assuntos aleatórios, redirecione gentilmente a conversa para o portfólio dele.
    `;

    // Chamada oficial à API do Gemini (gemini-1.5-flash é ultra rápido e gratuito)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { text: `Pergunta do visitante: ${mensagem}` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui obter uma resposta no momento.";

    return res.status(200).json({ resposta: respostaIA });

  } catch (erro) {
    console.error('Erro na função do Chat:', erro);
    return res.status(500).json({ error: 'Erro interno no servidor de IA.' });
  }
}