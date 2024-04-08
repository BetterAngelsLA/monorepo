from django import forms
from .widgets import LatLongField
from .models import Location


class LocationAdminForm(forms.ModelForm):
    class Meta:
        model = Location
        fields = '__all__'
    point = LatLongField()
