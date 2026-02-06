(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getCookie(name) {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf(name + '=') === 0)
        return decodeURIComponent(c.substring(name.length + 1));
    }
    return null;
  }

  function apiPost(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) throw new Error('API ' + r.status);
      return r.json();
    });
  }

  function fileExt(name) {
    return (name || '').toLowerCase().split('.').pop();
  }

  function isImage(file) {
    if (file.type && file.type.indexOf('image/') === 0) return true;
    return (
      'jpg jpeg png gif webp bmp svg'.split(' ').indexOf(fileExt(file.name)) !==
      -1
    );
  }

  function isVideo(file) {
    if (file.type && file.type.indexOf('video/') === 0) return true;
    return 'mp4 mov webm avi mkv'.split(' ').indexOf(fileExt(file.name)) !== -1;
  }

  // ── S3 multi-part upload ─────────────────────────────────────────────────

  function uploadFileToS3(file, baseUrl, fieldId, onProgress) {
    onProgress(0);

    return apiPost(baseUrl + '/upload-initialize/', {
      field_id: fieldId,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || 'application/octet-stream',
    }).then(function (init) {
      var uploaded = 0;
      var parts = [];

      function nextPart(idx) {
        if (idx >= init.parts.length) return Promise.resolve();
        var part = init.parts[idx];
        var blob = file.slice(uploaded, uploaded + part.size);

        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable)
              onProgress(Math.round(((uploaded + e.loaded) / file.size) * 100));
          };
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              parts.push({
                part_number: part.part_number,
                size: part.size,
                etag: xhr.getResponseHeader('ETag'),
              });
              uploaded += part.size;
              resolve();
            } else reject(new Error('Part ' + xhr.status));
          };
          xhr.onerror = function () {
            reject(new Error('Network error'));
          };
          xhr.open('PUT', part.upload_url);
          xhr.send(blob);
        }).then(function () {
          return nextPart(idx + 1);
        });
      }

      return nextPart(0)
        .then(function () {
          return apiPost(baseUrl + '/upload-complete/', {
            upload_signature: init.upload_signature,
            upload_id: init.upload_id,
            parts: parts,
          }).then(function (d) {
            return fetch(d.complete_url, { method: 'POST', body: d.body });
          });
        })
        .then(function () {
          return apiPost(baseUrl + '/finalize/', {
            upload_signature: init.upload_signature,
          });
        })
        .then(function (d) {
          return d.field_value;
        });
    });
  }

  // ── Formset clone ────────────────────────────────────────────────────────

  function cloneEmptyForm(prefix) {
    var tpl = document.getElementById(prefix + '-empty');
    var total = document.getElementById('id_' + prefix + '-TOTAL_FORMS');
    if (!tpl || !total) return null;

    var idx = parseInt(total.value, 10);
    var row = tpl.cloneNode(true);
    row.classList.remove('empty-form');
    row.classList.add('dynamic-' + prefix);
    row.id = prefix + '-' + idx;
    row.style.display = '';

    row.querySelectorAll('*').forEach(function (el) {
      ['id', 'name', 'for'].forEach(function (attr) {
        var v = el.getAttribute(attr);
        if (v && v.indexOf('__prefix__') !== -1)
          el.setAttribute(attr, v.replace(/__prefix__/g, idx));
      });
    });

    tpl.parentNode.insertBefore(row, tpl);
    total.value = idx + 1;
    return row;
  }

  // ── Widget init ──────────────────────────────────────────────────────────

  /*
   * Reproduces the original admin_async_upload layout:
   *
   *   <p class="file-upload">
   *     Currently: <a href="…">name</a> <img style="width:250px">   ← existing
   *     <span>status</span> <input type="file">                     ← new
   *   </p>
   *   <progress value="0" max="1" style="width:500px">
   *   <input type="hidden" name="…" value="…">
   */
  function initWidget(input) {
    if (input._s3 || input.closest('.empty-form')) return;
    input._s3 = true;

    var baseUrl = input.dataset.s3fileinput;
    var fieldId = input.dataset.fieldId;
    if (!baseUrl || !fieldId) return;

    var name = input.name;
    var cell = input.parentNode; // the <td> (or wrapper)

    // ── For existing files: clean up and return ──
    var link = cell.querySelector('a[href]');
    if (link) {
      input.style.display = 'none';
      // Strip "Change:" text and trailing <br>
      cell.querySelectorAll('br').forEach(function (br) {
        br.style.display = 'none';
      });
      cell.childNodes.forEach(function (n) {
        if (n.nodeType === 3 && /Change/i.test(n.textContent))
          n.textContent = n.textContent.replace(/Change\s*:?/g, '');
      });
      return;
    }

    // ── New row: build the widget DOM ──

    // <p class="file-upload"> wrapper (may already exist for admin clearable widget)
    var p =
      cell.querySelector('p.file-upload') ||
      (function () {
        var el = document.createElement('p');
        el.className = 'file-upload';
        cell.insertBefore(el, input);
        el.appendChild(input);
        return el;
      })();

    // Status span
    var status = document.createElement('span');
    p.insertBefore(status, input);

    // Progress bar (always visible, after <p>)
    var bar = document.createElement('progress');
    bar.value = 0;
    bar.max = 1;
    bar.style.cssText = 'width:500px;';
    cell.insertBefore(bar, p.nextSibling);

    // Hidden input for the signed field value
    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    cell.appendChild(hidden);
    input.name = ''; // prevent double submission

    // Events
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) upload(input.files[0]);
    });
    input.addEventListener('dragover', function (e) {
      e.preventDefault();
    });
    input.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) upload(e.dataTransfer.files[0]);
    });

    // Expose for bulk dropzone
    input._s3upload = upload;

    function upload(file) {
      bar.value = 0;
      status.textContent = file.name + ' \u23F3 Uploading... ';
      input.style.display = 'none';

      // Remove any previous preview
      var old = cell.querySelector('.s3-preview');
      if (old) old.remove();

      // Block form submit
      var form = cell.closest('form');
      var blocker = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('File upload is still in progress.');
      };
      if (form) form.addEventListener('submit', blocker, true);

      uploadFileToS3(file, baseUrl, fieldId, function (pct) {
        bar.value = Math.max(0.05, pct / 100);
      })
        .then(function (val) {
          hidden.value = val;
          bar.value = 1;
          status.textContent = file.name + ' \u2705 Uploaded';

          // Preview — insert inside <p> so it sits above the progress bar
          var preview = null;
          if (isImage(file)) {
            preview = document.createElement('img');
            preview.src = URL.createObjectURL(file);
            preview.style.cssText = 'width:250px;display:block;margin-top:4px;';
          } else if (isVideo(file)) {
            preview = document.createElement('video');
            preview.src = URL.createObjectURL(file);
            preview.controls = true;
            preview.preload = 'metadata';
            preview.style.cssText =
              'max-width:250px;max-height:200px;display:block;margin-top:4px;';
          }
          if (preview) {
            preview.className = 's3-preview';
            p.appendChild(preview); // inside <p>, before <progress>
          }
        })
        .catch(function (err) {
          console.error('[s3_upload]', err);
          status.textContent =
            file.name +
            ' \u274C Error while uploading - please re-upload this file';
          bar.value = 0;
          input.style.display = '';
        })
        .finally(function () {
          if (form) form.removeEventListener('submit', blocker, true);
        });
    }
  }

  // ── Bulk dropzone ────────────────────────────────────────────────────────

  function initBulkDropzones() {
    document.querySelectorAll('.inline-group').forEach(function (group) {
      if (group._s3bulk || !group.querySelector('input[data-s3fileinput]'))
        return;
      var prefix = (group.id || '').replace(/-group$/, '');
      var heading = group.querySelector('h2');
      if (!prefix || !heading) return;
      group._s3bulk = true;

      injectCSS();

      var dz = document.createElement('div');
      dz.className = 'bulk-dropzone';
      dz.textContent = '\uD83D\uDCE5 Click or drop files here to upload';
      heading.appendChild(dz);

      var browse = document.createElement('input');
      browse.type = 'file';
      browse.multiple = true;
      browse.style.display = 'none';
      heading.appendChild(browse);

      dz.addEventListener('click', function () {
        browse.click();
      });
      browse.addEventListener('change', function () {
        if (browse.files.length) bulkUpload(browse.files, prefix);
        browse.value = '';
      });
      dz.addEventListener('dragenter', function () {
        dz.classList.add('drag-hover');
      });
      dz.addEventListener('dragleave', function () {
        dz.classList.remove('drag-hover');
      });
      dz.addEventListener('dragover', function (e) {
        e.preventDefault();
      });
      dz.addEventListener('drop', function (e) {
        e.preventDefault();
        dz.classList.remove('drag-hover');
        if (e.dataTransfer.files.length)
          bulkUpload(e.dataTransfer.files, prefix);
      });
    });
  }

  function bulkUpload(files, prefix) {
    Array.from(files).forEach(function (file) {
      var row = cloneEmptyForm(prefix);
      if (!row) return;
      var inp = row.querySelector('input[data-s3fileinput]');
      if (!inp) return;
      initWidget(inp);
      if (inp._s3upload) inp._s3upload(file);
    });
  }

  // ── CSS ──────────────────────────────────────────────────────────────────

  var cssDone = false;
  function injectCSS() {
    if (cssDone) return;
    cssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '.bulk-dropzone{margin-top:10px;padding:12px;border:2px dashed #ccc;' +
      'border-radius:6px;text-align:center;font-size:14px;background:#f9f9f9;' +
      'color:#555;transition:background .2s,border-color .2s;cursor:pointer}' +
      '.bulk-dropzone.drag-hover{border-color:#66afe9;background:#eef9ff}';
    document.head.appendChild(s);
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  function initAll() {
    document.querySelectorAll('input[data-s3fileinput]').forEach(initWidget);
    initBulkDropzones();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('formset:added', function (e) {
    if (e.target)
      e.target.querySelectorAll('input[data-s3fileinput]').forEach(initWidget);
  });
})();
