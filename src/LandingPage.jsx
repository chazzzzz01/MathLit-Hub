import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionRefs = {
    home: useRef(null),
    about: useRef(null),
    features: useRef(null),
    contact: useRef(null)
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    sectionRefs[sectionId].current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'features', 'contact'];
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = sectionRefs[section].current;
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.nav-container')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLearnMore = () => {
    navigate("/about");
  };

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar} className="nav-container">
        <div style={styles.navContent}>
          <div style={styles.logo}>MathLit Hub</div>
          
          {/* Hamburger Menu Button - Right Side */}
          <button 
            style={styles.hamburgerButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="hamburger-button"
          >
            <div style={{
              ...styles.hamburgerLine,
              transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }} />
            <div style={{
              ...styles.hamburgerLine,
              opacity: mobileMenuOpen ? 0 : 1,
            }} />
            <div style={{
              ...styles.hamburgerLine,
              transform: mobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none',
            }} />
          </button>

          {/* Desktop Navigation Links - Hidden on mobile/tablet */}
          <div style={styles.navLinksDesktop} className="nav-links-desktop">
            <a 
              href="#home" 
              style={{
                ...styles.navLink,
                color: activeSection === 'home' ? '#2563EB' : '#4B5563',
                fontWeight: activeSection === 'home' ? '600' : '500'
              }}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
            >
              Home
            </a>
            <a 
              href="#about" 
              style={{
                ...styles.navLink,
                color: activeSection === 'about' ? '#2563EB' : '#4B5563',
                fontWeight: activeSection === 'about' ? '600' : '500'
              }}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
            >
              About
            </a>
            <a 
              href="#features" 
              style={{
                ...styles.navLink,
                color: activeSection === 'features' ? '#2563EB' : '#4B5563',
                fontWeight: activeSection === 'features' ? '600' : '500'
              }}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
              }}
            >
              Features
            </a>
            <a 
              href="#contact" 
              style={{
                ...styles.navLink,
                color: activeSection === 'contact' ? '#2563EB' : '#4B5563',
                fontWeight: activeSection === 'contact' ? '600' : '500'
              }}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}
            >
              Contact
            </a>
            <button 
              style={styles.signInButton}
              onClick={() => navigate("/signin")}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div style={styles.mobileMenuOverlay} onClick={() => setMobileMenuOpen(false)}>
              <div style={styles.mobileMenuContainer} onClick={(e) => e.stopPropagation()}>
                <div style={styles.mobileMenuHeader}>
                  <div style={styles.mobileMenuLogo}>MathLit Hub</div>
                  <button 
                    style={styles.mobileCloseButton}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.mobileNavLinks}>
                  <a 
                    href="#home" 
                    style={{
                      ...styles.mobileNavLink,
                      color: activeSection === 'home' ? '#2563EB' : '#4B5563',
                      fontWeight: activeSection === 'home' ? '600' : '500',
                      borderLeftColor: activeSection === 'home' ? '#2563EB' : 'transparent'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('home');
                    }}
                  >
                    Home
                  </a>
                  <a 
                    href="#about" 
                    style={{
                      ...styles.mobileNavLink,
                      color: activeSection === 'about' ? '#2563EB' : '#4B5563',
                      fontWeight: activeSection === 'about' ? '600' : '500',
                      borderLeftColor: activeSection === 'about' ? '#2563EB' : 'transparent'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('about');
                    }}
                  >
                    About
                  </a>
                  <a 
                    href="#features" 
                    style={{
                      ...styles.mobileNavLink,
                      color: activeSection === 'features' ? '#2563EB' : '#4B5563',
                      fontWeight: activeSection === 'features' ? '600' : '500',
                      borderLeftColor: activeSection === 'features' ? '#2563EB' : 'transparent'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('features');
                    }}
                  >
                    Features
                  </a>
                  <a 
                    href="#contact" 
                    style={{
                      ...styles.mobileNavLink,
                      color: activeSection === 'contact' ? '#2563EB' : '#4B5563',
                      fontWeight: activeSection === 'contact' ? '600' : '500',
                      borderLeftColor: activeSection === 'contact' ? '#2563EB' : 'transparent'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('contact');
                    }}
                  >
                    Contact
                  </a>
                  <button 
                    style={styles.mobileSignInButton}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signin");
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={sectionRefs.home} id="home" style={styles.heroSection}>
        <div style={styles.content}>
          <h1 style={styles.title}>
            Master Math with
          </h1>
          <h1 style={styles.titleHighlight}>
            MathLit Hub
          </h1>
          <p style={styles.subtitle}>
            Achieve Mathematical Excellence, Wherever You Are.
          </p>
          
          <button 
            style={styles.ctaButton}
            onClick={() => navigate("/signin")}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* About Section with Learn More Button */}
      <section ref={sectionRefs.about} id="about" style={styles.aboutSection}>
        <h2 style={styles.sectionTitle}>About</h2>
        <p style={styles.aboutText}>
          An interaction platform to boost students mathematical literacy.<br />
          Learn through missions, games, and collaboration while tracking progress.
        </p>
        
        {/* Learn More Button */}
        <button 
          style={styles.learnMoreButton}
          onClick={handleLearnMore}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2563eb';
          }}
        >
          Learn More
        </button>
        
        <hr style={styles.divider} />
      </section>

      {/* Features Section with Blue Cards - UPDATED (removed offline and downloadable) */}
      <section ref={sectionRefs.features} id="features" style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.featuresGrid}>
          
          <div style={styles.featureCard} className="feature-card">
            <h3 style={styles.featureTitle}>Mission-based Learning</h3>
            <p style={styles.featureDescription}>Complete engaging missions and unlock new levels</p>
          </div>

          <div style={styles.featureCard} className="feature-card">
            <h3 style={styles.featureTitle}>Game-based Learning</h3>
            <p style={styles.featureDescription}>Practice math with fun and enjoyable interactive games</p>
          </div>

          <div style={styles.featureCard} className="feature-card">
            <h3 style={styles.featureTitle}>Progress Tracking</h3>
            <p style={styles.featureDescription}>Monitor scores, progress, and mission completion</p>
          </div>

          <div style={styles.featureCard} className="feature-card">
            <h3 style={styles.featureTitle}>Achievements & Rewards</h3>
            <p style={styles.featureDescription}>Earn badges and rewards as you master new concepts</p>
          </div>

          <div style={styles.featureCard} className="feature-card">
            <h3 style={styles.featureTitle}>Daily Challenges</h3>
            <p style={styles.featureDescription}>Take on new challenges every day to sharpen your skills</p>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section ref={sectionRefs.contact} id="contact" style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>Contact</h2>
        <p style={styles.contactText}>Get in touch with us for more information</p>
      </section>

      {/* Inject CSS for hover effects and responsive design */}
      <style>{`
        /* Hide desktop navigation on tablet and mobile */
        @media (max-width: 1024px) {
          .nav-links-desktop {
            display: none !important;
          }
        }
        
        /* Show hamburger button on tablet and mobile */
        @media (max-width: 1024px) {
          .hamburger-button {
            display: flex !important;
          }
        }
        
        /* Hide hamburger button on desktop */
        @media (min-width: 1025px) {
          .hamburger-button {
            display: none !important;
          }
        }
        
        /* Feature card hover effect */
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
          transition: all 0.3s ease;
        }
        
        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        /* Mobile menu animations */
        .mobile-menu-overlay {
          animation: fadeIn 0.3s ease;
        }
        
        .mobile-menu-container {
          animation: slideIn 0.3s ease;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden'
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    padding: '16px 0',
    borderBottom: '1px solid #E5E7EB',
    position: 'fixed',
    width: '100%',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative'
  },
  logo: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: '-0.5px'
  },
  hamburgerButton: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '30px',
    height: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    zIndex: 1001
  },
  hamburgerLine: {
    width: '30px',
    height: '3px',
    backgroundColor: '#2563EB',
    borderRadius: '2px',
    transition: 'all 0.3s ease'
  },
  navLinksDesktop: {
    display: 'flex',
    gap: 'clamp(16px, 3vw, 32px)',
    alignItems: 'center'
  },
  navLink: {
    textDecoration: 'none',
    fontSize: 'clamp(14px, 3vw, 16px)',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    whiteSpace: 'nowrap'
  },
  signInButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '8px 20px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginLeft: '8px',
    whiteSpace: 'nowrap'
  },
  learnMoreButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '12px 28px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '20px',
    marginBottom: '20px',
    minWidth: '160px'
  },
  mobileMenuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease'
  },
  mobileMenuContainer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 'min(320px, 80%)',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  mobileMenuHeader: {
    padding: '20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mobileMenuLogo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2563EB'
  },
  mobileCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#4B5563',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
    ':hover': {
      backgroundColor: '#F3F4F6'
    }
  },
  mobileNavLinks: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '8px'
  },
  mobileNavLink: {
    textDecoration: 'none',
    fontSize: '18px',
    padding: '15px 20px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#F3F4F6'
    }
  },
  mobileSignInButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '20px',
    width: '100%'
  },
  heroSection: {
    paddingTop: 'clamp(100px, 15vh, 140px)',
    paddingBottom: 'clamp(40px, 8vh, 80px)',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  content: {
    maxWidth: 'min(800px, 90%)',
    margin: '0 auto',
    padding: '0 20px'
  },
  title: {
    fontSize: 'clamp(32px, 8vw, 52px)',
    color: '#111827',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginBottom: '0px'
  },
  titleHighlight: {
    fontSize: 'clamp(32px, 8vw, 52px)',
    color: '#2563EB',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginTop: '0px',
    marginBottom: 'clamp(12px, 3vw, 20px)'
  },
  subtitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#6B7280',
    marginBottom: 'clamp(30px, 6vw, 40px)',
    fontWeight: '400',
    lineHeight: '1.6',
    padding: '0 20px'
  },
  ctaButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: 'clamp(10px, 3vw, 12px) clamp(24px, 6vw, 32px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    width: 'auto',
    minWidth: '160px'
  },
  aboutSection: {
    padding: 'clamp(40px, 10vh, 80px) 20px',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    color: '#111827',
    marginBottom: 'clamp(16px, 4vw, 24px)',
    fontWeight: '600'
  },
  aboutText: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#4B5563',
    lineHeight: '1.8',
    maxWidth: 'min(800px, 95%)',
    margin: '0 auto 30px auto',
    padding: '0 20px'
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #E5E7EB',
    margin: '40px auto',
    maxWidth: 'min(600px, 90%)',
    width: '100%'
  },
  featuresSection: {
    padding: 'clamp(40px, 8vh, 80px) 20px',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
    gap: 'clamp(20px, 4vw, 24px)',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    width: '100%'
  },
  featureCard: {
    backgroundColor: '#2563EB',
    borderRadius: '12px',
    padding: 'clamp(20px, 5vw, 28px) clamp(16px, 4vw, 24px)',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    textAlign: 'left',
    border: 'none',
    cursor: 'pointer',
    color: 'white'
  },
  featureTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#FFFFFF',
    marginBottom: '12px',
    fontWeight: '600',
    borderBottom: '2px solid #FFFFFF',
    paddingBottom: '8px',
    display: 'inline-block'
  },
  featureDescription: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#FFFFFF',
    lineHeight: '1.6',
    marginTop: '8px',
    opacity: '0.9'
  },
  contactSection: {
    padding: 'clamp(40px, 10vh, 80px) 20px',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  contactText: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#4B5563',
    maxWidth: 'min(600px, 95%)',
    margin: '0 auto',
    padding: '0 20px'
  }
};

export default LandingPage;