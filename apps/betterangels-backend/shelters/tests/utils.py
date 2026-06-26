from accounts.models import OrganizationProfile, OrgTypeChoices, User
from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker

from shelters.groups import SHELTER_OPERATOR


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

        self.reservation_fields = """
            id
            status
            startDate
            duration
            notes
            bed { id }
            room { id }
            shelter { id }
            clients {
                id
                isPrimary
                clientProfile {
                    firstName
                    middleName
                    lastName
                    nickname
                }
            }
        """

    def setup_org_with_user(self) -> None:
        self.org = organization_recipe.make(
            name="Shelter Org",
            preset_names=["shelter"],
            owner_roles=(SHELTER_OPERATOR,),
        )
        OrganizationProfile.objects.update_or_create(
            organization=self.org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        self.operator = baker.make(User)
        self.org.users.add(self.operator)
        self._set_active_org(self.org)
        OrgRoleManager(self.org).add_roles(self.operator, SHELTER_OPERATOR)
