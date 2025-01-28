import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
} from 'react-native';
import { Contact } from '@/models/Contact';

const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', firstName: 'Alice', lastName: 'Johnson', qualification: 'Technician', status: 'free' },
    { id: '2', firstName: 'Bob', lastName: 'Smith', qualification: 'Technician', status: 'occupied' },
    { id: '3', firstName: 'Charlie', lastName: 'Brown', qualification: 'Manager', status: 'free' },
    { id: '4', firstName: 'David', lastName: 'White', qualification: 'Inexperienced Technician', status: 'free' },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const websocket = useRef<WebSocket | null>(null);

  const startMicrophone = async () => {
    try {
      // Demander l'accès au micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      // Créer un contexte audio
      const context = new AudioContext();
      audioContext.current = context;

      // Connecter la source audio au contexte audio
      const source = context.createMediaStreamSource(stream);

      // Création d'un processeur audio pour envoyer les données par WebSocket sous JSON
      const processor = context.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (event) => {
        if (websocket.current?.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0); // Données audio brutes
          const audioArray = Array.from(audioData); // Convertir en tableau lisible
          const base64Audio = btoa(String.fromCharCode(...audioArray));
          const jsonData = {
            type: 'audio',
            sender: 'user123',
            clientId: "App", // selectedContact?.id, // L'ID du techicien
            recipientIds: ["Hololens", "App"] ,// L'ID du destinataire
            audioData: base64Audio,
          };
          websocket.current.send(JSON.stringify(jsonData)); // Envoyer sous format JSON
        }
      };

      source.connect(processor);
      processor.connect(context.destination);

      console.log('Microphone activé et prêt à envoyer des données audio.');
    } catch (err) {
      console.error('Erreur lors de l\'accès au microphone :', err);
      Alert.alert('Erreur', 'Impossible d\'accéder au microphone.');
    }
  };

  const stopMicrophone = () => {
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    audioContext.current?.close();
    console.log('Microphone désactivé.');
  };

  const handleCall = async () => {
    if (selectedContact?.status === 'free') {
      setIsCalling(true);

      // Initialiser WebSocket
      websocket.current = new WebSocket('ws://localhost:8080');
      websocket.current.onopen = () => {
        console.log('Connexion WebSocket établie.');
        startMicrophone(); // Démarrer la capture audio
      };

      websocket.current.onmessage = async (event) => {
        if (audioContext.current) {
          const context = audioContext.current;
      
          try {
            // Récupérer les données brutes du message
            const arrayBuffer = await event.data.arrayBuffer(); // Convertir en ArrayBuffer
            const audioData = new Float32Array(arrayBuffer); // Convertir en Float32Array
      
            if (audioData.length === 0) {
              console.error('Les données audio reçues sont vides.');
              return;
            }
      
            // Créer un buffer audio
            const buffer = context.createBuffer(1, audioData.length, context.sampleRate);
      
            // Copier les données audio dans le buffer
            buffer.copyToChannel(audioData, 0);
      
            // Jouer le son
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start();
          } catch (error) {
            console.error('Erreur lors de la réception ou du traitement des données audio :', error);
          }
        }
      };         
      

      websocket.current.onclose = () => {
        console.log('Connexion WebSocket fermée.');
        stopMicrophone(); // Arrêter la capture audio
        setIsCalling(false);
      };

      websocket.current.onerror = (error) => {
        console.error('Erreur WebSocket :', error);
        stopMicrophone();
        setIsCalling(false);
      };
    } else {
      Alert.alert(
        'Contact Occupé',
        `${selectedContact?.firstName} est actuellement occupé.`
      );
    }
  };

  const endCall = () => {
    websocket.current?.close();
    setIsCalling(false);
  };

  const openModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedContact(null);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <View style={[styles.contactCard, item.status === 'free' ? styles.free : styles.occupied]}>
        <Text style={styles.contactName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.contactQualification}>{item.qualification}</Text>
        <Text style={styles.contactStatus}>
          Status: {item.status === 'free' ? 'Libre' : 'Occupé'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des Contacts</Text>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {selectedContact && (
              <>
                <Text style={styles.modalTitle}>
                  Contact : {selectedContact.firstName} {selectedContact.lastName}
                </Text>
                <Text>Qualification : {selectedContact.qualification}</Text>
                <Text>Status : {selectedContact.status === 'free' ? 'Libre' : 'Occupé'}</Text>

                {isCalling ? (
                  <Button title="Raccrocher" onPress={endCall} />
                ) : (
                  <Button title="Appeler" onPress={handleCall} />
                )}
                <Button title="Fermer" onPress={closeModal} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  contactCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactQualification: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  contactStatus: {
    fontSize: 14,
    color: '#333',
  },
  free: {
    borderLeftWidth: 4,
    borderLeftColor: 'green',
  },
  occupied: {
    borderLeftWidth: 4,
    borderLeftColor: 'red',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 30, // Augmenter le padding pour plus d'espace
    borderRadius: 10,
    width: 350, // Largeur ajustée
    height: 300, // Hauteur ajustée
    alignItems: 'center',
    justifyContent: 'space-around', // Espacement pour que tout soit bien réparti
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ContactsPage;
