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

    replaces = [
        ("accounts", "0002_alter_user_is_active_alter_user_is_staff"),
        ("accounts", "0003_user_date_joined_user_first_name_user_last_name_and_more"),
        ("accounts", "0004_historicaluser"),
        ("accounts", "0005_extendedorganizationinvitation"),
        ("accounts", "0006_biguserobjectpermission_biggroupobjectpermission"),
        ("accounts", "0007_add_caseworker_role"),
        ("accounts", "0008_permissiongrouptemplate_permissiongroup"),
        ("accounts", "0009_alter_permissiongroup_group_and_more"),
        ("accounts", "0010_userevent_remove_historicaluser_history_user_and_more"),
        ("accounts", "0011_client_clientprofile"),
        ("accounts", "0012_clientprofile_hmis_id"),
        ("accounts", "0013_clientuserobjectpermission_and_more"),
        ("accounts", "0014_casemanager_client_permissions"),
        ("accounts", "0015_alter_clientprofile_hmis_id_alter_user_first_name_and_more"),
        ("accounts", "0016_alter_clientprofile_hmis_id"),
        ("accounts", "0017_client_profile_permissions"),
        ("accounts", "0018_alter_clientgroupobjectpermission_unique_together_and_more"),
        ("accounts", "0019_clientprofile_date_of_birth_clientprofile_gender_and_more"),
        ("accounts", "0020_alter_clientprofile_gender_and_more"),
        ("accounts", "0021_clientprofile_address_clientprofile_nickname_and_more"),
        ("accounts", "0022_alter_clientprofile_spoken_languages"),
        ("accounts", "0023_alter_clientprofile_gender"),
        ("accounts", "0024_remove_user_user_add_insert_and_more"),
        ("accounts", "0025_alter_clientprofile_gender"),
        ("accounts", "0026_alter_user_email_alter_user_username_and_more"),
        ("accounts", "0027_hmisprofile_hmisprofile_unique_hmis_id_agency"),
        ("accounts", "0028_clientcontact"),
        ("accounts", "0029_clienthouseholdmember"),
        ("accounts", "0030_remove_user_user_add_insert_and_more"),
        ("accounts", "0031_clientcontact_demo_fields"),
        ("accounts", "0032_clientprofile_clear_pronouns"),
        ("accounts", "0033_alter_clientcontact_phone_number_and_more"),
        ("accounts", "0034_clientprofile_clientcontact_clear_phonenumber"),
        ("accounts", "0035_clientprofile_living_situation_and_profile_photo"),
        ("accounts", "0036_alter_clientprofile_options"),
        ("accounts", "0037_remove_client_specific_models"),
        ("accounts", "0038_alter_userevent_id"),
        ("accounts", "0039_create_org_admin_templates"),
        ("accounts", "0040_update_org_admin_permissions"),
        ("accounts", "0041_update_org_admin_permissions_view_members"),
        ("accounts", "0042_add_missing_permissiongroups"),
        ("accounts", "0043_user_is_hmis_user"),
        ("accounts", "0044_remove_user_is_hmis_user"),
        ("accounts", "0045_add_view_reports_permission"),
        ("accounts", "0046_add_organization_profile"),
        ("accounts", "0048_add_shelter_operator_template"),
        ("accounts", "0049_cleanup_caseworker_template_permissions"),
        ("accounts", "0050_backfill_organization_profiles"),
        ("accounts", "0051_alter_permissiongroup_unique_together"),
    ]

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
