import { marked, Renderer } from 'marked'
import hljs from 'highlight.js'

// Create custom renderer for additional options
const renderer = new Renderer()

// Add target="_blank" to external links
renderer.link = ({ href, title, text }) => {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'))
  const titleAttr = title ? ` title="${title}"` : ''
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a href="${href}"${titleAttr}${targetAttr}>${text}</a>`
}

// Configure marked with options
marked.setOptions({
  renderer,
  highlight: (code: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      } catch {
        return code
      }
    }
    return code
  },
  gfm: true,
  breaks: false,
  pedantic: false
})

/**
 * Parse markdown content to HTML
 * @param content - Raw markdown string
 * @returns Rendered HTML string
 */
export function parseMarkdown(content: string): string {
  try {
    return marked(content) as string
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return `<p style="color: red;">Error parsing markdown</p>`
  }
}
