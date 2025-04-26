/**
 * MapaInterativo - Classe principal para o mapa de delegacias
 */
class MapaInterativo {
    constructor() {
      // Configurações iniciais
      this.config = {
        mapa: {
          centro: [-15.7889, -47.8798], // Centro do Brasil
          zoomInicial: 4,
          zoomMin: 3,
          zoomMax: 18,
          tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          atribuicao: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        },
        api: {
          url: 'data/delegacias.json',
          cache: 30 * 60 * 1000 // 30 minutos de cache
        },
        icones: {
          delegacia: {
            url: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
            tamanho: [32, 32],
            ancoraPopup: [0, -15]
          },
          centro: {
            url: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
            tamanho: [32, 32],
            ancoraPopup: [0, -15]
          }
        }
      };
  
      // Estado da aplicação
      this.estado = {
        marcadores: [],
        ultimaAtualizacao: null,
        dadosCarregados: false,
        filtroAtivo: 'all'
      };
  
      // Elementos DOM
      this.dom = {
        mapa: document.getElementById('map'),
        listaLocais: document.getElementById('lista-delegacias'),
        inputBusca: document.getElementById('search-input'),
        btnBusca: document.querySelector('.search-btn'),
        botoesFiltro: document.querySelectorAll('.filter-btn'),
        dataAtualizacao: document.getElementById('update-date')
      };
  
      // Inicializa o mapa
      this.iniciar();
    }
  
    // Inicializa o mapa e configura eventos
    async iniciar() {
      this.criarMapa();
      this.configurarEventos();
      await this.carregarDados();
      this.atualizarData();
    }
  
    // Cria a instância do mapa Leaflet
    criarMapa() {
      this.mapa = L.map('map', {
        center: this.config.mapa.centro,
        zoom: this.config.mapa.zoomInicial,
        minZoom: this.config.mapa.zoomMin,
        maxZoom: this.config.mapa.zoomMax
      });
  
      L.tileLayer(this.config.mapa.tileLayer, {
        attribution: this.config.mapa.atribuicao,
        maxZoom: this.config.mapa.zoomMax
      }).addTo(this.mapa);
  
      // Cria ícones personalizados
      this.icones = {
        delegacia: L.icon({
          iconUrl: this.config.icones.delegacia.url,
          iconSize: this.config.icones.delegacia.tamanho,
          popupAnchor: this.config.icones.delegacia.ancoraPopup
        }),
        centro: L.icon({
          iconUrl: this.config.icones.centro.url,
          iconSize: this.config.icones.centro.tamanho,
          popupAnchor: this.config.icones.centro.ancoraPopup
        })
      };
    }
  
