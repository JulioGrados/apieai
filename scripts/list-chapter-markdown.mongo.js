/**
 * LISTA (sin modificar nada) las versiones de lección que NO están en Markdown.
 *
 * USO
 * ---
 *   cd ~/Desktop/eai/apieai
 *   mongosh "<MONGO_URI>" --file scripts/list-chapter-markdown.mongo.js
 *
 * Para guardar el reporte en un archivo:
 *   mongosh "<MONGO_URI>" --quiet --file scripts/list-chapter-markdown.mongo.js > reporte-markdown.txt
 *
 * Este script SOLO LEE. Para aplicar la conversión se usa
 * scripts/normalize-chapter-markdown.mongo.js
 */

// ─── Configuración ──────────────────────────────────────────────────────────
const COLLECTION = 'chapterversions'
const EXTRA_FILTER = {} // ej: { course: ObjectId('66f0...') } para revisar un curso
const LIMIT = 0 // 0 = todas
const MOSTRAR = 'pendientes' // 'pendientes' = solo las que hay que arreglar | 'todas'
const PREVIEW = 160 // caracteres de vista previa por lección
const MOSTRAR_CONTENIDO = 0 // imprime el contenido completo de las primeras N pendientes
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
    // se prueba la siguiente ruta
  }
}

if (!md) {
  throw new Error(
    'No se encontró src/functions/markdown.js. Ejecuta mongosh desde la carpeta apieai ' +
    'o agrega la ruta absoluta en RUTAS_POSIBLES.'
  )
}

const corte = (texto, largo) => {
  const plano = String(texto).replace(/\s+/g, ' ').trim()
  return plano.length > largo ? plano.slice(0, largo) + '…' : plano
}

const numero = valor => String(valor === undefined || valor === null ? '?' : valor)

// Explica en palabras por qué una lección necesita arreglo
const motivos = original => {
  const razones = []
  const stats = md.analyzeMarkdown(original)

  if (original.trim().indexOf('```') === 0) razones.push('todo el texto envuelto en ```')
  if (/【[^】]*†[^】]*】/.test(original) || /\[\d+:\d+†[^\]]*\]/.test(original)) razones.push('citas del asistente (【…†source】)')
  if (stats.headings === 0) razones.push('sin títulos (#, ##)')
  if (/^\s*[•‣▪▫●◦·]\s+/m.test(original)) razones.push('viñetas sin formato (•)')
  if (stats.headings === 0 && stats.bold >= 2) razones.push('usa **negritas** como títulos')
  if (!razones.length) razones.push('espacios o saltos de línea de más')

  return razones
}

