# 📝 ESPECIFICAÇÃO DE CASOS DE USO
**Sistema de Controle de Documentação Médica**

---

## 📋 **1. INTRODUÇÃO**

### 1.1 Propósito
Este documento detalha todos os casos de uso do Sistema de Controle de Documentação Médica, descrevendo as interações entre usuários e sistema.

### 1.2 Atores do Sistema
- **👤 Usuário**: Pessoa física que utiliza o sistema para gerenciar seus documentos médicos

### 1.3 Diagrama Geral de Casos de Uso

```
                    Sistema de Documentação Médica
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │  UC01: Fazer Login                                         │
    │  UC02: Visualizar Dashboard                                │
    │  UC03: Cadastrar Documento                                 │
    │  UC04: Listar Documentos                                   │
    │  UC05: Editar Documento                                    │
    │  UC06: Excluir Documento                                   │
    │  UC07: Visualizar Documento                                │
    │  UC08: Clonar Documento                                    │
    │  UC09: Cadastrar Profissional                             │
    │  UC10: Listar Profissionais                               │
    │  UC11: Editar Profissional                                │
    │  UC12: Excluir Profissional                               │
    │  UC13: Buscar Profissional                                │
    │  UC14: Pesquisar Documentos                               │
    │  UC15: Aplicar Filtros                                    │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
                                    │
                             ┌─────────────┐
                             │   Usuário   │
                             └─────────────┘
```

---

## 🔐 **2. CASOS DE USO - AUTENTICAÇÃO**

### UC01 - Fazer Login
**Objetivo**: Autenticar usuário no sistema

**Ator Principal**: Usuário

**Pré-condições**: 
- Sistema disponível
- Usuário possui senha de acesso

**Fluxo Principal**:
1. Usuário acessa o sistema
2. Sistema exibe tela de login
3. Usuário informa senha
4. Sistema valida credenciais
5. Sistema redireciona para dashboard
6. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Senha Incorreta**:
  - 4a. Sistema identifica senha inválida
  - 4b. Sistema exibe mensagem de erro
  - 4c. Retorna ao passo 3

**Pós-condições**: 
- Usuário autenticado e com sessão ativa
- Acesso liberado às funcionalidades do sistema

**Regras de Negócio**:
- RN01: Senha deve ter no mínimo 4 caracteres
- RN02: Sessão expira após 24 horas de inatividade

---

## 📊 **3. CASOS DE USO - DASHBOARD**

### UC02 - Visualizar Dashboard
**Objetivo**: Apresentar visão geral do sistema com estatísticas e documentos recentes

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa dashboard
2. Sistema carrega estatísticas gerais
3. Sistema exibe total de documentos
4. Sistema mostra gráfico de distribuição por tipo
5. Sistema lista últimos 10 documentos cadastrados
6. Sistema apresenta total de profissionais ativos
7. **Caso de uso encerrado com sucesso**

**Cenários de Teste**:
- ✅ Sistema com dados: Estatísticas e documentos exibidos
- ✅ Sistema vazio: Mensagens adequadas de estado vazio

---

## 📋 **4. CASOS DE USO - GESTÃO DE DOCUMENTOS**

### UC03 - Cadastrar Documento
**Objetivo**: Registrar novo documento médico no sistema

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa tela de cadastro
2. Sistema exibe formulário de documento
3. Usuário preenche dados obrigatórios na sequência organizacional:
   - Profissional (via seletor ou manual) - *posicionado no topo*
   - Informações do documento (agrupadas visualmente):
     • Tipo do documento
     • Especialidade médica  
     • Data do documento
   - Descrição
   - Instituição
4. Usuário informa dados opcionais:
   - Tags
   - Observações
   - Arquivos associados
5. Usuário confirma cadastro
6. Sistema valida dados
7. Sistema persiste documento
8. Sistema exibe confirmação de sucesso
9. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Dados Inválidos**:
  - 6a. Sistema identifica dados incorretos
  - 6b. Sistema destaca campos com erro
  - 6c. Retorna ao passo 3

