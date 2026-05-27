import { Link } from 'react-router';

const footerLinks = [
  { label: 'Privacy Policy', to: '#' },
  { label: 'Terms', to: '#' },
  { label: 'Help Center', to: '#' },
  { label: 'Press', to: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
          {/* Left — Logo & tagline */}
          <div className="flex flex-col gap-3">
            <Link to="/" className="inline-flex">
              <span className="font-display text-2xl font-extrabold text-accent-green tracking-tighter">
                CINEMIND
              </span>
            </Link>
            <p className="text-metadata text-text-muted">
              AI-powered cinema discovery
            </p>
          </div>

          {/* Center — Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {footerLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-metadata text-text-muted tracking-widest hover:text-accent-green transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right — Icons & copyright */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[22px] text-text-muted hover:text-accent-green transition-colors cursor-pointer">
                brand_awareness
              </span>
              <span className="material-symbols-outlined text-[22px] text-text-muted hover:text-accent-green transition-colors cursor-pointer">
                movie
              </span>
              <span className="material-symbols-outlined text-[22px] text-text-muted hover:text-accent-green transition-colors cursor-pointer">
                live_tv
              </span>
            </div>
            <p className="text-metadata text-text-muted">
              © {new Date().getFullYear()} CineMind
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
