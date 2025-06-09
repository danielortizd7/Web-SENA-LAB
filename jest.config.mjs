export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/test/__mocks__/fileMock.js',
    '^@/env$': '<rootDir>/src/test/__mocks__/envMock.js',
    'react-router-dom': '<rootDir>/src/test/__mocks__/react-router-dom.js'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native.*|@react-native.*)/)'
  ],
  globals: {
    'import.meta': {
      env: {
        VITE_BACKEND_URL: 'http://localhost:3000'
      }
    }
  }
};
