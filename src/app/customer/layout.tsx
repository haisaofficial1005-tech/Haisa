/**
 * Customer Layout - Simple wrapper
 * Auth check is done in each page
 */

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
