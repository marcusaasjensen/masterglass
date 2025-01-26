using System;
using System.IO;
using TMPro;
using UnityEngine;
using UnityEngine.Serialization;

public class AudioFileWriter : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI statusText;
    private FileStream _fileStream;
    private int _sampleRate;
    private int _channels;
    private const int HeaderSize = 44; // WAV header size
    private int _totalSamplesWritten;
    private string _filePath;

    // Public variable for the target folder
    [Tooltip("Specify the folder to save the audio file (e.g., 'Downloads')")]
    public string targetFolder = "Downloads";

    public void Initialize(string fileName, int sampleRate, int channels)
    {
        _sampleRate = sampleRate;
        _channels = channels;

        // Generate the full file path
        _filePath = GetFilePath(fileName);
        _fileStream = new FileStream(_filePath, FileMode.Create);
        WriteEmptyWavHeader(); // Reserve space for the WAV header
        Debug.Log("Audio file initialized: " + _filePath);
    }

    private string GetFilePath(string fileName)
    {
        // Build the file path based on the target folder
        string folderPath = Path.Combine(Application.persistentDataPath, "..", "..", targetFolder);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        return Path.Combine(folderPath, fileName);
    }

    public void WriteAudioData(float[] audioData)
    {
        if (_fileStream == null)
        {
            Debug.LogError("File stream is not initialized!");
            return;
        }

        // Convert float audio data (-1 to 1) to 16-bit PCM (-32768 to 32767)
        byte[] byteData = new byte[audioData.Length * 2];
        for (int i = 0; i < audioData.Length; i++)
        {
            short pcmValue = (short)(audioData[i] * 32767); // Scale to 16-bit PCM
            byteData[i * 2] = (byte)(pcmValue & 0xFF);      // Lower byte
            byteData[i * 2 + 1] = (byte)((pcmValue >> 8) & 0xFF); // Upper byte
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

        // Write the WAV header with correct sizes
        WriteWavHeader();
        _fileStream.Close();
        _fileStream = null;

        Debug.Log("Audio file finalized. Total samples written: " + _totalSamplesWritten);
        
        if (statusText != null)
        {
            statusText.text = "Audio file saved to:\n\n" + _filePath;
        }
    }

    private void WriteEmptyWavHeader()
    {
        byte[] header = new byte[HeaderSize];
        _fileStream.Write(header, 0, header.Length);
    }

    private void WriteWavHeader()
    {
        _fileStream.Seek(0, SeekOrigin.Begin); // Go back to the start of the file

        int byteRate = _sampleRate * _channels * 2; // SampleRate * Channels * BytesPerSample
        int dataSize = _totalSamplesWritten * 2; // Total samples * BytesPerSample

        using (BinaryWriter writer = new BinaryWriter(_fileStream))
        {
            // RIFF header
            writer.Write("RIFF".ToCharArray());
            writer.Write(36 + dataSize); // File size minus 8 bytes for RIFF header
            writer.Write("WAVE".ToCharArray());

            // Format chunk
            writer.Write("fmt ".ToCharArray());
            writer.Write(16); // Sub-chunk size (16 for PCM)
            writer.Write((short)1); // Audio format (1 for PCM)
            writer.Write((short)_channels); // Number of channels
            writer.Write(_sampleRate); // Sample rate
            writer.Write(byteRate); // Byte rate
            writer.Write((short)(_channels * 2)); // Block align
            writer.Write((short)16); // Bits per sample

            // Data chunk
            writer.Write("data".ToCharArray());
            writer.Write(dataSize); // Data chunk size
        }
    }
}
