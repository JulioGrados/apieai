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
const MOSTRAR_DIFERENCIAS = 0 // muestra el diff línea a línea de las primeras N pendientes
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

// Hace visibles los espacios al final y las líneas vacías
const visible = linea => {
  if (linea === '') return '(línea vacía)'
  const marcada = linea.replace(/[ \t]+$/, coincidencia => '␣'.repeat(coincidencia.length))
  return corte(marcada, 120)
}

const numero = valor => String(valor === undefined || valor === null ? '?' : valor)

// Explica exactamente qué va a cambiar comparando el contenido actual con el corregido
const motivos = (original, nuevo) => {
  const razones = []
  const abriaConFence = original.trim().indexOf('```') === 0
  const sigueConFence = nuevo.trim().indexOf('```') === 0

  if (abriaConFence && !sigueConFence) razones.push('quita el bloque ``` que envuelve toda la lección')
  if (abriaConFence && sigueConFence) razones.push('⚠ empieza con ``` y NO se pudo desenvolver: revisar a mano')
  if (/【[^】]*†[^】]*】/.test(original) || /\[\d+:\d+†[^\]]*\]/.test(original)) razones.push('quita citas del asistente (【…†source】)')

  const antes = md.analyzeMarkdown(original)
  const despues = md.analyzeMarkdown(nuevo)
  if (despues.headings > antes.headings) razones.push('agrega títulos Markdown (' + antes.headings + ' → ' + despues.headings + ')')
  if (despues.bullets > antes.bullets) razones.push('normaliza viñetas (' + antes.bullets + ' → ' + despues.bullets + ')')

  if (/\n{3,}/.test(original)) razones.push('reduce líneas en blanco de más')

  const sobranEspacios = original.split('\n').some(linea => {
    const limpia = /\S {2,}$/.test(linea) ? linea.replace(/[ \t]+$/, '  ') : linea.replace(/[ \t]+$/, '')
    return limpia !== linea
  })
  if (sobranEspacios) razones.push('quita espacios sobrantes al final de línea')

  if (original !== original.trim()) razones.push('recorta espacios al inicio o al final del texto')
  if (/[\u200b-\u200d\ufeff]/.test(original)) razones.push('quita caracteres invisibles')

  if (!razones.length) razones.push('ajustes menores de formato')
  return razones
}

// Diff simple línea a línea, para revisar antes de aplicar
const diffLineas = (textoA, textoB, maxCambios) => {
  const a = textoA.split('\n')
  const b = textoB.split('\n')
  const cambios = []
  const VENTANA = 25
  let i = 0
  let j = 0

  while ((i < a.length || j < b.length) && cambios.length < maxCambios) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++
      j++
      continue
    }

    // Una de las dos versiones ya se acabó
    if (i >= a.length) {
      cambios.push({ linea: i + 1, antes: null, despues: b[j] })
      j++
      continue
    }
    if (j >= b.length) {
      cambios.push({ linea: i + 1, antes: a[i], despues: null })
      i++
      continue
    }

    let salto = null
    for (let k = 1; k <= VENTANA && !salto; k++) {
      if (i < a.length && j + k < b.length && a[i] === b[j + k]) salto = { tipo: 'agregada', n: k }
      else if (j < b.length && i + k < a.length && a[i + k] === b[j]) salto = { tipo: 'eliminada', n: k }
    }

    if (!salto) {
      cambios.push({ linea: i + 1, antes: a[i], despues: b[j] })
      i++
      j++
    } else if (salto.tipo === 'agregada') {
      for (let k = 0; k < salto.n && cambios.length < maxCambios; k++) {
        cambios.push({ linea: i + 1, antes: null, despues: b[j + k] })
      }
      j += salto.n
    } else {
      for (let k = 0; k < salto.n && cambios.length < maxCambios; k++) {
        cambios.push({ linea: i + 1 + k, antes: a[i + k], despues: null })
      }
      i += salto.n
    }
  }

  return cambios
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

    const fila = { doc, estado, original, nuevo }
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
    if (item.estado !== 'ok') print('   Cambios : ' + motivos(item.original, item.nuevo).join('; '))
    print('   Preview : ' + corte(item.original, PREVIEW))
  })

  if (MOSTRAR_DIFERENCIAS > 0) {
    listar.slice(0, MOSTRAR_DIFERENCIAS).forEach((item, i) => {
      print('')
      print('=== DIFERENCIAS ' + (i + 1) + ' (' + item.doc._id + ') ===')
      const cambios = diffLineas(item.original, item.nuevo, 15)
      if (!cambios.length) {
        print('  (sin diferencias de línea)')
        return
      }
      cambios.forEach(cambio => {
        const etiqueta = '  línea ' + cambio.linea + ' '
        if (cambio.antes === null) print(etiqueta + '+ ' + visible(cambio.despues))
        else if (cambio.despues === null) print(etiqueta + '- ' + visible(cambio.antes))
        else {
          print(etiqueta + '- ' + visible(cambio.antes))
          print(etiqueta + '+ ' + visible(cambio.despues))
        }
      })
    })
  }

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
