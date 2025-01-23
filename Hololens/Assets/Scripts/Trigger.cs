using UnityEngine;
using UnityEngine.Events;

public class Trigger : MonoBehaviour
{
    [SerializeField] private string targetTag; 
    [SerializeField] private UnityEvent onTriggerEnter;
    [SerializeField] private UnityEvent onTriggerExit;
    [SerializeField] private UnityEvent onTriggerStay;
    
    public void OnTriggerEnter(Collider other)
    {
        if (!other.gameObject.CompareTag(targetTag))
        {
            return;
        }
        onTriggerEnter.Invoke();
    }
    
    public void OnTriggerExit(Collider other)
    {
        if (!other.gameObject.CompareTag(targetTag))
        {
            return;
        }
        onTriggerExit.Invoke();
    }
    
    public void OnTriggerStay(Collider other)
    {
        if (!other.gameObject.CompareTag(targetTag))
        {
            return;
        }
        onTriggerStay.Invoke();
    }
}
