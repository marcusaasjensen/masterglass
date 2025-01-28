using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Serialization;
using WebSocketSharp;

[Serializable]
public class MessageData
{
    public string clientId;
    public List<string> recipientIds = new List<string> {""};
    public string content;
    public string audioData;
}



public class WebSocketClient : MonoBehaviourSingleton<WebSocketClient>
{
    [SerializeField] private string clientName = "Hololens";
    public UnityEvent<float[]> onAudioDataReceived;

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

        _ws.OnOpen += (sender, e) =>
        {
            Debug.Log("Connected to WebSocket server.");
            
            // Send initial registration message
            // var registrationMessage = new { clientId = clientName, content = "REGISTER" };
            // _ws.Send(JsonUtility.ToJson(registrationMessage));
            // Debug.Log($"Sent registration message: {clientName}");
            var registrationMessage = new MessageData { 
                clientId = clientName, 
                content = "REGISTER",
            };
            print(JsonUtility.ToJson(registrationMessage));
            _ws.Send(JsonUtility.ToJson(registrationMessage));
            Debug.Log($"Sent registration message: {clientName}");
        };

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

    public void ProcessAudioData(float[] audioData, List<string> recipientIds)
    {
        if (audioData == null || audioData.Length == 0)
            return;

        byte[] byteData = ConvertFloatArrayToByteArray(audioData);

        MessageData message = new MessageData
        {
            clientId = clientName, 
            recipientIds = recipientIds,
            content = "Audio Data",
            audioData = Convert.ToBase64String(byteData)
        };

        SendAudioData(message);
    }

    public void SendAudioData(MessageData message)
    {
        if (_ws == null || !_ws.IsAlive)
        {
            Debug.LogWarning("WebSocket is not connected. Unable to send audio data.");
            return;
        }

        string jsonMessage = JsonUtility.ToJson(message);
        _ws.Send(jsonMessage);
        Debug.Log($"Sent {message.audioData.Length} bytes of audio data to {message.recipientIds.Count} recipients.");
    }

    private byte[] ConvertFloatArrayToByteArray(float[] floatArray)
    {
        short[] int16Array = new short[floatArray.Length];

        for (int i = 0; i < floatArray.Length; i++)
        {
            int16Array[i] = (short)(Mathf.Clamp(floatArray[i], -1f, 1f) * short.MaxValue);
        }

        byte[] byteArray = new byte[int16Array.Length * sizeof(short)];
        Buffer.BlockCopy(int16Array, 0, byteArray, 0, byteArray.Length);
        return byteArray;
    }

    private float[] ConvertByteArrayToFloatArray(byte[] byteArray)
    {
        int sampleCount = byteArray.Length / 2;
        float[] floatArray = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            short sample = BitConverter.ToInt16(byteArray, i * 2);
            floatArray[i] = sample / (float)short.MaxValue;
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
