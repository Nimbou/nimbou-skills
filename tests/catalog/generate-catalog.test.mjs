import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..', '..')
function runCatalog(args, options) {
  return spawnSync(process.execPath, [resolve(root, 'node_modules/tsx/dist/cli.mjs'),
    resolve(root, 'plugins/nimbou-skills/skills/nuxt-catalog/scripts/generate-catalog.ts'), ...args], options)
}

const fixtureRoot = resolve(root, 'tests/fixtures/catalog')

function withFixtureProject(callback, { includeBroken = false } = {}) {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'nimbou-skills-catalog-'))
  cpSync(fixtureRoot, projectRoot, { recursive: true })

  if (!includeBroken) {
    rmSync(resolve(projectRoot, 'components/broken'), { recursive: true, force: true })
  }

  try {
    callback(projectRoot)
  } finally {
    rmSync(projectRoot, { recursive: true, force: true })
  }
}

test('full catalog generates aggregate and per-component metadata', () => {
  withFixtureProject((projectRoot) => {
    const result = runCatalog(['--full', '--batch-size=1'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Extracted technical metadata: 1\/2/)
    assert.match(result.stdout, /Extracted technical metadata: 2\/2/)

    const aggregate = JSON.parse(
      readFileSync(resolve(projectRoot, 'components.meta.json'), 'utf8'),
    )
    const perComponent = JSON.parse(
      readFileSync(
        resolve(projectRoot, 'components/ProjectsProjectStatusBadge.meta.json'),
        'utf8',
      ),
    )
    const compatibilityAggregate = JSON.parse(
      readFileSync(
        resolve(projectRoot, '.generated/component-catalog/components.meta.json'),
        'utf8',
      ),
    )

    assert.equal(aggregate.components.length, 2)
    assert.equal(aggregate.metadataMode, 'full')
    assert.equal(aggregate.components[1].name, 'ProjectsProjectStatusBadge')
    assert.equal(aggregate.components[1].catalog.domain, 'projects')
    assert.equal(aggregate.components[1].meta.props[0].name, 'status')
    assert.equal(aggregate.components[0].catalog.status, 'experimental')
    assert.equal(perComponent.catalog.category, 'display')
    assert.equal(compatibilityAggregate.totalComponents, 2)
    assert.equal(compatibilityAggregate.components[0].filePath, 'components/shared/StatusChip.vue')
    assert.equal(compatibilityAggregate.components[0].status, 'experimental')
    assert.deepEqual(
      compatibilityAggregate.indexes.byCategory.display,
      ['ProjectsProjectStatusBadge', 'SharedStatusChip'],
    )
    assert.deepEqual(compatibilityAggregate.indexes.byDomain.projects, ['ProjectsProjectStatusBadge'])
  })
})

test('catalog validate mode reports broken fixtures without writing output', () => {
  withFixtureProject((projectRoot) => {
    const result = runCatalog(['--validate'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 1)
    assert.match(result.stdout, /Missing <catalog lang="json"> block/)
    assert.match(result.stdout, /Field "title" must be a non-empty string/)
    assert.match(result.stdout, /Field "useWhen" must be a non-empty string/)
  }, { includeBroken: true })
})

test('nb-catalog validates the current project root via bundled tsx wrapper', () => {
  withFixtureProject((projectRoot) => {
    const result = spawnSync(process.execPath, [resolve(root, 'bin', 'nb-catalog'), 'validate'], {
      cwd: projectRoot,
      encoding: 'utf8',
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Validated 2 component files/)
    const generated = spawnSync(process.execPath, [resolve(root, 'bin', 'nb-catalog'), 'generate'], {
      cwd: projectRoot, encoding: 'utf8',
    })
    assert.equal(generated.status, 0, generated.stderr)
    assert.equal(JSON.parse(readFileSync(resolve(projectRoot, 'components.meta.json'))).metadataMode, 'semantic')
  })
})

test('catalog domain filter emits only the requested domain', () => {
  withFixtureProject((projectRoot) => {
    const result = runCatalog(['projects', '--full', '--batch-size=1'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Extracted technical metadata: 1\/1/)

    const aggregate = JSON.parse(
      readFileSync(resolve(projectRoot, 'components.meta.json'), 'utf8'),
    )

    assert.deepEqual(
      aggregate.components.map((component) => component.name),
      ['ProjectsProjectStatusBadge'],
    )
  }, { includeBroken: true })
})

test('catalog domain filter fails cleanly for an unknown domain', () => {
  withFixtureProject((projectRoot) => {
    const result = runCatalog(['missing-domain'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 1)
    assert.match(result.stdout, /Unknown domain filter: missing-domain/)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), false)
  })
})

test('catalog removes stale generated metadata after a failed full generation run', () => {
  withFixtureProject((projectRoot) => {
    const firstRun = runCatalog([], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(firstRun.status, 0, firstRun.stderr)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), true)
    assert.equal(
      existsSync(resolve(projectRoot, 'components/ProjectsProjectStatusBadge.meta.json')),
      true,
    )

    mkdirSync(resolve(projectRoot, 'components/broken'), { recursive: true })
    cpSync(
      resolve(fixtureRoot, 'components/broken/MalformedCatalog.vue'),
      resolve(projectRoot, 'components/broken/MalformedCatalog.vue'),
    )

    const secondRun = runCatalog([], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(secondRun.status, 1)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), false)
    assert.equal(
      existsSync(resolve(projectRoot, '.generated/component-catalog/components.meta.json')),
      false,
    )
    assert.equal(
      existsSync(resolve(projectRoot, 'components/ProjectsProjectStatusBadge.meta.json')),
      false,
    )
  })
})

test('default generation stays semantic and derives consumers without prefix matches', () => {
  withFixtureProject((projectRoot) => {
    // Semantic mode must not require a usable TypeScript configuration.
    writeFileSync(resolve(projectRoot, 'tsconfig.json'), '{ invalid json')
    mkdirSync(resolve(projectRoot, 'pages'))
    writeFileSync(resolve(projectRoot, 'pages/index.vue'), `<template>
      <ProjectsProjectStatusBadge/><ProjectsProjectStatusBadge />
      <shared-status-chip/><ProjectsProjectStatusBadgeExtra />
    </template>`)
    writeFileSync(resolve(projectRoot, 'pages/prefix.vue'),
      '<template><ProjectsProjectStatusBadge-other/><shared-status-chip-other/></template>')
    const result = runCatalog([], {
      env: { ...process.env, CATALOG_ROOT: projectRoot, NODE_OPTIONS: '--max-old-space-size=192' },
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    const aggregate = JSON.parse(readFileSync(resolve(projectRoot, 'components.meta.json')))
    assert.equal(aggregate.metadataMode, 'semantic')
    for (const component of aggregate.components) {
      assert.deepEqual(component.meta, { props: [], emits: [], slots: [], exposed: [] })
      assert.deepEqual(component.catalog.usedBy, ['pages/index.vue'])
    }
  })
})

test('invalid batch size and unknown options fail without removing existing outputs', () => {
  withFixtureProject((projectRoot) => {
    writeFileSync(resolve(projectRoot, 'components.meta.json'), 'preserve me')
    for (const args of [['--full', '--batch-size=0'], ['--wat']]) {
      const result = runCatalog(args, {
        env: { ...process.env, CATALOG_ROOT: projectRoot }, encoding: 'utf8',
      })
      assert.equal(result.status, 1)
      assert.equal(readFileSync(resolve(projectRoot, 'components.meta.json'), 'utf8'), 'preserve me')
    }
  })
})
