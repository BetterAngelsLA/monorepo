from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0031_remove_clientprofile_client_profile_add_insert_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="ssn",
            field=models.CharField(blank=True, db_index=True, max_length=9, null=True),
        ),
    ]
