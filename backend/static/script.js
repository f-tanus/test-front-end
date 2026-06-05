// ===================== Mobile Sidebar Toggle =====================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when sidebar is open
    if (sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Close sidebar when clicking a nav link on mobile
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });
});

// ===================== Toast Notification System =====================

const ToastTypes = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

function showToast(message, type = ToastTypes.INFO, duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'toast-container';
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        [ToastTypes.SUCCESS]: 'fas fa-check-circle',
        [ToastTypes.ERROR]: 'fas fa-exclamation-circle',
        [ToastTypes.WARNING]: 'fas fa-exclamation-triangle',
        [ToastTypes.INFO]: 'fas fa-info-circle',
    };

    toast.innerHTML = `
        <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.getElementById('toast-container').appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function showError(message) {
    showToast(message, ToastTypes.ERROR, 8000);
}

function showSuccess(message) {
    showToast(message, ToastTypes.SUCCESS, 4000);
}

function showWarning(message) {
    showToast(message, ToastTypes.WARNING, 6000);
}

function showInfo(message) {
    showToast(message, ToastTypes.INFO, 4000);
}

// ===================== Global Error Handlers =====================

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    showError('Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
});

// Override fetch to add global error handling
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch(...args);

        // Check if response is not ok (status >= 400)
        if (!response.ok) {
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.clone().json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Not JSON, use status text
            }

            // Log detailed error
            console.error(`API Error [${response.status}] ${response.url}:`, errorMessage);

            // Create custom error with message
            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = response;
            throw error;
        }

        return response;
    } catch (error) {
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('Network error:', error);
            showError('Erro de conexão com o servidor. Verifique se o servidor está rodando.');
            throw error;
        }

        // Re-throw API errors (they already have .status from our handler above)
        if (error.status) {
            // Don't show toast for 401 - handled by page redirect
            if (error.status !== 401) {
                showError(error.message);
            }
            throw error;
        }

        // Unknown errors
        console.error('Fetch error:', error);
        showError('Erro ao comunicar com o servidor.');
        throw error;
    }
};

// ===================== Modal Utilities =====================

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal on click outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

// ===================== Form Utilities =====================

function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    return data;
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// ===================== Currency & Number Formatting =====================

function formatCurrency(value) {
    return 'R$ ' + parseFloat(value || 0).toFixed(2).replace('.', ',');
}

function parseCurrency(value) {
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    }
    return parseFloat(value) || 0;
}

// ===================== Date Utilities =====================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

console.log('RuralSys scripts loaded successfully');