# Add ``instagram_handle`` to Shelter and its pghistory event table.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shelters', '0002_shelter_schedule_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='shelter',
            name='instagram_handle',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='shelterevent',
            name='instagram_handle',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
