import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Load user-specific data
      loadUserData(parsedUser);
    }
  }, []);

  // Load user-specific data from localStorage
  const loadUserData = (user) => {
    if (user && user.email) {
      const storageKey = `user_data_${user.email}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setUserData(JSON.parse(savedData));
      } else {
        // Initialize empty user data structure
        const initialData = {
          progress: {
            missionsCompleted: 0,
            mathProblemsCompleted: 0,
            storiesRead: 0,
            scienceExperiments: 0,
            wordsLearned: 0,
            perfectScores: 0,
            speedRuns: 0,
            learningStreak: 0
          },
          achievements: [],
          gameStats: {
            totalPlayTime: 0,
            totalGamesPlayed: 0,
            totalAchievements: 0,
            overallProgress: 0
          },
          gameProgress: {},
          settings: {},
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          totalXP: 0,
          totalCoins: 0,
          unlockedAchievements: 0
        };
        setUserData(initialData);
        localStorage.setItem(storageKey, JSON.stringify(initialData));
      }
    }
  };

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      loadUserData(user);
    } else {
      localStorage.removeItem('user');
      setUserData(null);
    }
  }, [user]);

  // Update user-specific data
  const updateUserData = (newData) => {
    if (user && user.email) {
      const updatedData = { ...userData, ...newData };
      setUserData(updatedData);
      const storageKey = `user_data_${user.email}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      return true;
    }
    return false;
  };

  // Clear user data (logout)
  const logout = () => {
    if (user && user.email) {
      // Update last login time on logout
      const storageKey = `user_data_${user.email}`;
      const currentData = localStorage.getItem(storageKey);
      if (currentData) {
        const parsed = JSON.parse(currentData);
        parsed.lastLogout = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    }
    setUser(null);
    setUserData(null);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      userData, 
      updateUserData,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};