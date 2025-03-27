const { usersCollection, locationsCollection, admin } = require('../config/firebaseConfig');
const { getCoordinatesFromCEP, calculateDistance } = require('../utils/locationService');
const { GeoPoint } = require('firebase-admin').firestore;

class SearchModel {
  /**
   * Buscar parceiros com base em filtros
   * @param {Object} filters - Filtros para a busca
   * @returns {Promise<Array>} - Array de usuários encontrados
   */
  async searchPartners(filters) {
    try {
      let query = usersCollection;
      
      // Aplicar filtro de nível
      if (filters.level) {
        query = query.where('level', '==', filters.level);
      }
      
      // Aplicar filtro de horários de estudo
      if (filters.studyTimes && filters.studyTimes.length > 0) {
        // No Firestore, não é possível aplicar operadores OR em campos diferentes
        // Vamos precisar buscar todos com pelo menos um horário compatível
        // array-contains-any verifica se o array contém qualquer um dos valores
        query = query.where('studyTimes', 'array-contains-any', filters.studyTimes);
      }
      
      // Excluir o próprio usuário da busca
      let snapshot = await query.get();
      let results = [];
      
      snapshot.forEach(doc => {
        const userData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Excluir o próprio usuário da lista se o email for informado
        if (!filters.excludeEmail || userData.email !== filters.excludeEmail) {
          // Remover campos sensíveis para a resposta
          delete userData.createdAt;
          delete userData.updatedAt;
          
          results.push(userData);
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error searching partners:', error);
      throw error;
    }
  }

  /**
   * Buscar parceiros próximos com base em CEP e filtros
   * @param {string} cep - CEP do usuário
   * @param {number} radius - Raio em quilômetros
   * @param {Object} filters - Filtros adicionais
   * @returns {Promise<Array>} - Array de usuários encontrados
   */
  async searchNearby(cep, radius, filters) {
    try {
      // Obter coordenadas do CEP
      const { latitude, longitude } = await getCoordinatesFromCEP(cep);
      const center = new GeoPoint(latitude, longitude);
      
      // Preparar consulta para location
      let query = locationsCollection;
      
      // Aplicar filtro de nível
      if (filters.level) {
        query = query.where('level', '==', filters.level);
      }
      
      // Aplicar filtro de horários de estudo
      if (filters.studyTimes && filters.studyTimes.length > 0) {
        query = query.where('studyTimes', 'array-contains-any', filters.studyTimes);
      }
      
      // Obter todos os documentos que atendem aos filtros
      const snapshot = await query.get();
      
      // Filtrar por distância e obter os detalhes dos usuários
      const userIds = [];
      const locationMap = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const userLocation = data.location;
        
        // Calcular distância entre os pontos
        const distance = calculateDistance(
          center.latitude,
          center.longitude,
          userLocation.latitude,
          userLocation.longitude
        );
        
        // Adicionar à lista se estiver dentro do raio
        if (distance <= radius) {
          userIds.push(data.userId);
          locationMap[data.userId] = distance;
        }
      });
      
      // Se não houver resultados dentro do raio, retornar array vazio
      if (userIds.length === 0) {
        return [];
      }
      
      // Buscar detalhes dos usuários
      // O Firestore tem um limite de 10 para in, então precisamos dividir em chunks
      const chunkSize = 10;
      const userChunks = [];
      
      for (let i = 0; i < userIds.length; i += chunkSize) {
        userChunks.push(userIds.slice(i, i + chunkSize));
      }
      
      // Realizar consultas para cada chunk
      const usersPromises = userChunks.map(chunk => {
        return usersCollection.where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
      });
      
      // Processar resultados
      const usersSnapshots = await Promise.all(usersPromises);
      
      let results = [];
      
      usersSnapshots.forEach(snapshotGroup => {
        snapshotGroup.forEach(doc => {
          const userData = {
            id: doc.id,
            ...doc.data(),
            distance: locationMap[doc.id] // Adicionar a distância calculada
          };
          
          // Excluir o próprio usuário da lista se o email for informado
          if (!filters.excludeEmail || userData.email !== filters.excludeEmail) {
            // Remover campos sensíveis para a resposta
            delete userData.createdAt;
            delete userData.updatedAt;
            
            results.push(userData);
          }
        });
      });
      
      // Ordenar por distância
      results.sort((a, b) => a.distance - b.distance);
      
      return results;
    } catch (error) {
      console.error('Error searching nearby partners:', error);
      throw error;
    }
  }
}

module.exports = new SearchModel();