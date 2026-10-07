import { expect, type Page } from "@playwright/test";

type KeyboardPlatform = Pick<Navigator, "platform" | "vendor" | "userAgent" | "maxTouchPoints">;

export function codeMirrorSelectAll(platform: KeyboardPlatform) {
  // CodeMirror treats touch Safari as Apple even when the runner is Linux.
  const ios = /Apple Computer/.test(platform.vendor)
    && (/Mobile\/\w+/.test(platform.userAgent) || platform.maxTouchPoints > 2);
  return ios || /Mac/.test(platform.platform) ? "Meta+A" : "Control+A";
}

export async function replaceAppCode(page: Page, code: string) {
  const editor = page.getByRole("textbox", { name: "Code Editor for App.tsx", exact: true }).last();
  await expect(editor).toHaveAttribute("contenteditable", "true");
  const platform = await page.evaluate(() => ({
    platform: navigator.platform,
    vendor: navigator.vendor,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  }));
  await editor.click();
  await expect(editor).toBeFocused();
  // fill() replaces only the viewport of a long, virtualized document.
  await editor.press(codeMirrorSelectAll(platform));
  await page.keyboard.insertText(code);
  await expect(editor).toHaveText(code, { useInnerText: true });
  return editor;
}
