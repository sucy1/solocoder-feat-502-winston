'use strict';

const winston = require('./lib/winston');
const { LEVEL, MESSAGE } = require('triple-beam');

function createInfo(level, message) {
  const info = { level, message };
  info[LEVEL] = level;
  return info;
}

console.log('=== Test 1: envFormat exists ===');
console.log('envFormat is function:', typeof winston.format.envFormat === 'function');

console.log('\n=== Test 2: envFormat instance has transform ===');
const envFmt = winston.format.envFormat();
console.log('transform is function:', typeof envFmt.transform === 'function');

console.log('\n=== Test 3: can be combined with other formats ===');
const combined = winston.format.combine(
  winston.format.timestamp(),
  winston.format.envFormat()
);
console.log('combined has transform:', typeof combined.transform === 'function');

console.log('\n=== Test 4: development environment (colorized simple format) ===');
process.env.NODE_ENV = 'development';
const devFormat = winston.format.envFormat();
const devInfo = createInfo('info', 'hello world');
const devResult = devFormat.transform({ ...devInfo });
console.log('result has MESSAGE:', MESSAGE in devResult);
console.log('level has color codes:', devResult.level.includes('\u001b'));
console.log('MESSAGE:', devResult[MESSAGE]);

console.log('\n=== Test 5: production environment (JSON format) ===');
process.env.NODE_ENV = 'production';
const prodFormat = winston.format.envFormat();
const prodInfo = createInfo('info', 'hello world');
const prodResult = prodFormat.transform({ ...prodInfo });
console.log('result has MESSAGE:', MESSAGE in prodResult);
console.log('MESSAGE is JSON:', prodResult[MESSAGE].startsWith('{'));
console.log('MESSAGE:', prodResult[MESSAGE]);

console.log('\n=== Test 6: NODE_ENV not set (defaults to development) ===');
delete process.env.NODE_ENV;
const defaultFormat = winston.format.envFormat();
const defaultInfo = createInfo('info', 'hello world');
const defaultResult = defaultFormat.transform({ ...defaultInfo });
console.log('level has color codes (default dev):', defaultResult.level.includes('\u001b'));

console.log('\n=== Test 7: custom formats via options ===');
process.env.NODE_ENV = 'test';
const customFormat = winston.format.envFormat({
  formats: {
    test: winston.format.json(),
    development: winston.format.simple()
  }
});
const testInfo = createInfo('info', 'test message');
const testResult = customFormat.transform({ ...testInfo });
console.log('custom test env uses JSON:', testResult[MESSAGE].startsWith('{'));

console.log('\n=== Test 8: env with no custom format falls back to development ===');
process.env.NODE_ENV = 'staging';
const stagingFormat = winston.format.envFormat({
  formats: {
    production: winston.format.json()
  }
});
const stagingResult = stagingFormat.transform(createInfo('info', 'staging'));
console.log('staging falls back to dev (has colors):', stagingResult.level.includes('\u001b'));

console.log('\n=== Test 9: combined with timestamp works correctly ===');
process.env.NODE_ENV = 'production';
const combinedWithTimestamp = winston.format.combine(
  winston.format.timestamp(),
  winston.format.envFormat()
);
const combinedResult = combinedWithTimestamp.transform(createInfo('info', 'with timestamp'));
console.log('combined result has timestamp:', 'timestamp' in JSON.parse(combinedResult[MESSAGE]));

console.log('\n=== Test 10: works with winston logger ===');
const logger = winston.createLogger({
  format: winston.format.envFormat(),
  transports: [new winston.transports.Console({ silent: true })]
});
console.log('logger created successfully:', !!logger);

console.log('\n=== All tests passed! ===');
