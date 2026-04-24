/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: false,
        diagnostics: { ignoreCodes: [1343, 2339, 2304, 2307] },
        tsconfig: {
          jsx: 'react-jsx',
          moduleResolution: 'node',
          module: 'commonjs',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
          types: ['jest', '@testing-library/jest-dom', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/services/api$': '<rootDir>/src/__tests__/__mocks__/api.ts',
    '^@/services/supabase$': '<rootDir>/src/__tests__/__mocks__/supabase.ts',
    '^@/services/dashboard\\.service$': '<rootDir>/src/__tests__/__mocks__/dashboard.service.ts',
    '^@/services/employee\\.service$': '<rootDir>/src/__tests__/__mocks__/employee.service.ts',
    '^@/services/machine\\.service$': '<rootDir>/src/__tests__/__mocks__/machine.service.ts',
    '^@/services/contract\\.service$': '<rootDir>/src/__tests__/__mocks__/contract.service.ts',
    '^@/services/job\\.service$': '<rootDir>/src/__tests__/__mocks__/job.service.ts',
    '^@/services/job-report\\.service$': '<rootDir>/src/__tests__/__mocks__/job-report.service.ts',
    '^@/services/transaction\\.service$': '<rootDir>/src/__tests__/__mocks__/transaction.service.ts',
    '^@/services/chat\\.service$': '<rootDir>/src/__tests__/__mocks__/chat.service.ts',
    '^@/services/notification\\.service$': '<rootDir>/src/__tests__/__mocks__/notification.service.ts',
    '^@/services/tool\\.service$': '<rootDir>/src/__tests__/__mocks__/tool.service.ts',
    '^@/services/checklist\\.service$': '<rootDir>/src/__tests__/__mocks__/checklist.service.ts',
    '^@react-pdf/renderer$': '<rootDir>/src/__tests__/__mocks__/react-pdf-renderer.ts',
    '^@/.*\\.(png|jpg|jpeg|gif|svg|webp|ico)$': '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|webp|ico)$': '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
}

module.exports = config
