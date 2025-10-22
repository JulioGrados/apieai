if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

require('./lib/cron')

const server = require('./server')
const moment = require('moment-timezone')
const { connectIO } = require('./lib/io')
const config = require('config')
const { handleMessage } = require('utils').log

const filePath = 'api:src:index'

const main = async () => {
  moment.locale('es')
  moment.tz.setDefault('America/Bogota')

  const serverApp = await server.listen(config.server.port)
  connectIO(serverApp)
  handleMessage(`[Api Server] running in port ${config.server.port}`, filePath)
}
process.on('uncaughtException', error => console.log(error))
process.on('unhandledRejection', error => console.log(error))

main()
