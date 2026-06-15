(function () {
  "use strict";

  /**
   * Dynamically filter permission_template checkboxes based on the
   * selected organization.  Reads the mapping from a data-org-templates
   * attribute on the permission_templates widget.
   */
  document.addEventListener("DOMContentLoaded", function () {
    var orgSelect = document.querySelector("#id_organization");
    var templateField = document.querySelector(
      ".field-permission_templates .checkbox-select-multiple, #id_permission_templates"
    );

    if (!orgSelect || !templateField) return;

    var widgetContainer = templateField.closest(".field-permission_templates");
    if (!widgetContainer) return;

    // The mapping is embedded on the checkboxes container.
    var allCheckboxes = widgetContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    if (!allCheckboxes.length) return;

    var mappingEl = allCheckboxes[0];
    var orgTemplates;
    try {
      orgTemplates = JSON.parse(mappingEl.getAttribute("data-org-templates") || "{}");
    } catch (e) {
      return;
    }

    function filterTemplates() {
      var selectedOrgId = orgSelect.value;
      var allowed = orgTemplates[selectedOrgId] || [];
      var allowedSet = new Set(allowed);

      allCheckboxes.forEach(function (cb) {
        var row = cb.closest("li, label");
        if (!row) return;
        if (allowedSet.has(cb.value)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
          cb.checked = false;
        }
      });
    }

    orgSelect.addEventListener("change", filterTemplates);
    // Run once on load in case an org is pre-selected.
    filterTemplates();
  });
})();