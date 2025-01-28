using System;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Serialization;
using WebSocketSharp;

public class WebSocketClient : MonoBehaviourSingleton<WebSocketClient>
{
    public UnityEvent<float[]> onAudioDataReceived; // Event for received audio data
    
    private ServerConfig _serverConfig;
    private WebSocket _ws;


    protected override void Awake()
    {
        base.Awake();
        _serverConfig = ConfigLoader.LoadConfig();
    }

    private void Start()
    {
        _ws = new WebSocket($"ws://{_serverConfig.serverIp}:{_serverConfig.serverPort}");

        _ws.OnOpen += (sender, e) => Debug.Log("Connected to WebSocket server.");
        _ws.OnClose += (sender, e) => Debug.Log("Disconnected from server.");
        _ws.OnError += (sender, e) => Debug.LogError("WebSocket Error: " + e.Message);

        _ws.OnMessage += (sender, e) =>
        {
            if (e.RawData != null && e.RawData.Length > 0)
            {
                Debug.Log($"Received {e.RawData.Length} bytes from WebSocket server.");
                onAudioDataReceived?.Invoke(ConvertByteArrayToFloatArray(e.RawData));
            }
        };

        _ws.Connect();
    }

    /// <summary>
    /// Processes float audio data, converts it to byte[], and sends it.
    /// </summary>
    public void ProcessAudioData(float[] audioData)
    {
        if (audioData == null || audioData.Length == 0)
            return;

        byte[] byteData = ConvertFloatArrayToByteArray(audioData);
        SendAudioData(byteData);
    }

    /// <summary>
    /// Sends raw byte audio data over WebSocket.
    /// </summary>
    public void SendAudioData(byte[] audioData)
    {
        if (_ws != null && _ws.IsAlive)
        {
            _ws.Send(audioData);
            Debug.Log($"Sent {audioData.Length} bytes of audio data to WebSocket server.");
        }
        else
        {
            Debug.LogWarning("WebSocket is not connected. Unable to send audio data.");
        }
    }

    /// <summary>
    /// Converts a float array (audio samples) to a PCM 16-bit byte array.
    /// </summary>
    private byte[] ConvertFloatArrayToByteArray(float[] floatArray)
    {
        short[] int16Array = new short[floatArray.Length];

        for (int i = 0; i < floatArray.Length; i++)
        {
            // Convert float (-1 to 1) to Int16 (-32768 to 32767)
            int16Array[i] = (short)(Mathf.Clamp(floatArray[i], -1f, 1f) * short.MaxValue);
        }

        byte[] byteArray = new byte[int16Array.Length * sizeof(short)];
        Buffer.BlockCopy(int16Array, 0, byteArray, 0, byteArray.Length);
        return byteArray;
    }
    
    // Convert byte[] (16-bit PCM) to float[]
    private float[] ConvertByteArrayToFloatArray(byte[] byteArray)
    {
        int sampleCount = byteArray.Length / 2;  // 2 bytes per sample (16-bit audio)
        float[] floatArray = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            short sample = BitConverter.ToInt16(byteArray, i * 2);
            floatArray[i] = sample / (float)short.MaxValue;  // Convert to -1 to 1 range
        }

        return floatArray;
    }


    private void OnDestroy()
    {
        if (_ws != null)
        {
            _ws.Close();
            Debug.Log("WebSocket closed.");
        }
    }
}
