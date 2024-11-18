from django.db import migrations

def add_show_delete_modal_flag(apps, schema_editor):
    Flag = apps.get_model("waffle", "Flag")
    flag, _ = Flag.objects.get_or_create(name="show_delete_modal", defaults={"everyone": True})
    if not flag.everyone:
        flag.everyone = True
        flag.save()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0039_add_show_delete_modal'),  # Replace with the correct dependency
    ]

    operations = [
        migrations.RunPython(add_show_delete_modal_flag),
    ]
