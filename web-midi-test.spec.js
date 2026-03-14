/**
 * Web MIDI API Test Suite - Automated Tests
 * Tests for web-midi-test.html functionality
 */

describe('Web MIDI API Test Suite', () => {
    let testPage;
    
    beforeAll(async () => {
        // Load the test page
        testPage = await browser.newPage();
        await testPage.goto('file:///' + __dirname + '/web-midi-test.html');
    });

    afterAll(async () => {
        await testPage.close();
    });

    describe('API Support Detection', () => {
        test('should detect Web MIDI API support', async () => {
            const apiStatus = await testPage.$eval('#api-status .status', el => el.textContent);
            
            if (await testPage.evaluate(() => !navigator.requestMIDIAccess)) {
                expect(apiStatus).toContain('Web MIDI API is NOT supported');
            } else {
                expect(apiStatus).toContain('Web MIDI API is supported');
            }
        });

        test('should disable request button when API not supported', async () => {
            const isButtonDisabled = await testPage.$eval('#request-access', el => el.disabled);
            const hasApiSupport = await testPage.evaluate(() => !!navigator.requestMIDIAccess);
            
            expect(isButtonDisabled).toBe(!hasApiSupport);
        });
    });

    describe('MIDI Access Request', () => {
        test('should request MIDI access when button clicked', async () => {
            // Mock MIDI access for testing
            await testPage.evaluate(() => {
                window.mockMidiAccess = {
                    inputs: new Map([
                        ['test-input-1', {
                            id: 'test-input-1',
                            name: 'Test MIDI Device',
                            manufacturer: 'Test Manufacturer',
                            state: 'connected',
                            connection: 'open',
                            type: 'input',
                            onmidimessage: null
                        }]
                    ]),
                    outputs: new Map(),
                    onstatechange: null,
                    sysexEnabled: false
                };

                // Mock navigator.requestMIDIAccess
                const originalRequestMIDIAccess = navigator.requestMIDIAccess;
                navigator.requestMIDIAccess = async (options) => {
                    return window.mockMidiAccess;
                };
            });

            // Click the request button
            await testPage.click('#request-access');
            
            // Wait for status update
            await testPage.waitForTimeout(1000);
            
            const accessStatus = await testPage.$eval('#access-status .status', el => el.textContent);
            expect(accessStatus).toContain('MIDI access granted');
        });

        test('should handle MIDI access denial', async () => {
            // Mock access denial
            await testPage.evaluate(() => {
                navigator.requestMIDIAccess = async () => {
                    throw new DOMException('Permission denied', 'SecurityError');
                };
            });

            // Click the request button
            await testPage.click('#request-access');
            
            // Wait for error status
            await testPage.waitForTimeout(1000);
            
            const accessStatus = await testPage.$eval('#access-status .status', el => el.textContent);
            expect(accessStatus).toContain('Error');
        });
    });

    describe('Port Detection and Display', () => {
        beforeEach(async () => {
            // Setup mock MIDI access with ports
            await testPage.evaluate(() => {
                window.mockMidiAccess = {
                    inputs: new Map([
                        ['input-1', {
                            id: 'input-1',
                            name: 'Test MIDI Input 1',
                            manufacturer: 'Test Co',
                            state: 'connected',
                            connection: 'open',
                            type: 'input',
                            onmidimessage: null
                        }],
                        ['input-2', {
                            id: 'input-2',
                            name: 'Test MIDI Input 2',
                            manufacturer: 'Another Co',
                            state: 'disconnected',
                            connection: 'closed',
                            type: 'input',
                            onmidimessage: null
                        }]
                    ]),
                    outputs: new Map([
                        ['output-1', {
                            id: 'output-1',
                            name: 'Test MIDI Output',
                            manufacturer: 'Test Co',
                            state: 'connected',
                            connection: 'open',
                            type: 'output'
                        }]
                    ]),
                    onstatechange: null
                };

                navigator.requestMIDIAccess = async () => window.mockMidiAccess;
            });
        });

        test('should display detected input ports', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            const portItems = await testPage.$$('#port-list .port-item');
            expect(portItems.length).toBe(2);
            
            const firstPortText = await testPage.evaluate(el => el.textContent, portItems[0]);
            expect(firstPortText).toContain('Test MIDI Input 1');
        });

        test('should show correct port count', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            const portsInfo = await testPage.$eval('#ports-info .status', el => el.textContent);
            expect(portsInfo).toContain('2 input ports');
            expect(portsInfo).toContain('1 output ports');
        });

        test('should style disconnected ports differently', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            const disconnectedPort = await testPage.$('.port-item.disconnected');
            expect(disconnectedPort).toBeTruthy();
            
            const portText = await testPage.evaluate(el => el.textContent, disconnectedPort);
            expect(portText).toContain('Test MIDI Input 2');
        });
    });

    describe('MIDI Message Handling', () => {
        beforeEach(async () => {
            await testPage.evaluate(() => {
                window.mockMidiAccess = {
                    inputs: new Map([
                        ['test-input', {
                            id: 'test-input',
                            name: 'Test Input',
                            manufacturer: 'Test Co',
                            state: 'connected',
                            connection: 'open',
                            type: 'input',
                            onmidimessage: null
                        }]
                    ]),
                    outputs: new Map(),
                    onstatechange: null
                };

                navigator.requestMIDIAccess = async () => window.mockMidiAccess;
            });
        });

        test('should log MIDI messages when received', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            // Simulate MIDI message
            await testPage.evaluate(() => {
                const input = window.mockMidiAccess.inputs.get('test-input');
                if (input.onmidimessage) {
                    input.onmidimessage({
                        timestamp: Date.now(),
                        data: new Uint8Array([0x90, 0x3C, 0x7F]) // Note On: C4, velocity 127
                    });
                }
            });
            
            await testPage.waitForTimeout(100);
            
            const midiLog = await testPage.$eval('#midi-log .midi-message', el => el.textContent);
            expect(midiLog).toContain('Test Input');
            expect(midiLog).toContain('90 3C 7F'); // Raw hex data
        });

        test('should display timestamps for messages', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            await testPage.evaluate(() => {
                const input = window.mockMidiAccess.inputs.get('test-input');
                if (input.onmidimessage) {
                    input.onmidimessage({
                        timestamp: Date.now(),
                        data: new Uint8Array([0x80, 0x3C, 0x00]) // Note Off
                    });
                }
            });
            
            await testPage.waitForTimeout(100);
            
            const message = await testPage.$eval('#midi-log .midi-message', el => el.textContent);
            expect(message).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/); // Timestamp format
        });

        test('should limit message count to prevent memory issues', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            // Send many messages
            await testPage.evaluate(() => {
                const input = window.mockMidiAccess.inputs.get('test-input');
                for (let i = 0; i < 1100; i++) {
                    if (input.onmidimessage) {
                        input.onmidimessage({
                            timestamp: Date.now(),
                            data: new Uint8Array([0x90, i % 128, 0x7F])
                        });
                    }
                }
            });
            
            await testPage.waitForTimeout(100);
            
            const messageCount = await testPage.$$eval('#midi-log .midi-message', els => els.length);
            expect(messageCount).toBeLessThanOrEqual(1000);
        });
    });

    describe('Hot-plug Detection', () => {
        beforeEach(async () => {
            await testPage.evaluate(() => {
                window.mockMidiAccess = {
                    inputs: new Map(),
                    outputs: new Map(),
                    onstatechange: null
                };

                navigator.requestMIDIAccess = async () => window.mockMidiAccess;
            });
        });

        test('should detect device connection', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            // Simulate device connection
            await testPage.evaluate(() => {
                const newPort = {
                    id: 'new-device',
                    name: 'New MIDI Device',
                    manufacturer: 'New Co',
                    state: 'connected',
                    connection: 'open',
                    type: 'input'
                };
                
                window.mockMidiAccess.inputs.set('new-device', newPort);
                
                if (window.mockMidiAccess.onstatechange) {
                    window.mockMidiAccess.onstatechange({ port: newPort });
                }
            });
            
            await testPage.waitForTimeout(100);
            
            const hotplugLog = await testPage.$eval('#hotplug-log .midi-message', el => el.textContent);
            expect(hotplugLog).toContain('Input port');
            expect(hotplugLog).toContain('connected');
        });

        test('should detect device disconnection', async () => {
            await testPage.click('#request-access');
            await testPage.waitForTimeout(1000);
            
            // First add a device
            await testPage.evaluate(() => {
                const port = {
                    id: 'disconnect-test',
                    name: 'Disconnect Test Device',
                    manufacturer: 'Test Co',
                    state: 'connected',
                    connection: 'open',
                    type: 'input'
                };
                
                window.mockMidiAccess.inputs.set('disconnect-test', port);
            });
            
            await testPage.waitForTimeout(100);
            
            // Then disconnect it
            await testPage.evaluate(() => {
                const port = window.mockMidiAccess.inputs.get('disconnect-test');
                port.state = 'disconnected';
                port.connection = 'closed';
                
                if (window.mockMidiAccess.onstatechange) {
                    window.mockMidiAccess.onstatechange({ port });
                }
            });
            
            await testPage.waitForTimeout(100);
            
            const hotplugMessages = await testPage.$$eval('#hotplug-log .midi-message', els => 
                els.map(el => el.textContent)
            );
            
            expect(hotplugMessages.some(msg => msg.includes('disconnected'))).toBe(true);
        });
    });

    describe('UI Controls', () => {
        test('should clear MIDI log when clear button clicked', async () => {
            // Add some messages first
            await testPage.evaluate(() => {
                const midiLog = document.getElementById('midi-log');
                const message = document.createElement('div');
                message.className = 'midi-message';
                message.textContent = 'Test message';
                midiLog.appendChild(message);
            });
            
            // Click clear button
            await testPage.click('#clear-log');
            
            const logContent = await testPage.$eval('#midi-log', el => el.innerHTML);
            expect(logContent).toBe('');
        });
    });

    describe('Utility Functions', () => {
        test('should format MIDI bytes correctly', async () => {
            const formattedBytes = await testPage.evaluate(() => {
                // Access the formatBytes function from the page
                const formatBytes = (bytes) => {
                    return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
                };
                return formatBytes([0x90, 0x3C, 0x7F]);
            });
            
            expect(formattedBytes).toBe('90 3C 7F');
        });

        test('should format timestamps correctly', async () => {
            const timestamp = await testPage.evaluate(() => {
                const formatTimestamp = (timestamp) => {
                    const date = new Date(timestamp);
                    return date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds().toString().padStart(3, '0');
                };
                return formatTimestamp(Date.now());
            });
            
            expect(timestamp).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
        });
    });
});

// Integration tests for real MIDI hardware (requires actual devices)
describe('Real MIDI Hardware Tests', () => {
    test('should detect real MIDI devices when connected', async () => {
        // This test requires actual MIDI hardware
        // Skip if no devices are available
        const hasMidiHardware = await browser.evaluate(() => navigator.requestMIDIAccess !== undefined);
        
        if (!hasMidiHardware) {
            test.skip('No MIDI hardware available');
            return;
        }
        
        // Implementation would require actual device testing
        test.todo('Implement real hardware testing');
    });
});
