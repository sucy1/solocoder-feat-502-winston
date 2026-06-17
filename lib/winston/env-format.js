'use strict';

const logform = require('logform');
const format = logform.format;

const DEFAULT_ENV = 'development';

class EnvFormat {
  constructor(opts = {}) {
    this.options = opts;
    this.defaultFormats = this._createDefaultFormats();
    this.formats = Object.assign({}, this.defaultFormats, opts.formats || {});
  }

  _createDefaultFormats() {
    return {
      development: format.combine(
        format.colorize(),
        format.simple()
      ),
      production: format.json()
    };
  }

  _getEnvironment() {
    return process.env.NODE_ENV || DEFAULT_ENV;
  }

  _getFormat(env) {
    return this.formats[env] || this.formats[DEFAULT_ENV];
  }

  transform(info, opts) {
    const env = this._getEnvironment();
    const fmt = this._getFormat(env);
    return fmt.transform(info, fmt.options);
  }
}

module.exports = opts => new EnvFormat(opts);

module.exports.Format = EnvFormat;
