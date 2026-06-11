# Signals tests have been removed.
# The signal handle_organization_user_added was deleted in favor of explicit
# service-layer role assignment via OrgRoleManager.add_roles().
#
# Previous tests validated that org.add_user() auto-assigned the Caseworker
# permission group. That is now done explicitly by callers via:
#     OrgRoleManager(org).add_roles(user, CASEWORKER)
#
