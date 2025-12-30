'use strict'

const OpenAI = require('openai')
const fs = require('fs')

// IDs de los asistentes
const ASSISTANT_ID = 'asst_PzWFubM9cS2RHmhmG9dLA0Jl' // Asistente para crear cursos
const LESSON_ASSISTANT_ID = 'asst_8rudtNeZDKqvSOPt2qHVZxWh' // Asistente para crear contenido de lección
const EVALUATION_ASSISTANT_ID = 'asst_XrNkndUfkHO6SjUONwn6jC7W' // Asistente para crear evaluaciones

// API Key
const API_KEY = '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'

let openaiClient = null

const getOpenAIClient = () => {
  if (!openaiClient) {
    console.log('Inicializando cliente de OpenAI...')
    // Deshabilitar la verificación de navegador ya que estamos 100% en el servidor
    openaiClient = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true // Esto está deshabilitado, pero el SDK está fallando en la detección
    })
  }
  return openaiClient
}

const uploadFiles = async (filePaths) => {
  try {
    const openai = getOpenAIClient()
    const uploadedFiles = []

    for (const filePath of filePaths) {
      console.log('Subiendo archivo:', filePath)
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      console.log('Archivo subido:', file.id)
      uploadedFiles.push(file.id)
    }

    return uploadedFiles
  } catch (error) {
    console.error('Error uploading files to OpenAI:', error)
    throw error
  }
}

const createThreadAndRun = async (prompt, fileIds = []) => {
  try {
    const openai = getOpenAIClient()

    console.log('Creando thread...')
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: prompt,
          attachments: fileIds.map(fileId => ({
            file_id: fileId,
            tools: [{ type: 'file_search' }]
          }))
        }
      ]
    })

    console.log('Thread creado:', thread.id)

    console.log('Ejecutando asistente...')
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    })

    console.log('Run iniciado:', run.id)
    console.log('Thread ID disponible:', thread.id)

    // Usar thread.id en lugar de run.thread_id
    const threadId = thread.id
    const runId = run.id

    // Polling para esperar la respuesta del asistente
    let runStatus = run
    let attempts = 0
    const maxAttempts = 300

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run falló con detalles:', runStatus)
        throw new Error('Run failed with status: ' + runStatus.status)
      }

      attempts++
      if (attempts > maxAttempts) {
        throw new Error('Timeout: El asistente tardó demasiado en responder')
      }

      console.log('Esperando respuesta... (' + runStatus.status + ') - intento ' + attempts + '/' + maxAttempts)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sintaxis correcta del SDK: retrieve(runId, { thread_id })
      runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    console.log('Run completado!')

    const messages = await openai.beta.threads.messages.list(threadId)
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')
    const lastMessage = assistantMessages[0]

    const textContent = lastMessage.content.find(content => content.type === 'text')
    const responseText = textContent ? textContent.text.value : ''

    console.log('Respuesta recibida:', responseText.length, 'caracteres')

    return {
      threadId: thread.id,
      runId: run.id,
      response: responseText,
      rawMessage: lastMessage
    }
  } catch (error) {
    console.error('Error creating thread and running assistant:', error)
    throw error
  }
}

const generateCourseContent = async (prompt, filePaths = []) => {
  try {
    console.log('Iniciando generación de contenido del curso...')
    let fileIds = []

    if (filePaths && filePaths.length > 0) {
      console.log('Subiendo', filePaths.length, 'archivo(s)...')
      fileIds = await uploadFiles(filePaths)
    }

    const result = await createThreadAndRun(prompt, fileIds)

    console.log('Contenido generado exitosamente!')
    return result
  } catch (error) {
    console.error('Error generating course content:', error)
    throw error
  }
}

