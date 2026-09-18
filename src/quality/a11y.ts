export interface AccessibilityCheck {
  id: string
  passed: boolean
  message: string
  details?: string
}

const visibleText = (element: Element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim()

const hasAccessibleName = (element: Element) => {
  const ariaLabel = element.getAttribute('aria-label')?.trim()
  const labelledBy = element.getAttribute('aria-labelledby')?.trim()
  const title = element.getAttribute('title')?.trim()
  const text = visibleText(element)
  return Boolean(ariaLabel || labelledBy || title || text)
}

export function checkDocumentAccessibility(root: Document | Element): AccessibilityCheck[] {
  const documentRoot = root instanceof Document ? root : root.ownerDocument
  const checks: AccessibilityCheck[] = []
  const html = documentRoot?.documentElement

  checks.push({ id:'document-language', passed:Boolean(html?.getAttribute('lang')?.trim()), message:'The document declares a primary language.' })

  const ids = [...root.querySelectorAll('[id]')].map(element => element.id).filter(Boolean)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  checks.push({
    id:'unique-ids',
    passed:duplicateIds.length === 0,
    message:'IDs are unique within the document.',
    details:duplicateIds.length ? `Duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}` : undefined,
  })

  const controls = [...root.querySelectorAll('button, a[href], input, select, textarea, summary')]
  const unnamedControls = controls.filter(control => !hasAccessibleName(control))
  checks.push({
    id:'control-names',
    passed:unnamedControls.length === 0,
    message:'Interactive controls have accessible names.',
    details:unnamedControls.length ? `${unnamedControls.length} control(s) need an accessible name.` : undefined,
  })

  const images = [...root.querySelectorAll('img')]
  const imagesWithoutAlt = images.filter(image => !image.hasAttribute('alt'))
  checks.push({
    id:'image-alternatives',
    passed:imagesWithoutAlt.length === 0,
    message:'Images declare an alt attribute.',
    details:imagesWithoutAlt.length ? `${imagesWithoutAlt.length} image(s) are missing alt attributes.` : undefined,
  })

  const headings = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  const skippedHeadingLevels = headings.some((heading, index) => {
    if (index === 0) return false
    const previous = Number(headings[index - 1].tagName.slice(1))
    const current = Number(heading.tagName.slice(1))
    return current - previous > 1
  })
  checks.push({ id:'heading-structure', passed:!skippedHeadingLevels, message:'Heading levels do not skip a structural level.' })

  const mainLandmarks = root.querySelectorAll('main')
  checks.push({ id:'main-landmark', passed:mainLandmarks.length <= 1, message:'The inspected document has at most one main landmark.' })

  return checks
}
