import { React, ReactDOM } from '/deps.mjs'

export function renderApp(App, elementId) {
    ReactDOM.render(<App/>, document.getElementById(elementId))
}
