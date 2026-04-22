// MARK: - Frontmatter helpers
// Tiny, regex-based read/write for the YAML frontmatter block. The parser
// matches the same shape used by utils/markdown.ts and plugins/mdx-mtime.ts.

export function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const m = raw.match(/^(---\s*\n[\s\S]*?\n---)\s*\n?([\s\S]*)$/);
  if (!m) return { frontmatter: '', body: raw };
  return { frontmatter: m[1], body: m[2] };
}

export function getFrontmatterValue(frontmatter: string, key: string): string {
  const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
  const m = frontmatter.match(re);
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

export function setFrontmatterValue(frontmatter: string, key: string, value: string): string {
  const escaped = `"${value.replace(/"/g, '\\"')}"`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(frontmatter)) {
    return frontmatter.replace(re, `${key}: ${escaped}`);
  }
  // Insert after the opening --- line
  return frontmatter.replace(/^---\s*\n/, `---\n${key}: ${escaped}\n`);
}
