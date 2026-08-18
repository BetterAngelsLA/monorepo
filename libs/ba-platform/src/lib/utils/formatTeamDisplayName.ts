export function formatTeamDisplayName(team: {
  name: string;
  isActive?: boolean | null;
}): string {
  return team.isActive === false ? `${team.name} (Inactive)` : team.name;
}
