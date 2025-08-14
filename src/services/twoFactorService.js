// src/services/twoFactorService.js
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import AppError from '../libs/appError.js';
import { logger } from '../libs/logger.js';

class TwoFactorAuthService {
  /**
   * Generar secreto 2FA para usuario
   */
  async generateSecret(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Generar secreto único
      const secret = speakeasy.generateSecret({
        name: `Parnassus Academy (${user.email})`,
        issuer: 'Parnassus Academy',
        length: 32
      });

      // Guardar secreto temporal (no activado aún)
      user.twoFactorSecret = secret.base32;
      user.twoFactorEnabled = false;
      await user.save();

      // Generar QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      logger.info('2FA secret generated', {
        userId,
        type: 'security_event',
        action: '2fa_secret_generated'
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      logger.error('Error generating 2FA secret', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Activar 2FA después de verificar código
   */
  async enable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorSecret) {
        throw new AppError('Secreto 2FA no encontrado', 400);
      }

      // Verificar token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1 // Permitir 1 ventana de tiempo (30 segundos antes/después)
      });

      if (!verified) {
        logger.warn('Failed 2FA verification attempt', {
          userId,
          type: 'security_event',
          action: '2fa_verification_failed'
        });
        throw new AppError('Código 2FA inválido', 400);
      }

      // Activar 2FA
      user.twoFactorEnabled = true;
      user.twoFactorBackupCodes = this.generateBackupCodes();
      await user.save();

      logger.info('2FA enabled successfully', {
        userId,
        type: 'security_event',
        action: '2fa_enabled'
      });

      return {
        success: true,
        backupCodes: user.twoFactorBackupCodes
      };
    } catch (error) {
      logger.error('Error enabling 2FA', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Desactivar 2FA
   */
  async disable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Verificar token o código de backup
      const isValidToken = this.verifyToken(user.twoFactorSecret, token);
      const isValidBackup = user.twoFactorBackupCodes?.includes(token);

      if (!isValidToken && !isValidBackup) {
        logger.warn('Failed 2FA disable attempt', {
          userId,
          type: 'security_event',
          action: '2fa_disable_failed'
        });
        throw new AppError('Código inválido', 400);
      }

      // Si se usó código de backup, removerlo
      if (isValidBackup) {
        user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(code => code !== token);
      }

      // Desactivar 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = undefined;
      await user.save();

      logger.info('2FA disabled successfully', {
        userId,
        type: 'security_event',
        action: '2fa_disabled'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error disabling 2FA', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Verificar código 2FA durante login
   */
  async verifyLoginToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new AppError('2FA no configurado', 400);
      }

      // Verificar token TOTP
      const isValidToken = this.verifyToken(user.twoFactorSecret, token);
      
      // Verificar código de backup
      const isValidBackup = user.twoFactorBackupCodes?.includes(token);

      if (!isValidToken && !isValidBackup) {
        logger.warn('Failed 2FA login attempt', {
          userId,
          type: 'security_event',
          action: '2fa_login_failed'
        });
        throw new AppError('Código 2FA inválido', 400);
      }

      // Si se usó código de backup, removerlo
      if (isValidBackup) {
        user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(code => code !== token);
        await user.save();

        logger.info('Backup code used for login', {
          userId,
          type: 'security_event',
          action: '2fa_backup_used'
        });
      }

      logger.info('2FA login successful', {
        userId,
        type: 'security_event',
        action: '2fa_login_success'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error verifying 2FA login', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Generar nuevos códigos de backup
   */
  async regenerateBackupCodes(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new AppError('2FA no configurado', 400);
      }

      const newBackupCodes = this.generateBackupCodes();
      user.twoFactorBackupCodes = newBackupCodes;
      await user.save();

      logger.info('Backup codes regenerated', {
        userId,
        type: 'security_event',
        action: '2fa_backup_regenerated'
      });

      return { backupCodes: newBackupCodes };
    } catch (error) {
      logger.error('Error regenerating backup codes', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Verificar si usuario tiene 2FA activado
   */
  async is2FAEnabled(userId) {
    try {
      const user = await User.findById(userId);
      return user?.twoFactorEnabled || false;
    } catch (error) {
      logger.error('Error checking 2FA status', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  /**
   * Obtener estadísticas de 2FA
   */
  async get2FAStats() {
    try {
      const totalUsers = await User.countDocuments();
      const users2FAEnabled = await User.countDocuments({ twoFactorEnabled: true });
      
      return {
        totalUsers,
        users2FAEnabled,
        adoptionRate: totalUsers > 0 ? ((users2FAEnabled / totalUsers) * 100).toFixed(2) : 0,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error getting 2FA stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  verifyToken(secret, token) {
    if (!secret || !token) return false;
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1
    });
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generar código de 8 dígitos
      const code = Math.random().toString().slice(2, 10);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Middleware para verificar 2FA en rutas protegidas
   */
  require2FA() {
    return async (req, res, next) => {
      try {
        const { userId } = req.user;
        const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;

        const user = await User.findById(userId);
        
        // Si el usuario tiene 2FA activado, verificar token
        if (user?.twoFactorEnabled) {
          if (!twoFactorToken) {
            return res.status(401).json({
              error: 'Token 2FA requerido',
              requires2FA: true
            });
          }

          await this.verifyLoginToken(userId, twoFactorToken);
        }

        next();
      } catch (error) {
        logger.error('2FA middleware error', {
          error: error.message,
          userId: req.user?.userId
        });
        
        res.status(401).json({
          error: 'Verificación 2FA fallida',
          requires2FA: true
        });
      }
    };
  }
}

export const twoFactorService = new TwoFactorAuthService();
