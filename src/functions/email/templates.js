const sendAccount = (course, names, email, username, password) => {
  let msg = {
    to: email,
    cc: 'cursos@eai.edu.pe',
    from: 'cursos@eai.edu.pe',
    subject: `Tus credenciales para acceder al ${course}`,
    html: `Saludos: ${names}<br><br>` +
      `Ya eres parte de la comunidad de Escuela Americana de Innovación, a continuación te brindaremos los pasos para que puedas acceder a disfrutar del contenido de tu curso: <br><br>` +
      `1. Ingresa a <a href='https://cursos.eai.edu.pe/login/index.php'>https://cursos.eai.edu.pe/login/index.php</a><br>`+
      `2. Escriba su usuario: ${username}<br>` +
      `3. Escriba su contraseña: ${password}<br>`+
      `4. De clic en el botón azul Acceder.<br>` +
      `5. Puede acceder a sus cursos inscritos desde el centro de la pantalla.<br><br>`+
      `Recuerde que para cualquier consulta administrativa puedes escribirnos a cursos@eai.edu.pe, será un gusto atender sus consultas.<br><br>`+
      `Gracias<br><br>` +
      `--<br>` +
      `Atte.<br>` +
      `Área Académica<br>` +
      `Escuela Americana de Innovación`,
    content: `Saludos: ${names}<br><br>` +
      `Ya eres parte de la comunidad de Escuela Americana de Innovación, a continuación te brindaremos los pasos para que puedas acceder a disfrutar del contenido de tu curso: <br><br>` +
      `1. Ingresa a <a href='https://cursos.eai.edu.pe/login/index.php'>https://cursos.eai.edu.pe/login/index.php</a><br>`+
      `2. Escriba su usuario: ${username}<br>` +
      `3. Escriba su contraseña: ${password}<br>`+
      `4. De clic en el botón azul Acceder.<br>` +
      `5. Puede acceder a sus cursos inscritos desde el centro de la pantalla.<br><br>`+
      `Recuerde que para cualquier consulta administrativa puedes escribirnos a cursos@eai.edu.pe, será un gusto atender sus consultas.<br><br>`+
      `Gracias<br><br>` +
      `--<br>` +
      `Atte.<br>` +
      `Área Académica<br>` +
      `Escuela Americana de Innovación`,
    fromname: `Escuela Americana de Innovación`
  }
  return msg
}

const sendError = (topic, firstName, lastName, dni, mobile, email) => {
  console.log(topic, firstName, lastName, dni, mobile, email)
  let msg = {
    to: 'cursos@eai.edu.pe',
    from: 'cursos@eai.edu.pe',
    subject: `Problemas con la matrícula al curso gratuito - Colombia`,
    html: `Se ha reportado un problema (${topic}) para realizar la matrícula gratuita del siguiente estudiante:` +
      `1. Nombres: ${firstName}<br>`+
      `2. Apellidos: ${lastName}<br>` +
      `3. Cédula de Ciudadanía: ${dni}<br>`+
      `4. Celular: ${mobile}<br>` +
      `5. Email: ${email}<br>`,
    content: `Se ha reportado un problema para realizar la matrícula gratuita del siguiente estudiante:` +
      `1. Nombres: ${firstName}<br>`+
      `2. Escriba su usuario: ${lastName}<br>` +
      `3. Cédula de Ciudadanía: ${dni}<br>`+
      `4. Celular: ${mobile}<br>` +
      `5. Email: ${email}<br>`,
    fromname: `Escuela Americana de Innovación`
  }
  return msg
}

module.exports = {
  sendAccount,
  sendError
}