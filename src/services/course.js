'use strict'

const slug = require('slug')
const { courseDB, dealDB, userDB } = require('db/lib')
const { saveFile } = require('utils/files/save')
const { countDocuments: countLessons } = require('./lesson')
const { countDocuments: countChapters } = require('./chapter')
const { createLesson } = require('./lesson')
const { createChapter } = require('./chapter')
const { generateCourseContent, parseCourseStructure } = require('./openai')

const currenciesData = require('utils/functions/currencies')

const listCourses = async params => {
  const courses = await courseDB.list(params)
  return courses
}

const listCoursesAi = async params => {
  const courses = await courseDB.list(params)

  // Agregar conteos de módulos y capítulos para cada curso
  const coursesWithCounts = await Promise.all(
    courses.map(async course => {
      const courseId = course._id

      // Contar módulos (lessons) del curso
      const modulesCount = await countLessons({
        query: { 'course.ref': courseId }
      })

      // Contar capítulos del curso (tienen referencia directa al course)
      const chaptersCount = await countChapters({
        query: { course: courseId }
      })

      // Retornar el curso con los conteos agregados
      return {
        ...course.toJSON(),
        modulesCount,
        chaptersCount
      }
    })
  )

  return coursesWithCounts
}

const createCourse = async (body, files, loggedCourse) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const course = await courseDB.create(body)
  return course
}

const createCourseAi = async (body, files, loggedCourse) => {
  try {
    console.log('Iniciando creación de curso con IA...')
    console.log('Body recibido:', body)
    console.log('Files recibidos:', files ? Object.keys(files) : 'ninguno')

    // Extraer valores del frontend
    const values = body.values || {}
    const themes = body.themes || []

    // Guardar archivos PDF y obtener sus rutas
    const filePaths = []
    const savedFiles = {}

    // Procesar archivos que vienen en req.files
    if (files) {
      console.log('Procesando archivos:', Object.keys(files))
      const fs = require('fs')
      const uploadsDir = `${process.cwd()}/public/uploads/courses`

      // Crear directorio si no existe
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
        console.log('Directorio creado:', uploadsDir)
      }

      for (const fileKey in files) {
        const file = files[fileKey]
        console.log(`Procesando archivo ${fileKey}:`, file.name, file.mimetype)

        // Generar nombre limpio para el archivo
        const cleanName = file.name.toLowerCase().replace(/\s/g, '_')
        const fileName = `${file.md5}-${cleanName}`
        const filePath = `${uploadsDir}/${fileName}`

        try {
          // Mover archivo al directorio público
          await file.mv(filePath)
          console.log('Archivo guardado en:', filePath)

          // Guardar la ruta relativa
          const route = `/uploads/courses/${fileName}`
          savedFiles[fileKey] = route

          // Si es PDF, agregarlo para OpenAI
          if (file.mimetype === 'application/pdf') {
            filePaths.push(filePath)
            console.log('Archivo PDF agregado para OpenAI:', filePath)
          }
        } catch (error) {
          console.error('Error al guardar archivo:', error)
          throw new Error(`Error al guardar el archivo ${file.name}: ${error.message}`)
        }
      }
    }

    // Construir lista de temas
    const themesList = themes
      .map((t, i) => values[`theme_${i}`])
      .filter(Boolean)
      .join(', ')

    // Construir el prompt para OpenAI
    const prompt = `
Genera un curso completo sobre el siguiente tema: ${values.title || values.subject || 'el tema proporcionado'}.

El curso debe estar estructurado de la siguiente manera:
- Divide el contenido en ${values.moduleCount || 10} módulos temáticos coherentes
- Cada módulo debe tener entre 3 y 8 lecciones
- Cada lección debe tener una descripción clara y educativa

Asignatura: ${values.subject || 'No especificada'}
Temas específicos: ${themesList || 'No especificados'}
Idioma: ${values.language || 'Spanish'}
Nivel académico: ${values.academicLevel || 'Formación continua'}

Por favor, devuelve la estructura del curso en formato JSON con la siguiente estructura:
{
  "modulos": [
    {
      "position": 1,
      "title": "Nombre del módulo",
      "description": "Descripción del módulo",
      "lecciones": [
        {
          "position": 1,
          "title": "Nombre de la lección",
          "description": "Descripción de la lección"
        }
      ]
    }
  ]
}
`

    console.log('Enviando solicitud a OpenAI...')
    console.log('Prompt:', prompt.substring(0, 200) + '...')
    console.log('Archivos PDF:', filePaths)

    // Generar contenido del curso con OpenAI
    const aiResponse = await generateCourseContent(prompt, filePaths)

    console.log('Respuesta de OpenAI recibida')
    console.log('Thread ID:', aiResponse.threadId)

    // Parsear la estructura de módulos y capítulos
    const courseStructure = parseCourseStructure(aiResponse.response)

    console.log('Estructura parseada:', {
      modulesCount: courseStructure.modules.length,
      modules: courseStructure.modules.map(m => ({
        name: m.name,
        chaptersCount: m.chapters.length
      }))
    })

    // Crear el curso en la base de datos
    const courseData = {
      name: values.title || values.subject,
      slug: slug(values.title || values.subject, { lower: true }),
      subject: values.subject,
      language: values.language || 'Spanish',
      academicLevel: values.academicLevel || 'Formación continua',
      description: values.description || '',
      format: 'ai',
      ...savedFiles
    }

    const course = await courseDB.create(courseData)
    console.log('Curso creado con ID:', course._id)

    // Crear módulos (lessons) y capítulos
    for (const moduleData of courseStructure.modules) {
      console.log(`Creando módulo: ${moduleData.name}`)

      const lessonData = {
        name: moduleData.name,
        order: moduleData.order,
        description: `Módulo ${moduleData.order}`,
        course: {
          name: course.name,
          ref: course._id
        }
      }

      const lesson = await createLesson(lessonData)
      console.log(`Módulo creado con ID: ${lesson._id}`)

      // Crear capítulos del módulo
      for (const chapterData of moduleData.chapters) {
        console.log(`  Creando capítulo: ${chapterData.name}`)

        const chapterBody = {
          name: chapterData.name,
          order: chapterData.order,
          description: chapterData.description,
          lesson: lesson._id,
          course: course._id,
          status: 'article' // Tipo de capítulo (artículo de texto)
        }

        const chapter = await createChapter(chapterBody)
        console.log(`  Capítulo creado con ID: ${chapter._id}`)

        // Crear versión del capítulo con el contenido generado
        // Aquí podrías crear una versión del capítulo si tienes ese modelo
        // Por ahora solo guardamos el contenido en la descripción
      }
    }

    console.log('Curso completo generado exitosamente')

    // Retornar el curso con información adicional
    return {
      ...course.toJSON(),
      modulesCount: courseStructure.modules.length,
      chaptersCount: courseStructure.modules.reduce((sum, m) => sum + m.chapters.length, 0)
    }
  } catch (error) {
    console.error('Error en createCourseAi:', error)
    throw error
  }
}

