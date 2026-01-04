/**
 * Funky Audit Viewer - Interactive audit trail visualization
 * Provides diff viewing, timeline rendering, and comprehensive audit display
 * @module Funky.AuditViewer
 */
(function() {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('AuditViewer')) {
		return;
	}

	// Module-level reference to Funky.Dom
	var D = Funky.Dom;

	const AuditViewer = {
		// Instance registry for LiveBinding
		_instances: {},

		// State
		auditTable: null,
		currentEntry: null,
		currentDiffView: 'split',
		_data: [],  // Internal data store for Bindable Interface

		// Configuration
		operationColors: {
			create: { bg: '#10b981', text: '#ffffff', label: 'Created' },
			update: { bg: '#f59e0b', text: '#ffffff', label: 'Updated' },
			delete: { bg: '#ef4444', text: '#ffffff', label: 'Deleted' }
		},

		tableIcons: {
			trades: 'fa-exchange-alt',
			clients: 'fa-building',
			securities: 'fa-chart-line',
			trade_actions: 'fa-bolt',
			trade_templates: 'fa-file-alt',
			allocations: 'fa-sitemap',
			trade_allocations: 'fa-project-diagram',
			users: 'fa-users',
			fx_rates: 'fa-dollar-sign',
			client_relationships: 'fa-handshake',
			report_formats: 'fa-file-export',
			report_schedules: 'fa-calendar-alt'
		},

		// ==================== MAIN LIST PAGE ====================

		init: function(containerId) {
			// Register instance for LiveBinding
			if (containerId) {
				this._containerId = containerId;
				AuditViewer._instances[containerId] = this;
			}

			this.loadStats();
			this.loadRecentTimeline();
			this.loadTableStats();
			this.initFilters();
			this.initDataTable();
			this.initDateRangePicker();
		},

		loadStats: function() {
			fetch('/api/audit_logs/stats', {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					// Calculate totals from table stats
					let total = 0,
						creates = 0,
						updates = 0,
						deletes = 0;

					if (data.table_stats) {
						data.table_stats.forEach(ts => {
							total += ts.total_changes || 0;
							creates += ts.creates || 0;
							updates += ts.updates || 0;
							deletes += ts.deletes || 0;
						});
					}

					document.getElementById('total-entries').textContent = Funky.Util.abbreviateNumber(total);
					document.getElementById('creates-today').textContent = Funky.Util.abbreviateNumber(creates);
					document.getElementById('updates-today').textContent = Funky.Util.abbreviateNumber(updates);
					document.getElementById('deletes-today').textContent = Funky.Util.abbreviateNumber(deletes);
				})
				.catch(err => {
					console.error('Failed to load stats:', err);
				});
		},

		loadRecentTimeline: function() {
			var self = this;
			fetch('/api/audit_logs?limit=10', {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					var container = document.getElementById('recent-timeline');
					if (!data.records || data.records.length === 0) {
						container.replaceChildren(D.p().classAdd('no-data').text('No recent activity').el);
						return;
					}

					D.wrap(container).empty();
					data.records.forEach(function(entry) {
						self.renderTimelineItem(entry).appendTo(container);
					});
				})
				.catch(err => {
					console.error('Failed to load timeline:', err);
					document.getElementById('recent-timeline').replaceChildren(
						D.p().classAdd('error').text('Failed to load').el
					);
				});
		},

		loadTableStats: function() {
			var self = this;
			fetch('/api/audit_logs/stats', {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					var container = document.getElementById('table-stats-chart');
					if (!data.table_stats || data.table_stats.length === 0) {
						container.replaceChildren(D.p().classAdd('no-data').text('No audit data').el);
						return;
					}

					// Sort by total changes and take top 8
					var sorted = data.table_stats
						.sort((a, b) => (b.total_changes || 0) - (a.total_changes || 0))
						.slice(0, 8);

					var maxChanges = sorted[0]?.total_changes || 1;

					var barsContainer = D.div().classAdd('table-stats-bars');
					sorted.forEach(function(ts) {
						var row = D.div()
							.classAdd('table-stat-row')
							.on('click', function() { AuditViewer.filterByTable(ts.table_name); })
							.child(
								D.div().classAdd('table-stat-label').child(
									D.icon('fas ' + (self.tableIcons[ts.table_name] || 'fa-database')),
									D.span().text(self.formatTableName(ts.table_name))
								),
								D.div().classAdd('table-stat-bar-container').child(
									D.div()
										.classAdd('table-stat-bar')
										.style('width', ((ts.total_changes / maxChanges) * 100) + '%')
										.child(
											D.span().classAdd('bar-value').text(Funky.Util.abbreviateNumber(ts.total_changes))
										)
								)
							);
						barsContainer.child(row);
					});

					D.wrap(container).empty();
					barsContainer.appendTo(container);
				})
				.catch(err => {
					console.error('Failed to load table stats:', err);
				});
		},

		initFilters: function() {
			// Load users for filter dropdown
			fetch('/api/users?limit=100', {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					const select = document.getElementById('userFilter');
					if (data.users) {
						data.users.forEach(user => {
							const option = document.createElement('option');
							option.value = user.id;
							option.textContent = user.username || user.email;
							select.appendChild(option);
						});
					}
				})
				.catch(err => console.error('Failed to load users:', err));
		},

		initDataTable: function() {
			const self = this;
			const D = Funky.Dom;

			this.auditTable = $('#auditTable').DataTable({
				processing: true,
				serverSide: true,
				ajax: {
					url: '/api/audit_logs',
					type: 'GET',
					data: function(d) {
						// Convert DataTables params to our API format
						var tableFilter = D.one('#tableFilter');
						var operationFilter = D.one('#operationFilter');
						var userFilter = D.one('#userFilter');
						var sourceFilter = D.one('#sourceFilter');
						return {
							page: Math.floor(d.start / d.length) + 1,
							limit: d.length,
							table_name: (tableFilter && tableFilter.el.value) || undefined,
							operation: (operationFilter && operationFilter.el.value) || undefined,
							user_id: (userFilter && userFilter.el.value) || undefined,
							source: (sourceFilter && sourceFilter.el.value) || undefined,
							sort: d.order && d.order[0] ?
								d.columns[d.order[0].column].data + ' ' + d.order[0].dir.toUpperCase() : 'created_at DESC'
						};
					},
					dataSrc: function(json) {
						json.recordsTotal = json.total;
						json.recordsFiltered = json.total;
						return json.records || [];
					}
				},
				columns: [
					{ data: 'id', className: 'audit-id' },
					{
						data: 'created_at',
						render: function(data) {
							return self.formatDateTime(data);
						}
					},
					{
						data: 'table_name',
						render: function(data) {
							const icon = self.tableIcons[data] || 'fa-database';
							return `<span class="table-badge"><i class="fas ${icon}"></i> ${self.formatTableName(data)}</span>`;
						}
					},
					{
						data: 'record_id',
						render: function(data, type, row) {
							return `<a href="/audit_logs/entity/${row.table_name}/${data}" class="record-link">#${data}</a>`;
						}
					},
					{
						data: 'operation',
						render: function(data) {
							return self.renderOperationBadge(data);
						}
					},
					{
						data: 'username',
						render: function(data, type, row) {
							if (!data) return '<span class="text-muted">System</span>';
							return `<a href="/audit_logs/user/${row.user_id}" class="user-link"><i class="fas fa-user"></i> ${data}</a>`;
						}
					},
					{
						data: 'changed_fields',
						render: function(data) {
							if (!data || data.length === 0) return '-';
							const display = data.slice(0, 3).join(', ');
							const more = data.length > 3 ? ` <span class="more-fields">+${data.length - 3} more</span>` : '';
							return `<span class="changed-fields">${display}${more}</span>`;
						}
					},
					{
						data: 'source',
						render: function(data) {
							const icons = { application: 'fa-code', trigger: 'fa-database', manual: 'fa-hand-pointer' };
							return `<span class="source-badge source-${data}"><i class="fas ${icons[data] || 'fa-question'}"></i> ${data}</span>`;
						}
					},
					{
						data: 'ip_address',
						render: function(data) {
							return data || '-';
						}
					},
					{
						data: null,
						orderable: false,
						render: function(data, type, row) {
							return `
                <div class="action-buttons" role="group" aria-label="Actions for audit entry ${row.id}">
                  <button class="btn-icon btn-view" onclick="AuditViewer.showDetail(${row.id})" title="View Details" aria-label="View details for audit entry ${row.id}">
                    <i class="fas fa-eye" aria-hidden="true"></i>
                  </button>
                  <a href="/audit_logs/entity/${row.table_name}/${row.record_id}" class="btn-icon btn-history" title="View Entity History" aria-label="View history for ${self.formatTableName(row.table_name)} record ${row.record_id}">
                    <i class="fas fa-history" aria-hidden="true"></i>
                  </a>
                </div>
              `;
						}
					}
				],
				order: [
					[1, 'desc']
				],
				pageLength: 25,
				responsive: true,
				language: {
					processing: '<i class="fas fa-spinner fa-spin"></i> Loading...',
					emptyTable: 'No audit entries found',
					zeroRecords: 'No matching entries'
				},
				dom: '<"top"l>rt<"bottom"ip>',
				drawCallback: function() {
					// Add click handlers for row expansion on mobile
				}
			});
		},

		initDateRangePicker: function() {
			if (typeof daterangepicker !== 'undefined' || $.fn.daterangepicker) {
				$('#dateRangeFilter').daterangepicker({
					autoUpdateInput: false,
					locale: { cancelLabel: 'Clear' },
					ranges: {
						'Today': [moment(), moment()],
						'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
						'Last 7 Days': [moment().subtract(6, 'days'), moment()],
						'Last 30 Days': [moment().subtract(29, 'days'), moment()],
						'This Month': [moment().startOf('month'), moment().endOf('month')],
						'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
					}
				});

				$('#dateRangeFilter').on('apply.daterangepicker', function(ev, picker) {
					this.value = picker.startDate.format('MMM D, YYYY') + ' - ' + picker.endDate.format('MMM D, YYYY');
				});

				$('#dateRangeFilter').on('cancel.daterangepicker', function() {
					this.value = '';
				});
			}
		},

		// Show detail modal for an audit entry
		showDetail: function(id) {
			const self = this;

			fetch(`/api/audit_logs/${id}`, {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(entry => {
					this.currentEntry = entry;

					// Populate modal
					document.getElementById('modalAuditId').textContent = `#${entry.id}`;
					D.one('#modalTableName').empty().child(
						D.icon('fas ' + (this.tableIcons[entry.table_name] || 'fa-database')),
						D.text(' ' + this.formatTableName(entry.table_name))
					);
					document.getElementById('modalRecordId').textContent = '#' + entry.record_id;
					D.one('#modalOperation').empty().child(this.renderOperationBadge(entry.operation));
					document.getElementById('modalTimestamp').textContent = this.formatDateTime(entry.created_at);
					document.getElementById('modalUser').textContent = entry.username || 'System';
					document.getElementById('modalIp').textContent = entry.ip_address || '-';
					document.getElementById('modalSource').textContent = entry.source || '-';
					document.getElementById('modalDuration').textContent = entry.duration_ms ? `${entry.duration_ms}ms` : '-';
					document.getElementById('modalMethod').textContent = entry.request_method || '-';
					document.getElementById('modalPath').textContent = entry.request_path || '-';
					document.getElementById('modalUserAgent').textContent = entry.user_agent || '-';
					document.getElementById('modalSessionId').textContent = entry.session_id ? entry.session_id.substring(0, 16) + '...' : '-';

					// Render diff
					this.renderDiff(entry.old_values, entry.new_values, 'diffContent');

					// Render changed fields
					this.renderChangedFields(entry.changed_fields);

					// Show modal
					Funky.Modal.show('#auditDetailModal');
				})
				.catch(err => {
					console.error('Failed to load audit entry:', err);
					alert('Failed to load audit entry details');
				});
		},

		renderDiff: function(oldVal, newVal, containerId) {
			var container = document.getElementById(containerId);
			D.wrap(container).empty();

			var diffElement;
			if (this.currentDiffView === 'split') {
				diffElement = this.renderSplitDiff(oldVal, newVal);
			} else if (this.currentDiffView === 'unified') {
				diffElement = this.renderUnifiedDiff(oldVal, newVal);
			} else {
				diffElement = this.renderChangesOnlyDiff(oldVal, newVal);
			}
			diffElement.appendTo(container);
		},

		renderSplitDiff: function(oldVal, newVal) {
			var self = this;
			var allKeys = new Set([
				...Object.keys(oldVal || {}),
				...Object.keys(newVal || {})
			]);

			var oldContent = D.div().classAdd('diff-panel-content');
			var newContent = D.div().classAdd('diff-panel-content');

			allKeys.forEach(function(key) {
				var oldValue = oldVal ? oldVal[key] : undefined;
				var newValue = newVal ? newVal[key] : undefined;
				var changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);

				var oldRow = D.div().classAdd('diff-row');
				if (changed) oldRow.classAdd('diff-changed');
				oldRow.child(
					D.span().classAdd('diff-key').text(key + ':'),
					D.span().classAdd('diff-value').child(self.formatValue(oldValue))
				);
				oldContent.child(oldRow);

				var newRow = D.div().classAdd('diff-row');
				if (changed) newRow.classAdd('diff-changed');
				newRow.child(
					D.span().classAdd('diff-key').text(key + ':'),
					D.span().classAdd('diff-value').child(self.formatValue(newValue))
				);
				newContent.child(newRow);
			});

			return D.div()
				.classAdd('diff-split')
				.attr('role', 'group')
				.aria('label', 'Side-by-side comparison of changes')
				.child(
					D.div().classAdd('diff-panel', 'diff-old').attr('role', 'region').aria('label', 'Previous values').child(
						D.div().classAdd('diff-panel-header').child(
							D.icon('fas fa-minus-circle'),
							D.text(' Before')
						),
						oldContent
					),
					D.div().classAdd('diff-panel', 'diff-new').attr('role', 'region').aria('label', 'New values').child(
						D.div().classAdd('diff-panel-header').child(
							D.icon('fas fa-plus-circle'),
							D.text(' After')
						),
						newContent
					)
				);
		},

		renderUnifiedDiff: function(oldVal, newVal) {
			var self = this;
			var allKeys = new Set([
				...Object.keys(oldVal || {}),
				...Object.keys(newVal || {})
			]);

			var container = D.div()
				.classAdd('diff-unified')
				.attr('role', 'region')
				.aria('label', 'Unified view of changes');

			allKeys.forEach(function(key) {
				var oldValue = oldVal ? oldVal[key] : undefined;
				var newValue = newVal ? newVal[key] : undefined;
				var changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);

				if (changed) {
					if (oldValue !== undefined) {
						container.child(
							D.div().classAdd('diff-line', 'diff-removed').child(
								D.span().classAdd('diff-marker').text('-'),
								D.span().classAdd('diff-key').text(key + ':'),
								D.span().classAdd('diff-value').child(self.formatValue(oldValue))
							)
						);
					}
					if (newValue !== undefined) {
						container.child(
							D.div().classAdd('diff-line', 'diff-added').child(
								D.span().classAdd('diff-marker').text('+'),
								D.span().classAdd('diff-key').text(key + ':'),
								D.span().classAdd('diff-value').child(self.formatValue(newValue))
							)
						);
					}
				} else {
					container.child(
						D.div().classAdd('diff-line').child(
							D.span().classAdd('diff-marker').text(' '),
							D.span().classAdd('diff-key').text(key + ':'),
							D.span().classAdd('diff-value').child(self.formatValue(newValue))
						)
					);
				}
			});

			return container;
		},

		renderChangesOnlyDiff: function(oldVal, newVal) {
			var self = this;
			var changes = [];
			var allKeys = new Set([
				...Object.keys(oldVal || {}),
				...Object.keys(newVal || {})
			]);

			allKeys.forEach(function(key) {
				var oldValue = oldVal ? oldVal[key] : undefined;
				var newValue = newVal ? newVal[key] : undefined;

				if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
					changes.push({ key: key, oldValue: oldValue, newValue: newValue });
				}
			});

			if (changes.length === 0) {
				return D.div().classAdd('no-changes').attr('role', 'status').child(
					D.icon('fas fa-check-circle'),
					D.text(' No changes detected')
				);
			}

			var container = D.div()
				.classAdd('diff-changes-only')
				.attr('role', 'region')
				.aria('label', 'Changed fields only');

			changes.forEach(function(change) {
				container.child(
					D.div().classAdd('change-item').child(
						D.div().classAdd('change-field').text(change.key),
						D.div().classAdd('change-values').child(
							D.div().classAdd('change-old').child(
								D.span().classAdd('change-label').text('From:'),
								D.span().classAdd('change-value').child(self.formatValue(change.oldValue))
							),
							D.div().classAdd('change-arrow').child(D.icon('fas fa-arrow-right')),
							D.div().classAdd('change-new').child(
								D.span().classAdd('change-label').text('To:'),
								D.span().classAdd('change-value').child(self.formatValue(change.newValue))
							)
						)
					)
				);
			});

			return container;
		},

		renderChangedFields: function(fields) {
			var container = document.getElementById('changedFieldsList');
			if (!fields || fields.length === 0) {
				container.replaceChildren(D.span().classAdd('no-fields').text('No specific fields recorded').el);
				return;
			}

			D.wrap(container).empty();
			fields.forEach(function(field) {
				D.span().classAdd('field-badge').text(field).appendTo(container);
			});
		},

		renderTimelineItem: function(entry) {
			var self = this;
			var opColor = this.operationColors[entry.operation] || { bg: '#6b7280' };
			var icon = this.tableIcons[entry.table_name] || 'fa-database';
			var opLabel = this.operationColors[entry.operation]?.label || entry.operation;
			var ariaLabel = opLabel + ' on ' + this.formatTableName(entry.table_name) + ' record ' + entry.record_id +
				' by ' + (entry.username || 'System') + ', ' + this.formatRelativeTime(entry.created_at);

			return D.div()
				.classAdd('timeline-item')
				.on('click', function() { AuditViewer.showDetail(entry.id); })
				.attr('role', 'listitem')
				.attr('tabindex', '0')
				.aria('label', ariaLabel)
				.child(
					D.div()
						.classAdd('timeline-marker')
						.style('background', opColor.bg)
						.aria('hidden', 'true')
						.child(D.icon('fas ' + self.getOperationIcon(entry.operation))),
					D.div().classAdd('timeline-content').child(
						D.div().classAdd('timeline-header').child(
							D.span().classAdd('timeline-table').child(
								D.icon('fas ' + icon),
								D.text(' ' + self.formatTableName(entry.table_name))
							),
							D.span().classAdd('timeline-record').text('#' + entry.record_id)
						),
						D.div().classAdd('timeline-body').child(
							self.renderOperationBadge(entry.operation),
							D.span().classAdd('timeline-user').text(entry.username || 'System')
						),
						D.div().classAdd('timeline-time').text(self.formatRelativeTime(entry.created_at))
					)
				);
		},

		// ==================== ENTITY HISTORY PAGE ====================

		initEntityHistory: function(tableName, recordId) {
			if (!tableName || !recordId || recordId === 'undefined') {
				console.error('Invalid entity history params:', { tableName, recordId });
				var container = document.getElementById('entityTimeline');
				D.wrap(container).empty();
				D.div().classAdd('alert', 'alert-danger').child(
					D.icon('fas fa-exclamation-triangle'),
					D.text(' Error: Invalid table name or record ID')
				).appendTo(container);
				return;
			}
			this.loadEntityHistory(tableName, recordId);
		},

		loadEntityHistory: function(tableName, recordId) {
			fetch(`/api/audit_logs/record/${tableName}/${recordId}`, {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					const history = data.history || [];

					// Update stats
					D.one('#totalChanges').empty().child(
						D.icon('fas fa-edit'),
						D.text(' ' + history.length + ' changes')
					);

					if (history.length > 0) {
						const createEntry = history.find(h => h.operation === 'create');
						const lastEntry = history[history.length - 1];
						const uniqueUsers = new Set(history.map(h => h.user_id)).size;

						document.getElementById('createdBy').textContent = createEntry?.username || 'Unknown';
						D.one('#createdAt').empty().child(
							D.icon('fas fa-plus-circle'),
							D.text(' ' + (createEntry ? this.formatDateTime(createEntry.created_at) : 'Unknown'))
						);
						document.getElementById('updateCount').textContent = history.filter(h => h.operation === 'update').length;
						document.getElementById('uniqueEditors').textContent = uniqueUsers;
						document.getElementById('lastModified').textContent = this.formatRelativeTime(lastEntry.created_at);

						// Render current state
						if (lastEntry.new_values) {
							this.renderCurrentState(lastEntry.new_values);
						}
					}

					// Render timeline
					this.renderEntityTimeline(history);
					this.renderHistoryTable(history);
				})
				.catch(err => {
					console.error('Failed to load entity history:', err);
					document.getElementById('entityTimeline').replaceChildren(
						D.p().class('error').text('Failed to load history').get()
					);
				});
		},

		renderCurrentState: function(state) {
			var self = this;
			var container = document.getElementById('currentStateContent');
			var entries = Object.entries(state);

			var grid = D.div().classAdd('current-state-grid');
			entries.forEach(function(entry) {
				var key = entry[0];
				var value = entry[1];
				grid.child(
					D.div().classAdd('state-item').child(
						D.span().classAdd('state-key').text(self.formatFieldName(key)),
						D.span().classAdd('state-value').child(self.formatValue(value))
					)
				);
			});

			D.wrap(container).empty();
			grid.appendTo(container);
		},

		renderEntityTimeline: function(history) {
			var self = this;
			var container = document.getElementById('entityTimeline');

			if (history.length === 0) {
				container.replaceChildren(D.p().classAdd('no-data').text('No history available').el);
				return;
			}

			var list = D.div().classAdd('entity-timeline-list');

			history.forEach(function(entry, index) {
				var opColor = self.operationColors[entry.operation];
				var isFirst = index === 0;
				var isLast = index === history.length - 1;

				var item = D.div().classAdd('entity-timeline-item');
				if (isFirst) item.classAdd('first');
				if (isLast) item.classAdd('last');

				var connector = D.div().classAdd('timeline-connector').child(
					D.div().classAdd('timeline-dot').style('background', opColor.bg).child(
						D.icon('fas ' + self.getOperationIcon(entry.operation))
					)
				);
				if (!isLast) {
					connector.child(D.div().classAdd('timeline-line'));
				}

				var cardBody = D.div().classAdd('timeline-card-body').child(
					D.div().classAdd('timeline-user-info').child(
						D.icon('fas fa-user'),
						D.span().text(entry.username || 'System')
					)
				);

				if (entry.changed_fields && entry.changed_fields.length > 0) {
					var changesDiv = D.div().classAdd('timeline-changes').child(
						D.span().classAdd('changes-label').text('Changed:')
					);
					entry.changed_fields.slice(0, 4).forEach(function(f) {
						changesDiv.child(D.span().classAdd('change-chip').text(f));
					});
					if (entry.changed_fields.length > 4) {
						changesDiv.child(D.span().classAdd('more-chip').text('+' + (entry.changed_fields.length - 4)));
					}
					cardBody.child(changesDiv);
				}

				var cardFooter = D.div().classAdd('timeline-card-footer').child(
					D.span().classAdd('source-info').child(
						D.icon('fas fa-code'),
						D.text(' ' + entry.source)
					)
				);
				if (entry.duration_ms) {
					cardFooter.child(
						D.span().classAdd('duration-info').child(
							D.icon('fas fa-clock'),
							D.text(' ' + entry.duration_ms + 'ms')
						)
					);
				}

				// Store entry data for click handler
				var card = D.div().classAdd('timeline-card')
					.on('click', (function(e) {
						return function() { AuditViewer.showChangeDetail(e); };
					})(entry))
					.child(
						D.div().classAdd('timeline-card-header').child(
							self.renderOperationBadge(entry.operation),
							D.span().classAdd('timeline-timestamp').text(self.formatDateTime(entry.created_at))
						),
						cardBody,
						cardFooter
					);

				item.child(connector, card);
				list.child(item);
			});

			D.wrap(container).empty();
			list.appendTo(container);
		},

		renderHistoryTable: function(history) {
			var self = this;
			var tbody = document.getElementById('historyTableBody');

			D.wrap(tbody).empty();
			history.forEach(function(entry) {
				var row = D.tr().child(
					D.td().text(self.formatDateTime(entry.created_at)),
					D.td().child(self.renderOperationBadge(entry.operation)),
					D.td().text(entry.username || 'System'),
					D.td().text(entry.changed_fields ? entry.changed_fields.join(', ') : '-'),
					D.td().text(entry.source),
					D.td().child(
						D.button().classAdd('btn-icon', 'btn-view')
							.on('click', (function(e) {
								return function() { AuditViewer.showChangeDetail(e); };
							})(entry))
							.child(D.icon('fas fa-eye'))
					)
				);
				row.appendTo(tbody);
			});
		},

		showChangeDetail: function(entry) {
			if (typeof entry === 'string') {
				entry = JSON.parse(entry);
			}

			this.currentEntry = entry;

			var metaRow = document.getElementById('changeMetaRow');
			D.wrap(metaRow).empty();

			D.div().classAdd('meta-item').child(
				D.span().classAdd('meta-label').text('Operation'),
				this.renderOperationBadge(entry.operation)
			).appendTo(metaRow);

			D.div().classAdd('meta-item').child(
				D.span().classAdd('meta-label').text('Timestamp'),
				D.span().classAdd('meta-value').text(this.formatDateTime(entry.created_at))
			).appendTo(metaRow);

			D.div().classAdd('meta-item').child(
				D.span().classAdd('meta-label').text('User'),
				D.span().classAdd('meta-value').text(entry.username || 'System')
			).appendTo(metaRow);

			D.div().classAdd('meta-item').child(
				D.span().classAdd('meta-label').text('Source'),
				D.span().classAdd('meta-value').text(entry.source)
			).appendTo(metaRow);

			this.renderDiff(entry.old_values, entry.new_values, 'modalDiffContent');

			Funky.Modal.show('#changeDetailModal');
		},

		// ==================== USER ACTIVITY PAGE ====================

		initUserActivity: function(userId) {
			this.userId = userId;
			this.loadUserInfo(userId);
			this.loadUserActivity();
		},

		loadUserInfo: function(userId) {
			fetch(`/api/users/${userId}`, {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(user => {
					document.getElementById('userName').textContent = user.username || user.email;
					document.getElementById('breadcrumbUsername').textContent = user.username || user.email;
					D.one('#userEmail').empty().child(
						D.icon('fas fa-envelope'),
						D.text(' ' + (user.email || ''))
					);
					D.one('#userRole').empty().child(
						D.icon('fas fa-shield-alt'),
						D.text(' ' + (user.role || 'User'))
					);
					D.one('#userJoined').empty().child(
						D.icon('fas fa-calendar'),
						D.text(' Joined ' + this.formatDate(user.created_at))
					);

					// Set avatar initials
					const initials = (user.username || user.email || 'U').substring(0, 2).toUpperCase();
					document.getElementById('userAvatarLarge').textContent = initials;
				})
				.catch(err => console.error('Failed to load user:', err));
		},

		loadUserActivity: function() {
			const days = document.getElementById('activityDays')?.value || 30;

			fetch(`/api/audit_logs/user/${this.userId}?days=${days}`, {
					credentials: 'include'
				})
				.then(r => r.json())
				.then(data => {
					const summary = data.summary || [];
					const recent = data.recent_actions || [];

					// Calculate totals
					let total = 0,
						creates = 0,
						updates = 0,
						deletes = 0;
					const tableStats = {};

					summary.forEach(s => {
						total += s.action_count;
						if (s.operation === 'create') creates += s.action_count;
						if (s.operation === 'update') updates += s.action_count;
						if (s.operation === 'delete') deletes += s.action_count;

						if (!tableStats[s.table_name]) tableStats[s.table_name] = 0;
						tableStats[s.table_name] += s.action_count;
					});

					// Update stats
					document.getElementById('totalActions').textContent = Funky.Util.abbreviateNumber(total);
					document.getElementById('createActions').textContent = Funky.Util.abbreviateNumber(creates);
					document.getElementById('updateActions').textContent = Funky.Util.abbreviateNumber(updates);
					document.getElementById('deleteActions').textContent = Funky.Util.abbreviateNumber(deletes);

					// Render charts
					this.renderTableActivityChart(tableStats);
					this.renderOperationBreakdown(creates, updates, deletes);
					this.renderActivityHeatmap(recent);
					this.renderUserActivityTable(recent);
					this.renderMostModifiedRecords(recent);
				})
				.catch(err => {
					console.error('Failed to load user activity:', err);
				});
		},

		renderTableActivityChart: function(tableStats) {
			var self = this;
			var container = document.getElementById('tableActivityChart');
			var entries = Object.entries(tableStats).sort(function(a, b) { return b[1] - a[1]; });

			if (entries.length === 0) {
				container.replaceChildren(D.p().classAdd('no-data').text('No activity').el);
				return;
			}

			var maxCount = entries[0][1];

			D.wrap(container).empty();
			entries.forEach(function(entry) {
				var table = entry[0];
				var count = entry[1];
				D.div().classAdd('activity-bar-row').child(
					D.div().classAdd('activity-bar-label').child(
						D.icon('fas ' + (self.tableIcons[table] || 'fa-database')),
						D.span().text(self.formatTableName(table))
					),
					D.div().classAdd('activity-bar-track').child(
						D.div().classAdd('activity-bar-fill').style('width', ((count / maxCount) * 100) + '%')
					),
					D.div().classAdd('activity-bar-value').text(count)
				).appendTo(container);
			});
		},

		renderOperationBreakdown: function(creates, updates, deletes) {
			var container = document.getElementById('operationBreakdown');
			var total = creates + updates + deletes || 1;

			// Build SVG as HTML string (SVG elements don't work well with DOM API)
			var svgHtml = '<svg viewBox="0 0 100 100" class="donut-chart">' +
				this.renderDonutSegment(0, (creates / total) * 100, '#10b981') +
				this.renderDonutSegment((creates / total) * 100, (updates / total) * 100, '#f59e0b') +
				this.renderDonutSegment(((creates + updates) / total) * 100, (deletes / total) * 100, '#ef4444') +
				'</svg>';

			var donutDiv = D.div().classAdd('operation-donut');
			donutDiv.html(svgHtml);
			donutDiv.child(
				D.div().classAdd('donut-center').child(
					D.span().classAdd('donut-total').text(total),
					D.span().classAdd('donut-label').text('Total')
				)
			);

			function createLegendItem(color, label, value) {
				return D.div().classAdd('legend-item').child(
					D.span().classAdd('legend-color').style('background', color),
					D.span().classAdd('legend-label').text(label),
					D.span().classAdd('legend-value').text(value)
				);
			}

			var legend = D.div().classAdd('operation-legend').child(
				createLegendItem('#10b981', 'Creates', creates),
				createLegendItem('#f59e0b', 'Updates', updates),
				createLegendItem('#ef4444', 'Deletes', deletes)
			);

			D.wrap(container).empty();
			donutDiv.appendTo(container);
			legend.appendTo(container);
		},

		renderDonutSegment: function(startPercent, percent, color) {
			if (percent === 0) return '';

			const radius = 40;
			const circumference = 2 * Math.PI * radius;
			const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
			const rotation = (startPercent / 100) * 360 - 90;

			return `
        <circle
          cx="50" cy="50" r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="15"
          stroke-dasharray="${strokeDasharray}"
          transform="rotate(${rotation} 50 50)"
        />
      `;
		},

		renderActivityHeatmap: function(activities) {
			var container = document.getElementById('activityHeatmap');

			// Group by day and hour
			var hourlyData = {};
			activities.forEach(function(a) {
				var date = new Date(a.created_at);
				var day = date.getDay();
				var hour = date.getHours();
				var key = day + '-' + hour;
				hourlyData[key] = (hourlyData[key] || 0) + 1;
			});

			var maxCount = Math.max.apply(Math, Object.values(hourlyData).concat([1]));
			var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

			var grid = D.div().classAdd('heatmap-grid');

			// Hour labels header row
			var headerRow = D.div().classAdd('heatmap-row', 'heatmap-header').child(
				D.div().classAdd('heatmap-label')
			);
			for (var h = 0; h < 24; h += 3) {
				headerRow.child(D.div().classAdd('heatmap-hour-label').text(h + ':00'));
			}
			grid.child(headerRow);

			// Day rows
			days.forEach(function(day, dayIndex) {
				var dayRow = D.div().classAdd('heatmap-row').child(
					D.div().classAdd('heatmap-label').text(day)
				);
				for (var hour = 0; hour < 24; hour++) {
					var count = hourlyData[dayIndex + '-' + hour] || 0;
					var intensity = count / maxCount;
					dayRow.child(
						D.div().classAdd('heatmap-cell')
							.style('opacity', 0.2 + intensity * 0.8)
							.style('background', count > 0 ? '#ff6600' : '#2d3748')
							.attr('title', day + ' ' + hour + ':00 - ' + count + ' actions')
					);
				}
				grid.child(dayRow);
			});

			D.wrap(container).empty();
			grid.appendTo(container);
		},

		renderUserActivityTable: function(activities) {
			var self = this;
			var tbody = document.getElementById('userActivityBody');

			D.wrap(tbody).empty();
			if (activities.length === 0) {
				D.tr().child(
					D.td().attr('colspan', '7').classAdd('text-center').text('No recent activity')
				).appendTo(tbody);
				return;
			}

			activities.forEach(function(a) {
				var row = D.tr().child(
					D.td().text(self.formatDateTime(a.created_at)),
					D.td().child(
						D.span().classAdd('table-badge').child(
							D.icon('fas ' + (self.tableIcons[a.table_name] || 'fa-database')),
							D.text(' ' + self.formatTableName(a.table_name))
						)
					),
					D.td().child(
						D.a().attr('href', '/audit_logs/entity/' + a.table_name + '/' + a.record_id)
							.classAdd('record-link').text('#' + a.record_id)
					),
					D.td().child(self.renderOperationBadge(a.operation)),
					D.td().text(a.changed_fields ? a.changed_fields.slice(0, 3).join(', ') : '-'),
					D.td().text(a.source),
					D.td().child(
						D.button().classAdd('btn-icon', 'btn-view')
							.on('click', (function(entry) {
								return function() { AuditViewer.showChangeDetail(entry); };
							})(a))
							.child(D.icon('fas fa-eye'))
					)
				);
				row.appendTo(tbody);
			});
		},

		renderMostModifiedRecords: function(activities) {
			var self = this;
			var container = document.getElementById('mostModifiedRecords');

			// Count modifications per record
			var recordCounts = {};
			activities.forEach(function(a) {
				var key = a.table_name + ':' + a.record_id;
				if (!recordCounts[key]) {
					recordCounts[key] = { table: a.table_name, id: a.record_id, count: 0 };
				}
				recordCounts[key].count++;
			});

			var sorted = Object.values(recordCounts)
				.sort(function(a, b) { return b.count - a.count; })
				.slice(0, 6);

			D.wrap(container).empty();
			if (sorted.length === 0) {
				D.p().classAdd('no-data').text('No modified records').appendTo(container);
				return;
			}

			sorted.forEach(function(r) {
				D.a().attr('href', '/audit_logs/entity/' + r.table + '/' + r.id)
					.classAdd('most-modified-card')
					.child(
						D.div().classAdd('modified-icon').child(
							D.icon('fas ' + (self.tableIcons[r.table] || 'fa-database'))
						),
						D.div().classAdd('modified-info').child(
							D.span().classAdd('modified-table').text(self.formatTableName(r.table)),
							D.span().classAdd('modified-id').text('#' + r.id)
						),
						D.div().classAdd('modified-count').text(r.count + ' edits')
					).appendTo(container);
			});
		},

		// ==================== UTILITY FUNCTIONS ====================

		formatDateTime: function(dateStr) {
			if (!dateStr) return '-';
			if (Funky.Timezone) {
				return window.Funky.Timezone.renderDate(dateStr);
			}
			const date = new Date(dateStr);
			return date.toLocaleString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		},

		formatDate: function(dateStr) {
			if (!dateStr) return '-';
			if (Funky.Timezone) {
				return window.Funky.Timezone.renderDate(dateStr, { dateOnly: true });
			}
			const date = new Date(dateStr);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		},

		formatRelativeTime: function(dateStr) {
			if (!dateStr) return '-';
			const date = new Date(dateStr);
			const now = new Date();
			const diff = now - date;

			const minutes = Math.floor(diff / 60000);
			const hours = Math.floor(diff / 3600000);
			const days = Math.floor(diff / 86400000);

			if (minutes < 1) return 'Just now';
			if (minutes < 60) return `${minutes}m ago`;
			if (hours < 24) return `${hours}h ago`;
			if (days < 30) return `${days}d ago`;
			return this.formatDate(dateStr);
		},

		formatTableName: function(name) {
			if (!name) return '-';
			return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
		},

		formatFieldName: function(name) {
			if (!name) return '-';
			return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
		},

		formatValue: function(value) {
			if (value === undefined) return D.span().classAdd('value-undefined').text('undefined');
			if (value === null) return D.span().classAdd('value-null').text('null');
			if (typeof value === 'boolean') return D.span().classAdd('value-bool').text(String(value));
			if (typeof value === 'number') return D.span().classAdd('value-number').text(String(value));
			if (typeof value === 'object') return D.span().classAdd('value-object').text(JSON.stringify(value));
			if (typeof value === 'string' && value.length > 100) {
				return D.span().classAdd('value-string').text('"' + value.substring(0, 100) + '..."');
			}
			return D.span().classAdd('value-string').text('"' + value + '"');
		},

		renderOperationBadge: function(operation) {
			var colors = this.operationColors[operation] || { bg: '#6b7280', label: operation };
			return D.span()
				.classAdd('operation-badge', 'operation-' + operation)
				.style('background', colors.bg)
				.attr('role', 'status')
				.aria('label', colors.label + ' operation')
				.text(colors.label);
		},

		getOperationIcon: function(operation) {
			const icons = { create: 'fa-plus', update: 'fa-edit', delete: 'fa-trash' };
			return icons[operation] || 'fa-question';
		},

		filterByTable: function(tableName) {
			document.getElementById('tableFilter').value = tableName;
			this.applyFilters();
			this.scrollToTable();
		},

		scrollToTable: function() {
			document.getElementById('auditTable').scrollIntoView({ behavior: 'smooth' });
		},

		setDiffView: function(view) {
			this.currentDiffView = view;
			document.querySelectorAll('.diff-toggle').forEach(btn => {
				btn.classList.toggle('active', btn.dataset.view === view);
			});
			if (this.currentEntry) {
				const containerId = document.getElementById('diffContent') ? 'diffContent' : 'modalDiffContent';
				this.renderDiff(this.currentEntry.old_values, this.currentEntry.new_values, containerId);
			}
		},

		setTimelineView: function(view) {
			document.querySelectorAll('.timeline-toggle').forEach(btn => {
				btn.classList.toggle('active', btn.dataset.view === view);
			});
			document.getElementById('entityTimeline').style.display = view === 'timeline' ? 'block' : 'none';
			document.getElementById('entityTableView').style.display = view === 'table' ? 'block' : 'none';
		},

		toggleStateView: function(view) {
			document.querySelectorAll('.toggle-btn').forEach(btn => {
				btn.classList.toggle('active', btn.textContent.toLowerCase().includes(view));
			});
			// Toggle between formatted and raw JSON view
			var container = document.getElementById('currentStateContent');
			if (view === 'raw' && this.currentEntry?.new_values) {
				D.wrap(container).empty().child(
					D.create('pre').classAdd('raw-json').text(JSON.stringify(this.currentEntry.new_values, null, 2))
				);
			}
		},

		viewEntityHistory: function() {
			if (this.currentEntry) {
				window.location.href = `/audit_logs/entity/${this.currentEntry.table_name}/${this.currentEntry.record_id}`;
			}
		},

		viewUserActivity: function() {
			if (this.currentEntry && this.currentEntry.user_id) {
				window.location.href = `/audit_logs/user/${this.currentEntry.user_id}`;
			}
		},

		exportHistory: function() {
			// Export current entity history as JSON
			const url = window.location.pathname.replace('/audit_logs/entity/', '/api/audit_logs/record/');
			window.open(url, '_blank');
		},

		// ==================== BINDABLE INTERFACE ====================

		/**
		 * Set audit entries data (Bindable Interface)
		 * Replaces all existing entries and re-renders
		 * @param {Array|Object} data - Audit entries array or { records: [] }
		 */
		setData: function(data) {
			const entries = Array.isArray(data) ? data : (data && data.records ? data.records : []);
			this._data = entries;

			// Update DataTable if initialized
			if (this.auditTable) {
				this.auditTable.clear();
				if (entries.length > 0) {
					this.auditTable.rows.add(entries);
				}
				this.auditTable.draw();
			}

			// Update timeline if present
			var timeline = document.getElementById('recent-timeline');
			if (timeline) {
				D.wrap(timeline).empty();
				if (entries.length === 0) {
					D.p().classAdd('no-data').text('No recent activity').appendTo(timeline);
				} else {
					var self = this;
					entries.slice(0, 10).forEach(function(entry) {
						self.renderTimelineItem(entry).appendTo(timeline);
					});
				}
			}
		},

		/**
		 * Add audit entries (Bindable Interface - streaming support)
		 * Appends entries to existing data
		 * @param {Array|Object} data - Audit entry or entries to append
		 */
		addData: function(data) {
			var self = this;
			var entries = Array.isArray(data) ? data : [data];
			this._data = (this._data || []).concat(entries);

			// Add to DataTable if initialized
			if (this.auditTable && entries.length > 0) {
				this.auditTable.rows.add(entries);
				this.auditTable.draw();
			}

			// Prepend to timeline if present (newest first)
			var timeline = document.getElementById('recent-timeline');
			if (timeline) {
				var noData = timeline.querySelector('.no-data');
				if (noData) {
					D.wrap(timeline).empty();
				}
				// Prepend new items in reverse order (so newest appears first)
				entries.slice().reverse().forEach(function(entry) {
					var item = self.renderTimelineItem(entry);
					if (timeline.firstChild) {
						timeline.insertBefore(item.el, timeline.firstChild);
					} else {
						item.appendTo(timeline);
					}
				});

				// Limit timeline items to 10
				var items = timeline.querySelectorAll('.timeline-item');
				for (var i = 10; i < items.length; i++) {
					items[i].remove();
				}
			}
		},

		/**
		 * Get current audit data (Bindable Interface)
		 * @returns {Array} Current audit entries
		 */
		getData: function() {
			return this._data || [];
		},

		/**
		 * Clear all audit data (Bindable Interface)
		 */
		clearData: function() {
			this._data = [];

			if (this.auditTable) {
				this.auditTable.clear().draw();
			}

			var timeline = document.getElementById('recent-timeline');
			if (timeline) {
				D.wrap(timeline).empty();
				D.p().classAdd('no-data').text('No recent activity').appendTo(timeline);
			}
		},

		/**
		 * Destroy the AuditViewer instance
		 * Cleans up resources and removes from instance registry
		 */
		destroy: function() {
			// Destroy DataTable
			if (this.auditTable) {
				this.auditTable.destroy();
				this.auditTable = null;
			}

			// Clear data
			this._data = [];
			this.currentEntry = null;

			// Remove from instance registry
			if (this._containerId && AuditViewer._instances[this._containerId]) {
				delete AuditViewer._instances[this._containerId];
			}
		}
	};

	// Global filter functions
	window.applyFilters = function() {
		if (AuditViewer.auditTable) {
			AuditViewer.auditTable.ajax.reload();
		}
	};

	window.resetFilters = function() {
		document.getElementById('tableFilter').value = '';
		document.getElementById('operationFilter').value = '';
		document.getElementById('userFilter').value = '';
		document.getElementById('sourceFilter').value = '';
		document.getElementById('dateRangeFilter').value = '';
		if (AuditViewer.auditTable) {
			AuditViewer.auditTable.ajax.reload();
		}
	};

	window.setDiffView = function(view) {
		AuditViewer.setDiffView(view);
	};

	window.setTimelineView = function(view) {
		AuditViewer.setTimelineView(view);
	};

	window.toggleStateView = function(view) {
		AuditViewer.toggleStateView(view);
	};

	window.scrollToTable = function() {
		AuditViewer.scrollToTable();
	};

	window.viewEntityHistory = function() {
		AuditViewer.viewEntityHistory();
	};

	window.viewUserActivity = function() {
		AuditViewer.viewUserActivity();
	};

	window.exportHistory = function() {
		AuditViewer.exportHistory();
	};

	window.loadUserActivity = function() {
		AuditViewer.loadUserActivity();
	};

	// Static getInstance method
	AuditViewer.getInstance = function(containerId) {
		return AuditViewer._instances[containerId] || null;
	};

	// Static destroyAll method
	AuditViewer.destroyAll = function() {
		var ids = Object.keys(AuditViewer._instances);
		ids.forEach(function(id) {
			var instance = AuditViewer._instances[id];
			if (instance && instance.destroy) {
				instance.destroy();
			}
		});
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('AuditViewer', AuditViewer);
	}

})();
