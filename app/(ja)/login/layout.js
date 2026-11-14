export const metadata = {
  title: '提携店舗ログイン',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }) {
  return (
    <section className="wrap section" style={{ maxWidth: 520 }}>
      {children}
    </section>
  );
}
