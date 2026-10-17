import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { compareReports, summarizeReport } from '../../plugins/nimbou-skills/skills/nuxt-performance/scripts/compare-lighthouse.mjs'

function report(overrides = {}) {
  return {
    lighthouseVersion: '13.5.0', fetchTime: '2026-10-17T12:00:00Z',
    requestedUrl: 'https://example.test/texts', finalDisplayedUrl: 'https://example.test/texts',
    configSettings: { formFactor: 'mobile', throttlingMethod: 'simulate',
      throttling: { rttMs: 150, throughputKbps: 1638, cpuSlowdownMultiplier: 4 },
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1.75, disabled: false },
      disableStorageReset: false },
    categories: { performance: { score: .85 }, accessibility: { score: 1 } },
    audits: { 'largest-contentful-paint': { numericValue: 4206 },
      'first-contentful-paint': { numericValue: 930 }, 'total-blocking-time': { numericValue: 0 },
      'cumulative-layout-shift': { numericValue: 0 } },
    ...overrides,
  }
}

test('keeps units, unavailable categories and zero metrics distinct', () => {
  const result = summarizeReport(report())
  assert.equal(result.scores.performance, 85)
  assert.equal(result.scores.seo, null)
  assert.equal(result.metrics.lcpMs, 4206)
  assert.equal(result.metrics.tbtMs, 0)
  assert.equal(result.metrics.cls, 0)
  assert.equal(result.metrics.speedIndexMs, null)
})

test('accepts a PageSpeed API envelope and compares raw values', () => {
  const before = report()
  const after = report({ categories: { performance: { score: .99 } },
    audits: { 'largest-contentful-paint': { numericValue: 1371 } } })
  const result = compareReports({ lighthouseResult: before }, after)
  assert.equal(result.configurationComparable, true)
  assert.equal(result.observedDelta.performancePoints, 14)
  assert.equal(result.observedDelta.lcpMs, -2835)
  assert.equal(result.observedDelta.tbtMs, null)
  assert.ok(result.contextChecksRequired.length > 0)
})

test('different URL, profile, throttle, storage policy or Lighthouse version is not comparable', () => {
  for (const after of [
    report({ finalDisplayedUrl: 'https://example.test/other' }),
    report({ lighthouseVersion: '14.0.0' }),
    report({ configSettings: { ...report().configSettings, formFactor: 'desktop' } }),
    report({ configSettings: { ...report().configSettings, throttling: { rttMs: 0 } } }),
    report({ configSettings: { ...report().configSettings, disableStorageReset: true } }),
  ]) {
    const result = compareReports(report(), after)
    assert.equal(result.configurationComparable, false)
    assert.ok(result.reasons.length > 0)
    assert.equal(result.observedDelta, null)
  }
})

test('unknown configuration and runtime failures cannot produce a positive comparison', () => {
  assert.equal(compareReports(report({ configSettings: {} }), report({ configSettings: {} })).configurationComparable, false)
  const failed = report({ runtimeError: { code: 'NO_FCP', message: 'No paint' }, categories: {} })
  assert.equal(compareReports(report(), failed).configurationComparable, false)
  assert.equal(summarizeReport(failed).scores.performance, null)
  assert.throws(() => summarizeReport({}), /Lighthouse/)
})

test('profile object key order does not affect comparison', () => {
  const after = report()
  after.configSettings.throttling = { cpuSlowdownMultiplier: 4, throughputKbps: 1638, rttMs: 150 }
  assert.equal(compareReports(report(), after).configurationComparable, true)
})

test('localized display strings are not substituted for numeric measurements', () => {
  const result = summarizeReport(report({ audits: { 'largest-contentful-paint': { displayValue: '1,4 s' } } }))
  assert.equal(result.metrics.lcpMs, null)
  assert.equal(summarizeReport(report({ categories: { performance: { score: 0 } } })).scores.performance, 0)
})

test('CLI emits JSON and distinguishes comparison, configuration mismatch and invalid input', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nimbou-lighthouse-'))
  const script = fileURLToPath(new URL('../../plugins/nimbou-skills/skills/nuxt-performance/scripts/compare-lighthouse.mjs', import.meta.url))
  const before = join(directory, 'before.json'), after = join(directory, 'after.json')
  const run = () => spawnSync(process.execPath, [script, before, after], { encoding: 'utf8', windowsHide: true })
  try {
    await writeFile(before, JSON.stringify(report()))
    await writeFile(after, JSON.stringify({ lighthouseResult: report() }))
    let result = run()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout).observedDelta.lcpMs, 0)
    await writeFile(after, JSON.stringify(report({ lighthouseVersion: '14.0.0' })))
    result = run()
    assert.equal(result.status, 2, result.stderr)
    assert.equal(JSON.parse(result.stdout).observedDelta, null)
    await writeFile(after, '{invalid JSON')
    result = run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(basename(directory).startsWith('nimbou-lighthouse-'))
    await rm(directory, { recursive: true, force: true })
  }
})