- **FA02 - Seleção de Profissional Existente**:
  - 3a. Usuário escolhe profissional cadastrado
  - 3b. Sistema busca profissionais por nome/registro
  - 3c. Sistema preenche dados automaticamente
  - 3d. Continua no passo 4

**Regras de Negócio**:
- RN03: Todos os campos obrigatórios devem ser preenchidos
- RN04: Data não pode ser futura (salvo exceções)
- RN05: Profissional deve ter nome e registro válidos

### UC04 - Listar Documentos
**Objetivo**: Exibir lista paginada de documentos cadastrados

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa lista de documentos
2. Sistema carrega documentos com paginação (10 por página)
3. Sistema exibe cards com informações resumidas:
   - Tipo e data
   - Descrição
   - Profissional
   - Instituição
4. Sistema disponibiliza ações por documento:
   - Visualizar
   - Editar
   - Clonar
   - Excluir
5. **Caso de uso encerrado com sucesso**

**Fluxos de Extensão**:
- **FE01 - Navegação por Páginas**:
  - Sistema oferece controles de paginação
  - Usuário pode navegar entre páginas

### UC05 - Editar Documento
**Objetivo**: Modificar dados de documento existente

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Documento existe no sistema

**Fluxo Principal**:
1. Usuário seleciona documento para edição
2. Sistema carrega dados atuais do documento
3. Sistema exibe formulário preenchido
4. Usuário modifica campos desejados
5. Usuário confirma alterações
6. Sistema valida dados
7. Sistema atualiza documento
8. Sistema exibe confirmação de sucesso
9. **Caso de uso encerrado com sucesso**

### UC06 - Excluir Documento
**Objetivo**: Remover documento do sistema

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Documento existe no sistema

**Fluxo Principal**:
1. Usuário seleciona documento para exclusão
2. Sistema exibe modal de confirmação
3. Usuário confirma exclusão
4. Sistema remove documento da base
5. Sistema atualiza lista de documentos
6. Sistema exibe confirmação de sucesso
7. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Cancelar Exclusão**:
  - 3a. Usuário cancela operação
  - 3b. Sistema fecha modal
  - 3c. Documento permanece inalterado

### UC07 - Visualizar Documento
**Objetivo**: Exibir detalhes completos de documento

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Documento existe no sistema

**Fluxo Principal**:
1. Usuário seleciona documento para visualização
2. Sistema abre modal de detalhes
3. Sistema exibe informações completas:
   - Dados básicos
   - Profissional completo
   - Instituição
   - Arquivos anexos
   - Tags e observações
   - Datas de controle
4. Sistema oferece ações:
   - Editar
   - Clonar
   - Abrir arquivos
5. **Caso de uso encerrado com sucesso**

### UC08 - Clonar Documento
**Objetivo**: Criar novo documento baseado em documento existente

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Documento existe no sistema

**Fluxo Principal**:
1. Usuário seleciona documento para clonagem
2. Sistema duplica dados do documento
3. Sistema adiciona prefixo "[CÓPIA]" na descrição
4. Sistema atualiza timestamps
5. Sistema abre documento clonado para edição
6. Usuário modifica dados conforme necessário
7. Usuário salva documento clonado
8. **Caso de uso encerrado com sucesso**

---

## 👨‍⚕️ **5. CASOS DE USO - GESTÃO DE PROFISSIONAIS**

### UC09 - Cadastrar Profissional
**Objetivo**: Registrar novo profissional de saúde

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa cadastro de profissionais
2. Sistema exibe formulário de profissional
3. Usuário preenche dados obrigatórios:
   - Nome completo
   - Número de registro
   - Especialidade
4. Usuário preenche dados opcionais:
   - Telefone
   - Email
   - Instituições principais
   - Observações
