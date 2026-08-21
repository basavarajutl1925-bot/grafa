const ss = require('simple-statistics');

/**
 * Simple Linear Regression for price prediction
 * Uses historical prices to predict future prices
 */
class PricePredictionModel {
  constructor(historicalData) {
    // historicalData: Array of { timestamp, price }
    this.data = historicalData.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Predict price for the next N days
   * @param {number} daysAhead - Number of days to predict
   * @returns {object} - Predicted price and confidence
   */
  predict(daysAhead = 7) {
    if (this.data.length < 2) {
      return { predicted: null, confidence: 0, error: 'Insufficient data' };
    }

    try {
      // Prepare data for linear regression
      const x = this.data.map((d, idx) => idx); // Sequential indices
      const y = this.data.map(d => d.price);

      // Calculate linear regression
      const regression = ss.linearRegression(
        x.map((xi, i) => [xi, y[i]])
      );

      const slope = regression.m;
      const intercept = regression.b;

      // Predict future price
      const nextIndex = this.data.length + daysAhead;
      const predictedPrice = Math.max(0, slope * nextIndex + intercept);

      // Calculate confidence based on R-squared
      const rSquared = ss.rSquared(
        x.map((xi, i) => [xi, y[i]]),
        d => regression.m * d[0] + regression.b
      );

      return {
        predicted: Math.round(predictedPrice * 100) / 100,
        confidence: Math.round(rSquared * 100),
        trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
        daysAhead,
        minPrice: Math.min(...y),
        maxPrice: Math.max(...y),
        avgPrice: Math.round((ss.mean(y) * 100) / 100),
      };
    } catch (error) {
      return { predicted: null, confidence: 0, error: error.message };
    }
  }

  /**
   * Get price statistics
   */
  getStatistics() {
    const prices = this.data.map(d => d.price);
    return {
      mean: Math.round(ss.mean(prices) * 100) / 100,
      median: Math.round(ss.median(prices) * 100) / 100,
      stdDev: Math.round(ss.standardDeviation(prices) * 100) / 100,
      min: Math.min(...prices),
      max: Math.max(...prices),
      variance: Math.round(ss.variance(prices) * 100) / 100,
    };
  }
}

module.exports = PricePredictionModel;
