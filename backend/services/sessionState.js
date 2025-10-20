// electron/services/sessionState.js

/**
 * This module acts as a simple, shared state container for the main process
 * to avoid circular dependencies between modules that need to know the
 * currently logged-in user.
 */
let currentTechnician = null;

module.exports = {
  setCurrentTechnician: (tech) => {
    console.log(`Session state updated for technician: ${tech?.name || 'null'}`);
    currentTechnician = tech;
  },
  getCurrentTechnician: () => {
    return currentTechnician;
  },
};