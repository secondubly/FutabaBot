/**
 * Credit to: https://github.com/prisma/prisma/issues/3865#issuecomment-871592752
 * Tweaked slightly for personal use
 */
'use strict'

process.chdir(__dirname + '/..')

const args = process.argv.slice(2)
const nodeEnv = args.shift()
const envs = { dev: 'development', prod: 'production' }

if (!nodeEnv || !Object.keys(envs).includes(nodeEnv)) {
	process.stderr.write('Usage: prisma [dev|prod] [prisma-commands]\n')
	process.exit(0)
}

process.env['NODE_ENV'] = envs[nodeEnv]
console.log('Node Env: ', process.env['NODE_ENV'])

require('dotenv-flow').config({
	path: 'src/'
})

const { spawn } = require('child_process')
const opts = { stdio: 'inherit' }

if (process.platform === 'win32') {
	spawn('cmd', ['/c', 'node_modules\\.bin\\prisma.cmd', ...args], opts)
} else {
	spawn('node_modules/.bin/prisma', args, opts)
}
