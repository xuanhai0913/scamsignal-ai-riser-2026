const AI_STUDIO_SCREENSHOT_SHIM_URL = 'https://cdn.jsdelivr.net/npm/html2canvas-pro';

export function isBrokenAiStudioScreenshotShimError(
  message: string | Event,
  source?: string | null,
) {
  return source === AI_STUDIO_SCREENSHOT_SHIM_URL
    && String(message).includes("Unexpected token 'export'");
}

/**
 * AI Studio currently injects the ESM entrypoint of html2canvas-pro as a
 * classic script in shared app iframes. Its own bridge reports that unrelated
 * parse error to the host, which can replace an otherwise healthy app with the
 * generic "Failed to load app" overlay. Ignore only that exact injected error;
 * all application errors continue through the bridge unchanged.
 */
export function installAiStudioFrameCompatibilityGuard(target: Window = window) {
  if (target.self === target.top) return;

  const bridgeOnError = target.onerror;
  target.onerror = function onAiStudioFrameError(message, source, line, column, error) {
    if (isBrokenAiStudioScreenshotShimError(message, source)) return true;
    if (typeof bridgeOnError === 'function') {
      return bridgeOnError.call(this, message, source, line, column, error);
    }
    return false;
  };
}
