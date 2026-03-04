//v3
import Anthropic from '@anthropic-ai/sdk'
import { LanguageServiceClient } from '@google-cloud/language'
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

function extractContent($: cheerio.CheerioAPI) {
  $('script, style, nav, footer, header, noscript, iframe').remove()
  $('button, a.nav, .breadcrumb, [role="button"]').remove()
  $('[class*="cookie"], [class*="gdpr"], [class*="consent"], [id*="cookie"], [id*="gdpr"]').remove()

  // Inject spaces between all elements to prevent concatenation
  $('*').each((_, el) => {
    $(el).append(' ')
  })

  const ogTitle = $('meta[property="og:title"]').attr('content')
  const h1Text = $('h1').first().text().trim()
  const titleTag = $('title').text().trim()
  const title = ogTitle || h1Text || titleTag || 'Untitled'

  const metaDescription = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') || ''

  const h1 = $('h1').first().text().trim()

  // Extract headings from main content area only
  const contentArea = $('article, main, .content, #content, [role="main"]').first()
  const target = contentArea.length ? contentArea : $('body')

  const h2s = target.find('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h3s = target.find('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean)

  // Detect boilerplate headings outside main content
  const allH2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const boilerplateHeadings = allH2s.filter(h => !h2s.includes(h))

  // Extract table content explicitly before text() flattens it
  const tableText = $('table').map((_, table) => {
    return $(table).find('tr').map((_, row) => {
      return $(row).find('td, th').map((_, cell) =>
        $(cell).text().trim()
      ).get()
      .filter(cell => cell.length > 0)
      .join(' | ')
    }).get()
    .filter(row => row.length > 0)
    .join('\n')
  }).get().join('\n\n')

  const rawText = (target.text() || $('body').text())
    .replace(/\t/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim()

  const bodyText = (rawText + (tableText ? '\n\nTABLE CONTENT:\n' + tableText : '')).slice(0, 12000)

  return { title, metaDescription, h1, h2s, h3s, boilerplateHeadings, bodyText }
}

async function scrapeUrl(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AEOAuditor/1.0)' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  return extractContent($)
}

function parseHtml(html: string) {
  const $ = cheerio.load(html)
  return extractContent($)
}

async function getEntities(text: string) {
  const raw = process.env.GOOGLE_CREDENTIALS_JSON!
  const credentials = JSON.parse(raw)
  const client = new LanguageServiceClient({ credentials })

  const [result] = await client.analyzeEntities({
    document: { content: text, type: 'PLAIN_TEXT' as const }
  })

  return result.entities
    ?.filter(e => (e.salience ?? 0) > 0.01)
    .sort((a, b) => (b.salience ?? 0) - (a.salience ?? 0))
    .reduce((acc: any[], e) => {
      const name = e.name?.toLowerCase() ?? ''
      const alreadyExists = acc.find(x => {
        const existing = x.name?.toLowerCase() ?? ''
        return existing === name ||
               existing === name + 's' ||
               name === existing + 's' ||
               existing === name + 'es' ||
               name === existing + 'es'
      })
      if (!alreadyExists) {
        acc.push({ name: e.name, type: e.type, salience: e.salience })
      }
      return acc
    }, [])
    .slice(0, 20)
}

async function runAudit(content: any, entities: any, keyword: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const entityList = entities
    .map((e: any) => `${e.name} (${e.type}, salience: ${e.salience?.toFixed(3)})`)
    .join('\n')

  const prompt = `You are an AEO (Answer Engine Optimization) content auditor. Your job is to explain why AI systems like ChatGPT, Perplexity, or Google AI Overviews may not be citing or surfacing this content.

PAGE DETAILS:
Title: ${content.title}
Meta Description: ${content.metaDescription}
H1: ${content.h1}
H2s (main content): ${content.h2s.join(', ')}
H3s (main content): ${content.h3s?.join(', ')}
Boilerplate headings detected outside main content (cookie banners, footers, nav): ${content.boilerplateHeadings?.join(', ') || 'none'}
Target keyword: ${keyword || 'not specified'}

TOP ENTITIES DETECTED BY GOOGLE NLP:
${entityList}

CONTENT SAMPLE:
${content.bodyText.slice(0, 12000)}

Provide a structured AEO audit with exactly these sections:
1. **What This Page Is About** — summarize what Google NLP thinks this page covers based on entities
2. **Why AI May Not Be Citing This** — 3-4 specific findings, each with a one-sentence fix
3. **Structure Issues** — heading hierarchy, answer extractability, formatting problems. Call out any boilerplate headings polluting the heading hierarchy.
4. **Quick Wins** — top 3 changes ranked by effort vs impact

Be specific and actionable. No generic advice. Reference actual content from the page.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }]
  })

  return (message.content[0] as any).text
}

export async function POST(req: NextRequest) {
  const { url, keyword, rawHtml } = await req.json()

  if (!url && !rawHtml) {
    return NextResponse.json({ error: 'URL or HTML is required' }, { status: 400 })
  }

  try {
    const content = rawHtml ? parseHtml(rawHtml) : await scrapeUrl(url)
    const entities = await getEntities(content.bodyText)
    const audit = await runAudit(content, entities, keyword)
    return NextResponse.json({ content, entities, audit })
  } catch (err) {
    console.error('FULL ERROR:', err)
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 })
  }
}