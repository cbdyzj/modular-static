#!/usr/bin/env node
import { fileURLToPath } from 'url'
import { join as joinPath, dirname } from 'path'
import { createServer } from 'http'

import express from 'express'

import { transformCss, transformEsm } from './transforming.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const staticPath = joinPath(__dirname, '..', 'static')
const nodeModulesPath = joinPath(__dirname, '..', 'node_modules')
const resolveFilePath = (path) => joinPath(staticPath, path)

/**
 *  transform javascript, less
 */
async function transform(req, res, next) {
    // js module
    if (/.+\.(mjs|jsx|ts|tsx)$/.test(req.path)) {
        const transformed = await transformEsm(resolveFilePath(req.path))
        res.contentType('text/javascript')
        res.send(transformed)
    }
    // css module
    else if (/.+\.(less)$/.test(req.path)) {
        const transformed = await transformCss(resolveFilePath(req.path))
        res.contentType('text/javascript')
        res.send(transformed)
    }
    // others
    else {
        next()
    }
}

async function main() {
    const app = express()
    app.use(transform)
    app.use(express.static(staticPath))
    // forward module from modules to node_modules if module absent
    app.use('/modules', express.static(nodeModulesPath))
    createServer(app).listen(3000, () => console.log('serving on 3000'))
}

main().catch(err => console.error(err))

