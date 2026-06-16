from accounts.models import OrganizationProfile, OrgTypeChoices, PermissionGroup, PermissionGroupTemplate, User
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from model_bakery import baker
from shelters.groups import SHELTER_OPERATOR
from shelters.models import Bed, Room, Shelter

SHELTER_OPERATOR_PERMISSIONS = (
    (Bed, "add_bed"),
    (Bed, "change_bed"),
    (Bed, "delete_bed"),
    (Bed, "view_bed"),
    (Room, "add_room"),
    (Room, "change_room"),
    (Room, "delete_room"),
    (Room, "view_room"),
    (Shelter, "add_shelter"),
    (Shelter, "change_shelter"),
    (Shelter, "delete_shelter"),
    (Shelter, "view_shelter"),
)


class ShelterTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_org_with_user()

        self.room_fields = """
            id
            amenities
            lastCleanedInspected
            maintenanceFlag
            medicalRespite
            name
            notes
            status
            storage
            type
            typeOther
            accessibility { name }
            demographics { name }
            funders { name }
            pets { name }
            shelter { id }
        """

        self.bed_fields = """
            id
            b7
            fees
            lastCleanedInspected
            maintenanceFlag
            name
            status
            statusNotes
            storage
            type
            accessibility { name }
            demographics { name }
            funders { name }
            medicalNeeds { name }
            pets { name }
            room { id }
            shelter { id }
        """

    def setup_org_with_user(self) -> None:
        self.org = organization_recipe.make(name="Shelter Org")
        OrganizationProfile.objects.update_or_create(
            organization=self.org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        self.operator = baker.make(User)
        self.org.users.add(self.operator)
        self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"] = str(self.org.id)
        # TODO: temporary solution until operator template implemented. See: SDB-178
        self.grant_operator_permissions(self.operator)

    def grant_operator_permissions(self, user: User) -> None:
        pgt, _ = PermissionGroupTemplate.objects.get_or_create(name=SHELTER_OPERATOR.name)
        pg, _ = PermissionGroup.objects.get_or_create(organization=self.org, template=pgt)
        user.groups.add(pg.group)

        for model, codename in SHELTER_OPERATOR_PERMISSIONS:
            content_type = ContentType.objects.get_for_model(model)
            permission = Permission.objects.get(content_type=content_type, codename=codename)
            pg.group.permissions.add(permission)
