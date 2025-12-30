'use strict'

const { examVersionDB, examDB, chapterDB, lessonDB, courseDB } = require('db/lib')
const { generateEvaluationContent, editEvaluationContent } = require('./openai')

// Función para parsear el contenido de OpenAI y extraer preguntas y opciones
const parseEvaluationContent = (content) => {
  console.log('=== parseEvaluationContent ===')
  const options = []

  try {
    // Dividir el contenido por preguntas (buscando patrones como "1.", "2.", etc.)
    const questionPattern = /(\d+)\.\s*(.+?)(?=\n\n|\n[a-d]\)|$)/gs
    const optionPattern = /([a-d])\)\s*(.+?)(?=\n|$)/gi

    // Buscar bloques de preguntas
    const lines = content.split('\n')
    let currentQuestion = null
    let currentOptions = []
    let questionNumber = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Detectar nueva pregunta (número seguido de punto)
      const questionMatch = line.match(/^(\d+)\.\s*(.+)/)
      if (questionMatch) {
        // Guardar pregunta anterior si existe
        if (currentQuestion && currentOptions.length > 0) {
          currentOptions.forEach(opt => {
            options.push({
              question: currentQuestion,
              id: opt.id,
              text: opt.text,
              isCorrect: opt.isCorrect
            })
          })
        }

        // Nueva pregunta
        questionNumber = parseInt(questionMatch[1])
        currentQuestion = questionMatch[2].trim()
        currentOptions = []
        continue
      }

      // Detectar opciones (a), b), c), d))
      const optionMatch = line.match(/^([a-d])\)\s*(.+)/)
      if (optionMatch && currentQuestion) {
        const optionId = optionMatch[1]
        let optionText = optionMatch[2].trim()

        // Verificar si tiene marcador de correcta (común: *, ✓, (correcta), etc.)
        const isCorrect = optionText.includes('*') ||
                         optionText.includes('✓') ||
                         optionText.toLowerCase().includes('correcta') ||
                         optionText.toLowerCase().includes('correct')

        // Limpiar el texto de marcadores
        optionText = optionText.replace(/\*|✓|\(correcta\)|\(correct\)/gi, '').trim()

        currentOptions.push({
          id: optionId,
          text: optionText,
          isCorrect: isCorrect
        })
      }
    }

    // Guardar la última pregunta
    if (currentQuestion && currentOptions.length > 0) {
      currentOptions.forEach(opt => {
        options.push({
          question: currentQuestion,
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect
        })
      })
    }

    console.log(`Parseadas ${options.length / 4} preguntas con ${options.length} opciones`)
    return options
  } catch (error) {
    console.error('Error parseando contenido:', error)
    // Si falla el parseo, devolver array vacío
    return []
  }
}

const listExamVersions = async params => {
  const exams = await examVersionDB.list(params)
  return exams
}

