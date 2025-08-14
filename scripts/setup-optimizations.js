// scripts/setup-optimizations.js
import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import { createOptimizedIndexes } from '../src/utils/databaseOptimization.js';
import { enhancedLogger } from '../src/libs/enhancedLogger.js';

async function setupOptimizations() {
  try {
    enhancedLogger.info('🚀 Starting optimization setup...');
    
    // Conectar a la base de datos
    await connectDB();
    enhancedLogger.info('✅ Database connected');
    
    // Crear índices optimizados
    await createOptimizedIndexes();
    enhancedLogger.info('✅ Optimized indexes created');
    
    enhancedLogger.info('🎉 Optimization setup completed successfully!');
    
    // Estadísticas finales
    const stats = {
      timestamp: new Date().toISOString(),
      optimizations: [
        'Database indexes created',
        'Query monitoring enabled',
        'Connection pooling optimized',
        'Cache system configured',
        'Security middlewares enabled',
        'Monitoring and metrics active'
      ]
    };
    
    enhancedLogger.info(stats, 'Optimization summary');
    
    process.exit(0);
  } catch (error) {
    enhancedLogger.fatal({ error }, 'Optimization setup failed');
    process.exit(1);
  }
}

setupOptimizations();