const updateCourse = async (courseId, body, files, loggedCourse) => {
  const brochures = body.brochures.filter(item => item.upload)
  if (files) {
    for (const label in files) {
      if (label.includes('brochure')) {
        const route = await saveFile(files[label], '/courses')
        const index = label.substring(8, label.length)
        if (index === 'File') {
          body.brochure = route
        } else {
          const brochure = body.brochures[index]
          brochures.push({
            url: route,
            upload: true,
            money: brochure.money
          })
        }
      } else {
        const route = await saveFile(files[label], '/courses')
        body[label] = route
      }
    }
  }
  body.brochures = brochures
  const course = await courseDB.update(courseId, body)
  return course
}

const updateDealCreate = async (dealId, body, loggedUser) => {
  // console.log('dealId', dealId)
  // console.log('body', body)
  let deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  const userId = deal.client._id
  const courseId = deal.students[0].courses[0] && deal.students[0].courses[0]._id
  const course = await courseDB.detail({
    query: { _id: courseId }
  })

  const user = await userDB.detail({
    query: { _id: userId }
  })

  deal.students[0].courses[0] = {...course.toJSON(), ref: course.toJSON()}
  deal.students[0].student = {...user.toJSON(), ref: user.toJSON()}
  const updateDeal = await dealDB.update(dealId, {students: deal.students, origin: 'sitio web'})
  
  return updateDeal
}

const detailCourse = async params => {
  const course = await courseDB.detail(params)
  return course
}

const deleteCourse = async (courseId, loggedCourse) => {
  const course = await courseDB.remove(courseId)
  return course
}

const priceCourses = async (body, loggedUser) => {
  const courses = body.courses
  const money = body.money
  const amount = body.amount
  const moneyObj = currenciesData.find((item) => item.code === money)
  const coursesUpdate = courses.map(async element => { 
    try {
      const course = await courseDB.detail({ query: { _id: element._id } })
      const coins = course.coins
      const index = coins.findIndex(item => item.code === money)
      if ( index >= 0) {
        coins[index].price = amount
        coins[index].priceOffert = amount
      } else {
        const coin = {
          symbol: moneyObj.symbol,
          name: moneyObj.name,
          code: money,
          price: amount,
          priceOffert: amount
        }
        coins.push(coin)
      }
      const courseUpd = await courseDB.update(element._id, {
        coins: coins
      })
      return courseUpd
    } catch (error) {
      throw error
    }
      
  })

  const results = await Promise.all(coursesUpdate.map(p => p.catch(e => e)))
  const validCourses = results.filter(result => !result.error)
  const errorCourses = results.filter(result => result.error)

  return { validCourses, errorCourses }
}

const countDocuments = async params => {
  const count = await courseDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCourses,
  listCoursesAi,
  createCourse,
  createCourseAi,
  updateCourse,
  updateDealCreate,
  detailCourse,
  priceCourses,
  deleteCourse
}
