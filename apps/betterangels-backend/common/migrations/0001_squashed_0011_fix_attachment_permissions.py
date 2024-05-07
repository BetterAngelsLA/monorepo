# Generated by Django 5.0.5 on 2024-05-07 17:56

import common.enums
from common.permissions.enums import AttachmentPermissions
import common.utils
import django.contrib.gis.db.models.fields
import django.db.models.deletion
import django_choices_field.fields
from django.conf import settings
from django.db import migrations, models


# Functions from the following migrations need manual copying.
# Move them and any dependencies into this file, then update the
# RunPython operations to refer to the local versions:
# common.migrations.0005_fix_attachment_permission
# common.migrations.0006_address_and_address_permissions
# common.migrations.0010_location_and_location_permissions
# common.migrations.0011_fix_attachment_permissions

# common.migrations.0001_initial
# REMOVED

# common.migrations.0004_attachment_attachmentgroupobjectpermission_and_more
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " task" for perm in AttachmentPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Attachment = apps.get_model("common", "Attachment")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": AttachmentContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            AttachmentPermissions.ADD,
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.add(*permissions)


def revert_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            AttachmentPermissions.ADD,
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


# common.migrations.0005_fix_attachment_permission
def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    # Remove mistaken permission
    PostOfficeAttachment = apps.get_model("post_office", "Attachment")
    PostOfficeAttachmentContentType = ContentType.objects.get_for_model(PostOfficeAttachment)
    perms_to_remove = caseworker_template.permissions.filter(content_type=PostOfficeAttachmentContentType)
    caseworker_template.permissions.remove(*perms_to_remove)

    # Add actual Permission
    CommonAttachment = apps.get_model("common", "Attachment")
    AttachmentContentType = ContentType.objects.get_for_model(CommonAttachment)

    perm_map = [
        perm.split(".")[1]
        for perm in [
            AttachmentPermissions.ADD,
        ]
    ]

    permissions = Permission.objects.filter(content_type=AttachmentContentType, codename__in=perm_map)
    caseworker_template.permissions.add(*permissions)

# common.migrations.0006_address_and_address_permissions
PERMISSIONS_TO_ADD = [
    AddressPermissions.ADD,
    AddressPermissions.VIEW,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " address" for perm in AddressPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Address = apps.get_model("common", "Address")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    AddressContentType = ContentType.objects.get_for_model(Address)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": AddressContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_address",
            "common.view_address",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.add(*permissions)


def revert_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_address",
            "common.view_address",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


# common.migrations.0010_location_and_location_permissions
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " location" for perm in LocationPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Location = apps.get_model("common", "Location")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    LocationContentType = ContentType.objects.get_for_model(Location)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name},
            content_type=LocationContentType,
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_location",
            "common.view_location",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.add(*permissions)


def revert_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_location",
            "common.view_location",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


# common.migrations.0011_fix_attachment_permissions
def rename_attachment_permissions(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Permission = apps.get_model("auth", "Permission")
    Attachment = apps.get_model("common", "Attachment")
    ContentType = apps.get_model("contenttypes", "ContentType")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)

    PERM_MAP = {perm.split(".")[1]: perm.label for perm in AttachmentPermissions}

    for codename, name in PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).get(
            codename=codename,
            content_type=AttachmentContentType,
        )
        cur_perm.name = name
        cur_perm.save()


def rename_client_permissions(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Permission = apps.get_model("auth", "Permission")
    Client = apps.get_model("accounts", "Client")
    ContentType = apps.get_model("contenttypes", "ContentType")
    ClientContentType = ContentType.objects.get_for_model(Client)

    PERM_MAP = {perm.split(".")[1]: perm.label for perm in ClientPermissions}

    for codename, name in PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).get(
            codename=codename,
            content_type=ClientContentType,
        )
        cur_perm.name = name
        cur_perm.save()


