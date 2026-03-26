(function () {
  function getJQuery() {
    return (window.django && window.django.jQuery) || window.jQuery || window.$;
  }

  function removeTemporaryOption(jq, $select, rawValue) {
    $select.find('option').each(function () {
      if (String(jq(this).attr('value') || '') === rawValue) {
        jq(this).remove();
      }
    });

    var currentValues = ($select.val() || []).filter(function (value) {
      return value !== rawValue;
    });
    $select.val(currentValues).trigger('change');
  }

  function createPendingService(jq, categoryId, value) {
    var trimmedValue = String(value || '').trim();
    if (!trimmedValue) {
      return false;
    }

    var $list = jq(
      '.grouped-service-pending-list[data-category-id="' + categoryId + '"]'
    );
    if (!$list.length) {
      return false;
    }

    var duplicate = false;
    var $otherSelect = jq(
      '.grouped-service-select[data-category-id="' +
        categoryId +
        '"][data-role="other"]'
    );

    $otherSelect.find('option').each(function () {
      var optionValue = String(jq(this).attr('value') || '');
      // Skip transient Select2 tag options — they are not real duplicates.
      if (optionValue.indexOf('__new__:') === 0) {
        return undefined;
      }

      if (
        String(jq(this).text() || '')
          .trim()
          .toLowerCase() === trimmedValue.toLowerCase()
      ) {
        duplicate = true;
        return false;
      }
      return undefined;
    });

    $list.find('.grouped-service-hidden-input').each(function () {
      var existingValue = String(jq(this).val() || '');
      var existingParts = existingValue.split('::');
      var existingDisplay = existingParts.slice(1).join('::');
      if (existingDisplay.trim().toLowerCase() === trimmedValue.toLowerCase()) {
        duplicate = true;
        return false;
      }
      return undefined;
    });

    if (duplicate) {
      return false;
    }

    var hiddenInputName = String(
      $list.closest('.grouped-service-widget').data('new-input-name') ||
        'services__new'
    );
    var $item = jq('<div class="grouped-service-pending-item"></div>');
    var $label = jq('<span></span>').text(trimmedValue);
    var $remove = jq(
      '<button type="button" class="grouped-service-pending-remove" aria-label="Remove service">&times;</button>'
    );
    var $hidden = jq(
      '<input type="hidden" class="grouped-service-hidden-input">'
    );
    $hidden.attr('name', hiddenInputName);
    $hidden.val(categoryId + '::' + trimmedValue);

    $item.append($label, $remove, $hidden);
    $list.append($item);
    return true;
  }

  function initializeSelects(jq) {
    jq('.grouped-service-select').each(function () {
      var $el = jq(this);
      if ($el.data('select2')) {
        return;
      }

      var allowCreate = Boolean($el.data('allow-create'));

      $el.select2({
        placeholder: $el.data('placeholder'),
        allowClear: true,
        width: '100%',
        tags: allowCreate,
        createTag: allowCreate
          ? function (params) {
              var term = String(params.term || '').trim();
              if (!term) {
                return null;
              }

              var duplicate = false;
              $el.find('option').each(function () {
                if (
                  String(jq(this).text() || '')
                    .trim()
                    .toLowerCase() === term.toLowerCase()
                ) {
                  duplicate = true;
                  return false;
                }
                return undefined;
              });

              if (duplicate) {
                return null;
              }

              return {
                id: '__new__:' + $el.data('category-id') + '::' + term,
                text: term,
                newTag: true,
              };
            }
          : undefined,
        insertTag: allowCreate
          ? function (data, tag) {
              data.push(tag);
            }
          : undefined,
      });

      if (allowCreate) {
        $el.on('select2:select', function (event) {
          var selected = event.params && event.params.data;
          if (!selected || !selected.newTag || !selected.id) {
            return;
          }

          var rawValue = String(selected.id);
          var payload = rawValue.replace(/^__new__:/, '');
          var separatorIndex = payload.indexOf('::');
          var categoryId =
            separatorIndex >= 0 ? payload.slice(0, separatorIndex) : '';
          var displayName =
            separatorIndex >= 0 ? payload.slice(separatorIndex + 2) : '';

          createPendingService(jq, categoryId, displayName);
          removeTemporaryOption(jq, $el, rawValue);
        });
      }
    });
  }

  function bindSearchFieldEnterHandling(jq) {
    jq(document)
      .off('keydown.groupedServiceEnter', '.select2-search__field')
      .on(
        'keydown.groupedServiceEnter',
        '.select2-search__field',
        function (event) {
          if (event.key !== 'Enter') {
            return;
          }

          var $searchField = jq(this);
          var $select = $searchField
            .closest('.select2-container')
            .prev('.grouped-service-select[data-role="other"]');

          if (!$select.length) {
            return;
          }

          event.stopPropagation();
        }
      );
  }

  function bindPendingRemoval(jq) {
    jq(document)
      .off('click.groupedServiceRemove', '.grouped-service-pending-remove')
      .on(
        'click.groupedServiceRemove',
        '.grouped-service-pending-remove',
        function () {
          jq(this).closest('.grouped-service-pending-item').remove();
        }
      );
  }

  function initGroupedServiceSelect2() {
    var jq = getJQuery();
    if (!jq || !jq.fn.select2) {
      setTimeout(initGroupedServiceSelect2, 200);
      return;
    }

    initializeSelects(jq);
    bindSearchFieldEnterHandling(jq);
    bindPendingRemoval(jq);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupedServiceSelect2);
  } else {
    setTimeout(initGroupedServiceSelect2, 100);
  }
})();
