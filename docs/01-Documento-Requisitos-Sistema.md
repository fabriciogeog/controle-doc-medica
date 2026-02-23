# 📋 DOCUMENTO DE REQUISITOS DO SISTEMA (DRS)
**Sistema de Controle de Documentação Médica**

---

## 📖 **1. INTRODUÇÃO**

### 1.1 Finalidade do Documento
Este documento especifica os requisitos funcionais e não-funcionais do Sistema de Controle de Documentação Médica, destinado ao gerenciamento pessoal de documentos médicos.

### 1.2 Escopo do Sistema
Sistema web para catalogação, armazenamento e consulta de documentos médicos pessoais, incluindo exames, receitas, laudos e atestados.

### 1.3 Público-Alvo
- **Usuário principal**: Pessoa física para uso pessoal
- **Desenvolvedor**: Fabricio (Acadêmico ADS)
- **Stakeholders**: Profissionais de saúde (indiretamente)

### 1.4 Metodologia Utilizada
- **Desenvolvimento**: Incremental/Iterativo
- **Práticas Ágeis**: User Stories, MVP, Feedback contínuo
- **Arquitetura**: MVC com API REST

---

## 🎯 **2. LEVANTAMENTO DE REQUISITOS**

### 2.1 Técnicas Utilizadas
- [x] **Auto-observação**: Análise de necessidades pessoais
- [x] **Benchmarking**: Análise de sistemas similares
- [x] **Prototipagem**: Desenvolvimento evolutivo
- [x] **Feedback iterativo**: Refinamento contínuo

### 2.2 Stakeholders Identificados
| Stakeholder | Interesse | Influência | Expectativa |
|-------------|-----------|------------|-------------|
| Usuário Final | Alto | Alto | Sistema funcional e seguro |
| Profissionais de Saúde | Médio | Baixo | Informações organizadas |
| Desenvolvedor | Alto | Alto | Aprendizado e portfolio |

---

## 📋 **3. REQUISITOS FUNCIONAIS (RF)**

### RF001 - Gerenciamento de Documentos
**Descrição**: O sistema deve permitir o cadastro, edição, visualização e exclusão de documentos médicos.

**Prioridade**: ⭐⭐⭐ ALTA

**Critérios de Aceitação**:
- [x] Cadastrar documento com campos obrigatórios
- [x] Editar documento existente
- [x] Visualizar documento em modal
- [x] Excluir documento com confirmação
- [x] Clonar documento existente

**User Story**:
```
Como usuário do sistema,
Eu quero cadastrar meus documentos médicos
Para que eu possa organizá-los digitalmente
```

### RF002 - Gerenciamento de Profissionais
**Descrição**: O sistema deve permitir o cadastro e gerenciamento de profissionais de saúde.

**Prioridade**: ⭐⭐⭐ ALTA

**Critérios de Aceitação**:
- [x] Cadastrar profissional com dados completos
- [x] Listar profissionais em tabela organizada
- [x] Editar dados do profissional
- [x] Ativar/Inativar profissional
- [x] Excluir profissional (com validação de vínculos)

**User Story**:
```
Como usuário do sistema,
Eu quero cadastrar os profissionais de saúde
Para que eu possa associá-los aos meus documentos
```

### RF003 - Integração Profissional-Documento
**Descrição**: O sistema deve permitir vincular documentos a profissionais cadastrados.

**Prioridade**: ⭐⭐⭐ ALTA

**Critérios de Aceitação**:
- [x] Seletor inteligente de profissionais
- [x] Auto-preenchimento de dados
- [x] Busca por nome, registro ou especialidade
- [x] Modo manual como alternativa

### RF004 - Sistema de Busca e Filtros
**Descrição**: O sistema deve oferecer mecanismos de busca e filtragem de documentos.

**Prioridade**: ⭐⭐ MÉDIA

**Critérios de Aceitação**:
- [x] Busca textual por descrição, profissional, instituição
- [x] Filtros por tipo, especialidade, data
- [x] Paginação de resultados
- [x] Pesquisa avançada

### RF005 - Dashboard Analítico
**Descrição**: O sistema deve apresentar dashboard com estatísticas e documentos recentes.

**Prioridade**: ⭐⭐ MÉDIA

**Critérios de Aceitação**:
- [x] Estatísticas gerais (total documentos, tipos, especialidades)
- [x] Gráfico de distribuição por tipo
- [x] Lista dos 10 documentos mais recentes
- [x] Cards informativos com métricas

### RF006 - Gestão de Arquivos
**Descrição**: O sistema deve permitir associar arquivos externos aos documentos.

