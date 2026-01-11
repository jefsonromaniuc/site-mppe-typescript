/**
 * Data Loader - Versão TypeScript
 * Carrega os dados das promotorias de um arquivo JSON separado
 * para facilitar atualizações dos dados.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class DataLoaderOriginalCompleto {
    constructor() {
        this.municipiosData = null;
        this.isLoaded = false;
        this.loadingCallbacks = [];
    }
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('📡 Carregando dados do arquivo JSON...');
            try {
                // Carregar dados do arquivo JSON externo
                const response = yield fetch('data/promotorias-data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.municipiosData = yield response.json();
                this.isLoaded = true;
                console.log(`✅ Dados carregados: ${Object.keys(this.municipiosData).length} municípios`);
                console.log('📊 Dados carregados do arquivo JSON externo');
                // Executar callbacks
                this.loadingCallbacks.forEach(callback => callback(this.municipiosData));
                this.loadingCallbacks = [];
                return this.municipiosData;
            }
            catch (error) {
                console.error('❌ Erro ao carregar dados do JSON:', error);
                console.log('⚠️ Tentando carregar dados de fallback...');
                this.municipiosData = this.getFallbackData();
                this.isLoaded = true;
                this.loadingCallbacks.forEach(callback => callback(this.municipiosData));
                this.loadingCallbacks = [];
                return this.municipiosData;
            }
        });
    }
    onDataLoaded(callback) {
        if (this.isLoaded) {
            callback(this.municipiosData);
        }
        else {
            this.loadingCallbacks.push(callback);
        }
    }
    getFallbackData() {
        // Dados básicos de fallback caso o JSON não carregue
        return {
            "Recife": {
                "coordenadas": {
                    "x": 94.922,
                    "y": 39.172
                },
                "promotorias": [
                    { "entrancia": "3", "cargo": "Promotor de Justica Civel" }
                ]
            },
            "Caruaru": {
                "coordenadas": {
                    "x": 78.750,
                    "y": 47.747
                },
                "promotorias": [
                    { "entrancia": "2", "cargo": "Promotor de Justica" }
                ]
            }
        };
    }
    getMunicipioData(municipio) {
        return this.municipiosData ? this.municipiosData[municipio] : null;
    }
    getAllMunicipios() {
        return this.municipiosData ? Object.keys(this.municipiosData) : [];
    }
    searchMunicipios(query) {
        if (!this.municipiosData)
            return [];
        const queryLower = query.toLowerCase();
        return Object.keys(this.municipiosData).filter(municipio => municipio.toLowerCase().includes(queryLower));
    }
    filterMunicipiosByEntrancia(entrancia) {
        if (!this.municipiosData)
            return [];
        return Object.keys(this.municipiosData).filter(municipio => {
            const dados = this.municipiosData[municipio];
            return dados.promotorias && dados.promotorias.some(p => (p.entrância || p.entrancia) === entrancia);
        });
    }
    getStats() {
        if (!this.municipiosData) {
            return { municipios: 0, promotorias: 0 };
        }
        const municipios = Object.keys(this.municipiosData).length;
        const promotorias = Object.values(this.municipiosData)
            .reduce((total, municipio) => total + (municipio.promotorias ? municipio.promotorias.length : 0), 0);
        return { municipios, promotorias };
    }
}
// Instância global compatível com versão original
window.dataLoader = new DataLoaderOriginalCompleto();
