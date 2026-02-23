// Debug version of app.js - Simple test
console.log('🔍 DEBUG: app-debug.js carregado');

// Função simples para testar se JavaScript funciona
function testBasic() {
    console.log('✅ DEBUG: Função básica funcionando');
    alert('JavaScript funcionando!');
}

// Testar variável global
window.debugApp = {
    test: testBasic,
    editarDocumento: function(id) {
        console.log(`🔍 DEBUG: editarDocumento chamado com ID: ${id}`);
        alert(`Tentativa de editar documento: ${id}`);
    },
    confirmarExclusao: function(id, titulo) {
        console.log(`🔍 DEBUG: confirmarExclusao chamado - ID: ${id}, Titulo: ${titulo}`);
        const confirmar = confirm(`Confirma exclusão de: ${titulo}?`);
        if (confirmar) {
            alert(`Documento ${id} seria excluído`);
        }
    },
    salvarDocumento: function(form) {
        console.log('🔍 DEBUG: salvarDocumento chamado');
        console.log('Form:', form);
        alert('Tentativa de salvar documento');
        return false; // Prevenir envio real
    }
};

// Expor como app também
window.app = window.debugApp;

console.log('✅ DEBUG: window.app e window.debugApp criados');
console.log('✅ DEBUG: Métodos disponíveis:', Object.keys(window.app));

// Aguardar DOM e configurar eventos básicos
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DEBUG: DOM carregado');
    
    // Teste básico de elementos
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ DEBUG: Formulário de login encontrado');
    } else {
        console.log('❌ DEBUG: Formulário de login NÃO encontrado');
    }
    
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        console.log('✅ DEBUG: Formulário de cadastro encontrado');
        
        // Adicionar event listener de debug
        cadastroForm.addEventListener('submit', function(e) {
            console.log('🔍 DEBUG: Submit do formulário interceptado');
            e.preventDefault();
            window.app.salvarDocumento(this);
        });
    } else {
        console.log('❌ DEBUG: Formulário de cadastro NÃO encontrado');
    }
    
    // Testar modais
    const editModal = document.getElementById('editModal');
    const confirmModal = document.getElementById('confirmModal');
    
    console.log('🔍 DEBUG: Modal de edição:', editModal ? 'Encontrado' : 'NÃO encontrado');
    console.log('🔍 DEBUG: Modal de confirmação:', confirmModal ? 'Encontrado' : 'NÃO encontrado');
    
    console.log('✅ DEBUG: Inicialização debug completa');
});
