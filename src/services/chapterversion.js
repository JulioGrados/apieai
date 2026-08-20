'use strict'

const { chapterVersionDB, chapterDB, courseDB, lessonDB } = require('db/lib')
const { generateLessonContent, editLessonContent } = require('./openai')
const { MARKDOWN_INSTRUCTIONS, normalizeLessonContent, countWords } = require('../functions/markdown')

const listChapterVersions = async params => {
  const chapters = await chapterVersionDB.list(params)
  return chapters
}

const createChapterVersion = async (body, loggedUser) => {
  console.log('=== createChapterVersion Service ===')
  console.log('Body:', body)

  try {
    let content = body.content
    let generatedPrompt = body.prompt

    // Si no se proporciona contenido, generar con OpenAI
    if (!body.content) {
      console.log('Preparando generación de contenido con OpenAI...')

      // Obtener información completa del chapter, lesson y course
      const chapter = await chapterDB.detail({
        query: { _id: body.chapter },
        populate: ['lesson', 'course']
      })

      const lesson = await lessonDB.detail({ query: { _id: body.lesson } })
      const course = await courseDB.detail({ query: { _id: body.course } })

      // Obtener todos los módulos (lessons) y capítulos del curso
      const lessons = await lessonDB.list({
        query: { 'course.ref': body.course },
        sort: { order: 1 }
      })

      // Construir la estructura completa del curso
      const courseStructure = {
        modulos: []
      }

      for (const lessonItem of lessons) {
        const chapters = await chapterDB.list({
          query: { lesson: lessonItem._id },
          sort: { order: 1 }
        })
        courseStructure.modulos.push({
          position: lessonItem.order,
          title: lessonItem.name,
          description: lessonItem.description || '',
          lecciones: chapters.map(ch => ({
            position: ch.order,
            title: ch.name,
            description: ch.description || ''
          }))
        })
      }
      // Generar el prompt estructurado
      generatedPrompt = `Crea contenido para la lección número ${chapter.order} llamada "${chapter.name}", que pertenece al módulo ${lesson.order} llamado "${lesson.name}" del curso "${course.name}".

Considera como la estructura completa del curso "${course.name}" la siguiente:
${JSON.stringify(courseStructure, null, 0)}

${MARKDOWN_INSTRUCTIONS}`

      console.log('Prompt generado:', generatedPrompt.substring(0, 300) + '...')
      console.log('Generando contenido con OpenAI...')

      const result = await generateLessonContent(generatedPrompt)
      content = result.content
      console.log('Contenido generado exitosamente')
    }

    // El contenido siempre se guarda en Markdown, venga del asistente o del body
    content = normalizeLessonContent(content)

    // Contar palabras en el contenido
    const wordCount = countWords(content)
    console.log('Cantidad de palabras:', wordCount)

    // Obtener el número de versión actual
    const existingVersions = await chapterVersionDB.count({
      query: { chapter: body.chapter }
    })

    console.log('existingVersions', existingVersions)

    const versionNumber = existingVersions + 1
    const isFirstVersion = versionNumber === 1

    // Crear la nueva versión
    const versionData = {
      ...body,
      content,
      prompt: generatedPrompt,
      versionNumber,
      wordCount,
      isFavorite: isFirstVersion // La primera versión es favorita por defecto
    }

    console.log('Creando versión:', versionNumber, '- Es primera versión:', isFirstVersion)
    const newVersion = await chapterVersionDB.create(versionData)
    console.log('Versión creada:', newVersion._id)

    // Actualizar el chapter para agregar esta versión al array de versions
    const updateData = {
      $push: { versions: newVersion._id }
    }

    // Si es la primera versión, también establecerla como favoriteVersion
    if (isFirstVersion) {
      updateData.favoriteVersion = newVersion._id
      console.log('Estableciendo como favoriteVersion')
    }

    await chapterDB.update(body.chapter, updateData)
    console.log('Chapter actualizado con nueva versión')

    return newVersion
  } catch (error) {
    console.error('Error en createChapterVersion:', error)
    throw error
  }
}

const updateChapterVersion = async (chapterId, body, loggedUser) => {
  const chapter = await chapterVersionDB.update(chapterId, body)
  return chapter
}

