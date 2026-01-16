let currentKeyspace = null
let queryStartTime = null

async function checkStatus() {
	try {
		const response = await fetch('/api/status')
		const data = await response.json()
		const statusEl = document.getElementById('status')
		const statusText = document.getElementById('statusText')
		if (data.connected) {
			statusEl.classList.add('connected')
			statusText.textContent = 'Подключено'
			loadKeyspaces()
		} else {
			statusText.textContent = 'Подключение...'
			setTimeout(checkStatus, 2000)
		}
	} catch (err) {
		document.getElementById('statusText').textContent = 'Ошибка подключения'
		setTimeout(checkStatus, 2000)
	}
}

async function loadKeyspaces() {
	try {
		const response = await fetch('/api/keyspaces')
		const keyspaces = await response.json()
		const container = document.getElementById('keyspaces')

		// Автовыбор: если есть keyspace "books" или первый по списку
		if (!currentKeyspace && keyspaces.length > 0) {
			const preferred = keyspaces.find(k => k.keyspace_name === 'books')
			currentKeyspace = preferred
				? preferred.keyspace_name
				: keyspaces[0].keyspace_name
			document.getElementById('keyspaceLabel').textContent = currentKeyspace
		}

		container.innerHTML = keyspaces
			.map(ks => {
				const active = ks.keyspace_name === currentKeyspace ? 'active' : ''
				return `<div class="keyspace-item ${active}" onclick="selectKeyspace('${ks.keyspace_name}')">${ks.keyspace_name}</div>`
			})
			.join('')
	} catch (err) {
		console.error('Error loading keyspaces:', err)
	}
}

function selectKeyspace(keyspace) {
	currentKeyspace = keyspace
	document.getElementById('keyspaceLabel').textContent = keyspace
	loadTables(keyspace)
}

async function loadTables(keyspace) {
	try {
		currentKeyspace = keyspace
		const response = await fetch(`/api/keyspaces/${keyspace}/tables`)
		const tables = await response.json()
		const container = document.getElementById('keyspaces')
		const items = container.querySelectorAll('.keyspace-item')
		items.forEach(item => {
			item.classList.toggle('active', item.textContent === keyspace)
		})

		const tablesHtml = tables
			.map(
				t =>
					`<div class="table-item" onclick="browseTable('${keyspace}', '${t.table_name}')">${t.table_name}</div>`
			)
			.join('')

		// Вставляем таблицы под выбранным keyspace
		items.forEach(item => {
			if (item.textContent === keyspace) {
				// Удаляем старые таблицы-потомки
				let next = item.nextElementSibling
				while (next && next.classList.contains('table-item')) {
					const toRemove = next
					next = next.nextElementSibling
					toRemove.remove()
				}
				item.insertAdjacentHTML('afterend', tablesHtml)
			}
		})
	} catch (err) {
		console.error('Error loading tables:', err)
	}
}

