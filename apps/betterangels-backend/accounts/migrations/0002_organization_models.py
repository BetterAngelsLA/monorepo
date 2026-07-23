# Manually split from 0001_initial to break circular dependency
# with django-organizations (swappable_dependency on AUTH_USER_MODEL).
#
# WHY THIS EXISTS
# ===============
# ``organizations.0001_initial`` has a ``swappable_dependency`` on
# ``AUTH_USER_MODEL`` (accounts.User).  If accounts.0001_initial also
# depended on organizations (for FK fields), the migration graph would
# contain an unresolvable cycle:
#
#   accounts.0001 → organizations.0001 → accounts.0001
#
# This file breaks the cycle by moving every model that references
# ``organizations.*`` out of 0001_initial into this separate migration.
#
# HOW TO MAINTAIN IT
# ===================
# If you add a new model (or field/index/constraint) to ``accounts`` that
# depends on ``organizations.Organization``, ``organizations.OrganizationInvitation``,
# or any other model from the ``django-organizations`` package, add it to
# THIS migration (``0002_organization_models``) — NOT to ``0001_initial``.
#
# Similarly, if you add a ``migrations.AddIndex``, ``migrations.AlterUniqueTogether``,
# or other operation that references an org-dependent model, put it here.

import annoying.fields
import django.contrib.postgres.fields
import django.contrib.postgres.indexes
import django.db.models.deletion
import django_choices_field.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    replaces = []
    dependencies = [
        ('accounts', '0001_initial'),
        ('organizations', '0004_organizationinvitation'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExtendedOrganizationInvitation',
            fields=[
                ('accepted', models.BooleanField(default=False)),
                ('organization_invitation', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, related_name='extended_invitation', serialize=False, to='organizations.organizationinvitation')),
            ],
            options={
                'verbose_name': 'Organization Invitation',
                'verbose_name_plural': 'Organization Invitations',
            },
            bases=('organizations.organizationinvitation',),
        ),

        migrations.CreateModel(
            name='OrganizationProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('org_types', django.contrib.postgres.fields.ArrayField(base_field=django_choices_field.fields.TextChoicesField(choices=[('outreach', 'Outreach'), ('shelter', 'Shelter')], max_length=8), blank=True, default=list)),
                ('organization', annoying.fields.AutoOneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='organizations.organization')),
            ],
        ),

        migrations.CreateModel(
            name='PermissionGroupTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('permissions', models.ManyToManyField(blank=True, to='auth.permission')),
            ],
        ),

        migrations.CreateModel(
            name='PermissionGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=255)),
                ('group', models.OneToOneField(blank=True, on_delete=django.db.models.deletion.CASCADE, to='auth.group')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permission_groups', to='organizations.organization')),
                ('template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.permissiongrouptemplate')),
            ],
        ),

        migrations.AddIndex(
            model_name='organizationprofile',
            index=django.contrib.postgres.indexes.GinIndex(fields=['org_types'], name='accounts_or_org_typ_797994_gin'),
        ),

        migrations.AlterUniqueTogether(
            name='permissiongroup',
            unique_together={('organization', 'group'), ('organization', 'template')},
        ),

    ]
