export interface NinjaClimbLayoutProfile {
  skyBandHeight: number
  bottomBarHeight: number
  questionFontSize: number
  questionCounterFontSize: number
  answerFontSize: number
  cloudWidth: number
  cloudHeight: number
  powerupButtonSize: number
  trayPadding: number
  sidePadding: number
  topPadding: number
  ninjaDisplaySize: number
  timerRadius: number
  /** Extra drop below the React nav cluster so the timer is not covered. */
  timerNavClearance: number
  questionImageMaxWidth: number
  questionImageMaxHeight: number
  /** Gap between Team 1 power tray and the question image. */
  questionImageGap: number
  stepHeight: number
  stepsPerSection: number
  pathMargin: number
}

export class NinjaClimbLayoutManager {
  private currentLayoutProfile!: NinjaClimbLayoutProfile

  private readonly defaultProfile: NinjaClimbLayoutProfile = {
    skyBandHeight: 260,
    bottomBarHeight: 150,
    questionFontSize: 22,
    questionCounterFontSize: 14,
    answerFontSize: 18,
    cloudWidth: 270,
    cloudHeight: 148,
    powerupButtonSize: 44,
    trayPadding: 10,
    sidePadding: 16,
    topPadding: 10,
    ninjaDisplaySize: 64,
    timerRadius: 52,
    timerNavClearance: 88,
    questionImageMaxWidth: 156,
    questionImageMaxHeight: 143,
    questionImageGap: 32,
    stepHeight: 90,
    stepsPerSection: 4,
    pathMargin: 140,
  }

  constructor(initialScreenWidth: number, initialScreenHeight: number) {
    this.updateLayout(initialScreenWidth, initialScreenHeight)
  }

  public updateLayout(screenWidth: number, screenHeight: number): void {
    this.currentLayoutProfile = this._getLayoutParameters(screenWidth, screenHeight)
  }

  public getLayoutParams(): NinjaClimbLayoutProfile {
    if (!this.currentLayoutProfile) {
      throw new Error('NinjaClimbLayoutManager: Layout profile accessed before initial calculation.')
    }
    return this.currentLayoutProfile
  }

  /** Play window between sky band and bottom bar. */
  public getPlayWindow(screenHeight: number): { top: number; bottom: number; height: number } {
    const p = this.getLayoutParams()
    const top = p.skyBandHeight
    const bottom = screenHeight - p.bottomBarHeight
    return { top, bottom, height: Math.max(1, bottom - top) }
  }

  private _getLayoutParameters(screenWidth: number, screenHeight: number): NinjaClimbLayoutProfile {
    const profile = { ...this.defaultProfile }
    this._applyResponsiveScaling(profile, screenWidth, screenHeight)
    return profile
  }

  private _applyResponsiveScaling(
    profile: NinjaClimbLayoutProfile,
    screenWidth: number,
    screenHeight: number
  ): void {
    const baseWidth = 1200
    const baseHeight = 700
    const widthScale = Math.min(1.2, Math.max(0.75, screenWidth / baseWidth))
    const heightScale = Math.min(1.2, Math.max(0.75, screenHeight / baseHeight))

    profile.skyBandHeight = Math.round(Math.min(screenHeight * 0.38, profile.skyBandHeight * heightScale))
    profile.bottomBarHeight = Math.round(
      Math.max(130, Math.min(180, profile.bottomBarHeight * heightScale))
    )
    profile.questionFontSize = Math.round(profile.questionFontSize * widthScale)
    profile.questionCounterFontSize = Math.round(profile.questionCounterFontSize * widthScale)
    profile.answerFontSize = Math.round(profile.answerFontSize * widthScale)
    profile.cloudWidth = Math.round(profile.cloudWidth * widthScale)
    profile.cloudHeight = Math.round(profile.cloudHeight * heightScale)
    profile.powerupButtonSize = Math.round(profile.powerupButtonSize * widthScale)
    profile.trayPadding = Math.round(profile.trayPadding * widthScale)
    profile.sidePadding = Math.round(profile.sidePadding * widthScale)
    profile.topPadding = Math.round(profile.topPadding * heightScale)
    profile.ninjaDisplaySize = Math.round(profile.ninjaDisplaySize * widthScale)
    profile.timerRadius = Math.round(profile.timerRadius * widthScale)
    profile.timerNavClearance = Math.round(profile.timerNavClearance * heightScale)
    profile.questionImageMaxWidth = Math.round(profile.questionImageMaxWidth * widthScale)
    profile.questionImageMaxHeight = Math.round(profile.questionImageMaxHeight * heightScale)
    profile.questionImageGap = Math.round(profile.questionImageGap * widthScale)
    profile.stepHeight = Math.round(profile.stepHeight * heightScale)
    profile.pathMargin = Math.round(profile.pathMargin * widthScale)
  }
}
