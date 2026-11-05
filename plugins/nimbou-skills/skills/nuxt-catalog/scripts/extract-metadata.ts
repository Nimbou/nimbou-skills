// Isolated, sequential batch worker. Never import this from the semantic scan.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse, parseCache } from '@vue/compiler-sfc'
import ts from 'typescript'
import { createCheckerByJson } from 'vue-component-meta'

const { projectRoot, files } = JSON.parse(readFileSync(0, 'utf8')) as {
  projectRoot: string
  files: string[]
}

// Preserve project aliases/options and ambient declarations, but avoid making
// every page, test and component a TypeScript root in every worker.
const checker = createCheckerByJson(projectRoot, {
  extends: join(projectRoot, 'tsconfig.json').replaceAll('\\', '/'),
  include: [...files.map((file) => file.replaceAll('\\', '/')), '**/*.d.ts', '.nuxt/nuxt.d.ts'],
  exclude: ['node_modules', 'dist', '.output', 'coverage', 'test', 'tests', 'e2e'],
}, { forceUseTs: true, schema: false })

function readScriptSetupProps(filePath: string) {
  const { descriptor } = parse(readFileSync(filePath, 'utf8'), { filename: filePath, sourceMap: false })
  parseCache.clear()
  if (!descriptor.scriptSetup) return []
  const source = ts.createSourceFile(`${filePath}.ts`, descriptor.scriptSetup.content, ts.ScriptTarget.ES2022, true)
  let propsType: ts.TypeNode | undefined
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineProps') {
      propsType = node.typeArguments?.[0]
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (!propsType || !ts.isTypeLiteralNode(propsType)) return []
  return propsType.members.flatMap((member) => {
    if (!ts.isPropertySignature(member) || !member.type || !member.name) return []
    return [{
      name: member.name.getText(source).replace(/^['"]|['"]$/g, ''),
      type: member.type.getText(source),
      required: !member.questionToken,
      default: null,
    }]
  })
}

const results = files.map((file) => {
  try {
    const raw = checker.getComponentMeta(file)
    const props = raw.props.filter((prop) => !prop.global).map((prop) => ({
      name: prop.name,
      type: prop.type ?? 'unknown',
      required: Boolean(prop.required),
      default: prop.default ?? null,
    }))
    return {
      props: props.length ? props : readScriptSetupProps(file),
      emits: raw.events.map((event) => ({ name: event.name })),
      slots: raw.slots.map((slot) => ({ name: slot.name, description: slot.description ?? '' })),
      exposed: raw.exposed.map((item) => ({ name: item.name })),
    }
  } catch (error) {
    // Preserve the existing syntax-only fallback, but make degradation visible.
    console.error(`[WARN] Metadata fallback for ${file}: ${(error as Error).message}`)
    return { props: readScriptSetupProps(file), emits: [], slots: [], exposed: [] }
  }
})
process.stdout.write(JSON.stringify(results))
