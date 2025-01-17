import { CircleCIAPIClient, CircleCIClientDefaults } from './api';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import { join } from 'path';

export const REPO_ROOT = join(__dirname, '..', '..');
const JOB_METRICS_PATH = join(REPO_ROOT, 'scripts', 'cci', 'job.data.json');
const TEST_TIMINGS_PATH = join(REPO_ROOT, 'scripts', 'cci', 'test-timings.data.json');

export const ClientDefaults: CircleCIClientDefaults = {
  defaultBranch: 'main',
  defaultWorkflow: 'build_test_deploy',
  vcs: 'github',
  projectSlug: 'aws-amplify',
  projectName: 'amplify-codegen',
};

export const getCCIClient = () => {
  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set. Export it to your terminal, then try again.');
  }
  return new CircleCIAPIClient(process.env.CIRCLECI_TOKEN, ClientDefaults);
}

export function saveJobMetrics(data: any): any {
  console.log(`saving job metrics to ${JOB_METRICS_PATH}`);
  fs.writeFileSync(JOB_METRICS_PATH, JSON.stringify(data, null, 2));
}

export function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
  return glob.sync(pattern, { cwd: dir });
}

export function getTimingsFromJobsData() {
  const jobData = JSON.parse(fs.readFileSync(JOB_METRICS_PATH, 'utf-8'));
  const jobTimings: Map<string, number> = new Map();
  for (let job of jobData.items) {
    const testName = job.name;
    const duration = Math.floor(job.metrics.duration_metrics.median / 60);
    if (jobTimings.has(testName)) {
      jobTimings.set(testName, Math.max(jobTimings.get(testName)!, duration));
    } else {
      jobTimings.set(testName, duration);
    }
  }
  return jobTimings;
}

export const getTestNameFromPath = (testSuitePath: string): string => {
  const startIndex = testSuitePath.lastIndexOf('/') + 1;
  const endIndex = testSuitePath.lastIndexOf('.test');
  return testSuitePath
    .substring(startIndex, endIndex)
    .split('.')
    .join('-')
    + '-e2e-test';
};

export function saveTestTimings(data: any): any {
  console.log(`saving timing data to ${TEST_TIMINGS_PATH}`);
  fs.writeFileSync(TEST_TIMINGS_PATH, JSON.stringify(data, null, 2));
}