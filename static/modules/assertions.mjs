export function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message || 'condition expected true')
    }
}

export function assertEquals(expected, actual, message) {
    if (expected !== actual) {
        throw new Error(message || `${expected} expected equals ${actual}`)
    }
}

