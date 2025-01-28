const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const TEST_ID = 'test-id';
const SERVER_URL = 'ws://192.168.229.31:8080';
const TARGET_APP_ID = 'App';

let audioData;
try {
    audioData = fs.readFileSync(path.join(__dirname, 'test.wav')).toString('base64');
} catch (error) {
    console.error('Erreur lors de la lecture du fichier audio:', error);
    process.exit(1);
}

const ws = new WebSocket(SERVER_URL);
let isCallAccepted = false;

ws.on('open', () => {
    console.log('Connected to server as test client');
    
    ws.send(JSON.stringify({
        clientId: TEST_ID,
    }));

    // Initier l'appel après 5 secondes
    setTimeout(() => {
        console.log('Initiating call to App...');
        ws.send(JSON.stringify({
            clientId: TEST_ID,
            recipientIds: [TARGET_APP_ID],
            content: 'callStart'
        }));
    }, 5000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
        
        // Détecter quand l'app accepte l'appel
        if (message.content === 'callAccepted' && !isCallAccepted) {
            isCallAccepted = true;
            console.log('Call accepted, starting audio transmission...');

            // Envoyer l'audio deux fois
            const sendAudioTwice = async () => {
                console.log('Sending audio first time...');
                ws.send(JSON.stringify({
                    clientId: TEST_ID,
                    recipientIds: [TARGET_APP_ID],
                    audioData: audioData
                }));

                // Attendre 3 secondes puis renvoyer
                setTimeout(() => {
                    console.log('Sending audio second time...');
                    ws.send(JSON.stringify({
                        clientId: TEST_ID,
                        recipientIds: [TARGET_APP_ID],
                        audioData: audioData
                    }));

                    // Terminer l'appel après la deuxième transmission
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            clientId: TEST_ID,
                            recipientIds: [TARGET_APP_ID],
                            content: 'callEnd'
                        }));
                        console.log('Call ended');
                    }, 3000);
                }, 3000);
            };

            sendAudioTwice();
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

process.on('SIGINT', () => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            clientId: TEST_ID,
            recipientIds: [TARGET_APP_ID],
            content: 'callEnd'
        }));
    }
    ws.close();
    process.exit();
});