const setFavoriteChapterVersion = async (chapterId, versionId) => {
  console.log('=== setFavoriteChapterVersion Service ===')
  console.log('ChapterId:', chapterId)
  console.log('VersionId:', versionId)

  try {
    // 1. Desmarcar todas las versiones como no favoritas del chapter
    const allVersions = await chapterVersionDB.list({
      query: { chapter: chapterId }
    })

    for (const version of allVersions) {
      if (version.isFavorite) {
        await chapterVersionDB.update(version._id, { isFavorite: false })
      }
    }

    // 2. Marcar la versión seleccionada como favorita
    const updatedVersion = await chapterVersionDB.update(versionId, { isFavorite: true })
    console.log('Versión marcada como favorita:', updatedVersion._id)

    // 3. Actualizar el chapter con la nueva favoriteVersion
    await chapterDB.update(chapterId, {
      favoriteVersion: versionId
    })
    console.log('Chapter actualizado con favoriteVersion')

    return updatedVersion
  } catch (error) {
    console.error('Error en setFavoriteChapterVersion:', error)
    throw error
  }
}

const detailChapterVersion = async params => {
  const chapter = await chapterVersionDB.detail(params)
  return chapter
}

const deleteChapterVersion = async (chapterId, loggedUser) => {
  const chapter = await chapterVersionDB.remove(chapterId)
  return chapter
}

const countDocuments = async params => {
  const count = await chapterVersionDB.count(params)
  return count
}

const editChapterVersion = async (versionId, body) => {
  console.log('=== editChapterVersion Service ===')
  console.log('VersionId:', versionId)
  console.log('Edit Prompt:', body.editPrompt)

  try {
    // Obtener la versión actual
    const version = await chapterVersionDB.detail({ query: { _id: versionId } })
    
    if (!version) {
      throw new Error('Versión no encontrada')
    }

    // Obtener información del chapter, lesson y course para el contexto
    const chapter = await chapterDB.detail({
      query: { _id: version.chapter },
      populate: ['lesson', 'course']
    })

    const lesson = await lessonDB.detail({ query: { _id: version.lesson } })
    const course = await courseDB.detail({ query: { _id: version.course } })
    // Construir el prompt de edición estructurado
    const editPrompt = `Tienes frente a ti el texto de una lección que pertenece a un módulo de un curso que ya fue creada previamente. Tu tarea es editarlo según las instrucciones específicas que te proporcionaré.

CONTEXTO DE LA LECCIÓN:
Curso: ${course.name}
Módulo ${lesson.order}: ${lesson.name}
Lección ${chapter.order}: ${chapter.name}

TEXTO ACTUAL DE LA LECCIÓN:
${version.content}

MODIFICACIÓN SOLICITADA:
${body.editPrompt}

IMPORTANTE:
- Aplica la modificación solicitada integrándola naturalmente al flujo existente de la lección
- Mantén la coherencia con el resto del contenido del módulo y curso
- Si agregas contenido nuevo, asegúrate de que tenga la misma profundidad pedagógica, ejemplos concretos y explicaciones del "porqué"
- Devuelve el texto completo de la lección con las modificaciones incorporadas, no solo la parte editada
- Mantén la extensión mínima de 3000 palabras

${MARKDOWN_INSTRUCTIONS}`

    console.log('Generando contenido editado con OpenAI...')
    const result = await editLessonContent(editPrompt)
    console.log('editPrompt', editPrompt)

    const editedContent = normalizeLessonContent(result.content)

    // Contar palabras en el contenido editado
    const wordCount = countWords(editedContent)
    console.log('Cantidad de palabras en contenido editado:', wordCount)

    // Actualizar la versión con el nuevo contenido y agregar al historial de ediciones
    const updatedVersion = await chapterVersionDB.update(versionId, {
      content: editedContent,
      wordCount,
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
    console.error('Error en editChapterVersion:', error)
    throw error
  }
}

module.exports = {
  countDocuments,
  listChapterVersions,
  createChapterVersion,
  updateChapterVersion,
  detailChapterVersion,
  deleteChapterVersion,
  setFavoriteChapterVersion,
  editChapterVersion
}
