from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0012_clientprofile_hmis_id.py"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="clientprofile",
            name="hmis_id",
        ),
    ]