5. Usuário confirma cadastro
6. Sistema valida dados e unicidade de registro
7. Sistema persiste profissional
8. Sistema exibe confirmação de sucesso
9. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Registro Duplicado**:
  - 6a. Sistema identifica registro já existente
  - 6b. Sistema exibe mensagem de erro específica
  - 6c. Retorna ao passo 3

### UC10 - Listar Profissionais
**Objetivo**: Exibir tabela de profissionais cadastrados

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa lista de profissionais
2. Sistema carrega profissionais ativos
3. Sistema exibe tabela organizada com:
   - Status (ativo/inativo)
   - Nome e registro
   - Especialidade
   - Contato (telefone/email)
   - Instituições
   - Ações disponíveis
4. Sistema oferece filtros e busca
5. **Caso de uso encerrado com sucesso**

### UC11 - Editar Profissional
**Objetivo**: Modificar dados de profissional existente

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Profissional existe no sistema

**Fluxo Principal**:
1. Usuário seleciona profissional para edição
2. Sistema carrega dados atuais
3. Sistema exibe formulário preenchido
4. Usuário modifica campos desejados
5. Usuário confirma alterações
6. Sistema valida dados e unicidade
7. Sistema atualiza profissional
8. Sistema exibe confirmação de sucesso
9. **Caso de uso encerrado com sucesso**

### UC12 - Excluir Profissional
**Objetivo**: Remover profissional do sistema

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Profissional existe no sistema

**Fluxo Principal**:
1. Usuário seleciona profissional para exclusão
2. Sistema verifica vínculos com documentos
3. Sistema exibe modal de confirmação
4. Usuário confirma exclusão
5. Sistema remove profissional
6. Sistema atualiza lista
7. Sistema exibe confirmação de sucesso
8. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Profissional Vinculado a Documentos**:
  - 2a. Sistema detecta documentos vinculados
  - 2b. Sistema exibe mensagem de impossibilidade
  - 2c. Sistema sugere inativação
  - 2d. Caso de uso encerrado sem alterações

### UC13 - Buscar Profissional (Autocomplete)
**Objetivo**: Localizar profissional para seleção rápida

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado
- Context: Cadastro de documento

**Fluxo Principal**:
1. Usuário digita no campo de busca de profissional
2. Sistema busca em tempo real por:
   - Nome (parcial)
   - Número de registro
   - Especialidade
3. Sistema exibe dropdown com resultados
4. Usuário seleciona profissional desejado
5. Sistema preenche campos automaticamente
6. Sistema auto-completa especialidade médica
7. Sistema sugere instituição se disponível
8. **Caso de uso encerrado com sucesso**

**Fluxos Alternativos**:
- **FA01 - Nenhum Resultado**:
  - 3a. Sistema não encontra profissionais
  - 3b. Sistema exibe mensagem informativa
  - 3c. Sistema mantém campo editável

---

## 🔍 **6. CASOS DE USO - BUSCA E FILTROS**

### UC14 - Pesquisar Documentos
**Objetivo**: Localizar documentos através de busca textual

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa tela de pesquisa
2. Usuário informa termo de busca
3. Sistema busca em campos:
   - Descrição
   - Nome do profissional
   - Nome da instituição
   - Tags
   - Observações
4. Sistema exibe resultados ordenados por relevância
5. Sistema destaca termos encontrados
6. **Caso de uso encerrado com sucesso**

### UC15 - Aplicar Filtros
**Objetivo**: Refinar lista de documentos através de filtros

**Ator Principal**: Usuário

**Pré-condições**: 
- Usuário autenticado

**Fluxo Principal**:
1. Usuário acessa opções de filtro
2. Usuário seleciona critérios:
   - Tipo de documento
   - Especialidade médica
   - Período (data inicial/final)
   - Profissional específico
   - Instituição específica
3. Sistema aplica filtros selecionados
4. Sistema atualiza lista de documentos
5. Sistema mantém filtros visíveis
6. **Caso de uso encerrado com sucesso**

**Fluxos de Extensão**:
- **FE01 - Limpar Filtros**:
  - Usuário solicita limpeza de filtros
  - Sistema remove todos os critérios
  - Sistema recarrega lista completa

