
export const getAssetUrl = (filename: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/cryingdev/lockharts-forge/main/assets/';
  // Add cache busting to ensure we get the latest version if updated
  // In production, we might want to remove this or use version numbers
  const timestamp = Date.now(); 
  return `${baseUrl}${filename}?v=${timestamp}`;
};
