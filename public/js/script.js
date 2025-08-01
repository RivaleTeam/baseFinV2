document.addEventListener('DOMContentLoaded', function() {
    // ========== CONFIGURAÇÕES ==========
    const GAME_CONFIG = {
        cost: 5.00,
        scratchRadius: 25,
        scratchThreshold: 60
    };

    // ========== ELEMENTOS DOM ==========
    const elements = {
        // Controles
        playBtn: document.getElementById('playBtn'),
        autoBtn: document.getElementById('autoBtn'),
        startAutoBtn: document.getElementById('startAutoBtn'),
        stopAutoBtn: document.getElementById('stopAutoBtn'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        collectBtn: document.getElementById('collectBtn'),
        autoGamesInput: document.getElementById('autoGames'),
        
        // Jogo
        scratchCanvas: document.getElementById('scratchCanvas'),
        scratchSymbols: document.getElementById('scratchSymbols'),
        scratchOverlay: document.getElementById('scratchOverlay'),
        
        // UI
        playerBalance: document.getElementById('navBalance'),
        totalGames: document.getElementById('totalGames'),
        totalWins: document.getElementById('totalWins'),
        winRate: document.getElementById('winRate'),
        prizeDisplay: document.getElementById('prizeDisplay'),
        prizeAmount: document.getElementById('prizeAmount'),
        resultsContainer: document.getElementById('resultsContainer'),
        
        // Modais
        winModal: document.getElementById('winModal'),
        winAmount: document.getElementById('winAmount'),
        winSymbols: document.getElementById('winSymbols'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        autoControls: document.getElementById('autoControls')
    };

    // ========== ESTADO DO JOGO ==========
    let gameState = {
        isPlaying: false,
        isScratching: false,
        isAutoMode: false,
        isAutoPlaying: false,
        autoGamesLeft: 0,
        currentGameData: null,
        isScratched: false,
        lastX: 0,
        lastY: 0
    };

    // ========== ESTATÍSTICAS ==========
    let stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalSpent: 0,
        totalWon: 0,
        biggestWin: 0
    };

    // ========== INICIALIZAÇÃO ==========
    const ctx = elements.scratchCanvas.getContext('2d');
    setupCanvas();
    setupEventListeners();
    updateUI();

    // ========== SETUP INICIAL ==========
    function setupCanvas() {
        // Verifica se os elementos necessários existem
        if (!elements.scratchCard || !elements.scratchCanvas) {
            console.error('Elementos necessários não encontrados: scratchCard ou scratchCanvas');
            return;
        }
        
        const rect = elements.scratchCard.getBoundingClientRect();
        elements.scratchCanvas.width = rect.width;
        elements.scratchCanvas.height = rect.height;
        
        resetCanvas();
    }

    function resetCanvas() {
        ctx.fillStyle = '#999';
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(0, 0, elements.scratchCanvas.width, elements.scratchCanvas.height);
        ctx.globalCompositeOperation = 'destination-out';
    }

    function setupEventListeners() {
        // Controles principais
        elements.playBtn.addEventListener('click', handlePlay);
        elements.autoBtn.addEventListener('click', toggleAutoMode);
        elements.startAutoBtn.addEventListener('click', startAutoPlay);
        elements.stopAutoBtn.addEventListener('click', stopAutoPlay);
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
        elements.collectBtn.addEventListener('click', collectPrize);

        // Eventos de raspadinha
        elements.scratchCanvas.addEventListener('mousedown', startScratching);
        elements.scratchCanvas.addEventListener('mousemove', scratch);
        elements.scratchCanvas.addEventListener('mouseup', stopScratching);
        elements.scratchCanvas.addEventListener('mouseleave', stopScratching);

        // Touch events para mobile
        elements.scratchCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        elements.scratchCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        elements.scratchCanvas.addEventListener('touchend', stopScratching);

        // Fechar modal clicando fora
        elements.winModal.addEventListener('click', (e) => {
            if (e.target === elements.winModal) {
                closeWinModal();
            }
        });

        // Resize canvas
        window.addEventListener('resize', setupCanvas);
    }

    // ========== CONTROLES DO JOGO ==========
    async function handlePlay() {
        if (gameState.isPlaying || gameState.isAutoPlaying) return;

        const balance = parseFloat(elements.playerBalance.textContent);
        if (balance < GAME_CONFIG.cost) {
            showError('Saldo insuficiente para jogar!');
            return;
        }

        try {
            showLoading(true);
            
            // Deduz o custo imediatamente
            updateBalance(-GAME_CONFIG.cost);
            stats.totalSpent += GAME_CONFIG.cost;
            stats.gamesPlayed++;

            // Busca dados do jogo do backend
            const gameData = await fetchNewGame();
            
            if (gameData.success) {
                gameState.currentGameData = gameData.data;
                startGame();
            } else {
                throw new Error(gameData.error || 'Erro ao gerar jogo');
            }

        } catch (error) {
            console.error('Erro ao iniciar jogo:', error);
            showError('Erro ao carregar jogo. Tente novamente.');
            
            // Reverte o saldo em caso de erro
            updateBalance(GAME_CONFIG.cost);
            stats.totalSpent -= GAME_CONFIG.cost;
            stats.gamesPlayed--;
        } finally {
            showLoading(false);
        }
    }

    function startGame() {
        gameState.isPlaying = true;
        gameState.isScratched = false;
        
        displaySymbols(gameState.currentGameData.symbols);
        resetCanvas();
        
        elements.scratchOverlay.style.display = 'none';
        elements.playBtn.disabled = true;
        
        updatePrizeDisplay(gameState.currentGameData.prize);
        updateUI();

        // Auto-raspa se estiver no modo automático
        if (gameState.isAutoMode || gameState.isAutoPlaying) {
            setTimeout(() => autoScratch(), 500);
        }
    }

    function toggleAutoMode() {
        gameState.isAutoMode = !gameState.isAutoMode;
        elements.autoBtn.classList.toggle('active', gameState.isAutoMode);
        elements.autoControls.classList.toggle('active', gameState.isAutoMode);
        
        if (gameState.isAutoMode && gameState.isPlaying && !gameState.isScratched) {
            autoScratch();
        }
    }

    async function startAutoPlay() {
        const games = parseInt(elements.autoGamesInput.value);
        
        if (games < 1 || games > 50) {
            showError('Digite um número entre 1 e 50');
            return;
        }

        gameState.isAutoPlaying = true;
        gameState.autoGamesLeft = games;
        
        elements.startAutoBtn.style.display = 'none';
        elements.stopAutoBtn.style.display = 'flex';
        elements.stopAutoBtn.classList.add('active');
        elements.playBtn.disabled = true;
        
        runAutoPlay();
    }

    async function runAutoPlay() {
        while (gameState.autoGamesLeft > 0 && gameState.isAutoPlaying) {
            const balance = parseFloat(elements.playerBalance.textContent);
            
            if (balance < GAME_CONFIG.cost) {
                showError('Saldo insuficiente para continuar!');
                stopAutoPlay();
                return;
            }

            try {
                // Deduz custo
                updateBalance(-GAME_CONFIG.cost);
                stats.totalSpent += GAME_CONFIG.cost;
                stats.gamesPlayed++;

                // Busca jogo
                const gameData = await fetchNewGame();
                
                if (gameData.success) {
                    gameState.currentGameData = gameData.data;
                    
                    // Mostra símbolos
                    displaySymbols(gameState.currentGameData.symbols);
                    resetCanvas();
                    
                    // Revela imediatamente
                    ctx.clearRect(0, 0, elements.scratchCanvas.width, elements.scratchCanvas.height);
                    
                    // Processa resultado
                    processGameResult();
                    addToHistory();
                    
                    gameState.autoGamesLeft--;
                    updateUI();
                    
                    // Delay entre jogos
                    await new Promise(resolve => setTimeout(resolve, 1200));
                } else {
                    throw new Error(gameData.error);
                }

            } catch (error) {
                console.error('Erro no auto play:', error);
                showError('Erro durante modo automático');
                stopAutoPlay();
                return;
            }
        }

        if (gameState.autoGamesLeft <= 0) {
            stopAutoPlay();
        }
    }

    function stopAutoPlay() {
        gameState.isAutoPlaying = false;
        gameState.autoGamesLeft = 0;
        
        elements.startAutoBtn.style.display = 'flex';
        elements.stopAutoBtn.style.display = 'none';
        elements.stopAutoBtn.classList.remove('active');
        elements.playBtn.disabled = false;
        
        updateUI();
    }

    // ========== MECÂNICA DE RASPADINHA ==========
    function startScratching(e) {
        if (!gameState.isPlaying || gameState.isAutoMode || gameState.isAutoPlaying) return;
        
        gameState.isScratching = true;
        const pos = getCanvasPosition(e);
        gameState.lastX = pos.x;
        gameState.lastY = pos.y;
        
        drawScratch(pos.x, pos.y);
    }

    function scratch(e) {
        if (!gameState.isScratching || !gameState.isPlaying) return;
        
        const pos = getCanvasPosition(e);
        
        ctx.beginPath();
        ctx.moveTo(gameState.lastX, gameState.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.lineWidth = GAME_CONFIG.scratchRadius * 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        gameState.lastX = pos.x;
        gameState.lastY = pos.y;
        
        checkScratchCompletion();
    }

    function stopScratching() {
        gameState.isScratching = false;
    }

    function handleTouchStart(e) {
        e.preventDefault();
        startScratching(e.touches[0]);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        scratch(e.touches[0]);
    }

    function drawScratch(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, GAME_CONFIG.scratchRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    function autoScratch() {
        const interval = setInterval(() => {
            if (!gameState.isPlaying) {
                clearInterval(interval);
                return;
            }

            // Raspa em padrões aleatórios
            const x = Math.random() * elements.scratchCanvas.width;
            const y = Math.random() * elements.scratchCanvas.height;
            drawScratch(x, y);
            
            checkScratchCompletion();
        }, 30);

        // Para após 2 segundos no máximo
        setTimeout(() => {
            clearInterval(interval);
            if (gameState.isPlaying && !gameState.isScratched) {
                finishGame();
            }
        }, 2000);
    }

    function checkScratchCompletion() {
        if (gameState.isScratched) return;

        const imageData = ctx.getImageData(0, 0, elements.scratchCanvas.width, elements.scratchCanvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparentPixels++;
        }

        const scratchPercentage = (transparentPixels / (elements.scratchCanvas.width * elements.scratchCanvas.height)) * 100;

        if (scratchPercentage > GAME_CONFIG.scratchThreshold) {
            finishGame();
        }
    }

    // ========== FINALIZACAO DO JOGO ==========
    function finishGame() {
        if (!gameState.isPlaying) return;
        
        gameState.isScratched = true;
        gameState.isPlaying = false;
        
        // Revela tudo
        ctx.clearRect(0, 0, elements.scratchCanvas.width, elements.scratchCanvas.height);
        
        processGameResult();
        addToHistory();
        
        elements.playBtn.disabled = false;
        updateUI();
    }

    function processGameResult() {
        const gameData = gameState.currentGameData;
        
        if (gameData.isWin && gameData.prize > 0) {
            stats.gamesWon++;
            stats.totalWon += gameData.prize;
            
            if (gameData.prize > stats.biggestWin) {
                stats.biggestWin = gameData.prize;
            }
            
            // Marca símbolos vencedores
            if (gameData.winningPattern) {
                gameData.winningPattern.forEach(index => {
                    const symbol = elements.scratchSymbols.children[index];
                    if (symbol) {
                        symbol.classList.add('winning');
                    }
                });
            }
            
            // Mostra modal apenas se não estiver em modo automático
            if (!gameState.isAutoPlaying) {
                setTimeout(() => showWinModal(), 500);
            } else {
                // No modo automático, adiciona o prêmio diretamente
                updateBalance(gameData.prize);
            }
        }
    }

    // ========== API CALLS ==========
    async function fetchNewGame() {
        const response = await fetch('/api/game/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        return await response.json();
    }

    // ========== DISPLAY FUNCTIONS ==========
    function displaySymbols(symbols) {
        elements.scratchSymbols.innerHTML = '';
        
        symbols.forEach((symbol, index) => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.textContent = symbol.icon;
            symbolElement.dataset.index = index;
            elements.scratchSymbols.appendChild(symbolElement);
        });
    }

    function updatePrizeDisplay(prize) {
        elements.prizeAmount.textContent = `R$ ${prize.toFixed(2)}`;
        elements.prizeDisplay.classList.toggle('win', prize > 0);
    }

    function addToHistory() {
        if (elements.resultsContainer.querySelector('.empty-results')) {
            elements.resultsContainer.innerHTML = '';
        }

        const gameData = gameState.currentGameData;
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${gameData.isWin ? 'win' : 'lose'}`;
        
        const symbolsHtml = gameData.symbols.slice(0, 3).map(s => `<span>${s.icon}</span>`).join('');
        const prizeText = gameData.isWin ? `R$ ${gameData.prize.toFixed(2)}` : '---';
        
        resultItem.innerHTML = `
            <div class="result-symbols">${symbolsHtml}</div>
            <div class="result-prize ${gameData.isWin ? 'win' : 'lose'}">${prizeText}</div>
        `;
        
        elements.resultsContainer.prepend(resultItem);
        
        // Mantém apenas os últimos 20 resultados
        const items = elements.resultsContainer.querySelectorAll('.result-item');
        if (items.length > 20) {
            items[items.length - 1].remove();
        }
    }

    // ========== UI UPDATES ==========
    function updateUI() {
        elements.totalGames.textContent = stats.gamesPlayed;
        elements.totalWins.textContent = stats.gamesWon;
        
        const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
        elements.winRate.textContent = `${winRate.toFixed(0)}%`;
    }

    function updateBalance(amount) {
        const currentBalance = parseFloat(elements.playerBalance.textContent);
        const newBalance = Math.max(0, currentBalance + amount);
        elements.playerBalance.textContent = newBalance.toFixed(2);
    }

    // ========== MODALS E OVERLAY ==========
    function showWinModal() {
        const gameData = gameState.currentGameData;
        
        elements.winAmount.textContent = `R$ ${gameData.prize.toFixed(2)}`;
        elements.winSymbols.innerHTML = '';
        
        // Mostra símbolos vencedores
        const winningSymbols = gameData.winningPattern ? 
            gameData.winningPattern.slice(0, 3).map(i => gameData.symbols[i]) :
            gameData.symbols.slice(0, 3);
            
        winningSymbols.forEach(symbol => {
            const symbolEl = document.createElement('div');
            symbolEl.className = 'win-symbol';
            symbolEl.textContent = symbol.icon;
            elements.winSymbols.appendChild(symbolEl);
        });
        
        elements.winModal.classList.add('active');
        
        // Vibração no mobile
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    }

    function closeWinModal() {
        elements.winModal.classList.remove('active');
    }

    function collectPrize() {
        updateBalance(gameState.currentGameData.prize);
        closeWinModal();
        updateUI();
    }

    function showLoading(show) {
        elements.loadingOverlay.classList.toggle('active', show);
    }

    function showError(message) {
        alert(message);
    }

    function clearHistory() {
        elements.resultsContainer.innerHTML = `
            <div class="empty-results">
                <i class="fas fa-ticket-alt"></i>
                <p>Nenhum jogo ainda</p>
            </div>
        `;
    }

    // ========== UTILIDADES ==========
    function getCanvasPosition(e) {
        const rect = elements.scratchCanvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (elements.scratchCanvas.width / rect.width),
            y: (e.clientY - rect.top) * (elements.scratchCanvas.height / rect.height)
        };
    }

    // ========== RESIZE HANDLER ==========
    window.addEventListener('resize', () => {
        setTimeout(setupCanvas, 100);
    });
});