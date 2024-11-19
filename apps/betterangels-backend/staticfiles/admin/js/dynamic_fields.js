(function ($) {
  $(document).ready(function () {
    console.log('Dynamic fields script initialized.');

    /**
     * Toggles visibility and required status of dependent "other" fields.
     *
     * - For each multi-select field (`<select multiple>`):
     *   - If the "other" option is selected:
     *     - Show the associated `_other` field.
     *     - Set the `_other` field as required.
     *   - If the "other" option is not selected:
     *     - Hide the `_other` field.
     *     - Remove its `required` status and clear its value.
     */
    function toggleDependentFields() {
      $('select[multiple]').each(function () {
        const $mainField = $(this);
        const mainFieldId = $mainField.attr('id');

        if (!mainFieldId) return;

        const dependentSelector = `.field-${mainFieldId.replace(
          'id_',
          ''
        )}_other`;
        const $dependentWrapper = $(dependentSelector);

        if (!$dependentWrapper.length) return;

        const selectedValues = $mainField.val() || [];
        const showDependent = selectedValues.includes('other');

        if (showDependent) {
          $dependentWrapper.show();
          $dependentWrapper
            .find('input, textarea, select')
            .prop('required', true);
        } else {
          $dependentWrapper.hide();
          $dependentWrapper
            .find('input, textarea, select')
            .prop('required', false)
            .val('');
        }
      });
    }

    // Bind change events to fields
    function bindFieldEvents() {
      $('select[multiple]').each(function () {
        const $mainField = $(this);
        if (!$mainField.data('dynamic-bound')) {
          $mainField.change(toggleDependentFields);
          $mainField.data('dynamic-bound', true);
        }
      });
    }

    // Observe changes in the admin form for dynamically added fields
    const observer = new MutationObserver(() => {
      bindFieldEvents();
      toggleDependentFields();
    });

    const adminForm = document.querySelector('#content');
    if (adminForm) {
      observer.observe(adminForm, { childList: true, subtree: true });
    } else {
      console.error('Admin form container (#content) not found.');
    }

    // Initial setup
    bindFieldEvents();
    toggleDependentFields();
  });
})(django.jQuery);