async function browseTable(keyspace, table) {
	if (!currentKeyspace) {
		document.getElementById('result').innerHTML =
			'<div class="error">❌ <strong>Ошибка:</strong> Выберите keyspace слева</div>'
		return
	}

	const query = `SELECT * FROM ${keyspace}.${table} LIMIT 100;`
	setQuery(query)
	const resultDiv = document.getElementById('result')
	resultDiv.innerHTML =
		'<div style="text-align: center; padding: 20px; color: #667eea;">⏳ Загрузка данных таблицы...</div>'

	try {
		// Параллельно читаем колонки и данные
		const [colsResp, rowsResp] = await Promise.all([
			fetch(`/api/keyspaces/${keyspace}/tables/${table}/columns`),
			fetch('/api/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, keyspace: currentKeyspace })
			})
		])

		const colsData = await colsResp.json()
		const data = await rowsResp.json()

		if (!rowsResp.ok) {
			resultDiv.innerHTML = `<div class="error">❌ <strong>Ошибка:</strong> ${data.error}</div>`
			return
		}

		if (data.rows && data.rows.length > 0) {
			const schemaBlock =
				colsData && Array.isArray(colsData)
					? `
				<div style="padding:12px; margin-bottom:12px; background: #f0f4ff; border-radius: 8px;">
					<h4 style="margin-bottom:8px; color: #667eea;">📐 Структура ${table}</h4>
					<div class="table-wrapper">
						<table>
							<thead>
								<tr><th>Колонка</th><th>Тип</th><th>Роль</th><th>Позиция</th></tr>
							</thead>
							<tbody>
								${colsData
									.map(
										c =>
											`<tr><td>${c.column_name}</td><td>${c.type}</td><td>${c.kind}</td><td>${c.position}</td></tr>`
									)
									.join('')}
							</tbody>
						</table>
					</div>
				</div>
			`
					: ''

			const stats = `
				<div class="stats">
					<div class="stat-item">
						<span>📊 Строк:</span>
						<span class="stat-value">${data.rowCount}</span>
					</div>
					<div class="stat-item">
						<span>📋 Колонок:</span>
						<span class="stat-value">${data.columns.length}</span>
					</div>
				</div>
			`
			const tableHtml = `
				${stats}
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>${data.columns.map(col => '<th>' + col + '</th>').join('')}</tr>
						</thead>
						<tbody>
							${data.rows
								.map(
									row =>
										'<tr>' +
										data.columns
											.map(col => {
												const value = row[col]
												let displayValue = JSON.stringify(value)
												if (displayValue && displayValue.length > 100) {
													displayValue = displayValue.substring(0, 100) + '...'
												}
												return (
													'<td title="' +
													JSON.stringify(value) +
													'">' +
													displayValue +
													'</td>'
												)
											})
											.join('') +
										'</tr>'
								)
								.join('')}
						</tbody>
					</table>
				</div>
			`
			resultDiv.innerHTML = schemaBlock + tableHtml
		} else {
			resultDiv.innerHTML = '<div class="success">✅ Таблица пуста</div>'
		}
	} catch (err) {
		resultDiv.innerHTML = `<div class="error">❌ <strong>Ошибка:</strong> ${err.message}</div>`
	}
}

function setQuery(query) {
	document.getElementById('query').value = query
	document.getElementById('query').focus()
}

function clearQuery() {
	document.getElementById('query').value = ''
	document.getElementById('result').innerHTML = ''
	document.getElementById('query').focus()
}

