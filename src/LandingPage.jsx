import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const sectionRefs = {
    home: useRef(null),
    about: useRef(null),
    features: useRef(null),
    contact: useRef(null)
  };

  const scrollToSection = (sectionId) => {
    sectionRefs[sectionId].current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'features', 'contact'];
      const scrollPosition = window.scrollY + 150; // Offset for navbar

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

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.logo}>MathLit Hub</div>
          <div style={styles.navLinks}>
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

      {/* About Section */}
      <section ref={sectionRefs.about} id="about" style={styles.aboutSection}>
        <h2 style={styles.sectionTitle}>About</h2>
        <p style={styles.aboutText}>
          An interaction platform to boost students mathematical literacy.<br />
          Learn through missions, games, and collaboration while tracking progress.
        </p>
        <hr style={styles.divider} />
      </section>

      {/* Features Section with Blue Cards */}
      <section ref={sectionRefs.features} id="features" style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.featuresGrid}>
          
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Mission-based Learning</h3>
            <p style={styles.featureDescription}>Step by step through engaging missions</p>
          </div>

          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Game-based Learning</h3>
            <p style={styles.featureDescription}>Practice math with fun interactive games</p>
          </div>

          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Progress Tracking</h3>
            <p style={styles.featureDescription}>Monitor scores, progress, mission completion</p>
          </div>

          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Offline Resources</h3>
            <p style={styles.featureDescription}>Access lessons, mentor, and manage activities</p>
          </div>

          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>Downloadable Materials</h3>
            <p style={styles.featureDescription}>Download worksheets and learning materials anytime</p>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section ref={sectionRefs.contact} id="contact" style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>Contact</h2>
        <p style={styles.contactText}>Get in touch with us for more information</p>
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    scrollBehavior: 'smooth'
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    padding: '20px 0',
    borderBottom: '1px solid #E5E7EB',
    position: 'fixed',
    width: '100%',
    top: 0,
    zIndex: 1000
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center'
  },
  navLink: {
    textDecoration: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'color 0.3s ease'
  },
  signInButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginLeft: '8px'
  },
  heroSection: {
    paddingTop: '140px',
    paddingBottom: '80px',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 24px'
  },
  title: {
    fontSize: '52px',
    color: '#111827',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginBottom: '0px'
  },
  titleHighlight: {
    fontSize: '52px',
    color: '#2563EB',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginTop: '0px',
    marginBottom: '20px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6B7280',
    marginBottom: '40px',
    fontWeight: '400',
    lineHeight: '1.6'
  },
  ctaButton: {
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  aboutSection: {
    padding: '80px 24px 40px 24px',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  sectionTitle: {
    fontSize: '36px',
    color: '#111827',
    marginBottom: '24px',
    fontWeight: '600'
  },
  aboutText: {
    fontSize: '18px',
    color: '#4B5563',
    lineHeight: '1.8',
    maxWidth: '800px',
    margin: '0 auto 30px auto'
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #E5E7EB',
    margin: '40px auto',
    maxWidth: '600px'
  },
  featuresSection: {
    padding: '40px 24px 80px 24px',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 0'
  },
  featureCard: {
    backgroundColor: '#2563EB',
    borderRadius: '12px',
    padding: '28px 24px',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    textAlign: 'left',
    border: 'none',
    cursor: 'pointer',
    color: 'white'
  },
  featureTitle: {
    fontSize: '20px',
    color: '#FFFFFF',
    marginBottom: '12px',
    fontWeight: '600',
    borderBottom: '2px solid #FFFFFF',
    paddingBottom: '8px',
    display: 'inline-block'
  },
  featureDescription: {
    fontSize: '16px',
    color: '#FFFFFF',
    lineHeight: '1.6',
    marginTop: '8px',
    opacity: '0.9'
  },
  contactSection: {
    padding: '80px 24px',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
  },
  contactText: {
    fontSize: '18px',
    color: '#4B5563',
    maxWidth: '600px',
    margin: '0 auto'
  }
};

export default LandingPage;