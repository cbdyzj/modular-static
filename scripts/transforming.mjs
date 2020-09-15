import { readFile } from 'fs/promises'
import build from 'esbuild'
import less from 'less'
import postcss from 'postcss'
import modules from 'postcss-modules'

async function readFileAsString(filePath) {
    const data = await readFile(filePath, { encoding: 'utf8' })
    return data.toString('utf8')
}

export async function transformEsm(filePath) {
    if (!transformEsm.service) {
        transformEsm.service = await build.startService()
    }
    const input = await readFileAsString(filePath)
    const { js, warnings } = await transformEsm.service.transform(input, {
        target: 'es2018',
        loader: 'jsx'
    })
    if (warnings.length) {
        console.warn(...warnings)
    }
    return js
}

export async function transformCss(filePath) {
    function inject(css, exports = {}) {
        const injection = `
        ;(function (encoded) {
                var text = decodeURIComponent(encoded);
                var style = document.createElement('style');
                style.innerHTML = text;
                document.head.appendChild(style);
            })("${encodeURIComponent(css)}");
        export default ${JSON.stringify(exports)};`
        return injection.replace(/\s+/g, ' ').trim()
    }

    const input = await readFileAsString(filePath)
    const { css } = await less.render(input)
    // modular css
    if (/.+\.module\.less$/.test(filePath)) {
        const exports = {}
        const plugins = [
            modules({
                getJSON(srcFilename, json, destFilename) {
                    Object.assign(exports, json)
                }
            }),
        ]
        const options = { from: filePath, to: undefined }
        const { css: modularCss } = await postcss(plugins).process(css, options)
        return inject(modularCss, exports)
    }
    // non modular CSS
    else {
        return inject(css)
    }
}
