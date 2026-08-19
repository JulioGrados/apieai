'use strict'

const OpenAI = require('openai')
const fs = require('fs')

// IDs de los asistentes
const ASSISTANT_ID = 'asst_PzWFubM9cS2RHmhmG9dLA0Jl' // Asistente para crear cursos
const LESSON_ASSISTANT_ID = 'asst_8rudtNeZDKqvSOPt2qHVZxWh' // Asistente para crear contenido de lección
const EVALUATION_ASSISTANT_ID = 'asst_XrNkndUfkHO6SjUONwn6jC7W' // Asistente para crear evaluaciones

// API Key desde variables de entorno
const API_KEY = process.env.OPENAI_API_KEY

// Validar que la API key esté configurada
if (!API_KEY || API_KEY.length < 20) {
  console.error('╔═══════════════════════════════════════════════════════════╗')
  console.error('║  ERROR: OPENAI_API_KEY no está configurada correctamente ║')
  console.error('║  Por favor configura la variable de entorno en .env      ║')
  console.error('╚═══════════════════════════════════════════════════════════╝')
  throw new Error('OPENAI_API_KEY no configurada')
}

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

// Archivos que se suben en paralelo a OpenAI
const UPLOAD_CONCURRENCY = 5

const uploadFile = async (openai, filePath) => {
  const path = require('path')

  console.log('Subiendo archivo:', filePath)

  // Obtener el nombre del archivo con extensión desde la ruta
  const fileName = path.basename(filePath)
  console.log('Nombre del archivo con extensión:', fileName)

  // Leer el archivo como buffer
  const fileBuffer = fs.readFileSync(filePath)

  // Crear objeto File con nombre explícito (incluyendo extensión)
  const fileBlob = new File([fileBuffer], fileName, {
    type: 'application/pdf'
  })

  const file = await openai.files.create({
    file: fileBlob,
    purpose: 'assistants'
  })
  console.log('Archivo subido con extensión:', file.id, '- nombre:', fileName)

  return file.id
}

const uploadFiles = async (filePaths) => {
  try {
    const openai = getOpenAIClient()

    // Se sube en paralelo (con límite) para que muchos archivos no disparen
    // el timeout del request; el orden del resultado se conserva por índice
    const uploadedFiles = new Array(filePaths.length)
    let cursor = 0

    const worker = async () => {
      while (cursor < filePaths.length) {
        const index = cursor++
        uploadedFiles[index] = await uploadFile(openai, filePaths[index])
      }
    }

    const workers = Math.min(UPLOAD_CONCURRENCY, filePaths.length)
    await Promise.all(Array.from({ length: workers }, worker))

    return uploadedFiles
  } catch (error) {
    console.error('Error uploading files to OpenAI:', error)
    throw error
  }
}

// OpenAI solo acepta 10 attachments por mensaje. Con más archivos se usa un vector store.
const MAX_MESSAGE_ATTACHMENTS = 10
// Máximo de archivos por lote al poblar el vector store (el límite de la API es 500)
const VECTOR_STORE_BATCH_SIZE = 100
// Espera máxima por lote: 150 intentos x 2s = 5 minutos
const VECTOR_STORE_POLL_INTERVAL_MS = 2000
const VECTOR_STORE_MAX_POLLS = 150

const getVectorStoresApi = (openai) => {
  const api = openai.vectorStores || (openai.beta && openai.beta.vectorStores)
  if (!api) {
    throw new Error('El SDK de OpenAI instalado no expone la API de vector stores')
  }
  return api
}

// Espera acotada a que un lote termine de indexarse.
// No se usa fileBatches.createAndPoll porque su bucle interno no tiene timeout:
// si el lote se queda en 'in_progress' la petición nunca termina.
const pollFileBatch = async (vectorStores, vectorStoreId, batchId) => {
  let batch = await vectorStores.fileBatches.retrieve(batchId, { vector_store_id: vectorStoreId })
  let attempts = 0

  while (batch.status === 'in_progress') {
    attempts++
    if (attempts > VECTOR_STORE_MAX_POLLS) {
      throw new Error('Timeout: los archivos tardaron demasiado en indexarse en el vector store')
    }

    console.log('Indexando archivos... (' + attempts + '/' + VECTOR_STORE_MAX_POLLS + ')',
      JSON.stringify(batch.file_counts))
    await new Promise(resolve => setTimeout(resolve, VECTOR_STORE_POLL_INTERVAL_MS))

    batch = await vectorStores.fileBatches.retrieve(batchId, { vector_store_id: vectorStoreId })
  }

  return batch
}

