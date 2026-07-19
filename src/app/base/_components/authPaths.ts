export function isAuthPage(pathname: string): boolean {
  return (
    pathname.startsWith("/base/login") ||
    pathname.startsWith("/base/forgot-password") ||
    pathname.startsWith("/base/reset-password") ||
    pathname.startsWith("/base/whoami")
  );
}
