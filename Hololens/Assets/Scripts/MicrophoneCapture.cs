using UnityEngine;

public class MicrophoneCapture : MonoBehaviour
{
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
    private AudioFileWriter audioFileWriter;

    private void Start()
    {
        if (recordOnStart)
        {
            InitializeMicrophone();
        }
    }

    private void InitializeMicrophone()
    {
        if (Microphone.devices.Length > 0)
        {
            _microphoneDevice = Microphone.devices[0];
            _microphoneClip = Microphone.Start(_microphoneDevice, true, BufferLength, SampleRate);

            var bufferSize = SampleRate * BufferLength;
            _audioBuffer = new float[bufferSize];
            Debug.Log("Microphone started: " + _microphoneDevice);

            if (audioFileWriter != null)
            {
                audioFileWriter.Initialize("CapturedAudio.wav", SampleRate, _microphoneClip.channels);
                Debug.Log("AudioFileWriter initialized.");
            }

            _isRecording = true;
        }
        else
        {
            Debug.LogError("No microphone detected!");
        }
    }

    public void StartRecording()
    {
        if (!_isRecording)
        {
            InitializeMicrophone();
        }
    }

    public void StopRecording()
    {
        if (_isRecording)
        {
            Microphone.End(_microphoneDevice);
            Debug.Log("Microphone stopped: " + _microphoneDevice);
            _isRecording = false;

            // Finalize the audio file
            if (audioFileWriter != null)
            {
                audioFileWriter.FinalizeFile();
                Debug.Log("Audio file finalized.");
            }
        }
    }

    private void Update()
    {
        if (_isRecording && _microphoneClip != null)
        {
            int currentPosition = Microphone.GetPosition(_microphoneDevice);
            if (currentPosition < 0 || currentPosition == _previousPosition)
            {
                // No new data available
                return;
            }

            int dataLength = currentPosition > _previousPosition
                ? currentPosition - _previousPosition // Forward progression
                : _audioBuffer.Length - _previousPosition + currentPosition; // Loop around

            float[] newAudioData = new float[dataLength];
            _microphoneClip.GetData(newAudioData, _previousPosition);

            // Apply gain to amplify the microphone input
            for (int i = 0; i < newAudioData.Length; i++)
            {
                newAudioData[i] *= gainFactor;
            }

            // Trigger any event listeners
            OnAudioDataCaptured?.Invoke(newAudioData);

            // Write the amplified data to the audio file
            if (audioFileWriter != null)
            {
                audioFileWriter.WriteAudioData(newAudioData);
            }

            _previousPosition = currentPosition;
        }
    }

    private void OnDestroy()
    {
        StopRecording();
    }
}
