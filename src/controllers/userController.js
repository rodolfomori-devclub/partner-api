const userModel = require('../models/userModel');

/**
 * Controlador para operações relacionadas a usuários
 */
class UserController {
  /**
   * Criar um novo usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Próxima função middleware
   */
  async register(req, res, next) {
    try {
      // Validar dados do usuário
      const { name, email, whatsapp, studyTimes, cep, level, about, avatarUrl } = req.body;
      
      if (!name || !email || !whatsapp || !studyTimes || !cep || !level || !about) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      if (!Array.isArray(studyTimes) || studyTimes.length === 0) {
        return res.status(400).json({ message: 'Selecione pelo menos um horário de estudo' });
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de email inválido' });
      }
      
      // Validar formatação do CEP
      const cepRegex = /^\d{5}-?\d{3}$/;
      if (!cepRegex.test(cep)) {
        return res.status(400).json({ message: 'Formato de CEP inválido' });
      }
      
      // Criar o usuário
      const userData = {
        name,
        email,
        whatsapp,
        studyTimes,
        cep,
        level,
        about,
        avatarUrl: avatarUrl || `https://robohash.org/${encodeURIComponent(email)}?set=set3&size=200x200`
      };
      
      const user = await userModel.createUser(userData);
      
      // Retornar o usuário criado
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar credenciais do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Próxima função middleware
   */
  async verifyCredentials(req, res, next) {
    try {
      const { email, whatsapp } = req.body;
      
      if (!email || !whatsapp) {
        return res.status(400).json({ message: 'Email e WhatsApp são obrigatórios' });
      }
      
      const user = await userModel.verifyCredentials(email, whatsapp);
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar dados do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Próxima função middleware
   */
  async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { name, whatsapp, studyTimes, cep, level, about } = req.body;
      
      // Validar dados
      if (studyTimes && (!Array.isArray(studyTimes) || studyTimes.length === 0)) {
        return res.status(400).json({ message: 'Selecione pelo menos um horário de estudo' });
      }
      
      if (cep) {
        const cepRegex = /^\d{5}-?\d{3}$/;
        if (!cepRegex.test(cep)) {
          return res.status(400).json({ message: 'Formato de CEP inválido' });
        }
      }
      
      // Montar objeto com dados a serem atualizados
      const userData = {};
      
      if (name) userData.name = name;
      if (whatsapp) userData.whatsapp = whatsapp;
      if (studyTimes) userData.studyTimes = studyTimes;
      if (cep) userData.cep = cep;
      if (level) userData.level = level;
      if (about) userData.about = about;
      
      // Atualizar o usuário
      const user = await userModel.updateUser(userId, userData);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();