'use strict'

/**
 * Utilidades para garantizar que el contenido de las lecciones siempre quede
 * guardado en Markdown.
 *
 * Este archivo es la ÚNICA fuente de verdad de la lógica de conversión:
 * - El API lo usa con require() al crear/editar versiones de lección.
 * - El script de mongosh (scripts/normalize-chapter-markdown.mongo.js) lo carga
 *   con load() para migrar las lecciones ya existentes.
 *
 * Por eso no debe usar require() de otros módulos ni APIs de Node: solo JS puro.
 */

// Instrucciones de formato que se envían al asistente de OpenAI en cada run.
const MARKDOWN_INSTRUCTIONS = [
  'FORMATO DE SALIDA (OBLIGATORIO):',
  '- Devuelve ÚNICAMENTE el contenido en formato Markdown válido.',
  '- No envuelvas la respuesta en bloques de código (```), ni uses HTML ni JSON.',
  '- Usa "# " para el título, "## " para las secciones y "### " para las subsecciones.',
  '- Usa "- " para las listas, "1. " para las numeradas, **negritas** para los conceptos clave',
  '  y "> " para las ideas destacadas o citas.',
  '- Deja una línea en blanco entre párrafos, títulos y listas.',
  '- No agregues comentarios, notas del asistente ni referencias a los archivos consultados.'
].join('\n')

// Palabras con las que suele empezar un título dentro de una lección.
const HEADING_KEYWORDS = /^(m[óo]dulo|lecci[óo]n|cap[íi]tulo|unidad|tema|secci[óo]n|parte|introducci[óo]n|desarrollo|contenido|conclusi[óo]n(es)?|objetivos?|competencias?|resumen|s[íi]ntesis|ejemplos?|caso[s]? pr[áa]ctico[s]?|actividad(es)?|ejercicios?|pr[áa]ctica|evaluaci[óo]n|autoevaluaci[óo]n|referencias|bibliograf[íi]a|glosario|recursos|cierre|reflexi[óo]n|puntos? clave|ideas? clave|para recordar)\b/i

const BULLET_LINE = /^(\s*)([•‣▪▫●◦·*+–—-])[ \t]+(.+)$/
const ORDERED_LINE = /^(\s*)(\d+)[.)][ \t]+(.+)$/
const ATX_HEADING = /^#{1,6}\s+\S/

const toText = value => (typeof value === 'string' ? value : '')

/**
 * Quita los artefactos que agrega el asistente de OpenAI:
 * citas de file_search (【4:0†source】), marcas [12:3†archivo.pdf] y espacios raros.
 */
const stripAssistantArtifacts = text => {
  return toText(text)
    .replace(/【[^】]*†[^】]*】/g, '')
    .replace(/\[\d+:\d+†[^\]]*\]/g, '')
    .replace(/[​-‍﻿]/g, '')
}

/**
 * Si TODO el contenido viene envuelto en un bloque de código (```markdown ... ```)
 * lo desenvuelve: si no, react-markdown lo pinta como un bloque de código gigante.
 */
const unwrapOuterFence = text => {
  const trimmed = toText(text).trim()
  if (!trimmed.startsWith('```')) {
    return toText(text)
  }

  const fences = trimmed.match(/^```/gm)
  if (!fences || fences.length !== 2 || !trimmed.endsWith('```')) {
    return toText(text)
  }

  return trimmed
    .replace(/^```[a-zA-Z]*[ \t]*\n?/, '')
    .replace(/\n?```$/, '')
}

