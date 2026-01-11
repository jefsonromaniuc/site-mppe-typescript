/**
 * Map Interactions - Versão Original Completa (TypeScript)
 * Integração correta com zoom-controls.js para funcionalidades completas
 */

class MapInteractionsOriginalCompleto {
    municipiosData: MunicipiosData | null;
    municipiosPoints: Map<string, HTMLElement>;
    selectedMunicipio: string | null;
    tooltip: HTMLElement | null;
    zoomControls: any;
    isInitialized: boolean;

    constructor() {
        this.municipiosData = null;
        this.municipiosPoints = new Map();
        this.selectedMunicipio = null;
        this.tooltip = null;
        this.zoomControls = null;
        this.isInitialized = false;
    }

    async init(): Promise<void> {
        console.log('🗺️ Inicializando Map Interactions Original Completo...');
        
        try {
            // Aguardar carregamento dos dados
            await window.dataLoader.loadData();
            this.municipiosData = window.dataLoader.municipiosData;
            
            // Inicializar zoom controls PRIMEIRO
            this.initZoomControls();
            
            // Configurar elementos
            this.setupElements();
            
            // Criar pontos dos municípios
            this.createMunicipiosPoints();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Ocultar loading
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('✅ Map Interactions inicializado com sucesso!');
            console.log(`📊 ${Object.keys(this.municipiosData!).length} municípios carregados`);
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showError('Erro ao inicializar o mapa interativo');
        }
    }
    
    initZoomControls(): void {
        // Inicializar controles de zoom
        this.zoomControls = new window.ZoomControls();
        window.zoomControls = this.zoomControls;
        console.log('🔍 Zoom controls inicializados');
        
        // Configurar cursor do mapa
        const mapWrapper = document.getElementById('map-wrapper');
        if (mapWrapper) {
            mapWrapper.style.cursor = 'grab';
        }
    }
    
    setupElements(): void {
        // Configurar tooltip
        this.tooltip = document.getElementById('tooltip');
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'tooltip';
            this.tooltip.className = 'tooltip';
            document.body.appendChild(this.tooltip);
        }
        
