let dadosPortfolio = {};
let tecnologiaFiltroAtual = "Todos";
let categoriaAtualId = null;

/* ================= SINTETIZADOR DE SOM ================= */
let audioCtx = null;

function tocarSomHover() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}
}

/* ================= CARREGAMENTO E RENDERIZAÇÃO ================= */
async function carregarDados() {
  try {
    const resposta = await fetch('./dados.json');
    dadosPortfolio = await resposta.json();
    renderizarCategorias();
    verificarUrlHash();
  } catch (erro) {
    console.error('Erro ao carregar o JSON:', erro);
  }
}

function renderizarCategorias() {
  const container = document.getElementById('grid-categorias');
  container.innerHTML = '';

  dadosPortfolio.categorias.forEach(cat => {
    const qtdProjetos = dadosPortfolio.projetos.filter(p => p.categoriaId === cat.id).length;

    const btn = document.createElement('button');
    btn.className = 'card-categoria';
    btn.style.setProperty('--accent-color', cat.cor);
    btn.onmouseenter = tocarSomHover;
    btn.onclick = () => abrirCategoria(cat.id);

    btn.innerHTML = `
      <div class="box-icone">${cat.icone}</div>
      <span>${cat.nome}</span>
      <span class="badge-contador">${qtdProjetos}</span>
    `;
    container.appendChild(btn);
  });
}

function abrirCategoria(categoriaId, atualizarHash = true) {
  categoriaAtualId = categoriaId;
  tecnologiaFiltroAtual = "Todos";
  const categoria = dadosPortfolio.categorias.find(c => c.id === categoriaId);
  const projetosCategoria = dadosPortfolio.projetos.filter(p => p.categoriaId === categoriaId);

  if (atualizarHash) {
    window.location.hash = categoriaId;
  }

  const headerContainer = document.getElementById('header-categoria');
  headerContainer.innerHTML = `
    <div class="box-icone" style="--accent-color: ${categoria.cor}">
      ${categoria.icone}
    </div>
    <h2>${categoria.nome}</h2>
  `;

  renderizarChips(categoria, projetosCategoria);
  renderizarProjetos(categoria, projetosCategoria);

  const telaProjetos = document.getElementById('tela-projetos');
  document.getElementById('tela-menu').classList.add('hidden');
  
  telaProjetos.classList.remove('hidden');
  telaProjetos.classList.remove('fade-enter');
  void telaProjetos.offsetWidth;
  telaProjetos.classList.add('fade-enter');
}

function renderizarChips(categoria, projetos) {
  const chipsContainer = document.getElementById('container-chips');
  chipsContainer.style.setProperty('--categoria-cor', categoria.cor);
  chipsContainer.innerHTML = '';

  const listaTechs = ["Todos"];
  projetos.forEach(p => {
    if (p.tecnologias) {
      p.tecnologias.forEach(tech => {
        if (!listaTechs.includes(tech)) listaTechs.push(tech);
      });
    }
  });

  if (listaTechs.length <= 1) {
    chipsContainer.style.display = 'none';
    return;
  }

  chipsContainer.style.display = 'flex';

  listaTechs.forEach(tech => {
    const chip = document.createElement('button');
    chip.className = `chip-tech ${tech === tecnologiaFiltroAtual ? 'ativo' : ''}`;
    chip.textContent = tech;
    chip.onmouseenter = tocarSomHover;
    chip.onclick = () => {
      tecnologiaFiltroAtual = tech;
      renderizarChips(categoria, projetos);
      renderizarProjetos(categoria, projetos);
    };
    chipsContainer.appendChild(chip);
  });
}

