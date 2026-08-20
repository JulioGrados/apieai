/**
 * Convierte a Markdown el contenido de las lecciones (chapterversions) que se
 * guardaron como texto plano. Sobrescribe el mismo campo `content` y recalcula
 * `wordCount`.
 *
 * USO
 * ---
 * 1) Probar SIN tocar la base (deja DRY_RUN en true):
 *      cd ~/Desktop/eai/apieai
 *      mongosh "<MONGO_URI>" --file scripts/normalize-chapter-markdown.mongo.js
 *
 * 2) Revisar el reporte y las muestras que imprime.
 *
 * 3) Aplicar los cambios: poner DRY_RUN = false y volver a ejecutar el comando.
 *
 * Probar solo el conversor, sin base de datos:
 *      mongosh --nodb --file scripts/normalize-chapter-markdown.mongo.js
 *
 * La lógica de conversión vive en src/functions/markdown.js (la misma que usa
 * el API al generar lecciones nuevas), así que ambos lados siempre coinciden.
 */

// ─── Configuración ──────────────────────────────────────────────────────────
const DRY_RUN = true // true = solo reporta; false = escribe en la base
const COLLECTION = 'chapterversions'
const EXTRA_FILTER = {} // ej: { course: ObjectId('66f0...') } para migrar un curso
const LIMIT = 0 // 0 = sin límite; útil para probar con pocos documentos
const SHOW_SAMPLES = 3 // cuántos antes/después imprimir
const BATCH_SIZE = 200
// ────────────────────────────────────────────────────────────────────────────

// Carga de la lógica compartida
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
    if (md) {
      print('Lógica de conversión cargada desde: ' + ruta)
      break
    }
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

const corte = texto => {
  const plano = String(texto).replace(/\n/g, ' ⏎ ')
  return plano.length > 220 ? plano.slice(0, 220) + '…' : plano
}

// ─── Autotest (mongosh --nodb) ──────────────────────────────────────────────
const autotest = () => {
  print('\n=== Autotest del conversor (sin base de datos) ===')

  const casos = [
    {
      nombre: 'texto plano',
      entrada: 'Lección 1: Fundamentos\n\nIntroducción\n\nEste es el primer párrafo de la lección.\n\n• Primer punto\n• Segundo punto\n\nCONCLUSIÓN\n\nCierre de la lección.',
      esperado: salida => /^# Lección 1/.test(salida) && /^## Introducción$/m.test(salida) && /^- Primer punto$/m.test(salida)
    },
    {
      nombre: 'envuelto en bloque de código',
      entrada: '```markdown\n# Título\n\nTexto con **negritas**.\n```',
      esperado: salida => salida.indexOf('```') === -1 && salida.indexOf('# Título') === 0
    },
    {
      nombre: 'ya en markdown (no se toca)',
      entrada: '# Título\n\n## Sección\n\nTexto con **negritas**.\n\n- uno\n- dos',
      esperado: salida => salida === '# Título\n\n## Sección\n\nTexto con **negritas**.\n\n- uno\n- dos'
    },
    {
      nombre: 'citas del asistente',
      entrada: '# Título\n\nDato tomado del informe【8:2†fuente.pdf】.\n\n- uno\n- dos',
      esperado: salida => salida.indexOf('†') === -1 && salida.indexOf('【') === -1
    },
    {
      nombre: 'lista numerada se mantiene lista',
      entrada: '# Guía\n\nPasos a seguir:\n\n1. Abrir el panel.\n2. Crear la campaña.\n3. Publicar.',
      esperado: salida => /^1\. Abrir el panel\.$/m.test(salida) && !/^#+ 1\./m.test(salida)
    }
  ]

  let fallidos = 0
  casos.forEach(caso => {
    const salida = md.normalizeLessonContent(caso.entrada)
    const ok = caso.esperado(salida) && md.isMarkdown(salida)
    if (!ok) {
      fallidos++
      print('✗ ' + caso.nombre)
      print('  salida: ' + corte(salida))
    } else {
      print('✓ ' + caso.nombre)
    }
  })

  print(fallidos === 0 ? '\nTodos los casos pasaron.' : '\n' + fallidos + ' caso(s) fallaron.')
}

