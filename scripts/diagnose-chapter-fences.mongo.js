/**
 * DIAGNÓSTICO (solo lectura) de las lecciones que empiezan con ``` pero que el
 * normalizador NO puede desenvolver automáticamente.
 *
 * USO
 * ---
 *   cd ~/Desktop/eai/apieai
 *   mongosh "<MONGO_URI>" --quiet --file scripts/diagnose-chapter-fences.mongo.js
 *
 * Muestra dónde están todas las marcas ``` de cada lección problemática y cómo
 * empieza y termina el texto, para entender qué le falta a cada una.
 */

// ─── Configuración ──────────────────────────────────────────────────────────
const COLLECTION = 'chapterversions'
const EXTRA_FILTER = {}
const MAX_MARCAS = 20 // cuántas marcas ``` listar por lección
const CONTEXTO = 3 // líneas del inicio y del final a mostrar
// ────────────────────────────────────────────────────────────────────────────

const RUTAS_POSIBLES = [
  'src/functions/markdown.js',
  '../src/functions/markdown.js',
  'apieai/src/functions/markdown.js',
  '/Users/juliogiampieregradoscaballero/Desktop/eai/apieai/src/functions/markdown.js'
]

let md = null
for (const ruta of RUTAS_POSIBLES) {
  try {
    load(ruta)
    md = globalThis.markdownUtils
    if (md) break
  } catch (error) {
    // siguiente ruta
  }
}

if (!md) {
  throw new Error('No se encontró src/functions/markdown.js. Ejecuta mongosh desde la carpeta apieai.')
}

const corte = (texto, largo) => {
  const plano = String(texto).replace(/\s+/g, ' ').trim()
  return plano.length > largo ? plano.slice(0, largo) + '…' : plano
}

const diagnosticar = () => {
  const filtro = Object.assign({ content: { $exists: true, $ne: '' } }, EXTRA_FILTER)

  print('=== Lecciones que empiezan con ``` y no se pueden desenvolver ===')
  print('Base de datos: ' + db.getName())
  print('')

  let encontradas = 0

  db.getCollection(COLLECTION)
    .find(filtro, { content: 1, versionNumber: 1 })
    .forEach(doc => {
      const original = doc.content || ''
      if (original.trim().indexOf('```') !== 0) return

      const nuevo = md.normalizeLessonContent(original)
      if (nuevo.trim().indexOf('```') !== 0) return // esta sí se arregla sola

      encontradas++

      const trimmed = original.trim()
      const lineas = trimmed.split('\n')
      const marcas = []
      lineas.forEach((linea, i) => {
        if (/^```/.test(linea)) marcas.push({ n: i + 1, texto: linea.trim() })
      })

      print('--- ' + doc._id + ' (versión ' + doc.versionNumber + ', ' + lineas.length + ' líneas)')
      print('    termina con ```      : ' + (trimmed.slice(-3) === '```'))
      print('    total de marcas ```  : ' + marcas.length + (marcas.length % 2 === 0 ? ' (par)' : ' (IMPAR: hay un bloque sin cerrar)'))
      print('    marcas encontradas   :')
      marcas.slice(0, MAX_MARCAS).forEach(marca => {
        print('      línea ' + marca.n + ': ' + marca.texto)
      })
      if (marcas.length > MAX_MARCAS) print('      … y ' + (marcas.length - MAX_MARCAS) + ' más')

      print('    primeras líneas      :')
      lineas.slice(0, CONTEXTO).forEach((linea, i) => print('      ' + (i + 1) + ': ' + corte(linea, 110)))
      print('    últimas líneas       :')
      lineas.slice(-CONTEXTO).forEach((linea, i) => {
        print('      ' + (lineas.length - CONTEXTO + i + 1) + ': ' + corte(linea, 110))
      })
      print('')
    })

  print('=== Total con problema: ' + encontradas + ' ===')
  print('Este script no modificó nada.')
}

let hayConexion = false
try {
  hayConexion = !!(typeof db !== 'undefined' && db && db.getName())
} catch (error) {
  hayConexion = false
}

if (hayConexion) {
  diagnosticar()
} else {
  print('Necesita conexión: mongosh "<MONGO_URI>" --quiet --file scripts/diagnose-chapter-fences.mongo.js')
}
