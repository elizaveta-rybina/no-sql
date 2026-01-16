const express = require('express')
const cassandra = require('cassandra-driver')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

const clientOptions = {
	contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
	localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
	protocolOptions: { port: parseInt(process.env.CASSANDRA_PORT) || 9042 }
}

const client = new cassandra.Client(clientOptions)

const allowedScriptFiles = {
	tasks: path.join(__dirname, 'tasks.txt'),
	data: path.join(__dirname, 'data.txt')
}

function sanitizeKeyspaceName(name) {
	if (!name) return null
	const safe = name.replace(/[^a-zA-Z0-9_]/g, '')
	if (!safe) throw new Error('Invalid keyspace name')
	return safe
}

// helper: fetch columns for a table
async function getTableColumns(keyspace, table) {
	const query = `SELECT column_name, kind, position, type FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ? ORDER BY position`
	const result = await client.execute(query, [keyspace, table], {
		prepare: true
	})
	return result.rows
}

// Подключение к Cassandra
let connected = false
const connectWithRetry = async () => {
	try {
		await client.connect()
		connected = true
		console.log('Connected to Cassandra')
	} catch (err) {
		console.error(
			'Failed to connect to Cassandra, retrying in 5s...',
			err.message
		)
		setTimeout(connectWithRetry, 5000)
	}
}

connectWithRetry()

// API endpoints
app.get('/api/keyspaces', async (req, res) => {
	try {
		if (!connected)
			return res.status(503).json({ error: 'Not connected to Cassandra' })
		const result = await client.execute(
			'SELECT keyspace_name FROM system_schema.keyspaces'
		)
		res.json(result.rows)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

app.get('/api/keyspaces/:keyspace/tables', async (req, res) => {
	try {
		if (!connected)
			return res.status(503).json({ error: 'Not connected to Cassandra' })
		const query =
			'SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?'
		const result = await client.execute(query, [req.params.keyspace])
		res.json(result.rows)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// Columns of table
app.get('/api/keyspaces/:keyspace/tables/:table/columns', async (req, res) => {
	try {
		if (!connected)
			return res.status(503).json({ error: 'Not connected to Cassandra' })
		const cols = await getTableColumns(req.params.keyspace, req.params.table)
		res.json(cols)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

app.post('/api/query', async (req, res) => {
	try {
		if (!connected)
			return res.status(503).json({ error: 'Not connected to Cassandra' })

		const { query, keyspace } = req.body
		if (!query) return res.status(400).json({ error: 'Query is required' })

		// Безопасное имя keyspace и выполнение запроса в его контексте
		let result
		if (keyspace) {
			const safeKeyspace = sanitizeKeyspaceName(keyspace)
			const ksClient = new cassandra.Client({
				...clientOptions,
				keyspace: safeKeyspace
			})
			try {
				await ksClient.connect()
				result = await ksClient.execute(query)
			} finally {
				await ksClient.shutdown().catch(() => {})
			}
		} else {
			result = await client.execute(query)
		}
		res.json({
			columns: result.columns ? result.columns.map(c => c.name) : [],
			rows: result.rows,
			rowCount: result.rowLength
		})
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

app.post('/api/run-file', async (req, res) => {
	try {
		if (!connected)
			return res.status(503).json({ error: 'Not connected to Cassandra' })

		const { file, keyspace } = req.body
		const filePath = allowedScriptFiles[file]
		if (!filePath)
			return res.status(400).json({ error: 'Unsupported file name' })

		const raw = await fs.promises.readFile(filePath, 'utf8')
		const cleaned = raw
			.split('\n')
			.filter(line => !line.trim().startsWith('--'))
			.join('\n')
		const queries = cleaned
			.split(';')
			.map(q => q.trim())
			.filter(q => q.length > 0)

		if (queries.length === 0)
			return res.status(400).json({ error: 'No queries found in file' })

		let execClient = client
		let tempClient = null

		if (keyspace) {
			const safeKeyspace = sanitizeKeyspaceName(keyspace)
			tempClient = new cassandra.Client({
				...clientOptions,
				keyspace: safeKeyspace
			})
			await tempClient.connect()
			execClient = tempClient
		}

		const results = []
		let successCount = 0
		let errorCount = 0

		for (const q of queries) {
			try {
				const r = await execClient.execute(q)
				results.push({
					query: q,
					success: true,
					columns: r.columns ? r.columns.map(c => c.name) : [],
					rowCount: r.rowLength,
					rows: r.rows
				})
				successCount++
			} catch (err) {
				results.push({ query: q, success: false, error: err.message })
				errorCount++
			}
		}

		if (tempClient) await tempClient.shutdown().catch(() => {})

		return res.json({
			total: queries.length,
			successCount,
			errorCount,
			results
		})
	} catch (err) {
		return res.status(500).json({ error: err.message })
	}
})

app.get('/api/status', async (req, res) => {
	res.json({ connected })
})

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`Cassandra Web UI running on port ${PORT}`)
})
