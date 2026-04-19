/// <reference types="vite/client" />

// MARK: - Virtual module type declarations
declare module 'virtual:mdx-mtime' {
  const mtimeMap: Record<string, string>;
  export default mtimeMap;
}
