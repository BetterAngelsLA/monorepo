# Generated by Django 4.2.9 on 2024-02-15 19:52

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("accounts", "0009_alter_permissiongroup_group_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="permissiongroup",
            name="group",
            field=models.OneToOneField(
                blank=True, on_delete=django.db.models.deletion.CASCADE, to="auth.group"
            ),
        ),
    ]