const createExamVersion = async (body, loggedUser) => {
  console.log('=== createExamVersion Service ===')
  console.log('Body:', body)

  try {
    let content = body.content
    let generatedPrompt = body.prompt

    // Si no se proporciona contenido, generar con OpenAI
    if (!body.content) {
      console.log('Preparando generación de evaluación con OpenAI...')

      // Obtener información del exam, lesson y course
      const lesson = await lessonDB.detail({ query: { _id: body.lesson } })
      const course = await courseDB.detail({ query: { _id: body.course } })

      // Obtener todos los capítulos del módulo con sus versiones favoritas
      const chapters = await chapterDB.list({
        query: { lesson: body.lesson },
        sort: { order: 1 },
        populate: ['favoriteVersion']
      })

      // Construir el contenido de las lecciones
      let lessonContents = ''
      chapters.forEach((chapter, index) => {
        lessonContents += `Lección ${index + 1}:\n${chapter.name}\n\n`
        if (chapter.favoriteVersion && chapter.favoriteVersion.content) {
          lessonContents += `Contenido ${index + 1}:\n${chapter.favoriteVersion.content}\n\n`
        }
      })

      // Generar el prompt estructurado para evaluación tipo examen
      generatedPrompt = `Crea una evaluación de 10 preguntas tipo examen de opción múltiple para el módulo "${lesson.name}" del curso "${course.name}".

INSTRUCCIONES ESPECÍFICAS:
- Cada pregunta debe tener exactamente 4 opciones (a, b, c, d)
- Solo UNA opción debe ser correcta por pregunta
- Marca la respuesta correcta con un asterisco (*) al final del texto de la opción
- Usa formato de lista numerada para las preguntas (1., 2., 3., etc.)
- Usa formato de letras con paréntesis para las opciones (a), b), c), d))
- Las preguntas deben evaluar comprensión, análisis y aplicación de los conceptos

FORMATO ESPERADO:
1. [Pregunta aquí]
a) [Opción A]
b) [Opción B] *
c) [Opción C]
d) [Opción D]

2. [Pregunta aquí]
a) [Opción A]
...

CONTENIDO DEL MÓDULO:
Este módulo tiene ${chapters.length} lecciones. A continuación el contenido de cada lección:

${lessonContents}

Genera las 10 preguntas siguiendo estrictamente el formato especificado.`

      console.log('Prompt generado:', generatedPrompt.substring(0, 300) + '...')
      console.log('Generando evaluación con OpenAI...')

      const result = await generateEvaluationContent(generatedPrompt)
      content = result.content
      console.log('Evaluación generada exitosamente')
    }

    // Parsear el contenido para extraer preguntas y opciones
    const parsedOptions = parseEvaluationContent(content)
    console.log('Options parseadas:', parsedOptions.length)

    // Obtener el número de versión actual
    const existingVersions = await examVersionDB.count({
      query: { exam: body.exam }
    })

    console.log('existingVersions', existingVersions)

    const versionNumber = existingVersions + 1
    const isFirstVersion = versionNumber === 1

    // Crear la nueva versión
    const versionData = {
      ...body,
      content,
      options: parsedOptions, // Agregar las opciones parseadas
      prompt: generatedPrompt,
      versionNumber,
      isFavorite: isFirstVersion // La primera versión es favorita por defecto
    }

    console.log('Creando versión:', versionNumber, '- Es primera versión:', isFirstVersion)
    const newVersion = await examVersionDB.create(versionData)
    console.log('Versión creada:', newVersion._id)

    // Actualizar el exam para agregar esta versión al array de versions
    const updateData = {
      $push: { versions: newVersion._id }
    }

    // Si es la primera versión, también establecerla como favoriteVersion
    if (isFirstVersion) {
      updateData.favoriteVersion = newVersion._id
      console.log('Estableciendo como favoriteVersion')
    }

    await examDB.update(body.exam, updateData)
    console.log('Exam actualizado con nueva versión')

    return newVersion
  } catch (error) {
    console.error('Error en createExamVersion:', error)
    throw error
  }
}

const updateExamVersion = async (examId, body, loggedUser) => {
  const exam = await examVersionDB.update(examId, body)
  return exam
}

const setFavoriteExamVersion = async (examId, versionId) => {
  console.log('=== setFavoriteExamVersion Service ===')
  console.log('ExamId:', examId)
  console.log('VersionId:', versionId)

  try {
    // 1. Desmarcar todas las versiones como no favoritas del exam
    const allVersions = await examVersionDB.list({
      query: { exam: examId }
    })

    for (const version of allVersions) {
      if (version.isFavorite) {
        await examVersionDB.update(version._id, { isFavorite: false })
      }
    }

    // 2. Marcar la versión seleccionada como favorita
    const updatedVersion = await examVersionDB.update(versionId, { isFavorite: true })
    console.log('Versión marcada como favorita:', updatedVersion._id)

    // 3. Actualizar el exam con la nueva favoriteVersion
    await examDB.update(examId, {
      favoriteVersion: versionId
    })
    console.log('Exam actualizado con favoriteVersion')

    return updatedVersion
  } catch (error) {
    console.error('Error en setFavoriteExamVersion:', error)
    throw error
  }
}

