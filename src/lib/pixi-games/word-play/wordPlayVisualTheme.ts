/**
 * Word Play's game-specific palette. Cards stay white with dark text across
 * every selected background theme; color is reserved for outlines, accents,
 * and character motion so readability never depends on the background.
 */
export const WORD_PLAY_VISUAL_THEME = {
  text: '#114257',
  cardFill: '#FFFFFF',
  workspaceFill: '#FFFDF7',
  trayFill: '#FFFFFF',
  outlines: ['#35BDF4', '#FFB43B', '#F56FA7', '#65C979', '#8C78F0'],
  softFills: ['#E9F8FF', '#FFF4D8', '#FFEAF3', '#EAF9ED', '#F0ECFF'],
  checkFill: '#FFE36E',
  checkBorder: '#F5A623',
  checkShadow: '#D77B13',
  helperHome: '#FFD85A',
  helperRoof: '#F29B38',
} as const

export function wordPlayOutline(index: number): string {
  return WORD_PLAY_VISUAL_THEME.outlines[index % WORD_PLAY_VISUAL_THEME.outlines.length]
}

export function wordPlaySoftFill(index: number): string {
  return WORD_PLAY_VISUAL_THEME.softFills[index % WORD_PLAY_VISUAL_THEME.softFills.length]
}
