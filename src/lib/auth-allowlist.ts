export function isOwnerEmail(
  email: string | null | undefined,
  ownerEmail: string | undefined,
): boolean {
  const owner = ownerEmail?.trim();
  return Boolean(owner && email?.trim().toLowerCase() === owner.toLowerCase());
}