const parseCourseStructure = (responseContent) => {
  console.log('Parseando estructura del curso...')

  try {
    // El asistente devuelve JSON directamente
    let jsonData

    // Si responseContent ya es un objeto, usarlo directamente
    if (typeof responseContent === 'object') {
      jsonData = responseContent
    } else {
      // Si es string, intentar parsear como JSON
      jsonData = JSON.parse(responseContent)
    }

    // Validar que tenga la estructura esperada
    if (!jsonData.modulos || !Array.isArray(jsonData.modulos)) {
      throw new Error('Formato JSON inválido: falta el array "modulos"')
    }

    // Transformar del formato del asistente al formato esperado por la BD
    const modules = jsonData.modulos.map((modulo, index) => {
      const chapters = (modulo.lecciones || []).map((leccion, lecIndex) => ({
        name: leccion.title || leccion.nombre || `Lección ${lecIndex + 1}`,
        order: leccion.position || lecIndex + 1,
        description: leccion.description || leccion.descripcion || '',
        content: leccion.description || leccion.descripcion || ''
      }))

      console.log('Módulo', modulo.position || index + 1, ':', modulo.title, 'con', chapters.length, 'lecciones')

      return {
        name: modulo.title || modulo.nombre || `Módulo ${index + 1}`,
        order: modulo.position || index + 1,
        description: modulo.description || modulo.descripcion || '',
        chapters
      }
    })

    console.log('Estructura parseada:', modules.length, 'módulos')
    return { modules }
  } catch (error) {
    console.error('Error parseando JSON del curso:', error)
    console.error('Contenido recibido:', responseContent)
    throw new Error('Error al parsear la estructura del curso: ' + error.message)
  }
}

const generateLessonContent = async (prompt) => {
  try {
    console.log('=== Generando contenido de lección con OpenAI ===')
    console.log('Prompt:', prompt)

    const openai = getOpenAIClient()

    // Crear thread con el mensaje del usuario
    console.log('Creando thread...')
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    console.log('Thread creado:', thread.id)

    // Ejecutar el asistente de lecciones
    console.log('Ejecutando asistente de lecciones...')
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: LESSON_ASSISTANT_ID
    })
    console.log('Run creado:', run.id)

    // Esperar a que se complete
    const threadId = thread.id
    const runId = run.id

    let runStatus = run
    let attempts = 0
    const maxAttempts = 300

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run falló con detalles:', runStatus)
        throw new Error('Run failed with status: ' + runStatus.status)
      }

      attempts++
      if (attempts > maxAttempts) {
        throw new Error('Timeout: El asistente tardó demasiado en responder')
      }

      console.log('Esperando respuesta... (' + runStatus.status + ') - intento ' + attempts + '/' + maxAttempts)
      await new Promise(resolve => setTimeout(resolve, 1000))

      runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    console.log('Run completado!')

    // Obtener mensajes
    const messages = await openai.beta.threads.messages.list(threadId)
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')

    if (assistantMessages.length === 0) {
      throw new Error('No se recibió respuesta del asistente')
    }

    const lastMessage = assistantMessages[0]
    const content = lastMessage.content[0].text.value

    console.log('Contenido generado:', content.substring(0, 200) + '...')
    console.log('Total caracteres:', content.length)

    return {
      content,
      threadId,
      runId
    }
  } catch (error) {
    console.error('Error generating lesson content:', error)
    throw error
  }
}

const editLessonContent = async (editPrompt) => {
  try {
    console.log('=== Editando contenido de lección con OpenAI ===')
    console.log('Edit Prompt:', editPrompt.substring(0, 200) + '...')

    const openai = getOpenAIClient()

    // Crear thread con el mensaje del usuario
    console.log('Creando thread...')
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: editPrompt
        }
      ]
    })
    console.log('Thread creado:', thread.id)

    // Ejecutar el asistente de lecciones
    console.log('Ejecutando asistente de lecciones...')
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: LESSON_ASSISTANT_ID
    })
    console.log('Run creado:', run.id)

    // Esperar a que se complete
    const threadId = thread.id
    const runId = run.id

    let runStatus = run
    let attempts = 0
    const maxAttempts = 300

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run falló con detalles:', runStatus)
        throw new Error('Run failed with status: ' + runStatus.status)
      }

      attempts++
      if (attempts > maxAttempts) {
        throw new Error('Timeout: El asistente tardó demasiado en responder')
      }

      console.log('Esperando respuesta... (' + runStatus.status + ') - intento ' + attempts + '/' + maxAttempts)
      await new Promise(resolve => setTimeout(resolve, 1000))

      runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    console.log('Run completado!')

    // Obtener mensajes
    const messages = await openai.beta.threads.messages.list(threadId)
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')

    if (assistantMessages.length === 0) {
      throw new Error('No se recibió respuesta del asistente')
    }

    const lastMessage = assistantMessages[0]
    const content = lastMessage.content[0].text.value

    console.log('Contenido editado:', content.substring(0, 200) + '...')
    console.log('Total caracteres:', content.length)

    return {
      content,
      threadId,
      runId
    }
  } catch (error) {
    console.error('Error editing lesson content:', error)
    throw error
  }
}

