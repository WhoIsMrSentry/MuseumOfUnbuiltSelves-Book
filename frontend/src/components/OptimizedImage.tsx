// MARK: - OptimizedImage
// Renders a <picture> with AVIF + WebP siblings derived from the original
// PNG/JPG URL (the cover-optimize Vite plugin emits these at build time).
// Falls back to the original `src` for the <img> so dev mode still works
// (no siblings exist there yet).

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string };

export default function OptimizedImage({ src, alt, ...rest }: Props) {
  const m = src.match(/^(.*)\.(png|jpe?g)(\?.*)?$/i);
  if (!m || !import.meta.env.PROD) {
    return <img src={src} alt={alt} {...rest} />;
  }
  const base = m[1];
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img src={src} alt={alt} {...rest} />
    </picture>
  );
}
