// Função para formatar como moeda brasileira
function formatarMoeda(input) {
    let valor = input.value.replace(/[^\d,\.]/g, ''); // Remove tudo que não é dígito ou separador
    valor = valor.replace(/\./g, '').replace(',', '.'); // Remove pontos e troca vírgula por ponto
    let numero = parseFloat(valor);
    if (isNaN(numero)) numero = 0;
    let partes = numero.toFixed(4).split('.');
    let inteiro = partes[0];
    let decimal = partes[1] || '0000';
    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    valor = inteiro + ',' + decimal;
    input.value = valor ? `R$ ${valor}` : '';
    // Atualiza a label dinâmica com 4 casas decimais
    const label = document.getElementById(`label-${input.id}`);
    if (label) {
        label.textContent = `R$ ${numero.toFixed(4).replace('.', ',')}`;
    }
    // Recalcula os valores do quadro PREÇO E MARGEM apenas para precoVenda
    if (input.id === 'precoVenda') {
        calcularTotalDespesas();
        calcularPrecoMargem();
    }
}

// Função para formatar percentual
function formatarPercentual(input) {
    const valor = parseFloat(input.value) || 0;
    const label = document.getElementById(`label-${input.id}`);
    label.textContent = valor.toFixed(4) + '%';
    // Recalcula os totais relevantes
    if (input.closest('#formTributario')) {
        calcularTotal();
    }
    if (input.closest('#formDespesasVenda')) {
        calcularTotalDespesas();
        calcularPrecoMargem();
    }
    if (input.id === 'margemDesejada') {
        calcularPrecoMargem();
    }
}

// Função para converter valor monetário para número (em centavos)
function parseMoeda(valor) {
    if (!valor) return 0;
    let numero = parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
    return numero; // Retorna valor float com 4 casas
}

function calcularTotal() {
    const precoCompra = parseMoeda(document.getElementById('precoCompra').value);
    const ipiCompra = parseFloat(document.getElementById('ipiCompra').value) || 0;
    const creditoIcms = parseFloat(document.getElementById('creditoIcms').value) || 0;
    const creditoIpi = parseFloat(document.getElementById('creditoIpi').value) || 0;
    const creditoPis = parseFloat(document.getElementById('creditoPis').value) || 0;
    const creditoCofins = parseFloat(document.getElementById('creditoCofins').value) || 0;
    const subTributaria = parseMoeda(document.getElementById('subTributaria').value);
    const difAliquota = parseFloat(document.getElementById('difAliquota').value) || 0;
    const custoAdicional = parseMoeda(document.getElementById('custoAdicional').value);
    const frete = parseMoeda(document.getElementById('frete').value);

    // Calcula valores percentuais como alíquotas sobre o preço de compra (float)
    const ipiCompraValor = precoCompra * (ipiCompra / 100);
    const creditoIcmsValor = precoCompra * (creditoIcms / 100);
    const creditoIpiValor = precoCompra * (creditoIpi / 100);
    const creditoPisValor = precoCompra * (creditoPis / 100);
    const creditoCofinsValor = precoCompra * (creditoCofins / 100);
    const difAliquotaValor = precoCompra * (difAliquota / 100);

    const total = (precoCompra + ipiCompraValor + subTributaria + difAliquotaValor + custoAdicional + frete)
                - (creditoIcmsValor + creditoIpiValor + creditoPisValor + creditoCofinsValor);

    // Armazena o valor como float, exibe formatado
    const totalElement = document.getElementById('total-resultado');
    totalElement.dataset.value = total;
    totalElement.textContent = `R$ ${total.toFixed(4).replace('.', ',')}`;
    calcularPrecoMargem();
}

function calcularTotalDespesas() {
    const precoVenda = parseMoeda(document.getElementById('precoVenda').value);
    const percentuais = [
        parseFloat(document.getElementById('icmsVenda').value) || 0,
        parseFloat(document.getElementById('ipiVenda').value) || 0,
        parseFloat(document.getElementById('pisVenda').value) || 0,
        parseFloat(document.getElementById('cofinsVenda').value) || 0,
        parseFloat(document.getElementById('impostosSimplesVenda').value) || 0,
        parseFloat(document.getElementById('irpjVenda').value) || 0,
        parseFloat(document.getElementById('csllVenda').value) || 0,
        parseFloat(document.getElementById('freteVenda').value) || 0,
        parseFloat(document.getElementById('comissoesVenda').value) || 0,
        parseFloat(document.getElementById('outrasDespesas').value) || 0
    ];

    const totalDespesas = percentuais.reduce((sum, percentual) => sum + (precoVenda * (percentual / 100)), 0);
    const totalElement = document.getElementById('total-despesas-variaveis');
    totalElement.dataset.value = totalDespesas;
    totalElement.textContent = `R$ ${totalDespesas.toFixed(4).replace('.', ',')}`;
}

