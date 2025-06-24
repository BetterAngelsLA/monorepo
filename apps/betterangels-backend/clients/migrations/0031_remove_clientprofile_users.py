from django.db import migrations


def remove_clientprofile_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    db_alias = schema_editor.connection.alias
    User.objects.using(db_alias).filter(is_superuser=False, is_staff=False, groups=None).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0030_remove_clientprofile_client_profile_add_insert_and_more"),
    ]

    operations = [
        migrations.RunPython(remove_clientprofile_users),
    ]
