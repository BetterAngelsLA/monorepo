from django.core.files.uploadedfile import SimpleUploadedFile

TEST_IMAGE_CONTENT = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04\x01\x0a\x00"
    b"\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
)


SHELTER_FIELDS = """
    id
    addNotesShelterDetails
    addNotesSleepingDetails
    bedFees
    cityCouncilDistrict
    curfew
    demographicsOther
    description
    distanceInMiles
    email
    emergencySurge
    entryInfo
    exitPolicyOther
    fundersOther
    maxStay
    name
    onSiteSecurity
    otherRules
    otherServices
    overallRating
    phone
    programFees
    roomStylesOther
    shelterProgramsOther
    shelterTypesOther
    status
    subjectiveReview
    supervisorialDistrict
    totalBeds
    visitorsAllowed
    website
    accessibility {name}
    city {id name}
    citiesServed {id name}
    demographics {name}
    entryRequirements {name}
    exitPolicy {name}
    referralRequirement {name}
    funders {name}
    parking {name}
    pets {name}
    roomStyles {name}
    services {
        name
        displayName
        category {
            name
            displayName
        }
    }
    shelterPrograms {name}
    shelterTypes {name}
    spa {name}
    spasServed {name}
    specialSituationRestrictions {name}
    storage {name}
    additionalContacts {
        id
        contactName
        contactNumber
    }
    location {
        latitude
        longitude
        place
    }
    organization {
        id
        name
    }
    updatedAt
"""


class ShelterGraphQLFixtureMixin:
    shelter_fields = SHELTER_FIELDS
    file_content = TEST_IMAGE_CONTENT

    def setup_shelter_graphql_fixtures(self) -> None:
        self.file = self.make_test_image_file()

    def make_test_image_file(self, name: str = "file.jpg") -> SimpleUploadedFile:
        return SimpleUploadedFile(name=name, content=self.file_content)
