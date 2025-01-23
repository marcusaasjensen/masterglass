using Microsoft.MixedReality.WebRTC;
using Microsoft.MixedReality.WebRTC.Unity;
using UnityEngine;
using UnityEngine.UIElements;
using AudioTrackSource = Microsoft.MixedReality.WebRTC.AudioTrackSource;
using PeerConnection = Microsoft.MixedReality.WebRTC.PeerConnection;

public class PeerToPeerConnection : MonoBehaviour
{
    private PeerConnection _peerConnection;
    private AudioTrackSource _audioSource;
    private LocalAudioTrack _localAudioTrack;

    private void Start()
    {
        InitializePeerConnection();
    }

    private async void InitializePeerConnection()
    {
        _peerConnection = new PeerConnection();
        await _peerConnection.InitializeAsync();

        // ICE Connection State event
        _peerConnection.IceStateChanged += (state) =>
        {
            Debug.Log($"ICE Connection State: {state}");
        };

        // ICE Candidate event
        _peerConnection.IceCandidateReadytoSend += (candidate) =>
        {
            Debug.Log($"New ICE Candidate: {candidate}");
            // Send the candidate to the remote peer via signaling
        };

        Debug.Log("PeerConnection initialized.");
    }

    public async void SendAudioStream()
    {
        if (_audioSource == null)
        {
            // Create an audio track source using a local microphone
            var audioConfig = new LocalAudioTrackInitConfig
            {
                trackName = "MicrophoneAudio"
            };
            
            var deviceConfig = new LocalAudioDeviceInitConfig();

            _audioSource = await DeviceAudioTrackSource.CreateAsync(deviceConfig);
            _localAudioTrack = LocalAudioTrack.CreateFromSource(_audioSource, audioConfig);

            // Add the audio track to the peer connection using a transceiver
            _peerConnection.AddTransceiver(MediaKind.Audio, new TransceiverInitSettings
            {
                InitialDesiredDirection = Transceiver.Direction.SendOnly
            }).LocalAudioTrack = _localAudioTrack;
            Debug.Log("Local audio track added.");
        }
    }

    private void OnDestroy()
    {
        // Clean up resources
        _localAudioTrack?.Dispose();
        _audioSource?.Dispose();

        if (_peerConnection != null)
        {
            _peerConnection.Close();
            _peerConnection.Dispose();
        }
    }
}