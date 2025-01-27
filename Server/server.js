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
    let timer = null;  // Timer to track the 10 seconds of receiving data

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

            // If there's an active timer, clear it
            if (timer) {
                clearTimeout(timer);
            }

            // Set a new timer for 10 seconds
            timer = setTimeout(() => {
                saveAudioToFile(audioBuffer);
                audioBuffer = Buffer.alloc(0);  // Reset the buffer
            }, 10000);  // 10 seconds
        }
    });

    // Function to create WAV file header
    function createWavHeader(audioDataLength, sampleRate, numChannels, bitsPerSample) {
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);

        const header = Buffer.alloc(44); // 44 bytes for WAV header
        header.write('RIFF', 0); // Chunk ID
        header.writeUInt32LE(36 + audioDataLength, 4); // Chunk Size
        header.write('WAVE', 8); // Format
        header.write('fmt ', 12); // Subchunk1 ID
        header.writeUInt32LE(16, 16); // Subchunk1 Size (16 for PCM)
        header.writeUInt16LE(1, 20); // Audio Format (1 = PCM)
        header.writeUInt16LE(numChannels, 22); // Num Channels
        header.writeUInt32LE(sampleRate, 24); // Sample Rate
        header.writeUInt32LE(byteRate, 28); // Byte Rate
        header.writeUInt16LE(blockAlign, 32); // Block Align
        header.writeUInt16LE(bitsPerSample, 34); // Bits per Sample
        header.write('data', 36); // Subchunk2 ID
        header.writeUInt32LE(audioDataLength, 40); // Subchunk2 Size (audio data length)

        return header;
    }

    // Function to save the audio buffer as a valid WAV file
    function saveAudioToFile(buffer) {
        const fileName = `audio_${Date.now()}.wav`; // Using current timestamp for unique filenames
        const filePath = path.join(__dirname, 'received_audio', fileName);

        // Ensure the directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Define audio parameters (modify as needed for your specific format)
        const sampleRate = 44100; // Common sample rate for audio
        const numChannels = 1; // Mono audio (change to 2 for stereo)
        const bitsPerSample = 16; // 16-bit PCM audio

        // Create WAV header
        const header = createWavHeader(buffer.length, sampleRate, numChannels, bitsPerSample);

        // Combine the header and audio data
        const wavFile = Buffer.concat([header, buffer]);

        // Save the WAV file
        fs.writeFile(filePath, wavFile, (err) => {
            if (err) {
                console.error('Error saving audio file:', err);
            } else {
                console.log(`Audio data saved as ${fileName}`);
            }
        });
    }

    // Handle client disconnection (save the audio file when done)
    ws.on('close', () => {
        if (isReceiving) {
            // Save any remaining audio data when the client disconnects
            saveAudioToFile(audioBuffer);
            audioBuffer = Buffer.alloc(0);  // Reset the buffer
        }

        for (const [clientId, clientWs] of clients.entries()) {
            if (clientWs === ws) {
                clients.delete(clientId);
                console.log(`Client disconnected with ID: ${clientId}`);
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
