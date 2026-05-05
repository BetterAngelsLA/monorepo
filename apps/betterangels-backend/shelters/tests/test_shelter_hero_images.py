from unittest.mock import Mock, patch

from common.imgproxy import IMGPROXY_SWITCH
from django.test import TestCase, override_settings
from shelters.enums import ShelterPhotoTypeChoices, StatusChoices
from shelters.models import ShelterPhoto
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.graphql_helpers import ShelterGraphQLFixtureMixin
from test_utils.mixins import GraphQLTestCaseMixin
from waffle.testutils import override_switch


@override_settings(IS_LOCAL_DEV=True, STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}})
@override_switch(IMGPROXY_SWITCH, active=True)
class ShelterHeroImageRegressionTestCase(ShelterGraphQLFixtureMixin, GraphQLTestCaseMixin, TestCase):
    """Regression tests for the ``heroImage`` GraphQL field.

    The resolver uses the shelter's ``hero_image`` foreign key when set, then
    falls back to the first exterior photo, then the first interior photo.
    """

    HERO_IMAGE_QUERY = """
        query ViewShelters {
            shelters {
                totalCount
                results {
                    id
                    heroImage {
                        id
                        url
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.setup_shelter_graphql_fixtures()

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_returns_explicit_fk_url_when_set(self, mock_build_imgproxy_url: Mock) -> None:
        """``heroImage`` should use the ID of the ``ShelterPhoto`` when set."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        for ptype in (ShelterPhotoTypeChoices.EXTERIOR, ShelterPhotoTypeChoices.INTERIOR):
            with self.subTest(photo_type=ptype):
                shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
                photo = ShelterPhoto.objects.create(shelter=shelter, file=self.file, type=ptype)
                shelter.hero_image = photo
                shelter.save(update_fields=["hero_image"])

                response = self.execute_graphql(self.HERO_IMAGE_QUERY)
                results = response["data"]["shelters"]["results"]
                hero_images = {r["id"]: r["heroImage"]["id"] for r in results}
                self.assertEqual(str(photo.pk), hero_images[str(shelter.pk)])

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_falls_back_to_exterior_photo(self, mock_build_imgproxy_url: Mock) -> None:
        """When ``hero_image`` is unset, use the first exterior photo."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        exterior = ShelterPhoto.objects.create(shelter=shelter, file=self.file, type=ShelterPhotoTypeChoices.EXTERIOR)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"]["id"], str(exterior.pk))

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_falls_back_to_interior_photo(self, mock_build_imgproxy_url: Mock) -> None:
        """When there is no hero FK and no exterior photos, use the first interior photo."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        interior = ShelterPhoto.objects.create(shelter=shelter, file=self.file, type=ShelterPhotoTypeChoices.INTERIOR)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"]["id"], str(interior.pk))

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_returns_none_when_no_photos(self, mock_build_imgproxy_url: Mock) -> None:
        """``heroImage`` is None when there is no hero FK and no gallery photos."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter_recipe.make(status=StatusChoices.APPROVED)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0]["heroImage"])

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_after_hero_photo_deleted_uses_fallback(self, mock_build_imgproxy_url: Mock) -> None:
        """If the explicit hero ``ShelterPhoto`` is deleted, ``hero_image`` is cleared (SET_NULL) and
        the resolver falls back to remaining photos."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        hero = ShelterPhoto.objects.create(shelter=shelter, file=self.file, type=ShelterPhotoTypeChoices.EXTERIOR)
        shelter.hero_image = hero
        shelter.save(update_fields=["hero_image"])
        hero.delete()
        shelter.refresh_from_db()
        self.assertIsNone(shelter.hero_image_id)

        fallback = ShelterPhoto.objects.create(
            shelter=shelter,
            file=self.make_test_image_file(name="fallback.jpg"),
            type=ShelterPhotoTypeChoices.INTERIOR,
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"]["id"], str(fallback.pk))

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_with_null_hero_fk_uses_exterior(self, mock_build_imgproxy_url: Mock) -> None:
        """When ``hero_image`` is null, the first exterior photo is used."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        exterior = ShelterPhoto.objects.create(shelter=shelter, file=self.file, type=ShelterPhotoTypeChoices.EXTERIOR)
        self.assertIsNone(shelter.hero_image_id)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"]["id"], str(exterior.pk))

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_multiple_shelters_mixed_states(self, mock_build_imgproxy_url: Mock) -> None:
        """Multiple shelters with different hero states resolve without errors."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )

        s1 = shelter_recipe.make(status=StatusChoices.APPROVED)
        p1 = ShelterPhoto.objects.create(shelter=s1, file=self.file, type=ShelterPhotoTypeChoices.EXTERIOR)
        s1.hero_image = p1
        s1.save(update_fields=["hero_image"])

        s2 = shelter_recipe.make(status=StatusChoices.APPROVED)

        s3 = shelter_recipe.make(status=StatusChoices.APPROVED)
        orphan = ShelterPhoto.objects.create(
            shelter=s3,
            file=self.make_test_image_file(name="orphan.jpg"),
            type=ShelterPhotoTypeChoices.EXTERIOR,
        )
        s3.hero_image = orphan
        s3.save(update_fields=["hero_image"])
        orphan.delete()
        s3.refresh_from_db()
        fallback = ShelterPhoto.objects.create(
            shelter=s3,
            file=self.make_test_image_file(name="fallback3.jpg"),
            type=ShelterPhotoTypeChoices.INTERIOR,
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 3)

        hero_images = {int(r["id"]): r["heroImage"]["id"] if r["heroImage"] else None for r in results}
        self.assertEqual(hero_images[s1.pk], str(p1.pk))
        self.assertIsNone(hero_images[s2.pk])
        self.assertEqual(hero_images[s3.pk], str(fallback.pk))
