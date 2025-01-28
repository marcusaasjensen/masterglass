using System;
using UnityEngine;

public class AudioOutput : MonoBehaviour
{
    [SerializeField] private AudioSource audioSource;
    private WebSocketClient webSocketClient;

    private float[] audioBuffer;
    private int bufferIndex;
    private int bufferSize = 44100 * 2; // Size of the buffer (2 seconds of audio at 44.1kHz)

    [SerializeField] private float gain = 1.0f; // Gain factor, default is 1 (no gain)

    private void Start()
    {
        webSocketClient = WebSocketClient.Instance;
        audioSource = GetComponent<AudioSource>();
        
        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }
        
        audioSource.loop = false;
        audioSource.playOnAwake = false;
        
        audioBuffer = new float[bufferSize];
        audioSource.clip = AudioClip.Create("RealTimeAudio", bufferSize, 1, 44100, false);
        
        webSocketClient.onAudioDataReceived.AddListener(ReceiveAudioData);
    }

    private void OnDestroy()
    {
        if (webSocketClient != null)
        {
            webSocketClient.onAudioDataReceived.RemoveListener(ReceiveAudioData);
        }
    }

    private void ReceiveAudioData(float[] audioData)
    {
        if (audioData != null && audioData.Length > 0)
        {
            // Apply gain factor to the audio data
            ApplyGain(audioData);
            AppendToBuffer(audioData);
        }
    }

    private void ApplyGain(float[] audioData)
    {
        for (int i = 0; i < audioData.Length; i++)
        {
            audioData[i] *= gain; // Apply gain to each audio sample
        }
    }

    private void AppendToBuffer(float[] newAudioData)
    {
        int dataLength = newAudioData.Length;
        int remainingSpace = audioBuffer.Length - bufferIndex;

        if (dataLength > remainingSpace)
        {
            int overflow = dataLength - remainingSpace;
            Array.Copy(audioBuffer, bufferIndex, audioBuffer, 0, overflow);
            bufferIndex = overflow;
        }

        Array.Copy(newAudioData, 0, audioBuffer, bufferIndex, dataLength);
        bufferIndex += dataLength;
    }

    private void Update()
    {
        if (bufferIndex >= audioSource.clip.samples)
        {
            PlayAudioFromBuffer();
        }
    }

    private void PlayAudioFromBuffer()
    {
        audioSource.clip.SetData(audioBuffer, 0);
        audioSource.Play();
        bufferIndex = 0;
    }
}
