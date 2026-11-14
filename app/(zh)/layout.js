import RootDocument, { rootMetadata, viewport as baseViewport } from '@/components/RootDocument';
import '../globals.css';

export const metadata = rootMetadata('zh');
export const viewport = baseViewport;

export default function RootLayout({ children }) {
  return <RootDocument lang="zh">{children}</RootDocument>;
}
