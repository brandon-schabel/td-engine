export enum GameMode {
  CLASSIC = 'classic',
  SURVIVAL = 'survival',
  VERSUS = 'versus',
  COOP = 'coop'
}

export interface GameModeConfig {
  mode: GameMode;
  name: string;
  description: string;
  maxPlayers: number;
  features: {
    waves: boolean;
    pvp: boolean;
    coop: boolean;
    infiniteWaves: boolean;
    resourceSharing: boolean;
  };
}