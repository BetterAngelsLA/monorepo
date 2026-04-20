from unittest.mock import Mock, patch

from common.imgproxy import IMGPROXY_SWITCH
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, override_settings
from shelters.enums import StatusChoices
from shelters.models import ExteriorPhoto, InteriorPhoto, Shelter
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.graphql_helpers import ShelterGraphQLFixtureMixin
from test_utils.mixins import GraphQLTestCaseMixin
from waffle.testutils import override_switch


@override_settings(IS_LOCAL_DEV=True)
@override_switch(IMGPROXY_SWITCH, active=True)
class ShelterHeroImageRegressionTestCase(ShelterGraphQLFixtureMixin, GraphQLTestCaseMixin, TestCase):
    """Regression tests for the hero_image resolver.

    The original implementation used ``self.hero_image`` which called the
    *resolver method* recursively rather than accessing the model's
    ``GenericForeignKey``.  Additionally, a broken ``GenericForeignKey``
    (e.g. content-type pointing to a deleted model) would cause an
    unhandled ``AttributeError`` (``'NoneType' object has no attribute
    '_base_manager'``), crashing the entire shelters query.
    """

    HERO_IMAGE_QUERY = """
        query ViewShelters {
            shelters {
                totalCount
                results {
                    id
                    heroImage
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.setup_shelter_graphql_fixtures()

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_returns_gfk_url_when_set(self, mock_build_imgproxy_url: Mock) -> None:
        """hero_image should return the GFK photo URL when ``hero_image``
        points to a valid ExteriorPhoto or InteriorPhoto."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        for photo_model in (ExteriorPhoto, InteriorPhoto):
            with self.subTest(photo_model=photo_model.__name__):
                shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
                photo = photo_model.objects.create(shelter=shelter, file=self.file)

                ct = ContentType.objects.get_for_model(photo_model)
                Shelter.objects.filter(pk=shelter.pk).update(
                    hero_image_content_type=ct,
                    hero_image_object_id=photo.pk,
                )

                response = self.execute_graphql(self.HERO_IMAGE_QUERY)
                results = response["data"]["shelters"]["results"]
                hero_images = {r["id"]: r["heroImage"] for r in results}
                self.assertIn(photo.file.name, hero_images[str(shelter.pk)])

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_falls_back_to_exterior_photo(self, mock_build_imgproxy_url: Mock) -> None:
        """When no GFK hero_image is set, fall back to the first exterior
        photo."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        exterior = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"], exterior.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_falls_back_to_interior_photo(self, mock_build_imgproxy_url: Mock) -> None:
        """When no GFK hero_image or exterior photo exists, fall back to an
        interior photo."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        interior = InteriorPhoto.objects.create(shelter=shelter, file=self.file)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"], interior.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_returns_none_when_no_photos(self, mock_build_imgproxy_url: Mock) -> None:
        """heroImage should be None when neither GFK nor fallback photos
        exist."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter_recipe.make(status=StatusChoices.APPROVED)

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0]["heroImage"])

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_with_orphaned_gfk_object_id(self, mock_build_imgproxy_url: Mock) -> None:
        """Regression: when hero_image_content_type/object_id point to a
        deleted object, the resolver must not crash."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        photo = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)

        ct = ContentType.objects.get_for_model(ExteriorPhoto)
        Shelter.objects.filter(pk=shelter.pk).update(
            hero_image_content_type=ct,
            hero_image_object_id=photo.pk,
        )
        # Delete the photo so the GFK points to a non-existent object
        photo.delete()

        # Create a fallback photo
        fallback = InteriorPhoto.objects.create(
            shelter=shelter,
            file=self.make_test_image_file(name="fallback.jpg"),
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        # Should fall back to the interior photo
        self.assertEqual(results[0]["heroImage"], fallback.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_with_mismatched_content_type(self, mock_build_imgproxy_url: Mock) -> None:
        """Regression: when hero_image_content_type points to a valid
        ContentType but the object_id does not exist for that model,
        the resolver must not crash."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        exterior = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)

        # Point to InteriorPhoto content type but with the ExteriorPhoto's pk
        # (which doesn't exist in interior_photo table)
        ct = ContentType.objects.get_for_model(InteriorPhoto)
        Shelter.objects.filter(pk=shelter.pk).update(
            hero_image_content_type=ct,
            hero_image_object_id=99999,
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        # GFK returns None (object doesn't exist), should fall back
        self.assertEqual(results[0]["heroImage"], exterior.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_with_null_gfk_fields(self, mock_build_imgproxy_url: Mock) -> None:
        """When hero_image_content_type and hero_image_object_id are both
        None, the GFK returns None and fallback kicks in."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        exterior = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)

        # Explicitly null out both GFK fields
        Shelter.objects.filter(pk=shelter.pk).update(
            hero_image_content_type=None,
            hero_image_object_id=None,
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["heroImage"], exterior.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_multiple_shelters_mixed_states(self, mock_build_imgproxy_url: Mock) -> None:
        """Multiple shelters with different hero_image states should all
        resolve without errors and return the correct heroImage per shelter."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        ct = ContentType.objects.get_for_model(ExteriorPhoto)

        # Shelter 1: Valid GFK → explicit hero image
        s1 = shelter_recipe.make(status=StatusChoices.APPROVED)
        p1 = ExteriorPhoto.objects.create(shelter=s1, file=self.file)
        Shelter.objects.filter(pk=s1.pk).update(
            hero_image_content_type=ct,
            hero_image_object_id=p1.pk,
        )

        # Shelter 2: No photos at all → None
        s2 = shelter_recipe.make(status=StatusChoices.APPROVED)

        # Shelter 3: Orphaned GFK (deleted object) with interior fallback
        s3 = shelter_recipe.make(status=StatusChoices.APPROVED)
        orphan_photo = ExteriorPhoto.objects.create(
            shelter=s3,
            file=self.make_test_image_file(name="orphan.jpg"),
        )
        Shelter.objects.filter(pk=s3.pk).update(
            hero_image_content_type=ct,
            hero_image_object_id=orphan_photo.pk,
        )
        orphan_photo.delete()
        fallback = InteriorPhoto.objects.create(
            shelter=s3,
            file=self.make_test_image_file(name="fallback3.jpg"),
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 3)

        hero_images = {int(r["id"]): r["heroImage"] for r in results}
        self.assertIn(p1.file.name, hero_images[s1.pk])
        self.assertIsNone(hero_images[s2.pk])
        self.assertEqual(hero_images[s3.pk], fallback.file.url)

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_hero_image_with_stale_content_type(self, mock_build_imgproxy_url: Mock) -> None:
        """Regression: when hero_image_content_type points to a ContentType
        whose model_class() returns None (e.g. the model was removed), the
        resolver must not crash with "'NoneType' object has no attribute
        '_base_manager'"."""
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        fallback = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)

        # Create a ContentType that doesn't map to any installed model
        stale_ct = ContentType.objects.create(app_label="deleted_app", model="deletedmodel")
        Shelter.objects.filter(pk=shelter.pk).update(
            hero_image_content_type=stale_ct,
            hero_image_object_id=1,
        )

        response = self.execute_graphql(self.HERO_IMAGE_QUERY)
        self.assertNotIn("errors", response)
        results = response["data"]["shelters"]["results"]
        self.assertEqual(len(results), 1)
        # Should fall back to the exterior photo
        self.assertEqual(results[0]["heroImage"], fallback.file.url)
