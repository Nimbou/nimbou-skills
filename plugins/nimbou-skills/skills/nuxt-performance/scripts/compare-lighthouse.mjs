import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const categoryIds = { performance: 'performance', accessibility: 'accessibility', bestPractices: 'best-practices', seo: 'seo' }
const metricIds = { fcpMs: 'first-contentful-paint', lcpMs: 'largest-contentful-paint', tbtMs: 'total-blocking-time', cls: 'cumulative-layout-shift', speedIndexMs: 'speed-index' }
const valueOrNull = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value

export function summarizeReport(input) {
  const report = input?.lighthouseResult ?? input
  if (!report || typeof report.audits !== 'object' || !report.audits || typeof report.configSettings !== 'object' || !report.configSettings) {
    throw new Error('Invalid Lighthouse report: audits and configSettings are required')
  }
  const config = report.configSettings
  return {
    url: report.finalDisplayedUrl || report.finalUrl || report.requestedUrl || null,
    requestedUrl: report.requestedUrl || null,
    fetchTime: report.fetchTime || null,
    lighthouseVersion: report.lighthouseVersion || null,
    profile: {
      formFactor: config.formFactor ?? null,
      throttlingMethod: config.throttlingMethod ?? null,
      throttling: config.throttling ?? null,
      screenEmulation: config.screenEmulation ?? null,
      disableStorageReset: config.disableStorageReset ?? null,
      channel: config.channel ?? null,
    },
    runtimeError: report.runtimeError ?? null,
    scores: Object.fromEntries(Object.entries(categoryIds).map(([name, id]) => {
      const score = valueOrNull(report.categories?.[id]?.score)
      return [name, score !== null && score <= 1 ? Math.round(score * 100) : null]
    })),
    metrics: Object.fromEntries(Object.entries(metricIds).map(([name, id]) => [name, valueOrNull(report.audits[id]?.numericValue)])),
  }
}

export function compareReports(beforeInput, afterInput) {
  const baseline = summarizeReport(beforeInput), current = summarizeReport(afterInput)
  const reasons = []
  if (!baseline.url || !current.url || baseline.url !== current.url) reasons.push('Different or unknown final URL')
  if (!baseline.lighthouseVersion || baseline.lighthouseVersion !== current.lighthouseVersion) reasons.push('Different or unknown Lighthouse version')
  for (const report of [baseline, current]) {
    if (report.runtimeError) reasons.push('Lighthouse runtime error')
    if (!report.profile.formFactor || !report.profile.throttlingMethod || !report.profile.throttling ||
        !report.profile.screenEmulation || typeof report.profile.disableStorageReset !== 'boolean') {
      reasons.push('Incomplete device, throttle or storage configuration')
    }
    if (report.scores.performance === null || report.metrics.lcpMs === null) reasons.push('Performance or LCP unavailable')
  }
  if (JSON.stringify(stable(baseline.profile)) !== JSON.stringify(stable(current.profile))) reasons.push('Different measurement configuration')
  const configurationComparable = reasons.length === 0
  const delta = (a, b) => a !== null && b !== null ? b - a : null
  return {
    configurationComparable, reasons: [...new Set(reasons)], baseline, current,
    observedDelta: configurationComparable ? {
      performancePoints: delta(baseline.scores.performance, current.scores.performance),
      ...Object.fromEntries(Object.keys(metricIds).map(key => [key, delta(baseline.metrics[key], current.metrics[key])])),
    } : null,
    contextChecksRequired: ['Same content and application state', 'Identified baseline and current build', 'Same measurement origin/tool and cache conditions', 'Representative repeated samples when results vary'],
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node compare-lighthouse.mjs before.json after.json\nExit: 0 matching configuration; 2 incompatible/unknown configuration; 1 invalid input.')
  } else {
    try {
      if (args.length !== 2) throw new Error('Usage: node compare-lighthouse.mjs before.json after.json')
      const inputs = await Promise.all(args.map(async file => JSON.parse(await readFile(file, 'utf8'))))
      const result = compareReports(...inputs)
      console.log(JSON.stringify(result, null, 2))
      process.exitCode = result.configurationComparable ? 0 : 2
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
  }
}