**Prioridade**: ⭐⭐ MÉDIA

**Critérios de Aceitação**:
- [x] Associar caminhos de arquivos PDF/imagem
- [x] Visualizar informações do arquivo
- [x] Abrir arquivos no sistema operacional
- [x] Múltiplos arquivos por documento

---

## 🔧 **4. REQUISITOS NÃO-FUNCIONAIS (RNF)**

### RNF001 - Desempenho
- **Tempo de resposta**: < 3 segundos para operações CRUD
- **Capacidade**: Suporte a 10.000+ documentos
- **Throughput**: 50 requisições simultâneas

### RNF002 - Segurança
- **Autenticação**: Sistema de login com sessão
- **Autorização**: Acesso controlado às funcionalidades
- **Criptografia**: HTTPS obrigatório
- **Logs**: Auditoria de operações críticas

### RNF003 - Usabilidade
- **Interface**: Responsiva (mobile-first)
- **Experiência**: Intuitiva e acessível
- **Feedback**: Mensagens claras ao usuário
- **Performance**: Loading states visuais

### RNF004 - Confiabilidade
- **Disponibilidade**: 99% uptime
- **Recuperação**: Backup automático
- **Tolerância a falhas**: Validações robustas
- **Consistência**: Integridade de dados

### RNF005 - Manutenibilidade
- **Arquitetura**: Código modular e documentado
- **Padrões**: Convenções de nomenclatura
- **Versionamento**: Controle Git
- **Testes**: Cobertura de funcionalidades críticas

### RNF006 - Portabilidade
- **Plataforma**: Docker containerizado
- **Navegadores**: Compatibilidade cross-browser
- **Banco de dados**: MongoDB (NoSQL)
- **Deploy**: Ambiente Linux/Windows

---

## 📊 **5. REGRAS DE NEGÓCIO (RN)**

### RN001 - Dados Obrigatórios do Documento
- Tipo do documento
- Especialidade médica
- Data do documento
- Nome do profissional
- Registro profissional
- Descrição
- Nome da instituição

### RN002 - Dados Obrigatórios do Profissional
- Nome completo
- Número de registro
- Especialidade principal

### RN003 - Validações de Integridade
- Número de registro do profissional deve ser único
- Profissionais com documentos vinculados não podem ser excluídos
- Datas não podem ser futuras (exceto em casos específicos)

### RN004 - Segurança e Privacidade
- Apenas o usuário autenticado pode acessar os dados
- Logs de auditoria para operações críticas
- Dados sensíveis devem ser protegidos

---

## 🎯 **6. CRITÉRIOS DE ACEITAÇÃO DO SISTEMA**

### ✅ **Funcionalidades Implementadas**
- [x] Sistema de autenticação
- [x] CRUD completo de documentos
- [x] CRUD completo de profissionais
- [x] Sistema de busca e filtros
- [x] Dashboard com estatísticas
- [x] Interface responsiva
- [x] Integração profissional-documento

### ✅ **Qualidade de Software**
- [x] Interface intuitiva e moderna
- [x] Validações de entrada robustas
- [x] Tratamento de erros adequado
- [x] Performance aceitável
- [x] Responsividade mobile

### ✅ **Aspectos Técnicos**
- [x] Arquitetura REST API
- [x] Banco de dados NoSQL
- [x] Containerização Docker
- [x] Proxy reverso NGINX
- [x] Logs estruturados

---

## 📈 **7. MÉTRICAS DE SUCESSO**

### 7.1 Métricas Funcionais
- **Taxa de conclusão de tarefas**: > 95%
- **Tempo médio de cadastro**: < 2 minutos
- **Precisão de busca**: > 90%
- **Disponibilidade do sistema**: > 99%

### 7.2 Métricas de Qualidade
- **Bugs críticos**: 0
- **Tempo de carregamento**: < 3s
- **Compatibilidade de navegadores**: 100%
- **Responsividade mobile**: 100%

---

## 🚀 **8. ROADMAP E MELHORIAS FUTURAS**

### Versão 1.1 (Próximas melhorias)
- [ ] Sistema de backup automático
- [ ] Relatórios em PDF
- [ ] Notificações de vencimento
- [ ] API pública documentada

### Versão 2.0 (Expansões)
- [ ] Multi-usuário com permissões
- [ ] Integração com sistemas de saúde
- [ ] App mobile nativo
- [ ] OCR para digitalização de documentos

---

**Documento elaborado por**: Fabricio  
**Data**: 14/01/2025  
**Versão**: 1.0  
**Status**: Aprovado ✅
