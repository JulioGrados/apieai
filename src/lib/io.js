const socketIo = require('socket.io')
const { socketHandler } = require('../auth')

let io

const connectIO = server => {
  if (io) {
    return io
  }

  io = socketIo(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": "*", //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
})

  io.use(socketHandler)

  io.on('connection', socket => {
    if (socket.assessor) {
      socket.join(socket.assessor._id)
    }
  })

  return io
}

const getSocket = () => {
  return io
}

module.exports = {
  connectIO,
  getSocket
}
