using System;
using System.IO;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;

#if ENABLE_WINMD_SUPPORT
using Windows.Storage;
#endif

public class AudioFileWriter : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI statusText;
    private FileStream _fileStream;
    private int _sampleRate;
    private int _channels;
    private const int HeaderSize = 44;
    private int _totalSamplesWritten;
    private string _filePath;

    public async void Initialize(string fileName, int sampleRate, int channels)
    {
        _sampleRate = sampleRate;
        _channels = channels;

        _filePath = await GetFilePathAsync(fileName);
        if (string.IsNullOrEmpty(_filePath))
        {
            Debug.LogError("Failed to get file path.");
            return;
        }

        _fileStream = new FileStream(_filePath, FileMode.Create);
        WriteEmptyWavHeader();
        Debug.Log("Audio file initialized: " + _filePath);

        if (statusText != null)
        {
            statusText.text = "Audio file initialized:\n\n" + _filePath;
        }
    }

    private async Task<string> GetFilePathAsync(string fileName)
    {
#if ENABLE_WINMD_SUPPORT
        try
        {
            StorageFolder musicFolder = KnownFolders.MusicLibrary;
            StorageFile file = await musicFolder.CreateFileAsync(fileName, CreationCollisionOption.ReplaceExisting);
            return file.Path;
        }
        catch (Exception e)
        {
            Debug.LogError("Error accessing Music folder: " + e.Message);
            return null;
        }
#else
        string folderPath = Path.Combine(Application.persistentDataPath, "Music");

        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        return Path.Combine(folderPath, fileName);
#endif
    }

    public void WriteAudioData(float[] audioData)
    {
        if (_fileStream == null)
        {
            Debug.LogError("File stream is not initialized!");
            return;
        }

        byte[] byteData = new byte[audioData.Length * 2];
        for (int i = 0; i < audioData.Length; i++)
        {
            short pcmValue = (short)(audioData[i] * 32767);
            byteData[i * 2] = (byte)(pcmValue & 0xFF);
            byteData[i * 2 + 1] = (byte)((pcmValue >> 8) & 0xFF);
        }

        _fileStream.Write(byteData, 0, byteData.Length);
        _totalSamplesWritten += audioData.Length;
    }

    public void FinalizeFile()
    {
        if (_fileStream == null)
        {
            Debug.LogError("File stream is not initialized!");
            return;
        }

        WriteWavHeader();
        _fileStream.Close();
        _fileStream = null;

        Debug.Log("Audio file finalized. Total samples written: " + _totalSamplesWritten);

        if (statusText != null)
        {
            statusText.text = "Audio call file saved to:\n\n" + _filePath;
        }
    }

    private void WriteEmptyWavHeader()
    {
        byte[] header = new byte[HeaderSize];
        _fileStream.Write(header, 0, header.Length);
    }

    private void WriteWavHeader()
    {
        _fileStream.Seek(0, SeekOrigin.Begin);

        int byteRate = _sampleRate * _channels * 2;
        int dataSize = _totalSamplesWritten * 2;

        using (BinaryWriter writer = new BinaryWriter(_fileStream))
        {
            writer.Write("RIFF".ToCharArray());
            writer.Write(36 + dataSize);
            writer.Write("WAVE".ToCharArray());

            writer.Write("fmt ".ToCharArray());
            writer.Write(16);
            writer.Write((short)1);
            writer.Write((short)_channels);
            writer.Write(_sampleRate);
            writer.Write(byteRate);
            writer.Write((short)(_channels * 2));
            writer.Write((short)16);

            writer.Write("data".ToCharArray());
            writer.Write(dataSize);
        }
    }
}
