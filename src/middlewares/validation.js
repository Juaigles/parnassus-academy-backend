import { ZodError } from 'zod';

/**
 * Middleware para validar request con esquemas Zod
 * @param {Object} schema - Esquema Zod con propiedades body, params, query
 * @returns {Function} Middleware de Express
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validar cada parte del request según el esquema
      const validationData = {};
      
      if (schema.shape.body) {
        validationData.body = req.body;
      }
      
      if (schema.shape.params) {
        validationData.params = req.params;
      }
      
      if (schema.shape.query) {
        validationData.query = req.query;
      }
      
      // Validar datos
      const validatedData = schema.parse(validationData);
      
      // Actualizar request con datos validados
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) req.query = validatedData.query;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: formattedErrors
        });
      }
      
      // Error no relacionado con validación
      next(error);
    }
  };
};
