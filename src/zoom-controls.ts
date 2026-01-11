/**
 * Módulo para controles de zoom e pan do mapa - Versão Limites Triplicados
 * Zoom ultra fluido com interpolação suave + Pan com limites expandidos (3x)
 */

class ZoomControls {
    mapWrapper: HTMLElement | null;
    mapImage: HTMLImageElement | null;
    municipiosLayer: HTMLElement | null;
    
    scale: number;
    minScale: number;
    maxScale: number;
    scaleStep: number;
    
    translateX: number;
    translateY: number;
    
    isDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;
    
    isAnimating: boolean;
    animationFrame: number | null;
    targetScale: number;
    targetTranslateX: number;
    targetTranslateY: number;
    
    wheelTimeout: number | null;
    lastWheelTime: number;
    
    limitExpansionFactor: number;

    constructor() {
        this.mapWrapper = document.getElementById('map-wrapper');
        this.mapImage = document.getElementById('mapa-pernambuco') as HTMLImageElement;
        this.municipiosLayer = document.getElementById('municipios-layer');
        
        this.scale = 1;
        this.minScale = 0.3;
        this.maxScale = 5;
        this.scaleStep = 0.15;
        
        this.translateX = 0;
        this.translateY = 0;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.isAnimating = false;
        this.animationFrame = null;
        this.targetScale = 1;
        this.targetTranslateX = 0;
        this.targetTranslateY = 0;
        
        this.wheelTimeout = null;
        this.lastWheelTime = 0;
        
        this.limitExpansionFactor = 3;
        
        this.init();
    }
    
    init(): void {
        this.setupEventListeners();
        this.updateTransform();
        this.setupOptimizations();
        
        console.log('🎯 ZoomControls inicializado com limites triplicados!');
        console.log(`📏 Fator de expansão: ${this.limitExpansionFactor}x`);
    }
    
    setupOptimizations(): void {
        if (this.mapImage) {
            this.mapImage.style.willChange = 'transform';
            this.mapImage.style.backfaceVisibility = 'hidden';
            this.mapImage.style.perspective = '1000px';
        }
        
        if (this.municipiosLayer) {
            this.municipiosLayer.style.willChange = 'transform';
            this.municipiosLayer.style.backfaceVisibility = 'hidden';
        }
        
        if (this.mapWrapper) {
            this.mapWrapper.style.transformStyle = 'preserve-3d';
        }
    }
    
