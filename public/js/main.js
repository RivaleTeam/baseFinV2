// Enhanced main.js with casino functionality

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Transaction type labels
function getTransactionTypeLabel(type) {
    const labels = {
        'deposit': 'Depósito',
        'withdraw': 'Saque',
        'bet': 'Aposta',
        'win': 'Ganho',
        'bonus': 'Bônus',
        'referral': 'Indicação',
        'adjustment': 'Ajuste'
    };
    return labels[type] || type;
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/session/logout', {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/';
        } else {
            casinoModal.showAlert('Erro ao fazer logout', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        casinoModal.showAlert('Erro de conexão', 'error');
    }
}

// Mobile menu active state
function setActiveMobileMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.mobile-menu-item');
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        
        const href = item.getAttribute('href');
        if (href && href === currentPath) {
            item.classList.add('active');
        } else if (currentPath === '/' && item.textContent.includes('Início')) {
            item.classList.add('active');
        }
    });
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', function() {
    setActiveMobileMenuItem();
    
    // Load user data on authenticated pages
    if (typeof user !== 'undefined' && user) {
        loadNavBalance();
    }
});

// Load navigation balance
async function loadNavBalance() {
    try {
        const response = await fetch('/api/balance');
        const result = await response.json();
        
        if (result.success) {
            const navBalance = document.getElementById('navBalance');
            if (navBalance) {
                navBalance.textContent = formatCurrency(result.data.available_balance);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar saldo da navegação:', error);
    }
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger)';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });

    return isValid;
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        casinoModal.showAlert('Copiado para a área de transferência!', 'success');
    } catch (error) {
        console.error('Erro ao copiar:', error);
        casinoModal.showAlert('Erro ao copiar', 'error');
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll to element
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Format number with thousands separator
function formatNumber(num) {
    return new Intl.NumberFormat('pt-BR').format(num);
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
        return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    } else {
        return 'Agora';
    }
}

// Theme management
const themeManager = {
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('preferred-theme', theme);
    },
    
    getTheme() {
        return localStorage.getItem('preferred-theme') || 'dark';
    },
    
    init() {
        this.setTheme(this.getTheme());
    }
};

// Initialize theme
themeManager.init();

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        casinoModal.closeAllModals();
    }
    
    // Ctrl/Cmd + K to focus search (if exists)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Performance monitoring
const performance = {
    startTime: Date.now(),
    
    mark(name) {
        console.log(`Performance Mark: ${name} - ${Date.now() - this.startTime}ms`);
    },
    
    measure(name, startMark, endMark) {
        const duration = endMark - startMark;
        console.log(`Performance Measure: ${name} - ${duration}ms`);
    }
};

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    // Show user-friendly error message
    if (typeof casinoModal !== 'undefined') {
        casinoModal.showAlert('Ocorreu um erro inesperado. Tente recarregar a página.', 'error');
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Show user-friendly error message
    if (typeof casinoModal !== 'undefined') {
        casinoModal.showAlert('Erro de conexão. Verifique sua internet.', 'error');
    }
});

// Connection status
function checkConnectionStatus() {
    if (!navigator.onLine) {
        casinoModal.showAlert('Você está offline. Algumas funcionalidades podem não funcionar.', 'warning');
    }
}

window.addEventListener('online', () => {
    casinoModal.showAlert('Conexão restabelecida!', 'success');
});

window.addEventListener('offline', () => {
    casinoModal.showAlert('Você está offline!', 'warning');
});

// Check connection on load
document.addEventListener('DOMContentLoaded', checkConnectionStatus);

const track = document.getElementById("winnersTrack");

if (track){
    const winners = [
        { name: "Maria S***", prize: "1000 Reais", amount: "1.000,00", img: "/assets/imgs/coin.png" },
        { name: "João M***", prize: "500 Reais", amount: "500,00", img: "/assets/imgs/coin.png" },
        { name: "Ana P***", prize: "250 Reais", amount: "250,00", img: "/assets/imgs/coin.png" },
    ];

    const createCard = ({ name, prize, amount, img }) => {
        const card = document.createElement("div");
        card.className = "winner-card";
        card.innerHTML = `
        <img src="${img}" alt="${prize}" class="prize-img" />
        <div class="winner-info">
            <span class="winner-name">${name}</span>
            <span class="winner-prize">${prize}</span>
            <span class="winner-amount"><span class="text-currency">R$</span> ${amount}</span>
        </div>
        `;
        return card;
    };

    const repeatCount = 4; 
    for (let i = 0; i < repeatCount; i++) {
        winners.forEach(winner => {
            track.appendChild(createCard(winner));
        });
    }
};