    // Configura todos os listeners de eventos
    configurarEventos() {
      // Busca por localização
      this.dom.btnBusca.addEventListener('click', () => this.filtrarLocais());
      this.dom.inputBusca.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.filtrarLocais();
      });
  
      // Filtros por tipo
      this.dom.botoesFiltro.forEach(botao => {
        botao.addEventListener('click', () => {
          this.dom.botoesFiltro.forEach(b => b.classList.remove('active'));
          botao.classList.add('active');
          this.estado.filtroAtivo = botao.dataset.filter;
          this.filtrarLocais();
        });
      });
  
      // Botão de reportar erro
      document.querySelector('[href="#"]').addEventListener('click', (e) => {
        e.preventDefault();
        this.reportarErro();
      });
    }
  
    // Carrega os dados das localizações
    async carregarDados() {
      try {
        this.mostrarCarregamento();
        
        // Verifica se há cache válido
        const cache = this.verificarCache();
        if (cache) {
          this.processarDados(cache);
          return;
        }
  
        const response = await fetch(this.config.api.url);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP! Status: ${response.status}`);
        }
        
        const dados = await response.json();
        this.processarDados(dados);
        this.salvarCache(dados);
        
      } catch (erro) {
        console.error('Erro ao carregar localizações:', erro);
        this.mostrarErro();
      }
    }
  
    // Processa os dados recebidos da API
    processarDados(dados) {
      if (!dados || !Array.isArray(dados)) {
        throw new Error('Dados inválidos recebidos');
      }
  
      this.estado.dados = dados;
      this.estado.dadosCarregados = true;
      this.estado.ultimaAtualizacao = new Date();
      
      this.renderizarLocais(dados);
    }
  
    // Renderiza os locais no mapa e na lista
    renderizarLocais(locais) {
      this.limparMarcadores();
      this.limparLista();
  
      if (!locais || locais.length === 0) {
        this.mostrarEstadoVazio();
        return;
      }
  
      locais.forEach(local => {
        this.adicionarMarcador(local);
        this.adicionarItemLista(local);
      });
  
      this.ajustarVisualizacao();
    }
  
    // Adiciona marcador ao mapa
    adicionarMarcador(local) {
      const icone = local.tipo === 'delegacia' ? this.icones.delegacia : this.icones.centro;
      const marcador = L.marker([local.lat, local.lng], { icon: icone }).addTo(this.mapa);
      
      marcador.bindPopup(this.criarConteudoPopup(local));
      this.estado.marcadores.push(marcador);
    }
  
    // Adiciona item à lista
    adicionarItemLista(local) {
      const item = document.createElement('div');
      item.className = `card ${local.tipo}`;
      item.innerHTML = `
        <h3>${this.sanitizarHTML(local.nome)}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${this.sanitizarHTML(local.endereco)}</p>
        <div class="location-meta">
          <span><i class="fas fa-phone"></i> ${local.telefone || 'N/A'}</span>
          <span><i class="fas fa-clock"></i> ${local.horarioFuncionamento || 'N/A'}</span>
        </div>
        <button class="btn-direction" data-lat="${local.lat}" data-lng="${local.lng}">
          <i class="fas fa-directions"></i> Como chegar
        </button>
      `;
      
      item.querySelector('.btn-direction').addEventListener('click', (e) => {
        const { lat, lng } = e.currentTarget.dataset;
        this.mostrarRota(lat, lng);
      });
      
      this.dom.listaLocais.appendChild(item);
    }
  
    // Cria conteúdo do popup
    criarConteudoPopup(local) {
      return `
        <div class="map-popup">
          <h4>${this.sanitizarHTML(local.nome)}</h4>
          <p><i class="fas fa-map-marker-alt"></i> ${this.sanitizarHTML(local.endereco)}</p>
          <p><i class="fas fa-phone"></i> ${local.telefone || 'N/A'}</p>
          <p><i class="fas fa-clock"></i> ${local.horarioFuncionamento || 'N/A'}</p>
          <button class="btn-popup-direction" data-lat="${local.lat}" data-lng="${local.lng}">
            <i class="fas fa-directions"></i> Rotas
          </button>
        </div>
      `;
    }
  
    // Filtra locais por busca e tipo
    filtrarLocais() {
      if (!this.estado.dadosCarregados) return;
  
      const termoBusca = this.dom.inputBusca.value.toLowerCase();
      const filtro = this.estado.filtroAtivo;
  
      const locaisFiltrados = this.estado.dados.filter(local => {
        const correspondeBusca = 
          local.nome.toLowerCase().includes(termoBusca) || 
          local.cidade?.toLowerCase().includes(termoBusca) ||
          local.endereco.toLowerCase().includes(termoBusca);
        
        const correspondeFiltro = 
          filtro === 'all' || local.tipo === filtro;
        
        return correspondeBusca && correspondeFiltro;
      });
  
      this.renderizarLocais(locaisFiltrados);
    }
  
    // Mostra rota no Google Maps
    mostrarRota(lat, lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  
    // Ajusta a visualização para mostrar todos os marcadores
    ajustarVisualizacao() {
      if (this.estado.marcadores.length > 0) {
        const grupo = new L.featureGroup(this.estado.marcadores);
        this.mapa.fitBounds(grupo.getBounds().pad(0.2));
      }
    }
  
    // Limpa todos os marcadores
    limparMarcadores() {
      this.estado.marcadores.forEach(marker => this.mapa.removeLayer(marker));
      this.estado.marcadores = [];
    }
  
    // Limpa a lista de locais
    limparLista() {
      this.dom.listaLocais.innerHTML = '';
    }
  
    // Atualiza a data de atualização no footer
    atualizarData() {
      if (this.estado.ultimaAtualizacao) {
        const options = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        this.dom.dataAtualizacao.textContent = 
          this.estado.ultimaAtualizacao.toLocaleDateString('pt-BR', options);
      }
    }
  
    // Mostra estado de carregamento
    mostrarCarregamento() {
      this.dom.listaLocais.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i> Carregando...
        </div>
      `;
    }
  
    // Mostra estado vazio (sem resultados)
    mostrarEstadoVazio() {
      this.dom.listaLocais.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-info-circle"></i>
          <p>Nenhum local encontrado</p>
        </div>
      `;
    }
  
    // Mostra mensagem de erro
    mostrarErro() {
      this.dom.listaLocais.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i> Não foi possível carregar os dados
          <button class="btn-retry">Tentar novamente</button>
        </div>
      `;
      
      this.dom.listaLocais.querySelector('.btn-retry').addEventListener('click', () => {
        this.carregarDados();
      });
    }
  
    // Gerencia cache local
    verificarCache() {
      const cache = localStorage.getItem('delegaciasCache');
      if (!cache) return null;
      
      const { dados, timestamp } = JSON.parse(cache);
      const agora = new Date().getTime();
      
      if (agora - timestamp < this.config.api.cache) {
        return dados;
      }
      
      return null;
    }
  
    salvarCache(dados) {
      const cache = {
        dados,
        timestamp: new Date().getTime()
      };
      
      localStorage.setItem('delegaciasCache', JSON.stringify(cache));
    }
  
    // Função para reportar erro
    reportarErro() {
      const email = 'suporte@segurancafeminina.com.br';
      const assunto = 'Reportar erro no mapa';
      const corpo = `Descreva o erro encontrado:\n\nLocal afetado:\nProblema encontrado:\n`;
      
      window.open(`mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
    }
  
    // Sanitiza HTML para prevenir XSS
    sanitizarHTML(texto) {
      if (!texto) return '';
      return texto.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }
  
  // Inicializa o mapa quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    new MapaInterativo();
  });


