/*
 * env-format.test.js: Unit tests for winston.format.envFormat
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const { LEVEL, MESSAGE } = require('triple-beam');
const winston = require('../../../lib/winston');
const { format } = winston;
const helpers = require('../../helpers');

function createInfo(level, message) {
  const info = { level, message };
  info[LEVEL] = level;
  return info;
}

describe('format.envFormat', function () {
  let originalNodeEnv;

  beforeEach(function () {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(function () {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('is a function', function () {
    assume(format.envFormat).is.a('function');
  });

  it('returns an object with transform method', function () {
    const envFmt = format.envFormat();
    assume(envFmt).is.an('object');
    assume(envFmt.transform).is.a('function');
  });

  it('uses colorized simple format in development environment', function () {
    process.env.NODE_ENV = 'development';
    const envFmt = format.envFormat();
    const info = createInfo('info', 'hello world');
    const result = envFmt.transform({ ...info });

    assume(result[LEVEL]).equals('info');
    assume(result.level).includes('\u001b');
    assume(result[MESSAGE]).is.a('string');
    assume(result[MESSAGE]).includes('hello world');
  });

  it('uses JSON format in production environment', function () {
    process.env.NODE_ENV = 'production';
    const envFmt = format.envFormat();
    const info = createInfo('info', 'hello world');
    const result = envFmt.transform({ ...info });

    assume(result[LEVEL]).equals('info');
    assume(result[MESSAGE]).is.a('string');
    assume(result[MESSAGE]).startsWith('{');

    const parsed = JSON.parse(result[MESSAGE]);
    assume(parsed.level).equals('info');
    assume(parsed.message).equals('hello world');
  });

  it('defaults to development format when NODE_ENV is not set', function () {
    delete process.env.NODE_ENV;
    const envFmt = format.envFormat();
    const info = createInfo('info', 'hello world');
    const result = envFmt.transform({ ...info });

    assume(result.level).includes('\u001b');
  });

  it('supports custom format mappings via options.formats', function () {
    process.env.NODE_ENV = 'test';
    const customFormat = format.envFormat({
      formats: {
        test: format.json(),
        development: format.simple()
      }
    });

    const info = createInfo('info', 'test message');
    const result = customFormat.transform({ ...info });

    assume(result[MESSAGE]).startsWith('{');
    const parsed = JSON.parse(result[MESSAGE]);
    assume(parsed.message).equals('test message');
  });

  it('falls back to development format for unknown environments', function () {
    process.env.NODE_ENV = 'staging';
    const envFmt = format.envFormat({
      formats: {
        production: format.json()
      }
    });

    const info = createInfo('info', 'staging test');
    const result = envFmt.transform({ ...info });

    assume(result.level).includes('\u001b');
  });

  it('can be combined with other formats using format.combine', function () {
    process.env.NODE_ENV = 'production';
    const combined = format.combine(
      format.timestamp(),
      format.envFormat()
    );

    const info = createInfo('info', 'with timestamp');
    const result = combined.transform({ ...info });

    assume(result[MESSAGE]).startsWith('{');
    const parsed = JSON.parse(result[MESSAGE]);
    assume(parsed.timestamp).is.a('string');
    assume(parsed.message).equals('with timestamp');
  });

  it('works correctly with winston logger', function (done) {
    process.env.NODE_ENV = 'production';
    const logger = helpers.createLogger(function (info) {
      assume(info[MESSAGE]).startsWith('{');
      const parsed = JSON.parse(info[MESSAGE]);
      assume(parsed.level).equals('info');
      assume(parsed.message).equals('logger test');
      done();
    }, format.envFormat());

    logger.info('logger test');
  });

  it('works with custom development format', function () {
    process.env.NODE_ENV = 'development';
    const customFmt = format.envFormat({
      formats: {
        development: format.printf(info => `DEV: ${info.message}`)
      }
    });

    const info = createInfo('info', 'custom dev');
    const result = customFmt.transform({ ...info });

    assume(result[MESSAGE]).equals('DEV: custom dev');
  });

  it('preserves additional metadata in production', function () {
    process.env.NODE_ENV = 'production';
    const envFmt = format.envFormat();
    const info = createInfo('info', 'with meta');
    info.userId = 123;
    info.requestId = 'abc';

    const result = envFmt.transform({ ...info });
    const parsed = JSON.parse(result[MESSAGE]);

    assume(parsed.userId).equals(123);
    assume(parsed.requestId).equals('abc');
  });
});
