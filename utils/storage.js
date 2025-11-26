const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/userSettings.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));
  }
}

function readSettings() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw || '{}');
}

function writeSettings(settings) {
  ensureDataFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(settings, null, 2));
}

function getUserSettings(userId) {
  const settings = readSettings();
  if (!settings[userId]) {
    settings[userId] = {
      backgroundUrl: null,
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      accentColor: '#00ff88',
    };
    writeSettings(settings);
  }
  return settings[userId];
}

function updateUserSettings(userId, updates) {
  const settings = readSettings();
  const current = settings[userId] || {
    backgroundUrl: null,
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#00ff88',
  };
  settings[userId] = { ...current, ...updates };
  writeSettings(settings);
  return settings[userId];
}

module.exports = {
  getUserSettings,
  updateUserSettings,
};