---

## 📊 **7. MATRIZ DE RASTREABILIDADE**

### 7.1 Casos de Uso vs Requisitos Funcionais

| Caso de Uso | Requisitos Atendidos | Prioridade | Status |
|-------------|---------------------|------------|--------|
| UC01 - Login | RF-Sistema de Autenticação | Alta | ✅ |
| UC02 - Dashboard | RF005 - Dashboard Analítico | Média | ✅ |
| UC03 - Cadastrar Doc | RF001 - Gestão de Documentos | Alta | ✅ |
| UC04 - Listar Docs | RF001 - Gestão de Documentos | Alta | ✅ |
| UC05 - Editar Doc | RF001 - Gestão de Documentos | Alta | ✅ |
| UC06 - Excluir Doc | RF001 - Gestão de Documentos | Alta | ✅ |
| UC07 - Visualizar Doc | RF001 - Gestão de Documentos | Alta | ✅ |
| UC08 - Clonar Doc | RF001 - Gestão de Documentos | Média | ✅ |
| UC09 - Cadastrar Prof | RF002 - Gestão de Profissionais | Alta | ✅ |
| UC10 - Listar Profs | RF002 - Gestão de Profissionais | Alta | ✅ |
| UC11 - Editar Prof | RF002 - Gestão de Profissionais | Alta | ✅ |
| UC12 - Excluir Prof | RF002 - Gestão de Profissionais | Alta | ✅ |
| UC13 - Buscar Prof | RF003 - Integração Prof-Doc | Alta | ✅ |
| UC14 - Pesquisar Docs | RF004 - Sistema de Busca | Média | ✅ |
| UC15 - Aplicar Filtros | RF004 - Sistema de Busca | Média | ✅ |

### 7.2 Cobertura de Casos de Teste

| Categoria | Casos Implementados | Cobertura |
|-----------|-------------------|-----------|
| Autenticação | 1/1 | 100% |
| Dashboard | 1/1 | 100% |
| Gestão Documentos | 6/6 | 100% |
| Gestão Profissionais | 4/4 | 100% |
| Busca e Filtros | 2/2 | 100% |
| **TOTAL** | **15/15** | **100%** |

---

## 🎯 **8. CENÁRIOS DE TESTE**

### 8.1 Cenários de Sucesso (Happy Path)
- ✅ Usuário consegue fazer login
- ✅ Usuário visualiza dashboard com dados
- ✅ Usuário cadastra documento com sucesso
- ✅ Usuário cadastra profissional com sucesso
- ✅ Usuário busca documentos e encontra resultados
- ✅ Usuário seleciona profissional existente no cadastro

### 8.2 Cenários de Exceção
- ✅ Login com senha incorreta
- ✅ Cadastro com dados inválidos
- ✅ Tentativa de cadastro de profissional duplicado
- ✅ Tentativa de exclusão de profissional vinculado
- ✅ Busca sem resultados

### 8.3 Cenários de Boundary
- ✅ Sistema vazio (sem documentos/profissionais)
- ✅ Sistema com grande volume de dados
- ✅ Campos com valores límites (máximo de caracteres)
- ✅ Navegação entre páginas no limite

---

---

## 🔄 **9. HISTÓRICO DE ATUALIZAÇÕES**

### Versão 1.1 - 14/01/2025
**Alterações na Interface de Cadastro:**
- 🎨 **Layout reorganizado** no UC03 - Cadastrar Documento
- 🔝 **Profissional Solicitante** movido para posição superior no formulário
- 📋 **Agrupamento visual** dos campos: Tipo, Especialidade Médica e Data
- ✨ **Melhorias estéticas** sem alteração nas funcionalidades
- ✅ **Casos de uso mantidos** - apenas reorganização visual da interface

---

**Documento elaborado por**: Fabricio  
**Data**: 14/01/2025  
**Versão**: 1.1  
**Status**: Atualizado ✓
