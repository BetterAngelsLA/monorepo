from organizations.abstract import AbstractOrganization as AbstractOrganization, AbstractOrganizationInvitation as AbstractOrganizationInvitation, AbstractOrganizationOwner as AbstractOrganizationOwner, AbstractOrganizationUser as AbstractOrganizationUser

class Organization(AbstractOrganization):
    class Meta(AbstractOrganization.Meta):
        abstract: bool

class OrganizationUser(AbstractOrganizationUser):
    class Meta(AbstractOrganizationUser.Meta):
        abstract: bool

class OrganizationOwner(AbstractOrganizationOwner):
    class Meta(AbstractOrganizationOwner.Meta):
        abstract: bool

class OrganizationInvitation(AbstractOrganizationInvitation):
    class Meta(AbstractOrganizationInvitation.Meta):
        abstract: bool
