const axios = require('axios');

class KalshiAPI {
  constructor(baseUrl = 'https://api.elections.kalshi.com/trade-api/v2') {
    this.baseUrl = baseUrl;
  }

  async get(path, params = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await axios.get(url, {
      params,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  async getMarketByTicker(ticker) {
    return this.get(`/markets/${ticker}`);
  }

  async getEventByTicker(eventTicker) {
    return this.get(`/events/${eventTicker}`);
  }

  async getSeriesByTicker(seriesTicker) {
    return this.get(`/series/${seriesTicker}`);
  }

  async searchMarkets(keyword, limit = 10) {
    return this.get('/markets', { keyword, limit });
  }
}

module.exports = KalshiAPI;