class Migration(migrations.Migration):

    replaces = [('common', '0001_initial'), ('common', '0002_add_location'), ('common', '0003_alter_location_point'), ('common', '0004_attachment_attachmentgroupobjectpermission_and_more'), ('common', '0005_fix_attachment_permission'), ('common', '0006_address_and_address_permissions'), ('common', '0007_delete_location_and_more'), ('common', '0008_location'), ('common', '0009_locationuserobjectpermission_and_more'), ('common', '0010_location_and_location_permissions'), ('common', '0011_fix_attachment_permissions')]

    initial = True

    dependencies = [
        ('accounts', '0007_add_caseworker_role'),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('contenttypes', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        ('notes', '0005_alter_note_options_note_organization_and_more'),
        ('notes', '0018_add_point_to_note_and_task'),
        ('post_office', '0011_models_help_text'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SimpleModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
            ],
        ),
        migrations.RunPython(
            code=common.migrations.0001_initial.create_permissions_if_not_exist,
        ),
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('point', django.contrib.gis.db.models.fields.PointField(geography=True, srid=4326)),
                ('address', models.CharField(blank=True, max_length=255)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('state', models.CharField(blank=True, max_length=100)),
                ('zip_code', models.CharField(blank=True, max_length=50)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Attachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('file', models.FileField(upload_to=common.utils.get_unique_file_path)),
                ('attachment_type', django_choices_field.fields.TextChoicesField(choices=[('image', 'Image'), ('document', 'Document'), ('audio', 'Audio'), ('video', 'Video'), ('unknown', 'Unknown')], choices_enum=common.enums.AttachmentType, max_length=8)),
                ('original_filename', models.CharField(blank=True, max_length=255, null=True)),
                ('object_id', models.PositiveIntegerField()),
                ('namespace', models.CharField(blank=True, max_length=255, null=True)),
                ('associated_with', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='associated_attachments', to=settings.AUTH_USER_MODEL)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_attachments', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='AttachmentGroupObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.attachment')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.group')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission')),
            ],
            options={
                'abstract': False,
                'unique_together': {('group', 'permission', 'content_object')},
            },
        ),
        migrations.CreateModel(
            name='AttachmentUserObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.attachment')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
                'unique_together': {('user', 'permission', 'content_object')},
            },
        ),
        migrations.CreateModel(
            name='SimpleModelGroupObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SimpleModelUserObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.RunPython(
            code=common.migrations.0004_attachment_attachmentgroupobjectpermission_and_more.delete_simple_model_permissions,
        ),
        migrations.DeleteModel(
            name='SimpleModel',
        ),
        migrations.DeleteModel(
            name='SimpleModelGroupObjectPermission',
        ),
        migrations.DeleteModel(
            name='SimpleModelUserObjectPermission',
        ),
        migrations.AddIndex(
            model_name='attachment',
            index=models.Index(fields=['object_id', 'content_type_id', 'namespace', 'attachment_type'], name='attachment_comp_idx'),
        ),
        migrations.RunPython(
            code=common.migrations.0004_attachment_attachmentgroupobjectpermission_and_more.create_permissions_if_not_exist,
        ),
        migrations.RunPython(
            code=common.migrations.0004_attachment_attachmentgroupobjectpermission_and_more.update_caseworker_permission_template,
            reverse_code=common.migrations.0004_attachment_attachmentgroupobjectpermission_and_more.revert_caseworker_permission_template,
        ),
        migrations.RunPython(
            code=common.migrations.0005_fix_attachment_permission.update_caseworker_permission_template,
        ),
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('street', models.CharField(blank=True, max_length=255, null=True)),
                ('city', models.CharField(blank=True, max_length=100, null=True)),
                ('state', models.CharField(blank=True, max_length=100, null=True)),
                ('zip_code', models.CharField(blank=True, max_length=10, null=True)),
                ('address_components', models.JSONField(blank=True, null=True)),
                ('formatted_address', models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AddressGroupObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AddressUserObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.RunPython(
            code=common.migrations.0006_address_and_address_permissions.create_permissions_if_not_exist,
        ),
        migrations.RunPython(
            code=common.migrations.0006_address_and_address_permissions.update_caseworker_permission_template,
            reverse_code=common.migrations.0006_address_and_address_permissions.revert_caseworker_permission_template,
        ),
        migrations.DeleteModel(
            name='Location',
        ),
        migrations.AddField(
            model_name='addressuserobjectpermission',
            name='content_object',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.address'),
        ),
        migrations.AddField(
            model_name='addressuserobjectpermission',
            name='permission',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission'),
        ),
        migrations.AddField(
            model_name='addressuserobjectpermission',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='addressgroupobjectpermission',
            name='content_object',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.address'),
        ),
        migrations.AddField(
            model_name='addressgroupobjectpermission',
            name='group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.group'),
        ),
        migrations.AddField(
            model_name='addressgroupobjectpermission',
            name='permission',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission'),
        ),
        migrations.AddIndex(
            model_name='address',
            index=models.Index(fields=['street', 'city', 'state', 'zip_code', 'address_components', 'formatted_address'], name='address_index'),
        ),
        migrations.AlterUniqueTogether(
            name='addressuserobjectpermission',
            unique_together={('user', 'permission', 'content_object')},
        ),
        migrations.AlterUniqueTogether(
            name='addressgroupobjectpermission',
            unique_together={('group', 'permission', 'content_object')},
        ),
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('point', django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, srid=4326)),
                ('point_of_interest', models.CharField(blank=True, max_length=255, null=True)),
                ('address', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='common.address')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LocationUserObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.location')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
                'unique_together': {('user', 'permission', 'content_object')},
            },
        ),
        migrations.CreateModel(
            name='LocationGroupObjectPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.location')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.group')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.permission')),
            ],
            options={
                'abstract': False,
                'unique_together': {('group', 'permission', 'content_object')},
            },
        ),
        migrations.RunPython(
            code=common.migrations.0010_location_and_location_permissions.create_permissions_if_not_exist,
        ),
        migrations.RunPython(
            code=common.migrations.0010_location_and_location_permissions.update_caseworker_permission_template,
            reverse_code=common.migrations.0010_location_and_location_permissions.revert_caseworker_permission_template,
        ),
        migrations.RunPython(
            code=common.migrations.0011_fix_attachment_permissions.rename_attachment_permissions,
        ),
        migrations.RunPython(
            code=common.migrations.0011_fix_attachment_permissions.rename_client_permissions,
        ),
    ]
