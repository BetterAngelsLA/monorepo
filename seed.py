"""Seed interactions and the login accounts for the local run."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","betterangels_backend.settings"); django.setup()
from django.db import connection
from guardian.shortcuts import assign_perm
from accounts.models import User
from notes.models import Note
from organizations.models import Organization
from regions.selectors import ensure_location_regions

org = Organization.objects.first()
with connection.cursor() as c:
    c.execute("""INSERT INTO common_location (created_at, updated_at, point, point_of_interest)
      SELECT now(), now(), ST_SetSRID(ST_MakePoint(-118.6+random()*0.65, 33.70+random()*0.65),4326)::geography, false
      FROM generate_series(1,3000)""")
    c.execute("""INSERT INTO notes_note (created_at, updated_at, interacted_at, organization_id, location_id,
                  purpose, is_submitted, private_details, public_details)
      SELECT now(), now(), now()-(random()*20)*interval '1 day', %s, id, 'meeting', false, '', ''
      FROM common_location""", [org.id])

user, _ = User.objects.get_or_create(email="mapsuper@example.com", defaults={"username": "mapsuper"})
user.set_password("mapsuper12345"); user.is_staff = True; user.is_superuser = True; user.save()
if not org.users.filter(pk=user.pk).exists():
    org.add_user(user)
for note in Note.objects.all():
    assign_perm("notes.view_note", user, note)

print(f"  org {org.id} | {ensure_location_regions(force=True)} assignments | {Note.objects.count()} notes")