// ─── Migración ──────────────────────────────────────────────────────────────
const migrar = () => {
  const coleccion = db.getCollection(COLLECTION)

  print('\n=== Normalización de lecciones a Markdown ===')
  print('Base de datos : ' + db.getName())
  print('Colección     : ' + COLLECTION)
  print('Modo          : ' + (DRY_RUN ? 'DRY RUN (no escribe nada)' : 'APLICAR CAMBIOS'))

  const filtro = Object.assign({ content: { $exists: true, $ne: '' } }, EXTRA_FILTER)
  const total = coleccion.countDocuments(filtro)
  print('Documentos    : ' + total + '\n')

  let cursor = coleccion.find(filtro, { content: 1, chapter: 1, versionNumber: 1, name: 1 })
  if (LIMIT > 0) cursor = cursor.limit(LIMIT)

  const resumen = { revisados: 0, yaMarkdown: 0, convertidos: 0, limpiados: 0, sinCambios: 0, vacios: 0, errores: 0 }
  const muestras = []
  let lote = []

  const descargarLote = () => {
    if (!lote.length) return
    if (!DRY_RUN) {
      const resultado = coleccion.bulkWrite(lote, { ordered: false })
      print('  → escritos ' + resultado.modifiedCount + ' documento(s)')
    }
    lote = []
  }

  cursor.forEach(doc => {
    resumen.revisados++
    try {
      const original = doc.content || ''
      if (!original.trim()) {
        resumen.vacios++
        return
      }

      const yaEraMarkdown = md.isMarkdown(original)
      const nuevo = md.normalizeLessonContent(original)

      // Aunque ya fuera Markdown puede necesitar limpieza: bloques ``` que
      // envuelven todo el texto, citas 【4:0†source】, saltos de línea de más.
      if (!nuevo || nuevo === original) {
        if (yaEraMarkdown) {
          resumen.yaMarkdown++
        } else {
          resumen.sinCambios++
        }
        return
      }

      if (yaEraMarkdown) {
        resumen.limpiados++
      } else {
        resumen.convertidos++
      }

      if (muestras.length < SHOW_SAMPLES) {
        muestras.push({ id: doc._id, antes: corte(original), despues: corte(nuevo) })
      }

      lote.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { content: nuevo, wordCount: md.countWords(nuevo) } }
        }
      })

      if (lote.length >= BATCH_SIZE) descargarLote()
    } catch (error) {
      resumen.errores++
      print('  ✗ Error en ' + doc._id + ': ' + error.message)
    }
  })

  descargarLote()

  muestras.forEach((muestra, i) => {
    print('\n--- Muestra ' + (i + 1) + ' (' + muestra.id + ') ---')
    print('ANTES  : ' + muestra.antes)
    print('DESPUÉS: ' + muestra.despues)
  })

  print('\n=== Resumen ===')
  print('Revisados      : ' + resumen.revisados)
  print('Ya en Markdown : ' + resumen.yaMarkdown)
  print('Convertidos    : ' + resumen.convertidos)
  print('Solo limpiados : ' + resumen.limpiados + ' (ya eran Markdown pero tenían ``` o citas)')
  print('Sin cambios    : ' + resumen.sinCambios)
  print('Vacíos         : ' + resumen.vacios)
  print('Errores        : ' + resumen.errores)

  if (DRY_RUN) {
    print('\nDRY RUN: no se escribió nada. Cambia DRY_RUN a false para aplicar.')
  } else {
    print('\nCambios aplicados sobre el campo content.')
  }
}

// Con `mongosh --nodb` la variable db existe pero lanza al usarla:
// por eso se comprueba con getName() dentro de un try.
let hayConexion = false
try {
  hayConexion = !!(typeof db !== 'undefined' && db && db.getName())
} catch (error) {
  hayConexion = false
}

if (hayConexion) {
  migrar()
} else {
  print('Sin conexión a MongoDB: se ejecuta solo el autotest del conversor.')
  autotest()
}
