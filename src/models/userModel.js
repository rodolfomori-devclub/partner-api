const { usersCollection, locationsCollection } = require('../config/firebaseConfig');
const { getCoordinatesFromCEP } = require('../utils/locationService');
const { GeoPoint } = require('firebase-admin').firestore;

class UserModel {
  /**
   * Criar um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} - Objeto do usuário criado
   */
  async createUser(userData) {
    // Verificar se o email já existe
    const emailExists = await this.findByEmail(userData.email);
    if (emailExists) {
      const error = new Error('Este email já está cadastrado');
      error.statusCode = 409; // Conflict
      throw error;
    }

    try {
      // Obter coordenadas a partir do CEP
      const { latitude, longitude } = await getCoordinatesFromCEP(userData.cep);
      
      // Criar o documento do usuário
      const userDoc = {
        name: userData.name,
        email: userData.email,
        whatsapp: userData.whatsapp,
        studyTimes: userData.studyTimes,
        cep: userData.cep,
        level: userData.level,
        about: userData.about,
        avatarUrl: userData.avatarUrl,
        createdAt: new Date()
      };
      
      // Adicionar o usuário ao Firestore
      const docRef = await usersCollection.add(userDoc);
      const userId = docRef.id;
      
      // Armazenar a localização do usuário para consultas geoespaciais
      await locationsCollection.doc(userId).set({
        userId,
        location: new GeoPoint(latitude, longitude),
        level: userData.level,
        studyTimes: userData.studyTimes,
      });
      
      // Retornar o objeto do usuário com o ID
      return {
        id: userId,
        ...userDoc
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Encontrar um usuário pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} - Objeto do usuário ou null
   */
  async findByEmail(email) {
    try {
      const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Verificar as credenciais do usuário (email e whatsapp)
   * @param {string} email - Email do usuário
   * @param {string} whatsapp - Número de WhatsApp do usuário
   * @returns {Promise<Object|null>} - Objeto do usuário ou null
   */
  async verifyCredentials(email, whatsapp) {
    try {
      const snapshot = await usersCollection
        .where('email', '==', email)
        .where('whatsapp', '==', whatsapp)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }

  /**
   * Atualizar os dados de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Novos dados do usuário
   * @returns {Promise<Object>} - Objeto do usuário atualizado
   */
  async updateUser(userId, userData) {
    try {
      // Verificar se o usuário existe
      const userRef = usersCollection.doc(userId);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        const error = new Error('Usuário não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Se o CEP foi alterado, atualizar as coordenadas
      const currentData = doc.data();
      if (userData.cep && userData.cep !== currentData.cep) {
        const { latitude, longitude } = await getCoordinatesFromCEP(userData.cep);
        
        // Atualizar localização no collection de locations
        await locationsCollection.doc(userId).update({
          location: new GeoPoint(latitude, longitude),
          level: userData.level || currentData.level,
          studyTimes: userData.studyTimes || currentData.studyTimes,
        });
      } else if (userData.level !== currentData.level || 
                (userData.studyTimes && JSON.stringify(userData.studyTimes) !== JSON.stringify(currentData.studyTimes))) {
        // Se o nível ou horários mudaram, atualizar no documento de localização
        await locationsCollection.doc(userId).update({
          level: userData.level || currentData.level,
          studyTimes: userData.studyTimes || currentData.studyTimes,
        });
      }
      
      // Atualizar o documento do usuário
      await userRef.update({
        ...userData,
        updatedAt: new Date()
      });
      
      // Retornar os dados atualizados
      const updatedDoc = await userRef.get();
      return {
        id: userId,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

module.exports = new UserModel();