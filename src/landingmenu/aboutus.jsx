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
          A web-based mathematical literacy hub on finding equations of the line to address learners' mathematical reasoning, problem-solving skills and application of linear equations.
        </p>
      </div>

      {/* Vision Section - NOW FIRST */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Our Vision</h2>
          <p style={styles.sectionText}>
            We envision a learning environment where mathematical literacy in linear equations becomes a foundation for understanding real-life situations rather than a barrier to learning. Through innovative digital tools and effective instructional approaches, MathLit Hub aims to develop confident learners who can interpret, construct, and apply equations of a line in meaningful contexts, empowering them to succeed in mathematics and beyond.
          </p>
        </div>
      </section>

      {/* Mission Section - NOW SECOND */}
      <section style={styles.section}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Our Mission</h2>
          <p style={styles.sectionText}>
            At MathLit Hub, our mission is to enhance students' mathematical literacy in finding the equation of a line by providing accessible, engaging, and effective digital learning experiences. The platform aims to support learners in understanding key concepts such as slope, intercepts, and linear relationships through interactive lessons, collaborative activities, and real-life applications. We believe that every student can develop strong problem-solving skills in mathematics when guided by meaningful tasks, appropriate tools, and a supportive learning environment.
          </p>
        </div>
      </section>

      {/* Learning Objectives Section */}
      <section style={styles.learningObjectivesSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Learning Objectives</h2>
          <div style={styles.objectivesGrid}>
            <div style={styles.objectiveCard}>
              <div style={styles.objectiveNumber}>01</div>
              <div style={styles.objectiveIcon}>🎯</div>
              <h3 style={styles.objectiveTitle}>Identify Methods</h3>
              <p style={styles.objectiveText}>
                Identify the different methods in finding the equation of a line, including two-point form, point-slope form, slope-intercept form, and x and y intercepts.
              </p>
            </div>

            <div style={styles.objectiveCard}>
              <div style={styles.objectiveNumber}>02</div>
              <div style={styles.objectiveIcon}>📐</div>
              <h3 style={styles.objectiveTitle}>Solve Problems</h3>
              <p style={styles.objectiveText}>
                Solve problems involving slope, intercepts, and linear equations accurately using appropriate mathematical procedures and formulas.
              </p>
            </div>

            <div style={styles.objectiveCard}>
              <div style={styles.objectiveNumber}>03</div>
              <div style={styles.objectiveIcon}>💡</div>
              <h3 style={styles.objectiveTitle}>Develop Skills</h3>
              <p style={styles.objectiveText}>
                Develop mathematical literacy, critical thinking, and problem-solving skills through interactive and web-based learning activities provided in the MathLit Hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.offeringsGrid}>
          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🎯</div>
            <h3 style={styles.offerTitle}>Missions</h3>
            <p style={styles.offerText}>
              Learning missions aligned with the selected competencies.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🎮</div>
            <h3 style={styles.offerTitle}>Game Zone</h3>
            <p style={styles.offerText}>
              Gamified activities designed to reinforce students' understanding of linear equations.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🤝</div>
            <h3 style={styles.offerTitle}>Collaboration Corner</h3>
            <p style={styles.offerText}>
              Structured group tasks that encourage students to work collaboratively in solving mathematical problems and explaining their reasoning.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>📊</div>
            <h3 style={styles.offerTitle}>Progress Tracker</h3>
            <p style={styles.offerText}>
              Monitor scores, progress, and mission completion.
            </p>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.offerIcon}>🏆</div>
            <h3 style={styles.offerTitle}>Achievements and Rewards</h3>
            <p style={styles.offerText}>
              Earn badges and rewards as you master new concepts.
            </p>
          </div>
        </div>
      </section>

      {/* About the Researchers Section */}
      <section style={styles.researchersSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitleWhite}>About the Researchers</h2>
          <div style={styles.researchersGrid}>
            {/* Researcher 1 - Sheila Ann Bacunawa Gevera */}
            <div style={styles.researcherCard}>
              <div style={styles.researcherAvatar}>
                <img 
                  src="/sheila.jpg" 
                  alt="Sheila Ann Bacunawa Gevera" 
                  style={styles.researcherImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style={styles.avatarInitials}>SG</div>';
                  }}
                />
              </div>
              <h3 style={styles.researcherName}>SHEILA ANN BACUNAWA GEVERA</h3>
              <p style={styles.researcherTitle}>Researcher, Biliran Province State University</p>
              <div style={styles.researcherContact}>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📞</span>
                  <span style={styles.contactText}>09483426236</span>
                </div>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>✉️</span>
                  <span style={styles.contactText}>geverasheila27@gmail.com</span>
                </div>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📘</span>
                  <span style={styles.contactText}>Sheila Ann Bacunawa Gevera</span>
                </div>
              </div>
              <p style={styles.researcherBio}>
                Sheila Ann Bacunawa Gevera is a third-year student taking up Bachelor of Secondary Education major in Mathematics at Biliran Province State University. She is actively engaged in developing innovative and technology-integrated instructional materials that promote mathematical literacy among learners. Her research interests focus on enhancing students' conceptual understanding of linear equations through interactive, learner-centered approaches. As one of the proponents of the MathLit Hub, she contributes to the design and development of meaningful digital learning experiences that support problem-solving, collaboration, and real-life application of mathematical concepts.
              </p>
            </div>

            {/* Researcher 2 - Louie Lyn Dela Cruz */}
            <div style={styles.researcherCard}>
              <div style={styles.researcherAvatar}>
                <img 
                  src="/lou.jpg" 
                  alt="Louie Lyn Dela Cruz" 
                  style={styles.researcherImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style={styles.avatarInitials}>LC</div>';
                  }}
                />
              </div>
              <h3 style={styles.researcherName}>LOUIE LYN DELA CRUZ</h3>
              <p style={styles.researcherTitle}>Researcher, Biliran Province State University</p>
              <div style={styles.researcherContact}>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📞</span>
                  <span style={styles.contactText}>09481234567</span>
                </div>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>✉️</span>
                  <span style={styles.contactText}>louielyn.delacruz@bpsu.edu.ph</span>
                </div>
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📘</span>
                  <span style={styles.contactText}>Louie Lyn Dela Cruz</span>
                </div>
              </div>
              <p style={styles.researcherBio}>
                Louie Lyn Dela Cruz is a third-year Bachelor of Secondary Education major in Mathematics student at Biliran Province State University. She is committed to improving mathematics education through the integration of digital platforms and innovative teaching strategies. Her academic focus centers on strengthening students' mathematical literacy, particularly in understanding and constructing linear equations. As a co-developer of the MathLit Hub, she plays a key role in structuring interactive modules and collaborative activities that aim to make mathematics more engaging, accessible, and relevant to learners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={styles.ctaSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.ctaTitle}>Ready to Start Your Math Journey?</h2>
          <p style={styles.ctaText}>
            Join learners who are mastering linear equations through missions, games, and collaborative activities with MathLit Hub.
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
              Get Started
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
              Back to Home
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
        
        .researcher-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        
        .objective-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .objective-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 30px -10px rgba(37, 99, 235, 0.3);
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
    letterSpacing: '-0.02em',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    color: '#FFFFFF',
    opacity: '0.95',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: '1.6',
    textAlign: 'justify'
  },
  section: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#FFFFFF'
  },
  sectionAlt: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#F9FAFB'
  },
  learningObjectivesSection: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)',
  },
  researchersSection: {
    padding: 'clamp(60px, 10vh, 80px) 20px',
    backgroundColor: '#1E1B4B',
    backgroundImage: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)'
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
  sectionTitleWhite: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    color: '#FFFFFF',
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
    textAlign: 'justify'
  },
  // Learning Objectives Styles
  objectivesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
    gap: 'clamp(24px, 4vw, 32px)',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  objectiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: 'clamp(28px, 5vw, 36px)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  objectiveNumber: {
    position: 'absolute',
    top: '16px',
    right: '20px',
    fontSize: '48px',
    fontWeight: '800',
    color: 'rgba(37, 99, 235, 0.08)',
    letterSpacing: '-0.02em'
  },
  objectiveIcon: {
    fontSize: '56px',
    marginBottom: '20px',
    display: 'inline-block'
  },
  objectiveTitle: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    color: '#111827',
    marginBottom: '16px',
    fontWeight: '700'
  },
  objectiveText: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#4B5563',
    lineHeight: '1.7',
    textAlign: 'justify'
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
    lineHeight: '1.6',
    textAlign: 'justify'
  },
  researchersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
    gap: 'clamp(32px, 5vw, 48px)',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  researcherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: 'clamp(28px, 5vw, 36px)',
    boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    textAlign: 'center',
    cursor: 'pointer'
  },
  researcherAvatar: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center'
  },
  researcherImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #FFFFFF',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  },
  avatarInitials: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: '700',
    color: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  },
  researcherName: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    color: '#111827',
    marginBottom: '8px',
    fontWeight: '700'
  },
  researcherTitle: {
    fontSize: '14px',
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: '20px',
    letterSpacing: '0.5px'
  },
  researcherContact: {
    backgroundColor: '#F3F4F6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    fontSize: '14px',
    color: '#4B5563',
    borderBottom: '1px solid #E5E7EB'
  },
  contactIcon: {
    fontSize: '16px',
    minWidth: '24px'
  },
  contactText: {
    wordBreak: 'break-all'
  },
  researcherBio: {
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    color: '#6B7280',
    lineHeight: '1.7',
    textAlign: 'justify'
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
    margin: '0 auto 30px auto',
    textAlign: 'center'
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