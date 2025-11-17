from typing import Any, Dict

from common.tests.utils import GraphQLBaseTestCase


class HmisClientProfileBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.hmis_client_profile_fields = """
            hmisId
            personalId
            uniqueIdentifier
            addedDate
            lastUpdated

            alias
            birthDate
            dobQuality
            firstName
            lastName
            nameQuality
            ssn1
            ssn2
            ssn3
            ssnQuality

            age
            gender
            genderIdentityText
            nameMiddle
            nameSuffix
            raceEthnicity
            additionalRaceEthnicityDetail
            veteran

            adaAccommodation
            address
            californiaId
            email
            eyeColor
            hairColor
            heightInInches
            importantNotes
            livingSituation
            mailingAddress
            maritalStatus
            phoneNumbers { id number isPrimary }
            physicalDescription
            placeOfBirth
            preferredCommunication
            preferredLanguage
            profilePhoto { name }
            pronouns
            pronounsOther
            residenceAddress
            residenceGeolocation
            spokenLanguages

            createdBy { id }
        """

    def _create_hmis_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_client_profile_fixture("create", variables)

    def _update_hmis_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_client_profile_fixture("update", variables)

    def _create_or_update_hmis_client_profile_fixture(
        self, operation: str, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation ($data: {operation.capitalize()}HmisClientProfileInput!) {{ # noqa: B950
                {operation}HmisClientProfile(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on HmisClientProfileType {{
                        {self.hmis_client_profile_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
