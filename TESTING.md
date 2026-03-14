# Web MIDI API Testing Guide

## Overview

This directory contains comprehensive tests for the Web MIDI API browser support audit. The test suite validates functionality across different browsers and ensures reliable MIDI device communication.

## Test Files

- **`web-midi-test.html`** - Standalone HTML test suite for manual browser testing
- **`web-midi-test.spec.js`** - Automated Jest tests for core functionality
- **`package.json`** - Test dependencies and scripts
- **`jest.setup.js`** - Jest configuration and mocks

## Running Tests

### Prerequisites

```bash
npm install
```

### Manual Browser Testing

1. Open `web-midi-test.html` directly in each browser
2. Test with and without MIDI devices connected
3. Verify hot-plug behavior by connecting/disconnecting devices
4. Document results in `FINDINGS_0.1.md`

### Automated Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Start local server for browser testing
npm run serve
```

## Test Coverage

### API Support Detection
- ✅ Web MIDI API availability detection
- ✅ Browser-specific error handling
- ✅ Permission flow validation

### MIDI Access Management
- ✅ Access request handling
- ✅ Error scenarios (denial, security errors)
- ✅ Access state management

### Port Detection
- ✅ Input/output port enumeration
- ✅ Port state display (connected/disconnected)
- ✅ Port metadata (name, manufacturer, ID)

### Message Handling
- ✅ Real-time MIDI message reception
- ✅ Message formatting and display
- ✅ Timestamp accuracy
- ✅ Memory management (message limits)

### Hot-plug Detection
- ✅ Device connection events
- ✅ Device disconnection events
- ✅ State change propagation
- ✅ UI updates on port changes

### UI Functionality
- ✅ Button interactions
- ✅ Log clearing
- ✅ Status updates
- ✅ Error display

## Browser Testing Matrix

### Chrome/Edge
- Native Web MIDI API support
- Standard permission flow
- Full hot-plug support

### Firefox
- Requires `dom.webmidi.enabled` in `about:config`
- Permission flow after flag enablement
- Hot-plug support varies by version

### Safari
- Limited or no Web MIDI API support
- Requires fallback strategy testing

## Test Data

### Mock MIDI Messages
- Note On/Off events
- Control Change messages
- Pitch Bend data
- System Exclusive (if enabled)

### Mock Devices
- Piano controllers (88-key range)
- Drum controllers (GM percussion mapping)
- Generic MIDI interfaces

## Continuous Integration

Add to your CI pipeline:

```yaml
- name: Run Web MIDI Tests
  run: |
    npm install
    npm run test:coverage
```

## Debugging

Enable debug mode:

```bash
DEBUG_TESTS=true npm test
```

This will enable console warnings and errors during test execution.

## Expected Results

### Successful Test Run
- All API detection tests pass
- MIDI access requests work (with hardware)
- Port enumeration displays connected devices
- Message logging captures incoming MIDI data
- Hot-plug events trigger correctly

### Known Limitations
- Tests requiring actual MIDI hardware are skipped automatically
- Safari support is limited by browser capabilities
- Some timing-dependent tests may need adjustment in CI environments

## Troubleshooting

### MIDI Access Denied
- Check browser permissions
- Ensure devices are connected
- Verify browser-specific requirements (Firefox flags)

### Hot-plug Not Working
- Test with different MIDI interfaces
- Check browser console for errors
- Verify device compatibility

### Test Failures
- Clear browser cache and restart
- Check Jest configuration
- Verify mock setup in `jest.setup.js`

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate mocks in `jest.setup.js`
3. Update this documentation
4. Test across multiple browsers
5. Update coverage reports
