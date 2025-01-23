using UnityEngine;

public class Trigger : MonoBehaviour
{
    public void OnTriggerEnter(Collider other)
    {
        print("Triggered: " + other.gameObject.name);
        if (!other.gameObject.CompareTag("Quit"))
        {
            return;
        }
        Application.Quit();
        Debug.Log("Application is quitting...");
    }
}
