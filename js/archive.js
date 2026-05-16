(function () {
  var STORAGE_KEY = 'rayna-archive';
  var DEFAULT_ENTRIES = [
    {
      id: 'a1',
      date: '2026-05-16',
      title: '搭好了自己的博客',
      note: '用 HTML + CSS + JS 从零搭建了一个干净的个人博客。加了暗色模式、Archive 页面、和 Social 页面。',
      link: 'index.html',
      image: null,
      file: null
    },
    {
      id: 'a2',
      date: '2026-05-16',
      title: '发布了第一篇文章',
      note: 'Hello, World——博客的第一篇文章，关于为什么开始写作。',
      link: 'posts/hello-world.html',
      image: null,
      file: null
    }
  ];

  var entries = [];
  var editingId = null;

  // ── Load entries ──
  function loadEntries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        entries = JSON.parse(raw);
      } else {
        entries = DEFAULT_ENTRIES.slice();
        saveEntries();
      }
    } catch (e) {
      entries = DEFAULT_ENTRIES.slice();
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      alert('Storage is full. Please remove some entries or images.');
    }
  }

  // ── Render timeline ──
  function renderTimeline() {
    var container = document.getElementById('timeline');
    if (!container) return;

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>还没有记录。点击上方 "+ New Entry" 开始。</p></div>';
      return;
    }

    // Sort by date descending
    var sorted = entries.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var e = sorted[i];
      html += '<div class="timeline-entry" data-id="' + e.id + '">';
      html += '<div class="timeline-dot"></div>';
      html += '<div class="timeline-date">' + escapeHTML(e.date) + '</div>';
      html += '<div class="timeline-title">' + escapeHTML(e.title) + '</div>';

      if (e.note) {
        html += '<div class="timeline-note"><p>' + escapeHTML(e.note).replace(/\n/g, '<br>') + '</p></div>';
      }

      if (e.image) {
        html += '<div class="timeline-image"><img src="' + e.image + '" alt="Image" loading="lazy"></div>';
      }

      if (e.file) {
        html += '<div class="timeline-file">';
        html += '<span class="file-icon">📎</span>';
        html += '<a href="' + e.file.data + '" download="' + escapeHTML(e.file.name) + '">' + escapeHTML(e.file.name) + '</a>';
        html += '</div>';
      }

      if (e.link) {
        html += '<div class="timeline-link"><a href="' + e.link + '" target="_blank" rel="noopener">→ ' + escapeHTML(e.link) + '</a></div>';
      }

      if (isUnlocked()) {
        html += '<button class="btn-delete" data-id="' + e.id + '" title="Delete">×</button>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Attach delete handlers
    var deleteButtons = container.querySelectorAll('.btn-delete');
    for (var j = 0; j < deleteButtons.length; j++) {
      deleteButtons[j].addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        deleteEntry(id);
      });
    }
  }

  // ── Delete entry ──
  function deleteEntry(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    entries = entries.filter(function (e) { return e.id !== id; });
    saveEntries();
    renderTimeline();
  }

  // ── Form handlers ──
  var btnAdd = document.getElementById('btnAddEntry');
  var form = document.getElementById('archiveForm');
  var btnSave = document.getElementById('btnSave');
  var btnCancel = document.getElementById('btnCancel');

  var inputDate = document.getElementById('entryDate');
  var inputTitle = document.getElementById('entryTitle');
  var inputNote = document.getElementById('entryNote');
  var inputImage = document.getElementById('entryImage');
  var inputFile = document.getElementById('entryFile');
  var inputLink = document.getElementById('entryLink');

  // Preview elements
  var imagePreview = document.getElementById('imagePreview');
  var imagePreviewImg = document.getElementById('imagePreviewImg');
  var btnRemoveImage = document.getElementById('btnRemoveImage');
  var filePreview = document.getElementById('filePreview');
  var filePreviewName = document.getElementById('filePreviewName');
  var btnRemoveFile = document.getElementById('btnRemoveFile');

  // Temp storage for base64 data
  var tempImageData = null;
  var tempFileData = null;

  // Set today's date as default
  if (inputDate) {
    inputDate.value = new Date().toISOString().split('T')[0];
  }

  function showForm() {
    editingId = null;
    resetForm();
    form.style.display = 'block';
    btnAdd.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  function hideForm() {
    form.style.display = 'none';
    btnAdd.style.display = 'inline-block';
    resetForm();
  }

  function resetForm() {
    editingId = null;
    if (inputDate) inputDate.value = new Date().toISOString().split('T')[0];
    if (inputTitle) inputTitle.value = '';
    if (inputNote) inputNote.value = '';
    if (inputLink) inputLink.value = '';
    tempImageData = null;
    tempFileData = null;
    if (inputImage) inputImage.value = '';
    if (inputFile) inputFile.value = '';
    imagePreview.style.display = 'none';
    filePreview.style.display = 'none';
  }

  if (btnAdd) btnAdd.addEventListener('click', showForm);
  if (btnCancel) btnCancel.addEventListener('click', hideForm);

  // Image upload
  if (inputImage) {
    inputImage.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        alert('图片不要超过 4MB，否则存储空间可能不够。');
        this.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        tempImageData = reader.result;
        imagePreviewImg.src = reader.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', function () {
      tempImageData = null;
      inputImage.value = '';
      imagePreview.style.display = 'none';
    });
  }

  // File upload
  if (inputFile) {
    inputFile.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('文件不要超过 5MB。');
        this.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        tempFileData = {
          name: file.name,
          type: file.type,
          data: reader.result
        };
        filePreviewName.textContent = file.name + ' (' + formatSize(file.size) + ')';
        filePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', function () {
      tempFileData = null;
      inputFile.value = '';
      filePreview.style.display = 'none';
    });
  }

  // Save entry
  if (btnSave) {
    btnSave.addEventListener('click', function () {
      var title = (inputTitle ? inputTitle.value.trim() : '');
      var date = (inputDate ? inputDate.value : '');
      if (!title) { alert('请输入标题。'); return; }
      if (!date) { alert('请选择日期。'); return; }

      var entry = {
        id: editingId || 'e' + Date.now(),
        date: date,
        title: title,
        note: inputNote ? inputNote.value.trim() : '',
        link: inputLink ? inputLink.value.trim() : '',
        image: tempImageData,
        file: tempFileData
      };

      if (editingId) {
        entries = entries.map(function (e) { return e.id === editingId ? entry : e; });
      } else {
        entries.push(entry);
      }

      saveEntries();
      renderTimeline();
      hideForm();
    });
  }

  // ── Helpers ──
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // ── Auth ──
  function isUnlocked() {
    return window.__blogAuth && window.__blogAuth.isUnlocked();
  }

  function updateEditUI(unlocked) {
    if (btnAdd) btnAdd.style.display = unlocked ? 'inline-block' : 'none';
    if (!unlocked && form && form.style.display === 'block') hideForm();
    renderTimeline();
  }

  if (window.__blogAuth) {
    window.__blogAuth.onAuthChange(updateEditUI);
  }

  // ── Init ──
  loadEntries();
  updateEditUI(isUnlocked());
})();
