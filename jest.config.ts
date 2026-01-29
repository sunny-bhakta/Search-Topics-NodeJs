import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@search/core-engine$': '<rootDir>/packages/core-engine/src',
    '^@search/data-pipeline$': '<rootDir>/packages/data-pipeline/src',
    '^@search/ux-experience$': '<rootDir>/packages/ux-experience/src',
    '^@search/api-gateway$': '<rootDir>/packages/api-gateway/src'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.base.json'
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  clearMocks: true
};

export default config;