const generateEvaluationContent = async (prompt) => {
  try {
    console.log('=== Generando evaluación con OpenAI ===')
    console.log('Prompt:', prompt)

    const openai = getOpenAIClient()

    // Crear thread con el mensaje del usuario
    console.log('Creando thread...')
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    console.log('Thread creado:', thread.id)

    // Ejecutar el asistente de evaluaciones
    console.log('Ejecutando asistente de evaluaciones...')
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: EVALUATION_ASSISTANT_ID
    })
    console.log('Run creado:', run.id)

    // Esperar a que se complete
    const threadId = thread.id
    const runId = run.id

    let runStatus = run
    let attempts = 0
    const maxAttempts = 300

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run falló con detalles:', runStatus)
        throw new Error('Run failed with status: ' + runStatus.status)
      }

      attempts++
      if (attempts > maxAttempts) {
        throw new Error('Timeout: El asistente tardó demasiado en responder')
      }

      console.log('Esperando respuesta... (' + runStatus.status + ') - intento ' + attempts + '/' + maxAttempts)
      await new Promise(resolve => setTimeout(resolve, 1000))

      runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    console.log('Run completado!')

    // Obtener mensajes
    const messages = await openai.beta.threads.messages.list(threadId)
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')

    if (assistantMessages.length === 0) {
      throw new Error('No se recibió respuesta del asistente')
    }

    const lastMessage = assistantMessages[0]
    const content = lastMessage.content[0].text.value

    console.log('Evaluación generada:', content.substring(0, 200) + '...')
    console.log('Total caracteres:', content.length)

    return {
      content,
      threadId,
      runId
    }
  } catch (error) {
    console.error('Error generating evaluation content:', error)
    throw error
  }
}

const editEvaluationContent = async (editPrompt) => {
  try {
    console.log('=== Editando evaluación con OpenAI ===')
    console.log('Edit Prompt:', editPrompt.substring(0, 200) + '...')

    const openai = getOpenAIClient()

    // Crear thread con el mensaje del usuario
    console.log('Creando thread...')
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: editPrompt
        }
      ]
    })
    console.log('Thread creado:', thread.id)

    // Ejecutar el asistente de evaluaciones
    console.log('Ejecutando asistente de evaluaciones...')
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: EVALUATION_ASSISTANT_ID
    })
    console.log('Run creado:', run.id)

    // Esperar a que se complete
    const threadId = thread.id
    const runId = run.id

    let runStatus = run
    let attempts = 0
    const maxAttempts = 300

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run falló con detalles:', runStatus)
        throw new Error('Run failed with status: ' + runStatus.status)
      }

      attempts++
      if (attempts > maxAttempts) {
        throw new Error('Timeout: El asistente tardó demasiado en responder')
      }

      console.log('Esperando respuesta... (' + runStatus.status + ') - intento ' + attempts + '/' + maxAttempts)
      await new Promise(resolve => setTimeout(resolve, 1000))

      runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    console.log('Run completado!')

    // Obtener mensajes
    const messages = await openai.beta.threads.messages.list(threadId)
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')

    if (assistantMessages.length === 0) {
      throw new Error('No se recibió respuesta del asistente')
    }

    const lastMessage = assistantMessages[0]
    const content = lastMessage.content[0].text.value

    console.log('Evaluación editada:', content.substring(0, 200) + '...')
    console.log('Total caracteres:', content.length)

    return {
      content,
      threadId,
      runId
    }
  } catch (error) {
    console.error('Error editing evaluation content:', error)
    throw error
  }
}

module.exports = {
  uploadFiles,
  createThreadAndRun,
  generateCourseContent,
  parseCourseStructure,
  generateLessonContent,
  editLessonContent,
  generateEvaluationContent,
  editEvaluationContent
}
