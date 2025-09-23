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
  useRef,
  useState,
} from 'react';
// 3D background imports removed
// Icons for the rich layout
import {
  Github,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Code,
  Database,
  Globe,
  Cpu,
  Award,
  Calendar,
  ChevronRight,
  Menu,
  X,
  Star,
  Users,
  Download,
  Send,
  ArrowUp,
  BookOpen,
  Trophy,
  Target,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import profilePhoto from '../Yash image.png';

/************************************
 * Theme Context & Provider
 ************************************/
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to dark when no stored preference is found
    return 'dark';
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
      {/* Light theme visibility overrides for Tailwind utility classes */}
      <style>{`
        /* Make text readable in light mode */
        html:not(.dark) .text-white { color: #0f172a !important; } /* slate-900 */
        html:not(.dark) .text-gray-300 { color: #475569 !important; } /* slate-600 */
        html:not(.dark) .text-gray-400 { color: #334155 !important; } /* slate-700 */

        /* Subtle surfaces and borders in light mode */
        html:not(.dark) .bg-white\/5 { background-color: rgba(0,0,0,0.04) !important; }
        html:not(.dark) .bg-white\/10 { background-color: rgba(0,0,0,0.06) !important; }
        html:not(.dark) .hover\:bg-white\/10:hover { background-color: rgba(0,0,0,0.08) !important; }
        html:not(.dark) .hover\:bg-white\/20:hover { background-color: rgba(0,0,0,0.12) !important; }
        html:not(.dark) .border-white\/10 { border-color: rgba(0,0,0,0.12) !important; }
        html:not(.dark) .border-white\/20 { border-color: rgba(0,0,0,0.2) !important; }

        /* Section striping that used black overlays */
        html:not(.dark) .bg-black\/20 { background-color: rgba(15,23,42,0.06) !important; }
        html:not(.dark) .bg-black\/40 { background-color: rgba(15,23,42,0.08) !important; }
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

// 3D Interactive Background removed per request

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
  // ----------------------
  // Profile details (Yours)
  // ----------------------
  const user = {
    name: 'Yashveer Singh',
    email: 'yashveers37@gmail.com',
    phone: '+91-8077826319',
    location: 'Kanpur, U.P., India',
    github: 'https://github.com/yashveerji',
    linkedin: 'https://linkedin.com/in/yashveerji',
    cvLink: 'https://drive.google.com/file/d/1cZ2ENrMM4Ex8mxF6SM4R7wMbnohL_flo/view?usp=sharing',
  };

  // Rotating titles
  const titles = [
    'Full-Stack Developer',
    'MERN Stack Developer',
    'AI Enthusiast',
    'Java Developer',
    'React Specialist',
  ];

  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitle((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [titles.length]);

  // Global intersection observer to set active nav and visibility map
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: entry.isIntersecting }));
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll('section[id]').forEach((section) => observer.observe(section));
    const onScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const p = total > 0 ? (scrollTop / total) * 100 : 0;
      setScrollProgress(p);
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
    setIsMenuOpen(false);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return alert('Please fill out all fields before sending.');
    try {
      const formEl = e.target;
      const data = new FormData(formEl);
      data.append('_subject', 'New message from yashveer.dev portfolio');
      const res = await fetch('https://formspree.io/f/mvgalaeb', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (res.ok) {
        setShowEmailPopup(true);
        setFormData({ name: '', email: '', message: '' });
        formEl.reset?.();
        setTimeout(() => setShowEmailPopup(false), 1800);
      } else {
        alert('Something went wrong sending your message. Please email me directly.');
      }
    } catch (err) {
      alert('Network error. Please email me directly.');
    }
  };
  const downloadCV = () => window.open(user.cvLink, '_blank');

  // Skills data
  const skills = {
    languages: [
      { name: 'JavaScript', level: 90, color: 'from-yellow-500 to-orange-500' },
      { name: 'Java', level: 85, color: 'from-orange-500 to-red-500' },
      { name: 'Python', level: 80, color: 'from-blue-500 to-green-500' },
    ],
    web: [
      { name: 'React (Vite)', level: 90, color: 'from-blue-400 to-blue-600' },
      { name: 'Node.js', level: 88, color: 'from-green-500 to-green-700' },
      { name: 'Express', level: 85, color: 'from-gray-600 to-gray-800' },
      { name: 'Tailwind CSS', level: 95, color: 'from-cyan-500 to-blue-500' },
      { name: 'HTML/CSS', level: 95, color: 'from-orange-500 to-pink-500' },
    ],
    databases: [
      { name: 'MongoDB', level: 88, color: 'from-green-600 to-green-800' },
      { name: 'SQL', level: 75, color: 'from-blue-600 to-indigo-600' },
    ],
    tools: [
      { name: 'Git & GitHub', level: 90, color: 'from-gray-700 to-black' },
      { name: 'WebRTC', level: 85, color: 'from-red-500 to-orange-500' },
      { name: 'Socket.IO', level: 85, color: 'from-yellow-400 to-yellow-600' },
      { name: 'Postman', level: 85, color: 'from-orange-400 to-red-500' },
      { name: 'VS Code', level: 95, color: 'from-blue-500 to-blue-700' },
      { name: 'Vercel/Render', level: 80, color: 'from-black to-gray-800' },
    ],
  };

  // Projects (from your original)
  const mainProjects = [
    {
      title: 'Global Connect',
      subtitle: 'Professional Networking Platform',
      description:
        'A comprehensive LinkedIn-style platform built with the MERN stack, featuring real-time video calling via WebRTC, secure JWT authentication, and a scalable architecture. Developed during my internship, it was designed to handle a high volume of concurrent users.',
      tech: ['React', 'Node.js', 'MongoDB', 'JWT', 'WebRTC', 'Socket.IO', 'Tailwind CSS', 'Cloudinary'],
      github: 'https://github.com/yashveerji/Global_Connect',
      demo: 'https://globalconnect-ys.onrender.com',
      period: 'Apr 2024 – Jul 2024',
      status: 'Completed',
      features: ['Real-time Video Calls', 'Secure JWT Auth', 'OTP Login', 'User Profiles', 'Scalable Backend'],
      highlights: [
        'Engineered video calls with < 200ms latency',
        'Increased user engagement by 30% with new features',
        'Cut API response time by 25% via query optimization',
        'Reduced unauthorized access by 40% with hardened security',
      ],
    },
    {
      title: 'Helmet Detection System',
      subtitle: 'AI-Powered Safety Monitoring',
      description:
        'An advanced computer vision system leveraging the YOLOv8 model for real-time helmet detection in video streams. The system achieves high accuracy and is optimized for efficient processing, making it a viable solution for automated road safety enforcement.',
      tech: ['Python', 'YOLOv8', 'OpenCV', 'PyTorch', 'NumPy'],
      github: 'https://github.com/yashveerji/Helmet_Detection_System',
      demo: '#',
      period: 'Personal Project',
      status: 'Completed',
      features: ['Real-time Detection', 'High Accuracy Model', 'Video Processing Pipeline', 'Custom Dataset Training'],
      highlights: [
        'Achieved 91% detection accuracy on custom datasets',
        'Processes live video feeds at over 15 FPS',
        'Demonstrates strong practical AI/ML skills',
        'Applicable for real-world traffic monitoring',
      ],
    },
    {
      title: 'Bus Reservation System',
      subtitle: 'Desktop Management Application',
      description:
        'A robust desktop application built with Java Swing for managing bus reservations. The system automates ticket booking, cancellation, and passenger management, significantly improving efficiency and reducing manual errors through strong Object-Oriented design.',
      tech: ['Java', 'Swing (GUI)', 'OOP'],
      github: '#',
      demo: '#',
      period: 'Academic Project',
      status: 'Completed',
      features: ['Automated Booking', 'Ticket Management', 'Passenger Database', 'Intuitive GUI'],
      highlights: [
        'Reduced manual booking errors by 80%',
        'Applied core OOP principles for a maintainable codebase',
        'Streamlined the reservation process for better user experience',
        'Managed application state effectively within a desktop environment',
      ],
    },
  ];

  const experience = {
    company: 'Global Next Consulting',
    role: 'Full-Stack Intern',
    period: 'Apr 2024 – Jul 2024',
    location: 'Remote',
    responsibilities: [
      'Engineered and delivered 10+ new features for the Global Connect platform',
      'Implemented secure JWT authentication and robust CORS policies',
      'Developed real-time video communication features using WebRTC and Socket.IO',
      'Collaborated in an Agile environment to meet project deadlines and quality standards',
    ],
    achievements: [
      'Increased user engagement by a significant 30%',
      'Optimized MongoDB queries, cutting API response times by 25%',
      'Reduced potential security vulnerabilities by 40%',
      'Acquired 500+ users during beta testing phase',
    ],
  };

  return (
    <ThemeProvider>
  {/* 3D background removed per request */}

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {user.name}
            </div>
            <div className="hidden md:flex space-x-6 lg:space-x-8">
              {['home', 'about', 'skills', 'projects', 'experience', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize hover:text-blue-400 transition-colors relative ${
                    activeSection === item ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {item}
                  {activeSection === item && (
                    <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 bg-black/40 backdrop-blur-lg rounded-lg p-4">
              {['home', 'about', 'skills', 'projects', 'experience', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left py-2 capitalize hover:text-blue-400 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Scroll Progress Bar */}
  <div className="fixed top-0 left-0 w-full h-1 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-grad"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="pt-20">
        {/* Hero */}
        <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-70"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-70"></div>
          </div>
          <div className="container mx-auto px-6 text-center z-10">
            <div className={`transition-all duration-1000 ${isVisible.home ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-grad">
                  {user.name}
                </h1>
                <div className="relative h-10 flex justify-center items-center mb-6">
                  {titles.map((title, index) => (
                    <p
                      key={index}
                      className={`absolute text-xl md:text-2xl lg:text-3xl text-gray-300 px-4 transition-opacity duration-1000 ease-in-out ${
                        currentTitle === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      style={{ transitionProperty: 'opacity' }}
                    >
                      {title}
                    </p>
                  ))}
                </div>
                <div className="flex justify-center items-center space-x-4">
                  <span className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-xs"></span>
                  <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 px-4">Front-End Engineer & Creative Web</p>
                  <span className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1 max-w-xs"></span>
                </div>
              </div>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                I craft modern, performant interfaces with a love for motion, 3D, and polished details. Welcome to my portfolio.
              </p>
              <div className="flex justify-center space-x-6 mb-8">
                <a href={user.github} target="_blank" rel="noopener noreferrer" className="group p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all hover:scale-110" aria-label="GitHub">
                  <Github size={28} className="group-hover:text-blue-400 transition-colors" />
                </a>
                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="group p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all hover:scale-110" aria-label="LinkedIn">
                  <Linkedin size={28} className="group-hover:text-blue-400 transition-colors" />
                </a>
                <a href={`mailto:${user.email}`} className="group p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all hover:scale-110" aria-label="Email">
                  <Mail size={28} className="group-hover:text-blue-400 transition-colors" />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button onClick={() => scrollToSection('projects')} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/25 btn-shine">
                  View My Work
                </button>
                <button onClick={() => scrollToSection('contact')} className="px-8 py-3 border-2 border-blue-400 rounded-full font-semibold hover:bg-blue-400 hover:text-black transition-all hover:scale-105 btn-shine">
                  Get In Touch
                </button>
                <button onClick={downloadCV} className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full font-semibold hover:from-green-600 hover:to-teal-600 transition-all hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center space-x-2 btn-shine">
                  <Download size={20} />
                  <span>Download CV</span>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/30 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-20 bg-black/20">
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-1000 ${isVisible.about ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-grad">About Me</h2>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    I’m a passionate developer focused on building modern, accessible, and performant web experiences.
                    I enjoy crafting clean UIs, exploring new tech, and delivering products that feel great to use.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center space-x-3 text-gray-400"><MapPin size={20} className="flex-shrink-0" /><span>{user.location}</span></div>
                    <div className="flex items-center space-x-3 text-gray-400"><Phone size={20} className="flex-shrink-0" /><span>{user.phone}</span></div>
                    <div className="flex items-center space-x-3 text-gray-400 sm:col-span-2"><Mail size={20} className="flex-shrink-0" /><span>{user.email}</span></div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <img
                    src={profilePhoto}
                    alt="Yashveer Singh"
                    loading="lazy"
                    className="w-full h-auto max-w-md rounded-xl object-contain shadow-lg border border-white/10"
                  />
                </div>
              </div>
              <div className="mt-10">
                <GitHubStats />
              </div>
              <div className="space-y-8 mt-16">
                <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all tilt glow-border">
                  <h3 className="text-2xl font-semibold text-blue-400 mb-6 flex items-center"><BookOpen className="mr-3" size={24} /> Education</h3>
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-400 pl-6">
                      <h4 className="text-lg font-semibold text-white">Bachelor of Technology (Information Technology)</h4>
                      <p className="text-gray-300 font-medium">Dr. Ambedkar Institute of Technology for Divyangjan, Kanpur</p>
                      <p className="text-gray-400">2023 – Present • CGPA: 8.2</p>
                    </div>
                    <div className="border-l-4 border-purple-400 pl-6">
                      <h4 className="text-lg font-semibold text-white">Diploma (Computer Science and Engineering)</h4>
                      <p className="text-gray-300 font-medium">Dr. Ambedkar Institute of Technology for Divyangjan, Kanpur</p>
                      <p className="text-gray-400">2019 – 2022 • CGPA: 7.1</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="py-20">
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-1000 ${isVisible.skills ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-grad">Skills & Technologies</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {Object.entries(skills).map(([category, list]) => (
                  <div key={category} className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all group tilt glow-border">
                    <Code className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" size={40} />
                    <h3 className="text-xl font-semibold mb-6 text-white capitalize">{category}</h3>
                    <div className="space-y-4">
                      {list.map((skill, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{skill.name}</span>
                            <span className="text-blue-400">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className={`h-2 bg-gradient-to-r ${skill.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${isVisible.skills ? skill.level : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="py-20 bg-black/20">
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-1000 ${isVisible.projects ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-grad">Featured Projects</h2>
              <div className="space-y-8">
                {mainProjects.map((project, index) => (
                  <div key={index} className="bg-white/5 p-8 rounded-xl backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all group tilt glow-border">
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                        <p className="text-blue-400 text-lg mb-2">{project.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center"><Calendar size={16} className="mr-1" /> {project.period}</span>
                          <span className={`px-3 py-1 rounded-full text-xs ${project.status === 'Completed' ? 'bg-green-400/20 text-green-400' : 'bg-blue-400/20 text-blue-400'}`}>{project.status}</span>
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-4 lg:mt-0">
                        {project.github && project.github !== '#' && <a href={project.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all group-hover:scale-110" aria-label="GitHub"><Github size={20} /></a>}
                        {project.demo && project.demo !== '#' && <a href={project.demo} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all group-hover:scale-110" aria-label="Live Demo"><ExternalLink size={20} /></a>}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tech.map((tech, i) => (<span key={i} className="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-sm hover:bg-blue-400/30 transition-colors">{tech}</span>))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center"><Star className="mr-2" size={16} /> Key Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.features.map((f, i) => (<span key={i} className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">{f}</span>))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center"><Target className="mr-2" size={16} /> Highlights</h4>
                        <ul className="space-y-1">
                          {project.highlights.map((h, i) => (<li key={i} className="text-gray-300 text-sm flex items-start"><ChevronRight size={14} className="text-purple-400 mr-2 mt-0.5 flex-shrink-0" />{h}</li>))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className="py-20">
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-1000 ${isVisible.experience ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-grad">Experience & Achievements</h2>
              <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all tilt glow-border">
                  <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center"><Briefcase className="mr-3" size={24} /> Work Experience</h3>
                  <div className="border-l-4 border-blue-400 pl-6">
                    <h4 className="text-xl font-semibold text-white">{experience.role}</h4>
                    <p className="text-purple-400 text-lg font-medium">{experience.company}</p>
                    <div className="flex flex-wrap gap-4 text-gray-400 mb-4"><span>{experience.period}</span><span>•</span><span>{experience.location}</span></div>
                    <div className="mb-6">
                      <h5 className="text-white font-semibold mb-3">Key Responsibilities:</h5>
                      <ul className="space-y-2">{experience.responsibilities.map((resp, i) => (<li key={i} className="text-gray-300 flex items-start text-sm"><ChevronRight size={16} className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" />{resp}</li>))}</ul>
                    </div>
                    <div>
                      <h5 className="text-white font-semibold mb-3">Achievements:</h5>
                      <ul className="space-y-2">{experience.achievements.map((ach, i) => (<li key={i} className="text-gray-300 flex items-start text-sm"><Star size={16} className="text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />{ach}</li>))}</ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm border border-white/10 hover:border-purple-400/50 transition-all tilt glow-border">
                  <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center"><Award className="mr-3" size={24} /> Certifications & Achievements</h3>
                  <div className="space-y-4">
                    {[{ name: 'President, Media Team, Literary Fest', issuer: 'AITD Kanpur', year: '2024', icon: '🏆' }, { name: 'Member, Entrepreneurship Cell (E-Cell)', issuer: 'AITD Kanpur', year: '2023', icon: '💡' }, { name: 'Course on Computer Concepts (CCC)', issuer: 'NIELIT', year: '2023', icon: '📜' }].map((cert, i) => (
                      <div key={i} className="flex items-start space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-2xl">{cert.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{cert.name}</h4>
                          <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-sm">{cert.issuer}</p>
                            <span className="text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded">{cert.year}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-20 bg-black/20">
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-1000 ${isVisible.contact ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-grad">Let's Connect</h2>
              <div className="max-w-4xl mx-auto">
                <p className="text-gray-300 text-lg mb-12 text-center leading-relaxed">I'm always open to discussing new opportunities or collaborating on interesting projects. Feel free to reach out!</p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-white mb-6">Get In Touch</h3>
                    <a href={`mailto:${user.email}`} className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all group block tilt glow-border">
                      <div className="flex items-center space-x-4"><Mail className="text-blue-400 group-hover:scale-110 transition-transform" size={32} /><div><h3 className="text-white font-semibold">Email</h3><p className="text-gray-300">{user.email}</p></div></div>
                    </a>
                    <a href={`tel:${user.phone}`} className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 hover:border-purple-400/50 transition-all group block tilt glow-border">
                      <div className="flex items-center space-x-4"><Phone className="text-purple-400 group-hover:scale-110 transition-transform" size={32} /><div><h3 className="text-white font-semibold">Phone</h3><p className="text-gray-300">{user.phone}</p></div></div>
                    </a>
                  </div>
                  <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm border border-white/10 tilt glow-border">
                    <h3 className="text-2xl font-semibold text-white mb-6">Send a Message</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div><input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleFormChange} required className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors" /></div>
                      <div><input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleFormChange} required className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors" /></div>
                      <div><textarea name="message" placeholder="Your Message" value={formData.message} onChange={handleFormChange} required rows="5" className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"></textarea></div>
                      <button type="submit" className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/25 btn-shine">
                        <Send size={20} /><span>Send Message</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Toast (auto-dismiss) */}
        {showEmailPopup && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center gap-3 bg-gray-800/95 text-white px-4 py-3 rounded-lg shadow-lg border border-white/10">
              <CheckCircle className="text-green-400" size={20} />
              <span className="text-sm">Message sent successfully.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 bg-black/40 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} {user.name}. Built with React & Tailwind CSS.</p>
          </div>
        </footer>

        {/* Scroll to Top */}
        {showScrollTop && (
          <button onClick={scrollToTop} className="fixed bottom-8 right-8 p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50" aria-label="Scroll to top">
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </ThemeProvider>
  );
}
