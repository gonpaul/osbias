export function getServerApiBase(): string {
  return process.env.API_BASE_URL || 'http://localhost:3001/api';
}