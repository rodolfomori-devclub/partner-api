const axios = require('axios');
const NodeCache = require('node-cache');

// Cache para armazenar coordenadas de CEPs já consultados
// Tempo de vida de 30 dias (em segundos)
const cepCache = new NodeCache({ stdTTL: 2592000 });

/**
 * Obtém as coordenadas geográficas a partir de um CEP
 * Primeiro verifica no cache, depois consulta a API externa
 * @param {string} cep - CEP no formato XXXXX-XXX ou XXXXXXXX
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
async function getCoordinatesFromCEP(cep) {
  // Remover traços e espaços do CEP
  const cleanCEP = cep.replace(/[^0-9]/g, '');
  
  // Verificar se já temos no cache
  const cachedCoords = cepCache.get(cleanCEP);
  if (cachedCoords) {
    return cachedCoords;
  }
  
  try {
    // Consultar a API ViaCEP para obter o endereço
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (response.data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    const { logradouro, bairro, localidade, uf } = response.data;
    
    // Montar o endereço para geocodificação
    const address = `${logradouro}, ${bairro}, ${localidade}, ${uf}, Brasil`;
    
    // Usar a API de Geocodificação para obter as coordenadas
    // Aqui estamos usando a API Nominatim OpenStreetMap que é gratuita
    // Em produção, seria melhor usar um serviço pago como Google Maps
    const geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'Encontre um Partner/1.0'
      }
    });
    
    // Aguardar um segundo para respeitar os limites da API Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      // Se não conseguir obter coordenadas pelo endereço, tentar pelo município
      const cityResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${localidade}, ${uf}, Brasil`,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Encontre um Partner/1.0'
        }
      });
      
      if (!cityResponse.data || cityResponse.data.length === 0) {
        throw new Error('Não foi possível obter as coordenadas para este CEP');
      }
      
      const coords = {
        latitude: parseFloat(cityResponse.data[0].lat),
        longitude: parseFloat(cityResponse.data[0].lon)
      };
      
      // Armazenar no cache
      cepCache.set(cleanCEP, coords);
      
      return coords;
    }
    
    const coords = {
      latitude: parseFloat(geoResponse.data[0].lat),
      longitude: parseFloat(geoResponse.data[0].lon)
    };
    
    // Armazenar no cache
    cepCache.set(cleanCEP, coords);
    
    return coords;
  } catch (error) {
    console.error('Error getting coordinates from CEP:', error);
    
    // Em caso de erro, retornar coordenadas padrão para não quebrar o fluxo
    // Em um ambiente de produção, seria melhor tratar melhor esse caso
    const fallbackCoords = {
      latitude: -23.5505, // São Paulo
      longitude: -46.6333
    };
    
    return fallbackCoords;
  }
}

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param {number} lat1 - Latitude do ponto 1
 * @param {number} lon1 - Longitude do ponto 1
 * @param {number} lat2 - Latitude do ponto 2
 * @param {number} lon2 - Longitude do ponto 2
 * @returns {number} - Distância em quilômetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Raio da Terra em km
  const R = 6371;
  
  // Converter latitudes e longitudes de graus para radianos
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // Fórmula de Haversine
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Converte graus para radianos
 * @param {number} deg - Graus
 * @returns {number} - Radianos
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = {
  getCoordinatesFromCEP,
  calculateDistance
};