const detailExamVersion = async params => {
  const exam = await examVersionDB.detail(params)
  return exam
}

const deleteExamVersion = async (examId, loggedUser) => {
  const exam = await examVersionDB.remove(examId)
  return exam
}

const countDocuments = async params => {
  const count = await examVersionDB.count(params)
  return count
}

const editExamVersion = async (versionId, body) => {
  console.log('=== editExamVersion Service ===')
  console.log('VersionId:', versionId)
  console.log('Edit Prompt:', body.editPrompt)

  try {
    // Obtener la versión actual
    const version = await examVersionDB.detail({ query: { _id: versionId } })

    if (!version) {
      throw new Error('Versión no encontrada')
    }
    console.log('version:', version)
    // Obtener información del lesson y course para el contexto
    const lesson = await lessonDB.detail({ query: { _id: version.lesson } })
    const course = await courseDB.detail({ query: { _id: lesson.course.ref } })

    // Obtener todos los capítulos del módulo con sus versiones favoritas
    const chapters = await chapterDB.list({
      query: { lesson: version.lesson },
      sort: { order: 1 },
      populate: ['favoriteVersion']
    })

    // Construir el contenido de las lecciones
    let lessonContents = ''
    chapters.forEach((chapter, index) => {
      lessonContents += `Lección ${index + 1}:\n${chapter.name}\n\n`
      if (chapter.favoriteVersion && chapter.favoriteVersion.content) {
        lessonContents += `Contenido ${index + 1}:\n${chapter.favoriteVersion.content}\n\n`
      }
    })

    // Construir el prompt de edición estructurado
    const editPrompt = `Actualiza la evaluación del módulo "${lesson.name}" del curso "${course.name}" según las instrucciones proporcionadas.

EVALUACIÓN ACTUAL:
${version.content}

INSTRUCCIONES DE ACTUALIZACIÓN:
${body.editPrompt}

IMPORTANTE - MANTÉN EL FORMATO:
- Cada pregunta debe tener exactamente 4 opciones (a, b, c, d)
- Solo UNA opción debe ser correcta por pregunta
- Marca la respuesta correcta con un asterisco (*) al final del texto de la opción
- Usa formato de lista numerada para las preguntas (1., 2., 3., etc.)
- Usa formato de letras con paréntesis para las opciones (a), b), c), d))

FORMATO ESPERADO:
1. [Pregunta aquí]
a) [Opción A]
b) [Opción B] *
c) [Opción C]
d) [Opción D]

CONTENIDO DEL MÓDULO (para referencia):
${lessonContents}

Genera la evaluación actualizada siguiendo estrictamente el formato especificado.`

    console.log('\n\n========================================')
    console.log('PROMPT COMPLETO DE EDICIÓN:')
    console.log('========================================\n')
    console.log(editPrompt)
    console.log('\n========================================')
    console.log('ENVIANDO A OPENAI...')
    console.log('========================================\n\n')

    const result = await editEvaluationContent(editPrompt)

    // Parsear el contenido editado para extraer preguntas y opciones
    const parsedOptions = parseEvaluationContent(result.content)
    console.log('Options parseadas después de editar:', parsedOptions.length)

    // Actualizar la versión con el nuevo contenido y agregar al historial de ediciones
    const updatedVersion = await examVersionDB.update(versionId, {
      content: result.content,
      options: parsedOptions, // Actualizar las opciones parseadas
      $push: {
        edits: {
          editPrompt: body.editPrompt,
          timestamp: new Date()
        }
      }
    })

    console.log('Versión actualizada exitosamente')
    return updatedVersion
  } catch (error) {
    console.error('Error en editExamVersion:', error)
    throw error
  }
}

module.exports = {
  countDocuments,
  listExamVersions,
  createExamVersion,
  updateExamVersion,
  detailExamVersion,
  deleteExamVersion,
  setFavoriteExamVersion,
  editExamVersion
}
