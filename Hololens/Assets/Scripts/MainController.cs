using UnityEngine;

public class MainController : MonoBehaviour
{
    public PeerToPeerConnection peerToPeerConnection;

    private void Start()
    {
        if (peerToPeerConnection != null)
        {
            peerToPeerConnection.SendAudioStream();
        }
        else
        {
            Debug.LogError("PeerToPeerConnection is missing!");
        }
    }

    private void OnDestroy()
    {
        Debug.Log("MainController destroyed.");
    }
}