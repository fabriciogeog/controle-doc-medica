// ===========================
// SISTEMA DE DOCUMENTAÇÃO MÉDICA
// JavaScript Principal
// ===========================

class DocumentacaoMedica {
    constructor() {
        this.documentos = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.isSubmitting = false;
        this.isUpdating = false;
        
        this.init();
    }
    
    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupTabs();
        this.setupProfissionalSelector();
    }
    
    // ==================
    // HELPER PARA REQUISIÇÕES
    // ==================
    
    async apiCall(url, options = {}) {
        const defaultOptions = {
            credentials: 'include'
        };
        
        // Adicionar Content-Type apenas se não for FormData
        if (options.body && !(options.body instanceof FormData)) {
            defaultOptions.headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
        } else if (options.headers && Object.keys(options.headers).length === 0) {
            // Se headers é um objeto vazio (FormData), não adicionar Content-Type
            defaultOptions.headers = {};
        } else if (options.headers) {
            // Manter headers customizados
            defaultOptions.headers = options.headers;
        }
        
        const finalOptions = {
            ...defaultOptions,
            ...options
        };
        
        const response = await fetch(url, finalOptions);
        
        // Verificar se é erro de autenticação
        if (response.status === 401) {
            this.showToast('🔒 Sessão expirou. Faça login novamente.', 'error');
            this.showLogin();
            throw new Error('Sessão expirou');
        }
        
        return response;
    }
    
    // ==================
    // AUTENTICAÇÃO
    // ==================
    
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.authenticated) {
                this.showApp();
                this.loadDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.showLogin();
        }
    }
    
    showLogin() {
        document.getElementById('loginModal').classList.add('show');
        document.getElementById('app').style.display = 'none';
    }
    
    showApp() {
        document.getElementById('loginModal').classList.remove('show');
        document.getElementById('app').style.display = 'block';
    }
    
    async login(senha) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ senha })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showApp();
                this.loadDashboard();
                this.showToast('Login realizado com sucesso!', 'success');
            } else {
                this.showError('loginError', data.message);
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError('loginError', 'Erro ao fazer login');
        }
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', { 
                method: 'POST',
                credentials: 'include'
            });
            this.showLogin();
            this.showToast('Logout realizado com sucesso!');
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    }
    
    // ==================
    // NAVEGAÇÃO E TABS
    // ==================
    
    setupTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                // Update active states
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(target).classList.add('active');
                
                // Load content based on tab
                this.loadTabContent(target);
            });
        });
    }
    
    loadTabContent(tab) {
        switch (tab) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'documentos':
                this.loadDocumentos();
                break;
            case 'profissionais':
                this.loadProfissionais();
                break;
            case 'cadastrar':
                this.resetForm('cadastroForm');
                break;
            case 'pesquisar':
                this.resetSearchForm();
                break;
        }
    }
    
    // ==================
    // EVENT LISTENERS
    // ==================
    
    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const senha = document.getElementById('senha').value;
            this.login(senha);
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Minha Conta
        document.getElementById('contaBtn').addEventListener('click', () => this.abrirModalConta());

        document.getElementById('perfilForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.atualizarPerfil(e.target);
        });

        document.getElementById('senhaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.alterarSenha(e.target);
        });
        
        // Cadastro de documento
        document.getElementById('cadastroForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarDocumento(e.target);
        });
        
        // Filtros da lista de documentos
        document.getElementById('aplicarFiltros').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('limparFiltros').addEventListener('click', () => {
            this.limparFiltros();
        });
        
        document.getElementById('refreshDocumentos').addEventListener('click', () => {
            this.loadDocumentos();
        });
        
        // Busca
        document.getElementById('btnBuscar').addEventListener('click', () => {
            this.buscarDocumentos();
        });
        
        document.getElementById('buscarAvancado').addEventListener('click', () => {
            this.buscarAvancado();
        });
        
        document.getElementById('limparBusca').addEventListener('click', () => {
            this.resetSearchForm();
        });
        
        // Busca rápida com Enter
        document.getElementById('busca').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarDocumentos();
            }
        });
        
        // Profissionais
        document.getElementById('novoProfissionalBtn').addEventListener('click', () => {
            this.abrirModalProfissional();
        });
        
        document.getElementById('refreshProfissionais').addEventListener('click', () => {
            this.loadProfissionais();
        });
        
        document.getElementById('filtrarProfissionais').addEventListener('click', () => {
            this.aplicarFiltrosProfissionais();
        });
        
        document.getElementById('limparFiltrosProfissionais').addEventListener('click', () => {
            this.limparFiltrosProfissionais();
        });
        
        // Busca de profissionais com Enter
        document.getElementById('buscaProfissional').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aplicarFiltrosProfissionais();
            }
        });
        
        // Form de profissional
        document.getElementById('profissionalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarProfissional(e.target);
        });
        
        // Modais
        this.setupModalEvents();
    }
    
    setupModalEvents() {
        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.remove('show');
            });
        });
        
        // Fechar modal clicando fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        // Modal de confirmação
        document.getElementById('confirmNo').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('show');
        });
    }
    
    // ==================
    // DASHBOARD
    // ==================
    
    async loadDashboard() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/estatisticas');
            const data = await response.json();
            
            if (data.success) {
                this.updateDashboardStats(data.data);
                this.renderDocumentosRecentes(data.data.documentosRecentes);
                this.renderGraficoTipos(data.data.documentosPorTipo);
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showToast('Erro ao carregar dashboard', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    updateDashboardStats(stats) {
        const total = stats.totalDocumentos || 0;
        document.getElementById('totalDocumentos').textContent = total;
        
        if (stats.documentosPorTipo && stats.documentosPorTipo.length > 0) {
            const tipoMaisComum = stats.documentosPorTipo[0];
            document.getElementById('tipoMaisComum').textContent = tipoMaisComum._id;
            
            // Adicionar informação adicional se disponível
            const tipoElement = document.getElementById('tipoMaisComum').parentElement;
            const subtitleElement = tipoElement.querySelector('.stats-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = `${tipoMaisComum.total} documento(s)`;
            }
        } else {
            document.getElementById('tipoMaisComum').textContent = '-';
        }
        
        if (stats.documentosPorEspecialidade && stats.documentosPorEspecialidade.length > 0) {
            const espMaisComum = stats.documentosPorEspecialidade[0];
            document.getElementById('especialidadeMaisComum').textContent = espMaisComum._id;
            
            // Adicionar informação adicional se disponível
            const espElement = document.getElementById('especialidadeMaisComum').parentElement;
            const subtitleElement = espElement.querySelector('.stats-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = `${espMaisComum.total} documento(s)`;
            }
        } else {
            document.getElementById('especialidadeMaisComum').textContent = '-';
        }
        
        // Adicionar informação sobre profissionais se disponível
        this.updateProfissionaisStats();
    }
    
    async updateProfissionaisStats() {
        try {
            const response = await this.apiCall('/api/profissionais?limit=1&ativo=true');
            const data = await response.json();
            
            if (data.success) {
                // Adicionar card de profissionais se não existir
                const dashboardGrid = document.querySelector('.dashboard-grid');
                let profissionaisCard = document.getElementById('totalProfissionais');
                
                if (!profissionaisCard) {
                    const cardHtml = `
                        <div class="stats-card">
                            <div class="stats-icon">👨‍⚕️</div>
                            <div class="stats-info">
                                <h3 id="totalProfissionais">0</h3>
                                <p>Profissionais Ativos</p>
                                <span class="stats-subtitle"></span>
                            </div>
                        </div>
                    `;
                    dashboardGrid.insertAdjacentHTML('beforeend', cardHtml);
                    profissionaisCard = document.getElementById('totalProfissionais');
                }
                
                profissionaisCard.textContent = data.total || 0;
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas de profissionais:', error);
        }
    }
    
    renderDocumentosRecentes(documentos) {
        const container = document.getElementById('documentosRecentes');
        
        if (!documentos || documentos.length === 0) {
            container.innerHTML = `
                <div class="empty-docs-state">
                    <div class="empty-docs-icon">📊</div>
                    <p>Nenhum documento cadastrado ainda</p>
                    <small>Seus documentos mais recentes aparecerão aqui</small>
                </div>
            `;
            return;
        }
        
        const documentosHtml = `
            <div class="recent-docs-container">
                <div class="docs-grid">
                    ${documentos.map((doc, index) => {
                        const diasAtras = this.calcularDiasAtras(doc.dataCriacaoRegistro);
                        const profissional = doc.profissionalSolicitante?.nome || 'Não informado';
                        
                        return `
                            <div class="recent-doc-card" style="animation-delay: ${index * 0.1}s">
                                <div class="doc-card-header">
                                    <div class="doc-type-badge">${this.getDocumentIcon(doc.tipoDocumento)} ${doc.tipoDocumento}</div>
                                    <div class="doc-date">
                                        ${diasAtras === 0 ? 'Hoje' : 
                                          diasAtras === 1 ? 'Ontem' : 
                                          `${diasAtras} dias atrás`}
                                    </div>
                                </div>
                                
                                <div class="doc-card-content">
                                    <h4 class="doc-title">${doc.descricao}</h4>
                                    <div class="doc-meta">
                                        <div class="doc-specialty">
                                            <span class="specialty-icon">🎖️</span>
                                            <span>${doc.especialidadeMedica}</span>
                                        </div>
                                        <div class="doc-professional">
                                            <span class="professional-icon">👨‍⚕️</span>
                                            <span>${profissional}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="doc-card-footer">
                                    <span class="doc-created-date">${this.formatDate(doc.dataSolicitacaoEmissao)}</span>
                                    <button class="btn-view-doc" onclick="app.visualizarDocumento('${doc._id}')" title="Visualizar documento">
                                        👁️
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="view-all-docs">
                    <button class="btn btn-outline" onclick="app.switchTab('documentos')">
                        📄 Ver Todos os Documentos
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = documentosHtml;
    }
    
    calcularDiasAtras(dataString) {
        const data = new Date(dataString);
        const hoje = new Date();
        const diffTime = Math.abs(hoje - data);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    getDocumentIcon(tipo) {
        const icons = {
            'Relatório': '📋',
            'Exame': '🔬',
            'Receita': '💊',
            'Laudo': '📄',
            'Atestado': '📑',
            'Cartão de Vacina': '💉',
            'Resultado': '📊',
            'Outro': '📁'
        };
        return icons[tipo] || '📄';
    }
    
    switchTab(tabName) {
        // Simular clique na aba
        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
            tab.click();
        }
    }
    
    renderGraficoTipos(tipos) {
        const container = document.getElementById('graficoTipos');
        
        if (!tipos || tipos.length === 0) {
            container.innerHTML = `
                <div class="empty-chart-state">
                    <div class="empty-chart-icon">📈</div>
                    <p>Nenhum documento cadastrado ainda</p>
                    <small>Os gráficos aparecerão após o primeiro cadastro</small>
                </div>
            `;
            return;
        }
        
        const total = tipos.reduce((sum, tipo) => sum + tipo.total, 0);
        const maxValue = Math.max(...tipos.map(t => t.total));
        
        // Cores para os diferentes tipos
        const cores = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', 
            '#4facfe', '#00f2fe', '#a8edea', '#fed6e3',
            '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
        ];
        
        const chartHtml = `
            <div class="chart-container">
                <div class="chart-header">
                    <div class="chart-summary">
                        <span class="total-docs">${total} documentos</span>
                        <span class="chart-types">${tipos.length} tipo(s)</span>
                    </div>
                </div>
                <div class="horizontal-bars">
                    ${tipos.map((tipo, index) => {
                        const percentage = ((tipo.total / total) * 100).toFixed(1);
                        const barWidth = ((tipo.total / maxValue) * 100).toFixed(1);
                        const cor = cores[index % cores.length];
                        
                        return `
                            <div class="bar-item">
                                <div class="bar-header">
                                    <div class="bar-label">
                                        <span class="bar-icon" style="background: ${cor}"></span>
                                        <span class="bar-name">${tipo._id}</span>
                                    </div>
                                    <div class="bar-values">
                                        <span class="bar-count">${tipo.total}</span>
                                        <span class="bar-percentage">${percentage}%</span>
                                    </div>
                                </div>
                                <div class="bar-track">
                                    <div class="bar-fill" style="width: ${barWidth}%; background: ${cor}"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = chartHtml;
    }
    
    // ==================
    // DOCUMENTOS CRUD
    // ==================
    
    async loadDocumentos(page = 1, filters = {}) {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: page,
                limit: 10,
                ...filters
            });
            
            const response = await fetch(`/api/documentos?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.documentos = data.data;
                this.renderDocumentos(data.data);
                this.renderPaginacao(data.page, data.pages, data.total);
            }
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            this.showToast('Erro ao carregar documentos', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    renderDocumentos(documentos) {
        const container = document.getElementById('listaDocumentos');
        
        if (!documentos || documentos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <p>Nenhum documento encontrado</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = documentos.map(doc => this.renderDocumentoCard(doc)).join('');
    }
    
    renderDocumentoCard(doc) {
        const arquivos = doc.arquivos?.map(arquivo => `
            <div class="arquivo-item" style="margin: 5px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${this.getFileIcon(arquivo.tipoArquivo)}</span>
                    <div style="flex: 1;">
                        <strong>${arquivo.nomeArquivo}</strong><br>
                        <small style="color: #666;">📁 ${arquivo.caminhoAbsoluto}</small>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="app.abrirVisualizacao('${doc._id}')" title="Abrir no visualizador">
                        👁️ Ver
                    </button>
                </div>
            </div>
        `).join('') || '';
        
        const tags = doc.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || '';
        
        return `
            <div class="documento-card">
                <div class="documento-header">
                    <span class="documento-tipo">${doc.tipoDocumento}</span>
                    <span class="documento-data">${this.formatDate(doc.dataSolicitacaoEmissao)}</span>
                </div>
                
                <h4 class="documento-titulo">${doc.descricao}</h4>
                
                <div class="documento-info">
                    <div class="documento-info-item">
                        <strong>Especialidade:</strong> ${doc.especialidadeMedica}
                    </div>
                    <div class="documento-info-item">
                        <strong>Profissional:</strong> ${doc.profissionalSolicitante.nome}
                    </div>
                    <div class="documento-info-item">
                        <strong>Registro:</strong> ${doc.profissionalSolicitante.numeroRegistro}
                    </div>
                    <div class="documento-info-item">
                        <strong>Instituição:</strong> ${doc.instituicao.nome}
                    </div>
                </div>
                
                ${tags ? `<div class="documento-tags">${tags}</div>` : ''}
                
                ${arquivos ? `<div class="documento-arquivos">${arquivos}</div>` : ''}
                
                ${doc.observacoes ? `<p><strong>Observações:</strong> ${doc.observacoes}</p>` : ''}
                
                <div class="documento-actions">
                    <button class="btn btn-primary btn-sm" onclick="app.abrirVisualizacao('${doc._id}')">👁️ Visualizar</button>
                    <button class="btn btn-outline btn-sm" onclick="app.clonarDocumento('${doc._id}', '${doc.descricao.replace(/'/g, '\\\'')}')">🔄 Clonar</button>
                    <button class="btn btn-outline btn-sm" onclick="app.editarDocumento('${doc._id}')">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="app.confirmarExclusao('${doc._id}', '${doc.descricao.replace(/'/g, '\\\'')}')">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }
    
    async salvarDocumento(form) {
        // Prevenir dupla submissão
        if (this.isSubmitting) {
            return;
        }
        
        try {
            this.isSubmitting = true;
            this.showLoading();
            
            // Desabilitar botão de submit
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 Salvando...';
            
            const formData = new FormData(form);
            
            const response = await fetch('/api/documentos', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Documento salvo com sucesso!', 'success');
                this.resetForm('cadastroForm');
                
                // Atualizar dashboard se estiver na aba ativa
                if (document.querySelector('.nav-tab[data-tab="dashboard"]').classList.contains('active')) {
                    this.loadDashboard();
                }
            } else {
                this.showToast(data.message, 'error');
            }
            
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
        } catch (error) {
            console.error('Erro ao salvar documento:', error);
            this.showToast('Erro ao salvar documento', 'error');
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }
    
    async editarDocumento(id) {
        try {
            console.log('Iniciando edição do documento:', id);
            this.showLoading();
            
            const response = await this.apiCall(`/api/documentos/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dados carregados para edição:', data);
            
            if (data.success) {
                this.fillEditForm(data.data);
                document.getElementById('editModal').classList.add('show');
                console.log('Modal de edição aberto com sucesso');
            } else {
                console.error('API retornou erro:', data.message);
                this.showToast('Erro ao carregar documento: ' + data.message, 'error');
            }
        } catch (error) {
            if (error.message === 'Sessão expirou') {
                return; // Já tratado pela apiCall
            }
            console.error('Erro ao carregar documento para edição:', error);
            this.showToast('Erro ao carregar documento: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // 🔄 Função de clonagem de documento
    async clonarDocumento(id, titulo) {
        // Remover escape do título para exibição correta
        if (typeof titulo === 'string') {
            titulo = titulo.replace(/\\(.)/g, '$1');
        }
        
        // Modal de confirmação personalizado para clonagem
        const modalHtml = `
            <div class="modal" id="cloneModal" style="display: flex;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔄 Clonar Documento</h3>
                        <button class="modal-close" onclick="document.getElementById('cloneModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Documento a ser clonado:</strong></p>
                        <p style="background: var(--cor-fundo); padding: var(--espaco-md); border-radius: var(--borda-raio); margin: var(--espaco-md) 0;">
                            📄 ${titulo}
                        </p>
                        <p><strong>O que será clonado:</strong></p>
                        <ul style="margin-left: var(--espaco-lg);">
                            <li>✅ Todos os dados do documento</li>
                            <li>✅ Referencias dos arquivos anexados</li>
                            <li>✅ Informações do profissional e instituição</li>
                        </ul>
                        <p><strong>O que será diferente:</strong></p>
                        <ul style="margin-left: var(--espaco-lg);">
                            <li>🆕 Novo ID único será gerado</li>
                            <li>📅 Data de criação atualizada para agora</li>
                            <li>🏷️ Descrição terá prefixo "[CÓPIA]"</li>
                        </ul>
                        <div style="background: var(--cor-info); color: white; padding: var(--espaco-md); border-radius: var(--borda-raio); margin-top: var(--espaco-lg);">
                            <strong>📝 Após a clonagem:</strong> O documento será aberto automaticamente em modo de edição para que você possa fazer os ajustes necessários.
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="document.getElementById('cloneModal').remove()">
                            ❌ Cancelar
                        </button>
                        <button class="btn btn-primary" onclick="app.executarClonagem('${id}')">
                            🔄 Clonar Documento
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    async executarClonagem(id) {
        try {
            // Fechar modal de confirmação
            const modal = document.getElementById('cloneModal');
            if (modal) modal.remove();
            
            this.showLoading();
            this.showToast('🔄 Clonando documento...', 'info');
            
            const response = await fetch(`/api/documentos/${id}/clonar`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('✅ Documento clonado com sucesso!', 'success');
                
                // Atualizar lista de documentos
                this.loadDocumentos(this.currentPage, this.currentFilters);
                this.loadDashboard();
                
                // Aguardar um momento e abrir em edição
                setTimeout(() => {
                    this.editarDocumento(data.data.documentoClonado);
                }, 1000);
                
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao clonar documento:', error);
            this.showToast('Erro ao clonar documento', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    confirmarExclusao(id, titulo) {
        // Remover escape do título para exibição correta
        if (typeof titulo === 'string') {
            titulo = titulo.replace(/\\(.)/g, '$1');
        }
        
        document.getElementById('confirmMessage').textContent = 
            `Tem certeza que deseja excluir o documento "${titulo}"? Esta ação não pode ser desfeita.`;
        
        // Garantir que o handler tenha uma referência correta ao id
        const docId = id; // Criar uma cópia local do id
        document.getElementById('confirmYes').onclick = () => {
            this.excluirDocumento(docId);
            document.getElementById('confirmModal').classList.remove('show');
        };
        
        document.getElementById('confirmModal').classList.add('show');
    }
    
    async excluirDocumento(id) {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/documentos/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Documento excluído com sucesso!', 'success');
                this.loadDocumentos(this.currentPage, this.currentFilters);
                this.loadDashboard();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir documento:', error);
            this.showToast('Erro ao excluir documento', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // ==================
    // BUSCA E FILTROS
    // ==================
    
    aplicarFiltros() {
        this.currentFilters = {
            tipoDocumento: document.getElementById('filtroTipo').value,
            especialidadeMedica: document.getElementById('filtroEspecialidade').value,
            dataInicio: document.getElementById('filtroDataInicio').value,
            dataFim: document.getElementById('filtroDataFim').value
        };
        
        // Remove filtros vazios
        Object.keys(this.currentFilters).forEach(key => {
            if (!this.currentFilters[key]) {
                delete this.currentFilters[key];
            }
        });
        
        this.currentPage = 1;
        this.loadDocumentos(this.currentPage, this.currentFilters);
    }
    
    limparFiltros() {
        document.getElementById('filtroTipo').value = '';
        document.getElementById('filtroEspecialidade').value = '';
        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        
        this.currentFilters = {};
        this.currentPage = 1;
        this.loadDocumentos();
    }
    
    async buscarDocumentos() {
        const busca = document.getElementById('busca').value.trim();
        
        if (!busca) {
            this.showToast('Digite algo para buscar', 'warning');
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await fetch(`/api/documentos?busca=${encodeURIComponent(busca)}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderResultadosBusca(data.data, busca);
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            this.showToast('Erro na busca', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async buscarAvancado() {
        const filtros = {
            profissional: document.getElementById('buscaProfissional').value,
            instituicao: document.getElementById('buscaInstituicao').value,
            dataInicio: document.getElementById('buscaDataInicio').value,
            dataFim: document.getElementById('buscaDataFim').value
        };
        
        // Remove filtros vazios
        Object.keys(filtros).forEach(key => {
            if (!filtros[key]) {
                delete filtros[key];
            }
        });
        
        if (Object.keys(filtros).length === 0) {
            this.showToast('Preencha pelo menos um campo de busca', 'warning');
            return;
        }
        
        try {
            this.showLoading();
            
            const params = new URLSearchParams(filtros);
            const response = await fetch(`/api/documentos?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderResultadosBusca(data.data, 'busca avançada');
            }
        } catch (error) {
            console.error('Erro na busca avançada:', error);
            this.showToast('Erro na busca avançada', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    renderResultadosBusca(documentos, termo) {
        const container = document.getElementById('resultadosBusca');
        
        if (!documentos || documentos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>Nenhum resultado encontrado para "${termo}"</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <h3>🔍 Resultados para "${termo}" (${documentos.length} encontrado${documentos.length !== 1 ? 's' : ''})</h3>
            <div class="documentos-lista">
                ${documentos.map(doc => this.renderDocumentoCard(doc)).join('')}
            </div>
        `;
    }
    
    resetSearchForm() {
        document.getElementById('busca').value = '';
        document.getElementById('buscaProfissional').value = '';
        document.getElementById('buscaInstituicao').value = '';
        document.getElementById('buscaDataInicio').value = '';
        document.getElementById('buscaDataFim').value = '';
        
        document.getElementById('resultadosBusca').innerHTML = '';
    }
    
    // ==================
    // PAGINAÇÃO
    // ==================
    
    renderPaginacao(currentPage, totalPages, total) {
        const container = document.getElementById('paginacao');
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const pages = [];
        
        // Botão Anterior
        pages.push(`
            <button ${currentPage <= 1 ? 'disabled' : ''} onclick="app.goToPage(${currentPage - 1})">
                ← Anterior
            </button>
        `);
        
        // Números das páginas
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pages.push(`
                <button class="${i === currentPage ? 'active' : ''}" onclick="app.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        // Botão Próximo
        pages.push(`
            <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="app.goToPage(${currentPage + 1})">
                Próximo →
            </button>
        `);
        
        container.innerHTML = `
            ${pages.join('')}
            <span class="page-info">Total: ${total} documento${total !== 1 ? 's' : ''}</span>
        `;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.loadDocumentos(page, this.currentFilters);
    }
    
    // ==================
    // UTILITÁRIOS
    // ==================
    
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    formatDateTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('image')) return '🖼️';
        return '📄';
    }
    
    resetForm(formId) {
        const form = document.getElementById(formId);
        form.reset();
        
        // Limpar mensagens de erro
        form.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    fillEditForm(documento) {
        // Preencher formulário de edição com dados do documento
        const editForm = document.getElementById('editForm');
        
        // Criar campos do formulário dinamicamente se não existirem
        if (!editForm.querySelector('#editTipoDocumento')) {
            this.createEditFormFields(editForm);
        }
        
        // Preencher campos
        document.getElementById('editId').value = documento._id;
        document.getElementById('editTipoDocumento').value = documento.tipoDocumento;
        document.getElementById('editEspecialidadeMedica').value = documento.especialidadeMedica;
        document.getElementById('editDataSolicitacaoEmissao').value = documento.dataSolicitacaoEmissao?.split('T')[0];
        document.getElementById('editProfissionalNome').value = documento.profissionalSolicitante?.nome || '';
        document.getElementById('editProfissionalRegistro').value = documento.profissionalSolicitante?.numeroRegistro || '';
        document.getElementById('editProfissionalEspecialidade').value = documento.profissionalSolicitante?.especialidade || '';
        document.getElementById('editDescricao').value = documento.descricao;
        document.getElementById('editInstituicaoNome').value = documento.instituicao?.nome || '';
        document.getElementById('editInstituicaoCnpj').value = documento.instituicao?.cnpj || '';
        document.getElementById('editTags').value = documento.tags?.join(', ') || '';
        document.getElementById('editObservacoes').value = documento.observacoes || '';
    }
    
    createEditFormFields(editForm) {
        editForm.innerHTML = `
            <input type="hidden" id="editId" name="id">
            
            <div class="form-group">
                <label for="editTipoDocumento" class="required">Tipo do Documento:</label>
                <select id="editTipoDocumento" name="tipoDocumento" required>
                    <option value="">Selecione...</option>
                    <option value="Relatório">Relatório</option>
                    <option value="Exame">Exame</option>
                    <option value="Receita">Receita</option>
                    <option value="Laudo">Laudo</option>
                    <option value="Atestado">Atestado</option>
                    <option value="Cartão de Vacina">Cartão de Vacina</option>
                    <option value="Resultado">Resultado</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="editEspecialidadeMedica" class="required">Especialidade Médica:</label>
                <input type="text" id="editEspecialidadeMedica" name="especialidadeMedica" required 
                       placeholder="Ex: Cardiologia, Neurologia, Pediatria">
            </div>
            
            <div class="form-group">
                <label for="editDataSolicitacaoEmissao" class="required">Data do Documento:</label>
                <input type="date" id="editDataSolicitacaoEmissao" name="dataSolicitacaoEmissao" required>
            </div>
            
            <div class="form-group">
                <label for="editProfissionalNome" class="required">Nome do Profissional:</label>
                <input type="text" id="editProfissionalNome" name="profissionalSolicitante.nome" required 
                       placeholder="Ex: Dr. João Silva">
            </div>
            
            <div class="form-group">
                <label for="editProfissionalRegistro" class="required">Registro Profissional:</label>
                <input type="text" id="editProfissionalRegistro" name="profissionalSolicitante.numeroRegistro" required 
                       placeholder="Ex: CRM/SP 123456">
            </div>
            
            <div class="form-group">
                <label for="editProfissionalEspecialidade">Especialidade do Profissional:</label>
                <input type="text" id="editProfissionalEspecialidade" name="profissionalSolicitante.especialidade" 
                       placeholder="Ex: Cardiologista">
            </div>
            
            <div class="form-group full-width">
                <label for="editDescricao" class="required">Descrição:</label>
                <textarea id="editDescricao" name="descricao" rows="4" required 
                          placeholder="Descrição detalhada do documento"></textarea>
            </div>
            
            <div class="form-group">
                <label for="editInstituicaoNome" class="required">Nome da Instituição:</label>
                <input type="text" id="editInstituicaoNome" name="instituicao.nome" required 
                       placeholder="Ex: Hospital São Lucas">
            </div>
            
            <div class="form-group">
                <label for="editInstituicaoCnpj">CNPJ da Instituição:</label>
                <input type="text" id="editInstituicaoCnpj" name="instituicao.cnpj" 
                       placeholder="00.000.000/0000-00">
            </div>
            
            <div class="form-group full-width">
                <label for="editTags">Tags (separadas por vírgula):</label>
                <input type="text" id="editTags" name="tags" 
                       placeholder="Ex: exame, sangue, rotina">
            </div>
            
            <div class="form-group full-width">
                <label for="editObservacoes">Observações:</label>
                <textarea id="editObservacoes" name="observacoes" rows="3" 
                          placeholder="Observações adicionais sobre o documento"></textarea>
            </div>
            
            <div class="form-actions full-width">
                <button type="submit" class="btn btn-primary">💾 Atualizar Documento</button>
                <button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('show')">❌ Cancelar</button>
            </div>
        `;
        
        // Adicionar event listener para o formulário de edição
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.atualizarDocumento(e.target);
        });
    }
    
    async atualizarDocumento(form) {
        // Prevenir dupla submissão
        if (this.isUpdating) {
            return;
        }
        
        try {
            this.isUpdating = true;
            this.showLoading();
            
            // Desabilitar botão de submit
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 Atualizando...';
            
            const formData = new FormData(form);
            const id = formData.get('id');
            
            const response = await this.apiCall(`/api/documentos/${id}`, {
                method: 'PUT',
                headers: {}, // Remover Content-Type para FormData
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Documento atualizado com sucesso!', 'success');
                document.getElementById('editModal').classList.remove('show');
                this.loadDocumentos(this.currentPage, this.currentFilters);
                this.loadDashboard();
            } else {
                this.showToast(data.message, 'error');
            }
            
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
        } catch (error) {
            console.error('Erro ao atualizar documento:', error);
            this.showToast('Erro ao atualizar documento', 'error');
        } finally {
            this.isUpdating = false;
            this.hideLoading();
        }
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        container.textContent = message;
        container.style.display = 'block';
    }
    
    // Função para capturar caminhos dos arquivos selecionados
    capturarCaminhos(input) {
        const arquivos = input.files;
        const caminhos = [];
        const lista = document.getElementById('listaArquivosSelecionados');
        const campoHidden = document.getElementById('caminhos');
        
        if (arquivos.length === 0) {
            lista.innerHTML = '';
            campoHidden.value = '';
            return;
        }
        
        // Processar cada arquivo selecionado
        for (let i = 0; i < arquivos.length; i++) {
            const arquivo = arquivos[i];
            // Como o navegador não fornece o caminho completo por questões de segurança,
            // vamos simular um caminho baseado no diretório real do usuário
            const caminhoSimulado = `/home/fabricio/Documentos/Assuntos - Pedro/Pedro - Saúde/${arquivo.name}`;
            caminhos.push(caminhoSimulado);
        }
        
        // Atualizar a lista visual
        lista.innerHTML = `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <strong>Arquivos Selecionados (${arquivos.length}):</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${caminhos.map(c => `<li><small>${c}</small></li>`).join('')}
                </ul>
                <small><em>⚠️ Nota: Os caminhos são baseados nos nomes dos arquivos. 
                Certifique-se de que os arquivos estão no local correto ou edite os caminhos conforme necessário.</em></small>
                <button type="button" class="btn btn-outline btn-sm" style="margin-top: 10px;" onclick="app.editarCaminhos()">
                    ✏️ Editar Caminhos
                </button>
            </div>
        `;
        
        // Atualizar campo hidden com os caminhos
        campoHidden.value = caminhos.join('\n');
    }
    
    // Função para permitir edição manual dos caminhos
    editarCaminhos() {
        const campoHidden = document.getElementById('caminhos');
        const lista = document.getElementById('listaArquivosSelecionados');
        
        const caminhos = campoHidden.value.split('\n').filter(c => c.trim());
        
        lista.innerHTML = `
            <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <strong>Editar Caminhos dos Arquivos:</strong>
                <textarea id="editarCaminhosText" rows="4" style="width: 100%; margin: 10px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">${caminhos.join('\n')}</textarea>
                <div style="display: flex; gap: 10px;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="app.salvarCaminhos()">
                        💾 Salvar
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="app.cancelarEdicaoCaminhos()">
                        ❌ Cancelar
                    </button>
                </div>
                <small><em>📝 Digite o caminho completo de cada arquivo, um por linha.</em></small>
            </div>
        `;
    }
    
    salvarCaminhos() {
        const novosCaminhos = document.getElementById('editarCaminhosText').value;
        const campoHidden = document.getElementById('caminhos');
        const lista = document.getElementById('listaArquivosSelecionados');
        
        campoHidden.value = novosCaminhos;
        
        const caminhos = novosCaminhos.split('\n').filter(c => c.trim());
        
        lista.innerHTML = `
            <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; border: 1px solid #4caf50;">
                <strong>✅ Caminhos Salvos (${caminhos.length}):</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${caminhos.map(c => `<li><small>${c}</small></li>`).join('')}
                </ul>
                <button type="button" class="btn btn-outline btn-sm" style="margin-top: 10px;" onclick="app.editarCaminhos()">
                    ✏️ Editar Novamente
                </button>
            </div>
        `;
        
        this.showToast('Caminhos dos arquivos salvos!', 'success');
    }
    
    cancelarEdicaoCaminhos() {
        const campoHidden = document.getElementById('caminhos');
        const caminhos = campoHidden.value.split('\n').filter(c => c.trim());
        const lista = document.getElementById('listaArquivosSelecionados');
        
        lista.innerHTML = `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <strong>Arquivos Selecionados (${caminhos.length}):</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${caminhos.map(c => `<li><small>${c}</small></li>`).join('')}
                </ul>
                <button type="button" class="btn btn-outline btn-sm" style="margin-top: 10px;" onclick="app.editarCaminhos()">
                    ✏️ Editar Caminhos
                </button>
            </div>
        `;
    }
    
    visualizarArquivoEmbutido(caminho, nome) {
        const panel = document.getElementById('fileViewerPanel');
        const content = document.getElementById('fileViewerContent');
        const title = document.getElementById('fileViewerTitle');

        const url = '/api/visualizar-arquivo?caminho=' + encodeURIComponent(caminho);
        const ext = caminho.split('.').pop().toLowerCase();
        const ehImagem = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

        content.innerHTML = '';
        title.textContent = nome || caminho.split('/').pop();

        if (ehImagem) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = nome;
            img.className = 'file-viewer-img';
            content.appendChild(img);
        } else {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.className = 'file-viewer-iframe';
            iframe.title = nome;
            content.appendChild(iframe);
        }

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    fecharVisualizador() {
        const panel = document.getElementById('fileViewerPanel');
        const content = document.getElementById('fileViewerContent');
        panel.style.display = 'none';
        content.innerHTML = '';
    }
    
    // ==================
    // MODAL DE VISUALIZAÇÃO
    // ==================
    
    async abrirVisualizacao(documentoId) {
        try {
            console.log('Iniciando visualização do documento:', documentoId);
            this.showLoading();
            
            const response = await this.apiCall(`/api/documentos/${documentoId}`);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                this.preencherModalVisualizacao(data.data);
                document.getElementById('viewModal').classList.add('show');
                console.log('Modal de visualização aberto com sucesso');
            } else {
                console.error('API retornou erro:', data.message);
                this.showToast('Erro ao carregar documento: ' + (data.message || 'Erro desconhecido'), 'error');
            }
        } catch (error) {
            if (error.message === 'Sessão expirou') {
                return; // Já tratado pela apiCall
            }
            console.error('Erro ao carregar documento:', error);
            this.showToast('Erro ao carregar documento: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    preencherModalVisualizacao(documento) {
        // Armazenar documento atual para outras ações
        this.currentViewDocument = documento;
        
        // Informações básicas
        document.getElementById('view-tipoDocumento').textContent = documento.tipoDocumento || '';
        document.getElementById('view-especialidadeMedica').textContent = documento.especialidadeMedica || '';
        document.getElementById('view-dataSolicitacaoEmissao').textContent = 
            documento.dataSolicitacaoEmissao ? this.formatDate(documento.dataSolicitacaoEmissao) : '';
        document.getElementById('view-descricao').textContent = documento.descricao || '';
        
        // Profissional
        const prof = documento.profissionalSolicitante || {};
        document.getElementById('view-profissionalNome').textContent = prof.nome || '';
        document.getElementById('view-profissionalRegistro').textContent = prof.numeroRegistro || '';
        document.getElementById('view-profissionalEspecialidade').textContent = prof.especialidade || '';
        
        // Instituição
        const inst = documento.instituicao || {};
        document.getElementById('view-instituicaoNome').textContent = inst.nome || '';
        document.getElementById('view-instituicaoCnpj').textContent = inst.cnpj || '';
        
        // Tags
        this.preencherTags(documento.tags || []);
        
        // Observações
        document.getElementById('view-observacoes').textContent = documento.observacoes || 'Nenhuma observação';
        
        // Arquivos
        this.preencherArquivos(documento.arquivos || []);
        
        // Datas
        document.getElementById('view-dataCriacao').textContent = 
            documento.dataCriacaoRegistro ? this.formatDateTime(documento.dataCriacaoRegistro) : '';
        document.getElementById('view-dataAtualizacao').textContent = 
            documento.dataAtualizacao ? this.formatDateTime(documento.dataAtualizacao) : '';
    }
    
    preencherTags(tags) {
        const container = document.getElementById('view-tags');
        container.innerHTML = '';
        
        if (tags.length === 0) {
            container.innerHTML = '<div class="view-empty">Nenhuma tag adicionada</div>';
            return;
        }
        
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'view-tag';
            tagElement.textContent = tag;
            container.appendChild(tagElement);
        });
    }
    
    preencherArquivos(arquivos) {
        const container = document.getElementById('view-arquivos');
        container.innerHTML = '';
        
        if (arquivos.length === 0) {
            container.innerHTML = '<div class="view-empty">Nenhum arquivo anexado</div>';
            return;
        }
        
        arquivos.forEach(arquivo => {
            const arquivoDiv = document.createElement('div');
            arquivoDiv.className = 'view-file';
            
            // Ícone baseado no tipo
            let icone = '📄';
            let iconClass = 'other-icon';
            if (arquivo.tipoArquivo === 'pdf' || arquivo.caminhoAbsoluto?.toLowerCase().endsWith('.pdf')) {
                icone = '📜';
                iconClass = 'pdf-icon';
            } else if (arquivo.tipoArquivo === 'imagem' || arquivo.caminhoAbsoluto?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                icone = '🖼️';
                iconClass = 'image-icon';
            }
            
            arquivoDiv.innerHTML = `
                <div class="view-file-info">
                    <div class="view-file-name">
                        <span class="view-file-icon ${iconClass}">${icone}</span>
                        ${arquivo.nomeArquivo || 'Arquivo sem nome'}
                    </div>
                    <div class="view-file-path">${arquivo.caminhoAbsoluto || ''}</div>
                    ${arquivo.descricaoArquivo ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${arquivo.descricaoArquivo}</div>` : ''}
                </div>
                <div class="view-file-actions">
                    ${arquivo.caminhoAbsoluto ? `
                        <button class="btn btn-outline btn-sm" onclick="app.visualizarArquivoEmbutido('${arquivo.caminhoAbsoluto}', '${(arquivo.nomeArquivo || 'arquivo').replace(/'/g, "\\'")}')">
                            👁️ Visualizar
                        </button>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(arquivoDiv);
        });
    }
    
    fecharModalVisualizacao() {
        document.getElementById('viewModal').classList.remove('show');
        this.currentViewDocument = null;
        this.fecharVisualizador();
    }
    
    abrirEdicaoDoModal() {
        console.log('Botão Editar clicado no modal de visualização');
        console.log('Documento atual:', this.currentViewDocument);
        
        if (!this.currentViewDocument) {
            console.error('Nenhum documento selecionado para edição');
            this.showToast('Nenhum documento selecionado para edição', 'error');
            return;
        }
        
        console.log('Iniciando transição: visualização -> edição');
        console.log('ID do documento:', this.currentViewDocument._id);
        
        // 🐛 BUG FIX: Salvar ID antes de fechar o modal para evitar perder a referência
        const documentoId = this.currentViewDocument._id;
        
        // Fechar modal de visualização
        this.fecharModalVisualizacao();
        
        // Abrir modal de edição
        this.editarDocumento(documentoId);
    }
    
    async clonarDocumentoDoModal() {
        if (!this.currentViewDocument) {
            this.showToast('Nenhum documento selecionado para clonagem', 'error');
            return;
        }
        
        if (!confirm('✅ Deseja clonar este documento? Será criada uma cópia que você poderá editar livremente.')) {
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/api/documentos/${this.currentViewDocument._id}/clonar`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('📋 Documento clonado com sucesso! Redirecionando para edição...', 'success');
                
                // Fechar modal de visualização
                this.fecharModalVisualizacao();
                
                // Aguardar um momento e abrir edição do documento clonado
                setTimeout(() => {
                    this.editarDocumento(data.data.documentoClonado);
                }, 1500);
                
                // Atualizar lista se estivermos na aba de documentos
                if (document.querySelector('.nav-tab.active').dataset.tab === 'documentos') {
                    setTimeout(() => this.loadDocumentos(), 2000);
                }
            } else {
                this.showToast('Erro ao clonar documento: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao clonar documento:', error);
            this.showToast('Erro ao clonar documento', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // 👨‍⚕️ ==================
    // GESTÃO DE PROFISSIONAIS
    // ==================
    
    async loadProfissionais(page = 1, filtros = {}) {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: page,
                limit: 20,
                ...filtros
            });
            
            const response = await this.apiCall(`/api/profissionais?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.profissionais = data.data;
                this.renderProfissionais(data.data);
                this.renderPaginacaoProfissionais(data.page, data.pages, data.total);
                this.loadEspecialidadesProfissionais();
            }
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
            this.showToast('Erro ao carregar profissionais', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    renderProfissionais(profissionais) {
        const container = document.getElementById('listaProfissionais');
        
        if (!profissionais || profissionais.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👨‍⚕️</div>
                    <p>Nenhum profissional encontrado</p>
                    <button class="btn btn-primary" onclick="app.abrirModalProfissional()">
                        ➕ Cadastrar Primeiro Profissional
                    </button>
                </div>
            `;
            return;
        }
        
        // Renderizar tabela de profissionais
        const tabelaHtml = `
            <div class="table-container">
                <table class="profissionais-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Nome</th>
                            <th>Registro</th>
                            <th>Especialidade</th>
                            <th>Contato</th>
                            <th>Instituições</th>
                            <th class="actions-column">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profissionais.map(prof => this.renderProfissionalRow(prof)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tabelaHtml;
    }
    
    renderProfissionalRow(prof) {
        const statusClass = prof.ativo ? 'status-ativo' : 'status-inativo';
        const statusIcon = prof.ativo ? '🟢' : '🔴';
        const statusText = prof.ativo ? 'Ativo' : 'Inativo';
        
        // Contato formatado
        const contato = [];
        if (prof.telefone) contato.push(`📞 ${prof.telefone}`);
        if (prof.email) contato.push(`📧 ${prof.email}`);
        const contatoText = contato.length > 0 ? contato.join('<br>') : '<span class="text-muted">-</span>';
        
        // Instituições formatadas
        const instituicoes = prof.instituicoesPrincipais && prof.instituicoesPrincipais.length > 0 
            ? prof.instituicoesPrincipais.join(', ')
            : '<span class="text-muted">-</span>';
        
        return `
            <tr class="profissional-row ${prof.ativo ? '' : 'row-inactive'}">
                <td class="status-cell">
                    <span class="status-indicator ${statusClass}" title="${statusText}">
                        ${statusIcon}
                    </span>
                </td>
                <td class="nome-cell">
                    <div class="nome-principal">${prof.nome}</div>
                    ${prof.observacoes ? `<div class="observacoes-mini" title="${prof.observacoes}">💬 Tem observações</div>` : ''}
                </td>
                <td class="registro-cell">
                    <code>${prof.numeroRegistro}</code>
                </td>
                <td class="especialidade-cell">
                    <span class="especialidade-badge">🎖️ ${prof.especialidade}</span>
                </td>
                <td class="contato-cell">
                    ${contatoText}
                </td>
                <td class="instituicoes-cell">
                    ${instituicoes}
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" 
                                onclick="app.editarProfissional('${prof._id}')" 
                                title="Editar profissional">
                            ✏️
                        </button>
                        <button class="btn-action btn-toggle" 
                                onclick="app.toggleStatusProfissional('${prof._id}', ${!prof.ativo})" 
                                title="${prof.ativo ? 'Inativar' : 'Ativar'} profissional">
                            ${prof.ativo ? '🚫' : '✅'}
                        </button>
                        <button class="btn-action btn-delete" 
                                onclick="app.confirmarExclusaoProfissional('${prof._id}', '${prof.nome.replace(/'/g, '\\\'')}')"
                                title="Excluir profissional">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPaginacaoProfissionais(currentPage, totalPages, total) {
        const container = document.getElementById('paginacaoProfissionais');
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const pages = [];
        
        // Botão Anterior
        pages.push(`
            <button ${currentPage <= 1 ? 'disabled' : ''} onclick="app.goToPageProfissionais(${currentPage - 1})">
                ← Anterior
            </button>
        `);
        
        // Números das páginas
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pages.push(`
                <button class="${i === currentPage ? 'active' : ''}" onclick="app.goToPageProfissionais(${i})">
                    ${i}
                </button>
            `);
        }
        
        // Botão Próximo
        pages.push(`
            <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="app.goToPageProfissionais(${currentPage + 1})">
                Próximo →
            </button>
        `);
        
        container.innerHTML = `
            <div class="pagination-controls">
                ${pages.join('')}
            </div>
            <div class="pagination-info">
                <span class="page-info">Total: ${total} profissional(is)</span>
            </div>
        `;
    }
    
    goToPageProfissionais(page) {
        this.currentPageProfissionais = page;
        this.loadProfissionais(page, this.currentFiltersProfissionais);
    }
    
    async loadEspecialidadesProfissionais() {
        try {
            // Buscar especialidades únicas dos profissionais
            const response = await this.apiCall('/api/profissionais');
            const data = await response.json();
            
            if (data.success) {
                const especialidades = [...new Set(data.data.map(p => p.especialidade))].sort();
                const select = document.getElementById('filtroEspecialidadeProfissional');
                
                // Manter apenas a opção "Todas"
                select.innerHTML = '<option value="">Todas</option>';
                
                // Adicionar especialidades encontradas
                especialidades.forEach(esp => {
                    const option = document.createElement('option');
                    option.value = esp;
                    option.textContent = esp;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar especialidades:', error);
        }
    }
    
    aplicarFiltrosProfissionais() {
        const filtros = {
            busca: document.getElementById('buscaProfissional').value.trim(),
            especialidade: document.getElementById('filtroEspecialidadeProfissional').value,
            ativo: document.getElementById('filtroStatusProfissional').value
        };
        
        // Remover filtros vazios
        Object.keys(filtros).forEach(key => {
            if (filtros[key] === '') {
                delete filtros[key];
            }
        });
        
        this.currentFiltersProfissionais = filtros;
        this.loadProfissionais(1, filtros);
    }
    
    limparFiltrosProfissionais() {
        document.getElementById('buscaProfissional').value = '';
        document.getElementById('filtroEspecialidadeProfissional').value = '';
        document.getElementById('filtroStatusProfissional').value = 'true';
        
        this.currentFiltersProfissionais = {};
        this.loadProfissionais();
    }
    
    abrirModalProfissional(profissional = null) {
        const modal = document.getElementById('profissionalModal');
        const title = document.getElementById('profissionalModalTitle');
        const form = document.getElementById('profissionalForm');
        
        if (profissional) {
            // Modo edição
            title.textContent = '✏️ Editar Profissional';
            this.preencherFormProfissional(profissional);
        } else {
            // Modo cadastro
            title.textContent = '➕ Cadastrar Profissional';
            form.reset();
            document.getElementById('profissionalId').value = '';
            document.getElementById('profissionalAtivo').checked = true;
        }
        
        modal.classList.add('show');
    }
    
    fecharModalProfissional() {
        document.getElementById('profissionalModal').classList.remove('show');
    }
    
    preencherFormProfissional(profissional) {
        document.getElementById('profissionalId').value = profissional._id;
        document.getElementById('profissionalNomeCadastro').value = profissional.nome || '';
        document.getElementById('profissionalRegistroCadastro').value = profissional.numeroRegistro || '';
        document.getElementById('profissionalEspecialidadeCadastro').value = profissional.especialidade || '';
        document.getElementById('profissionalTelefone').value = profissional.telefone || '';
        document.getElementById('profissionalEmail').value = profissional.email || '';
        document.getElementById('profissionalInstituicoes').value = 
            profissional.instituicoesPrincipais ? profissional.instituicoesPrincipais.join(', ') : '';
        document.getElementById('profissionalObservacoes').value = profissional.observacoes || '';
        document.getElementById('profissionalAtivo').checked = profissional.ativo !== false;
    }
    
    async salvarProfissional(form) {
        try {
            this.showLoading();
            
            const formData = new FormData(form);
            const id = formData.get('id');
            
            // Ajustar checkbox ativo
            const ativoCheckbox = document.getElementById('profissionalAtivo');
            formData.set('ativo', ativoCheckbox.checked);
            
            // Limpar campos vazios para evitar erro de validação
            const camposOpcionais = ['telefone', 'email', 'observacoes', 'instituicoesPrincipais'];
            camposOpcionais.forEach(campo => {
                const valor = formData.get(campo);
                if (!valor || valor.trim() === '') {
                    formData.delete(campo);
                }
            });
            
            const url = id ? `/api/profissionais/${id}` : '/api/profissionais';
            const method = id ? 'PUT' : 'POST';
            
            const response = await this.apiCall(url, {
                method: method,
                body: formData,
                headers: {} // FormData, não incluir Content-Type
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(id ? 'Profissional atualizado com sucesso!' : 'Profissional cadastrado com sucesso!', 'success');
                this.fecharModalProfissional();
                this.loadProfissionais();
                
                // Atualizar dashboard se estiver visível
                if (document.querySelector('.nav-tab[data-tab="dashboard"]').classList.contains('active')) {
                    this.loadDashboard();
                }
            } else {
                this.showToast(data.message || 'Erro ao salvar profissional', 'error');
                
                // Exibir erros de validação detalhados se houver
                if (data.errors && data.errors.length > 0) {
                    data.errors.forEach(error => {
                        console.error('Erro de validação:', error);
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao salvar profissional:', error);
            this.showToast('Erro ao salvar profissional: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async editarProfissional(id) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/api/profissionais/${id}`);
            const data = await response.json();
            
            if (data.success) {
                this.abrirModalProfissional(data.data);
            } else {
                this.showToast('Erro ao carregar profissional', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar profissional:', error);
            this.showToast('Erro ao carregar profissional', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async toggleStatusProfissional(id, novoStatus) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/api/profissionais/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ ativo: novoStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.loadProfissionais();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            this.showToast('Erro ao alterar status do profissional', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    confirmarExclusaoProfissional(id, nome) {
        const nomeFormatado = nome.replace(/\\(.)/g, '$1');
        
        document.getElementById('confirmMessage').textContent = 
            `Tem certeza que deseja excluir o profissional "${nomeFormatado}"? Esta ação não pode ser desfeita e pode falhar se houver documentos vinculados.`;
        
        document.getElementById('confirmYes').onclick = () => {
            this.excluirProfissional(id);
            document.getElementById('confirmModal').classList.remove('show');
        };
        
        document.getElementById('confirmModal').classList.add('show');
    }
    
    async excluirProfissional(id) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/api/profissionais/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Profissional excluído com sucesso!', 'success');
                this.loadProfissionais();
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir profissional:', error);
            this.showToast('Erro ao excluir profissional', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // 👨‍⚕️ ==================
    // SELETOR DE PROFISSIONAIS
    // ==================
    
    toggleProfissionalSelector(tipo) {
        const tabExistente = document.getElementById('tabProfissionalExistente');
        const tabNovo = document.getElementById('tabProfissionalNovo');
        const selectorExistente = document.getElementById('selectorExistente');
        const selectorManual = document.getElementById('selectorManual');
        
        if (tipo === 'existente') {
            tabExistente.classList.add('active');
            tabNovo.classList.remove('active');
            selectorExistente.classList.add('active');
            selectorManual.classList.remove('active');
            
            // Limpar seleção manual
            this.limparCamposManuais();
            
            // Focar no campo de busca
            setTimeout(() => {
                document.getElementById('buscaProfissionalCadastro').focus();
            }, 100);
        } else {
            tabExistente.classList.remove('active');
            tabNovo.classList.add('active');
            selectorExistente.classList.remove('active');
            selectorManual.classList.add('active');
            
            // Limpar seleção existente
            this.limparProfissionalSelecionado();
            
            // Focar no primeiro campo manual
            setTimeout(() => {
                document.getElementById('profissionalNome').focus();
            }, 100);
        }
    }
    
    async buscaProfissionaisAutocomplete(termo) {
        if (!termo || termo.length < 2) {
            this.fecharDropdownProfissionais();
            return;
        }
        
        try {
            const response = await this.apiCall(`/api/profissionais/busca/autocomplete?q=${encodeURIComponent(termo)}&limit=8`);
            const data = await response.json();
            
            if (data.success) {
                this.renderDropdownProfissionais(data.data, termo);
            } else {
                this.fecharDropdownProfissionais();
            }
        } catch (error) {
            console.error('Erro na busca de profissionais:', error);
            this.fecharDropdownProfissionais();
        }
    }
    
    renderDropdownProfissionais(profissionais, termo) {
        const dropdown = document.getElementById('listaProfissionaisDropdown');
        
        if (!profissionais || profissionais.length === 0) {
            dropdown.innerHTML = `
                <div class="dropdown-empty">
                    Nenhum profissional encontrado para "${termo}"
                </div>
            `;
            dropdown.style.display = 'block';
            return;
        }
        
        const html = profissionais.map(prof => `
            <div class="profissional-option" onclick="app.selecionarProfissional('${prof._id}')">
                <div class="profissional-option-nome">${prof.nome}</div>
                <div class="profissional-option-detalhes">
                    <span class="profissional-option-registro">${prof.numeroRegistro}</span>
                    <span>🎖️ ${prof.especialidade}</span>
                </div>
            </div>
        `).join('');
        
        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }
    
    async selecionarProfissional(id) {
        try {
            const response = await this.apiCall(`/api/profissionais/${id}`);
            const data = await response.json();
            
            if (data.success) {
                const prof = data.data;
                
                // Preencher informações visuais
                const nomeDiv = document.querySelector('#profissionalSelecionado .profissional-nome');
                const detalhesDiv = document.querySelector('#profissionalSelecionado .profissional-detalhes');
                
                nomeDiv.textContent = prof.nome;
                detalhesDiv.innerHTML = `
                    <span class="registro">${prof.numeroRegistro}</span>
                    <span class="especialidade">🎖️ ${prof.especialidade}</span>
                `;
                
                // Preencher campos hidden para envio
                document.getElementById('profissionalSolicitanteNome').value = prof.nome;
                document.getElementById('profissionalSolicitanteRegistro').value = prof.numeroRegistro;
                document.getElementById('profissionalSolicitanteEspecialidade').value = prof.especialidade || '';
                
                // Auto-preencher especialidade médica se vazia
                const especialidadeInput = document.getElementById('especialidadeMedica');
                if (!especialidadeInput.value && prof.especialidade) {
                    especialidadeInput.value = prof.especialidade;
                }
                
                // Auto-preencher instituição se houver e estiver vazia
                const instituicaoInput = document.getElementById('instituicaoNome');
                if (!instituicaoInput.value && prof.instituicoesPrincipais && prof.instituicoesPrincipais.length > 0) {
                    // Usar a primeira instituição principal
                    instituicaoInput.value = prof.instituicoesPrincipais[0];
                }
                
                // Mostrar profissional selecionado e esconder busca
                document.getElementById('profissionalSelecionado').style.display = 'flex';
                document.querySelector('.search-profissional').style.display = 'none';
                
                this.fecharDropdownProfissionais();
                
                this.showToast(`Profissional selecionado: ${prof.nome}`, 'success');
            }
        } catch (error) {
            console.error('Erro ao selecionar profissional:', error);
            this.showToast('Erro ao selecionar profissional', 'error');
        }
    }
    
    limparProfissionalSelecionado() {
        // Limpar campos hidden
        document.getElementById('profissionalSolicitanteNome').value = '';
        document.getElementById('profissionalSolicitanteRegistro').value = '';
        document.getElementById('profissionalSolicitanteEspecialidade').value = '';
        
        // Limpar campo de busca
        document.getElementById('buscaProfissionalCadastro').value = '';
        
        // Esconder profissional selecionado e mostrar busca
        document.getElementById('profissionalSelecionado').style.display = 'none';
        document.querySelector('.search-profissional').style.display = 'block';
        
        this.fecharDropdownProfissionais();
    }
    
    limparCamposManuais() {
        document.getElementById('profissionalNome').value = '';
        document.getElementById('profissionalRegistro').value = '';
        document.getElementById('profissionalEspecialidade').value = '';
    }
    
    fecharDropdownProfissionais() {
        document.getElementById('listaProfissionaisDropdown').style.display = 'none';
    }
    
    async verificarProfissionaisDisponiveis() {
        try {
            const response = await this.apiCall('/api/profissionais?limit=1&ativo=true');
            const data = await response.json();
            
            const tabExistente = document.getElementById('tabProfissionalExistente');
            const buscaInput = document.getElementById('buscaProfissionalCadastro');
            
            if (data.success && data.total > 0) {
                tabExistente.innerHTML = `📊 Selecionar Cadastrado (${data.total})`;
                if (buscaInput) {
                    buscaInput.placeholder = `Buscar entre ${data.total} profissional(is) cadastrado(s)...`;
                }
            } else {
                tabExistente.innerHTML = `📊 Nenhum Profissional Cadastrado`;
                tabExistente.style.opacity = '0.6';
                tabExistente.style.cursor = 'not-allowed';
                
                if (buscaInput) {
                    buscaInput.placeholder = 'Nenhum profissional cadastrado ainda';
                    buscaInput.disabled = true;
                }
                
                // Forçar modo manual
                this.toggleProfissionalSelector('novo');
            }
        } catch (error) {
            console.error('Erro ao verificar profissionais:', error);
        }
    }
    
    // Event listeners para o seletor
    setupProfissionalSelector() {
        // Verificar quantos profissionais ativos existem
        this.verificarProfissionaisDisponiveis();
        
        const buscaInput = document.getElementById('buscaProfissionalCadastro');
        let debounceTimeout;
        
        if (buscaInput) {
            // Busca com debounce
            buscaInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    this.buscaProfissionaisAutocomplete(e.target.value);
                }, 300);
            });
            
            // Fechar dropdown ao perder foco
            buscaInput.addEventListener('blur', (e) => {
                // Delay para permitir clique nas opções
                setTimeout(() => {
                    this.fecharDropdownProfissionais();
                }, 150);
            });
            
            // Focar ao clicar
            buscaInput.addEventListener('focus', (e) => {
                if (e.target.value.length >= 2) {
                    this.buscaProfissionaisAutocomplete(e.target.value);
                }
            });
        }
        
        // Validar formulário ao submeter
        const form = document.getElementById('cadastroForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                const tabAtiva = document.getElementById('tabProfissionalExistente').classList.contains('active');
                
                if (tabAtiva) {
                    // Modo seletor: verificar se há profissional selecionado
                    const nomeHidden = document.getElementById('profissionalSolicitanteNome').value;
                    const registroHidden = document.getElementById('profissionalSolicitanteRegistro').value;
                    
                    if (!nomeHidden || !registroHidden) {
                        e.preventDefault();
                        this.showToast('Por favor, selecione um profissional da lista ou digite manualmente', 'error');
                        return false;
                    }
                } else {
                    // Modo manual: copiar valores dos campos visíveis para os hidden
                    const nome = document.getElementById('profissionalNome').value;
                    const registro = document.getElementById('profissionalRegistro').value;
                    const especialidade = document.getElementById('profissionalEspecialidade').value;
                    
                    if (!nome || !registro) {
                        e.preventDefault();
                        this.showToast('Nome e registro do profissional são obrigatórios', 'error');
                        return false;
                    }
                    
                    // Copiar para campos hidden
                    document.getElementById('profissionalSolicitanteNome').value = nome;
                    document.getElementById('profissionalSolicitanteRegistro').value = registro;
                    document.getElementById('profissionalSolicitanteEspecialidade').value = especialidade;
                }
            });
        }
    }
    
    // ==================
    // MINHA CONTA
    // ==================

    async abrirModalConta() {
        try {
            const response = await this.apiCall('/api/auth/perfil');
            const data = await response.json();
            if (data.success) {
                document.getElementById('contaNome').value = data.data.nome || '';
                document.getElementById('contaEmail').value = data.data.email || '';
            }
        } catch (e) { /* campos ficam em branco */ }
        document.getElementById('senhaForm').reset();
        this.hideMsg('perfilMsg');
        this.hideMsg('senhaMsg');
        document.getElementById('contaModal').classList.add('show');
    }

    fecharModalConta() {
        document.getElementById('contaModal').classList.remove('show');
    }

    async atualizarPerfil(form) {
        const nome = form.nome.value.trim();
        const email = form.email.value.trim();
        try {
            const response = await this.apiCall('/api/auth/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email }),
            });
            const data = await response.json();
            if (data.success) {
                this.showToast('Dados atualizados com sucesso!', 'success');
                this.hideMsg('perfilMsg');
            } else {
                this.showMsg('perfilMsg', data.message, 'error');
            }
        } catch (e) {
            this.showMsg('perfilMsg', 'Erro ao atualizar dados', 'error');
        }
    }

    async alterarSenha(form) {
        const senhaAtual = form.senhaAtual.value;
        const novaSenha = form.novaSenha.value;
        const confirmar = form.confirmarSenha.value;
        if (novaSenha !== confirmar) {
            this.showMsg('senhaMsg', 'Nova senha e confirmação não coincidem', 'error');
            return;
        }
        try {
            const response = await this.apiCall('/api/auth/alterar-senha', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senhaAtual, novaSenha }),
            });
            const data = await response.json();
            if (data.success) {
                this.showToast('Senha alterada com sucesso!', 'success');
                form.reset();
                this.hideMsg('senhaMsg');
            } else {
                this.showMsg('senhaMsg', data.message, 'error');
            }
        } catch (e) {
            this.showMsg('senhaMsg', 'Erro ao alterar senha', 'error');
        }
    }

    showMsg(elementId, message, type = 'error') {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.className = type === 'error' ? 'error-message' : 'success-message';
        el.style.display = 'block';
    }

    hideMsg(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.innerHTML = message.replace(/\n/g, '<br>');
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DocumentacaoMedica();
    window.app = app; // Exposição global da instância única
});
