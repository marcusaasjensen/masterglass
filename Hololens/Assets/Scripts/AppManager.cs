using UnityEngine;


public class AppManager : MonoBehaviour
{
    public static AppManager Instance;
    
    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
    
    public void QuitApp()
    {
        Application.Quit();
        Debug.Log("Application quit.");
    }
}
