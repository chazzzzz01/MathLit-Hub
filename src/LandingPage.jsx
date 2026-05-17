import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const sectionRefs = {
    home: useRef(null),
    about: useRef(null),
    features: useRef(null),
    contact: useRef(null)
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);
    sectionRefs[sectionId].current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Function to open Gmail with the researcher's email
  const openGmail = (email, name) => {
    const subject = encodeURIComponent(`Inquiry from MathLit Hub Website`);
    const body = encodeURIComponent(`Hello ${name},\n\nI visited the MathLit Hub website and would like to get in touch with you.\n\nBest regards,\n[Your Name]`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
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
    // FIXED: Always use containerWithBg - background should never disappear
    <div style={!imageError ? styles.containerWithBg : styles.containerWithoutBg}>
      {/* Navigation Bar */}
      <nav style={styles.navbar} className="nav-container">
        <div style={styles.navContent}>
          {/* Logo Image - Larger size */}
          <div style={styles.logoContainer}>
            <img 
              src="/logomath.png" 
              alt="MathLit Hub Logo" 
              style={styles.logoImage}
              className="desktop-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
          
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
                  {/* Mobile Menu Logo - Larger size */}
                  <div style={styles.mobileMenuLogo}>
                    <img 
                      src="/logomath.png" 
                      alt="MathLit Hub Logo" 
                      style={styles.mobileLogoImage}
                      className="mobile-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
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

      {/* Hero Section - Always visible, but with conditional styling */}
      <section ref={sectionRefs.home} id="home" style={styles.heroSection}>
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
      </section>

      {/* About Section */}
      <section ref={sectionRefs.about} id="about" style={styles.aboutSection}>
        <div style={styles.aboutGradientBg}></div>
        <div style={styles.aboutContent}>
          <h2 style={styles.sectionTitle}>About</h2>
          <p style={styles.aboutText}>
            An interaction platform to boost students mathematical literacy.<br />
            Learn through missions, games, and collaboration while tracking progress.
          </p>
          <button 
            style={styles.learnMoreButton}
            onClick={handleLearnMore}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Learn More
          </button>
        </div>
        <hr style={styles.divider} />
      </section>

      {/* Features Section */}
      <section ref={sectionRefs.features} id="features" style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard} className="feature-card">
            <div style={styles.featureIcon}>🎯</div>
            <h3 style={styles.featureTitle}>Mission-based Learning</h3>
            <p style={styles.featureDescription}>Complete engaging missions and unlock new levels</p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <div style={styles.featureIcon}>🎮</div>
            <h3 style={styles.featureTitle}>Games</h3>
            <p style={styles.featureDescription}>Practice math with fun and enjoyable interactive games</p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Progress Tracking</h3>
            <p style={styles.featureDescription}>Monitor scores, progress, and mission completion</p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <div style={styles.featureIcon}>🏆</div>
            <h3 style={styles.featureTitle}>Achievements & Rewards</h3>
            <p style={styles.featureDescription}>Earn badges and rewards as you master new concepts</p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Daily Challenges</h3>
            <p style={styles.featureDescription}>Take on new challenges every day to sharpen your skills</p>
          </div>
        </div>
      </section>

      {/* Professional Contact Section - Horizontal on Desktop, Vertical on Mobile */}
      <section ref={sectionRefs.contact} id="contact" style={styles.contactSection}>
        <div style={styles.contactContainer}>
          <div style={styles.contactHeader}>
            <h2 style={styles.sectionTitle}>Get In Touch</h2>
            <p style={styles.contactSubtitle}>
              Have questions? We'd love to hear from you. Reach out to our team members directly.
            </p>
          </div>
          
          {/* Contact Cards - Horizontal on desktop, vertical on mobile */}
          <div style={styles.contactCardsWrapper}>
            {/* Contact Card 1 - Sheila Ann Bacunawa Gevera */}
            <div style={styles.contactCard} className="contact-card">
              <div style={styles.contactCardInner}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatarContainer}>
                    <img 
                      src="/sheila.jpg" 
                      alt="Sheila Ann Bacunawa Gevera" 
                      style={styles.researcherImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="font-size: 40px;">👩‍🏫</div>';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={styles.contactName}>Sheila Ann Bacunawa Gevera</h3>
                    <p style={styles.contactRole}>Researcher</p>
                  </div>
                </div>
                
                <div style={styles.contactInfoList}>
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>📞</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Phone</span>
                      <a href="tel:09483426236" style={styles.infoLink}>0948 342 6236</a>
                    </div>
                  </div>
                  
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>✉️</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Email</span>
                      <a href="mailto:geverasheila27@gmail.com" style={styles.infoLink}>geverasheila27@gmail.com</a>
                    </div>
                  </div>
                  
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>📘</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Facebook</span>
                      <a 
                        href="https://www.facebook.com/sheilaann.gevera" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.infoLink}
                      >
                        Sheila Ann Gevera
                      </a>
                    </div>
                  </div>
                </div>
                
                <button 
                  style={styles.messageButton}
                  onClick={() => openGmail("geverasheila27@gmail.com", "Sheila Ann Gevera")}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1d4ed8';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2563EB';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>

            {/* Contact Card 2 - Louie Lyn Dela Cruz */}
            <div style={styles.contactCard} className="contact-card">
              <div style={styles.contactCardInner}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatarContainer}>
                    <img 
                      src="/lou.jpg" 
                      alt="Louie Lyn Dela Cruz" 
                      style={styles.researcherImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="font-size: 40px;">👩‍🎓</div>';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={styles.contactName}>Louie Lyn Dela Cruz</h3>
                    <p style={styles.contactRole}>Researcher</p>
                  </div>
                </div>
                
                <div style={styles.contactInfoList}>
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>📞</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Phone</span>
                      <a href="tel:09481234567" style={styles.infoLink}>0948 123 4567</a>
                    </div>
                  </div>
                  
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>✉️</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Email</span>
                      <a href="mailto:louielyn.delacruz@bpsu.edu.ph" style={styles.infoLink}>louielyn.delacruz@bpsu.edu.ph</a>
                    </div>
                  </div>
                  
                  <div style={styles.contactInfoItem}>
                    <div style={styles.infoIcon}>📘</div>
                    <div style={styles.infoContent}>
                      <span style={styles.infoLabel}>Facebook</span>
                      <a 
                        href="https://www.facebook.com/louielyn.delacruz" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.infoLink}
                      >
                        Louie Lyn Dela Cruz
                      </a>
                    </div>
                  </div>
                </div>
                
                <button 
                  style={styles.messageButton}
                  onClick={() => openGmail("louielyn.delacruz@bpsu.edu.ph", "Louie Lyn Dela Cruz")}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1d4ed8';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2563EB';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) {
          .nav-links-desktop {
            display: none !important;
          }
          .hamburger-button {
            display: flex !important;
          }
        }
        @media (min-width: 1025px) {
          .hamburger-button {
            display: none !important;
          }
        }
        
        /* Feature card hover effect */
        .feature-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .feature-card:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.3) !important;
        }
        
        /* About section fade-in animation */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .about-content {
          animation: fadeInUp 0.8s ease-out;
        }
        
        /* Logo responsive sizing */
        .desktop-logo {
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .desktop-logo {
            height: 50px !important;
          }
        }
        @media (max-width: 480px) {
          .desktop-logo {
            height: 45px !important;
          }
          .mobile-logo {
            height: 40px !important;
          }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Contact card hover animation */
        .contact-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .contact-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Responsive Contact Cards - Horizontal on Desktop, Vertical on Mobile */
        @media (min-width: 769px) {
          .contact-cards-wrapper {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            gap: 32px !important;
          }
          .contact-card {
            flex: 1 !important;
            max-width: 380px !important;
          }
        }
        
        @media (max-width: 768px) {
          .contact-cards-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 24px !important;
          }
          .contact-card {
            width: 100% !important;
            max-width: 400px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  containerWithBg: {
    minHeight: '100vh',
    backgroundImage: 'url("/background.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden',
    position: 'relative'
  },
  containerWithoutBg: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #DBEAFE 50%, #EFF6FF 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden'
  },
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '16px 0',
    borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
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
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logoImage: {
    height: '60px',
    width: 'auto',
    objectFit: 'contain'
  },
  mobileLogoImage: {
    height: '48px',
    width: 'auto',
    objectFit: 'contain'
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
    transition: 'backgroundColor 0.3s ease',
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
    transition: 'all 0.3s ease',
    marginTop: '20px',
    marginBottom: '20px',
    minWidth: '160px',
    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
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
    display: 'flex',
    alignItems: 'center'
  },
  mobileCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#4B5563',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'backgroundColor 0.3s ease'
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
    cursor: 'pointer'
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
    transition: 'backgroundColor 0.3s ease',
    marginTop: '20px',
    width: '100%'
  },
  heroSection: {
    paddingTop: 'clamp(100px, 15vh, 140px)',
    paddingBottom: 'clamp(40px, 8vh, 80px)',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px'
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
    color: '#374151',
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
    transition: 'all 0.3s ease',
    width: 'auto',
    minWidth: '160px',
    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
  },
  aboutSection: {
    padding: 'clamp(40px, 10vh, 80px) 20px',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px',
    position: 'relative',
    overflow: 'hidden'
  },
  aboutGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(29, 78, 216, 0.12) 50%, rgba(37, 99, 235, 0.08) 100%)',
    backdropFilter: 'blur(5px)',
    zIndex: 0
  },
  aboutContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '800px',
    margin: '0 auto'
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    color: '#111827',
    marginBottom: 'clamp(16px, 4vw, 24px)',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #111827 0%, #2563EB 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
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
    borderTop: '2px solid rgba(37, 99, 235, 0.2)',
    margin: '40px auto',
    maxWidth: 'min(600px, 90%)',
    width: '100%'
  },
  featuresSection: {
    padding: 'clamp(40px, 8vh, 80px) 20px',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px',
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(29, 78, 216, 0.1) 50%, rgba(37, 99, 235, 0.05) 100%)',
    backdropFilter: 'blur(5px)'
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
    background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
    borderRadius: '16px',
    padding: 'clamp(20px, 5vw, 28px) clamp(16px, 4vw, 24px)',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center',
    border: 'none',
    cursor: 'pointer',
    color: 'white'
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'inline-block',
    animation: 'fadeInUp 0.5s ease-out'
  },
  featureTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#FFFFFF',
    marginBottom: '12px',
    fontWeight: '600',
    borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
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
  // Professional Contact Section Styles
  contactSection: {
    padding: 'clamp(60px, 12vh, 100px) 20px',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    scrollMarginTop: '80px',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
    position: 'relative'
  },
  contactContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto'
  },
  contactHeader: {
    textAlign: 'center',
    marginBottom: 'clamp(40px, 8vh, 60px)'
  },
  contactSubtitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#4B5563',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6'
  },
  contactCardsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '32px',
    flexWrap: 'wrap'
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    flex: '1',
    minWidth: '280px',
    maxWidth: '380px',
    border: '1px solid rgba(37, 99, 235, 0.1)'
  },
  contactCardInner: {
    padding: 'clamp(24px, 5vw, 32px)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid #F0F4F8'
  },
  avatarContainer: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F0F4F8',
    flexShrink: 0
  },
  researcherImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  },
  avatarIcon: {
    fontSize: '32px',
    color: '#FFFFFF'
  },
  contactName: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#111827',
    fontWeight: '700',
    margin: 0,
    lineHeight: '1.3'
  },
  contactRole: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#2563EB',
    fontWeight: '500',
    margin: '4px 0 0 0'
  },
  contactInfoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '28px'
  },
  contactInfoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px'
  },
  infoIcon: {
    fontSize: '20px',
    minWidth: '32px',
    color: '#2563EB',
    fontWeight: '500'
  },
  infoContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  infoLink: {
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    color: '#374151',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    wordBreak: 'break-all',
    fontWeight: '500',
    cursor: 'pointer',
    ':hover': {
      color: '#2563EB'
    }
  },
  messageButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '8px',
    letterSpacing: '0.5px'
  }
};

export default LandingPage;