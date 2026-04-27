// Single source of truth for admin authorization.
// Only this email is allowed to access /admin. Any other authenticated user
// is redirected to the 404 page.
export const ADMIN_EMAIL = "nuroxindiaofficial@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