async function executeQuery() {
	const query = document.getElementById('query').value.trim()
	const resultDiv = document.getElementById('result')
	const btn = document.getElementById('executeBtn')

	if (!query) return

	if (!currentKeyspace) {
		resultDiv.innerHTML =
			'<div class="error">❌ <strong>Ошибка:</strong> Выберите keyspace слева перед выполнением запросов</div>'
		return
	}

	// Удаляем все комментарии (строки начинающиеся с --)
	const cleanedQuery = query
		.split('\n')
		.filter(line => !line.trim().startsWith('--'))
		.join('\n')

	// Разделяем запросы по точке с запятой и фильтруем пустые
	const queries = cleanedQuery
		.split(';')
		.map(q => q.trim())
		.filter(q => q.length > 0)

	if (queries.length === 0) return

	btn.disabled = true
	btn.innerHTML = '⏳ Выполнение...'
	queryStartTime = Date.now()

	if (queries.length > 1) {
		resultDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: #667eea;">⏳ Выполнение ${queries.length} запросов...</div>`
	} else {
		resultDiv.innerHTML =
			'<div style="text-align: center; padding: 20px; color: #667eea;">⏳ Выполнение запроса...</div>'
	}

	const results = []
	let successCount = 0
	let errorCount = 0

	try {
		for (let i = 0; i < queries.length; i++) {
			const singleQuery = queries[i]

			try {
				const response = await fetch('/api/query', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						query: singleQuery,
						keyspace: currentKeyspace
					})
				})

				const data = await response.json()

				if (!response.ok) {
					errorCount++
					results.push({
						query: singleQuery,
						error: data.error,
						success: false
					})
				} else {
					successCount++
					results.push({
						query: singleQuery,
						data: data,
						success: true
					})
				}
			} catch (err) {
				errorCount++
				results.push({
					query: singleQuery,
					error: err.message,
					success: false
				})
			}
		}

		const executionTime = ((Date.now() - queryStartTime) / 1000).toFixed(3)

		// Отображение результатов
		let html = ''

		if (queries.length > 1) {
			html += `
				<div class="${errorCount > 0 ? 'error' : 'success'}">
					<strong>${
						errorCount > 0 ? '⚠️' : '✅'
					} Выполнено запросов:</strong> ${successCount}/${queries.length}
					<div style="margin-top: 8px; font-size: 13px; opacity: 0.9;">
						⏱️ Общее время: ${executionTime}s
					</div>
				</div>
			`
		}

		// Показываем результаты каждого запроса
		results.forEach((result, index) => {
			const queryPreview =
				result.query.substring(0, 80) + (result.query.length > 80 ? '...' : '')

			if (result.success) {
				if (result.data.rows && result.data.rows.length > 0) {
					html += `
						<div style="margin-top: 16px; padding: 12px; background: #f0f4ff; border-radius: 8px; font-family: monospace; font-size: 12px; color: #667eea;">
							Query ${index + 1}: ${queryPreview}
						</div>
						<div class="stats">
							<div class="stat-item">
								<span>📊 Строк:</span>
								<span class="stat-value">${result.data.rowCount}</span>
							</div>
							<div class="stat-item">
								<span>📋 Колонок:</span>
								<span class="stat-value">${result.data.columns.length}</span>
							</div>
						</div>
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>${result.data.columns.map(col => '<th>' + col + '</th>').join('')}</tr>
								</thead>
								<tbody>
									${result.data.rows
										.map(
											row =>
												'<tr>' +
												result.data.columns
													.map(col => {
														const value = row[col]
														let displayValue = JSON.stringify(value)
														if (displayValue && displayValue.length > 100) {
															displayValue =
																displayValue.substring(0, 100) + '...'
														}
														return (
															'<td title="' +
															JSON.stringify(value) +
															'">' +
															displayValue +
															'</td>'
														)
													})
													.join('') +
												'</tr>'
										)
										.join('')}
								</tbody>
							</table>
						</div>
					`
				} else if (queries.length === 1) {
					html += `
						<div class="success">
							✅ <strong>Запрос выполнен успешно</strong>
							<div style="margin-top: 8px; font-size: 13px; opacity: 0.9;">
								⏱️ Время выполнения: ${executionTime}s
							</div>
						</div>
					`
				} else {
					html += `
						<div style="margin-top: 12px; padding: 12px; background: #e8f5e9; border-radius: 8px;">
							✅ Query ${index + 1}: ${queryPreview}
						</div>
					`
				}
			} else {
				html += `
					<div style="margin-top: 12px;">
						<div style="padding: 8px 12px; background: #f0f4ff; border-radius: 8px; font-family: monospace; font-size: 12px; color: #667eea; margin-bottom: 8px;">
							Query ${index + 1}: ${queryPreview}
						</div>
						<div class="error">❌ <strong>Ошибка:</strong> ${result.error}</div>
					</div>
				`
			}
		})

		resultDiv.innerHTML = html
	} catch (err) {
		resultDiv.innerHTML = `<div class="error">❌ <strong>Ошибка:</strong> ${err.message}</div>`
	} finally {
		btn.disabled = false
		btn.innerHTML = '▶️ Выполнить запрос'
	}
}

// Поддержка Ctrl+Enter для выполнения запроса
document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('query').addEventListener('keydown', e => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			executeQuery()
		}
	})

	checkStatus()
})
