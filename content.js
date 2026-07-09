(function() {
  // Estrutura de horários
  const horarios = [
    { turno: 'M', num: 1, desc: '07:00-07:50' },
    { turno: 'M', num: 2, desc: '07:50-08:40' },
    { turno: 'M', num: 3, desc: '08:55-09:45' },
    { turno: 'M', num: 4, desc: '09:45-10:35' },
    { turno: 'M', num: 5, desc: '10:50-11:40' },
    { turno: 'M', num: 6, desc: '11:40-12:30' },
    { turno: 'T', num: 1, desc: '13:00-13:50' },
    { turno: 'T', num: 2, desc: '13:50-14:40' },
    { turno: 'T', num: 3, desc: '14:55-15:45' },
    { turno: 'T', num: 4, desc: '15:45-16:35' },
    { turno: 'T', num: 5, desc: '16:50-17:40' },
    { turno: 'T', num: 6, desc: '17:40-18:30' },
    { turno: 'N', num: 1, desc: '18:45-19:35' },
    { turno: 'N', num: 2, desc: '19:35-20:25' },
    { turno: 'N', num: 3, desc: '20:35-21:25' },
    { turno: 'N', num: 4, desc: '21:25-22:15' }
  ];

  // Extrai as turmas da tabela
  function extrairTurmas() {
    const tabela = document.getElementById('lista-turmas');
    if (!tabela) return [];
    const tbody = tabela.querySelector('tbody');
    if (!tbody) return [];

    const linhas = tbody.querySelectorAll('tr');
    const turmas = [];
    let codigoAtual = null;

    linhas.forEach(tr => {
      if (tr.classList.contains('destaque')) {
        const texto = tr.textContent.trim();
        const match = texto.match(/^([A-Z0-9]+)\s*-\s*/);
        if (match) codigoAtual = match[1];
        return;
      }

      if (tr.classList.contains('linhaPar') || tr.classList.contains('linhaImpar')) {
        if (tr.style.display === 'none') return;
        const tds = tr.querySelectorAll('td');
        if (tds.length < 10) return;

        const linkTurma = tds[1].querySelector('a');
        if (!linkTurma) return;
        const onclickAttr = linkTurma.getAttribute('onclick');
        const idMatch = onclickAttr && onclickAttr.match(/PainelTurma\.show\((\d+)\)/);
        const idTurma = idMatch ? idMatch[1] : null;
        if (!idTurma) return;

        turmas.push({
          id: idTurma,
          codigo: codigoAtual,
          anoPeriodo: tds[0].textContent.trim(),
          turmaNumero: linkTurma.textContent.trim(),
          docente: tds[2].textContent.trim(),
          tipo: tds[3].textContent.trim(),
          modalidade: tds[4].textContent.trim(),
          situacao: tds[5].textContent.trim(),
          horario: tds[6].textContent.trim(),
          local: tds[7].textContent.trim(),
          capacidade: tds[8].textContent.trim()
        });
      }
    });
    return turmas;
  }

  // Parser do horário (ex: "35T12" → dias [3,5], turno T, nums [1,2])
  function parseHorario(horarioStr) {
    const tokens = horarioStr.match(/[2-7]+[MTN][1-7]+/g);
    if (!tokens) return [];
    const result = [];
    tokens.forEach(token => {
      const diasMatch = token.match(/^[2-7]+/);
      const turnoMatch = token.match(/[MTN]/);
      const numsMatch = token.match(/[1-7]+$/);
      if (diasMatch && turnoMatch && numsMatch) {
        const dias = diasMatch[0].split('').map(Number);
        const turno = turnoMatch[0];
        const nums = numsMatch[0].split('').map(Number);
        dias.forEach(dia => {
          nums.forEach(num => {
            result.push({ dia, turno, num });
          });
        });
      }
    });
    return result;
  }

  // Renderiza a grade com as turmas selecionadas
  function renderizarGrade(turmasSelecionadas) {
    const container = document.getElementById('grade-flutuante');
    if (!container) return;

    const mensagem = container.querySelector('.mensagem-inicial');
    const tabela = container.querySelector('table');
    const body = container.querySelector('#gradeBody');

    if (!turmasSelecionadas || turmasSelecionadas.length === 0) {
      if (mensagem) mensagem.style.display = 'block';
      if (tabela) tabela.style.display = 'none';
      return;
    }

    if (mensagem) mensagem.style.display = 'none';
    if (tabela) tabela.style.display = 'table';

    // Monta a grade: chave "dia_turno_num" → array de códigos
    const grade = {};
    turmasSelecionadas.forEach(turma => {
      const codigo = turma.codigo || '?';
      const parsed = parseHorario(turma.horario);
      parsed.forEach(({ dia, turno, num }) => {
        const key = `${dia}_${turno}_${num}`;
        if (!grade[key]) grade[key] = [];
        grade[key].push(codigo);
      });
    });

    // Preenche o corpo da tabela
    body.innerHTML = '';
    horarios.forEach(h => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.className = 'horario-label';
      tdLabel.textContent = `${h.turno}${h.num} ${h.desc}`;
      tr.appendChild(tdLabel);

      for (let dia = 2; dia <= 7; dia++) {
        const td = document.createElement('td');
        const key = `${dia}_${h.turno}_${h.num}`;
        const codigos = grade[key] || [];
        if (codigos.length === 0) {
          td.textContent = '—';
          td.className = 'vazio';
        } else {
          td.textContent = codigos.join(', ');
          td.className = 'codigo-cell';
        }
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
  }

  // Cria o painel flutuante (se não existir)
  function criarPainel() {
    if (document.getElementById('grade-flutuante')) return;

    const div = document.createElement('div');
    div.id = 'grade-flutuante';
    div.innerHTML = `
      <h2>
        📅 Grade de Horários Semanal
        <span class="fechar" id="fechar-grade">&times;</span>
      </h2>
      <div class="mensagem-inicial" id="mensagemInicial">
        Selecione uma ou mais turmas na lista principal
      </div>
      <table id="gradeTabela" style="display:none;">
        <thead>
          <tr>
            <th>Horário</th>
            <th>Seg</th>
            <th>Ter</th>
            <th>Qua</th>
            <th>Qui</th>
            <th>Sex</th>
            <th>Sáb</th>
          </tr>
        </thead>
        <tbody id="gradeBody"></tbody>
      </table>
      <div class="legenda">
        <strong>Código do componente</strong> – células com conflito mostram múltiplos códigos separados por vírgula.
      </div>
    `;
    document.body.appendChild(div);

    // Fechar ao clicar no "×"
    document.getElementById('fechar-grade').addEventListener('click', function() {
      div.style.display = 'none';
    });

    return div;
  }

  // Inicialização
  function inicializar() {
    const turmas = extrairTurmas();
    if (turmas.length === 0) return;

    const selecionados = new Set();
    const painel = criarPainel();

    // Adiciona checkboxes às linhas de turma
    const linhasTurma = document.querySelectorAll('#lista-turmas tbody tr.linhaPar, #lista-turmas tbody tr.linhaImpar');
    linhasTurma.forEach(tr => {
      if (tr.style.display === 'none') return;
      const tds = tr.querySelectorAll('td');
      if (tds.length < 10) return;
      const linkTurma = tds[1].querySelector('a');
      if (!linkTurma) return;
      const onclickAttr = linkTurma.getAttribute('onclick');
      const idMatch = onclickAttr && onclickAttr.match(/PainelTurma\.show\((\d+)\)/);
      const idTurma = idMatch ? idMatch[1] : null;
      if (!idTurma) return;

      const firstTd = tds[0];
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'seletor-turma';
      checkbox.dataset.id = idTurma;
      checkbox.addEventListener('change', function() {
        const id = this.dataset.id;
        if (this.checked) {
          selecionados.add(id);
        } else {
          selecionados.delete(id);
        }

        const selecionadas = Array.from(selecionados).map(id => turmas.find(t => t.id === id)).filter(Boolean);
        if (selecionadas.length > 0) {
          painel.style.display = 'block';
          renderizarGrade(selecionadas);
        } else {
          // Mostra mensagem e limpa tabela
          const mensagem = painel.querySelector('.mensagem-inicial');
          const tabela = painel.querySelector('table');
          if (mensagem) mensagem.style.display = 'block';
          if (tabela) tabela.style.display = 'none';
          document.getElementById('gradeBody').innerHTML = '';
          painel.style.display = 'block'; // mantém aberto com mensagem
        }
      });

      firstTd.insertBefore(checkbox, firstTd.firstChild);
    });

    // Se houver pelo menos um checkbox, exibe o painel com a mensagem inicial
    if (document.querySelector('.seletor-turma')) {
      painel.style.display = 'block';
    }
  }

  // Aguarda o DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