// Crea un vector store con todos los archivos y espera a que terminen de indexarse
const createVectorStoreWithFiles = async (openai, fileIds, name) => {
  const vectorStores = getVectorStoresApi(openai)

  console.log('Creando vector store para', fileIds.length, 'archivo(s)...')
  const vectorStore = await vectorStores.create({
    name,
    expires_after: { anchor: 'last_active_at', days: 7 }
  })
  console.log('Vector store creado:', vectorStore.id)

  let indexed = 0
  let failed = 0

  for (let i = 0; i < fileIds.length; i += VECTOR_STORE_BATCH_SIZE) {
    const chunk = fileIds.slice(i, i + VECTOR_STORE_BATCH_SIZE)
    console.log('Enviando lote de', chunk.length, 'archivo(s) al vector store...')

    const created = await vectorStores.fileBatches.create(vectorStore.id, { file_ids: chunk })
    const batch = await pollFileBatch(vectorStores, vectorStore.id, created.id)

    console.log('Lote procesado:', batch.status, JSON.stringify(batch.file_counts))

    indexed += (batch.file_counts && batch.file_counts.completed) || 0
    failed += (batch.file_counts && batch.file_counts.failed) || 0

    if (batch.status === 'cancelled') {
      throw new Error('La indexación de archivos en el vector store fue cancelada')
    }
  }

  if (failed > 0) {
    console.warn('Archivos que no se pudieron indexar:', failed, 'de', fileIds.length)
  }

  // Si ninguno se indexó, el asistente respondería sin ver los documentos
  if (indexed === 0) {
    throw new Error('Ningún archivo se pudo indexar en el vector store (' + fileIds.length + ' enviados)')
  }

  console.log('Vector store listo:', vectorStore.id, '-', indexed, 'de', fileIds.length, 'archivo(s) indexados')
  return vectorStore.id
}

// El vector store del thread requiere que el asistente tenga habilitado file_search.
// Devuelve la lista de tools a forzar en el run, o null si el asistente ya lo tiene.
const buildRunTools = async (openai, assistantId) => {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId)
    const tools = assistant.tools || []

    if (tools.some(tool => tool.type === 'file_search')) {
      return null
    }

    console.log('El asistente no tiene file_search habilitado, se agrega en el run')
    return [...tools, { type: 'file_search' }]
  } catch (error) {
    console.warn('No se pudo verificar las tools del asistente:', error.message)
    return [{ type: 'file_search' }]
  }
}

const createThreadAndRun = async (prompt, fileIds = []) => {
  try {
    const openai = getOpenAIClient()

    const message = { role: 'user', content: prompt }
    const threadPayload = { messages: [message] }
    let vectorStoreId = null

    if (fileIds.length > 0 && fileIds.length <= MAX_MESSAGE_ATTACHMENTS) {
      message.attachments = fileIds.map(fileId => ({
        file_id: fileId,
        tools: [{ type: 'file_search' }]
      }))
    } else if (fileIds.length > MAX_MESSAGE_ATTACHMENTS) {
      console.log(
        fileIds.length, 'archivos superan el límite de', MAX_MESSAGE_ATTACHMENTS,
        'attachments por mensaje, se usará un vector store'
      )
      vectorStoreId = await createVectorStoreWithFiles(openai, fileIds, 'curso-' + Date.now())
      threadPayload.tool_resources = {
        file_search: { vector_store_ids: [vectorStoreId] }
      }
    }

    console.log('Creando thread...')
    const thread = await openai.beta.threads.create(threadPayload)

    console.log('Thread creado:', thread.id)

    console.log('Ejecutando asistente...')
    const runPayload = { assistant_id: ASSISTANT_ID }

    if (vectorStoreId) {
      const tools = await buildRunTools(openai, ASSISTANT_ID)
      if (tools) {
        runPayload.tools = tools
      }
    }

    const run = await openai.beta.threads.runs.create(thread.id, runPayload)

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
      vectorStoreId,
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
