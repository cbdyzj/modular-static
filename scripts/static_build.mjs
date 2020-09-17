#!/usr/bin/env node
import { fileURLToPath } from 'url'
import { join as joinPath, dirname, basename } from 'path'
import { readdir, stat, mkdir, copyFile, writeFile } from 'fs/promises'

import { transformCss, transformEsm } from './transforming.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const staticPath = joinPath(__dirname, '..', 'static')
const nodeModulesPath = joinPath(__dirname, '..', 'node_modules')
const distPath = joinPath(__dirname, '..', 'dist')

const deps = []

function collectDeps(text) {
    const r = /\s*import\s+("(.+?)"|'(.+?)')\s*/g
    let a
    while (a = r.exec(text)) {
        deps.push(a[2] || a[3])
    }
}

async function compileFile(srcFilePath, destFilePath) {
    // js module
    if (/.+\.(mjs|jsx|ts|tsx)$/.test(srcFilePath)) {
        const transformed = await transformEsm(srcFilePath)
        if (/deps(\..*)?\.mjs/.test(basename(srcFilePath))) {
            collectDeps(transformed)
        }
        await writeFile(destFilePath, transformed)
    }
    // css module
    else if (/.+\.(less)$/.test(srcFilePath)) {
        const transformed = await transformCss(srcFilePath)
        await writeFile(destFilePath, transformed)
    }
    // others
    else {
        await copyFile(srcFilePath, destFilePath)
    }
}

async function traverseDir(srcPath, destPath) {
    const files = await readdir(srcPath)
    for (const file of files) {
        const srcFilePath = joinPath(srcPath, file)
        const destFilePath = joinPath(destPath, file)
        const fileStats = await stat(srcFilePath)
        if (fileStats.isDirectory()) {
            await mkdir(destFilePath, { recursive: true })
            await traverseDir(srcFilePath, destFilePath)
        } else if (fileStats.isFile()) {
            await compileFile(srcFilePath, destFilePath)
        } else {
            throw new Error('Unexpected file type')
        }
    }
}

async function copyDeps() {
    if (!deps.length) {
        return
    }
    for (const dep of deps) {
        const r = /^\/modules\//
        if (!r.test(dep)) {
            continue
        }
        const path = dep.replace(r, '')
        const srcPath = joinPath(nodeModulesPath, path)
        const destPath = joinPath(distPath, 'modules', path)
        await mkdir(dirname(destPath), { recursive: true })
        await copyFile(srcPath, destPath)
    }

}

async function main() {
    await mkdir(distPath, { recursive: true })
    await traverseDir(staticPath, distPath)
    // copy modules if required
    await copyDeps()
    transformEsm.service.stop()
}

main().catch(err => console.error(err))
