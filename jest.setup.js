/**
 * Jest setup for Web MIDI API tests
 */

// Mock Web MIDI API for testing
Object.defineProperty(global.navigator, 'requestMIDIAccess', {
    writable: true,
    value: jest.fn()
});

// Mock DOM APIs needed for testing
Object.defineProperty(global, 'DOMException', {
    writable: true,
    value: class DOMException extends Error {
        constructor(message, name) {
            super(message);
            this.name = name;
        }
    }
});

// Setup test utilities
global.testUtils = {
    createMockMIDIMessage: (data, timestamp = Date.now()) => ({
        timestamp,
        data: new Uint8Array(data)
    }),
    
    createMockMIDIPort: (id, name, type = 'input', state = 'connected') => ({
        id,
        name,
        manufacturer: 'Test Manufacturer',
        state,
        connection: state === 'connected' ? 'open' : 'closed',
        type,
        onmidimessage: null
    }),
    
    createMockMIDIAccess: (inputs = [], outputs = []) => ({
        inputs: new Map(inputs.map(port => [port.id, port])),
        outputs: new Map(outputs.map(port => [port.id, port])),
        onstatechange: null,
        sysexEnabled: false
    })
};

// Silence console warnings during tests unless debugging
if (!process.env.DEBUG_TESTS) {
    console.warn = jest.fn();
    console.error = jest.fn();
}
