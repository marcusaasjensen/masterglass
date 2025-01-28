using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

public class AudioInput : MonoBehaviour
{
    [SerializeField] private List<string> recipientIds = new List<string>{ "Hololens"}; 
    [SerializeField] private AudioFileWriter audioFileWriter;
    [SerializeField] private UnityEvent onStartRecording;
    [SerializeField] private UnityEvent onStopRecording;

    public bool recordOnStart;
    public float gainFactor = 10.0f; // Adjust this value as needed to amplify the sound
    public delegate void AudioDataCapturedHandler(float[] audioData);
    public event AudioDataCapturedHandler OnAudioDataCaptured;

    private AudioClip _microphoneClip;
    private string _microphoneDevice;
    private const int SampleRate = 44100;
    private const int BufferLength = 1; // Length of the recording buffer in seconds
    private int _previousPosition = 0;
    private float[] _audioBuffer;
    private bool _isRecording = false;

    private void Start()
    {
        if (recordOnStart)
        {
            StartRecording();
        }
    }

    public void ToggleRecording()
    {
        if (_isRecording)
        {
            StopRecording();
        }
        else
        {
            StartRecording();
        }
    }

    private void StartRecording()
    {
        if (_isRecording || Microphone.devices.Length == 0)
        {
            Debug.LogError("No microphone detected or already recording!");
            return;
        }

        _microphoneDevice = Microphone.devices[0];
        _microphoneClip = Microphone.Start(_microphoneDevice, true, BufferLength, SampleRate);
        
        var bufferSize = SampleRate * BufferLength;
        _audioBuffer = new float[bufferSize];
        Debug.Log("Microphone started: " + _microphoneDevice);

        audioFileWriter.Initialize("CapturedAudio.wav", SampleRate, _microphoneClip.channels);
        _isRecording = true;
        onStartRecording?.Invoke();
    }

    public void StopRecording()
    {
        if (!_isRecording)
            return;
        
        Microphone.End(_microphoneDevice);
        Debug.Log("Microphone stopped: " + _microphoneDevice);
        _isRecording = false;
        
        audioFileWriter.FinalizeFile();
        onStopRecording?.Invoke();
    }

    private void Update()
    {
        if (!_isRecording || _microphoneClip == null)
            return;

        int currentPosition = Microphone.GetPosition(_microphoneDevice);
        if (currentPosition < 0 || currentPosition == _previousPosition)
            return; // No new data available

        int dataLength = currentPosition >= _previousPosition
            ? currentPosition - _previousPosition
            : _audioBuffer.Length - _previousPosition + currentPosition;

        float[] newAudioData = new float[dataLength];
        _microphoneClip.GetData(newAudioData, _previousPosition);

        for (int i = 0; i < newAudioData.Length; i++)
        {
            newAudioData[i] *= gainFactor;
        }

        OnAudioDataCaptured?.Invoke(newAudioData);
        WebSocketClient.Instance.ProcessAudioData(newAudioData, recipientIds);
        audioFileWriter.WriteAudioData(newAudioData);

        _previousPosition = currentPosition;
    }

    private void OnDestroy()
    {
        StopRecording();
    }
}
