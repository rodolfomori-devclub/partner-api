const searchModel = require('../models/searchModel');

/**
 * Controlador para operações de busca
 */
class SearchController {
  /**
   * Buscar parceiros com base em filtros
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Próxima função middleware
   */
  async searchPartners(req, res, next) {
    try {
      const { level, studyTimes, excludeEmail } = req.query;
      
      // Preparar os filtros
      const filters = {};
      
      if (level) {
        filters.level = level;
      }
      
      if (studyTimes) {
        // Se studyTimes vier como string, converter para array
        filters.studyTimes = Array.isArray(studyTimes) ? studyTimes : [studyTimes];
      }
      
      if (excludeEmail) {
        filters.excludeEmail = excludeEmail;
      }
      
      // Realizar a busca
      const results = await searchModel.searchPartners(filters);
      
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar parceiros por proximidade
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Próxima função middleware
   */
  async searchNearby(req, res, next) {
    try {
      const { cep, radius = 100, level, studyTimes, excludeEmail } = req.query;
      
      if (!cep) {
        return res.status(400).json({ message: 'CEP é obrigatório para busca por proximidade' });
      }
      
      // Validar formato do CEP
      const cepRegex = /^\d{5}-?\d{3}$/;
      if (!cepRegex.test(cep)) {
        return res.status(400).json({ message: 'Formato de CEP inválido' });
      }
      
      // Converter radius para número
      const radiusNum = parseInt(radius, 10);
      
      // Preparar os filtros
      const filters = {};
      
      if (level) {
        filters.level = level;
      }
      
      if (studyTimes) {
        // Se studyTimes vier como string, converter para array
        filters.studyTimes = Array.isArray(studyTimes) ? studyTimes : [studyTimes];
      }
      
      if (excludeEmail) {
        filters.excludeEmail = excludeEmail;
      }
      
      // Realizar a busca
      const results = await searchModel.searchNearby(cep, radiusNum, filters);
      
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();