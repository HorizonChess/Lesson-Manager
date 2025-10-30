#!/usr/bin/env tsx
/**
 * Script to find all hardcoded text color classes that need dark mode variants
 *
 * Usage: npx tsx scripts/find-hardcoded-colors.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const SRC_DIR = join(process.cwd(), 'src')

// Patterns to look for
const PROBLEMATIC_PATTERNS = [
  // Hardcoded gray/slate without dark: variant
  /className="[^"]*\btext-(gray|slate)-(100|200|300|400|500|600|700|800|900)\b(?![^"]*dark:)/g,
  // Hardcoded black/white without dark: variant
  /className="[^"]*\btext-(black|white)\b(?![^"]*dark:)/g,
  // Border colors without dark: variant
  /className="[^"]*\bborder-(gray|slate)-(100|200|300|400|500|600|700|800|900)\b(?![^"]*dark:)/g,
  // Background colors without dark: variant
  /className="[^"]*\bbg-(gray|slate)-(100|200|300|400|500|600|700|800|900)\b(?![^"]*dark:)/g,
]

interface Finding {
  file: string
  line: number
  content: string
  issue: string
}

const findings: Finding[] = []

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    PROBLEMATIC_PATTERNS.forEach((pattern, patternIndex) => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const issueType = patternIndex === 0 ? 'text color' :
                           patternIndex === 1 ? 'text color (black/white)' :
                           patternIndex === 2 ? 'border color' :
                           'background color'

          findings.push({
            file: filePath.replace(SRC_DIR, 'src'),
            line: index + 1,
            content: line.trim(),
            issue: `Hardcoded ${issueType} without dark: variant`
          })
        })
      }
    })
  })
}

function scanDirectory(dir: string) {
  const items = readdirSync(dir)

  items.forEach(item => {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath)
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      scanFile(fullPath)
    }
  })
}

// Run the scan
console.log('🔍 Scanning for hardcoded text colors...\n')
scanDirectory(SRC_DIR)

// Group by file
const byFile = findings.reduce((acc, finding) => {
  if (!acc[finding.file]) acc[finding.file] = []
  acc[finding.file].push(finding)
  return acc
}, {} as Record<string, Finding[]>)

// Print results
console.log(`Found ${findings.length} instances across ${Object.keys(byFile).length} files\n`)

Object.entries(byFile)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([file, fileFindings]) => {
    console.log(`\n📄 ${file} (${fileFindings.length} issues)`)
    fileFindings.forEach(f => {
      console.log(`   Line ${f.line}: ${f.issue}`)
      console.log(`   ${f.content.substring(0, 100)}${f.content.length > 100 ? '...' : ''}`)
    })
  })

// Summary by category
console.log('\n\n📊 Summary by Component Directory:')
const byDir = Object.keys(byFile).reduce((acc, file) => {
  const dir = file.split('/').slice(0, 3).join('/')
  if (!acc[dir]) acc[dir] = 0
  acc[dir] += byFile[file].length
  return acc
}, {} as Record<string, number>)

Object.entries(byDir)
  .sort(([, a], [, b]) => b - a)
  .forEach(([dir, count]) => {
    console.log(`   ${dir}: ${count} issues`)
  })

console.log(`\n✅ Total: ${findings.length} hardcoded color instances found`)
console.log(`\n💡 Recommendation: Use semantic classes from themeSurfaces.css:`)
console.log(`   - text-soft (secondary text)`)
console.log(`   - text-soft-muted (tertiary text)`)
console.log(`   - Or add dark: variants to all hardcoded colors`)
