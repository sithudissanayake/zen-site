/* eslint-disable */
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Remove source-map-loader rule entirely to skip source map processing
  config.module.rules = config.module.rules.filter(rule => {
    if (rule.use && rule.use.loader === 'source-map-loader') {
      return false;
    }
    if (rule.loader && rule.loader.includes('source-map-loader')) {
      return false;
    }
    return true;
  });

  return config;
};