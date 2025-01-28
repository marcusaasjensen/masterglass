const WebSocket = require('ws');

const TEST_ID = 'test-id';
const SERVER_URL = 'ws://192.168.229.31:8080';

const ws = new WebSocket(`${SERVER_URL}?clientType=${TEST_ID}`);

// Buffer pour stocker l'audio reçu
let audioBuffer = null;

ws.on('open', () => {
    console.log('Connected to server as test client');
    
    // Message d'identification
    ws.send(JSON.stringify({
        type: 'identification',
        clientId: TEST_ID,
        deviceInfo: {
            brand: 'Test',
            modelName: 'TestDevice',
            osName: 'Node',
            osVersion: process.version
        }
    }));
});

ws.on('message', async (data) => {
    try {
        // Si c'est un message JSON
        if (typeof data === 'string' || data instanceof Buffer && data[0] === '{'.charCodeAt(0)) {
            const message = JSON.parse(data.toString());
            console.log('Received message:', message);

            if (message.type === 'callStart') {
                console.log('Receiving call from:', message.senderId);
            }
            
            if (message.type === 'callEnd') {
                console.log('Call ended from:', message.senderId);
                audioBuffer = null;
            }
        }
        // Si c'est de l'audio binaire
        else {
            console.log('Received audio chunk, size:', data.length);
            audioBuffer = data;

            // Attendre 2 secondes puis renvoyer l'audio
            setTimeout(() => {
                if (audioBuffer) {
                    console.log('Sending back audio chunk');
                    ws.send(audioBuffer);
                }
            }, 2000);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from server');
});

// Gérer la fermeture propre
process.on('SIGINT', () => {
    console.log('Closing connection...');
    ws.close();
    process.exit();
});