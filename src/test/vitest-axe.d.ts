import type { AxeMatchers } from 'vitest-axe/matchers';
import '@vitest/expect';

declare module '@vitest/expect' {
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

export {};