import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.logo} onClick={() => navigate("/")}>
            MathLit Hub
          </div>
          <button 
            style={styles.backButton}
            onClick={() => navigate("/")}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={styles.heroSection}>
        <h1 style={styles.title}>About MathLit Hub</h1>
        <p style={styles.subtitle}>
          Empowering Students Through Mathematical Excellence
        </p>
      </div>

      {/* Mission Section */}
      <section style={styles.section}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Our Mission</h2>
          <p style={styles.sectionText}>
            At MathLit Hub, our mission is to transform mathematics education by making it 
            accessible, engaging, and effective for every learner. We believe that every 
            student has the potential to excel in mathematics when provided with the right 
            tools, guidance, and motivation.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Our Vision</h2>
          <p style={styles.sectionText}>
            We envision a world where mathematical literacy is not a barrier but a bridge 
            to endless opportunities. Through innovative technology and proven pedagogical 
            approaches, we're creating a global community of confident, mathematically 
            empowered learners.
          </p>
        </div>
      </section>

      {/* What We Offer Section - Updated */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>What We Offer</h2>
        <div style={styles.offeringsGrid}>
          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🎯</div>
            <h3 style={styles.offerTitle}>Engaging Missions</h3>
            <p style={styles.offerText}>
              Complete exciting math missions that challenge your skills and unlock new levels of mathematical understanding.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🎮</div>
            <h3 style={styles.offerTitle}>Fun & Enjoyable Games</h3>
            <p style={styles.offerText}>
              Learn math through interactive games that make solving problems fun, addictive, and rewarding.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>📊</div>
            <h3 style={styles.offerTitle}>Real-time Analytics</h3>
            <p style={styles.offerText}>
              Comprehensive progress tracking and detailed insights to help students and 
              educators identify areas for improvement.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🤝</div>
            <h3 style={styles.offerTitle}>Collaborative Learning</h3>
            <p style={styles.offerText}>
              Interactive group activities and peer-to-peer learning opportunities that 
              foster teamwork and communication skills.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🏆</div>
            <h3 style={styles.offerTitle}>Achievement System</h3>
            <p style={styles.offerText}>
              Earn badges, certificates, and rewards as you complete missions and master new concepts.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>⭐</div>
            <h3 style={styles.offerTitle}>Daily Challenges</h3>
            <p style={styles.offerText}>
              Take on new challenges every day to keep your math skills sharp and earn bonus rewards.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Why Choose MathLit Hub?</h2>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Complete engaging missions with increasing difficulty levels</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Enjoyable games that make learning math fun and interactive</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Research-based curriculum aligned with educational standards</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Track your progress and see your improvement over time</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Compete with friends and earn achievements</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.checkmark}>✓</span>
              <span>Cross-platform compatibility (Web, Mobile, Tablet)</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - New */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Choose Your Mission</h3>
            <p style={styles.stepText}>Select from a variety of math missions tailored to your skill level</p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Play & Learn</h3>
            <p style={styles.stepText}>Complete enjoyable games and challenges to master concepts</p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Earn Rewards</h3>
            <p style={styles.stepText}>Collect badges, unlock achievements, and level up</p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>4</div>
            <h3 style={styles.stepTitle}>Track Progress</h3>
            <p style={styles.stepText}>Monitor your improvement and see your math skills grow</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={styles.ctaSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.ctaTitle}>Ready to Start Your Math Journey?</h2>
          <p style={styles.ctaText}>
            Join thousands of students who are already mastering mathematics through missions and games with MathLit Hub.
          </p>
          <div style={styles.ctaButtons}>
            <button 
              style={styles.primaryButton}
              onClick={() => navigate("/signin")}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
            >
              Get Started Free
            </button>
            <button 
              style={styles.secondaryButton}
              onClick={() => navigate("/")}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2024 MathLit Hub. All rights reserved.</p>
      </footer>

      <style>{`
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
        
        section {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .offer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
          transition: all 0.3s ease;
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
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    padding: '16px 0',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
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
    alignItems: 'center'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2563EB',
    cursor: 'pointer',
    letterSpacing: '-0.5px'
  },
  backButton: {
    backgroundColor: 'transparent',
    color: '#4B5563',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  heroSection: {
    padding: '80px 20px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  title: {
    fontSize: 'clamp(36px, 8vw, 52px)',
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: '20px',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    color: '#FFFFFF',
    opacity: '0.95',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: '1.6'
  },
  section: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#FFFFFF'
  },
  sectionAlt: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#F9FAFB'
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    color: '#111827',
    marginBottom: 'clamp(30px, 5vh, 40px)',
    fontWeight: '600',
    textAlign: 'center'
  },
  sectionText: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#4B5563',
    lineHeight: '1.8',
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center'
  },
  offeringsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
    gap: 'clamp(24px, 4vw, 32px)',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: 'clamp(24px, 5vw, 32px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    textAlign: 'center',
    border: '1px solid #E5E7EB',
    cursor: 'pointer'
  },
  offerIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  offerTitle: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    color: '#111827',
    marginBottom: '12px',
    fontWeight: '600'
  },
  offerText: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#6B7280',
    lineHeight: '1.6'
  },
  featuresList: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#4B5563'
  },
  checkmark: {
    color: '#2563EB',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
    gap: 'clamp(24px, 4vw, 32px)',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  stepCard: {
    backgroundColor: '#2563EB',
    borderRadius: '12px',
    padding: 'clamp(24px, 5vw, 32px)',
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    color: 'white'
  },
  stepNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: '16px'
  },
  stepTitle: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    marginBottom: '12px',
    fontWeight: '600'
  },
  stepText: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    opacity: '0.95',
    lineHeight: '1.6'
  },
  ctaSection: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#2563EB',
    textAlign: 'center'
  },
  ctaTitle: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    color: '#FFFFFF',
    marginBottom: '20px',
    fontWeight: '600'
  },
  ctaText: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#FFFFFF',
    opacity: '0.95',
    marginBottom: '30px',
    maxWidth: '600px',
    margin: '0 auto 30px auto'
  },
  ctaButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    color: '#2563EB',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '500',
    border: '2px solid #FFFFFF',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  footer: {
    backgroundColor: '#111827',
    padding: '30px 20px',
    textAlign: 'center'
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: '14px'
  }
};

export default AboutUs;