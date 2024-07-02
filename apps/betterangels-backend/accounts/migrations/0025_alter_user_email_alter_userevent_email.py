# Generated by Django 5.0.6 on 2024-07-02 16:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0024_remove_user_user_add_insert_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="userevent",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
