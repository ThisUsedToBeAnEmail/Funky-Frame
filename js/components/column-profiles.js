/**
 * FunkyColumnProfiles - Column visibility profile management
 * Save/load column visibility configurations for Funky.Table
 * @module Funky.ColumnProfiles
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register || !window.Funky.Registry) {
		console.error('[Funky.ColumnProfiles] Registry not found. Load namespace.js and registry.js first.');
		return;
	}

	// Registry guard - prevent double registration
	if (Funky.isRegistered && Funky.isRegistered('ColumnProfiles')) {
		return;
	}

	// Verify Registry.createInstanceRegistry exists
	if (!Funky.Registry.createInstanceRegistry) {
		console.error('[Funky.ColumnProfiles] Registry.createInstanceRegistry not available. Load registry.js first.');
		return;
	}

	var STORAGE_KEY = 'column_profiles';

	// Bindable Interface: Instance registry by tableId
	var _instances = Funky.Registry.createInstanceRegistry('ColumnProfiles');

	// Verify instance registry was created
	if (!_instances || typeof _instances.register !== 'function') {
		console.error('[Funky.ColumnProfiles] Failed to create instance registry');
		return;
	}

	/**
	 * FunkyColumnProfiles Constructor
	 * Manages saved column visibility profiles for Funky.Table
	 * @param {string|Object} tableIdOrInstance - ID of the table or Funky.Table instance
	 */
	function FunkyColumnProfiles(tableIdOrInstance) {
		// Support passing table instance directly
		if (typeof tableIdOrInstance === 'object' && tableIdOrInstance.columns) {
			this.table = tableIdOrInstance;
			this.tableId = tableIdOrInstance.config && tableIdOrInstance.config.tableName ? 
				tableIdOrInstance.config.tableName : 
				(tableIdOrInstance.id || 'table');
		} else {
			this.tableId = tableIdOrInstance;
			this.table = null;
		}
		
		this.modalId = 'columnProfileModal-' + this.tableId;
		this.activeProfile = null;

		// Register in instance registry
		if (this.tableId) {
			_instances.register(this.tableId, this);
		}

		this.init();
	}

	/**
	 * Initialize the column profiles manager
	 */
	FunkyColumnProfiles.prototype.init = function() {
		var self = this;

		// If table already passed, just load profile
		if (this.table) {
			this.loadActiveProfile();
			return;
		}

		// Try to find Funky.Table instance
		var tryInit = function(attempts) {
			var ft = (window.Funky && Funky.Table && Funky.Table.getInstance) ? 
				Funky.Table.getInstance(self.tableId) : null;
			
			if (ft && ft.columns) {
				self.table = ft;
				self.loadActiveProfile();
			} else if (attempts > 0) {
				setTimeout(function() { tryInit(attempts - 1); }, 200);
			} else {
				console.warn('FunkyColumnProfiles: Funky.Table instance not found for', self.tableId);
			}
		};
		tryInit(10);
	};

	/**
	 * Get all saved profiles from storage
	 * @returns {Object} All profiles
	 */
	FunkyColumnProfiles.prototype.getAllProfiles = function() {
		try {
			return Funky.Storage.get(STORAGE_KEY, {});
		} catch (e) {
			console.warn('FunkyColumnProfiles: Error reading profiles', e);
			return {};
		}
	};

	/**
	 * Save all profiles to storage
	 * @param {Object} profiles - All profiles to save
	 */
	FunkyColumnProfiles.prototype.saveAllProfiles = function(profiles) {
		try {
			Funky.Storage.set(STORAGE_KEY, profiles);
		} catch (e) {
			console.warn('FunkyColumnProfiles: Error saving profiles', e);
		}
	};

	/**
	 * List all profiles for this table
	 * @returns {Array} Array of profile objects
	 */
	FunkyColumnProfiles.prototype.listProfiles = function() {
		var profiles = this.getAllProfiles();
		var tableProfiles = profiles[this.tableId] || {};
		return Object.keys(tableProfiles).map(function(name) {
			var cols = tableProfiles[name].columns;
			var visibleCount = 0;
			if (Array.isArray(cols)) {
				visibleCount = cols.filter(function(c) { 
					return typeof c === 'object' ? c.visible : c; 
				}).length;
			}
			return {
				name: name,
				columns: cols,
				columnCount: visibleCount,
				createdAt: tableProfiles[name].createdAt
			};
		});
	};

	/**
	 * Save current column visibility as a profile
	 * @param {string} name - Profile name
	 * @returns {boolean} Success status
	 */
	FunkyColumnProfiles.prototype.saveProfile = function(name) {
		if (!this.table || !name) return false;

		var columns = [];
		var cols = this.table.columns;
		for (var i = 0; i < cols.length; i++) {
			// Skip control column
			if (cols[i].name === '_control') continue;
			columns.push({
				data: cols[i].data,
				visible: cols[i].visible !== false
			});
		}

		var profiles = this.getAllProfiles();
		if (!profiles[this.tableId]) profiles[this.tableId] = {};

		profiles[this.tableId][name] = {
			columns: columns,
			createdAt: new Date().toISOString()
		};

		this.saveAllProfiles(profiles);
		this.setActiveProfile(name);

		return true;
	};

	/**
	 * Load a saved profile
	 * @param {string} name - Profile name
	 * @returns {boolean} Success status
	 */
	FunkyColumnProfiles.prototype.loadProfile = function(name) {
		if (!this.table) return false;

		var profiles = this.getAllProfiles();
		var tableProfiles = profiles[this.tableId] || {};
		var profile = tableProfiles[name];

		if (!profile) return false;

		var self = this;
		var cols = this.table.columns;
		
		// Apply visibility to each column by data name
		profile.columns.forEach(function(savedCol) {
			// Find matching column by data name
			for (var i = 0; i < cols.length; i++) {
				if (cols[i].data === savedCol.data) {
					// Use Funky.Table's column visibility API
					if (self.table.columnVisible) {
						self.table.columnVisible(i, savedCol.visible);
					} else {
						// Fallback: directly set and trigger update
						cols[i].visible = savedCol.visible;
						if (self.table._toggleColumnVisibility) {
							self.table._toggleColumnVisibility(i, savedCol.visible);
						}
					}
					break;
				}
			}
		});

		this.setActiveProfile(name);

		return true;
	};

	/**
	 * Delete a saved profile
	 * @param {string} name - Profile name
	 * @returns {boolean} Success status
	 */
	FunkyColumnProfiles.prototype.deleteProfile = function(name) {
		var profiles = this.getAllProfiles();
		if (profiles[this.tableId] && profiles[this.tableId][name]) {
			delete profiles[this.tableId][name];
			this.saveAllProfiles(profiles);

			if (this.activeProfile === name) {
				this.activeProfile = null;
				this.saveActiveProfileName(null);
			}
			return true;
		}
		return false;
	};

	/**
	 * Get the currently active profile name
	 * @returns {string|null} Active profile name
	 */
	FunkyColumnProfiles.prototype.getActiveProfile = function() {
		return this.activeProfile;
	};

	/**
	 * Set the active profile
	 * @param {string} name - Profile name
	 */
	FunkyColumnProfiles.prototype.setActiveProfile = function(name) {
		this.activeProfile = name;
		this.saveActiveProfileName(name);
	};

	/**
	 * Save active profile name to storage
	 * @param {string} name - Profile name
	 */
	FunkyColumnProfiles.prototype.saveActiveProfileName = function(name) {
		try {
			var key = 'column_profile_active_' + this.tableId;
			if (name) {
				Funky.Storage.setRaw(key, name);
			} else {
				Funky.Storage.remove(key);
			}
		} catch (e) {}
	};

	/**
	 * Load the last active profile
	 */
	FunkyColumnProfiles.prototype.loadActiveProfile = function() {
		try {
			var key = 'column_profile_active_' + this.tableId;
			var name = Funky.Storage.getRaw(key, null);
			if (name) {
				this.loadProfile(name);
			}
		} catch (e) {}
	};

	/**
	 * Show the column profiles modal
	 */
	FunkyColumnProfiles.prototype.showModal = function() {
		var self = this;
		var existingModal = document.getElementById(this.modalId);
		if (existingModal) {
			// Dispose the cached modal instance before removing DOM
			var existingInstance = Funky.Modal.getInstance(existingModal);
			if (existingInstance) {
				existingInstance.dispose();
			}
			existingModal.remove();
		}

		var profiles = this.listProfiles();
		var profilesHtml = '';

		if (profiles.length === 0) {
			profilesHtml = '<div class="profile-list-empty" role="status">' +
				'<div class="profile-list-empty-icon" aria-hidden="true">📋</div>' +
				'<p>No saved profiles yet.<br>Save your current column setup below.</p>' +
				'</div>';
		} else {
			profilesHtml = '<div class="profile-list" role="listbox" aria-label="Saved column profiles">';
			profiles.forEach(function(p) {
				var isActive = p.name === self.activeProfile;
				var escapedName = Funky.Util.escapeHtml(p.name);
				profilesHtml += '<div class="profile-item' + (isActive ? ' active' : '') + '" data-name="' + escapedName + '" role="option" aria-selected="' + isActive + '" tabindex="0">' +
					'<div class="profile-item-info">' +
					'<span class="profile-item-icon" aria-hidden="true">' + (isActive ? '✓' : '📋') + '</span>' +
					'<span class="profile-item-name">' + escapedName + '</span>' +
					'<span class="profile-item-meta">' + p.columnCount + ' columns</span>' +
					'</div>' +
					'<div class="profile-item-actions">' +
					'<button type="button" class="load-profile-btn" title="Load profile ' + escapedName + '" aria-label="Load profile ' + escapedName + '">📥</button>' +
					'<button type="button" class="delete-btn" title="Delete profile ' + escapedName + '" aria-label="Delete profile ' + escapedName + '">🗑️</button>' +
					'</div>' +
					'</div>';
			});
			profilesHtml += '</div>';
		}

		var modalHtml = '<div class="modal fade modal-slide-panel column-profile-modal" id="' + this.modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + this.modalId + '-title">' +
			'<div class="modal-dialog" role="document">' +
			'<div class="modal-content">' +
			'<div class="modal-header">' +
			'<h5 class="modal-title" id="' + this.modalId + '-title"><span aria-hidden="true">📋</span> Column Profiles</h5>' +
			'<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
			'</div>' +
			'<div class="modal-body">' +
			profilesHtml +
			'<div class="profile-save-form">' +
			'<label for="newProfileName-' + this.tableId + '" class="visually-hidden">New profile name</label>' +
			'<input type="text" id="newProfileName-' + this.tableId + '" placeholder="New profile name..." aria-label="New profile name">' +
			'<button type="button" id="saveProfileBtn-' + this.tableId + '" aria-label="Save current column configuration as new profile"><span aria-hidden="true">💾</span> Save Current</button>' +
			'</div>' +
			'</div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn btn-secondary" data-funky-modal-close>Close</button>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		document.body.insertAdjacentHTML('beforeend', modalHtml);

		var modalEl = document.getElementById(this.modalId);
		var modal = Funky.Modal.getOrCreateInstance(modalEl);

		// Bind close buttons
		modalEl.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
			btn.addEventListener('click', function() {
				modal.hide();
			});
		});

		// Bind events

		modalEl.querySelectorAll('.load-profile-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				var name = this.closest('.profile-item').dataset.name;
				self.loadProfile(name);
				modal.hide();
			});
		});

		modalEl.querySelectorAll('.delete-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				var item = this.closest('.profile-item');
				var name = item.dataset.name;
				if (confirm('Delete profile "' + name + '"?')) {
					self.deleteProfile(name);
					item.remove();
				}
			});
		});

		modalEl.querySelectorAll('.profile-item').forEach(function(item) {
			item.addEventListener('click', function() {
				var name = this.dataset.name;
				self.loadProfile(name);
				modal.hide();
				if (Funky.Announce) {
					Funky.Announce.polite('Profile ' + name + ' loaded');
				}
			});
			// Keyboard support for profile items
			item.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					var name = this.dataset.name;
					self.loadProfile(name);
					modal.hide();
					if (Funky.Announce) {
						Funky.Announce.polite('Profile ' + name + ' loaded');
					}
				}
			});
		});

		document.getElementById('saveProfileBtn-' + this.tableId).addEventListener('click', function() {
			var input = document.getElementById('newProfileName-' + self.tableId);
			var name = input.value.trim();
			if (name) {
				self.saveProfile(name);
				modal.hide();
			} else {
				input.focus();
			}
		});

		document.getElementById('newProfileName-' + this.tableId).addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				document.getElementById('saveProfileBtn-' + self.tableId).click();
			}
		});

		modal.show();
	};

	/**
	 * Set profiles data (Bindable Interface)
	 * @param {Object} profiles - Profiles object with profile name as key
	 */
	FunkyColumnProfiles.prototype.setData = function(profiles) {
		if (!profiles || typeof profiles !== 'object') {
			console.warn('[FunkyColumnProfiles] setData expects an object');
			return;
		}

		var allProfiles = this.getAllProfiles();
		allProfiles[this.tableId] = profiles;
		this.saveAllProfiles(allProfiles);

		// If active profile no longer exists, clear it
		if (this.activeProfile && !profiles[this.activeProfile]) {
			this.activeProfile = null;
			this.saveActiveProfileName(null);
		}
	};

	/**
	 * Get profiles data (Bindable Interface)
	 * @returns {Object} - All profiles for this table
	 */
	FunkyColumnProfiles.prototype.getData = function() {
		var profiles = this.getAllProfiles();
		return profiles[this.tableId] || {};
	};

	/**
	 * Create a button to open the profiles modal
	 * @returns {HTMLElement} Button element
	 */
	FunkyColumnProfiles.prototype.createButton = function() {
		var self = this;
		var D = Funky.Dom;
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'btn-funky btn-funky-secondary btn-sm';
		btn.append(D.span().aria('hidden', 'true').text('📋').el, ' Profiles');
		btn.title = 'Column Profiles';
		btn.setAttribute('aria-label', 'Manage column profiles');
		btn.addEventListener('click', function() {
			self.showModal();
		});
		return btn;
	};

	// Bindable Interface: Static methods
	/**
	 * Get ColumnProfiles instance by table ID (Bindable Interface)
	 * @param {string} tableId - Table element ID
	 * @returns {FunkyColumnProfiles|undefined}
	 */
	FunkyColumnProfiles.getInstance = function(tableId) {
		return _instances.get(tableId);
	};

	/**
	 * Set profiles data by table ID (Bindable Interface)
	 * @param {string} tableId - Table element ID
	 * @param {Object} profiles - Profiles data
	 * @returns {boolean} - True if successful
	 */
	FunkyColumnProfiles.setData = function(tableId, profiles) {
		var instance = _instances.get(tableId);
		if (!instance) {
			console.warn('[Funky.ColumnProfiles] setData: Instance not found:', tableId);
			return false;
		}
		instance.setData(profiles);
		return true;
	};

	/**
	 * Get profiles data by table ID (Bindable Interface)
	 * @param {string} tableId - Table element ID
	 * @returns {Object|null} - Profiles data or null
	 */
	FunkyColumnProfiles.getData = function(tableId) {
		var instance = _instances.get(tableId);
		if (!instance) {
			return null;
		}
		return instance.getData();
	};

	// Bindable Interface: Instance registry
	FunkyColumnProfiles._instances = _instances;

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('ColumnProfiles', FunkyColumnProfiles);
	}

})(window);
