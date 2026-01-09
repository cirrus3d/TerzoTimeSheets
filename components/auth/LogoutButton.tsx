'use client';

import { logout } from '@/app/actions';
import { Button } from '@/components/ui/Button';

export function LogoutButton() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button onClick={handleLogout} variant="secondary">
      Sign Out
    </Button>
  );
}
