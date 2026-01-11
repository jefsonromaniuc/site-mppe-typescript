/**
 * Módulo para funcionalidades de busca e filtros (TypeScript)
 */

class SearchFilter {
    searchInput: HTMLInputElement;
    clearButton: HTMLElement;
    filterSelect: HTMLSelectElement;
    searchDropdown: HTMLElement;
    
    dataLoader: any;
    mapInteractions: any;
    
    searchResults: string[];
    currentFilter: string;

    constructor() {
        this.searchInput = document.getElementById('search-municipio') as HTMLInputElement;
        this.clearButton = document.getElementById('clear-search') as HTMLElement;
        this.filterSelect = document.getElementById('filter-entrancia') as HTMLSelectElement;
        this.searchDropdown = document.createElement('div');
        
        this.dataLoader = null;
        this.mapInteractions = null;
        
        this.searchResults = [];
        this.currentFilter = '';
        
        this.init();
    }
    
    init(): void {
        this.setupEventListeners();
        this.createSearchDropdown();
    }
    
    setupEventListeners(): void {
        // Busca em tempo real
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch((e.target as HTMLInputElement).value);
        });
        
        // Limpar busca
        this.clearButton.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Filtro por entrância
        this.filterSelect.addEventListener('change', (e) => {
            this.handleFilter((e.target as HTMLSelectElement).value);
        });
        
        // Teclas especiais na busca
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleSearchKeydown(e);
        });
        
        // Click fora para fechar dropdown
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target as Node) && !this.searchDropdown.contains(e.target as Node)) {
                this.hideSearchDropdown();
            }
        });
    }
    
    setDataLoader(dataLoader: any): void {
        this.dataLoader = dataLoader;
    }
    
    setMapInteractions(mapInteractions: any): void {
        this.mapInteractions = mapInteractions;
    }
    
    createSearchDropdown(): void {
        this.searchDropdown = document.createElement('div');
        this.searchDropdown.className = 'search-dropdown';
        this.searchDropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--border-color);
            border-top: none;
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            box-shadow: var(--shadow-lg);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        if (this.searchInput.parentElement) {
            this.searchInput.parentElement.appendChild(this.searchDropdown);
            this.searchInput.parentElement.style.position = 'relative';
        }
    }
    
    handleSearch(query: string): void {
        if (!this.dataLoader || !this.dataLoader.isLoaded) return;
        
        // Mostrar/esconder botão de limpar
        this.clearButton.style.display = query ? 'block' : 'none';
        
        if (query.length < 2) {
            this.hideSearchDropdown();
            this.searchResults = [];
            return;
        }
        
        // Buscar municípios
        this.searchResults = this.dataLoader.searchMunicipios(query);
        this.updateSearchDropdown();
        
        if (this.searchResults.length > 0) {
            this.showSearchDropdown();
        } else {
            this.hideSearchDropdown();
        }
    }
    
    updateSearchDropdown(): void {
        if (this.searchResults.length === 0) {
            this.searchDropdown.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: var(--text-muted);">
                    Nenhum município encontrado
                </div>
            `;
            return;
        }
        
        const resultsHtml = this.searchResults.map((municipio, index) => {
            const data = this.dataLoader?.getMunicipioData(municipio);
            const totalPromotorias = data?.promotorias?.length || 0;
            const promotoriasText = `${totalPromotorias} promotoria${totalPromotorias !== 1 ? 's' : ''}`;
            
            return `
                <div class="search-result-item" data-municipio="${municipio}" data-index="${index}" style="
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                    transition: var(--transition);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-weight: 500; color: var(--text-primary);">${municipio}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${promotoriasText}</div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--primary-color); font-weight: 500;">
                        Ver no mapa →
                    </div>
                </div>
            `;
        }).join('');
        
        this.searchDropdown.innerHTML = resultsHtml;
        
        // Adicionar event listeners aos resultados
        this.searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const municipio = (item as HTMLElement).dataset.municipio;
                if (municipio) {
                    this.selectMunicipio(municipio);
                }
            });
            
            item.addEventListener('mouseenter', () => {
                (item as HTMLElement).style.backgroundColor = 'var(--bg-secondary)';
            });
            
            item.addEventListener('mouseleave', () => {
                (item as HTMLElement).style.backgroundColor = 'transparent';
            });
        });
    }
    
    handleSearchKeydown(e: KeyboardEvent): void {
        const items = this.searchDropdown.querySelectorAll('.search-result-item');
        const currentActive = this.searchDropdown.querySelector('.search-result-item.active') as HTMLElement;
        let activeIndex = currentActive ? parseInt(currentActive.dataset.index || '-1') : -1;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                this.setActiveSearchResult(activeIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                this.setActiveSearchResult(activeIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentActive) {
                    const municipio = currentActive.dataset.municipio;
                    if (municipio) {
                        this.selectMunicipio(municipio);
                    }
                } else if (this.searchResults.length === 1) {
                    this.selectMunicipio(this.searchResults[0]);
                }
                break;
                
            case 'Escape':
                this.hideSearchDropdown();
                this.searchInput.blur();
                break;
        }
    }
    
    setActiveSearchResult(index: number): void {
        const items = this.searchDropdown.querySelectorAll('.search-result-item');
        
        // Remover classe active de todos
        items.forEach(item => {
            item.classList.remove('active');
            (item as HTMLElement).style.backgroundColor = 'transparent';
        });
        
        // Adicionar classe active ao item selecionado
        if (items[index]) {
            items[index].classList.add('active');
            (items[index] as HTMLElement).style.backgroundColor = 'var(--bg-secondary)';
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectMunicipio(municipio: string): void {
        this.searchInput.value = municipio;
        this.hideSearchDropdown();
        
        // Destacar no mapa
        if (this.mapInteractions) {
            this.mapInteractions.highlightMunicipio(municipio);
        }
        
        // Limpar busca após um tempo
        setTimeout(() => {
            this.clearSearch();
        }, 3000);
    }
    
    clearSearch(): void {
        this.searchInput.value = '';
        this.clearButton.style.display = 'none';
        this.hideSearchDropdown();
        this.searchResults = [];
    }
    
    showSearchDropdown(): void {
        this.searchDropdown.style.display = 'block';
    }
    
    hideSearchDropdown(): void {
        this.searchDropdown.style.display = 'none';
        
        // Remover classe active de todos os itens
        this.searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.remove('active');
            (item as HTMLElement).style.backgroundColor = 'transparent';
        });
    }
    
    handleFilter(entrancia: string): void {
        this.currentFilter = entrancia;
        
        // Aplicar filtro no mapa
        if (this.mapInteractions) {
            this.mapInteractions.filterMunicipiosByEntrancia(entrancia);
        }
        
        // Atualizar aparência do select
        if (entrancia) {
            this.filterSelect.style.borderColor = 'var(--primary-color)';
            this.filterSelect.style.backgroundColor = 'var(--bg-secondary)';
        } else {
            this.filterSelect.style.borderColor = 'var(--border-color)';
            this.filterSelect.style.backgroundColor = 'var(--bg-primary)';
        }
    }
    
    clearFilter(): void {
        this.filterSelect.value = '';
        this.handleFilter('');
    }
    
    // Método público para busca programática
    searchFor(municipio: string): void {
        this.searchInput.value = municipio;
        this.handleSearch(municipio);
        
        // Auto-selecionar se houver correspondência exata
        const exactMatch = this.searchResults.find(result => 
            result.toLowerCase() === municipio.toLowerCase()
        );
        
        if (exactMatch) {
            setTimeout(() => {
                this.selectMunicipio(exactMatch);
            }, 100);
        }
    }
    
    // Método para obter estatísticas do filtro atual
    getFilterStats(): any {
        if (!this.dataLoader || !this.dataLoader.isLoaded) return null;
        
        const filteredMunicipios = this.currentFilter ? 
            this.dataLoader.filterMunicipiosByEntrancia(this.currentFilter) :
            Object.keys(this.dataLoader.municipiosData);
        
        const totalPromotorias = filteredMunicipios.reduce((total: number, municipio: string) => {
            const data = this.dataLoader?.getMunicipioData(municipio);
            return total + (data?.promotorias?.length || 0);
        }, 0);
        
        return {
            municipios: filteredMunicipios.length,
            promotorias: totalPromotorias,
            entrancia: this.currentFilter
        };
    }
}

// Exportar para uso global
window.SearchFilter = SearchFilter;