function calcularPrecoMargem() {
    const margemDesejada = parseFloat(document.getElementById('margemDesejada').value) || 0;
    const precoVenda = parseMoeda(document.getElementById('precoVenda').value);
    const totalCustoVariavel = parseFloat(document.getElementById('total-resultado').dataset.value) || 0;
    const totalDespesasVariaveis = parseFloat(document.getElementById('total-despesas-variaveis').dataset.value) || 0;

    // Obtém os percentuais individuais do quadro DESPESAS VARIÁVEIS (Venda)
    const percentuais = [
        parseFloat(document.getElementById('icmsVenda').value) || 0,
        parseFloat(document.getElementById('ipiVenda').value) || 0,
        parseFloat(document.getElementById('pisVenda').value) || 0,
        parseFloat(document.getElementById('cofinsVenda').value) || 0,
        parseFloat(document.getElementById('impostosSimplesVenda').value) || 0,
        parseFloat(document.getElementById('irpjVenda').value) || 0,
        parseFloat(document.getElementById('csllVenda').value) || 0,
        parseFloat(document.getElementById('freteVenda').value) || 0,
        parseFloat(document.getElementById('comissoesVenda').value) || 0,
        parseFloat(document.getElementById('outrasDespesas').value) || 0
    ];

    // Calcula o denominador: 100 - soma dos percentuais - Margem Desejada
    const denominador = 100 - percentuais.reduce((sum, percentual) => sum + percentual, 0) - margemDesejada;

    console.log('Debug - Valores:', {
        precoVenda: precoVenda,
        totalCustoVariavel: totalCustoVariavel,
        totalDespesasVariaveis: totalDespesasVariaveis,
        percentuais: percentuais,
        margemDesejada: margemDesejada,
        denominador: denominador
    });

    // Calcula Preço Sugerido corretamente em reais (float)
    const precoSugerido = (denominador > 0) ? (totalCustoVariavel / (denominador / 100)) : 0;
    document.getElementById('precoSugerido').value = `R$ ${precoSugerido.toFixed(4).replace('.', ',')}`;
    document.getElementById('label-precoSugerido').textContent = `R$ ${precoSugerido.toFixed(4).replace('.', ',')}`;

    // Calcula Lucro Bruto corretamente em reais (float)
    const lucroBruto = precoVenda - totalCustoVariavel - totalDespesasVariaveis || 0;
    document.getElementById('lucroBruto').value = `R$ ${lucroBruto.toFixed(4).replace('.', ',')}`;
    document.getElementById('label-lucroBruto').textContent = `R$ ${lucroBruto.toFixed(4).replace('.', ',')}`;


    // Calcula Markup
    const markup = (totalCustoVariavel > 0) ? ((precoVenda - totalCustoVariavel) / totalCustoVariavel) * 100 : 0;
    formatarPercentual(document.getElementById('markup'));
    document.getElementById('markup').value = markup.toFixed(4);
    document.getElementById('label-markup').textContent = `${markup.toFixed(4)}%`;

    // Calcula Margem Lucro Bruto com precisão
    const margemLucroBruto = (precoVenda > 0) ? (parseFloat(lucroBruto) / parseFloat(precoVenda)) * 100 : 0;
    // Trunca para 4 casas decimais sem arredondar
    function truncar4(num) {
        return (Math.trunc(num * 10000) / 10000).toString();
    }
    document.getElementById('margemLucroBruto').value = truncar4(margemLucroBruto);
    document.getElementById('label-margemLucroBruto').textContent = `${truncar4(margemLucroBruto)}%`;

    // Atualiza botão de status de acordo com a regra
    const statusBtn = document.getElementById('statusLucroBtn');
    if (statusBtn) {
    statusBtn.classList.remove('btn-success', 'btn-warning', 'btn-danger', 'btn-secondary', 'btn-outline-success', 'btn-outline-warning', 'btn-outline-danger', 'btn-outline-secondary');
        const epsilon = 0.0001;
        if (margemLucroBruto < 0) {
            statusBtn.textContent = 'Prejuízo';
            statusBtn.classList.add('btn', 'btn-outline-danger');
        } else if (margemLucroBruto > margemDesejada + epsilon) {
            statusBtn.textContent = 'Acima do Esperado';
            statusBtn.classList.add('btn', 'btn-outline-success');
        } else if (Math.abs(margemLucroBruto - margemDesejada) <= epsilon) {
            statusBtn.textContent = 'Dentro do Esperado';
            statusBtn.classList.add('btn', 'btn-outline-warning');
        } else {
            statusBtn.textContent = 'Neutro';
            statusBtn.classList.add('btn', 'btn-outline-secondary');
        }
        statusBtn.disabled = true;
    }
}

// Aplica formatação e cálculo em tempo real, excluindo lucroBruto
document.querySelectorAll('.monetario').forEach(input => {
    if (input.id !== 'lucroBruto') {
        input.addEventListener('blur', () => {
            formatarMoeda(input);
            calcularTotal();
            if (input.id === 'precoVenda') {
                calcularTotalDespesas();
                calcularPrecoMargem();
            }
        });
    }
});

document.querySelectorAll('.percentual').forEach(input => {
    input.addEventListener('input', () => {
        formatarPercentual(input);
        if (input.closest('#formTributario')) {
            calcularTotal();
        }
        if (input.closest('#formDespesasVenda')) {
            calcularTotalDespesas();
            calcularPrecoMargem();
        }
        if (input.id === 'margemDesejada') {
            calcularPrecoMargem();
        }
    });
});

// Função para alternar tema com escuro como padrão
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const button = document.querySelector('.theme-toggle button');
    const isDark = document.body.classList.contains('dark-theme');
    button.textContent = isDark ? 'Tema Claro' : 'Tema Escuro';
    button.classList.toggle('btn-outline-light', isDark);
    button.classList.toggle('btn-outline-primary', !isDark);
}

// Aplica o tema escuro como padrão ao carregar a página
window.onload = function() {
    if (!document.body.classList.contains('dark-theme')) {
        toggleTheme(); // Ativa o tema escuro se não estiver ativo
    }
};