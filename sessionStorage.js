const storedSessions = new Map();

const findSession = (id) => {
  return storedSessions.get(id);
};

const saveSession = (id, session) => {
  storedSessions.set(id, session);
  return;
};

const findAllSessions = () => {
  return [...storedSessions.values()];
};

module.exports = {
  findSession,
  saveSession,
  findAllSessions,
};
