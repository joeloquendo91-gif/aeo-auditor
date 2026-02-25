import ReactMarkdown from 'react-markdown'
import Anthropic from '@anthropic-ai/sdk'
import { LanguageServiceClient } from '@google-cloud/language'
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

async function scrapeUrl(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AEOAuditor/1.0)' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, noscript, iframe').remove()

  const ogTitle = $('meta[property="og:title"]').attr('content')
  const h1Text = $('h1').first().text().trim()
  const titleTag = $('title').text().trim()
  const title = ogTitle || h1Text || titleTag || 'Untitled'

  const metaDescription = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') || ''
  const h1 = $('h1').first().text().trim()
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get()
  
  // Get text from meaningful content areas only
  const bodyText = ($('article, main, .content, #content, body').first().text() || $('body').text())
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)

  return { title, metaDescription, h1, h2s, bodyText }
}
function parseHtml(html: string) {
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, noscript, iframe').remove()

  // Try to get the best title — in order of reliability
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const h1Text = $('h1').first().text().trim()
  const titleTag = $('title').text().trim()

  const title = ogTitle || h1Text || titleTag || 'Untitled'

  const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || ''
  const h1 = $('h1').first().text().trim()
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get()
  const bodyText = ($('article, main, .content, #content, body').first().text() || $('body').text())
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)

  return { title, metaDescription, h1, h2s, bodyText }
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
  async function getEntities(text: string) {
  const raw = process.env.GOOGLE_CREDENTIALS_JSON!
  console.log('JSON starts with:', raw.substring(0, 50))
  
  const credentials = JSON.parse(raw)
  console.log('Parsed type:', credentials.type)
  console.log('Parsed email:', credentials.client_email)

  const client = new LanguageServiceClient({ credentials })

  const [result] = await client.analyzeEntities({
    document: { content: text, type: 'PLAIN_TEXT' as const }
  })

  return result.entities
    ?.filter(e => (e.salience ?? 0) > 0.01)
    .sort((a, b) => (b.salience ?? 0) - (a.salience ?? 0))
    .reduce((acc: any[], e) => {
      const name = e.name?.toLowerCase() ?? ''
      if (!acc.find(x => x.name?.toLowerCase() === name)) {
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
H2s: ${content.h2s.join(', ')}
Target keyword: ${keyword || 'not specified'}

TOP ENTITIES DETECTED BY GOOGLE NLP:
${entityList}

CONTENT SAMPLE:
${content.bodyText.slice(0, 3000)}

Provide a structured AEO audit with exactly these sections:
1. **What This Page Is About** — summarize what Google NLP thinks this page covers based on entities
2. **Why AI May Not Be Citing This** — 3-4 specific findings, each with a one-sentence fix
3. **Structure Issues** — heading hierarchy, answer extractability, formatting problems
4. **Quick Wins** — top 3 changes ranked by effort vs impact

Be specific and actionable. No generic advice. Reference actual content from the page.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  })

  return (message.content[0] as any).text
}