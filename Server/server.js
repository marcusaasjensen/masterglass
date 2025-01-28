const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    let clientId = null;

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (!clientId && parsedMessage.clientId) {
                clientId = parsedMessage.clientId;
                clients.set(clientId, ws);
                console.log(`Client registered with ID: ${clientId}`);
                logConnectedClients();
                return;
            }

            if (!clientId) {
                console.warn('Client sent a message before registration.');
                return;
            }

            const { recipientIds, content, audioData } = parsedMessage;

            if (!recipientIds || recipientIds.length === 0) {
                console.warn(`Message from ${clientId} has no valid recipients.`);
                return;
            }

            recipientIds.forEach((recipientId) => {
                const recipientSocket = clients.get(recipientId);
                if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
                    if (audioData) {
                        const audioBuffer = Buffer.from(audioData, 'base64');
                        recipientSocket.send(audioBuffer);
                        console.log(`Sent audio (${audioBuffer.length} bytes) from ${clientId} to ${recipientId}`);
                    } else {
                        recipientSocket.send(JSON.stringify({ sender: clientId, content }));
                        console.log(`Sent message from ${clientId} to ${recipientId}: ${content}`);
                    }
                } else {
                    console.warn(`Recipient ${recipientId} not connected.`);
                }
            });

        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        if (clientId) {
            clients.delete(clientId);
            console.log(`Client disconnected: ${clientId}`);
            logConnectedClients();
        }
    });
});

// Logs currently connected clients
function logConnectedClients() {
    const connectedClients = Array.from(clients.keys());
    console.log(`Connected clients: ${connectedClients.length > 0 ? connectedClients.join(', ') : 'None'}`);
}

console.log('WebSocket server listening on ws://localhost:8080');
