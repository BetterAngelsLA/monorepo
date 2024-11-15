(function ($) {
  $(document).ready(function () {
    console.log('Dynamic fields script loaded.');

    // Function to toggle visibility and required status of dependent "other" fields
    function toggleDependentFields() {
      console.log('Toggling dependent fields...');

      $('select[multiple]').each(function () {
        const $mainField = $(this);
        const mainFieldId = $mainField.attr('id');

        if (!mainFieldId) {
          console.warn('Field without an ID found. Skipping.');
          return;
        }

        const dependentFieldClass = `.field-${mainFieldId.replace(
          'id_',
          ''
        )}_other`;
        const $dependentWrapper = $(dependentFieldClass);

        if ($dependentWrapper.length === 0) {
          console.warn(`No dependent field wrapper found for: ${mainFieldId}`);
          return;
        }

        console.debug(
          `Dependent field wrapper detected: ${dependentFieldClass}`
        );

        // Check if "other" is selected in the main field
        const selectedValues = $mainField.val() || [];
        console.debug(`Selected values for ${mainFieldId}:`, selectedValues);

        if (selectedValues.includes('other')) {
          console.info(
            `"other" selected in ${mainFieldId}. Showing dependent field.`
          );
          $dependentWrapper.show();
          $dependentWrapper
            .find('input, textarea, select')
            .prop('required', true);
        } else {
          console.info(
            `"other" not selected in ${mainFieldId}. Hiding dependent field.`
          );
          $dependentWrapper.hide();
          $dependentWrapper
            .find('input, textarea, select')
            .prop('required', false)
            .val('');
        }
      });
    }

    function bindFieldEvents() {
      console.log('Binding change events for multi-select fields...');
      $('select[multiple]').each(function () {
        const $mainField = $(this);
        const mainFieldId = $mainField.attr('id');

        if (!mainFieldId) {
          console.warn('Field without an ID found. Skipping binding.');
          return;
        }

        if (!$mainField.data('dynamic-bound')) {
          console.debug(`Binding change event to: ${mainFieldId}`);
          $mainField.change(toggleDependentFields);
          $mainField.data('dynamic-bound', true);
        } else {
          console.debug(
            `Change event already bound to: ${mainFieldId}. Skipping.`
          );
        }
      });
    }

    // Monitor for dynamically added fields using MutationObserver
    const observer = new MutationObserver(() => {
      console.log(
        'Mutation detected. Re-binding events and toggling fields...'
      );
      bindFieldEvents();
      toggleDependentFields();
    });

    // Observe the admin form for changes
    const adminForm = document.querySelector('#content');
    if (adminForm) {
      console.log('Admin form detected. Starting MutationObserver...');
      observer.observe(adminForm, { childList: true, subtree: true });
    } else {
      console.error(
        'Admin form container (#content) not found. Dynamic behavior may not work.'
      );
    }

    // Initial setup
    console.log('Initial setup: Binding events and toggling fields...');
    bindFieldEvents();
    toggleDependentFields();
  });
})(django.jQuery);