const revisar = () => {
  const filtro = Object.assign({ content: { $exists: true, $ne: '' } }, EXTRA_FILTER)

  const pipeline = [
    { $match: filtro },
    { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'cursoDoc' } },
    { $lookup: { from: 'lessons', localField: 'lesson', foreignField: '_id', as: 'moduloDoc' } },
    { $lookup: { from: 'chapters', localField: 'chapter', foreignField: '_id', as: 'chapterDoc' } },
    {
      $project: {
        content: 1,
        versionNumber: 1,
        wordCount: 1,
        isFavorite: 1,
        createdAt: 1,
        curso: { $arrayElemAt: ['$cursoDoc.name', 0] },
        modulo: { $arrayElemAt: ['$moduloDoc.name', 0] },
        moduloOrden: { $arrayElemAt: ['$moduloDoc.order', 0] },
        leccion: { $arrayElemAt: ['$chapterDoc.name', 0] },
        leccionOrden: { $arrayElemAt: ['$chapterDoc.order', 0] }
      }
    },
    { $sort: { curso: 1, moduloOrden: 1, leccionOrden: 1, versionNumber: 1 } }
  ]

  if (LIMIT > 0) pipeline.push({ $limit: LIMIT })

  print('=== Revisión de formato Markdown en lecciones ===')
  print('Base de datos : ' + db.getName())
  print('Colección     : ' + COLLECTION)
  print('')

  const resumen = { revisados: 0, ok: 0, planas: 0, limpieza: 0 }
  const porCurso = {}
  const pendientes = []
  const todas = []

  db.getCollection(COLLECTION).aggregate(pipeline).forEach(doc => {
    resumen.revisados++

    const original = doc.content || ''
    const yaEraMarkdown = md.isMarkdown(original)
    const nuevo = md.normalizeLessonContent(original)
    const necesitaCambio = nuevo && nuevo !== original

    let estado = 'ok'
    if (!yaEraMarkdown) {
      estado = 'TEXTO PLANO'
      resumen.planas++
    } else if (necesitaCambio) {
      estado = 'SOLO LIMPIEZA'
      resumen.limpieza++
    } else {
      resumen.ok++
    }

    const curso = doc.curso || '(curso sin nombre)'
    if (!porCurso[curso]) porCurso[curso] = { ok: 0, planas: 0, limpieza: 0 }
    if (estado === 'TEXTO PLANO') porCurso[curso].planas++
    else if (estado === 'SOLO LIMPIEZA') porCurso[curso].limpieza++
    else porCurso[curso].ok++

    const fila = { doc, estado, original }
    todas.push(fila)
    if (estado !== 'ok') pendientes.push(fila)
  })

  const listar = MOSTRAR === 'todas' ? todas : pendientes
  if (!listar.length) {
    print('No hay lecciones pendientes: todas están en Markdown limpio.')
  } else if (MOSTRAR === 'todas') {
    print('--- Todas las lecciones (' + listar.length + ') ---')
  } else {
    print('--- Lecciones pendientes (' + listar.length + ') ---')
  }

  listar.forEach((item, i) => {
    const doc = item.doc
    print('')
    print((i + 1) + '. [' + (item.estado === 'ok' ? 'YA EN MARKDOWN' : item.estado) + ']  _id: ' + doc._id)
    print('   Curso   : ' + (doc.curso || '(sin curso)'))
    print('   Módulo  : ' + numero(doc.moduloOrden) + ' · ' + (doc.modulo || '(sin módulo)'))
    print('   Lección : ' + numero(doc.leccionOrden) + ' · ' + (doc.leccion || '(sin lección)') +
      '   [versión ' + numero(doc.versionNumber) + (doc.isFavorite ? ' ★ favorita' : '') +
      ' · ' + numero(doc.wordCount) + ' palabras]')
    if (item.estado !== 'ok') print('   Motivos : ' + motivos(item.original).join(', '))
    print('   Preview : ' + corte(item.original, PREVIEW))
  })

  if (MOSTRAR_CONTENIDO > 0) {
    listar.slice(0, MOSTRAR_CONTENIDO).forEach((item, i) => {
      print('')
      print('=== CONTENIDO COMPLETO ' + (i + 1) + ' (' + item.doc._id + ') ===')
      print(item.original)
    })
  }

  print('')
  print('=== Resumen por curso ===')
  Object.keys(porCurso).sort().forEach(curso => {
    const c = porCurso[curso]
    print('  ' + curso + ': ' + c.planas + ' en texto plano, ' + c.limpieza +
      ' solo limpieza, ' + c.ok + ' ya correctas')
  })

  print('')
  print('=== Total ===')
  print('Revisadas          : ' + resumen.revisados)
  print('Ya en Markdown     : ' + resumen.ok)
  print('En texto plano     : ' + resumen.planas)
  print('Solo limpieza      : ' + resumen.limpieza + ' (Markdown con ``` o citas del asistente)')
  print('')
  print('Este script no modificó nada.')
  if (resumen.planas + resumen.limpieza > 0) {
    print('Para convertirlas: mongosh "<MONGO_URI>" --file scripts/normalize-chapter-markdown.mongo.js')
  }
}

let hayConexion = false
try {
  hayConexion = !!(typeof db !== 'undefined' && db && db.getName())
} catch (error) {
  hayConexion = false
}

if (hayConexion) {
  revisar()
} else {
  print('Este script necesita conexión a MongoDB:')
  print('  cd ~/Desktop/eai/apieai')
  print('  mongosh "<MONGO_URI>" --file scripts/list-chapter-markdown.mongo.js')
}
