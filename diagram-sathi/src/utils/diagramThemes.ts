export interface DiagramThemeStyles {
  borderColor: string;
  fillColor: string;
  textColor: string;
  edgeColor: string;
}

export type DiagramThemeType = 'default' | 'classic' | 'navy' | 'forest' | 'amber' | 'blueprint';

export const getDiagramThemeStyles = (
  theme: DiagramThemeType,
  appTheme: 'light' | 'dark'
): DiagramThemeStyles | null => {
  if (!theme || theme === 'default') return null;

  switch (theme) {
    case 'classic':
      return {
        borderColor: '#000000',
        fillColor: '#ffffff',
        textColor: '#000000',
        edgeColor: '#000000',
      };
    case 'navy':
      return appTheme === 'light'
        ? {
            borderColor: '#1e3a8a',
            fillColor: '#f1f5f9',
            textColor: '#0f172a',
            edgeColor: '#475569',
          }
        : {
            borderColor: '#3b82f6',
            fillColor: '#0f172a',
            textColor: '#ffffff',
            edgeColor: '#94a3b8',
          };
    case 'forest':
      return appTheme === 'light'
        ? {
            borderColor: '#0f766e',
            fillColor: '#f0fdfa',
            textColor: '#115e59',
            edgeColor: '#0d9488',
          }
        : {
            borderColor: '#14b8a6',
            fillColor: '#115e59',
            textColor: '#ccfbf1',
            edgeColor: '#2dd4bf',
          };
    case 'amber':
      return appTheme === 'light'
        ? {
            borderColor: '#b45309',
            fillColor: '#fffbeb',
            textColor: '#78350f',
            edgeColor: '#d97706',
          }
        : {
            borderColor: '#f59e0b',
            fillColor: '#451a03',
            textColor: '#fef3c7',
            edgeColor: '#fbbf24',
          };
    case 'blueprint':
      return appTheme === 'light'
        ? {
            borderColor: '#2563eb',
            fillColor: '#eff6ff',
            textColor: '#1d4ed8',
            edgeColor: '#3b82f6',
          }
        : {
            borderColor: '#06b6d4',
            fillColor: '#082f49',
            textColor: '#cffafe',
            edgeColor: '#22d3ee',
          };
    default:
      return null;
  }
};
