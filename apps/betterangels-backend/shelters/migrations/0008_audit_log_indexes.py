"""Read indexes for the audit log's event tables (ADR 0004 §10, §15).

75 btree indexes: a composite `(parent_fk, pgh_id)` for every FK branch the
`references()` CTE unions, `(pgh_obj, pgh_id)` where the model has a `pgh_obj`,
and a plain `pgh_created_at` for retention/cursor scans.

**Why one ordinary (atomic) migration is correct here.** The event tables are
young and small: at the time of writing every `shelters_*event` table held
single-digit rows outside production. A non-atomic wrapper buys nothing when the
`CREATE INDEX` scans take milliseconds, and `AddIndexConcurrently` additionally
leaves an *invalid* index behind on failure instead of rolling back. The
project's precedent is the same trade-off, made explicitly after measuring
([regions/migrations/0005](../../regions/migrations/0005_region_geom_display_index.py)).

The cost when it is *not* small: Django wraps all 75 `AddIndex` operations in one
transaction, and each `CREATE INDEX` takes a `SHARE` lock that blocks writes (not
reads) for the remainder of the migration. Re-measure before deploying against a
large dataset; roughly 1M rows in any event table is when each btree build starts
costing seconds and the whole migration turns into a write-blocking window. At
that point split this into per-table migrations using `AddIndexConcurrently` with
`atomic = False`, and note that a failed concurrent build must be cleaned up by
dropping and re-running.
"""

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0002_initial'),
        ('organizations', '0006_alter_organization_slug'),
        ('pghistory', '0007_auto_20250421_0444'),
        ('shelters', '0007_reservation_update_requires_status_unchanged'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddIndex(
            model_name='bedevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='bed_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='bedevent',
            index=models.Index(fields=['room', 'pgh_id'], name='bed_evt_room_idx'),
        ),
        migrations.AddIndex(
            model_name='bedevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='contactinfoevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='contactinfo_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='contactinfoevent',
            index=models.Index(fields=['pgh_created_at'], name='contactinfo_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='medialinkevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='medialink_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='medialinkevent',
            index=models.Index(fields=['pgh_created_at'], name='medialink_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='reservationclientevent',
            index=models.Index(fields=['reservation', 'pgh_id'], name='resclient_evt_res_idx'),
        ),
        migrations.AddIndex(
            model_name='reservationclientevent',
            index=models.Index(fields=['pgh_created_at'], name='resclient_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='reservationevent',
            index=models.Index(fields=['room', 'pgh_id'], name='reservation_evt_room_idx'),
        ),
        migrations.AddIndex(
            model_name='reservationevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='reservation_evt_bed_idx'),
        ),
        migrations.AddIndex(
            model_name='reservationevent',
            index=models.Index(fields=['pgh_created_at'], name='reservation_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='roomevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='room_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='roomevent',
            index=models.Index(fields=['pgh_created_at'], name='room_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='scheduleevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='schedule_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='scheduleevent',
            index=models.Index(fields=['pgh_created_at'], name='schedule_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='shelteravailabilityevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelteravail_evt_shltr_idx'),
        ),
        migrations.AddIndex(
            model_name='shelteravailabilityevent',
            index=models.Index(fields=['pgh_created_at'], name='shelteravail_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='shelterevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='shelterphotoevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelterphoto_evt_shltr_idx'),
        ),
        migrations.AddIndex(
            model_name='shelterphotoevent',
            index=models.Index(fields=['pgh_created_at'], name='shelterphoto_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedaccessibilityevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_acc_808de3_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedaccessibilityevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_acc_808de3_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedaccessibilityevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='bed_accessibility_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedaccessibilityevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_accessibility_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbeddemographicevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='bed_demographic_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbeddemographicevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_demographic_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedfunderevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='bed_funder_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedfunderevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_funder_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedmedicalneedevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='bed_medical_need_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedmedicalneedevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_medical_need_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedpetevent',
            index=models.Index(fields=['bed', 'pgh_id'], name='bed_pet_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedbedpetevent',
            index=models.Index(fields=['pgh_created_at'], name='bed_pet_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedcityevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_city_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedcityevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_city_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackeddemographicevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_dem_6eb347_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackeddemographicevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_dem_6eb347_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedentryrequirementevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_ent_98d52c_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedentryrequirementevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_ent_98d52c_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedexitpolicyevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_exi_8dc131_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedexitpolicyevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_exi_8dc131_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedfunderevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_funder_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedfunderevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_funder_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedparkingevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_parking_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedparkingevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_parking_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedpetevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_pet_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedpetevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_pet_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedreferralrequirementevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_ref_6b7d4f_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedreferralrequirementevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_ref_6b7d4f_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomaccessibilityevent',
            index=models.Index(fields=['room', 'pgh_id'], name='room_accessibility_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomaccessibilityevent',
            index=models.Index(fields=['pgh_created_at'], name='room_accessibility_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomdemographicevent',
            index=models.Index(fields=['room', 'pgh_id'], name='room_demographic_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomdemographicevent',
            index=models.Index(fields=['pgh_created_at'], name='room_demographic_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomfunderevent',
            index=models.Index(fields=['room', 'pgh_id'], name='room_funder_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomfunderevent',
            index=models.Index(fields=['pgh_created_at'], name='room_funder_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroompetevent',
            index=models.Index(fields=['room', 'pgh_id'], name='room_pet_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroompetevent',
            index=models.Index(fields=['pgh_created_at'], name='room_pet_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomstyleevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_room_style_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedroomstyleevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_room_style_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedserviceevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_service_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedserviceevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_service_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedshelterprogramevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_program_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedshelterprogramevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_program_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedsheltertypeevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_she_83d7f6_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedsheltertypeevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_she_83d7f6_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedspaevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_spa_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedspaevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_spa_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedspecialsituationrestrictionevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_spe_1fd81c_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedspecialsituationrestrictionevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_spe_1fd81c_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedstorageevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_storage_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedstorageevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_storage_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedvaccinationrequirementevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='shelter_vac_e1d568_evt_fk_idx'),
        ),
        migrations.AddIndex(
            model_name='trackedvaccinationrequirementevent',
            index=models.Index(fields=['pgh_created_at'], name='shelter_vac_e1d568_evt_ca_idx'),
        ),
        migrations.AddIndex(
            model_name='videoevent',
            index=models.Index(fields=['shelter', 'pgh_id'], name='video_evt_shelter_idx'),
        ),
        migrations.AddIndex(
            model_name='videoevent',
            index=models.Index(fields=['pgh_created_at'], name='video_evt_ca_idx'),
        ),
    ]
