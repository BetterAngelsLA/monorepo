/* ── Schedule Editor JS ──────────────────────────────────────
   Manages schedule inline forms in the Shelter admin.
   ALL entries (saved + new) render as identical flat rows:
     [type badge/select] [day pills] [start – end]
   Django inline forms are hidden; JS rows sync values to them.
   ──────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var schedGroup = document.getElementById('schedules-group');
  if (!schedGroup) return;

  /* ── Constants ──────────────────────────────────────── */
  var PREFIX = 'schedules';
  var DAY_ORDER = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  var DAY_SHORT = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  var TYPE_LABELS = {
    operating: 'Operating Hours',
    intake: 'Intake Hours',
    meal_service: 'Meal Service',
    staff_availability: 'Staff Availability',
  };
  var TYPE_OPTIONS = [
    { value: 'operating', label: 'Operating Hours' },
    { value: 'intake', label: 'Intake Hours' },
    { value: 'meal_service', label: 'Meal Service' },
    { value: 'staff_availability', label: 'Staff Availability' },
  ];
  var CONDITION_LABELS = {
    heat: 'Heat',
    fire: 'Fire',
    rain_severe_weather: 'Rain / Severe Weather',
    wind: 'Wind',
    air_quality_smoke: 'Air Quality / Smoke',
    public_health_emergency: 'Public Health Emergency',
    emergency_evacuation: 'Emergency Evacuation',
  };
  var CONDITION_OPTIONS = [
    { value: '', label: '(none)' },
    { value: 'heat', label: 'Heat' },
    { value: 'fire', label: 'Fire' },
    { value: 'rain_severe_weather', label: 'Rain / Severe Weather' },
    { value: 'wind', label: 'Wind' },
    { value: 'air_quality_smoke', label: 'Air Quality / Smoke' },
    { value: 'public_health_emergency', label: 'Public Health Emergency' },
    { value: 'emergency_evacuation', label: 'Emergency Evacuation' },
  ];

  /* ── Timezone label ────────────────────────────────── */
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz) {
    var headings = schedGroup.querySelectorAll('h2');
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].textContent.indexOf('Schedule') !== -1) {
        var span = document.createElement('span');
        span.className = 'tz-label';
        span.textContent = '(Times in ' + tz + ')';
        headings[i].appendChild(span);
      }
    }
  }

  /* ── DOM Helpers ────────────────────────────────────── */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function getFormFields(formDiv) {
    var pfx = PREFIX + '-' + (formDiv.id || '').replace(PREFIX + '-', '');
    var v = function (field) {
      return (
        (document.getElementById('id_' + pfx + '-' + field) || {}).value || ''
      );
    };
    var c = function (field) {
      return !!(document.getElementById('id_' + pfx + '-' + field) || {})
        .checked;
    };
    return {
      pfx: pfx,
      schedType: v('schedule_type'),
      day: v('day'),
      startTime: v('start_time'),
      endTime: v('end_time'),
      startDate: v('start_date'),
      endDate: v('end_date'),
      condition: v('condition'),
      demographic: v('demographic'),
      isException: c('is_exception'),
      isDeleted: c('DELETE'),
    };
  }

  function setHiddenField(formDiv, fieldName, value) {
    var pfx = PREFIX + '-' + (formDiv.id || '').replace(PREFIX + '-', '');
    var e = document.getElementById('id_' + pfx + '-' + fieldName);
    if (e) e.value = value;
  }

  function syncDaysToForm(formDiv, activeDays) {
    var container = formDiv.querySelector('.multi-day-checkbox');
    if (!container) return;
    var cbs = container.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = !!activeDays[cbs[i].value];
    }
  }

  function fmtTime(val) {
    if (!val) return '';
    var parts = val.split(':');
    var h = parseInt(parts[0], 10),
      m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return h + ':' + m + ' ' + ampm;
  }

  function fmtTimeRange(start, end) {
    if (!start || !end) return '';
    if (
      (start === '00:00' || start === '00:00:00') &&
      (end === '00:00' || end === '00:00:00')
    )
      return '24 Hours';
    return fmtTime(start) + ' \u2013 ' + fmtTime(end);
  }

  /* ── Inline form management ────────────────────────── */
  var skipNextObserver = false;

  function addNewInlineForm(opts) {
    var emptyForm = document.getElementById(PREFIX + '-empty');
    var totalEl = document.getElementById('id_' + PREFIX + '-TOTAL_FORMS');
    if (!emptyForm || !totalEl) return null;
    var idx = parseInt(totalEl.value, 10);

    var clone = emptyForm.cloneNode(true);
    clone.classList.remove('empty-form');
    clone.classList.add('dynamic-form');
    clone.id = PREFIX + '-' + idx;

    var regex = new RegExp(PREFIX + '-(\\d+|__prefix__)', 'g');
    var repl = PREFIX + '-' + idx;
    var nodes = clone.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.id) n.id = n.id.replace(regex, repl);
      if (n.name) n.name = n.name.replace(regex, repl);
      if (n.getAttribute('for'))
        n.setAttribute('for', n.getAttribute('for').replace(regex, repl));
    }

    skipNextObserver = true;
    emptyForm.parentNode.insertBefore(clone, emptyForm);
    totalEl.value = idx + 1;

    var pfx = 'id_' + PREFIX + '-' + idx;
    var set = function (f, v) {
      var e = document.getElementById(pfx + '-' + f);
      if (e && v != null) e.value = v;
    };
    set('schedule_type', opts.schedType || 'operating');
    set('day', opts.day || '');
    set('start_time', opts.startTime || '');
    set('end_time', opts.endTime || '');
    set('start_date', opts.startDate || '');
    set('end_date', opts.endDate || '');
    set('condition', opts.condition || '');
    set('demographic', opts.demographic || '');
    var exEl = document.getElementById(pfx + '-is_exception');
    if (exEl) exEl.checked = !!opts.isException;

    if (opts.days) {
      var container = clone.querySelector('.multi-day-checkbox');
      if (container) {
        var cbs = container.querySelectorAll('input[type="checkbox"]');
        for (var ci = 0; ci < cbs.length; ci++) {
          cbs[ci].checked = opts.days.indexOf(cbs[ci].value) !== -1;
        }
      }
    }

    document.dispatchEvent(
      new CustomEvent('formset:added', {
        detail: { formsetName: PREFIX },
      })
    );
    return clone;
  }

  function markFormDeleted(formDiv) {
    var pfx = PREFIX + '-' + (formDiv.id || '').replace(PREFIX + '-', '');
    var del = document.getElementById('id_' + pfx + '-DELETE');
    if (del) del.checked = true;
  }

  /* ── Shared row-building helpers ────────────────────── */
  function buildPills(activeDays, onClick) {
    var pills = el('div', 'sched-pills');
    for (var di = 0; di < DAY_ORDER.length; di++) {
      var day = DAY_ORDER[di];
      var active = !!activeDays[day];
      var label = el(
        'label',
        'day-pill' + (active ? ' day-pill--checked' : '')
      );
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.className = 'day-pill__input';
      inp.value = day;
      if (active) inp.checked = true;
      label.appendChild(inp);
      label.appendChild(el('span', 'day-pill__label', DAY_SHORT[day]));
      label.addEventListener('click', onClick);
      pills.appendChild(label);
    }
    return pills;
  }

  function buildTimeInputs(startTime, endTime) {
    var box = el('div', 'sched-time');
    var sInput = document.createElement('input');
    sInput.type = 'time';
    sInput.value = startTime || '';
    var sep = el('span', 'sched-time__sep', '\u2013');
    var eInput = document.createElement('input');
    eInput.type = 'time';
    eInput.value = endTime || '';
    box.appendChild(sInput);
    box.appendChild(sep);
    box.appendChild(eInput);
    return { box: box, startInput: sInput, endInput: eInput };
  }

  function buildRemoveBtn(formDiv, row) {
    var btn = el('button', 'sched-row__remove', '\u00d7');
    btn.type = 'button';
    btn.title = 'Remove';
    btn.addEventListener('click', function () {
      markFormDeleted(formDiv);
      row.parentNode.removeChild(row);
    });
    return btn;
  }

  function buildTypeSelect(currentValue) {
    var sel = document.createElement('select');
    sel.className = 'sched-type-select';
    for (var i = 0; i < TYPE_OPTIONS.length; i++) {
      var opt = document.createElement('option');
      opt.value = TYPE_OPTIONS[i].value;
      opt.textContent = TYPE_OPTIONS[i].label;
      if (TYPE_OPTIONS[i].value === (currentValue || 'operating'))
        opt.selected = true;
      sel.appendChild(opt);
    }
    return sel;
  }

  /* ── Build flat rows ───────────────────────────────────
       ALL entries render as flat rows.
       Saved normals: grouped by (type, start, end).
       New normals: one row per form.
       Exceptions: one row each.
       ──────────────────────────────────────────────────── */
  function buildRows() {
    // Clean previous render
    var oldEls = schedGroup.querySelectorAll('.sched-row, .sched-add-buttons');
    for (var r = 0; r < oldEls.length; r++)
      oldEls[r].parentNode.removeChild(oldEls[r]);

    var allForms = schedGroup.querySelectorAll(
      '.inline-related:not(.empty-form)'
    );

    // Categorise forms
    var savedGroups = {}; // key -> {entries[], dayMap{}, first}
    var savedOrder = [];
    var savedExceptions = [];
    var newNormal = [];
    var newExceptions = [];

    for (var i = 0; i < allForms.length; i++) {
      var formDiv = allForms[i];
      var f = getFormFields(formDiv);
      if (f.isDeleted) continue;

      var isSaved = formDiv.classList.contains('has_original');
      // New forms with a single day set are "day additions" for saved groups
      var isDayAddition = !isSaved && !!f.day;

      if (f.isException) {
        if (isSaved) {
          savedExceptions.push({ formDiv: formDiv, fields: f });
        } else {
          newExceptions.push({ formDiv: formDiv, fields: f });
        }
      } else if (isSaved || isDayAddition) {
        var key = f.schedType + '|' + f.startTime + '|' + f.endTime;
        if (!savedGroups[key]) {
          savedGroups[key] = { entries: [], dayMap: {}, first: f };
          savedOrder.push(key);
        }
        savedGroups[key].entries.push({ formDiv: formDiv, fields: f });
        if (f.day) savedGroups[key].dayMap[f.day] = formDiv.id;
      } else {
        newNormal.push({ formDiv: formDiv, fields: f });
      }
    }

    // Find insert anchor
    var anchor =
      allForms.length > 0
        ? allForms[0]
        : schedGroup.querySelector('.empty-form');
    if (!anchor) return;

    // ─── Saved / grouped rows ──────────────────────────
    for (var k = 0; k < savedOrder.length; k++) {
      var g = savedGroups[savedOrder[k]];
      var first = g.first;
      var row = el('div', 'sched-row');

      // Type badge
      row.appendChild(
        el(
          'span',
          'sched-type-badge sched-type-badge--' + first.schedType,
          TYPE_LABELS[first.schedType] || first.schedType
        )
      );

      // Day pills
      var activeDays = {};
      for (var d in g.dayMap) activeDays[d] = true;

      var pillClick = (function (groupData, firstFields) {
        return function (e) {
          var pill = e.target.closest('.day-pill');
          if (!pill) return;
          var input = pill.querySelector('.day-pill__input');
          if (!input) return;
          e.preventDefault();
          e.stopPropagation();
          var wasChecked = pill.classList.contains('day-pill--checked');

          if (!wasChecked) {
            // Add day
            skipNextObserver = true;
            addNewInlineForm({
              schedType: firstFields.schedType,
              startTime: firstFields.startTime,
              endTime: firstFields.endTime,
              condition: firstFields.condition,
              demographic: firstFields.demographic,
              day: input.value,
            });
            pill.classList.add('day-pill--checked');
            input.checked = true;
          } else {
            // Remove day
            var fid = groupData.dayMap[input.value];
            if (fid) {
              var fd = document.getElementById(fid);
              if (fd) markFormDeleted(fd);
            }
            pill.classList.remove('day-pill--checked');
            input.checked = false;
          }
        };
      })(g, first);

      row.appendChild(buildPills(activeDays, pillClick));

      // Time inputs
      var time = buildTimeInputs(first.startTime, first.endTime);
      var syncTime = (function (entryList, si, ei) {
        return function () {
          for (var x = 0; x < entryList.length; x++) {
            setHiddenField(entryList[x].formDiv, 'start_time', si.value);
            setHiddenField(entryList[x].formDiv, 'end_time', ei.value);
          }
        };
      })(g.entries, time.startInput, time.endInput);
      time.startInput.addEventListener('change', syncTime);
      time.endInput.addEventListener('change', syncTime);
      row.appendChild(time.box);

      // Delete button — marks ALL entries in group as deleted
      var delBtn = (function (groupData, rowEl) {
        var btn = el('button', 'sched-row__remove', '\u00d7');
        btn.type = 'button';
        btn.title = 'Delete';
        btn.addEventListener('click', function () {
          for (var di = 0; di < groupData.entries.length; di++) {
            markFormDeleted(groupData.entries[di].formDiv);
          }
          rowEl.parentNode.removeChild(rowEl);
        });
        return btn;
      })(g, row);
      row.appendChild(delBtn);

      anchor.parentNode.insertBefore(row, anchor);
    }

    // ─── Saved exception rows ──────────────────────────
    for (var sei = 0; sei < savedExceptions.length; sei++) {
      var ex = savedExceptions[sei].fields;
      var exRow = el('div', 'sched-row sched-row--exception');

      exRow.appendChild(
        el(
          'span',
          'sched-type-badge',
          TYPE_LABELS[ex.schedType] || ex.schedType || 'Exception'
        )
      );

      var info = el('div', 'sched-exception-info');
      var sd = ex.startDate || '';
      var ed = ex.endDate || '';
      var dateStr =
        sd && ed && sd === ed
          ? sd
          : sd && ed
          ? sd + ' \u2013 ' + ed
          : sd || ed || '(no dates)';
      info.appendChild(el('span', 'sched-exception-info__dates', dateStr));

      var detail =
        ex.startTime && ex.endTime
          ? 'Closed ' + fmtTimeRange(ex.startTime, ex.endTime)
          : 'Closed all day';
      info.appendChild(
        el('span', 'sched-exception-info__detail', '\u2014 ' + detail)
      );

      if (ex.condition) {
        info.appendChild(
          el(
            'span',
            'sched-exception-info__tag',
            CONDITION_LABELS[ex.condition] || ex.condition
          )
        );
      }

      exRow.appendChild(info);

      // Delete button for saved exception
      var exDelBtn = (function (fd, rowEl) {
        var btn = el('button', 'sched-row__remove', '\u00d7');
        btn.type = 'button';
        btn.title = 'Delete';
        btn.addEventListener('click', function () {
          markFormDeleted(fd);
          rowEl.parentNode.removeChild(rowEl);
        });
        return btn;
      })(savedExceptions[sei].formDiv, exRow);
      exRow.appendChild(exDelBtn);

      anchor.parentNode.insertBefore(exRow, anchor);
    }

    // ─── New normal entry rows ─────────────────────────
    for (var ni = 0; ni < newNormal.length; ni++) {
      var nf = newNormal[ni];
      var nRow = el('div', 'sched-row sched-row--new');
      nRow.dataset.formId = nf.formDiv.id;

      // Type select
      var typeSelect = buildTypeSelect(nf.fields.schedType);
      var typeSync = (function (fd) {
        return function (e) {
          setHiddenField(fd, 'schedule_type', e.target.value);
        };
      })(nf.formDiv);
      typeSelect.addEventListener('change', typeSync);
      nRow.appendChild(typeSelect);

      // Day pills — read current state from hidden form
      var newActive = {};
      var dayContainer = nf.formDiv.querySelector('.multi-day-checkbox');
      if (dayContainer) {
        var checked = dayContainer.querySelectorAll(
          'input[type="checkbox"]:checked'
        );
        for (var ci = 0; ci < checked.length; ci++)
          newActive[checked[ci].value] = true;
      }

      var newPillClick = (function (fd) {
        return function (e) {
          var pill = e.target.closest('.day-pill');
          if (!pill) return;
          var input = pill.querySelector('.day-pill__input');
          if (!input) return;
          e.preventDefault();
          e.stopPropagation();
          input.checked = !input.checked;
          pill.classList.toggle('day-pill--checked', input.checked);
          // Sync to hidden form
          var allPills = pill.parentNode.querySelectorAll('.day-pill__input');
          var active = {};
          for (var p = 0; p < allPills.length; p++) {
            if (allPills[p].checked) active[allPills[p].value] = true;
          }
          syncDaysToForm(fd, active);
        };
      })(nf.formDiv);
      nRow.appendChild(buildPills(newActive, newPillClick));

      // Time inputs
      var nTime = buildTimeInputs(nf.fields.startTime, nf.fields.endTime);
      var nTimeSync = (function (fd, si, ei) {
        return function () {
          setHiddenField(fd, 'start_time', si.value);
          setHiddenField(fd, 'end_time', ei.value);
        };
      })(nf.formDiv, nTime.startInput, nTime.endInput);
      nTime.startInput.addEventListener('change', nTimeSync);
      nTime.endInput.addEventListener('change', nTimeSync);
      nRow.appendChild(nTime.box);

      // Remove button
      nRow.appendChild(buildRemoveBtn(nf.formDiv, nRow));

      anchor.parentNode.insertBefore(nRow, anchor);
    }

    // ─── New exception entry rows ──────────────────────
    for (var nxi = 0; nxi < newExceptions.length; nxi++) {
      var nxf = newExceptions[nxi];
      var nxRow = el('div', 'sched-row sched-row--new sched-row--exception');
      nxRow.dataset.formId = nxf.formDiv.id;

      // Type select
      var nxTypeSelect = buildTypeSelect(nxf.fields.schedType);
      var nxTypeSync = (function (fd) {
        return function (e) {
          setHiddenField(fd, 'schedule_type', e.target.value);
        };
      })(nxf.formDiv);
      nxTypeSelect.addEventListener('change', nxTypeSync);
      nxRow.appendChild(nxTypeSelect);

      // Exception fields: dates + condition
      var exFields = el('div', 'sched-exception-fields');

      var sdInput = document.createElement('input');
      sdInput.type = 'date';
      sdInput.value = nxf.fields.startDate || '';
      sdInput.addEventListener(
        'change',
        (function (fd) {
          return function (e) {
            setHiddenField(fd, 'start_date', e.target.value);
          };
        })(nxf.formDiv)
      );
      exFields.appendChild(sdInput);

      exFields.appendChild(el('span', 'sched-exception-fields__sep', '\u2013'));

      var edInput = document.createElement('input');
      edInput.type = 'date';
      edInput.value = nxf.fields.endDate || '';
      edInput.addEventListener(
        'change',
        (function (fd) {
          return function (e) {
            setHiddenField(fd, 'end_date', e.target.value);
          };
        })(nxf.formDiv)
      );
      exFields.appendChild(edInput);

      // Condition select
      var condSelect = document.createElement('select');
      for (var nxci = 0; nxci < CONDITION_OPTIONS.length; nxci++) {
        var cOpt = document.createElement('option');
        cOpt.value = CONDITION_OPTIONS[nxci].value;
        cOpt.textContent = CONDITION_OPTIONS[nxci].label;
        if (CONDITION_OPTIONS[nxci].value === nxf.fields.condition)
          cOpt.selected = true;
        condSelect.appendChild(cOpt);
      }
      condSelect.addEventListener(
        'change',
        (function (fd) {
          return function (e) {
            setHiddenField(fd, 'condition', e.target.value);
          };
        })(nxf.formDiv)
      );
      exFields.appendChild(condSelect);

      nxRow.appendChild(exFields);

      // Time inputs
      var nxTime = buildTimeInputs(nxf.fields.startTime, nxf.fields.endTime);
      var nxTimeSync = (function (fd, si, ei) {
        return function () {
          setHiddenField(fd, 'start_time', si.value);
          setHiddenField(fd, 'end_time', ei.value);
        };
      })(nxf.formDiv, nxTime.startInput, nxTime.endInput);
      nxTime.startInput.addEventListener('change', nxTimeSync);
      nxTime.endInput.addEventListener('change', nxTimeSync);
      nxRow.appendChild(nxTime.box);

      // Remove button
      nxRow.appendChild(buildRemoveBtn(nxf.formDiv, nxRow));

      anchor.parentNode.insertBefore(nxRow, anchor);
    }

    // ─── Add buttons ───────────────────────────────────
    // Hide Django's default "Add another" link
    var addRow = schedGroup.querySelector('.add-row');
    if (addRow) addRow.style.display = 'none';

    var btnRow = el('div', 'sched-add-buttons');

    var addBtn = el('button', 'sched-add-btn', '+ Add Schedule');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      addNewInlineForm({ schedType: 'operating' });
      fullUpdate();
    });
    btnRow.appendChild(addBtn);

    var addExBtn = el(
      'button',
      'sched-add-btn sched-add-btn--exception',
      '+ Add Exception'
    );
    addExBtn.type = 'button';
    addExBtn.addEventListener('click', function () {
      addNewInlineForm({ schedType: 'operating', isException: true });
      fullUpdate();
    });
    btnRow.appendChild(addExBtn);

    var insertPoint = addRow || schedGroup.querySelector('.empty-form') || null;
    if (insertPoint) {
      insertPoint.parentNode.insertBefore(btnRow, insertPoint);
    } else {
      schedGroup.appendChild(btnRow);
    }
  }

  /* ── Master update ─────────────────────────────────── */
  var updating = false;
  var observer = null;

  function fullUpdate() {
    if (updating) return;
    updating = true;
    if (observer) observer.disconnect();

    buildRows();

    if (observer && schedGroup) {
      observer.observe(schedGroup, { childList: true, subtree: true });
    }
    updating = false;
  }

  fullUpdate();

  observer = new MutationObserver(function (mutations) {
    if (skipNextObserver) {
      skipNextObserver = false;
      return;
    }
    var dominated = false;
    for (var m = 0; m < mutations.length; m++) {
      for (var n = 0; n < mutations[m].addedNodes.length; n++) {
        var node = mutations[m].addedNodes[n];
        if (
          node.nodeType === 1 &&
          node.classList &&
          node.classList.contains('inline-related')
        ) {
          dominated = true;
        }
      }
    }
    if (dominated) fullUpdate();
  });
  observer.observe(schedGroup, { childList: true, subtree: true });
})();
