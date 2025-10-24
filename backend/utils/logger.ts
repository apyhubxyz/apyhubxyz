// Simple logger
export function log(message: string) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}