        // Configurar painel de informações
        this.setupInfoPanel();
    }
    
    setupInfoPanel(): void {
        const closeBtn = document.getElementById('close-info');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }
    }
    
    createMunicipiosPoints(): void {
        const municipiosLayer = document.getElementById('municipios-layer');
        if (!municipiosLayer || !this.municipiosData) return;
        
        // Limpar pontos existentes
        municipiosLayer.innerHTML = '';
        this.municipiosPoints.clear();
        
        console.log('📍 Criando pontos dos municípios...');
        
        Object.entries(this.municipiosData).forEach(([municipio, dados]) => {
            const point = this.createMunicipioPoint(municipio, dados);
            if (point) {
                municipiosLayer.appendChild(point);
                this.municipiosPoints.set(municipio, point);
            }
        });

        console.log(`✅ ${this.municipiosPoints.size} pontos criados`);
    }
    
    createMunicipioPoint(municipio: string, dados: MunicipioData): HTMLElement {
        const point = document.createElement('div');
        point.className = 'municipio-point';
        point.dataset.municipio = municipio;
        
        // Determinar cor baseado nas promotorias
        const hasPromotorias = dados.promotorias && dados.promotorias.length > 0;
        const color = hasPromotorias ? '#10b981' : '#f59e0b'; // Verde ou laranja
        
        // Verificar se tem vagas
        const hasVagas = dados.promotorias && 
                        dados.promotorias.some(p => this.isPromotoriaVaga(p));

        if (hasVagas) {
            point.classList.add('has-vagas');
        }
        
        // Posicionamento
        point.style.position = 'absolute';
        point.style.left = `${dados.coordenadas.x}%`;
        point.style.top = `${dados.coordenadas.y}%`;
        point.style.width = '8px';
        point.style.height = '8px';
        point.style.backgroundColor = color;
        point.style.borderRadius = '50%';
        point.style.border = '2px solid white';
        point.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        point.style.cursor = 'pointer';
        point.style.transform = 'translate(-50%, -50%)';
        point.style.transition = 'all 0.3s ease';
        point.style.zIndex = '10';
        
        // Eventos
        point.addEventListener('mouseenter', (e) => this.handlePointHover(e, municipio, dados));
        point.addEventListener('mouseleave', () => this.hideTooltip());
        point.addEventListener('click', (e) => this.handlePointClick(e, municipio, dados));
        
        return point;
    }
    
    handlePointHover(e: Event, municipio: string, dados: MunicipioData): void {
        // Efeito visual no ponto
        const point = e.target as HTMLElement;
        point.style.transform = 'translate(-50%, -50%) scale(1.5)';
        point.style.zIndex = '20';
        
        // Mostrar tooltip
        this.showTooltip(e as MouseEvent, municipio, dados);
    }
    
    showTooltip(e: MouseEvent, municipio: string, dados: MunicipioData): void {
        if (!this.tooltip) return;
        
        const hasPromotorias = dados.promotorias && dados.promotorias.length > 0;
        const info = hasPromotorias 
            ? `${dados.promotorias.length} promotoria${dados.promotorias.length !== 1 ? 's' : ''}`
            : 'Termo de outra Promotoria';
        
        this.tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${municipio}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">${info}</div>
        `;
        
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${e.pageX + 10}px`;
        this.tooltip.style.top = `${e.pageY - 10}px`;
    }
    
    hideTooltip(): void {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
        
        // Resetar pontos não selecionados
        this.municipiosPoints.forEach((point, municipio) => {
            if (municipio !== this.selectedMunicipio) {
                point.style.transform = 'translate(-50%, -50%) scale(1)';
                point.style.zIndex = '10';
            }
        });
    }
    
    handlePointClick(e: Event, municipio: string, dados: MunicipioData): void {
        e.stopPropagation();
        this.selectMunicipio(municipio, dados);
    }
    
    selectMunicipio(municipio: string, dados: MunicipioData): void {
        // Limpar seleção anterior
        this.clearSelection();
        
        // Marcar como selecionado
        this.selectedMunicipio = municipio;
        
        // Efeito visual no ponto
        const point = this.municipiosPoints.get(municipio);
        if (point) {
            point.style.backgroundColor = '#dc2626'; // Vermelho
            point.style.transform = 'translate(-50%, -50%) scale(2)';
            point.style.zIndex = '30';
            point.style.animation = 'pulse 2s infinite';
        }
        
        // Mostrar informações
        this.showMunicipioInfo(municipio, dados);
        
        // Ocultar tooltip
        this.hideTooltip();
        
        console.log(`📍 Município selecionado: ${municipio}`);
    }
    
    showMunicipioInfo(municipio: string, dados: MunicipioData): void {
        const infoPanel = document.getElementById('info-panel');
        const infoMunicipio = document.getElementById('info-municipio');
        const infoContent = document.getElementById('info-content');
        
        if (!infoPanel || !infoMunicipio || !infoContent) return;
        
        // Atualizar título
        infoMunicipio.textContent = municipio;
        
        // Gerar conteúdo
        let content = '';
        
        if (dados.promotorias && dados.promotorias.length > 0) {
            // Agrupar por entrância
            const porEntrancia: { [key: string]: Promotoria[] } = {};
            dados.promotorias.forEach(promotoria => {
                const entrancia = promotoria.entrância || promotoria.entrancia || '';
                if (!porEntrancia[entrancia]) {
                    porEntrancia[entrancia] = [];
                }
                porEntrancia[entrancia].push(promotoria);
            });
            
            content += `<div class="municipio-info">`;
            content += `<h4 style="margin: 0 0 1rem 0; color: #059669;">📊 Informações Gerais</h4>`;
            content += `<p><strong>Total de Promotorias:</strong> ${dados.promotorias.length}</p>`;
            content += `</div>`;
            
            // Mostrar por entrância
            Object.keys(porEntrancia).sort().forEach(entrancia => {
                const promotorias = porEntrancia[entrancia];
                content += `<div class="entrancia-group">`;
                content += `<h4>${entrancia}ª Entrância (${promotorias.length} promotoria${promotorias.length !== 1 ? 's' : ''})</h4>`;
                content += `<ul class="promotorias-list">`;
                promotorias.forEach(promotoria => {
                    content += `<li class="promotoria-item" style="cursor: pointer; padding: 0.5rem; border-radius: 4px; transition: background 0.2s;" onclick="mapInteractions.showPromotoriaModal(${JSON.stringify(promotoria).replace(/"/g, '&quot;')})">${promotoria.cargo}</li>`;
                });
                content += `</ul>`;
                content += `</div>`;
            });
        } else {
            content += `<div class="municipio-info">`;
            content += `<h4 style="margin: 0 0 1rem 0; color: #f59e0b;">📍 Termo de Outra Promotoria</h4>`;
            content += `<p>Este município não possui promotorias próprias e é atendido por promotorias de outros municípios.</p>`;
            content += `</div>`;
        }
        
        infoContent.innerHTML = content;
        infoPanel.style.display = 'block';
    }
    
    clearSelection(): void {
        if (this.selectedMunicipio) {
            const point = this.municipiosPoints.get(this.selectedMunicipio);
            if (point && this.municipiosData) {
                // Restaurar cor original
                const dados = this.municipiosData[this.selectedMunicipio];
                const hasPromotorias = dados.promotorias && dados.promotorias.length > 0;
                const color = hasPromotorias ? '#10b981' : '#f59e0b';
                
                point.style.backgroundColor = color;
                point.style.transform = 'translate(-50%, -50%) scale(1)';
                point.style.zIndex = '10';
                point.style.animation = '';
            }
            
            this.selectedMunicipio = null;
        }
        // Ocultar painel
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
    }
    
    highlightMunicipio(municipio: string): void {
        if (!this.municipiosData || !this.municipiosData[municipio]) {
            console.warn(`Município não encontrado: ${municipio}`);
            return;
        }
        
        const dados = this.municipiosData[municipio];
        this.selectMunicipio(municipio, dados);
        
        // Zoom para o município se necessário
        if (this.zoomControls) {
            const x = (dados.coordenadas.x / 100) * this.zoomControls.mapWrapper.offsetWidth;
            const y = (dados.coordenadas.y / 100) * this.zoomControls.mapWrapper.offsetHeight;
            this.zoomControls.zoomToPoint(x, y, 2);
        }
    }
    
    filterMunicipiosByEntrancia(entrancia: string): void {
        if (!this.municipiosData) return;
        
        // Controlar classe CSS do container do mapa
        const mapContainer = document.querySelector('.map-container') || 
                            document.getElementById('map-wrapper') ||
                            document.querySelector('#map-wrapper');
        
        // Adicionar/remover classe para ativar animação
        if (entrancia && entrancia.startsWith('vaga-')) {
            if (mapContainer) mapContainer.classList.add('filtering-vagas');
        } else {
            if (mapContainer) mapContainer.classList.remove('filtering-vagas');
        }
        
        this.municipiosPoints.forEach((point, municipio) => {
            const dados = this.municipiosData![municipio];
            let shouldShow = true;
            
            if (entrancia) {
                if (entrancia.startsWith('vaga-')) {
                    // Filtro de vagas
                    const entranciaNumero = entrancia.split('-')[1];
                    shouldShow = dados.promotorias && 
                            dados.promotorias.some(p => {
                                const pEntrancia = p.entrância || p.entrancia;
                                const isVaga = this.isPromotoriaVaga(p);
                                return pEntrancia === entranciaNumero && isVaga;
                            });
                } else {
                    // Filtro normal por entrância
                    shouldShow = dados.promotorias && 
                            dados.promotorias.some(p => (p.entrância || p.entrancia) === entrancia);
                }
            }
            
            point.style.display = shouldShow ? 'block' : 'none';
        });
        
        // Atualizar mensagem do console
        let filterMessage = 'Todos';
        if (entrancia) {
            if (entrancia.startsWith('vaga-')) {
                const num = entrancia.split('-')[1];
                filterMessage = `PJs vagas de ${num}ª entrância`;
            } else {
                filterMessage = `${entrancia}ª Entrância`;
            }
        }
        
        console.log(`🔍 Filtro aplicado: ${filterMessage}`);
    }

    // Função para verificar se uma promotoria está vaga
    isPromotoriaVaga(promotoria: Promotoria): boolean {
        const titular = promotoria['Promotor de Justiça Titular'] || 
                    promotoria['promotor'] || 
                    promotoria['titular'] || '';
        
        // Considerar vaga se:
        // - Campo está vazio
        // - Contém "VAGO"
        // - Contém "VAGA" 
        // - Contém "SEM TITULAR"
        const vagaKeywords = ['VAGO', 'VAGA', 'SEM TITULAR', 'VACANTE'];
        const isEmptyOrVaga = !titular || 
                            titular.trim() === '' ||
                            vagaKeywords.some(keyword => 
                                titular.toUpperCase().includes(keyword)
                            );
        
        return isEmptyOrVaga;
    }

    setupEventListeners(): void {
        // Click no mapa para limpar seleção
        const mapWrapper = document.getElementById('map-wrapper');
        if (mapWrapper) {
            mapWrapper.addEventListener('click', (e) => {
                if (e.target === mapWrapper || (e.target as HTMLElement).id === 'mapa-pernambuco') {
                    this.clearSelection();
                }
            });
        }
        
        // Tecla ESC para limpar seleção
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }
    
    hideLoading(): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    showError(message: string): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="color: #dc2626; text-align: center;">
                    <h3>❌ ${message}</h3>
                    <p>Tente recarregar a página</p>
                </div>
            `;
        }
    }
    
    // Métodos públicos para integração
    zoomIn(): void {
        if (this.zoomControls) {
            this.zoomControls.zoomIn();
        }
    }
    
    zoomOut(): void {
        if (this.zoomControls) {
            this.zoomControls.zoomOut();
        }
    }
    
    resetZoom(): void {
        if (this.zoomControls) {
            this.zoomControls.resetZoom();
        }
    }
    
    getStats(): { municipios: number; promotorias: number } {
        if (!this.municipiosData) return { municipios: 0, promotorias: 0 };
        
        const municipios = Object.keys(this.municipiosData).length;
        const promotorias = Object.values(this.municipiosData)
            .reduce((total, municipio) => total + municipio.promotorias.length, 0);
        
        return { municipios, promotorias };
    }

    // Função para mostrar modal da promotoria
    showPromotoriaModal(promotoria: Promotoria): void {
        const modal = document.getElementById('promotoria-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalBody) return;
        
        // Limpar conteúdo anterior
        modalBody.innerHTML = '';
        
        // Criar conteúdo dinâmico
        for (const [chave, valor] of Object.entries(promotoria)) {
            if (valor) {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                
                const detailKey = document.createElement('div');
                detailKey.className = 'detail-key';
                detailKey.textContent = this.formatarChave(chave);
                
                const detailValue = document.createElement('div');
                detailValue.className = 'detail-value';
                
                // Tratamento especial para endereços
                if (chave === 'Endereço') {
                    // Container para endereço + link
                    const enderecoContainer = document.createElement('div');
                    enderecoContainer.className = 'endereco-container';
                    
                    // Texto do endereço
                    const enderecoTexto = document.createElement('span');
                    enderecoTexto.className = 'endereco-texto';
                    enderecoTexto.textContent = valor;
                    
                    // Link para Google Maps
                    const mapsLink = document.createElement('a');
                    mapsLink.href = this.criarLinkGoogleMaps(valor);
                    mapsLink.target = '_blank';
                    mapsLink.className = 'maps-link';
                    mapsLink.title = 'Abrir no Google Maps';
                    mapsLink.textContent = '🗺️ Ver no Maps';
                    
                    enderecoContainer.appendChild(enderecoTexto);
                    enderecoContainer.appendChild(mapsLink);
                    detailValue.appendChild(enderecoContainer);
                } else {
                    // Outros campos normais
                    detailValue.textContent = valor;
                }
                
                detailItem.appendChild(detailKey);
                detailItem.appendChild(detailValue);
                modalBody.appendChild(detailItem);
            }
        }        
        // Mostrar modal
        modal.classList.add('visible');
        
        // Configurar eventos de fechar
        this.setupModalEvents();
    }
    
    // Função para formatar nomes dos campos
    formatarChave(chave: string): string {
        const nomes: { [key: string]: string } = {
            'entrancia': 'Entrância',
            'entrância': 'Entrância',
            'cargo': 'Cargo',
            'atuação': 'Atuação',
            'atribuição': 'Atribuição',
            'Promotor de Justiça Titular': 'Promotor Titular',
            'Endereço': 'Endereço',
            'E-mail': 'E-mail',
            'Telefone': 'Telefone'
        };
        return nomes[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
    }

    // Função para criar link do Google Maps
    criarLinkGoogleMaps(endereco: string): string {
        const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
        return urlGoogleMaps;
    }  

    resetFilters(): void {
        // Remover classe de animação
        const mapContainer = document.querySelector('.map-container') || 
                            document.getElementById('map-wrapper') ||
                            document.querySelector('#map-wrapper');
        
        if (mapContainer) {
            mapContainer.classList.remove('filtering-vagas');
        }
        
        // Resetar filtro
        const filterSelect = document.getElementById('filter-entrancia') as HTMLSelectElement;
        if (filterSelect) {
            filterSelect.value = '';
        }
        
        // Mostrar todos os pontos
        this.filterMunicipiosByEntrancia('');
    }

    // Função para configurar eventos do modal
    setupModalEvents(): void {
        const modal = document.getElementById('promotoria-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        
        if (!modal || !closeBtn) return;
        
        // Fechar com botão X
        closeBtn.onclick = () => modal.classList.remove('visible');
        
        // Fechar clicando fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
            }
        };
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                modal.classList.remove('visible');
            }
        });
    }
}

// Instância global
window.mapInteractions = new MapInteractionsOriginalCompleto();
