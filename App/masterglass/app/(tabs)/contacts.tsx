import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import { Contact } from '@/models/Contact';
import { useAudioChat } from '@/hooks/useAudioChat';
import { useWebSocket } from '@/context/WebSocketContext';

const ContactsPage = () => {
  const { isConnected: wsConnected, deviceId } = useWebSocket();
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', firstName: 'Alice', lastName: 'Johnson', qualification: 'Technician', status: 'free' },
    { id: '2', firstName: 'Bob', lastName: 'Smith', qualification: 'Technician', status: 'occupied' },
    { id: '3', firstName: 'Charlie', lastName: 'Brown', qualification: 'Manager', status: 'free' },
    {id: 'test-id',firstName: 'Test',lastName: 'Client',qualification: 'Tester',status: 'free'},
    { id: '4', firstName: 'David', lastName: 'White', qualification: 'Inexperienced Technician', status: 'free' },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Utiliser le hook audio chat
  const { 
    isConnected: audioConnected, 
    isTransmitting, 
    startAudioTransmission, 
    stopAudioTransmission 
  } = useAudioChat({
    contactId: selectedContact?.id || '',
  });

  useEffect(() => {
    if (wsConnected) {
      console.log('Connected to WebSocket server with ID:', deviceId);
    }
  }, [wsConnected, deviceId]);

  const openModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalVisible(true);
  };

  const closeModal = async () => {
    if (isTransmitting) {
      await stopAudioTransmission();
    }
    setIsModalVisible(false);
    setSelectedContact(null);
  };

  const handleAction = async () => {
    if (selectedContact?.status === 'free') {
      if (!isTransmitting) {
        try {
          await startAudioTransmission();
        } catch (error) {
          Alert.alert('Erreur', 'Impossible de démarrer la communication audio');
        }
      } else {
        await stopAudioTransmission();
      }
    } else {
      Alert.alert('Notification', `Notifier ${selectedContact?.firstName} qu'on veut le contacter dès qu'il est libre`);
      closeModal();
    }
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
                {wsConnected && selectedContact.status === 'free' && (
                  <Text style={styles.connectionStatus}>
                    {isTransmitting ? 'Appel en cours...' : 'Prêt à communiquer'}
                  </Text>
                )}
                <Button 
                  title={selectedContact.status === 'free' 
                    ? (isTransmitting ? 'Raccrocher' : 'Appeler') 
                    : 'Notifier'
                  } 
                  onPress={handleAction}
                  color={isTransmitting ? '#ff4444' : '#007AFF'}
                />
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
  connectionStatus: {
    marginVertical: 10,
    color: '#666',
    fontStyle: 'italic'
  },
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