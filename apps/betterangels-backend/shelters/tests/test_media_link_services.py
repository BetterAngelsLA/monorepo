from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.test import TestCase
from model_bakery import baker
from strawberry import UNSET

from accounts.models import OrganizationProfile, OrgTypeChoices
from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from shelters.enums import MediaLinkTypeChoices
from shelters.groups import SHELTER_OPERATOR
from shelters.models import MediaLink
from shelters.services.media_link import media_link_create, media_link_delete, media_link_update
from shelters.tests.baker_recipes import shelter_recipe

YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
OTHER_YOUTUBE_URL = "https://youtu.be/aBcDeFgHiJk"
NOT_A_YOUTUBE_URL = "https://example.com/video"


class MediaLinkServiceTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.org, self.other_org = organization_recipe.make(
            _quantity=2, preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,)
        )
        OrganizationProfile.objects.update_or_create(
            organization=self.org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        OrganizationProfile.objects.update_or_create(
            organization=self.other_org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        self.user = baker.make(User)
        self.org.users.add(self.user)
        self.other_user = baker.make(User)
        self.other_org.users.add(self.other_user)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.other_shelter = shelter_recipe.make(organization=self.other_org)
        OrgRoleManager(self.org).add_roles(self.user, SHELTER_OPERATOR)
        OrgRoleManager(self.other_org).add_roles(self.other_user, SHELTER_OPERATOR)


class MediaLinkCreateTestCase(MediaLinkServiceTestCase):
    def test_creates_media_link_with_scalar_fields(self) -> None:
        media_link = media_link_create(
            user=self.user,
            data={
                "shelter_id": self.shelter.pk,
                "url": YOUTUBE_URL,
                "title": "Walkthrough",
                "media_type": MediaLinkTypeChoices.YOUTUBE,
            },
        )

        self.assertEqual(media_link.shelter_id, self.shelter.pk)
        self.assertEqual(media_link.url, YOUTUBE_URL)
        self.assertEqual(media_link.title, "Walkthrough")
        self.assertEqual(media_link.media_type, MediaLinkTypeChoices.YOUTUBE)
        self.assertTrue(MediaLink.objects.filter(pk=media_link.pk).exists())

    def test_omitted_title_defaults_to_blank(self) -> None:
        media_link = media_link_create(
            user=self.user,
            data={"shelter_id": self.shelter.pk, "url": YOUTUBE_URL, "media_type": MediaLinkTypeChoices.YOUTUBE},
        )

        self.assertEqual(media_link.title, "")

    def test_omitted_media_type_defaults_to_youtube(self) -> None:
        media_link = media_link_create(
            user=self.user,
            data={"shelter_id": self.shelter.pk, "url": YOUTUBE_URL},
        )

        self.assertEqual(media_link.media_type, MediaLinkTypeChoices.YOUTUBE)

    def test_url_invalid_for_media_type_raises_validation_error(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            media_link_create(
                user=self.user,
                data={"shelter_id": self.shelter.pk, "url": NOT_A_YOUTUBE_URL},
            )

        self.assertIn("url", ctx.exception.message_dict)
        self.assertEqual(MediaLink.objects.count(), 0)

    def test_shelter_in_another_org_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            media_link_create(
                user=self.user,
                data={"shelter_id": self.other_shelter.pk, "url": YOUTUBE_URL},
            )

        self.assertEqual(MediaLink.objects.count(), 0)

    def test_missing_shelter_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            media_link_create(user=self.user, data={"shelter_id": 999999, "url": YOUTUBE_URL})


class MediaLinkUpdateTestCase(MediaLinkServiceTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.media_link = baker.make(
            MediaLink, shelter=self.shelter, url=YOUTUBE_URL, title="Old title", media_type=MediaLinkTypeChoices.YOUTUBE
        )

    def test_updates_provided_fields(self) -> None:
        media_link_update(
            user=self.user,
            data={"id": self.media_link.pk, "url": OTHER_YOUTUBE_URL, "title": "New title"},
        )

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, OTHER_YOUTUBE_URL)
        self.assertEqual(self.media_link.title, "New title")

    def test_omitted_fields_are_untouched(self) -> None:
        media_link_update(user=self.user, data={"id": self.media_link.pk, "title": "New title"})

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.title, "New title")
        self.assertEqual(self.media_link.url, YOUTUBE_URL)
        self.assertEqual(self.media_link.media_type, MediaLinkTypeChoices.YOUTUBE)

    def test_unset_values_are_skipped(self) -> None:
        media_link_update(
            user=self.user,
            data={"id": self.media_link.pk, "url": UNSET, "title": UNSET, "media_type": UNSET},
        )

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, YOUTUBE_URL)
        self.assertEqual(self.media_link.title, "Old title")
        self.assertEqual(self.media_link.media_type, MediaLinkTypeChoices.YOUTUBE)

    def test_url_none_raises_validation_error(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            media_link_update(user=self.user, data={"id": self.media_link.pk, "url": None})

        self.assertIn("url", ctx.exception.message_dict)
        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, YOUTUBE_URL)

    def test_url_invalid_for_media_type_raises_validation_error(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            media_link_update(user=self.user, data={"id": self.media_link.pk, "url": NOT_A_YOUTUBE_URL})

        self.assertIn("url", ctx.exception.message_dict)
        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, YOUTUBE_URL)

    def test_media_link_in_another_org_raises_object_does_not_exist(self) -> None:
        other_link = baker.make(MediaLink, shelter=self.other_shelter, url=YOUTUBE_URL)

        with self.assertRaises(ObjectDoesNotExist):
            media_link_update(user=self.user, data={"id": other_link.pk, "url": OTHER_YOUTUBE_URL})

        other_link.refresh_from_db()
        self.assertEqual(other_link.url, YOUTUBE_URL)

    def test_missing_media_link_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            media_link_update(user=self.user, data={"id": 999999, "url": OTHER_YOUTUBE_URL})


class MediaLinkDeleteTestCase(MediaLinkServiceTestCase):
    def test_deletes_single_media_link(self) -> None:
        media_link = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        other_link = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        deleted_ids = media_link_delete(user=self.user, ids=[media_link.pk])

        self.assertEqual(deleted_ids, [media_link.pk])
        self.assertFalse(MediaLink.objects.filter(pk=media_link.pk).exists())
        self.assertTrue(MediaLink.objects.filter(pk=other_link.pk).exists())

    def test_deletes_multiple_media_links(self) -> None:
        media_links = [
            baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL),
            baker.make(MediaLink, shelter=self.shelter, url=OTHER_YOUTUBE_URL),
        ]
        ids = [media_link.pk for media_link in media_links]

        deleted_ids = media_link_delete(user=self.user, ids=ids)

        self.assertCountEqual(deleted_ids, ids)
        self.assertFalse(MediaLink.objects.filter(pk__in=ids).exists())

    def test_empty_id_list_deletes_nothing(self) -> None:
        media_link = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        self.assertEqual(media_link_delete(user=self.user, ids=[]), [])
        self.assertTrue(MediaLink.objects.filter(pk=media_link.pk).exists())

    def test_media_link_in_another_org_raises_object_does_not_exist(self) -> None:
        other_link = baker.make(MediaLink, shelter=self.other_shelter, url=YOUTUBE_URL)

        with self.assertRaises(ObjectDoesNotExist):
            media_link_delete(user=self.user, ids=[other_link.pk])

        self.assertTrue(MediaLink.objects.filter(pk=other_link.pk).exists())

    def test_partially_unresolvable_ids_delete_nothing(self) -> None:
        media_link = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        other_link = baker.make(MediaLink, shelter=self.other_shelter, url=YOUTUBE_URL)

        with self.assertRaises(ObjectDoesNotExist):
            media_link_delete(user=self.user, ids=[media_link.pk, other_link.pk])

        self.assertTrue(MediaLink.objects.filter(pk__in=[media_link.pk, other_link.pk]).exists())
