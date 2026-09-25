type WebBundle = typeof import("shiki/bundle/web");
type ShikiHighlighter = Awaited<ReturnType<WebBundle["createHighlighter"]>>;

const THEME = "github-light";
const LANG = "sql";

let highlighterPromise: Promise<ShikiHighlighter> | null = null;

function loadHighlighter(): Promise<ShikiHighlighter> {
  highlighterPromise ??= import("shiki/bundle/web").then((mod) =>
    mod.createHighlighter({ themes: [THEME], langs: [LANG] }),
  );
  return highlighterPromise;
}

/** Returns highlighted HTML, or null when highlighting is not ready. */
export async function highlightSql(code: string): Promise<string | null> {
  if (!code) return null;
  try {
    const highlighter = await loadHighlighter();
    return highlighter.codeToHtml(code, { lang: LANG, theme: THEME });
  } catch {
    return null;
  }
}
