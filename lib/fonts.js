import { Inter, Noto_Sans_JP, Noto_Sans_SC } from 'next/font/google';

export const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap', variable: '--font-noto' });
export const notoSc = Noto_Sans_SC({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap', variable: '--font-noto' });
export const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-inter' });
