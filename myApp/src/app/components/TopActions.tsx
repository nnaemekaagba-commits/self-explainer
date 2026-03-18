import { ScreenNavigation } from './ScreenNavigation';

interface TopActionsProps {
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onProfileClick?: () => void;
  onSharedExerciseClick?: () => void;
}

export function TopActions({ onArchiveClick, onInviteClick, onProfileClick, onSharedExerciseClick }: TopActionsProps) {
  return (
    <ScreenNavigation
      onArchiveClick={onArchiveClick}
      onInviteClick={onInviteClick}
      onProfileClick={onProfileClick}
      onSharedExerciseClick={onSharedExerciseClick}
      showProfileIcon={true}
    />
  );
}