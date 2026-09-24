import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('Chrome DevTools setup preserves marketplace and plugin sections', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nimbou-codex-config-'))
  const config = join(directory, 'config.toml')
  const wrapper = join(directory, 'chrome-devtools-mcp-wayland')
  const otherSections = '\n[marketplaces.nimbou-skills]\nsource_type = "local"\nsource = "/repo"\n\n[plugins."nimbou-skills@nimbou-skills"]\nenabled = true\n'

  try {
    writeFileSync(config, `[mcp_servers.chrome-devtools]\ncommand = "old"\nargs = []\n${otherSections}`)

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = spawnSync('bash', [join(root, 'scripts/setup-chrome-devtools-wrapper.sh')], {
        env: { ...process.env, CODEX_CONFIG_PATH: config, CHROME_DEVTOOLS_MCP_WRAPPER_PATH: wrapper },
        encoding: 'utf8',
      })
      assert.equal(result.status, 0, result.stderr)
      const content = readFileSync(config, 'utf8')
      assert.match(content, /\[mcp_servers\.chrome-devtools\]\ncommand = ".*chrome-devtools-mcp-wayland"\nargs = \[\]/)
      assert.ok(content.includes(otherSections), 'marketplace and plugin settings must survive setup')
      assert.equal((content.match(/\[mcp_servers\.chrome-devtools\]/g) ?? []).length, 1)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
