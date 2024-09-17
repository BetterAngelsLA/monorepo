from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0036_alter_clientprofile_options"),
    ]

    database_operations = [
        migrations.AlterModelTable("ClientProfile", "clients_clientprofile"),
        migrations.AlterModelTable("ClientHouseholdMember", "clients_clienthouseholdmember"),
        migrations.AlterModelTable("ClientContact", "clients_clientcontact"),
        migrations.AlterModelTable("HmisProfile", "clients_hmisprofile"),
    ]

    state_operations = [
        migrations.DeleteModel(name="ClientProfile"),
        migrations.DeleteModel(name="ClientHouseholdMember"),
        migrations.DeleteModel(name="ClientContact"),
        migrations.DeleteModel(name="HmisProfile"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=database_operations,
            state_operations=state_operations,
        )
    ]
