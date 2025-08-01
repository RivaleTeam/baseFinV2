// Casino Modal System
class CasinoModal {
    constructor() {
        this.currentTab = 'profile';
        this.transactionPage = 1;
        this.transactionLimit = 10;
        this.init();
    }

    init() {
        // URL-based modal loading
        this.handleURLModal();
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            if (typeof user !== 'undefined' && user) {
                this.loadUserData();
            }
        });
    }

    handleURLModal() {
        const hash = window.location.hash;
        if (hash.startsWith('#modal=')) {
            const params = new URLSearchParams(hash.replace('#modal=', ''));
            const modal = params.get('');
            const type = params.get('type');
            
            setTimeout(() => {
                if (modal === 'main') {
                    this.openUserModal();
                    if (type === 'fiat_deposit') {
                        this.switchTab('deposit');
                    } else if (type === 'fiat_withdraw') {
                        this.switchTab('withdraw');
                    }
                }
            }, 500);
        }
    }

    setupEventListeners() {
        // Modal forms
        const modalDepositForm = document.getElementById('modalDepositForm');
        const modalWithdrawForm = document.getElementById('modalWithdrawForm');
        const modalLoginForm = document.getElementById('modalLoginForm');
        const modalRegisterForm = document.getElementById('modalRegisterForm');

        if (modalDepositForm) {
            modalDepositForm.addEventListener('submit', (e) => this.handleDeposit(e));
        }
        
        if (modalWithdrawForm) {
            modalWithdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
        }
        
        if (modalLoginForm) {
            modalLoginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (modalRegisterForm) {
            modalRegisterForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Close modal on backdrop click
        document.querySelectorAll('.casino-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openUserModal() {
        this.openModal('userModal');
        this.loadUserData();
        this.loadTransactions();
    }

    openLoginModal() {
        this.openModal('loginModal');
    }

    openRegisterModal() {
        this.openModal('registerModal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.casino-modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.modal-tab[onclick="switchTab('${tabName}')"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Tab`)?.classList.add('active');

        this.currentTab = tabName;

        // Load specific tab data
        if (tabName === 'transactions') {
            this.loadTransactions();
        } else if (tabName === 'withdraw') {
            this.loadUserData(); // Refresh balance for withdraw
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/balance');
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                
                // Update navigation balance
                const navBalance = document.getElementById('navBalance');
                if (navBalance) {
                    navBalance.textContent = this.formatCurrency(data.available_balance);
                }
                
                // Update profile balances
                const profileAvailable = document.getElementById('profileAvailableBalance');
                const profileBlocked = document.getElementById('profileBlockedBalance');
                const withdrawAvailable = document.getElementById('withdrawAvailableBalance');
                
                if (profileAvailable) profileAvailable.textContent = this.formatCurrency(data.available_balance);
                if (profileBlocked) profileBlocked.textContent = this.formatCurrency(data.blocked_balance);
                if (withdrawAvailable) withdrawAvailable.textContent = this.formatCurrency(data.available_balance);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    async loadTransactions(page = 1) {
        const loadingEl = document.getElementById('transactionsLoading');
        const listEl = document.getElementById('transactionsList');
        const paginationEl = document.getElementById('transactionsPagination');

        if (loadingEl) loadingEl.style.display = 'block';
        if (listEl) listEl.style.display = 'none';
        if (paginationEl) paginationEl.style.display = 'none';

        try {
            const response = await fetch(`/api/me/transactions?page=${page}&limit=${this.transactionLimit}`);
            const result = await response.json();

            if (loadingEl) loadingEl.style.display = 'none';

            if (result.success && result.data.transactions.length > 0) {
                this.renderTransactions(result.data.transactions);
                this.renderPagination(result.data.pagination);
                
                if (listEl) listEl.style.display = 'block';
                if (paginationEl) paginationEl.style.display = 'flex';
            } else {
                if (listEl) {
                    listEl.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Nenhuma transação encontrada.</p>
                        </div>
                    `;
                    listEl.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (listEl) {
                listEl.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--danger);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Erro ao carregar transações.</p>
                    </div>
                `;
                listEl.style.display = 'block';
            }
        }
    }

    renderTransactions(transactions) {
        const listEl = document.getElementById('transactionsList');
        if (!listEl) return;

        const html = transactions.map(transaction => {
            const isPositive = ['deposit', 'win', 'bonus', 'referral'].includes(transaction.type);
            const icon = this.getTransactionIcon(transaction.type);
            const iconClass = this.getTransactionIconClass(transaction.type);
            
            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${iconClass}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-info">
                        <div class="transaction-type">
                            ${this.getTransactionTypeLabel(transaction.type)}
                        </div>
                        <div class="transaction-date">
                            ${this.formatDate(transaction.created_at)}
                        </div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}${this.formatCurrency(Math.abs(transaction.amount))}
                    </div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = html;
    }

    renderPagination(pagination) {
        const paginationEl = document.getElementById('transactionsPagination');
        if (!paginationEl) return;

        let html = '';

        // Previous button
        html += `
            <button ${pagination.page <= 1 ? 'disabled' : ''} 
                    onclick="casinoModal.loadTransactions(${pagination.page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button ${i === pagination.page ? 'class="active"' : ''} 
                        onclick="casinoModal.loadTransactions(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        html += `
            <button ${pagination.page >= pagination.pages ? 'disabled' : ''} 
                    onclick="casinoModal.loadTransactions(${pagination.page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = html;
    }

    async handleDeposit(e) {
        e.preventDefault();
        await this.handleFormSubmit(e, '/api/balance/deposit', 'Depósito realizado com sucesso!');
    }

    async handleWithdraw(e) {
        e.preventDefault();
        await this.handleFormSubmit(e, '/api/balance/withdraw', 'Saque realizado com sucesso!');
    }

    async handleLogin(e) {
        e.preventDefault();
        const result = await this.handleFormSubmit(e, '/api/session/login', 'Login realizado com sucesso!');
        if (result && result.success) {
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const result = await this.handleFormSubmit(e, '/api/session/register', 'Conta criada com sucesso!');
        if (result && result.success) {
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }

    async handleFormSubmit(e, url, successMessage) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(successMessage, 'success');
                form.reset();
                
                // Refresh data if needed
                if (url.includes('/balance/')) {
                    this.loadUserData();
                    this.loadTransactions();
                    this.switchTab('profile'); // Return to profile after transaction
                }
                
                return result;
            } else {
                this.showAlert(result.message, 'error');
                if (result.errors) {
                    result.errors.forEach(error => {
                        this.showAlert(`${error.field}: ${error.message}`, 'warning');
                    });
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showAlert('Erro de conexão. Tente novamente.', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }

        return null;
    }

    showAlert(message, type = 'info', duration = 5000) {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const alertId = 'alert-' + Date.now();
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'});
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
            position: relative;
            cursor: pointer;
        `;

        alertElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); font-size: 1.2rem; margin-left: auto; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(alertElement);

        // Auto remove
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, duration);

        // Click to dismiss
        alertElement.addEventListener('click', () => {
            alertElement.remove();
        });
    }

    getTransactionIcon(type) {
        const icons = {
            'deposit': 'fas fa-plus',
            'withdraw': 'fas fa-minus',
            'bet': 'fas fa-dice',
            'win': 'fas fa-trophy',
            'bonus': 'fas fa-gift',
            'referral': 'fas fa-users',
            'adjustment': 'fas fa-cog'
        };
        return icons[type] || 'fas fa-circle';
    }

    getTransactionIconClass(type) {
        return type;
    }

    getTransactionTypeLabel(type) {
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

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Global instance
const casinoModal = new CasinoModal();

// Global functions for template compatibility
function openUserModal() {
    casinoModal.openUserModal();
}

function openLoginModal() {
    casinoModal.openLoginModal();
}

function openRegisterModal() {
    casinoModal.openRegisterModal();
}

function closeModal(modalId) {
    casinoModal.closeModal(modalId);
}

function switchTab(tabName) {
    casinoModal.switchTab(tabName);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);