function renderizarProjetos(categoria, projetos) {
  const gridProjetos = document.getElementById('grid-projetos');
  gridProjetos.innerHTML = '';

  const projetosFiltrados = tecnologiaFiltroAtual === "Todos" 
    ? projetos 
    : projetos.filter(p => p.tecnologias && p.tecnologias.includes(tecnologiaFiltroAtual));

  if (projetosFiltrados.length === 0) {
    gridProjetos.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhum projeto encontrado.</p>`;
    return;
  }

  projetosFiltrados.forEach((proj, index) => {
    const card = document.createElement('div');
    card.className = 'card-projeto fade-enter';
    card.style.animationDelay = `${index * 0.05}s`;
    card.style.setProperty('--categoria-cor', categoria.cor);
    card.style.setProperty('--categoria-cor-alpha', categoria.corAlpha);
    card.onmouseenter = tocarSomHover;

    const estiloCapa = proj.imagem ? `background-image: url('${proj.imagem}')` : '';

    card.innerHTML = `
      <div class="capa-projeto" style="${estiloCapa}">
        ${!proj.imagem ? categoria.icone : ''}
      </div>
      <div class="conteudo-projeto">
        <h3 class="titulo-projeto">${proj.titulo}</h3>
        <div class="tags-projeto">${proj.tags}</div>
        <p class="descricao-projeto">${proj.descricao}</p>
        
        <div class="rodape-projeto">
          <div class="badge-status">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>${proj.status}</span>
          </div>
          <button class="btn-abrir-detalhes" onclick="abrirModalProjeto(${proj.id})">
            Ver projeto &rsaquo;
          </button>
        </div>
      </div>
    `;
    gridProjetos.appendChild(card);
  });
}

/* ================= MODAIS E NAVEGAÇÃO ================= */
function abrirModalProjeto(projetoId, atualizarHash = true) {
  const projeto = dadosPortfolio.projetos.find(p => p.id === projetoId);
  if (!projeto) return;

  const categoria = dadosPortfolio.categorias.find(c => c.id === projeto.categoriaId);
  
  if (atualizarHash) {
    window.location.hash = `projeto-${projetoId}`;
  }

  const modal = document.getElementById('modal-projeto');
  const modalContent = document.getElementById('modal-content-container');
  const modalBody = document.getElementById('modal-body');

  modalContent.style.setProperty('--categoria-cor', categoria.cor);

  const detalhes = projeto.detalhes || {};
  const listaFuncs = detalhes.funcionalidades || [];

  modalBody.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-titulo">${projeto.titulo}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Status: ${projeto.status}</p>
      <div class="modal-techs">
        ${(projeto.tecnologias || []).map(t => `<span class="tag-modal">${t}</span>`).join('')}
      </div>
    </div>

    <div class="modal-secao">
      <h4>Sobre o Projeto</h4>
      <p>${detalhes.descricaoCompleta || projeto.descricao}</p>
    </div>

    ${listaFuncs.length > 0 ? `
      <div class="modal-secao">
        <h4>Principais Funcionalidades / Destaques</h4>
        <ul class="lista-funcionalidades">
          ${listaFuncs.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="modal-acoes">
      ${detalhes.github ? `
        <a href="${detalhes.github}" target="_blank" class="btn-acao-modal btn-acao-primary">
          Ver no GitHub
        </a>
      ` : ''}
      ${detalhes.demo ? `
        <a href="${detalhes.demo}" target="_blank" class="btn-acao-modal btn-acao-secondary">
          Acessar Demo
        </a>
      ` : ''}
    </div>
  `;

  modal.classList.remove('hidden');
  modalContent.scrollTop = 0;
}

function abrirModalSobreMim() {
  document.getElementById('modal-sobre-mim').classList.remove('hidden');
}

function fecharModal(idModal) {
  document.getElementById(idModal).classList.add('hidden');
  
  if (idModal === 'modal-projeto' && categoriaAtualId) {
    window.location.hash = categoriaAtualId;
  }
}

function mostrarMenu() {
  categoriaAtualId = null;
  history.pushState("", document.title, window.location.pathname + window.location.search);

  const telaMenu = document.getElementById('tela-menu');
  document.getElementById('tela-projetos').classList.add('hidden');
  
  telaMenu.classList.remove('hidden');
  telaMenu.classList.remove('fade-enter');
  void telaMenu.offsetWidth;
  telaMenu.classList.add('fade-enter');
}

function verificarUrlHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  if (hash.startsWith('projeto-')) {
    const projId = parseInt(hash.replace('projeto-', ''));
    const proj = dadosPortfolio.projetos.find(p => p.id === projId);
    if (proj) {
      abrirCategoria(proj.categoriaId, false);
      abrirModalProjeto(projId, false);
    }
  } else {
    const cat = dadosPortfolio.categorias.find(c => c.id === hash);
    if (cat) {
      abrirCategoria(hash, false);
    }
  }
}

window.onhashchange = verificarUrlHash;

window.onclick = function(event) {
  if (event.target.classList.contains('modal-overlay')) {
    const idModal = event.target.id;
    fecharModal(idModal);
  }
}

carregarDados();