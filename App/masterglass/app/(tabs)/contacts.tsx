import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button } from 'react-native';
import { Contact } from '@/models/Contact'; // Assurez-vous que l'import correspond à l'emplacement de votre fichier
import { useRouter } from 'expo-router'; // Utiliser useRouter pour la navigation

const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', firstName: 'Alice', lastName: 'Johnson', qualification: 'Engineer', status: 'free' },
    { id: '2', firstName: 'Bob', lastName: 'Smith', qualification: 'Technician', status: 'occupied' },
    { id: '3', firstName: 'Charlie', lastName: 'Brown', qualification: 'Manager', status: 'free' },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const router = useRouter();

  const openModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedContact(null);
  };

  const handleAction = () => {
    if (selectedContact?.status === 'free') {
        router.push('/(tabs)/VideoCall' as any);
    } else {
      alert(`Notifier ${selectedContact?.firstName} qu'on veut le contacter dès qu'il est libre`);
    }
    closeModal();
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

      {/* Modal Pop-up */}
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
                <Text style={styles.modalTitle}>Contact : {selectedContact.firstName} {selectedContact.lastName}</Text>
                <Text>Qualification : {selectedContact.qualification}</Text>
                <Text>Status : {selectedContact.status === 'free' ? 'Libre' : 'Occupé'}</Text>

                <Button title={selectedContact.status === 'free' ? 'Appeler' : 'Notifier'} onPress={handleAction} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    width: 350,
    height: 300,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ContactsPage;
