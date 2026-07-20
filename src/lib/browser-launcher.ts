/**
 * Utility for launching Chromium across both Vercel Serverless and Local environments.
 */

export async function launchBrowser(options?: { headless?: boolean; args?: string[] }) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

  let chromium: any;
  let launchArgs: string[] = options?.args || [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];
  let executablePath: string | undefined = undefined;

  if (isServerless) {
    try {
      const sparticuzChromium = (await import('@sparticuz/chromium')).default;
      const pwCore = await import('playwright-core');
      chromium = pwCore.chromium;

      executablePath = await sparticuzChromium.executablePath();
      const sparticuzArgs = sparticuzChromium.args || [];
      launchArgs = Array.from(new Set([...sparticuzArgs, ...launchArgs]));
    } catch (err) {
      console.warn('[BrowserLauncher] Vercel serverless chromium init warning:', err);
      try {
        const pwCore = await import('playwright-core');
        chromium = pwCore.chromium;
      } catch {
        const pw = await import('playwright');
        chromium = pw.chromium;
      }
    }
  } else {
    try {
      const pwCore = await import('playwright-core');
      chromium = pwCore.chromium;
    } catch {
      const pw = await import('playwright');
      chromium = pw.chromium;
    }
  }

  if (!chromium) {
    throw new Error('Chromium instance could not be resolved from playwright-core or playwright');
  }

  const browser = await chromium.launch({
    headless: options?.headless ?? true,
    executablePath,
    args: launchArgs,
  });

  return browser;
}
