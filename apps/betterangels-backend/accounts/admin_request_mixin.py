# mypy: ignore-errors
class AdminRequestMixin:
    """
    Mixin to make the request object available in Django admin forms.
    """

    def get_form(self, request, obj=None, change=False, **kwargs):
        Form = super().get_form(request, obj, **kwargs)

        class AdminFormWithRequest(Form):
            def __new__(cls, *args, **kwargs):
                kwargs["request"] = request
                return Form(*args, **kwargs)

        return AdminFormWithRequest
