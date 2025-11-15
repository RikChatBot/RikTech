class RikTechAI {
    constructor() {
        this.currentChat = [];
        this.chatHistory = JSON.parse(localStorage.getItem('riktech_chat_history')) || [];
        this.init();
    }

    init() {
        // Hide splash screen after 2 seconds
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            this.loadSettings();
            this.attachEventListeners();
        }, 2000);
    }

    attachEventListeners() {
        // Dropdown menu
        const dropdownBtn = document.querySelector('.dropdown-btn');
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdownContent = document.querySelector('.dropdown-content');
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.querySelector('.dropdown-content').style.display = 'none';
        });

        // Menu items
        document.getElementById('newChat').addEventListener('click', (e) => {
            e.preventDefault();
            this.newChat();
        });

        document.getElementById('showHistory').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHistory();
        });

        document.getElementById('showSettings').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettings();
        });

        document.getElementById('showAppInfo').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAppInfo();
        });

        document.getElementById('showDevInfo').addEventListener('click', (e) => {
            e.preventDefault();
            this.showDevInfo();
        });

        // Send message
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
            });
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Settings
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.changeFontSize(e.target.value);
        });
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input
        input.value = '';

        // Add user message to chat
        this.addMessage(message, 'user');

        // Show loading
        const loadingId = this.showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove loading
            this.removeLoading(loadingId);

            if (response.ok) {
                this.addMessage(data.response, 'ai');
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            this.removeLoading(loadingId);
            this.addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'ai');
            console.error('Error:', error);
        }
    }

    addMessage(content, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(content)}</div>
            <div class="message-time">${timestamp}</div>
        `;

        // Remove welcome message if it's the first user message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage && sender === 'user') {
            welcomeMessage.remove();
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to current chat
        this.currentChat.push({
            content,
            sender,
            timestamp: new Date().toISOString()
        });

        // Auto-save to history if it's an AI response
        if (sender === 'ai') {
            this.saveToHistory();
        }
    }

    showLoading() {
        const chatMessages = document.getElementById('chatMessages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.id = 'loading-message';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="loading"></div> Memproses...
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return 'loading-message';
    }

    removeLoading(id) {
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    newChat() {
        if (this.currentChat.length > 0) {
            this.saveToHistory();
        }
        
        this.currentChat = [];
        const chatMessages = document.getElementById('chatMessages');
        
        // Show welcome message if no messages
        if (!document.querySelector('.welcome-message')) {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-robot welcome-icon"></i>
                    <h2>Selamat Datang di RikTech AI</h2>
                    <p>Saya adalah asisten AI yang siap membantu Anda. Mulai percakapan dengan mengetik pesan di bawah!</p>
                </div>
            `;
        } else {
            // Clear all messages except welcome
            const messages = document.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
        }
    }

    showHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        if (this.chatHistory.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Belum ada history percakapan</p>';
        } else {
            this.chatHistory.forEach((chat, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <strong>Percakapan ${this.chatHistory.length - index}</strong>
                    <br>
                    <small>${new Date(chat.timestamp).toLocaleDateString('id-ID')} - ${chat.messages.length} pesan</small>
                `;
                historyItem.addEventListener('click', () => {
                    this.loadHistory(chat);
                    document.getElementById('historyModal').classList.add('hidden');
                });
                historyList.appendChild(historyItem);
            });
        }

        document.getElementById('historyModal').classList.remove('hidden');
    }

    loadHistory(chat) {
        this.newChat();
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        chat.messages.forEach(msg => {
            this.addMessage(msg.content, msg.sender);
        });
    }

    saveToHistory() {
        if (this.currentChat.length > 0) {
            const chat = {
                messages: [...this.currentChat],
                timestamp: new Date().toISOString()
            };

            this.chatHistory.push(chat);
            
            // Keep only last 50 chats
            if (this.chatHistory.length > 50) {
                this.chatHistory = this.chatHistory.slice(-50);
            }

            localStorage.setItem('riktech_chat_history', JSON.stringify(this.chatHistory));
        }
    }

    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    showAppInfo() {
        document.getElementById('appInfoModal').classList.remove('hidden');
    }

    showDevInfo() {
        document.getElementById('devInfoModal').classList.remove('hidden');
    }

    loadSettings() {
        const theme = localStorage.getItem('riktech_theme') || 'light';
        const fontSize = localStorage.getItem('riktech_fontSize') || '16';

        this.changeTheme(theme);
        this.changeFontSize(fontSize);

        document.getElementById('themeSelect').value = theme;
        document.getElementById('fontSize').value = fontSize;
    }

    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('riktech_theme', theme);
    }

    changeFontSize(size) {
        document.documentElement.style.fontSize = size + 'px';
        localStorage.setItem('riktech_fontSize', size);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.riktechAI = new RikTechAI();
});
