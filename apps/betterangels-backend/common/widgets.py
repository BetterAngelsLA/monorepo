from django import forms


class CheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    template_name = "admin/widgets/checkbox_select.html"


class CustomManyToManyField(forms.ModelMultipleChoiceField):
    widget = CheckboxSelectMultiple
