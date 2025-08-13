// src/middlewares/rawBody.js
/**
 * Middleware para capturar el raw body necesario para webhooks de Stripe
 */
export function rawBodyMiddleware(req, res, next) {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON'
        });
      }
      next();
    });
  } else {
    next();
  }
}
