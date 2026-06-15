(function () {
  "use strict";

  /**
   * Dynamically filter permission_template checkboxes based on the
   * selected organization.  Reads the org→templates mapping from a
   * data-org-templates attribute embedded on the widget container.
   */
  document.addEventListener("DOMContentLoaded", function () {
    var orgSelect = document.querySelector("#id_organization");
    var widgetContainer = document.querySelector("#id_permission_templates");

    if (!orgSelect || !widgetContainer) return;

    var allCheckboxes = widgetContainer.querySelectorAll('input[type="checkbox"]');
    if (!allCheckboxes.length) return;

    var orgTemplates;
    try {
      orgTemplates = JSON.parse(widgetContainer.getAttribute("data-org-templates") || "{}");
    } catch (e) {
      return;
    }

    function filterTemplates() {
      var selectedOrgId = orgSelect.value;
      var allowed = orgTemplates[selectedOrgId] || [];
      var allowedSet = new Set(allowed);

      allCheckboxes.forEach(function (cb) {
        var row = cb.closest("label, div");
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
