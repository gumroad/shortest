import { MobileElement } from '../mobile-driver'
import { MobileRunnerConfig } from '../../../types'
import type { TouchAction } from 'webdriverio'

export interface BaseMobileDriver {
  init(): Promise<void>
  findElement(selector: string): Promise<MobileElement | null>
  tap(element: MobileElement): Promise<void>
  type(element: MobileElement, text: string): Promise<void>
  scroll(direction: 'up' | 'down', amount: number): Promise<void>
  getWindowSize(): Promise<{ width: number; height: number }>
  performGesture(gesture: TouchAction[]): Promise<void>
  quit(): Promise<void>
}

export abstract class AbstractMobileDriver implements BaseMobileDriver {
  protected config: MobileRunnerConfig

  constructor(config: MobileRunnerConfig) {
    this.config = config
  }

  abstract init(): Promise<void>
  abstract findElement(selector: string): Promise<MobileElement | null>
  abstract tap(element: MobileElement): Promise<void>
  abstract type(element: MobileElement, text: string): Promise<void>
  abstract scroll(direction: 'up' | 'down', amount: number): Promise<void>
  abstract getWindowSize(): Promise<{ width: number; height: number }>
  abstract performGesture(gesture: TouchAction[]): Promise<void>
  abstract quit(): Promise<void>
} 