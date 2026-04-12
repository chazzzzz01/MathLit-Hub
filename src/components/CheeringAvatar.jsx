// CheeringAvatar.jsx (3D version)
import React, { useEffect, useState } from 'react';
import { Avatoon } from 'avatoon';

const CheeringAvatar = () => {
  const [avatarGoal, setAvatarGoal] = useState("Normal");
  const [showBubbles, setShowBubbles] = useState(true);

  useEffect(() => {
    const animationCycle = ["Normal", "Happy", "Surprised", "Love", "Normal"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % animationCycle.length;
      setAvatarGoal(animationCycle[index]);
      
      if (animationCycle[index] === "Happy" || animationCycle[index] === "Surprised") {
        setShowBubbles(true);
        setTimeout(() => setShowBubbles(false), 3000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.avatarWrapper}>
        <Avatoon
          glbUrl="https://models.readyplayer.me/64b9f8e1f4d9e6b3e8c3a1b2.glb"
          goal={avatarGoal}
          style={styles.avatar}
        />
      </div>
      {showBubbles && (
        <>
          <div style={{...styles.bubble, ...styles.bubble1}}></div>
          <div style={{...styles.bubble, ...styles.bubble2}}></div>
          <div style={{...styles.bubble, ...styles.bubble3}}></div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    zIndex: 999,
  },
  avatarWrapper: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  bubble: {
    position: "absolute",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    background: "rgba(135, 206, 235, 0.7)",
    animation: "float 3s infinite ease-in-out",
  },
  bubble1: { left: "10px", bottom: "0", animationDelay: "0s" },
  bubble2: { left: "40px", bottom: "10px", animationDelay: "1s" },
  bubble3: { left: "70px", bottom: "5px", animationDelay: "2s" },
};

export default CheeringAvatar;