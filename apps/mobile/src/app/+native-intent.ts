type RedirectSystemPathArgs = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({path}: RedirectSystemPathArgs): string {
  try {
    if (new URL(path).hostname === 'expo-sharing') {
      return '/share-intake';
    }

    return path;
  } catch {
    return path.startsWith('/') ? path : '/';
  }
}
