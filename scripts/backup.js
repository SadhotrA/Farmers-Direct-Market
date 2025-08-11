const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('../src/lib/logger');

// Configuration
const config = {
  backupDir: path.join(__dirname, '../backups'),
  retentionDays: process.env.BACKUP_RETENTION_DAYS || 30,
  compression: process.env.BACKUP_COMPRESSION !== 'false', // default to true
  maxBackups: process.env.MAX_BACKUPS || 100
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
  logger.info('Created backup directory', { path: config.backupDir });
}

// Generate backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `farmerdm-backup-${timestamp}${config.compression ? '.gz' : ''}`;
const filepath = path.join(config.backupDir, filename);

// Clean old backups
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(config.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('farmerdm-backup-'))
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        stats: fs.statSync(path.join(config.backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // Remove files older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

    const filesToDelete = backupFiles.filter(file => 
      file.stats.mtime < cutoffDate
    );

    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      logger.info('Deleted old backup file', { 
        filename: file.name, 
        age: `${Math.floor((Date.now() - file.stats.mtime.getTime()) / (1000 * 60 * 60 * 24))} days` 
      });
    });

    // Keep only the most recent files if we exceed maxBackups
    if (backupFiles.length > config.maxBackups) {
      const excessFiles = backupFiles.slice(config.maxBackups);
      excessFiles.forEach(file => {
        fs.unlinkSync(file.path);
        logger.info('Deleted excess backup file', { filename: file.name });
      });
    }

    logger.info('Backup cleanup completed', {
      deleted: filesToDelete.length + Math.max(0, backupFiles.length - config.maxBackups),
      remaining: Math.min(backupFiles.length, config.maxBackups)
    });
  } catch (error) {
    logger.error('Error during backup cleanup', { error: error.message });
  }
}

// Perform backup
function performBackup() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    // Build mongodump command
    let command = `mongodump --uri="${process.env.MONGODB_URI}"`;
    
    if (config.compression) {
      command += ` --archive="${filepath}" --gzip`;
    } else {
      command += ` --out="${filepath.replace('.gz', '')}"`;
    }

    logger.info('Starting database backup', {
      filename,
      compression: config.compression,
      uri: process.env.MONGODB_URI ? 'configured' : 'missing'
    });

    exec(command, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        logger.error('Backup failed', {
          error: error.message,
          stderr,
          duration: `${duration}ms`
        });
        reject(error);
        return;
      }

      // Get file size
      let fileSize = 0;
      try {
        const stats = fs.statSync(filepath);
        fileSize = stats.size;
      } catch (err) {
        logger.warn('Could not get backup file size', { error: err.message });
      }

      logger.info('Backup completed successfully', {
        filename,
        fileSize: `${Math.round(fileSize / 1024 / 1024)}MB`,
        duration: `${duration}ms`,
        path: filepath
      });

      resolve({
        filename,
        filepath,
        fileSize,
        duration
      });
    });
  });
}

// Main backup function
async function runBackup() {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    logger.info('Starting backup process', {
      backupDir: config.backupDir,
      retentionDays: config.retentionDays,
      maxBackups: config.maxBackups,
      compression: config.compression
    });

    // Clean old backups first
    cleanOldBackups();

    // Perform backup
    const result = await performBackup();

    logger.info('Backup process completed', result);
    
    return result;
  } catch (error) {
    logger.error('Backup process failed', { error: error.message });
    process.exit(1);
  }
}

// Run backup if this script is executed directly
if (require.main === module) {
  runBackup();
}

module.exports = {
  runBackup,
  cleanOldBackups,
  config
};
