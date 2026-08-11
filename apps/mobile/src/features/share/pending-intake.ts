import type {ShareDraft} from './incoming-share';

let pendingIntake: ShareDraft | undefined;

export function setPendingIntake(draft: ShareDraft): void {
  pendingIntake = draft;
}

export function consumePendingIntake(): ShareDraft | undefined {
  const intake = pendingIntake;
  pendingIntake = undefined;
  return intake;
}

export function clearPendingIntake(): void {
  pendingIntake = undefined;
}
