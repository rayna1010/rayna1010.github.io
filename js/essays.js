(function () {
  var STORAGE_KEY = 'rayna-essays';
  var expandedId = null;

  var essays = [];

  // ── Load ──
  function loadEssays() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      essays = raw ? JSON.parse(raw) : [];
    } catch (e) {
      essays = [];
    }
  }

  function saveEssays() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(essays));
    } catch (e) {
      alert('Storage is full. Please remove some essays.');
    }
  }

  // ── Render cards ──
  var cardsContainer = document.getElementById('essayCards');

  function renderCards() {
    if (!cardsContainer) return;

    if (essays.length === 0) {
      cardsContainer.innerHTML =
        '<div class="social-card" style="cursor:default;pointer-events:none;">' +
        '<div class="social-icon">✍</div>' +
        '<div class="social-info">' +
        '<span class="social-name">还没有文章</span>' +
        '<span class="social-handle">写点什么吧</span>' +
        '</div></div>';
      return;
    }

    var sorted = essays.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var e = sorted[i];
      var isOpen = (expandedId === e.id);
      var preview = e.content ? e.content.replace(/<[^>]*>/g, '').substring(0, 80) : '';
      if (e.content && e.content.length > 80) preview += '...';

      html += '<div class="essay-card-wrapper" data-id="' + e.id + '">';

      html += '<div class="social-card essay-card' + (isOpen ? ' essay-card-open' : '') + '">';
      html += '<div class="social-icon">✍</div>';
      html += '<div class="social-info">';
      html += '<span class="social-name">' + esc(e.title) + '</span>';
      html += '<span class="social-handle">' + esc(e.date) + ' &middot; ' + esc(preview) + '</span>';
      html += '</div>';
      html += '<span class="social-arrow essay-arrow">' + (isOpen ? '↑' : '↓') + '</span>';
      html += '</div>';

      if (isOpen) {
        html += '<div class="essay-body">';
        html += '<div class="essay-body-text">' + (e.content || '') + '</div>';
        html += '</div>';
      }

      if (isUnlocked()) {
        html += '<button class="essay-delete" data-id="' + e.id + '" title="Delete">×</button>';
      }
      html += '</div>';
    }

    cardsContainer.innerHTML = html;

    // Click card to expand
    var cards = cardsContainer.querySelectorAll('.essay-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var wrapper = this.closest('.essay-card-wrapper');
        var id = wrapper.getAttribute('data-id');
        expandedId = (expandedId === id) ? null : id;
        renderCards();
      });
    }

    // Delete
    var deletes = cardsContainer.querySelectorAll('.essay-delete');
    for (var k = 0; k < deletes.length; k++) {
      deletes[k].addEventListener('click', function (ev) {
        ev.stopPropagation();
        var id = this.getAttribute('data-id');
        if (!confirm('确定要删除这篇文章吗？')) return;
        essays = essays.filter(function (e) { return e.id !== id; });
        if (expandedId === id) expandedId = null;
        saveEssays();
        renderCards();
      });
    }
  }

  // ── Form logic ──
  var btnAdd = document.getElementById('btnAddEssay');
  var form = document.getElementById('essayForm');
  var btnSave = document.getElementById('btnSaveEssay');
  var btnCancel = document.getElementById('btnCancelEssay');

  var inputTitle = document.getElementById('essayTitle');
  var inputDate = document.getElementById('essayDate');
  var inputContent = document.getElementById('essayContent');
  var inputFile = document.getElementById('essayFile');

  var filePreview = document.getElementById('essayFilePreview');
  var fileNameEl = document.getElementById('essayFileName');
  var btnRemoveFile = document.getElementById('btnRemoveEssayFile');

  if (inputDate) {
    inputDate.value = new Date().toISOString().split('T')[0];
  }

  function showForm() {
    form.style.display = 'block';
    btnAdd.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  function hideForm() {
    form.style.display = 'none';
    btnAdd.style.display = 'inline-block';
    if (inputTitle) inputTitle.value = '';
    if (inputContent) inputContent.value = '';
    if (inputDate) inputDate.value = new Date().toISOString().split('T')[0];
    if (inputFile) inputFile.value = '';
    filePreview.style.display = 'none';
  }

  if (btnAdd) btnAdd.addEventListener('click', showForm);
  if (btnCancel) btnCancel.addEventListener('click', hideForm);

  // File upload for .txt
  if (inputFile) {
    inputFile.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        inputContent.value = reader.result;
        fileNameEl.textContent = file.name;
        filePreview.style.display = 'block';
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', function () {
      inputFile.value = '';
      filePreview.style.display = 'none';
    });
  }

  // Save
  if (btnSave) {
    btnSave.addEventListener('click', function () {
      var title = inputTitle ? inputTitle.value.trim() : '';
      var date = inputDate ? inputDate.value : '';
      var content = inputContent ? inputContent.value.trim() : '';

      if (!title) { alert('请输入标题。'); return; }
      if (!date) { alert('请选择日期。'); return; }
      if (!content) { alert('请输入正文或上传文件。'); return; }

      // Convert newlines to <br> for display
      var formatted = esc(content).replace(/\n/g, '<br>');

      essays.push({
        id: 'es' + Date.now(),
        title: title,
        date: date,
        content: formatted
      });

      saveEssays();
      renderCards();
      hideForm();
    });
  }

  // ── Helpers ──
  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Auth ──
  function isUnlocked() {
    return window.__blogAuth && window.__blogAuth.isUnlocked();
  }

  function updateEditUI(unlocked) {
    if (btnAdd) btnAdd.style.display = unlocked ? 'inline-block' : 'none';
    if (!unlocked && form && form.style.display === 'block') hideForm();
    renderCards();
  }

  if (window.__blogAuth) {
    window.__blogAuth.onAuthChange(updateEditUI);
  }

  // ── Init ──
  loadEssays();
  updateEditUI(isUnlocked());
})();
