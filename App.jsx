/*
  App.jsx — Yashveer Singh Portfolio (Enhanced)

  Premium features added:
  1) 3D Interactive Background using react-three-fiber + drei (100 floating shapes reacting to mouse)
  2) Light/Dark Theme with ThemeContext + accessible toggle and CSS variables
  3) Live GitHub Stats fetched from https://api.github.com/users/yashveerji
  4) Cleaner structure with a reusable useIntersectionObserver hook

  Dependencies to install (run in your project folder):
  - npm i three @react-three/fiber @react-three/drei

  Tailwind note (optional but recommended):
  - Ensure your tailwind.config.js has: darkMode: 'class'
  - This file toggles the <html> element's 'dark' class so Tailwind dark styles will apply.
*/

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Float } from '@react-three/drei';

/************************************
 * Theme Context & Provider
 ************************************/
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Apply the theme to the <html> element (Tailwind dark mode requires this)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {/* CSS Variables for theming (works with or without Tailwind) */}
      <style>{`
        :root {
          --bg: #f6f7fb;
          --text: #0f172a; /* slate-900 */
          --muted: #334155; /* slate-600 */
          --card: #ffffff;
          --accent: #2563eb; /* blue-600 */
          --border: rgba(15, 23, 42, 0.08);
        }
        html.dark {
          --bg: #0b1020; /* near slate-950 */
          --text: #e2e8f0; /* slate-200 */
          --muted: #94a3b8; /* slate-400 */
          --card: #0f172a; /* slate-900 */
          --accent: #60a5fa; /* blue-400 */
          --border: rgba(255, 255, 255, 0.08);
        }
        body, #root { background: var(--bg); color: var(--text); }
        .theme-bg { background: var(--bg); }
        .theme-text { color: var(--text); }
        .muted { color: var(--muted); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 12px;
          background: var(--card); border: 1px solid var(--border);
          color: var(--text); transition: transform .15s ease, background .2s ease, color .2s ease, border-color .2s ease;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-accent { background: var(--accent); color: white; border-color: transparent; }
        .link { color: var(--accent); text-decoration: none; }
        .link:hover { text-decoration: underline; }

        /* Reveal-on-scroll animation */
        .reveal { opacity: 0; transform: translateY(16px) scale(.98); transition: opacity .6s ease, transform .6s ease; }
        .reveal.is-visible { opacity: 1; transform: none; }

        /* Layout utilities (fallbacks if Tailwind isn't present) */
        .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 20px; }
        .grid { display: grid; gap: 20px; }
        .grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .section { padding: 64px 0; }
        .header-blur { backdrop-filter: blur(10px); background: linear-gradient(180deg, rgba(0,0,0,0.00), rgba(0,0,0,0.03)); border-bottom: 1px solid var(--border); }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}

/************************************
 * useIntersectionObserver Hook
 ************************************/
function useIntersectionObserver({ root = null, rootMargin = '0px', threshold = 0.2 } = {}, once = true) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsIntersecting(false);
          }
        });
      },
      { root, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once]);

  return { ref, isIntersecting };
}

/************************************
 * 3D Interactive Background
 ************************************/
function FloatingIco({ seed = 0, basePosition = [0, 0, 0], scale = 0.4 }) {
  const ref = useRef();
  const { mouse, viewport } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed;
    const refObj = ref.current;
    if (!refObj) return;

    // Gentle float
    refObj.position.x = basePosition[0] + Math.sin(t * 0.6) * 0.3;
    refObj.position.y = basePosition[1] + Math.cos(t * 0.8) * 0.3;
    refObj.position.z = basePosition[2] + Math.sin(t * 0.4) * 0.3;

    // Slight parallax with mouse (-1..1)
    const px = (mouse.x || 0) * (viewport.width * 0.02);
    const py = (mouse.y || 0) * (viewport.height * 0.02);
    refObj.position.x += px;
    refObj.position.y += py;

    // Slow rotation
    refObj.rotation.x += 0.003 + (seed % 0.01);
    refObj.rotation.y += 0.002 + (seed % 0.008);
  });

  return (
    <Float speed={0.6} rotationIntensity={0.4} floatIntensity={0.8}>
      <Icosahedron ref={ref} args={[scale, 0]}>
        <meshStandardMaterial color={seed % 2 === 0 ? '#60a5fa' : '#38bdf8'} roughness={0.4} metalness={0.2} />
      </Icosahedron>
    </Float>
  );
}

function Scene() {
  // Create 100 randomized positions within a bounded volume
  const items = useMemo(() => {
    const rng = (min, max) => Math.random() * (max - min) + min;
    return new Array(100).fill(0).map((_, i) => ({
      id: i,
      seed: rng(0, 1000),
      basePosition: [rng(-4, 4), rng(-2, 2), rng(-6, -2)],
      scale: rng(0.12, 0.5),
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      {items.map((it) => (
        <FloatingIco key={it.id} seed={it.seed} basePosition={it.basePosition} scale={it.scale} />
      ))}
    </>
  );
}

function InteractiveBackground() {
  const { theme } = useTheme();
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        background: theme === 'dark' ? 'radial-gradient(1200px 600px at 70% -10%, rgba(96,165,250,.15), transparent), radial-gradient(900px 500px at -10% 70%, rgba(56,189,248,.08), transparent)' :
          'radial-gradient(1200px 600px at 70% -10%, rgba(37,99,235,.08), transparent), radial-gradient(900px 500px at -10% 70%, rgba(56,189,248,.06), transparent)'
      }}
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 65 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

/************************************
 * GitHub Stats
 ************************************/
function GitHubStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('https://api.github.com/users/yashveerji');
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to fetch GitHub stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>GitHub Stats</h3>
        <a className="link" href="https://github.com/yashveerji" target="_blank" rel="noreferrer">@yashveerji</a>
      </div>
      {loading && <p className="muted" style={{ margin: 0 }}>Loading...</p>}
      {error && (
        <p className="muted" style={{ margin: 0 }}>Error: {error}</p>
      )}
      {data && (
        <div className="grid grid-3" style={{ marginTop: 8 }}>
          <Stat label="Public Repositories" value={data.public_repos} />
          <Stat label="Followers" value={data.followers} />
          <Stat label="Following" value={data.following} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/************************************
 * Theme Toggle (Accessible)
 ************************************/
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activate light mode' : 'Activate dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to Light' : 'Switch to Dark'}
    >
      {isDark ? (
        // Moon icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
        </svg>
      ) : (
        // Sun icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
          </g>
        </svg>
      )}
      <span style={{ fontSize: 14 }}>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

/************************************
 * Section helper w/ intersection reveal
 ************************************/
function Section({ id, title, subtitle, children }) {
  const { ref, isIntersecting } = useIntersectionObserver();
  return (
    <section id={id} className="section">
      <div ref={ref} className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}>
        {title && (
          <header style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            {subtitle && <p className="muted" style={{ margin: '6px 0 0 0' }}>{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

/************************************
 * Portfolio Layout
 ************************************/
export default function App() {
  return (
    <ThemeProvider>
      <InteractiveBackground />

      {/* Sticky header */}
      <header className="header-blur" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="card" style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800 }}>YS</div>
            <div>
              <div style={{ fontWeight: 700 }}>Yashveer Singh</div>
              <div className="muted" style={{ fontSize: 12 }}>Front-End Engineer · Creative Web</div>
            </div>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a className="btn" href="#about">About</a>
            <a className="btn" href="#projects">Projects</a>
            <a className="btn" href="#contact">Contact</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <Section id="hero">
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.15 }}>Building delightful, interactive web experiences.</h1>
            <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
              I craft modern, performant interfaces with a love for motion, 3D, and polished details. Welcome to my portfolio.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <a className="btn btn-accent" href="#projects">View Projects</a>
              <a className="btn" href="mailto:yashveer@example.com">Contact Me</a>
            </div>
          </div>
        </div>
      </Section>

      {/* About + GitHub Stats */}
      <Section id="about" title="About Me" subtitle="I enjoy building immersive, accessible UIs.">
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <p className="muted" style={{ marginTop: 0 }}>
              I'm a front-end engineer focused on creative development — blending React, WebGL, and motion to tell stories on the web.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>React, TypeScript, Tailwind</li>
              <li>Three.js, react-three-fiber, shaders</li>
              <li>Accessibility and performance</li>
            </ul>
          </div>
          <GitHubStats />
        </div>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Selected Projects" subtitle="A few things I've worked on recently.">
        <div className="grid grid-3">
          {['Interactive Landing', '3D Product Viewer', 'Data Viz Dashboard'].map((name, i) => (
            <article key={i} className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>{name}</h3>
              <p className="muted" style={{ marginTop: 6 }}>A brief description highlighting impact, technologies, and unique challenges solved.</p>
              <div style={{ marginTop: 10 }}>
                <a className="link" href="#">View details →</a>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" title="Get In Touch" subtitle="Open to freelance, collaborations, and full-time roles.">
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ margin: 0 }}>Have an idea or opportunity? Let's chat.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <a className="btn btn-accent" href="mailto:yashveer@example.com">Email Me</a>
            <a className="btn" href="https://github.com/yashveerji" target="_blank" rel="noreferrer">GitHub</a>
            <a className="btn" href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </Section>

      <footer className="section" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span className="muted">© {new Date().getFullYear()} Yashveer Singh</span>
          <a className="link" href="#hero">Back to top ↑</a>
        </div>
      </footer>
    </ThemeProvider>
  );
}
