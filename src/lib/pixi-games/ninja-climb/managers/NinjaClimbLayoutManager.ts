export interface NinjaClimbLayoutProfile {
  questionFontSize: number
  questionCounterFontSize: number
  answerFontSize: number
  answerBannerHeight: number
  answerBannerGap: number
  questionCardHeight: number
  bottomUIHeight: number
  powerupButtonSize: number
  sidePadding: number
  topPadding: number
  ninjaDisplaySize: number
  timerRadius: number
}

export class NinjaClimbLayoutManager {
  private currentLayoutProfile!: NinjaClimbLayoutProfile

  private readonly defaultProfile: NinjaClimbLayoutProfile = {
    questionFontSize: 22,
    questionCounterFontSize: 14,
    answerFontSize: 16,
    answerBannerHeight: 48,
    answerBannerGap: 10,
    questionCardHeight: 110,
    bottomUIHeight: 170,
    powerupButtonSize: 56,
    sidePadding: 16,
    topPadding: 12,
    ninjaDisplaySize: 72,
    timerRadius: 36,
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
    const widthScale = Math.min(1.2, Math.max(0.8, screenWidth / baseWidth))
    const heightScale = Math.min(1.2, Math.max(0.8, screenHeight / baseHeight))

    profile.questionFontSize = Math.round(profile.questionFontSize * widthScale)
    profile.questionCounterFontSize = Math.round(profile.questionCounterFontSize * widthScale)
    profile.answerFontSize = Math.round(profile.answerFontSize * widthScale)
    profile.answerBannerHeight = Math.round(profile.answerBannerHeight * heightScale)
    profile.answerBannerGap = Math.round(profile.answerBannerGap * heightScale)
    profile.questionCardHeight = Math.round(profile.questionCardHeight * heightScale)
    profile.bottomUIHeight = Math.round(profile.bottomUIHeight * heightScale)
    profile.powerupButtonSize = Math.round(profile.powerupButtonSize * widthScale)
    profile.sidePadding = Math.round(profile.sidePadding * widthScale)
    profile.topPadding = Math.round(profile.topPadding * heightScale)
    profile.ninjaDisplaySize = Math.round(profile.ninjaDisplaySize * widthScale)
    profile.timerRadius = Math.round(profile.timerRadius * widthScale)
  }
}
