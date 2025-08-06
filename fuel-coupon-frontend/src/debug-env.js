// Debug environment configuration for production builds
// This file is imported conditionally and helps with production debugging

export const debugConfig = {
  showConsoleLogsInProduction: false,
  enableDetailedErrorReporting: true,
  apiCallLogging: false,
  performanceLogging: false
};

export const logDebug = (message: string, data?: any) => {
  if (debugConfig.showConsoleLogsInProduction) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const logError = (message: string, error?: any) => {
  if (debugConfig.enableDetailedErrorReporting) {
    console.error(`[ERROR] ${message}`, error);
  }
};

export default debugConfig;
