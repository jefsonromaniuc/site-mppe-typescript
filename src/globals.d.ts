/**
 * Declarações globais para o projeto MPPE Mapa Interativo
 */

// Interfaces de dados
interface Coordenadas {
    x: number;
    y: number;
}

interface Promotoria {
    entrancia?: string;
    entrância?: string;
    cargo: string;
    'Promotor de Justiça Titular'?: string;
    promotor?: string;
    titular?: string;
    atuação?: string;
    atribuição?: string;
    Endereço?: string;
    'E-mail'?: string;
    Telefone?: string;
    [key: string]: any;
}

interface MunicipioData {
    coordenadas: Coordenadas;
    promotorias: Promotoria[];
    total_promotorias?: number;
}

interface MunicipiosData {
    [municipio: string]: MunicipioData;
}

interface DataLoaderStats {
    municipios: number;
    promotorias: number;
}

// Extensão do objeto Window
interface Window {
    dataLoader: any;
    mapInteractions: any;
    zoomControls: any;
    ZoomControls: any;
    SearchFilter: any;
    searchFilter: any;
    debugLimitesTriplicados: any;
}
