/* ================= LÓGICA DO CHATBOT DE IA ================= */
function toggleChatWindow() {
  const chatWin = document.getElementById('chat-window');
  chatWin.classList.toggle('hidden');
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    enviarMensagem();
  }
}

function enviarPerguntaPronta(pergunta) {
  document.getElementById('chat-input').value = pergunta;
  enviarMensagem();
}

function formatarMarkdown(texto) {
  if (!texto) return '';
  const textoEscapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return textoEscapado
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*\*\s+/gm, '• ');
}

async function enviarMensagem() {
  const input = document.getElementById('chat-input');
  const msgTexto = input.value.trim();
  if (!msgTexto) return;

  const chatMsgContainer = document.getElementById('chat-messages');

  // 1. Mensagem do usuário
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-msg chat-msg-user';
  userBubble.textContent = msgTexto;
  chatMsgContainer.appendChild(userBubble);

  input.value = '';
  chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;

  // 2. Indicador de carregamento
  const botTypingBubble = document.createElement('div');
  botTypingBubble.className = 'chat-msg chat-msg-bot';
  botTypingBubble.textContent = 'Pensando...';
  chatMsgContainer.appendChild(botTypingBubble);
  chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagem: msgTexto,
        dadosPortfolio: dadosPortfolio
      })
    });

    const data = await response.json();
    
    if (response.ok && data.resposta) {
      botTypingBubble.innerHTML = formatarMarkdown(data.resposta);
    } else {
      console.error('Erro retornado pela API:', data);
      botTypingBubble.textContent = 'Desculpe, tive um problema ao consultar as informações. Tente novamente em instantes!';
    }
  } catch (erro) {
    console.error('Erro de conexão:', erro);
    botTypingBubble.textContent = 'Erro de conexão com o servidor. Verifique sua rede.';
  }

  chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
}