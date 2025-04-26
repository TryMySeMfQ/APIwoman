/**
 * Aplicação de Segurança Feminina - Versão Corrigida
 * Controles completos para a página de segurança feminina
 */
class SegurancaFemininaApp {
    constructor() {
      // Configurações da API
      this.config = {
        apiBaseUrl: '/api',
        endpoints: {
          contatos: '/contatos-emergencia',
          dicas: '/dicas-seguranca'
        }
      };
  
      // Seleciona elementos DOM corretamente
      this.dom = {
        btnCarregarContatos: document.querySelector('.emergency-contacts .btn'),
        btnCarregarDicas: document.querySelector('.safety-tips .btn'),
        btnCompartilharLocal: document.querySelector('.action-btn:nth-child(1)'),
        btnProtocolo: document.querySelector('.action-btn:nth-child(2)'),
        btnMapa: document.querySelector('.btn-map'),
        contatosList: document.getElementById('contatos-list'),
        dicasList: document.getElementById('dicas-list')
      };
  
      // Inicia a aplicação
      this.iniciar();
    }
  
    iniciar() {
      this.configurarEventos();
      this.carregarDadosIniciais();
    }
  
    configurarEventos() {
      // Remove event handlers inline para evitar conflitos
      this.dom.btnCarregarContatos.removeAttribute('onclick');
      this.dom.btnCarregarDicas.removeAttribute('onclick');
      this.dom.btnCompartilharLocal.removeAttribute('onclick');
      this.dom.btnProtocolo.removeAttribute('onclick');
  
      // Configura os event listeners corretamente
      this.dom.btnCarregarContatos.addEventListener('click', () => this.carregarContatos());
      this.dom.btnCarregarDicas.addEventListener('click', () => this.carregarDicas());
      this.dom.btnCompartilharLocal.addEventListener('click', () => this.compartilharLocalizacao());
      this.dom.btnProtocolo.addEventListener('click', () => this.mostrarProtocolo());
      this.dom.btnMapa.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/legado';
      });
  
      // Configura delegação de eventos para elementos dinâmicos
      document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-ligar')) {
          const numero = e.target.closest('.btn-ligar').dataset.numero;
          this.ligarPara(numero);
        }
        
        if (e.target.closest('.btn-compartilhar')) {
          const texto = e.target.closest('.btn-compartilhar').dataset.texto;
          this.compartilharConteudo(texto);
        }
      });
    }
  
    async carregarDadosIniciais() {
      try {
        await Promise.all([
          this.carregarContatos(),
          this.carregarDicas()
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    }
  
    async carregarContatos() {
      const btn = this.dom.btnCarregarContatos;
      const lista = this.dom.contatosList;
      
      try {
        btn.disabled = true;
        this.mostrarCarregamento(lista);
        
        const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.contatos}`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const contatos = await response.json();
        this.exibirContatos(contatos);
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        this.mostrarErro(lista, "Falha ao carregar contatos. Tente novamente.");
      } finally {
        btn.disabled = false;
      }
    }
  
    exibirContatos(contatos) {
      const lista = this.dom.contatosList;
      
      if (!contatos || contatos.length === 0) {
        lista.innerHTML = `
          <div class="sem-dados">
            <i class="fas fa-info-circle"></i>
            <p>Nenhum contato disponível</p>
          </div>
        `;
        return;
      }
  
      lista.innerHTML = contatos.map(contato => `
        <div class="contato-item">
          <div class="contato-header">
            <i class="fas fa-phone-alt"></i>
            <h3>${this.sanitizarHTML(contato.nome)}</h3>
          </div>
          <div class="contato-body">
            <p><strong>Telefone:</strong> ${this.sanitizarHTML(contato.telefone)}</p>
            <p>${this.sanitizarHTML(contato.descricao)}</p>
            <div class="contato-actions">
              <button class="btn-ligar" data-numero="${this.sanitizarHTML(contato.telefone)}">
                <i class="fas fa-phone"></i> Ligar
              </button>
              <button class="btn-compartilhar" 
                      data-texto="${this.sanitizarHTML(`${contato.nome}: ${contato.telefone} - ${contato.descricao}`)}">
                <i class="fas fa-share-alt"></i> Compartilhar
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  
    async carregarDicas() {
      const btn = this.dom.btnCarregarDicas;
      const lista = this.dom.dicasList;
      
      try {
        btn.disabled = true;
        this.mostrarCarregamento(lista);
        
        const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.dicas}`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const dicas = await response.json();
        this.exibirDicas(dicas);
      } catch (error) {
        console.error("Erro ao carregar dicas:", error);
        this.mostrarErro(lista, "Falha ao carregar dicas. Tente novamente.");
      } finally {
        btn.disabled = false;
      }
    }
  
    exibirDicas(dicas) {
      const lista = this.dom.dicasList;
      
      if (!dicas || dicas.length === 0) {
        lista.innerHTML = `
          <div class="sem-dados">
            <i class="fas fa-info-circle"></i>
            <p>Nenhuma dica disponível</p>
          </div>
        `;
        return;
      }
  
      lista.innerHTML = dicas.map(dica => `
        <li class="dica-item">
          <i class="fas fa-check-circle"></i>
          <span>${this.sanitizarHTML(dica)}</span>
          <button class="btn-compartilhar" data-texto="${this.sanitizarHTML(dica)}">
            <i class="fas fa-share-alt"></i>
          </button>
        </li>
      `).join('');
    }
  
    async compartilharLocalizacao() {
      const btn = this.dom.btnCompartilharLocal;
      
      try {
        btn.disabled = true;
        
        if (!navigator.geolocation) {
          throw new Error("Geolocalização não suportada");
        }
  
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
  
        const { latitude, longitude } = position.coords;
        const mapaUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        if (navigator.share) {
          await navigator.share({
            title: 'Minha Localização',
            text: 'Estou compartilhando minha localização por segurança',
            url: mapaUrl
          });
        } else {
          prompt('Copie para compartilhar sua localização:', mapaUrl);
        }
      } catch (error) {
        console.error("Erro ao compartilhar localização:", error);
        alert("Não foi possível compartilhar a localização. Verifique as permissões.");
      } finally {
        btn.disabled = false;
      }
    }
  
    mostrarProtocolo() {
      const passos = [
        "Mantenha a calma e avalie a situação",
        "Ligue para o número de emergência local (190)",
        "Compartilhe sua localização com contatos de confiança",
        "Se possível, vá para um local público e movimentado",
        "Use seu aplicativo de segurança, se disponível"
      ];
  
      const modalContent = `
        <div class="modal-content">
          <h3><i class="fas fa-first-aid"></i> Protocolo de Emergência</h3>
          <ol>
            ${passos.map(passo => `<li>${passo}</li>`).join('')}
          </ol>
          <button class="btn-fechar-modal">Fechar</button>
        </div>
      `;
  
      this.exibirModal('Protocolo de Emergência', modalContent);
    }
  
    ligarPara(numero) {
      if (!numero) return;
      
      const numeroLimpo = numero.replace(/\D/g, '');
      console.log(`Simulando chamada para: ${numeroLimpo}`);
      alert(`Chamando: ${numeroLimpo}\n(Simulação - em um dispositivo real iniciaria a chamada)`);
    }
  
    async compartilharConteudo(texto) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Informação de Segurança',
            text: texto
          });
        } else {
          prompt('Copie para compartilhar:', texto);
        }
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
      }
    }
  
    // Métodos auxiliares
    mostrarCarregamento(elemento) {
      elemento.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i> Carregando...
        </div>
      `;
    }
  
    mostrarErro(elemento, mensagem) {
      elemento.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i> ${mensagem}
          <button class="btn-tentar-novamente">Tentar Novamente</button>
        </div>
      `;
      
      elemento.querySelector('.btn-tentar-novamente').addEventListener('click', () => {
        if (elemento === this.dom.contatosList) {
          this.carregarContatos();
        } else {
          this.carregarDicas();
        }
      });
    }
  
    exibirModal(titulo, conteudo) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h2>${titulo}</h2>
            <button class="btn-fechar-modal">&times;</button>
          </div>
          <div class="modal-body">
            ${conteudo}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const fecharModal = () => modal.remove();
      modal.querySelector('.btn-fechar-modal').addEventListener('click', fecharModal);
      modal.addEventListener('click', (e) => e.target === modal && fecharModal());
      document.addEventListener('keydown', (e) => e.key === 'Escape' && fecharModal());
    }
  
    sanitizarHTML(texto) {
      return texto.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }
  
  // Inicializa a aplicação
  document.addEventListener('DOMContentLoaded', () => {
    new SegurancaFemininaApp();
  });
  
  // Funções globais de compatibilidade (podem ser removidas posteriormente)
  function fetchContatos() {
    const app = new SegurancaFemininaApp();
    app.carregarContatos();
  }
  
  function fetchDicas() {
    const app = new SegurancaFemininaApp();
    app.carregarDicas();
  }
  
  function shareLocation() {
    const app = new SegurancaFemininaApp();
    app.compartilharLocalizacao();
  }
  
  function showEmergencyProtocol() {
    const app = new SegurancaFemininaApp();
    app.mostrarProtocolo();
  }