/** Normaliza saltos de línea, tabs y líneas en blanco de más. */
const normalizeWhitespace = text => {
  return toText(text)
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Limpieza previa común a cualquier contenido que llega del asistente. */
const cleanContent = text => normalizeWhitespace(unwrapOuterFence(stripAssistantArtifacts(text)))

/** Cuenta las señales de Markdown presentes en el texto. */
const analyzeMarkdown = text => {
  const content = toText(text)
  const lines = content.split('\n')

  const headings = lines.filter(line => ATX_HEADING.test(line.trim())).length
  const bullets = lines.filter(line => /^\s*[-*+]\s+\S/.test(line)).length
  const ordered = lines.filter(line => /^\s*\d+\.\s+\S/.test(line)).length
  const quotes = lines.filter(line => /^\s*>\s+\S/.test(line)).length
  const tables = lines.filter(line => /^\s*\|.*\|\s*$/.test(line)).length
  const fences = (content.match(/^```/gm) || []).length
  const bold = (content.match(/\*\*[^*\n]+\*\*/g) || []).length
  const links = (content.match(/\[[^\]\n]+\]\([^)\s]+\)/g) || []).length

  let score = 0
  if (headings > 0) score += 2
  if (bullets + ordered >= 2) score += 1
  if (bold >= 2) score += 1
  if (quotes > 0 || tables > 0 || fences >= 2 || links > 0) score += 1

  return { headings, bullets, ordered, quotes, tables, fences, bold, links, score }
}

/**
 * ¿El contenido ya está en Markdown?
 * Se exige al menos un título ATX: una lección de miles de palabras sin ningún
 * "#" es texto plano aunque tenga alguna negrita suelta.
 */
const isMarkdown = text => {
  const content = toText(text).trim()
  if (!content) return false
  const stats = analyzeMarkdown(content)
  return stats.headings > 0 && stats.score >= 2
}

const isAllCaps = line => {
  const letters = line.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '')
  return letters.length >= 3 && letters === letters.toUpperCase()
}

const looksLikeHeading = (lines, index) => {
  const line = lines[index]
  const value = line.trim()
  if (!value) return false
  if (value.length > 90) return false
  if (BULLET_LINE.test(line)) return false
  if (/[.;,]$/.test(value)) return false

  const prev = index > 0 ? lines[index - 1] : ''
  const next = index < lines.length - 1 ? lines[index + 1] : ''
  const prevBlank = !prev || !prev.trim()
  const nextBlank = !next || !next.trim()

  // Solo cuentan los renglones pegados: una línea en blanco cierra el bloque,
  // así que una lista anterior ya no arrastra a la línea actual.
  const isListLine = candidate => BULLET_LINE.test(candidate) || ORDERED_LINE.test(candidate)
  const insideList = isListLine(prev) || isListLine(next)

  // **Título** solo en su línea
  if (/^\*\*[^*]+\*\*:?$/.test(value)) return true

  // "1. Los canales digitales" es título solo si no forma parte de una lista
  if (ORDERED_LINE.test(line)) {
    return !insideList && (prevBlank || nextBlank) && /^[\d]+[.)]\s+[A-ZÁÉÍÓÚÑ¿¡"']/.test(value)
  }

  // 2.3 Nombre de sección
  if (/^\d+(\.\d+)+[.)]?\s+\S/.test(value) && (prevBlank || nextBlank)) return true
  if (HEADING_KEYWORDS.test(value) && (prevBlank || nextBlank)) return true
  if (isAllCaps(value) && value.split(/\s+/).length <= 12) return true
  if (/:$/.test(value) && value.length <= 60 && value.split(/\s+/).length <= 5 && prevBlank) return true
  // Línea corta, aislada, que empieza en mayúscula y no cierra oración
  if (prevBlank && nextBlank && value.length <= 70 && !/[!?:]$/.test(value) && /^[A-ZÁÉÍÓÚÑ¿¡"']/.test(value)) return true

  return false
}

const headingLevel = (value, isFirst) => {
  if (isFirst) return 1
  const numbered = value.match(/^(\d+(?:\.\d+)*)[.)]?\s+/)
  if (numbered) {
    return Math.min(2 + numbered[1].split('.').length - 1, 6)
  }
  if (HEADING_KEYWORDS.test(value) || isAllCaps(value)) return 2
  if (/^\*\*[^*]+\*\*:?$/.test(value) || /:$/.test(value)) return 3
  return 2
}

const cleanHeadingText = value => {
  return value
    .replace(/^\*\*(.+?)\*\*:?$/, '$1')
    .replace(/:$/, '')
    .replace(/^#+\s*/, '')
    .trim()
}

/** Convierte texto plano (o semiestructurado) a Markdown. */
const toMarkdown = text => {
  const content = cleanContent(text)
  if (!content) return ''

  const lines = content.split('\n')
  const out = []
  let firstHeadingDone = false

  const lastLine = () => (out.length ? out[out.length - 1] : null)
  const pushBlank = () => {
    if (out.length && lastLine() !== '') out.push('')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const value = line.trim()

    if (!value) {
      pushBlank()
      continue
    }

    // Ya es un título Markdown: se respeta
    if (ATX_HEADING.test(value)) {
      pushBlank()
      out.push(value)
      out.push('')
      firstHeadingDone = true
      continue
    }

    const bullet = line.match(BULLET_LINE)
    if (bullet) {
      const indent = bullet[1].length >= 2 ? '  ' : ''
      if (lastLine() !== '' && !/^\s*[-\d]/.test(lastLine() || '')) pushBlank()
      out.push(indent + '- ' + bullet[3].trim())
      continue
    }

    const ordered = line.match(ORDERED_LINE)
    if (ordered && !looksLikeHeading(lines, i)) {
      const indent = ordered[1].length >= 2 ? '  ' : ''
      if (lastLine() !== '' && !/^\s*[-\d]/.test(lastLine() || '')) pushBlank()
      out.push(indent + ordered[2] + '. ' + ordered[3].trim())
      continue
    }

    if (looksLikeHeading(lines, i)) {
      const level = headingLevel(value, !firstHeadingDone)
      pushBlank()
      out.push('#'.repeat(level) + ' ' + cleanHeadingText(value))
      out.push('')
      firstHeadingDone = true
      continue
    }

    out.push(value)
  }

  let result = out.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  // Si el texto no tenía ninguna pista de título, al menos se marca el primer
  // renglón como título para que nunca quede un documento sin estructura.
  if (!/^#{1,6}\s/m.test(result)) {
    const parts = result.split('\n')
    const first = parts.shift()
    result = ['# ' + cleanHeadingText(first), '', parts.join('\n').trim()].join('\n').trim()
  }

  return result
}

/**
 * Punto de entrada: limpia el contenido y lo devuelve siempre en Markdown.
 * Si ya venía en Markdown solo se limpia (no se reescribe).
 */
const normalizeLessonContent = text => {
  const cleaned = cleanContent(text)
  if (!cleaned) return ''
  return isMarkdown(cleaned) ? cleaned : toMarkdown(cleaned)
}

const countWords = text => {
  return toText(text).trim().split(/\s+/).filter(word => word.length > 0).length
}

const markdownUtils = {
  MARKDOWN_INSTRUCTIONS,
  stripAssistantArtifacts,
  unwrapOuterFence,
  cleanContent,
  analyzeMarkdown,
  isMarkdown,
  toMarkdown,
  normalizeLessonContent,
  countWords
}

// En Node se exporta como módulo; en mongosh (load()) se expone como global
// para que el script de migración pueda usar exactamente la misma lógica.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = markdownUtils
}
if (typeof globalThis !== 'undefined') {
  globalThis.markdownUtils = markdownUtils
}
