const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Start a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// An object to store connected clients with their tags
const clients = new Map();

wss.on('connection', (ws, req) => {
    console.log('New client connected');
    
    // Parse URL parameters to get clientType
    const urlParams = new URLSearchParams(req.url.slice(1));
    const clientType = urlParams.get('clientType');
    
    if (clientType) {
        clients.set(clientType, ws);
        console.log(`Client registered with ID: ${clientType}`);
    }

    // Initialize a buffer to accumulate the incoming audio data
    let audioBuffer = Buffer.alloc(0);
    let isReceiving = false;  // Flag to check if we are in the process of receiving the audio data

    // Receiving binary messages (audio data as byte[])
    ws.on('message', (message) => {
        if (Buffer.isBuffer(message)) {
            // If we are already receiving, accumulate the data into the audio buffer
            if (isReceiving) {
                audioBuffer = Buffer.concat([audioBuffer, message]);
            } else {
                // Start receiving data
                isReceiving = true;
                audioBuffer = message;  // Start with the first chunk of data
            }

            console.log('Received audio data (byte[])');

            // Echo the audio data back to the client (send it back)
            ws.send(message);  // Sends back the received audio data to the sender
        }
    });

    // Handle client disconnection (save the audio data to a file)
    ws.on('close', () => {
        for (const [clientId, clientWs] of clients.entries()) {
            if (clientWs === ws) {
                clients.delete(clientId);
                console.log(`Client disconnected with ID: ${clientId}`);

                // Save the accumulated audio data to a file
                if (audioBuffer.length > 0) {
                    const fileName = `${clientId}_${Date.now()}.wav`;
                    const filePath = path.join(__dirname, 'audio_files', fileName);
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });  // Ensure the directory exists
                    fs.writeFile(filePath, audioBuffer, (err) => {
                        if (err) {
                            console.error('Error saving audio data:', err);
                        } else {
                            console.log(`Audio data saved to ${filePath}`);
                        }
                    });
                }
                break;
            }
        }
    });
});

// Command line interface configuration
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('WebSocket server listening on ws://localhost:8080');

// Listen for manual server broadcasts from the CLI
rl.on('line', (input) => {
    const serverMessage = {
        clientId: 'server',
        type: 'ServerMessage',
        message: input
    };
    // Broadcast to all clients
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(serverMessage));  // Send message as JSON
        }
    });
});
