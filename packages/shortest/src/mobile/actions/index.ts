import { MobileElement, MobileDriver } from '../core'

export async function tap(driver: MobileDriver, element: MobileElement): Promise<void> {
  await driver.tap(element)
}

export async function type(driver: MobileDriver, element: MobileElement, text: string): Promise<void> {
  await driver.type(element, text)
}

export async function scroll(
  driver: MobileDriver,
  direction: 'up' | 'down',
  amount: number = 0.5
): Promise<void> {
  await driver.scroll(direction, amount)
}

export async function swipe(
  driver: MobileDriver,
  direction: 'left' | 'right' | 'up' | 'down',
  startPercentage: number = 0.8,
  endPercentage: number = 0.2
): Promise<void> {
  const { width, height } = await driver.getWindowSize()
  
  let startX: number
  let startY: number
  let endX: number
  let endY: number

  switch (direction) {
    case 'left':
      startX = width * startPercentage
      endX = width * endPercentage
      startY = endY = height / 2
      break
    case 'right':
      startX = width * endPercentage
      endX = width * startPercentage
      startY = endY = height / 2
      break
    case 'up':
      startY = height * startPercentage
      endY = height * endPercentage
      startX = endX = width / 2
      break
    case 'down':
      startY = height * endPercentage
      endY = height * startPercentage
      startX = endX = width / 2
      break
  }

  await driver.performGesture([
    { action: 'press', x: startX, y: startY },
    { action: 'wait', ms: 100 },
    { action: 'moveTo', x: endX, y: endY },
    { action: 'release' }
  ])
}

export async function longPress(
  driver: MobileDriver,
  element: MobileElement,
  duration: number = 1000
): Promise<void> {
  await driver.performGesture([
    { action: 'press', element: element.id },
    { action: 'wait', ms: duration },
    { action: 'release' }
  ])
}