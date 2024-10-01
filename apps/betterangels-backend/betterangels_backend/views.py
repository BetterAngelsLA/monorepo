from typing import Any

import formset.renderers.default  # ignore : type
from django.views.generic.edit import CreateView, FormMixin  # ignore : type
from formset.views import (  # ignore : type
    FileUploadMixin,
    FormCollectionViewMixin,
    FormViewMixin,
)


class FormsetModelFormView(FileUploadMixin, FormViewMixin, CreateView):
    template_name = "formset_modelform.html"
    extra_context = {"click_actions": "disable -> submit -> reload !~ scrollToError"}

    @property
    def framework(self) -> Any:
        return self.request.resolver_match.app_name

    @property
    def mode(self) -> Any:
        if self.request.resolver_match.url_name:
            return self.request.resolver_match.url_name.split(".")[-1]
        return ""

    def get_context_data(self, **kwargs) -> Any:
        context_data = super().get_context_data(**kwargs)
        if self.framework != "default":
            context_data.update(framework=self.framework)
        if isinstance(self, FormCollectionViewMixin):
            holder_class = self.collection_class
        else:
            holder_class = self.form_class
        context_data.update(
            leaf_name=holder_class.__name__,
            valid_formset_data=self.request.session.get("valid_formset_data"),
        )
        self.request.session.pop("valid_formset_data", None)
        return context_data

    def get_form_class(self) -> Any:
        form_class = super().get_form_class()
        if issubclass(form_class, FormMixin):
            return form_class
        # attrs = self.get_css_classes()
        # attrs.pop("button_css_classes", None)
        renderer_class = formset.renderers.default.FormRenderer
        if self.mode != "native":
            renderer = renderer_class()
            form_class = type(form_class.__name__, (FormMixin, form_class), {"default_renderer": renderer})
        return form_class