    setupEventListeners(): void {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const resetZoomBtn = document.getElementById('reset-zoom');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomInSmooth());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOutSmooth());
        if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => this.resetZoomSmooth());
        
        if (this.mapWrapper) {
            this.mapWrapper.addEventListener('wheel', (e) => this.handleWheelOptimized(e), { passive: false });
            
            this.mapWrapper.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            document.addEventListener('mousemove', (e) => this.handleMouseMoveOptimized(e));
            document.addEventListener('mouseup', () => this.handleMouseUp());
            
            this.mapWrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.mapWrapper.addEventListener('touchmove', (e) => this.handleTouchMoveOptimized(e), { passive: false });
            this.mapWrapper.addEventListener('touchend', () => this.handleTouchEnd());
            
            this.mapWrapper.addEventListener('selectstart', (e) => e.preventDefault());
            this.mapWrapper.addEventListener('dragstart', (e) => e.preventDefault());
        }
    }
    
    zoomInSmooth(): void {
        this.animateToScale(this.scale + this.scaleStep);
    }
    
    zoomOutSmooth(): void {
        this.animateToScale(this.scale - this.scaleStep);
    }
    
    resetZoomSmooth(): void {
        this.animateToTransform(1, 0, 0);
    }
    
    animateToScale(newScale: number): void {
        const clampedScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        
        if (clampedScale === this.scale) return;
        
        const rect = this.mapWrapper!.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const scaleFactor = clampedScale / this.scale;
        const newTranslateX = centerX - (centerX - this.translateX) * scaleFactor;
        const newTranslateY = centerY - (centerY - this.translateY) * scaleFactor;
        
        this.animateToTransform(clampedScale, newTranslateX, newTranslateY);
    }
    
    animateToTransform(targetScale: number, targetX: number, targetY: number): void {
        this.targetScale = targetScale;
        this.targetTranslateX = targetX;
        this.targetTranslateY = targetY;
        
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }
    
    startAnimation(): void {
        this.isAnimating = true;
        
        const animate = () => {
            const speed = 0.15;
            
            const scaleDistance = this.targetScale - this.scale;
            const xDistance = this.targetTranslateX - this.translateX;
            const yDistance = this.targetTranslateY - this.translateY;
            
            this.scale += scaleDistance * speed;
            this.translateX += xDistance * speed;
            this.translateY += yDistance * speed;
            
            const threshold = 0.001;
            if (Math.abs(scaleDistance) < threshold && 
                Math.abs(xDistance) < threshold && 
                Math.abs(yDistance) < threshold) {
                
                this.scale = this.targetScale;
                this.translateX = this.targetTranslateX;
                this.translateY = this.targetTranslateY;
                this.isAnimating = false;
            }
            
            this.constrainTranslationExpanded();
            this.updateTransformOptimized();
            
            if (this.isAnimating) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    handleWheelOptimized(e: WheelEvent): void {
        e.preventDefault();
        
        const now = Date.now();
        if (now - this.lastWheelTime < 16) return;
        this.lastWheelTime = now;
        
        const rect = this.mapWrapper!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomDelta = e.deltaY > 0 ? -this.scaleStep * 0.5 : this.scaleStep * 0.5;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + zoomDelta));
        
        if (newScale !== this.scale) {
            const scaleFactor = newScale / this.scale;
            const newTranslateX = mouseX - (mouseX - this.translateX) * scaleFactor;
            const newTranslateY = mouseY - (mouseY - this.translateY) * scaleFactor;
            
            this.animateToTransform(newScale, newTranslateX, newTranslateY);
        }
    }
    
    handleMouseDown(e: MouseEvent): void {
        if (e.button === 0) {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.mapWrapper!.style.cursor = 'grabbing';
            
            if (this.isAnimating) {
                this.isAnimating = false;
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
            }
        }
    }
    
    handleMouseMoveOptimized(e: MouseEvent): void {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.translateX += deltaX;
        this.translateY += deltaY;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.constrainTranslationExpanded();
        this.updateTransformOptimized();
    }
    
    handleMouseUp(): void {
        this.isDragging = false;
        if (this.mapWrapper) {
            this.mapWrapper.style.cursor = 'grab';
        }
    }
    
    handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
            
            if (this.isAnimating) {
                this.isAnimating = false;
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
            }
        }
    }
    
    handleTouchMoveOptimized(e: TouchEvent): void {
        e.preventDefault();
        
        if (this.isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.lastMouseX;
            const deltaY = touch.clientY - this.lastMouseY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
            
            this.constrainTranslationExpanded();
            this.updateTransformOptimized();
        }
    }
    
    handleTouchEnd(): void {
        this.isDragging = false;
    }
    
    constrainTranslationExpanded(): void {
        const rect = this.mapWrapper!.getBoundingClientRect();
        const imageWidth = rect.width * this.scale;
        const imageHeight = rect.height * this.scale;
        
        const originalMaxTranslateX = Math.max(0, (imageWidth - rect.width) / 2);
        const originalMaxTranslateY = Math.max(0, (imageHeight - rect.height) / 2);
        
        const expandedMaxTranslateX = originalMaxTranslateX * this.limitExpansionFactor;
        const expandedMaxTranslateY = originalMaxTranslateY * this.limitExpansionFactor;
        
        const minTranslateX = -expandedMaxTranslateX;
        const maxTranslateX = expandedMaxTranslateX;
        this.translateX = Math.max(minTranslateX, Math.min(maxTranslateX, this.translateX));
        
        const minTranslateY = -expandedMaxTranslateY;
        const maxTranslateY = expandedMaxTranslateY;
        this.translateY = Math.max(minTranslateY, Math.min(maxTranslateY, this.translateY));
    }
    
    constrainTranslation(): void {
        this.constrainTranslationExpanded();
    }
    
    updateTransformOptimized(): void {
        const transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.scale})`;
        
        if (this.mapImage) {
            this.mapImage.style.transform = transform;
        }
        
        if (this.municipiosLayer) {
            this.municipiosLayer.style.transform = transform;
        }
        
        this.updateButtonStates();
    }
    
    updateTransform(): void {
        this.updateTransformOptimized();
    }
    
    updateButtonStates(): void {
        const zoomInBtn = document.getElementById('zoom-in') as HTMLButtonElement;
        const zoomOutBtn = document.getElementById('zoom-out') as HTMLButtonElement;
        
        if (zoomInBtn) {
            zoomInBtn.disabled = this.scale >= this.maxScale;
            zoomInBtn.style.opacity = zoomInBtn.disabled ? '0.5' : '1';
            zoomInBtn.style.cursor = zoomInBtn.disabled ? 'not-allowed' : 'pointer';
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.scale <= this.minScale;
            zoomOutBtn.style.opacity = zoomOutBtn.disabled ? '0.5' : '1';
            zoomOutBtn.style.cursor = zoomOutBtn.disabled ? 'not-allowed' : 'pointer';
        }
    }
    
    zoomToPoint(x: number, y: number, targetScale: number = 2): void {
        const rect = this.mapWrapper!.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const clampedScale = Math.max(this.minScale, Math.min(this.maxScale, targetScale));
        const newTranslateX = centerX - x * clampedScale;
        const newTranslateY = centerY - y * clampedScale;
        
        this.animateToTransform(clampedScale, newTranslateX, newTranslateY);
    }
    
    zoomIn(): void {
        this.zoomInSmooth();
    }
    
    zoomOut(): void {
        this.zoomOutSmooth();
    }
    
    resetZoom(): void {
        this.resetZoomSmooth();
    }
    
    getTransformedCoordinates(x: number, y: number): { x: number; y: number } {
        return {
            x: x * this.scale + this.translateX,
            y: y * this.scale + this.translateY
        };
    }
    
    getOriginalCoordinates(transformedX: number, transformedY: number): { x: number; y: number } {
        return {
            x: (transformedX - this.translateX) / this.scale,
            y: (transformedY - this.translateY) / this.scale
        };
    }
    
    setLimitExpansionFactor(factor: number): void {
        this.limitExpansionFactor = Math.max(1, factor);
        console.log(`📏 Fator de expansão alterado para: ${this.limitExpansionFactor}x`);
        
        this.constrainTranslationExpanded();
        this.updateTransformOptimized();
    }
    
    getLimitsInfo(): any {
        const rect = this.mapWrapper!.getBoundingClientRect();
        const imageWidth = rect.width * this.scale;
        const imageHeight = rect.height * this.scale;
        
        const originalMaxX = Math.max(0, (imageWidth - rect.width) / 2);
        const originalMaxY = Math.max(0, (imageHeight - rect.height) / 2);
        
        const expandedMaxX = originalMaxX * this.limitExpansionFactor;
        const expandedMaxY = originalMaxY * this.limitExpansionFactor;
        
        return {
            expansionFactor: this.limitExpansionFactor,
            original: {
                maxX: originalMaxX,
                maxY: originalMaxY,
                rangeX: originalMaxX * 2,
                rangeY: originalMaxY * 2
            },
            expanded: {
                maxX: expandedMaxX,
                maxY: expandedMaxY,
                rangeX: expandedMaxX * 2,
                rangeY: expandedMaxY * 2
            },
            current: {
                translateX: this.translateX,
                translateY: this.translateY,
                scale: this.scale
            }
        };
    }
    
    destroy(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.wheelTimeout) {
            clearTimeout(this.wheelTimeout);
        }
    }
}

// Exportar para uso global
window.ZoomControls = ZoomControls;

// Comandos de debug para console
window.debugLimitesTriplicados = {
    info: () => {
        if (window.zoomControls) {
            return window.zoomControls.getLimitsInfo();
        }
        return 'ZoomControls não inicializado';
    },
    
    setFactor: (factor: number) => {
        if (window.zoomControls) {
            window.zoomControls.setLimitExpansionFactor(factor);
            return `Fator alterado para ${factor}x`;
        }
        return 'ZoomControls não inicializado';
    },
    
    test2x: () => window.debugLimitesTriplicados.setFactor(2),
    test3x: () => window.debugLimitesTriplicados.setFactor(3),
    test5x: () => window.debugLimitesTriplicados.setFactor(5),
    test10x: () => window.debugLimitesTriplicados.setFactor(10)
};

console.log('🎯 ZoomControls com limites triplicados carregado!');
console.log('📏 Comandos disponíveis:');
console.log('- debugLimitesTriplicados.info() - Ver informações dos limites');
console.log('- debugLimitesTriplicados.setFactor(n) - Alterar fator de expansão');
console.log('- debugLimitesTriplicados.test3x() - Testar 3x');
console.log('- debugLimitesTriplicados.test5x() - Testar 5x');
