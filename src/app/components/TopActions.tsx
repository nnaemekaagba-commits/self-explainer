import { ScreenNavigation } from './ScreenNavigation';

interface TopActionsProps {
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onProfileClick?: () => void;
}

export function TopActions({ onArchiveClick, onInviteClick, onProfileClick }: TopActionsProps) {
  return (
    <ScreenNavigation
      onArchiveClick={onArchiveClick}
      onInviteClick={onInviteClick}
      onProfileClick={onProfileClick}
      showProfileIcon={true}
    />
  );
}