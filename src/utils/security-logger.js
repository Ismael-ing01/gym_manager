const logSecurityEvent = (event, metadata = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...metadata,
  };

  console.warn("[SECURITY]", JSON.stringify(entry));
};

module.exports = {
  logSecurityEvent,
};
