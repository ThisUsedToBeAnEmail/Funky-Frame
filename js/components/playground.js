/**
 * Funky.Playground - Component Testing Environment
 * Provides isolated rendering, props editing, and event logging for components
 * @module Funky.Playground
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Guard against double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('Playground')) {
		return;
	}

	// Module-level reference to Funky.Dom
	var D = Funky.Dom;

	/**
	 * Available components registry
	 * Each entry defines: name, icon, defaultProps, propsSchema
	 */
	var COMPONENTS = {
		Toast: {
			name: 'Toast',
			icon: 'fa-bell',
			description: 'Toast notifications with multiple types',
			defaultProps: {
				message: 'This is a toast message',
				title: '',
				type: 'info',
				duration: 5000
			},
			propsSchema: {
				message: { type: 'string', label: 'Message' },
				title: { type: 'string', label: 'Title (optional)' },
				type: { type: 'select', label: 'Type', options: ['info', 'success', 'warning', 'error'] },
				duration: { type: 'number', label: 'Duration (ms)', min: 1000, max: 30000 }
			},
			initCode: function(props) {
				var methodName = props.type || 'info';
				var code = '// Show a ' + methodName + ' toast\n';
				if (props.title) {
					code += "Funky.Toast." + methodName + "('" + props.message + "', '" + props.title + "');";
				} else {
					code += "Funky.Toast." + methodName + "('" + props.message + "');";
				}
				code += '\n\n// Other methods:\n';
				code += "// Funky.Toast.success('Operation completed!');\n";
				code += "// Funky.Toast.error('Something went wrong');\n";
				code += "// Funky.Toast.warning('Please check input');\n";
				code += "// Funky.Toast.info('FYI message');\n";
				code += '// Funky.Toast.confirm({ message: "Are you sure?", onConfirm: fn });';
				return code;
			}
		},
		Modal: {
			name: 'Modal',
			icon: 'fa-window-restore',
			description: 'Flexible modal dialogs for content, forms, confirmations, alerts, and prompts',
			defaultProps: {
				title: 'Modal Title',
				body: 'This is the modal body content.',
				size: 'md',
				centered: false,
				scrollable: false,
				backdrop: true
			},
			propsSchema: {
				title: { type: 'string', label: 'Title' },
				body: { type: 'string', label: 'Body Content' },
				size: { type: 'select', label: 'Size', options: ['sm', 'md', 'lg', 'xl', 'fullscreen'] },
				centered: { type: 'boolean', label: 'Vertically Centered' },
				scrollable: { type: 'boolean', label: 'Scrollable Body' },
				backdrop: { type: 'select', label: 'Backdrop', options: ['true', 'false', 'static'] }
			},
			initCode: function(props) {
				var code = '// Create and show a modal\n';
				code += 'Funky.Modal.create({\n';
				code += '  id: \'myModal\',\n';
				code += '  title: \'' + (props.title || 'Modal Title').replace(/'/g, "\\'") + '\',\n';
				code += '  body: \'<p>' + (props.body || 'Modal content').replace(/'/g, "\\'") + '</p>\',\n';
				if (props.size && props.size !== 'md') {
					code += '  size: \'' + props.size + '\',\n';
				}
				if (props.centered) {
					code += '  centered: true,\n';
				}
				if (props.scrollable) {
					code += '  scrollable: true,\n';
				}
				code += '  footerButtons: [\n';
				code += '    { text: \'Close\', class: \'btn btn-secondary\', close: true },\n';
				code += '    { text: \'Save\', class: \'btn btn-primary\', onClick: onSave }\n';
				code += '  ]\n';
				code += '});\n';
				code += 'Funky.Modal.show(\'#myModal\');\n\n';
				code += '// Convenience methods:\n';
				code += 'Funky.Modal.confirm({ title: \'Confirm\', message: \'Are you sure?\', onConfirm: fn });\n';
				code += 'Funky.Modal.alert({ title: \'Alert\', message: \'Important!\', type: \'warning\' });\n';
				code += 'Funky.Modal.prompt({ title: \'Input\', message: \'Enter value:\', onSubmit: fn });';
				return code;
			},
			codeExample: function() {
				return '// Create a custom modal\n' +
					'Funky.Modal.create({\n' +
					'  id: \'myModal\',\n' +
					'  title: \'Edit Item\',\n' +
					'  body: \'<form>...</form>\',\n' +
					'  size: \'lg\',\n' +
					'  centered: true,\n' +
					'  footerButtons: [\n' +
					'    { text: \'Cancel\', class: \'btn btn-secondary\', close: true },\n' +
					'    { text: \'Save\', class: \'btn btn-primary\', onClick: handleSave }\n' +
					'  ]\n' +
					'});\n\n' +
					'// Show/hide\n' +
					'Funky.Modal.show(\'#myModal\');\n' +
					'Funky.Modal.hide(\'#myModal\');\n' +
					'Funky.Modal.hideAll();\n\n' +
					'// Confirm dialog\n' +
					'Funky.Modal.confirm({\n' +
					'  title: \'Delete Item?\',\n' +
					'  message: \'This cannot be undone.\',\n' +
					'  confirmText: \'Delete\',\n' +
					'  confirmClass: \'btn btn-danger\',\n' +
					'  onConfirm: function() { deleteItem(); }\n' +
					'});\n\n' +
					'// Alert dialog\n' +
					'Funky.Modal.alert({\n' +
					'  title: \'Success\',\n' +
					'  message: \'Operation completed!\',\n' +
					'  type: \'success\'\n' +
					'});\n\n' +
					'// Prompt for input\n' +
					'Funky.Modal.prompt({\n' +
					'  title: \'Rename\',\n' +
					'  placeholder: \'New name\',\n' +
					'  onSubmit: function(value) { rename(value); }\n' +
					'});';
			}
		},
		Charts: {
			name: 'Charts (Sparklines)',
			icon: 'fa-chart-line',
			description: 'Lightweight SVG sparkline charts for inline trend indicators',
			defaultProps: {
				sparklineType: 'line',
				color: 'auto',
				width: 120,
				height: 40
			},
			propsSchema: {
				sparklineType: { type: 'select', label: 'Type', options: ['line', 'bar'] },
				color: { type: 'select', label: 'Color', options: ['auto', 'positive', 'negative', 'neutral'] },
				width: { type: 'number', label: 'Width (px)', min: 40, max: 300 },
				height: { type: 'number', label: 'Height (px)', min: 20, max: 100 }
			},
			initCode: function(props) {
				var type = props.sparklineType || 'line';
				var color = props.color || 'auto';
				var width = props.width || 120;
				var height = props.height || 40;
				return '// ' + type.charAt(0).toUpperCase() + type.slice(1) + ' sparkline\n' +
					'Funky.Charts.' + type + '(container, [10, 15, 12, 18, 22, 19, 25], {\n' +
					'  width: ' + width + ',\n' +
					'  height: ' + height + (color !== 'auto' ? ',\n  color: \'' + color + '\'' : '') + '\n' +
					'});\n\n' +
					'// Auto-init via data attributes:\n' +
					'// <span data-sparkline="' + type + '" data-values="1,2,3,4,5"></span>\n\n' +
					'// Get trend from data:\n' +
					'// Funky.Charts.getTrend([1,2,3,4,5]); // "positive"';
			}
		},
		Carousel: {
			name: 'Carousel',
			icon: 'fa-images',
			description: 'Responsive slide/card carousel with touch, keyboard, and autoplay support',
			defaultProps: {
				slidesToShow: 3,
				slidesToScroll: 1,
				gap: 16,
				speed: 400,
				autoplay: false,
				autoplaySpeed: 5000,
				arrows: true,
				dots: true,
				infinite: false,
				centerMode: false,
				fullscreen: false,
				fullWidth: false,
				fullWidthSlides: false,
				demoSlides: 6
			},
			propsSchema: {
				slidesToShow: { type: 'number', label: 'Slides to Show', min: 1, max: 6 },
				slidesToScroll: { type: 'number', label: 'Slides to Scroll', min: 1, max: 4 },
				gap: { type: 'number', label: 'Gap (px)', min: 0, max: 48 },
				speed: { type: 'number', label: 'Transition Speed (ms)', min: 100, max: 1000 },
				autoplay: { type: 'boolean', label: 'Autoplay' },
				autoplaySpeed: { type: 'number', label: 'Autoplay Interval (ms)', min: 1000, max: 10000 },
				arrows: { type: 'boolean', label: 'Show Arrows' },
				dots: { type: 'boolean', label: 'Show Dots' },
				infinite: { type: 'boolean', label: 'Infinite Loop' },
				centerMode: { type: 'boolean', label: 'Center Mode' },
				fullscreen: { type: 'boolean', label: 'Fullscreen Button' },
				fullWidth: { type: 'boolean', label: 'Full Width Mode' },
				fullWidthSlides: { type: 'boolean', label: 'Full Width Slides' },
				demoSlides: { type: 'number', label: 'Demo Slide Count', min: 3, max: 12 }
			},
			initCode: function(props) {
				var code = '// Create a responsive carousel\n';
				code += 'var carousel = Funky.Carousel.init(\'#my-carousel\', {\n';
				code += '  slidesToShow: ' + (props.slidesToShow || 3) + ',\n';
				code += '  slidesToScroll: ' + (props.slidesToScroll || 1) + ',\n';
				code += '  gap: ' + (props.gap || 16) + ',\n';
				code += '  speed: ' + (props.speed || 400) + ',\n';

				if (props.autoplay) {
					code += '  autoplay: true,\n';
					code += '  autoplaySpeed: ' + (props.autoplaySpeed || 5000) + ',\n';
				}

				code += '  arrows: ' + (props.arrows !== false) + ',\n';
				code += '  dots: ' + (props.dots !== false) + ',\n';
				code += '  infinite: ' + (props.infinite || false) + ',\n';

				if (props.centerMode) {
					code += '  centerMode: true,\n';
					code += '  centerPadding: \'60px\',\n';
				}

				if (props.fullscreen) {
					code += '  fullscreen: true,\n';
				}

				if (props.fullWidth) {
					code += '  fullWidth: true,\n';
				}

				if (props.fullWidthSlides) {
					code += '  fullWidthSlides: true,\n';
				}

				code += '  onSlideChange: function(index, prevIndex) {\n';
				code += '    console.log(\'Slide changed:\', prevIndex, \'->\', index);\n';
				code += '  }\n';
				code += '});\n\n';

				code += '// Navigation methods\n';
				code += 'carousel.next();              // Go to next slide\n';
				code += 'carousel.prev();              // Go to previous slide\n';
				code += 'carousel.goTo(2, true);       // Go to slide index 2 with animation\n\n';

				code += '// State methods\n';
				code += 'carousel.getCurrentIndex();   // Get current slide index\n';
				code += 'carousel.getSlideCount();     // Get total slides\n';
				code += 'carousel.canGoNext();         // Check if can go forward\n';
				code += 'carousel.canGoPrev();         // Check if can go back\n\n';

				code += '// Lifecycle\n';
				code += 'carousel.refresh();           // Recalculate dimensions\n';
				code += 'carousel.destroy();           // Clean up';

				return code;
			},
			render: function(container, props, logEvent) {
				// Clear previous
				D.wrap(container).empty();

				// Create demo slides with varied content
				var slides = [];
				var slideCount = props.demoSlides || 6;
				var colors = [
					'var(--pro-primary)',
					'var(--pro-success)',
					'var(--pro-warning)',
					'var(--pro-danger)',
					'var(--pro-info)',
					'var(--pro-accent-primary, #6f42c1)'
				];
				var icons = ['fa-star', 'fa-heart', 'fa-bolt', 'fa-gem', 'fa-rocket', 'fa-crown'];

				for (var i = 0; i < slideCount; i++) {
					var colorIndex = i % colors.length;
					slides.push(
						'<div class="playground-carousel-slide" style="' +
							'background: ' + colors[colorIndex] + ';' +
							'color: white;' +
							'padding: 40px 20px;' +
							'text-align: center;' +
							'border-radius: 8px;' +
							'min-height: 200px;' +
							'display: flex;' +
							'flex-direction: column;' +
							'align-items: center;' +
							'justify-content: center;' +
						'">' +
							'<i class="fas ' + icons[colorIndex] + '" style="font-size: 48px; margin-bottom: 16px;"></i>' +
							'<h3 style="margin: 0 0 8px;">Slide ' + (i + 1) + '</h3>' +
							'<p style="margin: 0; opacity: 0.8;">Swipe or use arrows</p>' +
						'</div>'
					);
				}

				// Build container
				var wrapper = D.create('div')
					.style({ padding: '20px', maxWidth: '100%' });
				
				var carouselContainer = D.create('div')
					.attr('id', 'playground-carousel');
				
				wrapper.append(carouselContainer);
				container.appendChild(wrapper.el);

				// Initialize carousel
				var carousel = Funky.Carousel.init(carouselContainer.el, {
					slides: slides,
					slidesToShow: props.slidesToShow || 3,
					slidesToScroll: props.slidesToScroll || 1,
					gap: props.gap || 16,
					speed: props.speed || 400,
					autoplay: props.autoplay || false,
					autoplaySpeed: props.autoplaySpeed || 5000,
					arrows: props.arrows !== false,
					dots: props.dots !== false,
					infinite: props.infinite || false,
					centerMode: props.centerMode || false,
					centerPadding: '60px',
					onSlideChange: function(index, prevIndex) {
						logEvent('slide:change', { from: prevIndex, to: index });
					},
					onInit: function() {
						logEvent('carousel:init', { slideCount: slideCount });
					}
				});

				// Add control buttons for demo
				var controls = D.create('div')
					.style({
						display: 'flex',
						gap: '8px',
						marginTop: '16px',
						justifyContent: 'center',
						flexWrap: 'wrap'
					});

				var prevBtn = D.create('button')
					.classAdd('btn', 'btn-outline-secondary', 'btn-sm')
					.html('<i class="fas fa-chevron-left"></i> Prev')
					.on('click', function() {
						carousel.prev();
						logEvent('button:prev');
					});

				var nextBtn = D.create('button')
					.classAdd('btn', 'btn-outline-secondary', 'btn-sm')
					.html('Next <i class="fas fa-chevron-right"></i>')
					.on('click', function() {
						carousel.next();
						logEvent('button:next');
					});

				var goToBtn = D.create('button')
					.classAdd('btn', 'btn-outline-primary', 'btn-sm')
					.html('<i class="fas fa-random"></i> Random')
					.on('click', function() {
						var randomIndex = Math.floor(Math.random() * carousel.getSlideCount());
						carousel.goTo(randomIndex, true);
						logEvent('button:random', { index: randomIndex });
					});

				controls.append(prevBtn, nextBtn, goToBtn);

				if (props.autoplay) {
					var isPlaying = true;
					var playPauseBtn = D.create('button')
						.classAdd('btn', 'btn-outline-success', 'btn-sm')
						.html('<i class="fas fa-pause"></i> Pause')
						.on('click', function() {
							carousel._toggleAutoplay();
							isPlaying = !carousel.state.autoplayManuallyPaused;
							playPauseBtn.html(isPlaying 
								? '<i class="fas fa-pause"></i> Pause'
								: '<i class="fas fa-play"></i> Play');
							logEvent('button:toggleAutoplay', { playing: isPlaying });
						});
					controls.append(playPauseBtn);
				}

				wrapper.append(controls);

				// Store instance for cleanup
				container._carouselInstance = carousel;

				return carousel;
			},
			cleanup: function(container) {
				if (container._carouselInstance) {
					container._carouselInstance.destroy();
					delete container._carouselInstance;
				}
			}
		},
		Format: {
			name: 'Format',
			icon: 'fa-hashtag',
			description: 'Number, currency, and percentage formatting',
			defaultProps: {
				formatType: 'number',
				value: 1234567.89,
				decimals: 2,
				currency: 'GBP'
			},
			propsSchema: {
				formatType: { type: 'select', label: 'Format Type', options: ['number', 'currency', 'percentage', 'compact'] },
				value: { type: 'number', label: 'Value' },
				decimals: { type: 'number', label: 'Decimal Places', min: 0, max: 6 },
				currency: { type: 'select', label: 'Currency', options: ['GBP', 'USD', 'EUR', 'JPY', 'CHF'] }
			},
			initCode: function(props) {
				var formatType = props.formatType || 'number';
				var value = props.value || 1234567.89;
				var code = '// Format as ' + formatType + '\n';
				if (formatType === 'currency') {
					code += "var result = Funky.Format.currency(" + value + ", '" + (props.currency || 'GBP') + "');\n";
					code += "// Returns: formatted currency string\n\n";
				} else if (formatType === 'percentage') {
					code += "var result = Funky.Format.percentage(" + value + ", " + (props.decimals || 2) + ");\n";
					code += "// Returns: percentage with % symbol\n\n";
				} else if (formatType === 'compact') {
					code += "var result = Funky.Format.compact(" + value + ");\n";
					code += "// Returns: '1.23M' for millions, '1.23K' for thousands\n\n";
				} else {
					code += "var result = Funky.Format.number(" + value + ", " + (props.decimals || 2) + ");\n";
					code += "// Returns: formatted number with separators\n\n";
				}
				code += '// Other formatting methods:\n';
				code += "// Funky.Format.number(1234567.89);      // '1,234,567.89'\n";
				code += "// Funky.Format.compact(1234567);        // '1.23M'\n";
				code += "// Funky.Format.currency(1234.56, 'USD'); // '$1,234.56'\n";
				code += "// Funky.Format.percentage(0.1234);      // '12.34%'\n";
				code += "// Funky.Format.change(5.25);            // '+5.25%' (with color)";
				return code;
			}
		},
		StatsBar: {
			name: 'StatsBar',
			icon: 'fa-chart-bar',
			description: 'Horizontal statistics display cards',
			defaultProps: {
				stats: [
					{ id: 'total', icon: 'fa-database', label: 'Total', variant: 'primary', value: 1250 },
					{ id: 'active', icon: 'fa-check-circle', label: 'Active', variant: 'success', value: 1180 },
					{ id: 'pending', icon: 'fa-clock', label: 'Pending', variant: 'warning', value: 45 },
					{ id: 'failed', icon: 'fa-times-circle', label: 'Failed', variant: 'danger', value: 12 }
				]
			},
			propsSchema: {
				stats: { type: 'json', label: 'Stats Configuration' }
			},
			initCode: function(props) {
				return "// Initialize StatsBar\n" +
					"Funky.StatsBar.init('#stats-container', {\n" +
					"  id: 'myStats',\n" +
					"  stats: [\n" +
					"    { id: 'total', icon: 'fa-database', label: 'Total', variant: 'primary' },\n" +
					"    { id: 'active', icon: 'fa-check-circle', label: 'Active', variant: 'success' },\n" +
					"    { id: 'pending', icon: 'fa-clock', label: 'Pending', variant: 'warning' },\n" +
					"    { id: 'failed', icon: 'fa-times-circle', label: 'Failed', variant: 'danger' }\n" +
					"  ]\n" +
					"});\n\n" +
					"// Update values\n" +
					"Funky.StatsBar.update('myStats', {\n" +
					"  total: 1250,\n" +
					"  active: 1180,\n" +
					"  pending: 45,\n" +
					"  failed: 12\n" +
					"});";
			}
		},
		Slider: {
			name: 'Slider',
			icon: 'fa-sliders-h',
			description: 'Dual-handle range slider for numeric filtering',
			defaultProps: {
				min: 0,
				max: 100000,
				minValue: 10000,
				maxValue: 75000,
				step: 1000
			},
			propsSchema: {
				min: { type: 'number', label: 'Minimum' },
				max: { type: 'number', label: 'Maximum' },
				minValue: { type: 'number', label: 'Initial Min Value' },
				maxValue: { type: 'number', label: 'Initial Max Value' },
				step: { type: 'number', label: 'Step' }
			},
			initCode: function(props) {
				return "// Create a dual-handle range slider\n" +
					"var container = document.getElementById('mySlider');\n" +
					"var slider = Funky.Slider.init(container, {\n" +
					"  min: " + (props.min || 0) + ",\n" +
					"  max: " + (props.max || 100000) + ",\n" +
					"  minValue: " + (props.minValue || 10000) + ",\n" +
					"  maxValue: " + (props.maxValue || 75000) + ",\n" +
					"  step: " + (props.step || 1000) + ",\n" +
					"  formatValue: function(val) { return '$' + val.toLocaleString(); },\n" +
					"  onUpdate: function(values) {\n" +
					"    console.log('Range:', values.min, '-', values.max);\n" +
					"  }\n" +
					"});\n\n" +
					"// Get current values\n" +
					"var values = slider.getValues(); // { min: 10000, max: 75000 }\n\n" +
					"// Set values programmatically\n" +
					"slider.setValues(5000, 50000);";
			}
		},
		ViewModal: {
			name: 'ViewModal',
			icon: 'fa-eye',
			description: 'Read-only entity display modal',
			defaultProps: {
				title: 'Client Details',
				data: {
					id: 123,
					name: 'Acme Corporation',
					email: 'info@acme.com',
					phone: '+44 20 7123 4567',
					status: 'active',
					created_at: '2024-01-15T10:30:00Z'
				},
				fields: [
					{ key: 'id', label: 'ID' },
					{ key: 'name', label: 'Name' },
					{ key: 'email', label: 'Email' },
					{ key: 'phone', label: 'Phone' },
					{ key: 'status', label: 'Status' },
					{ key: 'created_at', label: 'Created' }
				]
			},
			propsSchema: {
				title: { type: 'string', label: 'Modal Title' },
				data: { type: 'json', label: 'Entity Data' },
				fields: { type: 'json', label: 'Field Definitions' }
			},
			initCode: function(props) {
				return "// Initialize ViewModal configuration\n" +
					"Funky.ViewModal.init({\n" +
					"  modalId: 'viewClientModal',\n" +
					"  entity: 'client',\n" +
					"  apiUrl: '/api/clients',\n" +
					"  fields: [\n" +
					"    { key: 'id', label: 'ID' },\n" +
					"    { key: 'name', label: 'Name' },\n" +
					"    { key: 'email', label: 'Email' },\n" +
					"    { key: 'status', label: 'Status', render: 'activeStatus' }\n" +
					"  ]\n" +
					"});\n\n" +
					"// Show modal with entity ID\n" +
					"Funky.ViewModal.show('viewClientModal', 123);";
			}
		},
		FormModal: {
			name: 'FormModal',
			icon: 'fa-edit',
			description: 'Create/Edit entity form modal',
			defaultProps: {
				title: 'Edit Client',
				mode: 'edit',
				schema: {
					type: 'object',
					required: ['name', 'email'],
					properties: {
						name: { type: 'string', title: 'Client Name', minLength: 1 },
						email: { type: 'string', title: 'Email', format: 'email' },
						phone: { type: 'string', title: 'Phone' },
						is_active: { type: 'boolean', title: 'Active', default: true }
					}
				},
				data: {
					name: 'Acme Corporation',
					email: 'info@acme.com',
					phone: '+44 20 7123 4567',
					is_active: true
				}
			},
			propsSchema: {
				title: { type: 'string', label: 'Modal Title' },
				mode: { type: 'select', label: 'Mode', options: ['create', 'edit'] },
				schema: { type: 'json', label: 'Form Schema' },
				data: { type: 'json', label: 'Initial Data' }
			},
			initCode: function(props) {
				return "// Initialize FormModal configuration\n" +
					"Funky.FormModal.init({\n" +
					"  modalId: 'clientModal',\n" +
					"  entity: 'client',\n" +
					"  entityLabel: 'Client',\n" +
					"  schemaPath: 'CreateClient',  // Load from OpenAPI spec\n" +
					"  apiUrl: '/api/clients',\n" +
					"  onSave: function() { table.ajax.reload(); }\n" +
					"});\n\n" +
					"// Open in create mode\n" +
					"Funky.FormModal.init('clientModal');\n\n" +
					"// Open in edit mode with ID\n" +
					"Funky.FormModal.edit('clientModal', 123);";
			}
		},
		Wizard: {
			name: 'Wizard',
			icon: 'fa-magic',
			description: 'Multi-step wizard for complex workflows',
			defaultProps: {
				title: 'Create Trade',
				steps: [
					{ title: 'Trade Details', description: 'Enter basic trade info' },
					{ title: 'Select Clients', description: 'Choose participating clients' },
					{ title: 'Review & Submit', description: 'Confirm and submit' }
				],
				currentStep: 0
			},
			propsSchema: {
				title: { type: 'string', label: 'Wizard Title' },
				steps: { type: 'json', label: 'Steps Configuration' },
				currentStep: { type: 'number', label: 'Current Step', min: 0 }
			},
			initCode: function(props) {
				return "// Create a multi-step wizard\n" +
					"var wizard = Funky.Wizard.init({\n" +
					"  modalId: 'tradeWizardModal',\n" +
					"  title: '" + (props.title || 'Create Trade') + "',\n" +
					"  steps: [\n" +
					"    { type: 'form', stateKey: 'details', schemaPath: 'CreateTrade' },\n" +
					"    { type: 'checkboxes', stateKey: 'clients', getOptions: fetchClients },\n" +
					"    { type: 'custom', stateKey: 'review', onInit: renderReview }\n" +
					"  ],\n" +
					"  onSave: function(state, mode) {\n" +
					"    return saveTradeData(state);\n" +
					"  }\n" +
					"});\n\n" +
					"// Open wizard\n" +
					"wizard.create();           // New record\n" +
					"wizard.edit(existingData); // Edit existing";
			}
		},
		Tabbed: {
			name: 'Tabbed',
			icon: 'fa-folder',
			description: 'Composable tab container',
			defaultProps: {
				tabs: [
					{ id: 'overview', label: 'Overview', icon: 'fa-info-circle', content: 'Overview content goes here.' },
					{ id: 'details', label: 'Details', icon: 'fa-list', content: 'Detailed information and settings.' },
					{ id: 'history', label: 'History', icon: 'fa-history', content: 'Historical data and changes.' }
				],
				activeTab: 'overview',
				rememberTab: true
			},
			propsSchema: {
				tabs: { type: 'json', label: 'Tab Configuration' },
				activeTab: { type: 'string', label: 'Active Tab ID' },
				rememberTab: { type: 'boolean', label: 'Remember Tab Selection' }
			},
			initCode: function(props) {
				return "// Initialize tabbed container\n" +
					"var page = Funky.Tabbed.init({\n" +
					"  containerId: 'myTabs',\n" +
					"  contentContainerId: 'myTabContent',\n" +
					"  tabs: [\n" +
					"    {\n" +
					"      id: 'users',\n" +
					"      label: '<i class=\"fas fa-users\"></i> Users',\n" +
					"      type: 'crud',\n" +
					"      config: {\n" +
					"        entity: 'user',\n" +
					"        apiUrl: '/api/users',\n" +
					"        columns: [...]\n" +
					"      }\n" +
					"    },\n" +
					"    {\n" +
					"      id: 'settings',\n" +
					"      label: '<i class=\"fas fa-cog\"></i> Settings',\n" +
					"      type: 'custom',\n" +
					"      onInit: function(container) { loadSettings(); }\n" +
					"    }\n" +
					"  ],\n" +
					"  defaultTab: '" + (props.activeTab || 'overview') + "',\n" +
					"  rememberTab: true\n" +
					"});\n\n" +
					"// Switch tab programmatically\n" +
					"page.switchTab('settings');";
			}
		},
		Audio: {
			name: 'Audio',
			icon: 'fa-volume-up',
			description: 'Audio notification sounds (Even Funkyer mode only)',
			defaultProps: {
				sound: 'success',
				volume: 0.5
			},
			propsSchema: {
				sound: { type: 'select', label: 'Sound', options: ['success', 'error', 'create', 'edit', 'refresh', 'confirm'] },
				volume: { type: 'number', label: 'Volume', min: 0, max: 1 }
			},
			initCode: function(props) {
				return "// Play a sound effect (requires 'Even Funkyer' theme)\n" +
					"Funky.Audio.play('" + (props.sound || 'success') + ".mp3');\n\n" +
					"// Convenience methods:\n" +
					"Funky.Audio.playSuccess();\n" +
					"Funky.Audio.playError();\n" +
					"Funky.Audio.playCreate();\n" +
					"Funky.Audio.playEdit();\n" +
					"Funky.Audio.playRefresh();\n\n" +
					"// Volume control:\n" +
					"Funky.Audio.setVolume(" + (props.volume || 0.5) + ");\n" +
					"Funky.Audio.mute();\n" +
					"Funky.Audio.unmute();\n" +
					"Funky.Audio.toggleMute();";
			}
		},
		Video: {
			name: 'Video',
			icon: 'fa-video',
			description: 'Video player with minimal overlay controls',
			defaultProps: {
				src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
				loop: true,
				autoplay: false,
				muted: false,
				controls: true
			},
			propsSchema: {
				src: { type: 'string', label: 'Video Source URL' },
				loop: { type: 'boolean', label: 'Loop Video' },
				autoplay: { type: 'boolean', label: 'Autoplay' },
				muted: { type: 'boolean', label: 'Muted' },
				controls: { type: 'boolean', label: 'Show Controls' }
			},
			initCode: function(props) {
				return '// Initialise Video player\n' +
					'var player = Funky.Video.init(\'#container\', {\n' +
					'  src: \'' + props.src + '\',\n' +
					'  loop: ' + props.loop + ',\n' +
					'  autoplay: ' + props.autoplay + ',\n' +
					'  muted: ' + props.muted + ',\n' +
					'  controls: ' + props.controls + '\n' +
					'});\n\n' +
					'// Control methods:\n' +
					'// player.play();\n' +
					'// player.pause();\n' +
					'// player.toggle();\n' +
					'// player.rewind();  // Rewind 10 seconds\n' +
					'// player.forward(); // Forward 10 seconds\n' +
					'// player.toggleMute();';
			}
		},
		SlidePanel: {
			name: 'SlidePanel',
			icon: 'fa-columns',
			description: 'Slide-in panel from edge of screen',
			defaultProps: {
				title: 'Panel Title',
				position: 'right',
				size: 'md',
				overlay: true,
				content: 'Panel content goes here. Click "Open Panel" to see it.'
			},
			propsSchema: {
				title: { type: 'string', label: 'Panel Title' },
				position: { type: 'select', label: 'Position', options: ['left', 'right', 'top', 'bottom'] },
				size: { type: 'select', label: 'Size', options: ['sm', 'md', 'lg', 'xl'] },
				overlay: { type: 'boolean', label: 'Show Overlay' },
				content: { type: 'string', label: 'Content' }
			},
			initCode: function(props) {
				return "// Initialize SlidePanel module\n" +
					"Funky.SlidePanel.init();\n\n" +
					"// Register a panel for programmatic control\n" +
					"var panel = Funky.SlidePanel.register('myPanelId');\n\n" +
					"// Show/hide the panel\n" +
					"panel.show();\n" +
					"panel.hide();\n\n" +
					"// Set panel content dynamically\n" +
					"panel.setData({\n" +
					"  title: '" + (props.title || 'Panel Title') + "',\n" +
					"  content: '<p>Dynamic content here</p>'\n" +
					"});\n\n" +
					"// Get current panel data\n" +
					"var data = panel.getData();\n\n" +
					"// Manual scroll lock control\n" +
					"Funky.SlidePanel.lockScroll();   // Lock body scroll\n" +
					"Funky.SlidePanel.unlockScroll(); // Restore scroll\n\n" +
					"// HTML: Add modal-slide-left/right/top/bottom class\n" +
					"// <div class=\"modal modal-slide-panel modal-slide-" + (props.position || 'right') + "\" id=\"myPanelId\">";
			}
		},
		WIPOverlay: {
			name: 'WIPOverlay',
			icon: 'fa-hammer',
			description: 'Work-in-progress overlay for features under development',
			defaultProps: {
				message: 'Work in Progress',
				subMessage: 'This feature is coming soon',
				showProgress: false,
				progress: 50,
				allowClose: true,
				animation: 'fade',
				estimatedCompletion: '',
				contactEmail: '',
				showFeatures: false,
				features: []
			},
			propsSchema: {
				message: { type: 'string', label: 'Message' },
				subMessage: { type: 'string', label: 'Sub Message' },
				showProgress: { type: 'boolean', label: 'Show Progress' },
				progress: { type: 'number', label: 'Progress', min: 0, max: 100 },
				allowClose: { type: 'boolean', label: 'Allow Close' },
				animation: { type: 'select', label: 'Animation', options: ['fade', 'slide', 'zoom', 'none'] },
				estimatedCompletion: { type: 'string', label: 'Estimated Completion' },
				contactEmail: { type: 'string', label: 'Contact Email' },
				showFeatures: { type: 'boolean', label: 'Show Features' },
				features: { type: 'json', label: 'Features' }
			},
			initCode: function(props) {
				var code = "// Initialize WIP overlay on a page\n" +
					"Funky.WIPOverlay.init({\n" +
					"  message: '" + (props.message || 'Work in Progress') + "',\n" +
					"  subMessage: '" + (props.subMessage || 'This feature is coming soon') + "',\n" +
					"  allowClose: " + (props.allowClose !== false) + ",\n" +
					"  animation: '" + (props.animation || 'fade') + "'";
				if (props.showProgress) {
					code += ",\n  showProgress: true,\n  progress: " + (props.progress || 50);
				}
				if (props.estimatedCompletion) {
					code += ",\n  estimatedCompletion: '" + props.estimatedCompletion + "'";
				}
				if (props.contactEmail) {
					code += ",\n  contactEmail: '" + props.contactEmail + "'";
				}
				if (props.showFeatures && props.features && props.features.length) {
					code += ",\n  showFeatures: true,\n  features: " + JSON.stringify(props.features, null, 4).replace(/\n/g, '\n  ');
				}
				code += "\n});\n\n" +
					"// Show/hide programmatically:\n" +
					"Funky.WIPOverlay.show();\n" +
					"Funky.WIPOverlay.hide();\n\n" +
					"// Quick disable: add ?nowip to URL\n" +
					"// Or: Funky.Storage.setRaw('wip_disabled', 'true');";
				return code;
			}
		},
		Breadcrumb: {
			name: 'Breadcrumb',
			icon: 'fa-route',
			description: 'Breadcrumb navigation trail',
			defaultProps: {
				items: [
					{ label: 'Home', url: '#', icon: 'fa-home' },
					{ label: 'Products', url: '#' },
					{ label: 'Category', url: '#' },
					{ label: 'Current Item' }
				],
				separator: '/'
			},
			propsSchema: {
				items: { type: 'json', label: 'Breadcrumb Items' },
				separator: { type: 'string', label: 'Separator' }
			},
			initCode: function(props) {
				return "// Render breadcrumbs from URL path\n" +
					"Funky.Breadcrumb.render('#breadcrumbContainer');\n\n" +
					"// Generate breadcrumbs from a specific path\n" +
					"var crumbs = Funky.Breadcrumb.generate('/web/trades/123/edit');\n\n" +
					"// Auto-init (add to any container):\n" +
					"// <nav id=\"pageBreadcrumb\"></nav>\n" +
					"// <div data-breadcrumb-auto></div>";
			}
		},
		Badge: {
			name: 'Badge',
			icon: 'fa-certificate',
			description: 'Count and status indicators that attach to any element',
			defaultProps: {
				value: 5,
				type: 'count',
				max: 99,
				position: 'top-right',
				animate: true
			},
			propsSchema: {
				value: {
					type: 'number',
					label: 'Value',
					min: 0,
					max: 999,
					description: 'The badge value (for count, warning, success, info types)'
				},
				type: {
					type: 'select',
					label: 'Type',
					options: ['count', 'dot', 'warning', 'success', 'info'],
					descriptions: {
						count: 'Numeric count badge (e.g., notification count)',
						dot: 'Simple dot indicator (no text)',
						warning: 'Warning indicator (yellow)',
						success: 'Success indicator (green)',
						info: 'Info indicator (blue)'
					}
				},
				max: {
					type: 'number',
					label: 'Max Value',
					min: 1,
					max: 999,
					description: 'Values above this show as "max+" (e.g., 99+)'
				},
				position: {
					type: 'select',
					label: 'Position',
					options: ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'],
					description: 'Badge position relative to parent element'
				},
				animate: {
					type: 'checkbox',
					label: 'Animate on Change',
					description: 'Show pulse animation when value changes'
				}
			},
			initCode: function(props) {
				var code = '// Attach badge to an element\n';
				code += 'Funky.Badge.attach(\'#myButton\', {\n';
				code += '  value: ' + (props.value || 5) + ',\n';
				code += '  type: \'' + (props.type || 'count') + '\',\n';
				code += '  max: ' + (props.max || 99) + ',\n';
				code += '  position: \'' + (props.position || 'top-right') + '\',\n';
				code += '  animate: ' + (props.animate !== false) + '\n';
				code += '});\n\n';
				code += '// Update existing badge\n';
				code += 'Funky.Badge.update(\'#myButton\', { value: 10 });\n\n';
				code += '// Remove badge\n';
				code += 'Funky.Badge.remove(\'#myButton\');\n\n';
				code += '// Subscribe to PubSub events for auto-update\n';
				code += 'Funky.Badge.subscribe(\'#notifications\', \'app:notifications:count\');';
				return code;
			}
		},
		Table: {
			name: 'Table',
			icon: 'fa-table',
			description: 'Native ES5 data table with sorting, filtering, pagination, selection, conditional formatting, context menu, aggregations, and full accessibility support.',
			defaultProps: {
				pageLength: 10,
				serverSide: false,
				responsive: true,
				select: 'multi',
				enableExport: true,
				enableColvis: true,
				enableAnimations: true,
				showContextMenu: true,
				showAggregations: true,
				showConditionalFormatting: true,
				striped: true,
				hover: true
			},
			propsSchema: {
				pageLength: { type: 'select', label: 'Page Size', options: [5, 10, 25, 50, 100] },
				serverSide: { type: 'checkbox', label: 'Server-Side Processing', description: 'Enable server-side pagination and sorting' },
				responsive: { type: 'checkbox', label: 'Responsive Mode', description: 'Collapse columns on smaller screens with priority' },
				select: { type: 'select', label: 'Row Selection', options: ['false', 'single', 'multi', 'os'] },
				enableExport: { type: 'checkbox', label: 'Export Buttons', description: 'Show CSV/Excel/JSON export buttons' },
				enableColvis: { type: 'checkbox', label: 'Column Visibility', description: 'Allow toggling column visibility' },
				enableAnimations: { type: 'checkbox', label: 'Row Animations', description: 'Animate row insert/remove/highlight' },
				showContextMenu: { type: 'checkbox', label: 'Context Menu', description: 'Right-click menu on rows' },
				showAggregations: { type: 'checkbox', label: 'Aggregations Footer', description: 'Show sum/avg/count in footer' },
				showConditionalFormatting: { type: 'checkbox', label: 'Conditional Formatting', description: 'Highlight high values and status colors' },
				striped: { type: 'checkbox', label: 'Striped Rows', description: 'Alternating row colors' },
				hover: { type: 'checkbox', label: 'Hover Effect', description: 'Highlight row on hover' }
			},
			render: function(container, props) {
				var containerId = 'playground-table-' + Date.now();
				var tableId = containerId + '-table';

				// Sample data with diverse types
				var sampleData = [
					{ id: 1, name: 'Acme Corporation', status: 'active', amount: 125000.50, progress: 85, email: 'info@acme.com', isActive: true, created_at: '2025-12-01' },
					{ id: 2, name: 'Beta Industries', status: 'pending', amount: 45000.00, progress: 42, email: 'sales@beta.io', isActive: true, created_at: '2025-12-05' },
					{ id: 3, name: 'Gamma Solutions', status: 'active', amount: 89500.75, progress: 67, email: 'hello@gamma.co', isActive: true, created_at: '2025-12-08' },
					{ id: 4, name: 'Delta Dynamics', status: 'inactive', amount: 12300.00, progress: 15, email: 'contact@delta.net', isActive: false, created_at: '2025-12-10' },
					{ id: 5, name: 'Epsilon Labs', status: 'active', amount: 234000.00, progress: 92, email: 'labs@epsilon.org', isActive: true, created_at: '2025-12-12' },
					{ id: 6, name: 'Zeta Ventures', status: 'pending', amount: 67800.25, progress: 55, email: 'invest@zeta.vc', isActive: true, created_at: '2025-12-14' },
					{ id: 7, name: 'Eta Consulting', status: 'active', amount: 156000.00, progress: 78, email: 'consult@eta.biz', isActive: true, created_at: '2025-12-15' },
					{ id: 8, name: 'Theta Tech', status: 'inactive', amount: 8900.00, progress: 10, email: 'tech@theta.dev', isActive: false, created_at: '2025-12-16' },
					{ id: 9, name: 'Iota Innovations', status: 'active', amount: 445000.00, progress: 95, email: 'innovate@iota.ai', isActive: true, created_at: '2025-12-18' },
					{ id: 10, name: 'Kappa Capital', status: 'pending', amount: 78000.00, progress: 38, email: 'capital@kappa.fund', isActive: true, created_at: '2025-12-20' },
					{ id: 11, name: 'Lambda Logic', status: 'active', amount: 198000.00, progress: 88, email: 'logic@lambda.io', isActive: true, created_at: '2025-12-21' },
					{ id: 12, name: 'Mu Manufacturing', status: 'inactive', amount: 34500.00, progress: 22, email: 'orders@mu.mfg', isActive: false, created_at: '2025-12-22' }
				];

				// Build wrapper with action buttons
				var wrapper = D.create('div').classAdd('playground-table-demo');

				// Action toolbar
				var toolbar = D.create('div')
					.classAdd('d-flex', 'gap-2', 'mb-3', 'flex-wrap')
					.appendTo(wrapper);

				D.create('button')
					.classAdd('btn', 'btn-sm', 'btn-success')
					.html('<i class="fas fa-plus me-1"></i>Add Row')
					.attr('data-action', 'add')
					.appendTo(toolbar);

				D.create('button')
					.classAdd('btn', 'btn-sm', 'btn-danger')
					.html('<i class="fas fa-trash me-1"></i>Remove Selected')
					.attr('data-action', 'remove')
					.appendTo(toolbar);

				D.create('button')
					.classAdd('btn', 'btn-sm', 'btn-warning')
					.html('<i class="fas fa-star me-1"></i>Highlight First')
					.attr('data-action', 'highlight')
					.appendTo(toolbar);

				D.create('button')
					.classAdd('btn', 'btn-sm', 'btn-info')
					.html('<i class="fas fa-sync me-1"></i>Reload')
					.attr('data-action', 'reload')
					.appendTo(toolbar);

				// Selection info
				var selectionInfo = D.create('span')
					.classAdd('ms-auto', 'badge', 'bg-secondary', 'align-self-center')
					.attr('id', containerId + '-selection')
					.text('0 selected')
					.appendTo(toolbar);

				// Table container
				var tableContainer = D.create('div')
					.attr('id', tableId)
					.appendTo(wrapper);

				container.appendChild(wrapper.el);

				// Build columns with different types
				var columns = [
					{ data: 'id', title: 'ID', width: '60px', className: 'text-center', responsivePriority: 1 },
					{ data: 'name', title: 'Company', responsivePriority: 1 },
					{
						data: 'status',
						title: 'Status',
						responsivePriority: 2,
						render: function(value) {
							var colors = { active: 'success', pending: 'warning', inactive: 'secondary' };
							return '<span class="badge bg-' + (colors[value] || 'secondary') + '">' + value + '</span>';
						}
					},
					{
						data: 'amount',
						title: 'Amount',
						className: 'text-end',
						responsivePriority: 3,
						render: function(value) {
							return '$' + parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 });
						}
					},
					{
						data: 'progress',
						title: 'Progress',
						responsivePriority: 4,
						render: function(value) {
							var color = value >= 80 ? 'success' : value >= 50 ? 'info' : value >= 30 ? 'warning' : 'danger';
							return '<div class="progress" style="height: 18px; min-width: 80px;">' +
								'<div class="progress-bar bg-' + color + '" style="width: ' + value + '%">' + value + '%</div>' +
								'</div>';
						}
					},
					{
						data: 'email',
						title: 'Email',
						responsivePriority: 5,
						render: function(value) {
							return '<a href="mailto:' + value + '">' + value + '</a>';
						}
					},
					{
						data: 'isActive',
						title: 'Active',
						className: 'text-center',
						responsivePriority: 4,
						render: function(value) {
							return value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>';
						}
					},
					{ data: 'created_at', title: 'Created', responsivePriority: 5 }
				];

				// Build config
				var tableConfig = {
					data: sampleData,
					columns: columns,
					pageLength: props.pageLength || 10,
					serverSide: false,
					responsive: props.responsive !== false,
					scrollX: props.responsive === false,  // Enable horizontal scroll when responsive is off
					select: props.select === 'false' ? false : (props.select || 'multi'),
					selectAllCheckbox: props.select === 'multi',
					striped: props.striped !== false,
					hover: props.hover !== false,
					enableExport: props.enableExport !== false,
					enableColvis: props.enableColvis !== false,
					onSelect: function(data, table) {
						var count = table.getSelectedIds().length;
						var badge = D.one('#' + containerId + '-selection');
						if (badge) badge.text(count + ' selected');
					},
					onDeselect: function(data, table) {
						var count = table.getSelectedIds().length;
						var badge = D.one('#' + containerId + '-selection');
						if (badge) badge.text(count + ' selected');
					}
				};

				// Animations
				if (props.enableAnimations !== false) {
					tableConfig.animations = {
						enabled: true,
						highlightDuration: 2000
					};
				}

				// Context Menu
				if (props.showContextMenu !== false) {
					tableConfig.contextMenu = {
						enabled: true,
						selectOnContextMenu: true,
						items: [
							{ label: 'View Details', icon: 'fas fa-eye', action: function(row) { Funky.Toast.show('Viewing: ' + row.name, { type: 'info' }); } },
							{ label: 'Edit', icon: 'fas fa-edit', action: function(row) { Funky.Toast.show('Editing: ' + row.name, { type: 'info' }); } },
							{ type: 'divider' },
							{ label: 'Delete', icon: 'fas fa-trash', className: 'text-danger', action: function(row, table) {
								table.removeRowAnimated(row.id, function() {
									Funky.Toast.show('Deleted: ' + row.name, { type: 'warning' });
								});
							}}
						]
					};
				}

				// Aggregations
				if (props.showAggregations !== false) {
					tableConfig.aggregations = {
						enabled: true,
						position: 'footer',
						columns: {
							amount: ['sum', 'avg'],
							progress: ['avg'],
							id: ['count']
						},
						formatters: {
							amount: function(value, type) {
								return '$' + parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 });
							}
						}
					};
				}

				// Conditional Formatting
				if (props.showConditionalFormatting !== false) {
					tableConfig.conditionalFormatting = {
						enabled: true,
						rules: [
							{
								id: 'high-value',
								target: 'row',
								condition: function(row) { return row.amount >= 200000; },
								style: { backgroundColor: 'rgba(25, 135, 84, 0.1)' }
							},
							{
								id: 'low-progress',
								target: 'row',
								condition: function(row) { return row.progress < 25; },
								style: { backgroundColor: 'rgba(220, 53, 69, 0.1)' }
							}
						]
					};
				}

				// Initialize table
				var table = Funky.Table.init('#' + tableId, tableConfig);

				// Wire up action buttons
				toolbar.el.addEventListener('click', function(e) {
					var btn = e.target.closest('[data-action]');
					if (!btn) return;

					var action = btn.getAttribute('data-action');

					if (action === 'add') {
						var newId = Date.now();
						table.insertRowAnimated({
							id: newId,
							name: 'New Company #' + newId,
							status: 'pending',
							amount: Math.round(Math.random() * 100000),
							progress: Math.round(Math.random() * 100),
							email: 'new@example.com',
							isActive: true,
							created_at: new Date().toISOString().split('T')[0]
						}, { position: 'top', highlight: true });
						Funky.Toast.show('Row added!', { type: 'success' });
					}

					if (action === 'remove') {
						var ids = table.getSelectedIds();
						if (ids.length === 0) {
							Funky.Toast.show('Select rows first', { type: 'warning' });
							return;
						}
						table.removeRowsAnimated(ids, function() {
							Funky.Toast.show(ids.length + ' rows removed', { type: 'success' });
							var badge = D.one('#' + containerId + '-selection');
							if (badge) badge.text('0 selected');
						});
					}

					if (action === 'highlight') {
						var data = table.getData();
						if (data.length > 0) {
							table.highlightRow(data[0].id, 'success');
							Funky.Toast.show('Highlighted first row', { type: 'info' });
						}
					}

					if (action === 'reload') {
						table.reload();
						Funky.Toast.show('Table reloaded', { type: 'info' });
					}
				});

				return table;
			},
			initCode: function(props) {
				var selectValue = props.select === 'false' ? 'false' : "'" + (props.select || 'multi') + "'";
				return '// Initialize Funky.Table with full features\n' +
					"var table = Funky.Table.init('#myTable', {\n" +
					'  // Data source\n' +
					'  data: myData,                    // Client-side data\n' +
					"  // ajaxUrl: '/api/products',     // OR server-side\n" +
					'  // serverSide: ' + props.serverSide + ',\n\n' +
					'  // Columns with types and renderers\n' +
					'  columns: [\n' +
					"    { data: 'id', title: 'ID', responsivePriority: 1 },\n" +
					"    { data: 'name', title: 'Name', responsivePriority: 1 },\n" +
					"    { data: 'status', title: 'Status', render: statusBadge },\n" +
					"    { data: 'amount', title: 'Amount', render: moneyFormat },\n" +
					"    { data: 'progress', title: 'Progress', render: progressBar },\n" +
					"    { data: 'email', title: 'Email', responsivePriority: 5 }\n" +
					'  ],\n\n' +
					'  // Pagination\n' +
					'  pageLength: ' + props.pageLength + ',\n\n' +
					'  // Selection\n' +
					'  select: ' + selectValue + ',\n' +
					'  selectAllCheckbox: ' + (props.select === 'multi') + ',\n\n' +
					'  // Display\n' +
					'  responsive: ' + (props.responsive !== false) + ',\n' +
					'  scrollX: ' + (props.responsive === false) + ',  // Horizontal scroll when responsive is off\n' +
					'  striped: ' + (props.striped !== false) + ',\n' +
					'  hover: ' + (props.hover !== false) + ',\n\n' +
					'  // Features\n' +
					'  enableExport: ' + (props.enableExport !== false) + ',\n' +
					'  enableColvis: ' + (props.enableColvis !== false) + ',\n\n' +
					'  // Animations\n' +
					'  animations: { enabled: ' + (props.enableAnimations !== false) + ', highlightDuration: 2000 },\n\n' +
					'  // Context Menu\n' +
					'  contextMenu: {\n' +
					'    enabled: ' + (props.showContextMenu !== false) + ',\n' +
					'    items: [\n' +
					"      { label: 'View', icon: 'fas fa-eye', action: viewHandler },\n" +
					"      { label: 'Edit', icon: 'fas fa-edit', action: editHandler },\n" +
					"      { type: 'divider' },\n" +
					"      { label: 'Delete', icon: 'fas fa-trash', className: 'text-danger', action: deleteHandler }\n" +
					'    ]\n' +
					'  },\n\n' +
					'  // Aggregations\n' +
					'  aggregations: {\n' +
					'    enabled: ' + (props.showAggregations !== false) + ',\n' +
					"    position: 'footer',\n" +
					"    columns: { amount: ['sum', 'avg'], id: ['count'] }\n" +
					'  },\n\n' +
					'  // Conditional Formatting\n' +
					'  conditionalFormatting: {\n' +
					'    enabled: ' + (props.showConditionalFormatting !== false) + ',\n' +
					'    rules: [\n' +
					"      { id: 'high-value', target: 'row',\n" +
					'        condition: function(row) { return row.amount >= 200000; },\n' +
					"        style: { backgroundColor: 'rgba(25, 135, 84, 0.1)' } }\n" +
					'    ]\n' +
					'  },\n\n' +
					'  // Callbacks\n' +
					'  onSelect: function(data, table) { updateSelectionUI(table); },\n' +
					'  onDeselect: function(data, table) { updateSelectionUI(table); }\n' +
					'});';
			},
			codeExample: function() {
				return '// === FUNKY.TABLE EXAMPLES ===\n\n' +
					'// Basic client-side table\n' +
					"var table = Funky.Table.init('#myTable', {\n" +
					'  data: myData,\n' +
					'  columns: [\n' +
					"    { data: 'id', title: 'ID' },\n" +
					"    { data: 'name', title: 'Name' },\n" +
					"    { data: 'status', title: 'Status' }\n" +
					'  ]\n' +
					'});\n\n' +
					'// Server-side processing\n' +
					"var table = Funky.Table.init('#myTable', {\n" +
					"  ajaxUrl: '/api/products',\n" +
					'  serverSide: true,\n' +
					'  columns: [...]\n' +
					'});\n\n' +
					'// === SELECTION ===\n' +
					'table.select([1, 2, 3]);        // Select by IDs\n' +
					'table.deselect([1]);            // Deselect by ID\n' +
					'table.selectAll();              // Select all visible\n' +
					'table.deselectAll();            // Clear selection\n' +
					'var ids = table.getSelectedIds();\n' +
					'var data = table.getSelectedData();\n\n' +
					'// === DATA OPERATIONS ===\n' +
					'table.addData(newRow);          // Add (animated)\n' +
					'table.updateData(id, updates);  // Update (animated)\n' +
					'table.removeData(ids);          // Remove (animated)\n' +
					'table.reload();                 // Reload from server\n\n' +
					'// === ANIMATIONS ===\n' +
					"table.highlightRow(id, 'success');  // success/warning/danger\n" +
					'table.insertRowAnimated(data, { position: "top" });\n' +
					'table.removeRowAnimated(id, callback);\n\n' +
					'// === PAGINATION & SEARCH ===\n' +
					'table.page(2);                  // Go to page 2\n' +
					'table.pageLength(50);           // Change page size\n' +
					"table.search('query');          // Search\n" +
					'table.clearSearch();\n\n' +
					'// === COLUMNS ===\n' +
					"table.showColumn('email');\n" +
					"table.hideColumn('notes');\n" +
					"table.toggleColumn('description');\n\n" +
					'// === EXPORT ===\n' +
					"table.export('csv', { filename: 'my-data' });\n" +
					"table.export('xlsx');\n" +
					"table.export('json');";
			}
		},
		ActionBar: {
			name: 'ActionBar',
			icon: 'fa-bars-staggered',
			description: 'Declarative action toolbar with create, export, import, filter, and bulk action buttons',
			defaultProps: {
				entity: 'demo',
				showCreate: true,
				showExport: true,
				showImport: true,
				showFilter: true,
				showBulk: false
			},
			propsSchema: {
				entity: {
					type: 'string',
					label: 'Entity Type'
				},
				showCreate: {
					type: 'boolean',
					label: 'Show Create Button'
				},
				showExport: {
					type: 'boolean',
					label: 'Show Export Button'
				},
				showImport: {
					type: 'boolean',
					label: 'Show Import Button'
				},
				showFilter: {
					type: 'boolean',
					label: 'Show Filter Button'
				},
				showBulk: {
					type: 'boolean',
					label: 'Show Bulk Actions'
				}
			},
			initCode: function(props) {
				var entity = props.entity || 'client';
				var code = '// Create ActionBar from config\n';
				code += 'var actionBar = Funky.ActionBar.create({\n';
				code += "  container: '#toolbar-container',\n";
				code += "  entity: '" + entity + "',\n";
				code += '  buttons: [\n';
				if (props.showCreate !== false) {
					code += "    { action: 'create', label: 'Add " + entity.charAt(0).toUpperCase() + entity.slice(1) + "' },\n";
				}
				if (props.showExport !== false) {
					code += "    { action: 'export' },\n";
				}
				if (props.showImport !== false) {
					code += "    { action: 'import' },\n";
				}
				if (props.showFilter !== false) {
					code += "    { action: 'filter', attrs: { 'data-filter-target': '#filterPanel' } },\n";
				}
				if (props.showBulk) {
					code += "    { action: 'bulk' }\n";
				}
				code += '  ]\n';
				code += '});\n\n';
				code += '// Instance methods\n';
				code += "actionBar.setEnabled('export', false);\n";
				code += "actionBar.setLoading('create', true);\n\n";
				code += '// Listen to events\n';
				code += "document.addEventListener('funky.action-bar.action', function(e) {\n";
				code += "  console.log('Action:', e.detail.action, 'Entity:', e.detail.entity);\n";
				code += '});';
				return code;
			},
			codeExample: function() {
				return '// Create ActionBar from config (preferred)\n' +
					'Funky.ActionBar.create({\n' +
					"  container: '#toolbar-container',\n" +
					"  entity: 'clients',\n" +
					"  api: '/api/clients',\n" +
					'  buttons: [\n' +
					"    { action: 'create', label: 'Add Client' },\n" +
					"    { action: 'export' },\n" +
					"    { action: 'import' },\n" +
					"    { action: 'filter', attrs: { 'data-filter-target': '#filterPanel' } },\n" +
					"    { action: 'bulk' }\n" +
					'  ]\n' +
					'});\n\n' +
					'// Custom buttons\n' +
					'Funky.ActionBar.create({\n' +
					"  container: '#my-toolbar',\n" +
					"  entity: 'trades',\n" +
					"  tableId: 'tradesTable',\n" +
					'  buttons: [\n' +
					"    { action: 'create' },\n" +
					"    { action: 'archive', label: 'Archive', icon: 'fa-box-archive', variant: 'warning' },\n" +
					"    { action: 'refresh', iconOnly: true }\n" +
					'  ]\n' +
					'});\n\n' +
					'// Events\n' +
					"document.addEventListener('funky.action-bar.action', function(e) {\n" +
					"  console.log('Action:', e.detail.action, 'Entity:', e.detail.entity);\n" +
					'});';
			}
		},
		AdvancedFilter: {
			name: 'AdvancedFilter',
			icon: 'fa-filter',
			description: 'Advanced filter builder with multiple conditions. Uses the real Funky.AdvancedFilter component with mock endpoints.',
			defaultProps: {
				entityType: 'playground',
				optionsEndpoint: '/api/playground/filter_options',
				savedFiltersEndpoint: '/api/playground/saved_filters',
				context: 'playground_demo'
			},
			propsSchema: {
				entityType: { type: 'string', label: 'Entity Type', description: 'Entity type (trade, trade_action, or custom)' },
				optionsEndpoint: { type: 'string', label: 'Options Endpoint', description: 'API endpoint for filter field options' },
				savedFiltersEndpoint: { type: 'string', label: 'Saved Filters Endpoint', description: 'API endpoint for saved filters CRUD' },
				context: { type: 'string', label: 'Context', description: 'Filter context name for storage' }
			},
			codeExample: function() {
				return '// Initialize Advanced Filter with custom endpoints\n' +
					'Funky.AdvancedFilter.init(\'#advancedFilterBtn\', {\n' +
					'  entityType: \'trade\',\n' +
					'  // Optional: custom endpoints (defaults derive from entityType)\n' +
					'  optionsEndpoint: \'/api/filter_options?entity=trade\',\n' +
					'  savedFiltersEndpoint: \'/api/saved_filters\',\n' +
					'  context: \'trade_filters\',\n' +
					'  dataTable: myDataTable,  // Optional: auto-apply to DataTable\n' +
					'  onApply: function(filters) {\n' +
					'    console.log(\'Filters applied:\', filters);\n' +
					'  },\n' +
					'  onClear: function() {\n' +
					'    console.log(\'Filters cleared\');\n' +
					'  }\n' +
					'});';
			},
			initCode: function(props) {
				return "// Initialize Advanced Filter\n" +
					"Funky.AdvancedFilter.init('#advancedFilterBtn', {\n" +
					"  entityType: '" + (props.entityType || 'trade') + "',\n" +
					"  context: '" + (props.context || 'trade_filters') + "',\n" +
					"  dataTable: myDataTable,  // Optional: auto-apply to DataTable\n" +
					"  onApply: function(filters) {\n" +
					"    console.log('Filters applied:', filters);\n" +
					"  }\n" +
					"});";
			}
		},
		FilterToolbar: {
			name: 'FilterToolbar',
			icon: 'fa-sliders-h',
			description: 'Quick filter toolbar with saved filters',
			defaultProps: {
				context: 'demo',
				showQuickFilters: true,
				showSavedFilters: true,
				quickFilters: [
					{ id: 'status', label: 'Status', type: 'select', options: ['All', 'Active', 'Pending', 'Completed'] },
					{ id: 'dateRange', label: 'Date Range', type: 'daterange' },
					{ id: 'search', label: 'Search', type: 'text' }
				]
			},
			propsSchema: {
				context: { type: 'string', label: 'Context Name' },
				showQuickFilters: { type: 'boolean', label: 'Show Quick Filters' },
				showSavedFilters: { type: 'boolean', label: 'Show Saved Filters' },
				quickFilters: { type: 'json', label: 'Quick Filter Config' }
			},
			initCode: function(props) {
				return "// Create a filter toolbar\n" +
					"var toolbar = Funky.FilterToolbar.create({\n" +
					"  context: '" + (props.context || 'demo') + "',\n" +
					"  toolbarSelector: '#filterToolbar',\n" +
					"  dataTable: myDataTable,\n" +
					"  onFilterChange: function(filters) {\n" +
					"    console.log('Filters changed:', filters);\n" +
					"  }\n" +
					"});\n\n" +
					"// Apply/clear filters\n" +
					"toolbar.applyFilters({ status: 'active' });\n" +
					"toolbar.clearFilters();";
			}
		},
		BulkActions: {
			name: 'BulkActions',
			icon: 'fa-tasks',
			description: 'Multi-select and batch operations for Funky.Table',
			defaultProps: {
				barPosition: 'top',
				showCount: true,
				showClear: true,
				actions: [
					{ id: 'edit', label: 'Edit', icon: 'fa-edit', variant: 'primary' },
					{ id: 'export', label: 'Export', icon: 'fa-download', variant: 'secondary' },
					{ id: 'archive', label: 'Archive', icon: 'fa-archive', variant: 'warning' },
					{ id: 'delete', label: 'Delete', icon: 'fa-trash', variant: 'danger' }
				]
			},
			propsSchema: {
				barPosition: { type: 'select', label: 'Bar Position', options: ['top', 'bottom'] },
				showCount: { type: 'boolean', label: 'Show Selection Count' },
				showClear: { type: 'boolean', label: 'Show Clear Button' },
				actions: { type: 'json', label: 'Bulk Actions Config' }
			},
			initCode: function(props) {
				return "// Create a Funky.Table with selection enabled\n" +
					"var table = Funky.Table.init('#myTable', {\n" +
					"  data: myData,\n" +
					"  selectable: 'multi',  // 'single', 'multi', or 'os'\n" +
					"  columns: [...]\n" +
					"});\n\n" +
					"// Add bulk actions to the table\n" +
					"var bulk = Funky.BulkActions.create({\n" +
					"  table: table,\n" +
					"  barPosition: '" + (props.barPosition || 'top') + "',\n" +
					"  showCount: " + (props.showCount !== false) + ",\n" +
					"  showClear: " + (props.showClear !== false) + ",\n" +
					"  actions: " + JSON.stringify(props.actions || [], null, 2).replace(/\n/g, '\n  ') + ",\n" +
					"  onAction: function(actionId, selectedItems, table) {\n" +
					"    console.log('Action:', actionId, selectedItems);\n" +
					"  }\n" +
					"});\n\n" +
					"// API Methods\n" +
					"bulk.selectAll();           // Select all rows\n" +
					"bulk.clearSelection();      // Clear selection\n" +
					"bulk.getSelectedItems();    // Get selected row data\n" +
					"bulk.getSelectedIds();      // Get selected IDs\n" +
					"bulk.addAction({ id: 'custom', label: 'Custom', icon: 'fa-star' });\n" +
					"bulk.removeAction('edit');  // Remove an action\n" +
					"bulk.setActionEnabled('delete', false);  // Disable an action";
			}
		},
		ColumnProfiles: {
			name: 'ColumnProfiles',
			icon: 'fa-columns',
			description: 'Save and load column visibility profiles',
			defaultProps: {
				columns: [
					{ name: 'id', title: 'ID', visible: true },
					{ name: 'name', title: 'Name', visible: true },
					{ name: 'status', title: 'Status', visible: true },
					{ name: 'amount', title: 'Amount', visible: true },
					{ name: 'date', title: 'Date', visible: true },
					{ name: 'user', title: 'User', visible: false }
				],
				allowCreate: true,
				allowDelete: true
			},
			propsSchema: {
				columns: { type: 'json', label: 'Column Configuration' },
				allowCreate: { type: 'boolean', label: 'Allow Create Profile' },
				allowDelete: { type: 'boolean', label: 'Allow Delete Profile' }
			},
			initCode: function(props) {
				return "// Initialize column profiles for a DataTable\n" +
					"var profiles = new Funky.ColumnProfiles('myTableId');\n\n" +
					"// Show profile management modal\n" +
					"profiles.showModal();\n\n" +
					"// Save current visibility as a profile\n" +
					"profiles.saveProfile('My Profile');\n\n" +
					"// Load a saved profile\n" +
					"profiles.loadProfile('My Profile');";
			}
		},
		Api: {
			name: 'Api',
			icon: 'fa-plug',
			description: 'Centralized API layer with CSRF, deduplication, retry logic, and events',
			defaultProps: {},
			propsSchema: {},
			initCode: function(props) {
				return "// GET request\n" +
					"Funky.Api.get('/api/users').then(function(data) {\n" +
					"  console.log('Users:', data);\n" +
					"});\n\n" +
					"// POST request\n" +
					"Funky.Api.post('/api/users', { name: 'John' });\n\n" +
					"// Entity factory for CRUD operations\n" +
					"var users = Funky.Api.entity('users', '/api/users');\n" +
					"users.list();           // GET /api/users\n" +
					"users.get(1);           // GET /api/users/1\n" +
					"users.create(data);     // POST /api/users\n" +
					"users.update(1, data);  // PUT /api/users/1\n" +
					"users.delete(1);        // DELETE /api/users/1\n\n" +
					"// Listen to API events\n" +
					"Funky.PubSub.on('funky:api:success', fn);\n" +
					"Funky.PubSub.on('funky:api:error', fn);";
			}
		},
		PubSub: {
			name: 'PubSub',
			icon: 'fa-tower-broadcast',
			description: 'Application event bus for decoupled component communication',
			defaultProps: {
				eventName: 'demo:test',
				eventData: '{"message": "Hello!"}',
				namespace: 'myApp',
				namespaceEvent: 'userAction'
			},
			propsSchema: {
				eventName: { type: 'string', label: 'Event Name' },
				eventData: { type: 'string', label: 'Event Data (JSON)' },
				namespace: { type: 'string', label: 'Namespace Prefix' },
				namespaceEvent: { type: 'string', label: 'Namespace Event' }
			},
			initCode: function(props) {
				var eventName = props.eventName || 'demo:test';
				var namespace = props.namespace || 'myApp';
				return "// Subscribe to an event\n" +
					"var unsub = Funky.PubSub.on('" + eventName + "', function(data) {\n" +
					"  console.log('Event received:', data);\n" +
					"});\n\n" +
					"// Subscribe once (auto-removes after first call)\n" +
					"Funky.PubSub.once('" + eventName + "', function(data) {\n" +
					"  console.log('One-time event:', data);\n" +
					"});\n\n" +
					"// Emit an event\n" +
					"Funky.PubSub.emit('" + eventName + "', { message: 'Hello!' });\n\n" +
					"// Unsubscribe\n" +
					"unsub(); // or Funky.PubSub.off('" + eventName + "', handler);\n\n" +
					"// Create namespaced channel\n" +
					"var " + namespace + " = Funky.PubSub.namespace('" + namespace + "');\n" +
					namespace + ".on('action', handler);  // listens to '" + namespace + ":action'\n" +
					namespace + ".emit('action', data);   // emits '" + namespace + ":action'\n\n" +
					"// Query methods\n" +
					"Funky.PubSub.hasListeners('" + eventName + "');  // boolean\n" +
					"Funky.PubSub.listenerCount('" + eventName + "'); // number\n" +
					"Funky.PubSub.eventNames();           // array of all events";
			}
		},
		WebSocket: {
			name: 'WebSocket',
			icon: 'fa-plug-circle-bolt',
			description: 'Real-time connection manager with reconnection, channels, and presence',
			defaultProps: {
				autoConnect: false,
				simulatedLatency: 45,
				simulatedQuality: 'excellent'
			},
			propsSchema: {
				autoConnect: { type: 'boolean', label: 'Auto Connect on Load' },
				simulatedLatency: { type: 'number', label: 'Simulated Latency (ms)', min: 10, max: 500 },
				simulatedQuality: { type: 'select', label: 'Simulated Quality', options: ['excellent', 'good', 'fair', 'poor'] }
			},
			initCode: function(props) {
				var latency = props.simulatedLatency || 45;
				return "// Connect to WebSocket server\n" +
					"Funky.WebSocket.connect();\n\n" +
					"// Check connection status\n" +
					"Funky.WebSocket.isConnected();  // true/false\n" +
					"Funky.WebSocket.getState();     // 'disconnected', 'connecting', 'connected', 'reconnecting'\n\n" +
					"// Subscribe to channels\n" +
					"Funky.WebSocket.subscribe('notifications');\n" +
					"Funky.WebSocket.unsubscribe('notifications');\n\n" +
					"// Send messages\n" +
					"Funky.WebSocket.send('chat:message', { text: 'Hello!' });\n\n" +
					"// Handle messages\n" +
					"Funky.WebSocket.on('chat:message', function(data) {\n" +
					"  console.log('Message:', data);\n" +
					"});\n\n" +
					"// Presence\n" +
					"Funky.WebSocket.setPresenceUser({ id: 'user123', name: 'John' });\n" +
					"Funky.WebSocket.presenceJoin('room:lobby');\n" +
					"Funky.WebSocket.presenceTyping('room:lobby', true);\n\n" +
					"// Connection quality\n" +
					"Funky.WebSocket.getAverageLatency();    // " + latency + "ms\n" +
					"Funky.WebSocket.getConnectionQuality(); // '" + (props.simulatedQuality || 'excellent') + "'";
			}
		},
		Validator: {
			name: 'Validator',
			icon: 'fa-check-double',
			description: 'Generic validation engine with 24 built-in validators',
			defaultProps: {
				testValue: 'test@example.com',
				selectedValidator: 'email'
			},
			propsSchema: {
				testValue: { type: 'string', label: 'Test Value' },
				selectedValidator: { type: 'select', label: 'Validator', options: ['required', 'email', 'url', 'numeric', 'integer', 'alpha', 'alphanumeric', 'phone', 'creditCard'] }
			},
			initCode: function(props) {
				var testVal = props.testValue || 'test@example.com';
				var validator = props.selectedValidator || 'email';
				return "// Validate a single value\n" +
					"var result = Funky.Validator.validate('" + testVal + "', {\n" +
					"  " + validator + ": true\n" +
					"}, { field: { label: 'Email' } });\n" +
					"// result = { valid: true/false, errors: [...] }\n\n" +
					"// Multiple rules\n" +
					"Funky.Validator.validate(value, {\n" +
					"  required: true,\n" +
					"  email: true,\n" +
					"  minLength: 5\n" +
					"});\n\n" +
					"// Register custom validator\n" +
					"Funky.Validator.register('myRule', function(value, options, context) {\n" +
					"  return value.length >= 3 || 'Too short';\n" +
					"});\n\n" +
					"// List all validators\n" +
					"Funky.Validator.list(); // ['required', 'email', 'url', ...]\n\n" +
					"// Async validation (returns Promise)\n" +
					"Funky.Validator.validateAsync(value, rules, context);";
			}
		},
		FocusManager: {
			name: 'FocusManager',
			icon: 'fa-crosshairs',
			description: 'Centralized focus history and navigation with region support',
			defaultProps: {
				showRegionIndicators: true,
				autoDiscoverRegions: true
			},
			propsSchema: {
				showRegionIndicators: { type: 'boolean', label: 'Show Region Indicators' },
				autoDiscoverRegions: { type: 'boolean', label: 'Auto-Discover Regions' }
			},
			initCode: function(props) {
				return "// Push focus to history and move to new element\n" +
					"Funky.FocusManager.focusAndPush(element, {\n" +
					"  preventScroll: false,\n" +
					"  label: 'Dialog'  // For screen readers\n" +
					"});\n\n" +
					"// Return to previous focus\n" +
					"Funky.FocusManager.popFocus();\n\n" +
					"// Region navigation (F6 style)\n" +
					"Funky.FocusManager.discoverRegions();  // Scan data-nav-region\n" +
					"Funky.FocusManager.nextRegion();       // Move to next\n" +
					"Funky.FocusManager.prevRegion();       // Move to previous\n" +
					"Funky.FocusManager.focusRegion('main'); // By name\n\n" +
					"// Focus trap (for modals/dialogs)\n" +
					"var cleanup = Funky.FocusManager.trapFocus(container, {\n" +
					"  autoFocus: true,\n" +
					"  initialFocus: firstInput\n" +
					"});\n" +
					"cleanup(); // Remove trap\n\n" +
					"// Utility\n" +
					"Funky.FocusManager.getFocusableElements(container);\n" +
					"Funky.FocusManager.isFocusable(element);";
			}
		},
		Storage: {
			name: 'Storage',
			icon: 'fa-database',
			description: 'Local storage management with automatic JSON serialization',
			defaultProps: {},
			propsSchema: {},
			initCode: function(props) {
				return "// Store and retrieve data (auto JSON serialization)\n" +
					"Funky.Storage.set('myKey', { user: 'John', prefs: [1, 2, 3] });\n" +
					"var data = Funky.Storage.get('myKey', { default: 'value' });\n\n" +
					"// Raw string storage (no JSON)\n" +
					"Funky.Storage.setRaw('theme', 'dark');\n" +
					"var theme = Funky.Storage.getRaw('theme', 'light');\n\n" +
					"// Remove and clear\n" +
					"Funky.Storage.remove('myKey');\n" +
					"Funky.Storage.clear(); // Remove all funky_ keys";
			}
		},
		Cache: {
			name: 'Cache',
			icon: 'fa-memory',
			description: 'In-memory data cache with TTL and LRU eviction',
			defaultProps: {
				defaultTtl: 300000,
				maxEntries: 500,
				showStats: true
			},
			propsSchema: {
				defaultTtl: { type: 'number', label: 'Default TTL (ms)', min: 1000, max: 3600000 },
				maxEntries: { type: 'number', label: 'Max Entries', min: 10, max: 10000 },
				showStats: { type: 'boolean', label: 'Show Statistics' }
			},
			initCode: function(props) {
				return "// Simple key-value API\n" +
					"Funky.Cache.set('user:123', { name: 'John' });\n" +
					"Funky.Cache.set('temp', data, { ttl: 60000 }); // 1 min TTL\n" +
					"var user = Funky.Cache.get('user:123');\n\n" +
					"// Entity-type API (for API caching)\n" +
					"Funky.Cache.configure('trades', { ttl: 300000, maxEntries: 100 });\n" +
					"Funky.Cache.set('trades', 123, tradeData); // cache by ID\n" +
					"Funky.Cache.setList('trades', tradesArray);  // cache list\n" +
					"var trade = Funky.Cache.get('trades', 123);\n" +
					"var trades = Funky.Cache.getList('trades');\n\n" +
					"// Invalidation\n" +
					"Funky.Cache.invalidate('trades', 123); // Single item\n" +
					"Funky.Cache.clear('trades');           // All trades\n" +
					"Funky.Cache.clearAll();                // Everything\n\n" +
					"// Statistics\n" +
					"var stats = Funky.Cache.getStats(); // { hits, misses, hitRate }";
			}
		},
		Announce: {
			name: 'Announce',
			icon: 'fa-bullhorn',
			description: 'Screen reader announcements via ARIA live regions',
			defaultProps: {
				sampleMessage: 'Content has been updated',
				politeness: 'polite'
			},
			propsSchema: {
				sampleMessage: { type: 'string', label: 'Sample Message' },
				politeness: { type: 'select', label: 'Default Politeness', options: ['polite', 'assertive'] }
			},
			initCode: function(props) {
				return "// Polite announcement (won't interrupt screen reader)\n" +
					"// Use for: updates, loading states, confirmations\n" +
					"Funky.Announce.polite('Loading complete');\n" +
					"Funky.Announce.polite('5 items found');\n\n" +
					"// Assertive announcement (interrupts immediately)\n" +
					"// Use for: errors, urgent alerts, critical information\n" +
					"Funky.Announce.assertive('Error: Please check your input');\n" +
					"Funky.Announce.assertive('Session expired. Please log in again.');\n\n" +
					"// Clear all announcements\n" +
					"Funky.Announce.clear();";
			}
		},
		Date: {
			name: 'Date',
			icon: 'fa-calendar-day',
			description: 'Date utilities for manipulation, comparison, formatting, and calendar grids',
			defaultProps: {
				locale: 'en-US',
				weekStarts: 0
			},
			propsSchema: {
				locale: { type: 'select', label: 'Locale', options: ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP'] },
				weekStarts: { type: 'select', label: 'Week Starts', options: [{ value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }] }
			},
			initCode: function(props) {
				return "// Comparisons\n" +
					"Funky.Date.isSameDay(date1, date2);\n" +
					"Funky.Date.isToday(date);\n" +
					"Funky.Date.isWeekend(date);\n" +
					"Funky.Date.isInRange(date, start, end);\n\n" +
					"// Boundaries\n" +
					"Funky.Date.startOfDay(date);\n" +
					"Funky.Date.endOfDay(date);\n" +
					"Funky.Date.startOfMonth(date);\n" +
					"Funky.Date.startOfWeek(date, " + (props.weekStarts || 0) + ");\n\n" +
					"// Arithmetic\n" +
					"Funky.Date.addDays(date, 5);\n" +
					"Funky.Date.addMonths(date, -1);\n" +
					"Funky.Date.addYears(date, 1);\n\n" +
					"// Formatting\n" +
					"Funky.Date.toDateString(date);  // '2025-01-15'\n" +
					"Funky.Date.toTimeString(date);  // '14:30'\n" +
					"Funky.Date.format(date, { month: 'long', day: 'numeric' }, '" + (props.locale || 'en-US') + "');\n\n" +
					"// Calendar grid (6 weeks x 7 days)\n" +
					"var grid = Funky.Date.generateMonthGrid(date, " + (props.weekStarts || 0) + ");";
			}
		},
		ScrollTracker: {
			name: 'ScrollTracker',
			icon: 'fa-arrows-alt-v',
			description: 'Scroll tracking with direction detection, velocity calculation, and threshold callbacks',
			defaultProps: {
				throttle: 'raf',
				trackDirection: true,
				trackVelocity: true,
				trackHorizontal: false,
				thresholds: [100, 300, 500]
			},
			propsSchema: {
				throttle: { type: 'select', label: 'Throttle Mode', options: ['raf', 'debounce', '16', '32', '50'] },
				trackDirection: { type: 'boolean', label: 'Track Direction' },
				trackVelocity: { type: 'boolean', label: 'Track Velocity' },
				trackHorizontal: { type: 'boolean', label: 'Track Horizontal' },
				thresholds: { type: 'string', label: 'Thresholds (comma-separated)', placeholder: '100, 300, 500' }
			},
			initCode: function(props) {
				var thresholds = props.thresholds || [100, 300, 500];
				if (typeof thresholds === 'string') {
					thresholds = thresholds.split(',').map(function(t) { return parseInt(t.trim(), 10); }).filter(function(t) { return !isNaN(t); });
				}
				return "// Create scroll tracker instance\n" +
					"var tracker = Funky.ScrollTracker.init({\n" +
					"  target: window,  // or selector/element\n" +
					"  throttle: '" + (props.throttle || 'raf') + "',\n" +
					"  trackDirection: " + (props.trackDirection !== false) + ",\n" +
					"  trackVelocity: " + (props.trackVelocity === true) + ",\n" +
					"  trackHorizontal: " + (props.trackHorizontal === true) + ",\n" +
					"  thresholds: " + JSON.stringify(thresholds) + ",\n" +
					"  onScroll: function(data) {\n" +
					"    // data: { scrollY, scrollX, direction, velocity, deltaY, deltaX, timestamp }\n" +
					"    console.log('Scroll:', data.scrollY, data.direction);\n" +
					"  },\n" +
					"  onThreshold: function(data) {\n" +
					"    // data: { threshold, crossed ('above'|'below'), direction, scrollY }\n" +
					"    console.log('Threshold:', data.threshold, data.crossed);\n" +
					"  }\n" +
					"});\n\n" +
					"// API methods\n" +
					"tracker.getState();   // Get current state\n" +
					"tracker.isActive();   // Check if tracking\n" +
					"tracker.stop();       // Pause tracking\n" +
					"tracker.start();      // Resume tracking\n" +
					"tracker.destroy();    // Clean up";
			}
		},
		AuditViewer: {
			name: 'AuditViewer',
			icon: 'fa-history',
			description: 'Interactive audit trail visualization with diff viewing and timeline rendering',
			defaultProps: {
				diffView: 'split',
				showTimeline: true,
				maxEntries: 10
			},
			propsSchema: {
				diffView: { type: 'select', label: 'Diff View Mode', options: ['split', 'unified', 'changes'] },
				showTimeline: { type: 'boolean', label: 'Show Timeline' },
				maxEntries: { type: 'number', label: 'Max Timeline Entries', min: 5, max: 50 }
			},
			initCode: function(props) {
				return "// Initialize audit viewer on a container\n" +
					"Funky.AuditViewer.init('audit-container');\n\n" +
					"// Set diff view mode: 'split', 'unified', or 'changes'\n" +
					"Funky.AuditViewer.setDiffView('" + (props.diffView || 'split') + "');\n\n" +
					"// Render diff between old and new values\n" +
					"Funky.AuditViewer.renderDiff(oldValues, newValues, 'diffContainer');\n\n" +
					"// Bindable Interface for LiveBinding\n" +
					"Funky.AuditViewer.setData(auditEntries);  // Replace all\n" +
					"Funky.AuditViewer.addData(newEntry);      // Append/stream\n" +
					"Funky.AuditViewer.getData();              // Get current\n" +
					"Funky.AuditViewer.clearData();            // Clear all\n\n" +
					"// Show detail modal for an entry\n" +
					"Funky.AuditViewer.showDetail(entryId);\n" +
					"Funky.AuditViewer.showChangeDetail(entry);";
			}
		},
		Timezone: {
			name: 'Timezone',
			icon: 'fa-clock',
			description: 'Timezone conversion and formatting',
			defaultProps: {
				timezone: 'UTC',
				format: 'YYYY-MM-DD HH:mm:ss'
			},
			propsSchema: {
				timezone: { type: 'select', label: 'Timezone', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'] },
				format: { type: 'string', label: 'Format String' }
			},
			initCode: function(props) {
				return "// Initialize timezone (detects browser TZ, syncs with server)\n" +
					"Funky.Timezone.initialize().then(function(tz) {\n" +
					"  console.log('Using timezone:', tz);\n" +
					"});\n\n" +
					"// Format with Intl options (default)\n" +
					"var formatted = Funky.Timezone.format('2024-01-15T10:30:00Z');\n\n" +
					"// Format with format string\n" +
					"var custom = Funky.Timezone.format('2024-01-15T10:30:00Z', '" + (props.format || 'YYYY-MM-DD HH:mm:ss') + "');\n\n" +
					"// Or use formatString directly\n" +
					"var str = Funky.Timezone.formatString(new Date(), 'DD/MM/YYYY hh:mm A');\n\n" +
					"// Set timezone manually\n" +
					"Funky.Timezone.setTimezone('" + (props.timezone || 'UTC') + "');";
			}
		},
		SideNav: {
			name: 'SideNav',
			icon: 'fa-bars',
			description: 'Searchable sidebar navigation with flat or grouped items',
			defaultProps: {
				items: [
					{ id: 'dashboard', label: 'Dashboard', icon: 'fa-home', badge: 3 },
					{ id: 'analytics', label: 'Analytics', icon: 'fa-chart-line', children: [
						{ id: 'overview', label: 'Overview' },
						{ id: 'reports', label: 'Reports', badge: 5 },
						{ id: 'realtime', label: 'Real-time' }
					]},
					{ id: 'users', label: 'Users', icon: 'fa-users', children: [
						{ id: 'all-users', label: 'All Users', badge: 42 },
						{ id: 'groups', label: 'Groups' },
						{ id: 'permissions', label: 'Permissions' },
						{ id: 'roles', label: 'Roles' }
					]},
					{ id: 'settings', label: 'Settings', icon: 'fa-cog', children: [
						{ id: 'general', label: 'General' },
						{ id: 'security', label: 'Security' },
						{ id: 'integrations', label: 'Integrations' },
						{ id: 'notifications', label: 'Notifications' }
					]},
					{ id: 'products', label: 'Products', icon: 'fa-box' },
					{ id: 'orders', label: 'Orders', icon: 'fa-shopping-cart', badge: 12 },
					{ id: 'help', label: 'Help & Support', icon: 'fa-question-circle' }
				],
				searchable: true,
				searchPlaceholder: 'Search navigation...',
				collapsible: true,
				sortable: true,
				sortOrder: 'asc',
				responsive: true
			},
			propsSchema: {
				items: { type: 'json', label: 'Navigation Items' },
				searchable: { type: 'boolean', label: 'Show Search' },
				searchPlaceholder: { type: 'string', label: 'Search Placeholder' },
				collapsible: { type: 'boolean', label: 'Collapsible Groups' },
				sortable: { type: 'boolean', label: 'Enable Sorting' },
				sortOrder: { type: 'select', label: 'Default Sort Order', options: ['asc', 'desc', 'none'] },
				responsive: { type: 'boolean', label: 'Responsive Layout' }
			},
			initCode: function(props) {
				return "// Initialize SideNav\n" +
					"var container = document.getElementById('mySidenav');\n" +
					"Funky.SideNav.init(container, {\n" +
					"  items: " + JSON.stringify(props.items || [], null, 2).split('\n').join('\n  ') + ",\n" +
					"  searchable: " + (props.searchable !== false) + ",\n" +
					"  collapsible: " + (props.collapsible !== false) + ",\n" +
					"  sortable: " + (props.sortable !== false) + ",\n" +
					"  onChange: function(item) {\n" +
					"    console.log('Selected:', item.id);\n" +
					"  }\n" +
					"});";
			},
			codeExample: function() {
				return '// Initialize SideNav in a container\n' +
					'var container = document.getElementById(\'mySidenav\');\n\n' +
					'Funky.SideNav.init(container, {\n' +
					'  items: [\n' +
					'    // Icons use fa-xxx format (component prepends "fas ")\n' +
					'    { id: \'home\', label: \'Home\', icon: \'fa-home\' },\n' +
					'    { id: \'dashboard\', label: \'Dashboard\', icon: \'fa-tachometer-alt\' },\n' +
					'    { id: \'settings\', label: \'Settings\', icon: \'fa-cog\', children: [\n' +
					'      { id: \'profile\', label: \'Profile\' },\n' +
					'      { id: \'security\', label: \'Security\' }\n' +
					'    ]}\n' +
					'  ],\n' +
					'  searchable: true,\n' +
					'  searchPlaceholder: \'Search...\',\n' +
					'  collapsible: true,\n' +
					'  sortable: true,\n' +
					'  sortOrder: \'asc\',\n' +
					'  onChange: function(item) {\n' +
					'    console.log(\'Selected:\', item.id);\n' +
					'  },\n' +
					'  onExpand: function(groupId) {\n' +
					'    console.log(\'Expanded:\', groupId);\n' +
					'  },\n' +
					'  onCollapse: function(groupId) {\n' +
					'    console.log(\'Collapsed:\', groupId);\n' +
					'  }\n' +
					'});';
			}
		},
		SideNavPanel: {
			name: 'SideNavPanel',
			icon: 'fa-columns',
			description: 'SideNav with content panels, lazy loading, and animations',
			defaultProps: {
				items: [
					{ id: 'general', label: 'General', icon: 'fa-cog', content: '<div class="p-3"><h4>General Settings</h4><p>Configure general application options here.</p></div>' },
					{ id: 'appearance', label: 'Appearance', icon: 'fa-palette', content: '<div class="p-3"><h4>Appearance</h4><p>Customize the look and feel of your application.</p></div>' },
					{ id: 'privacy', label: 'Privacy', icon: 'fa-shield-alt', content: '<div class="p-3"><h4>Privacy Settings</h4><p>Manage your privacy and security options.</p></div>' },
					{ id: 'notifications', label: 'Notifications', icon: 'fa-bell', content: '<div class="p-3"><h4>Notifications</h4><p>Configure notification preferences.</p></div>' }
				],
				animation: 'fade',
				lazyLoad: true,
				responsive: true
			},
			propsSchema: {
				items: { type: 'json', label: 'Panel Items (with content property)' },
				animation: { type: 'select', label: 'Animation', options: ['none', 'fade', 'slide'] },
				lazyLoad: { type: 'boolean', label: 'Lazy Load Panels' },
				responsive: { type: 'boolean', label: 'Responsive Layout' }
			},
			initCode: function(props) {
				return "// Initialize SideNavPanel\n" +
					"Funky.SideNavPanel.init({\n" +
					"  sidenav: document.getElementById('navContainer'),\n" +
					"  panels: document.getElementById('contentContainer'),\n" +
					"  items: [...],  // Panel items with content\n" +
					"  animation: '" + (props.animation || 'fade') + "',\n" +
					"  lazyLoad: " + (props.lazyLoad !== false) + ",\n" +
					"  onActivate: function(id, panelEl) {\n" +
					"    console.log('Activated:', id);\n" +
					"  }\n" +
					"});";
			},
			codeExample: function() {
				return '// HTML Structure:\n' +
					'// <div class="sidenav-panel-layout">\n' +
					'//   <div id="navContainer" class="funky-sidenav"></div>\n' +
					'//   <div id="contentContainer" class="sidenav-panels"></div>\n' +
					'// </div>\n\n' +
					'// Initialize SideNavPanel\n' +
					'Funky.SideNavPanel.init({\n' +
					'  // Container elements\n' +
					'  sidenav: document.getElementById(\'navContainer\'),\n' +
					'  panels: document.getElementById(\'contentContainer\'),\n\n' +
					'  // Panel items with content (icons use fa-xxx format)\n' +
					'  items: [\n' +
					'    {\n' +
					'      id: \'general\',\n' +
					'      label: \'General\',\n' +
					'      icon: \'fa-cog\',\n' +
					'      content: \'<div class="p-3"><h4>General Settings</h4><p>Content here...</p></div>\'\n' +
					'    },\n' +
					'    {\n' +
					'      id: \'appearance\',\n' +
					'      label: \'Appearance\',\n' +
					'      icon: \'fa-palette\',\n' +
					'      // Can also use a function for lazy-loaded content\n' +
					'      content: function() {\n' +
					'        return \'<div class="p-3"><h4>Appearance</h4></div>\';\n' +
					'      }\n' +
					'    },\n' +
					'    {\n' +
					'      id: \'privacy\',\n' +
					'      label: \'Privacy\',\n' +
					'      icon: \'fa-shield-alt\',\n' +
					'      content: \'<div class="p-3"><h4>Privacy</h4></div>\'\n' +
					'    }\n' +
					'  ],\n\n' +
					'  // Panel animation: \'none\', \'fade\', or \'slide\'\n' +
					'  animation: \'fade\',\n\n' +
					'  // Lazy load panel content (render on first activate)\n' +
					'  lazyLoad: true,\n\n' +
					'  // Pass-through config for the internal SideNav\n' +
					'  sidenavConfig: {\n' +
					'    searchable: true,\n' +
					'    searchPlaceholder: \'Search settings...\',\n' +
					'    collapsible: true,\n' +
					'    sortable: true,\n' +
					'    sortOrder: \'asc\'\n' +
					'  },\n\n' +
					'  // Event callbacks\n' +
					'  onActivate: function(id, panelEl) {\n' +
					'    console.log(\'Activated panel:\', id);\n' +
					'    // panelEl is the DOM element of the panel\n' +
					'  },\n' +
					'  onDeactivate: function(id) {\n' +
					'    console.log(\'Deactivated panel:\', id);\n' +
					'  }\n' +
					'});\n\n' +
					'// CSS: .sidenav-panel-layout is responsive\n' +
					'// - Desktop: side-by-side (nav left, content right)\n' +
					'// - Mobile (<768px): stacked (nav top, content below)';
			}
		},
		VirtualisedList: {
			name: 'VirtualisedList',
			icon: 'fa-list-alt',
			description: 'High-performance virtual scrolling for 100K+ items',
			defaultProps: {
				demoType: 'benchmark',
				itemCount: 100000,
				itemHeight: 40,
				variableHeight: false,
				multiSelect: true,
				showSearch: false
			},
			propsSchema: {
				demoType: { type: 'select', label: 'Demo Type', options: ['benchmark', 'selection', 'search', 'variable'] },
				itemCount: { type: 'number', label: 'Item Count', min: 1000, max: 500000 },
				itemHeight: { type: 'number', label: 'Item Height (px)', min: 20, max: 100 },
				variableHeight: { type: 'boolean', label: 'Variable Height' },
				multiSelect: { type: 'boolean', label: 'Multi-Select' },
				showSearch: { type: 'boolean', label: 'Show Search' }
			},
			initCode: function(props) {
				return "// Initialize VirtualisedList\n" +
					"var list = Funky.VirtualisedList.init('#container', {\n" +
					"  items: myLargeDataArray,  // 100K+ items\n" +
					"  itemHeight: " + (props.itemHeight || 40) + ",\n" +
					"  selectable: '" + (props.multiSelect ? 'multi' : 'single') + "',\n" +
					"  getItemKey: function(item) { return item.id; },\n" +
					"  renderItem: function(item, index) {\n" +
					"    return '<div class=\"item\">' + item.name + '</div>';\n" +
					"  },\n" +
					"  onSelect: function(items, ids) {\n" +
					"    console.log('Selected:', ids.length);\n" +
					"  }\n" +
					"});";
			},
			codeExample: function() {
				return '// Initialise VirtualisedList\n' +
					'var list = Funky.VirtualisedList.init(\'#container\', {\n' +
					'  // Data\n' +
					'  items: myLargeDataArray,  // 100K+ items\n' +
					'  \n' +
					'  // Height configuration\n' +
					'  itemHeight: 40,           // Fixed height (faster)\n' +
					'  // OR variableHeight: true + estimatedItemHeight: 50\n' +
					'  \n' +
					'  // Performance\n' +
					'  overscan: 5,              // Extra items above/below viewport\n' +
					'  \n' +
					'  // Selection\n' +
					'  selectable: \'multi\',      // Multi-select enabled\n' +
					'  \n' +
					'  // Item key for stable identity\n' +
					'  getItemKey: function(item) {\n' +
					'    return item.id;\n' +
					'  },\n' +
					'  \n' +
					'  // Render function\n' +
					'  renderItem: function(item, index) {\n' +
					'    return \'<div class="item">\' + item.name + \'</div>\';\n' +
					'  },\n' +
					'  \n' +
					'  // Selection callback\n' +
					'  onSelect: function(items, ids) {\n' +
					'    console.log(\'Selected:\', ids.length);\n' +
					'  }\n' +
					'});\n\n' +
					'// API Methods\n' +
					'list.scrollToIndex(500);           // Scroll to item\n' +
					'list.getSelected();                // Get selected items\n' +
					'list.updateItem(id, newData);      // Update item\n' +
					'list.filter(fn);                   // Filter items\n' +
					'list.search(query);                // Search with highlight\n' +
					'list.sort(compareFn);              // Sort items';
			}
		},
		Kanban: {
			name: 'Kanban',
			icon: 'fa-columns',
			description: 'Drag-and-drop workflow board with swimlanes, search, filters, and WIP limits',
			defaultProps: {
				columns: [
					{ id: 'backlog', title: 'Backlog', color: '#6c757d' },
					{ id: 'todo', title: 'To Do', color: '#0d6efd' },
					{ id: 'in-progress', title: 'In Progress', color: '#ffc107', limit: 3 },
					{ id: 'review', title: 'Review', color: '#6f42c1' },
					{ id: 'done', title: 'Done', color: '#198754' }
				],
				cardCount: 8,
				showToolbar: true,
				showAddCard: true,
				useSwimlanes: false,
				highlightMatches: true
			},
			propsSchema: {
				columns: { type: 'json', label: 'Columns Configuration' },
				cardCount: { type: 'number', label: 'Sample Card Count', min: 1, max: 20 },
				showToolbar: { type: 'boolean', label: 'Show Toolbar (search/filters)' },
				showAddCard: { type: 'boolean', label: 'Show Add Card Button' },
				useSwimlanes: { type: 'boolean', label: 'Use Swimlanes (by priority)' },
				highlightMatches: { type: 'boolean', label: 'Highlight Search Matches' }
			},
			initCode: function(props) {
				var swimlanesCode = props.useSwimlanes ?
					"  swimlanes: {\n" +
					"    field: 'priority',\n" +
					"    values: ['high', 'medium', 'low'],\n" +
					"    labels: { high: 'High Priority', medium: 'Medium', low: 'Low' }\n" +
					"  },\n" : '';
				return "// Initialize Kanban board\n" +
					"var board = Funky.Kanban.init('#container', {\n" +
					"  columns: " + JSON.stringify(props.columns || [], null, 2).replace(/\n/g, '\n  ') + ",\n" +
					"  cards: [\n" +
					"    { id: 1, column: 'backlog', title: 'Task 1', priority: 'high', assignee: 'Alice' },\n" +
					"    { id: 2, column: 'todo', title: 'Task 2', priority: 'medium', tags: ['bug'] }\n" +
					"  ],\n" +
					"  showToolbar: " + (props.showToolbar !== false) + ",\n" +
					"  showAddCard: " + (props.showAddCard !== false) + ",\n" +
					"  highlightMatches: " + (props.highlightMatches !== false) + ",\n" +
					"  searchableFields: ['title', 'description', 'assignee'],\n" +
					swimlanesCode +
					"  // Callbacks\n" +
					"  onCardMove: function(card, from, to, pos) {\n" +
					"    console.log('Moving:', card.title, 'from', from, 'to', to);\n" +
					"  },\n" +
					"  onCardClick: function(card, el) {\n" +
					"    board.openCardDetail(card.id);\n" +
					"  },\n" +
					"  onColumnLimitReached: function(col, limit) {\n" +
					"    console.warn('WIP limit reached:', col.title, limit);\n" +
					"  }\n" +
					"});\n\n" +
					"// Card Operations\n" +
					"board.addCard({ id: 3, column: 'todo', title: 'New Task' });\n" +
					"board.updateCard(1, { title: 'Updated Title', priority: 'low' });\n" +
					"board.removeCard(2);\n" +
					"board.moveCard(1, 'done', 0);  // Move card to column at position\n\n" +
					"// Column Operations\n" +
					"board.addColumn({ id: 'testing', title: 'Testing', color: '#17a2b8' });\n" +
					"board.removeColumn('testing');\n" +
					"board.getColumns();            // Get all columns\n" +
					"board.getCards('todo');        // Get cards in column\n\n" +
					"// Search & Filter\n" +
					"board.search('bug');           // Full-text search\n" +
					"board.clearSearch();\n" +
					"board.filter({ priority: 'high' });\n" +
					"board.clearFilter('priority');\n" +
					"board.clearAllFilters();\n\n" +
					"// Swimlanes (when enabled)\n" +
					"board.expandAllSwimlanes();\n" +
					"board.collapseAllSwimlanes();\n" +
					"board.toggleSwimlane('high');\n\n" +
					"// Data Operations\n" +
					"board.getData();               // Get all data\n" +
					"board.setData({ columns, cards });\n" +
					"board.clearData();             // Remove all cards\n" +
					"board.refresh();               // Re-render board";
			}
		},
		Navigation: {
			name: 'Navigation',
			icon: 'fa-compass',
			description: 'Responsive navigation with 4 positions (left/right/top/bottom), collapsible sections, and scroll persistence',
			defaultProps: {
				position: 'top',
				collapsed: false,
				persistScroll: true,
				persistCollapse: true,
				storageKey: 'nav-demo'
			},
			propsSchema: {
				position: { type: 'select', label: 'Position', options: ['left', 'right', 'top', 'bottom'] },
				collapsed: { type: 'boolean', label: 'Start Collapsed' },
				persistScroll: { type: 'boolean', label: 'Persist Scroll Position' },
				persistCollapse: { type: 'boolean', label: 'Persist Collapse State' },
				storageKey: { type: 'string', label: 'Storage Key Prefix' }
			},
			initCode: function(props) {
				return '// Initialise navigation with position and persistence\n' +
					'Funky.Navigation.init(\'#main-nav\', {\n' +
					'  position: \'' + props.position + '\',\n' +
					'  persistScroll: ' + props.persistScroll + ',\n' +
					'  persistCollapse: ' + props.persistCollapse + ',\n' +
					'  storageKey: \'' + props.storageKey + '\'\n' +
					'});\n\n' +
					'// Change position programmatically\n' +
					'Funky.NavPosition.setPosition(\'right\');\n\n' +
					'// Get current position\n' +
					'const pos = Funky.NavPosition.getPosition();\n\n' +
					'// Toggle all sections\n' +
					'Funky.Navigation.toggleAll(true);  // Collapse all\n' +
					'Funky.Navigation.toggleAll(false); // Expand all\n\n' +
					'// Toggle specific section\n' +
					'Funky.Navigation.toggleSection(\'dashboard\', true);\n\n' +
					'// Listen for position changes\n' +
					'document.addEventListener(\'funky.navigation.position-changed\', function(e) {\n' +
					'  console.log(\'New position:\', e.detail.position);\n' +
					'});';
			}
		},
		CRUD: {
			name: 'CRUD',
			icon: 'fa-database',
			description: 'Full Create-Read-Update-Delete interface with DataTable, view/edit modals, bulk operations, and audit trail',
			defaultProps: {
				entity: 'products',
				statsEnabled: true,
				bulkEnabled: true,
				auditEnabled: true,
				exportEnabled: true,
				confirmDelete: true,
				pageLength: 10
			},
			propsSchema: {
				entity: { type: 'string', label: 'Entity Name' },
				statsEnabled: { type: 'boolean', label: 'Show Stats Bar' },
				bulkEnabled: { type: 'boolean', label: 'Enable Bulk Operations' },
				auditEnabled: { type: 'boolean', label: 'Show Audit Trail' },
				exportEnabled: { type: 'boolean', label: 'Show Export Button' },
				confirmDelete: { type: 'boolean', label: 'Confirm Delete' },
				pageLength: { type: 'number', label: 'Rows Per Page', min: 5, max: 100 }
			},
			initCode: function(props) {
				return '// Initialise CRUD component\n' +
					'Funky.CRUD.init(\'#crud-container\', {\n' +
					'  entity: \'' + props.entity + '\',\n' +
					'  endpoints: {\n' +
					'    list: \'/api/playground/products\',\n' +
					'    get: \'/api/playground/products/:id\',\n' +
					'    create: \'/api/playground/products\',\n' +
					'    update: \'/api/playground/products/:id\',\n' +
					'    delete: \'/api/playground/products/:id\',\n' +
					'    bulk: \'/api/playground/products/bulk\',\n' +
					'    audit: \'/api/playground/products/:id/audit\'\n' +
					'  },\n' +
					'  columns: [\n' +
					'    { data: \'id\' },\n' +
					'    { data: \'name\' },\n' +
					'    { data: \'sku\' },\n' +
					'    { data: \'status\', render: statusBadge },\n' +
					'    { data: null, actions: [\'view\', \'edit\', \'delete\'] }\n' +
					'  ],\n' +
					'  formSchema: {\n' +
					'    type: \'object\',\n' +
					'    properties: {\n' +
					'      name: { type: \'string\', title: \'Name\' },\n' +
					'      price: { type: \'number\', title: \'Price\' }\n' +
					'    },\n' +
					'    required: [\'name\']\n' +
					'  },\n' +
					'  stats: {\n' +
					'    total: { label: \'Total\', query: {} },\n' +
					'    active: { label: \'Active\', query: { status: \'active\' }, class: \'text-success\' }\n' +
					'  },\n' +
					'  onAfterSave: (data) => console.log(\'Saved:\', data),\n' +
					'  onAfterDelete: (id) => console.log(\'Deleted:\', id)\n' +
					'});';
			}
		},
		TreeView: {
			name: 'TreeView',
			icon: 'fa-sitemap',
			description: 'Hierarchical tree display with expand/collapse, selection, and drag-and-drop',
			defaultProps: {
				data: [
					{
						id: 1,
						label: 'Documents',
						icon: 'fa-folder',
						children: [
							{ id: 11, label: 'Work', icon: 'fa-folder', children: [
								{ id: 111, label: 'Report.pdf', icon: 'fa-file-pdf' },
								{ id: 112, label: 'Presentation.pptx', icon: 'fa-file-powerpoint' }
							]},
							{ id: 12, label: 'Personal', icon: 'fa-folder', children: [
								{ id: 121, label: 'Photos', icon: 'fa-folder' },
								{ id: 122, label: 'Notes.txt', icon: 'fa-file-text' }
							]}
						]
					},
					{
						id: 2,
						label: 'Downloads',
						icon: 'fa-folder',
						children: [
							{ id: 21, label: 'software.zip', icon: 'fa-file-archive' },
							{ id: 22, label: 'image.png', icon: 'fa-file-image' }
						]
					},
					{
						id: 3,
						label: 'Settings',
						icon: 'fa-cog'
					}
				],
				selectable: 'single',
				cascadeSelect: true,
				showGuides: true,
				showSearch: false,
				draggable: false,
				useMorph: true,
				staggerChildren: true,
				highlightMatches: true
			},
			propsSchema: {
				data: { type: 'json', label: 'Tree Data (array of nodes)' },
				selectable: { type: 'select', label: 'Selection Mode', options: ['none', 'single', 'multi'] },
				cascadeSelect: { type: 'boolean', label: 'Cascade Selection (multi mode)' },
				showGuides: { type: 'boolean', label: 'Show Guide Lines' },
				showSearch: { type: 'boolean', label: 'Show Search Input' },
				draggable: { type: 'boolean', label: 'Enable Drag & Drop' },
				useMorph: { type: 'boolean', label: 'Use Morph Animations' },
				staggerChildren: { type: 'boolean', label: 'Stagger Child Animations' },
				highlightMatches: { type: 'boolean', label: 'Highlight Search Matches' }
			},
			initCode: function(props) {
				return '// Initialise TreeView\n' +
					'var tree = Funky.TreeView.init(document.getElementById(\'container\'), {\n' +
					'  data: ' + JSON.stringify(props.data, null, 2).replace(/\n/g, '\n  ') + ',\n' +
					'  selectable: \'' + props.selectable + '\',    // \'none\', \'single\', \'multi\'\n' +
					'  cascadeSelect: ' + props.cascadeSelect + ',  // Multi: cascade to children\n' +
					'  showGuides: ' + props.showGuides + ',        // Indentation guide lines\n' +
					'  showSearch: ' + props.showSearch + ',        // Search input above tree\n' +
					'  draggable: ' + props.draggable + ',          // Drag & drop reordering\n' +
					'  useMorph: ' + props.useMorph + ',            // Smooth animations\n' +
					'  staggerChildren: ' + props.staggerChildren + ', // Stagger child appearance\n' +
					'  highlightMatches: ' + props.highlightMatches + ' // Highlight search matches\n' +
					'});\n\n' +
					'// Events\n' +
					'tree.element.addEventListener(\'funky.treeview.select\', function(e) {\n' +
					'  console.log(\'Selected:\', e.detail.node);\n' +
					'});\n\n' +
					'tree.element.addEventListener(\'funky.treeview.expand\', function(e) {\n' +
					'  console.log(\'Expanded:\', e.detail.node.label);\n' +
					'});\n\n' +
					'tree.element.addEventListener(\'funky.treeview.collapse\', function(e) {\n' +
					'  console.log(\'Collapsed:\', e.detail.node.label);\n' +
					'});\n\n' +
					'// API Methods\n' +
					'tree.expand(1);           // Expand node by ID\n' +
					'tree.collapse(1);         // Collapse node\n' +
					'tree.toggle(1);           // Toggle expand/collapse\n' +
					'tree.expandAll();         // Expand all nodes\n' +
					'tree.collapseAll();       // Collapse all nodes\n' +
					'tree.select(11);          // Select node\n' +
					'tree.deselect(11);        // Deselect node\n' +
					'tree.clearSelection();   // Clear all selections\n' +
					'tree.getSelected();       // Get selected node IDs\n' +
					'tree.filter(\'work\');      // Filter by text\n' +
					'tree.clearFilter();      // Clear filter\n' +
					'tree.addNode(parent, newNode); // Add node\n' +
					'tree.removeNode(id);      // Remove node\n' +
					'tree.undo();              // Undo last action\n' +
					'tree.redo();              // Redo action';
			}
		},
		PushNotification: {
			name: 'Push Notification',
			icon: 'fa-bell',
			description: 'Send browser push notifications with optional delay. Works even after navigating away!',
			defaultProps: {
				title: 'Hello from Funky!',
				body: 'This is a test notification from the Playground.',
				delay: 5
			},
			propsSchema: {
				title: { type: 'string', label: 'Title' },
				body: { type: 'string', label: 'Body Message' },
				delay: { type: 'number', label: 'Delay (seconds)', min: 0, max: 60 }
			},
			initCode: function(props) {
				return '// Request notification permission\n' +
					'const permission = await Notification.requestPermission();\n\n' +
					'// Send via Service Worker (works even after navigating away)\n' +
					'navigator.serviceWorker.ready.then(reg => {\n' +
					'  reg.active.postMessage({\n' +
					'    type: \'SHOW_NOTIFICATION\',\n' +
					'    title: \'' + props.title + '\',\n' +
					'    body: \'' + props.body + '\',\n' +
					'    delay: ' + props.delay + '\n' +
					'  });\n' +
					'});';
			}
		},
		EmptyState: {
			name: 'EmptyState',
			icon: 'fa-inbox',
			description: 'Empty state placeholders with presets, icons, and optional actions',
			defaultProps: {
				type: 'no-data',
				customTitle: '',
				customMessage: '',
				customIcon: '',
				size: 'md',
				variant: '',
				showAction: false,
				actionText: 'Add Item',
				actionIcon: 'fa-plus',
				actionVariant: 'primary',
				showSecondaryAction: false,
				secondaryActionText: 'Learn More',
				animate: true
			},
			propsSchema: {
				type: { 
					type: 'select', 
					label: 'Preset Type', 
					options: ['', 'no-results', 'no-data', 'error', 'offline', 'empty-list', 'empty-table', 'access-denied', 'coming-soon']
				},
				customTitle: { type: 'string', label: 'Custom Title (overrides preset)' },
				customMessage: { type: 'string', label: 'Custom Message (overrides preset)' },
				customIcon: { type: 'string', label: 'Custom Icon (fa-* or URL)' },
				size: { type: 'select', label: 'Size', options: ['sm', 'md', 'lg'] },
				variant: { type: 'select', label: 'Color Variant', options: ['', 'primary', 'success', 'warning', 'danger', 'info'] },
				showAction: { type: 'boolean', label: 'Show Primary Action' },
				actionText: { type: 'string', label: 'Action Button Text' },
				actionIcon: { type: 'string', label: 'Action Button Icon' },
				actionVariant: { type: 'select', label: 'Action Button Variant', options: ['primary', 'secondary', 'success', 'warning', 'danger', 'outline-primary'] },
				showSecondaryAction: { type: 'boolean', label: 'Show Secondary Action' },
				secondaryActionText: { type: 'string', label: 'Secondary Action Text' },
				animate: { type: 'boolean', label: 'Animate In' }
			},
			initCode: function(props) {
				var opts = {};
				if (props.type) opts.type = props.type;
				if (props.customTitle) opts.title = props.customTitle;
				if (props.customMessage) opts.message = props.customMessage;
				if (props.customIcon) opts.icon = props.customIcon;
				if (props.size && props.size !== 'md') opts.size = props.size;
				if (props.variant) opts.variant = props.variant;
				if (props.animate === false) opts.animate = false;
				if (props.showAction) {
					opts.action = {
						text: props.actionText || 'Add Item',
						icon: props.actionIcon || 'fa-plus',
						variant: props.actionVariant || 'primary',
						onClick: 'function() { /* handler */ }'
					};
				}
				if (props.showSecondaryAction) {
					opts.secondaryAction = {
						text: props.secondaryActionText || 'Learn More',
						onClick: 'function() { /* handler */ }'
					};
				}
				return "Funky.EmptyState.show('#container', " + JSON.stringify(opts, null, 2).replace(/"function\(\) \{ \/\* handler \*\/ \}"/g, 'function() { /* handler */ }') + ');';
			},
			codeExample: function() {
				return '// Show preset empty state\n' +
					"Funky.EmptyState.show('#container', { type: 'no-results' });\n\n" +
					'// Show custom empty state with actions\n' +
					"Funky.EmptyState.show('#container', {\n" +
					"  icon: 'fa-folder-open',\n" +
					"  title: 'No files',\n" +
					"  message: 'Upload files to get started',\n" +
					"  size: 'lg',\n" +
					'  action: {\n' +
					"    text: 'Upload Files',\n" +
					"    icon: 'fa-upload',\n" +
					"    variant: 'primary',\n" +
					'    onClick: function() { openUploadModal(); }\n' +
					'  },\n' +
					'  secondaryAction: {\n' +
					"    text: 'Learn More',\n" +
					"    href: '/docs/files'\n" +
					'  }\n' +
					'});\n\n' +
					'// Hide empty state\n' +
					"Funky.EmptyState.hide('#container');\n\n" +
					'// Check if showing\n' +
					"if (Funky.EmptyState.isShowing('#container')) { ... }\n\n" +
					'// Register custom preset\n' +
					"Funky.EmptyState.registerPreset('my-preset', {\n" +
					"  icon: 'fa-star',\n" +
					"  title: 'Custom Empty State',\n" +
					"  message: 'Your custom message here',\n" +
					"  variant: 'primary'\n" +
					'});';
			}
		},
		FileManager: {
			name: 'FileManager',
			icon: 'fa-folder-open',
			description: 'Professional file browser with grid/list views, selection, preview, and bulk actions',
			defaultProps: {
				view: 'grid',
				enableSelection: true,
				enablePreview: true,
				enableBulkActions: true,
				pageLength: 12
			},
			propsSchema: {
				view: { type: 'select', label: 'Default View', options: ['grid', 'list'] },
				enableSelection: { type: 'boolean', label: 'Enable Selection' },
				enablePreview: { type: 'boolean', label: 'Enable Preview' },
				enableBulkActions: { type: 'boolean', label: 'Enable Bulk Actions' },
				pageLength: { type: 'select', label: 'Files Per Page', options: ['6', '12', '24', '48'] }
			},
			initCode: function(props) {
				return "// Initialize file manager in demo mode (no API calls)\n" +
					"var fileManager = Funky.FileManager.init({\n" +
					"  containerSelector: '#fileManagerContainer',\n" +
					"  gridSelector: '#filesGridView',\n" +
					"  listSelector: '#filesListView',\n" +
					"  demoMode: true,\n" +
					"  demoData: demoFiles,  // Static demo data\n" +
					"  pageLength: " + (parseInt(props.pageLength, 10) || 12) + ",\n" +
					"  enableSelection: " + props.enableSelection + ",\n" +
					"  enablePreview: " + props.enablePreview + ",\n" +
					"  enableBulkActions: " + props.enableBulkActions + "\n" +
					"});";
			},
			codeExample: function() {
				return '// File manager with API\n' +
					"var fm = Funky.FileManager.init({\n" +
					"  containerSelector: '#fileManagerContainer',\n" +
					"  gridSelector: '#filesGridView',\n" +
					"  listSelector: '#filesListView',\n" +
					"  apiBaseUrl: '/api/files',\n" +
					"  pageLength: 24,\n" +
					"  enableSelection: true,\n" +
					"  enableBulkActions: true\n" +
					"});\n\n" +
					'// Demo mode (no API)\n' +
					"var fmDemo = Funky.FileManager.init({\n" +
					"  demoMode: true,\n" +
					"  demoData: [...],  // Array of file objects\n" +
					"  demoStats: { total_files: 10, total_size: 1024000 },\n" +
					"  demoFilterOptions: { mime_types: [...], statuses: [...] }\n" +
					"});\n\n" +
					'// Set data programmatically\n' +
					"fm.setData(filesArray);\n\n" +
					'// Refresh view\n' +
					"fm.refresh();\n\n" +
					'// Toggle view\n' +
					"fm.currentView = 'list'; // or 'grid'\n\n" +
					'// Get selected files\n' +
					"var selected = fm.getSelectedFiles();\n\n" +
					'// Clear selection\n' +
					"fm.clearSelection();";
			}
		},
		Truncate: {
			name: 'Truncate',
			icon: 'fa-ellipsis-h',
			description: 'Smart text truncation with show more/less toggle',
			defaultProps: {
				mode: 'chars',
				limit: 100,
				lines: 3,
				moreText: 'Show more',
				lessText: 'Show less',
				animate: true
			},
			propsSchema: {
				mode: { type: 'select', label: 'Mode', options: ['chars', 'lines'] },
				limit: { type: 'number', label: 'Character Limit', min: 10, max: 500 },
				lines: { type: 'select', label: 'Line Limit', options: ['1', '2', '3', '4', '5'] },
				moreText: { type: 'string', label: 'More Text' },
				lessText: { type: 'string', label: 'Less Text' },
				animate: { type: 'boolean', label: 'Animate' }
			},
			initCode: function(props) {
				var opts = {};
				if (props.mode === 'lines') {
					opts.lines = parseInt(props.lines, 10) || 3;
				} else {
					opts.limit = props.limit || 100;
				}
				if (props.moreText && props.moreText !== 'Show more') opts.moreText = props.moreText;
				if (props.lessText && props.lessText !== 'Show less') opts.lessText = props.lessText;
				if (props.animate === false) opts.animate = false;
				return "Funky.Truncate.apply('#my-text', " + JSON.stringify(opts, null, 2) + ');';
			},
			codeExample: function() {
				return '// Apply character-based truncation\n' +
					"Funky.Truncate.apply('#my-text', {\n" +
					'  limit: 100,\n' +
					"  moreText: 'Show more',\n" +
					"  lessText: 'Show less'\n" +
					'});\n\n' +
					'// Apply line-clamp truncation\n' +
					"Funky.Truncate.apply('#my-paragraph', {\n" +
					'  lines: 3\n' +
					'});\n\n' +
					'// Programmatic control\n' +
					"Funky.Truncate.expand('#my-text');\n" +
					"Funky.Truncate.collapse('#my-text');\n" +
					"Funky.Truncate.toggle('#my-text');\n\n" +
					'// Check state\n' +
					"if (Funky.Truncate.isExpanded('#my-text')) { ... }\n\n" +
					'// Utility function\n' +
					"var short = Funky.Truncate.text('Long text here...', 50, '...');\n\n" +
					'// Auto-init from data attributes\n' +
					'// <p data-truncate="100">Long text...</p>\n' +
					'// <p data-truncate-lines="3">Multi-line text...</p>\n' +
					'Funky.Truncate.initAll();';
			}
		},
		Highlight: {
			name: 'Highlight',
			icon: 'fa-highlighter',
			description: 'Text highlighting for search terms and keywords',
			defaultProps: {
				searchTerm: 'Funky',
				secondTerm: '',
				thirdTerm: '',
				caseSensitive: false,
				wholeWord: false,
				animate: true,
				showNavigation: true
			},
			propsSchema: {
				searchTerm: { type: 'string', label: 'Search Term' },
				secondTerm: { type: 'string', label: 'Second Term (optional)' },
				thirdTerm: { type: 'string', label: 'Third Term (optional)' },
				caseSensitive: { type: 'boolean', label: 'Case Sensitive' },
				wholeWord: { type: 'boolean', label: 'Whole Word Only' },
				animate: { type: 'boolean', label: 'Animate Highlights' },
				showNavigation: { type: 'boolean', label: 'Show Navigation Buttons' }
			},
			initCode: function(props) {
				var terms = [props.searchTerm].filter(Boolean);
				if (props.secondTerm) terms.push(props.secondTerm);
				if (props.thirdTerm) terms.push(props.thirdTerm);
				var termsStr = terms.length === 1 ? "'" + terms[0] + "'" : JSON.stringify(terms);
				var opts = {};
				if (props.caseSensitive) opts.caseSensitive = true;
				if (props.wholeWord) opts.wholeWord = true;
				if (props.animate === false) opts.animate = false;
				var optsStr = Object.keys(opts).length > 0 ? ', ' + JSON.stringify(opts, null, 2) : '';
				return "Funky.Highlight.apply('#content', " + termsStr + optsStr + ');';
			},
			codeExample: function() {
				return '// Highlight single term\n' +
					"Funky.Highlight.apply('#content', 'search term');\n\n" +
					'// Highlight multiple terms (different colors)\n' +
					"Funky.Highlight.apply('#content', ['term1', 'term2', 'term3']);\n\n" +
					'// With options\n' +
					"Funky.Highlight.apply('#content', 'term', {\n" +
					'  caseSensitive: true,\n' +
					'  wholeWord: true,\n' +
					'  animate: true\n' +
					'});\n\n' +
					'// Navigation\n' +
					"Funky.Highlight.scrollToFirst('#content');\n" +
					"Funky.Highlight.next('#content');\n" +
					"Funky.Highlight.prev('#content');\n\n" +
					'// Count matches\n' +
					"var count = Funky.Highlight.count('#content', 'term');\n\n" +
					'// Clear highlights\n' +
					"Funky.Highlight.clear('#content');\n\n" +
					'// Utility: mark text string\n' +
					"var html = Funky.Highlight.mark('Some text here', 'text');";
			}
		},
		Clipboard: {
			name: 'Clipboard',
			icon: 'fa-clipboard',
			description: 'Copy to clipboard with visual feedback',
			defaultProps: {
				text: 'Sample text to copy - click the button!',
				showInline: true,
				buttonText: 'Copy',
				showIcon: true,
				successText: 'Copied!',
				duration: 2000,
				showNotification: false
			},
			propsSchema: {
				text: { type: 'string', label: 'Text to Copy' },
				showInline: { type: 'boolean', label: 'Show Inline Field' },
				buttonText: { type: 'string', label: 'Button Text' },
				showIcon: { type: 'boolean', label: 'Show Text' },
				successText: { type: 'string', label: 'Success Message' },
				duration: { type: 'number', label: 'Feedback Duration (ms)', min: 500, max: 5000 },
				showNotification: { type: 'boolean', label: 'Show Global Notification' }
			},
			initCode: function(props) {
				var code = "// Copy text programmatically\n";
				code += "Funky.Clipboard.copy('" + (props.text || 'Hello World').replace(/'/g, "\\'") + "')\n";
				code += "  .then(function() { console.log('Copied!'); })\n";
				code += "  .catch(function(err) { console.error('Failed:', err); });\n\n";
				code += "// Attach to a button\n";
				code += "Funky.Clipboard.attach('#copyBtn', '#targetElement', {\n";
				code += "  successText: '" + (props.successText || 'Copied!') + "',\n";
				code += "  duration: " + (props.duration || 2000) + "\n";
				code += "});\n\n";
				code += "// Declarative: <button data-clipboard=\"#myElement\">Copy</button>";
				return code;
			},
						codeExample: function() {
				return '// Copy text programmatically\n' +
					"Funky.Clipboard.copy('Text to copy').then(fn).catch(fn);\n\n" +
					'// Copy from element\n' +
					"Funky.Clipboard.copyFrom('#codeBlock');\n\n" +
					'// Attach to button (element target)\n' +
					"Funky.Clipboard.attach('#copyBtn', '#targetElement', {\n" +
					"  successText: 'Copied!',\n" +
					"  duration: 2000,\n" +
					'  onSuccess: function() { },\n' +
					'  onError: function() { }\n' +
					'});\n\n' +
					'// Attach to button (static text)\n' +
					"Funky.Clipboard.attach('#copyBtn', 'Static text to copy');\n\n" +
					'// Create inline copy field\n' +
					"Funky.Clipboard.createInline('#container', 'api-key-12345');\n\n" +
					'// Declarative usage:\n' +
					'// <button data-clipboard="#apiKey">Copy</button>\n' +
					'// <button data-clipboard-text="secret-value">Copy Token</button>\n\n' +
					'// Initialize declarative buttons in a container\n' +
					"Funky.Clipboard.init('#myContainer');\n\n" +
					'// Check browser support\n' +
					'if (Funky.Clipboard.isSupported()) { ... }';
			}
		},
		Skeleton: {
			name: 'Skeleton',
			icon: 'fa-spinner',
			description: 'Animated loading placeholders for perceived performance',
			defaultProps: {
				type: 'table',
				rows: 5,
				columns: 4,
				autoHide: true,
				hideDelay: 3000
			},
			propsSchema: {
				type: { type: 'select', label: 'Skeleton Type', options: ['table', 'card', 'list', 'text', 'avatar'] },
				rows: { type: 'number', label: 'Rows / Count', min: 1, max: 20 },
				columns: { type: 'number', label: 'Columns', min: 1, max: 10 },
				autoHide: { type: 'boolean', label: 'Auto-hide after delay' },
				hideDelay: { type: 'number', label: 'Hide Delay (ms)', min: 1000, max: 10000 }
			},
			initCode: function(props) {
				var opts = {
					type: props.type,
					rows: props.rows
				};
				if (props.type === 'table') opts.columns = props.columns;
				if (props.type === 'card') opts.count = props.rows;
				
				return "// Show skeleton loading\n" +
					"Funky.Skeleton.show('#content', " + JSON.stringify(opts, null, 2) + ");\n\n" +
					"// Hide when content is ready\n" +
					"Funky.Skeleton.hide('#content');\n\n" +
					"// Or wrap an async operation\n" +
					"Funky.Skeleton.wrap('#content', function() {\n" +
					"  return fetch('/api/data').then(r => r.json());\n" +
					"}).then(function(data) {\n" +
					"  renderContent(data);\n" +
					"});";
			},
			codeExample: function() {
				return '// Show table skeleton\n' +
					"Funky.Skeleton.show('#table', {\n" +
					"  type: 'table',\n" +
					"  rows: 10,\n" +
					"  columns: 5,\n" +
					"  header: true\n" +
					"});\n\n" +
					'// Show card skeleton\n' +
					"Funky.Skeleton.show('#cards', { type: 'card', count: 6 });\n\n" +
					'// Show list with avatars\n' +
					"Funky.Skeleton.show('#list', {\n" +
					"  type: 'list',\n" +
					"  rows: 8,\n" +
					"  avatar: true\n" +
					"});\n\n" +
					'// Show text paragraph\n' +
					"Funky.Skeleton.show('#content', { type: 'text', lines: 4 });\n\n" +
					'// Hide skeleton\n' +
					"Funky.Skeleton.hide('#content');\n\n" +
					'// Wrap async operation (auto show/hide)\n' +
					"Funky.Skeleton.wrap('#content', fetchData, { type: 'table' })\n" +
					"  .then(render);";
			}
		},
		Spinner: {
			name: 'Spinner',
			icon: 'fa-circle-notch',
			description: 'Versatile loading spinners with multiple styles',
			defaultProps: {
				style: 'border',
				size: 'md',
				variant: 'primary',
				text: ''
			},
			propsSchema: {
				style: { type: 'select', label: 'Spinner Style', options: ['border', 'grow', 'dots', 'pulse', 'ring'] },
				size: { type: 'select', label: 'Size', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
				variant: { type: 'select', label: 'Color', options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] },
				text: { type: 'string', label: 'Loading Text' }
			},
			initCode: function(props) {
				return "// Show spinner in container\n" +
					"Funky.Spinner.show('#content', {\n" +
					"  style: '" + props.style + "',\n" +
					"  size: '" + props.size + "',\n" +
					"  variant: '" + props.variant + "'" +
					(props.text ? ",\n  text: '" + props.text + "'" : '') +
					"\n});\n\n" +
					"// Hide when done\n" +
					"Funky.Spinner.hide('#content');\n\n" +
					"// Or use full-page overlay\n" +
					"const overlay = Funky.Spinner.overlay({ text: 'Loading...' });\n" +
					"overlay.hide();";
			},
			codeExample: function() {
				return '// Show spinner in container\n' +
					"Funky.Spinner.show('#content', {\n" +
					"  style: 'border',\n" +
					"  size: 'md',\n" +
					"  text: 'Loading...'\n" +
					"});\n\n" +
					'// Hide spinner\n' +
					"Funky.Spinner.hide('#content');\n\n" +
					'// Full-page overlay\n' +
					"const overlay = Funky.Spinner.overlay({\n" +
					"  style: 'dots',\n" +
					"  text: 'Please wait...'\n" +
					"});\n" +
					"overlay.hide();\n\n" +
					'// Wrap async operation\n' +
					"Funky.Spinner.wrap('#content', fetchData, {\n" +
					"  style: 'grow',\n" +
					"  text: 'Fetching...'\n" +
					"}).then(render);\n\n" +
					'// Create inline spinner\n' +
					"const spinner = Funky.Spinner.create({\n" +
					"  style: 'border',\n" +
					"  size: 'sm'\n" +
					"});\n" +
					"button.appendChild(spinner);";
			}
		},
		LiveBinding: {
			name: 'LiveBinding',
			icon: 'fa-link',
			description: 'Reactive data binding for elements and components',
			defaultProps: {
				source: 'event',
				template: '<div class="live-binding-demo__item"><strong>{{label}}</strong>: {{value}} <small>{{timestamp|relative}}</small></div>',
				mode: 'prepend',
				max: 5,
				debounce: 0,
				showLoading: false,
				fallback: 'Waiting for events...'
			},
			propsSchema: {
				template: { type: 'json', label: 'HTML Template' },
				mode: {
					type: 'select',
					label: 'Update Mode',
					options: ['prepend', 'append', 'replace'],
					descriptions: {
						'prepend': 'Stack items with newest first',
						'append': 'Stack items with oldest first',
						'replace': 'Replace content each update'
					}
				},
				max: { type: 'number', label: 'Max Items (0 = unlimited)', min: 0, max: 100 },
				debounce: { type: 'number', label: 'Update Delay (ms)', min: 0, max: 5000 },
				fallback: { type: 'string', label: 'Empty Message' }
			},
			initCode: function(props) {
				var mode = props.mode || 'prepend';
				var append = mode !== 'replace';
				var prepend = mode === 'prepend';
				return "// Initialize LiveBinding\n" +
					"var binding = Funky.LiveBinding.bind('#binding-output', {\n" +
					"  source: 'event',\n" +
					"  event: 'demo:live-binding:update',\n" +
					"  template: `" + (props.template || '{{value}}') + "`,\n" +
					"  append: " + append + ",  // " + (append ? 'Stack items' : 'Replace content') + "\n" +
					"  prepend: " + prepend + ", // " + (prepend ? 'Newest first' : 'Oldest first') + "\n" +
					"  max: " + (props.max || 5) + ",          // Limit visible items\n" +
					"  debounce: " + (props.debounce || 0) + ",        // Update delay (ms)\n" +
					"  fallback: '" + (props.fallback || 'Waiting for events...') + "',\n" +
					"  onUpdate: function(data) {\n" +
					"    console.log('Binding updated:', data);\n" +
					"  }\n" +
					"});\n\n" +
					"// Emit data to trigger update\n" +
					"Funky.PubSub.emit('demo:live-binding:update', {\n" +
					"  label: 'Price Update',\n" +
					"  value: (Math.random() * 1000).toFixed(2),\n" +
					"  timestamp: new Date().toISOString()\n" +
					"});\n\n" +
					"// Control binding\n" +
					"binding.pause();   // Pause updates\n" +
					"binding.resume();  // Resume updates\n" +
					"binding.refresh(); // Manual refresh\n" +
					"binding.destroy(); // Clean up";
			},
			codeExample: function() {
				return '// Simple element binding\n' +
					"Funky.LiveBinding.bind('#price', {\n" +
					"  source: 'websocket',\n" +
					"  channel: 'prices',\n" +
					"  key: 'GBPUSD',\n" +
					"  template: '£{{price|number:4}}'\n" +
					"});\n\n" +
					'// Declarative binding (HTML attribute)\n' +
					'// <span data-live-bind="cache:trades:count"></span>\n\n' +
					'// Component binding (DataTable)\n' +
					"Funky.LiveBinding.bindComponent('#trade-table', {\n" +
					"  source: 'websocket',\n" +
					"  channel: 'trades',\n" +
					"  keyField: 'id',\n" +
					"  smartUpdate: true\n" +
					"});\n\n" +
					'// Streaming list with max items\n' +
					"Funky.LiveBinding.bind('#activity', {\n" +
					"  source: 'event',\n" +
					"  event: 'activity:new',\n" +
					"  append: true,\n" +
					"  prepend: true,\n" +
					"  max: 10,\n" +
					"  template: '<li>{{user}} - {{action}}</li>'\n" +
					"});\n\n" +
					'// Form two-way binding\n' +
					"Funky.LiveBinding.bindComponent('#settings-form', {\n" +
					"  source: 'cache',\n" +
					"  key: 'settings',\n" +
					"  twoWay: true,\n" +
					"  onInput: (name, value) => {\n" +
					"    Funky.Cache.update('settings', { [name]: value });\n" +
					"  }\n" +
					"});";
			}
		},
		Diff: {
			name: 'Diff',
			icon: 'fa-columns',
			description: 'Visual diff viewer for text, JSON, and audit comparisons',
			defaultProps: {
				mode: 'split',
				left: 'function processData(items) {\n  // Process data with old algorithm\n  const MAX_ITEMS = 100;\n  const TIMEOUT = 5000;\n  \n  // =============================================\n  // VALIDATION SECTION - UNCHANGED\n  // =============================================\n  // Validate that items is defined\n  if (!items) return [];\n  // Validate that items is an array\n  if (!Array.isArray(items)) return [];\n  // Validate array is not empty\n  if (items.length === 0) return [];\n  // =============================================\n  \n  // Process using old for loop\n  const results = [];\n  for (let i = 0; i < items.length; i++) {\n    results.push(items[i].value);\n  }\n  \n  return results;\n}',
				right: 'function processData(items) {\n  // Process data with new algorithm\n  const MAX_ITEMS = 500;\n  const TIMEOUT = 10000;\n  \n  // =============================================\n  // VALIDATION SECTION - UNCHANGED\n  // =============================================\n  // Validate that items is defined\n  if (!items) return [];\n  // Validate that items is an array\n  if (!Array.isArray(items)) return [];\n  // Validate array is not empty\n  if (items.length === 0) return [];\n  // =============================================\n  \n  // Process using new map syntax\n  const results = items.map(item => item.value);\n  \n  return results;\n}',
				lineNumbers: true,
				wordDiff: true,
				collapseUnchanged: 0
			},
			propsSchema: {
				mode: { type: 'select', label: 'Display Mode', options: ['split', 'side-by-side', 'inline'], descriptions: {
					'split': 'Synchronized scrolling - both panels scroll together',
					'side-by-side': 'Independent scrolling - scroll each panel separately',
					'inline': 'Unified view with +/- markers'
				}},
				left: { type: 'json', label: 'Left/Original Content' },
				right: { type: 'json', label: 'Right/Modified Content' },
				lineNumbers: { type: 'boolean', label: 'Show Line Numbers' },
				wordDiff: { type: 'boolean', label: 'Word-Level Diff' },
				collapseUnchanged: { type: 'number', label: 'Collapse Threshold', description: 'Collapse consecutive unchanged lines when count exceeds this (0 = disabled)' }
			},
			initCode: function(props) {
				return "// Text diff viewer\n" +
					"Funky.Diff.show('#content', {\n" +
					"  left: " + JSON.stringify(props.left) + ",\n" +
					"  right: " + JSON.stringify(props.right) + ",\n" +
					"  mode: '" + props.mode + "',\n" +
					"  lineNumbers: " + props.lineNumbers + ",\n" +
					"  wordDiff: " + props.wordDiff + ",\n" +
					"  collapseUnchanged: " + (props.collapseUnchanged || 0) + "\n" +
					"});";
			},
			codeExample: function() {
				return '// Text diff - side-by-side\n' +
					"const textDiff = Funky.Diff.show('#container', {\n" +
					"  left: 'original text...',\n" +
					"  right: 'modified text...',\n" +
					"  mode: 'side-by-side',  // 'side-by-side', 'inline', 'split'\n" +
					"  lineNumbers: true,\n" +
					"  wordDiff: true,\n" +
					"  collapseUnchanged: 5,  // Collapse unchanged regions\n" +
					"  headers: { left: 'Original', right: 'Modified' }\n" +
					"});\n\n" +
					'// JSON diff - structure-aware\n' +
					"const jsonDiff = Funky.Diff.json('#container', {\n" +
					"  left: { name: 'John', age: 30 },\n" +
					"  right: { name: 'Jane', age: 31, email: 'new@test.com' },\n" +
					"  collapsible: true,\n" +
					"  expandDepth: 2,\n" +
					"  showUnchanged: true\n" +
					"});\n\n" +
					'// Audit trail diff\n' +
					"const auditDiff = Funky.Diff.audit('#container', {\n" +
					"  before: { status: 'active', name: 'John' },\n" +
					"  after: { status: 'inactive', name: 'Jane' },\n" +
					"  action: 'UPDATE',\n" +
					"  user: 'admin@example.com',\n" +
					"  timestamp: '2025-01-15T10:30:00Z',\n" +
					"  hideUnchanged: false\n" +
					"});\n\n" +
					'// Get summary\n' +
					"const summary = Funky.Diff.getSummary(diff.diff);\n" +
					"console.log(summary); // { added: 1, removed: 0, changed: 2, equal: 5 }";
			}
		},
		Typewriter: {
			name: 'Typewriter',
			icon: 'fa-keyboard',
			description: 'Animated typing text effect with configurable speed and modes',
			defaultProps: {
				text: 'Hello, I am a typewriter effect...',
				mode: 'letter',
				speed: 50,
				cursor: true,
				cursorStyle: 'bar',
				cursorBlink: true,
				loop: false,
				deleteSpeed: 30,
				pauseOnComplete: 1000,
				size: '2xl',
				mono: false
			},
			propsSchema: {
				text: { 
					type: 'string', 
					label: 'Text',
					description: 'Text to type. Use | to separate sequences (e.g., "Hello|World|Funky")'
				},
				mode: { 
					type: 'select', 
					label: 'Mode',
					options: ['letter', 'word', 'line'],
					descriptions: {
						'letter': 'Type one character at a time',
						'word': 'Type one word at a time',
						'line': 'Type one line at a time'
					}
				},
				speed: { 
					type: 'number', 
					label: 'Speed (ms)',
					min: 10,
					max: 500,
					description: 'Milliseconds per unit'
				},
				cursor: { 
					type: 'boolean', 
					label: 'Show Cursor'
				},
				cursorStyle: { 
					type: 'select', 
					label: 'Cursor Style',
					options: ['bar', 'underscore', 'block', 'none']
				},
				cursorBlink: { 
					type: 'boolean', 
					label: 'Cursor Blink'
				},
				loop: { 
					type: 'boolean', 
					label: 'Loop',
					description: 'Loop through text sequences'
				},
				deleteSpeed: { 
					type: 'number', 
					label: 'Delete Speed (ms)',
					min: 10,
					max: 200,
					description: 'Speed when deleting (for sequences)'
				},
				pauseOnComplete: { 
					type: 'number', 
					label: 'Pause on Complete (ms)',
					min: 0,
					max: 5000,
					description: 'Pause after completing text'
				},
				size: {
					type: 'select',
					label: 'Size',
					options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
				},
				mono: {
					type: 'boolean',
					label: 'Monospace Font'
				}
			},
			initCode: function(props) {
				var textValue = props.text;
				if (typeof textValue === 'string' && textValue.includes('|')) {
					textValue = textValue.split('|').map(function(s) { return s.trim(); });
				}
				var options = {
					text: textValue,
					mode: props.mode,
					speed: props.speed,
					cursor: props.cursor,
					cursorStyle: props.cursorStyle,
					cursorBlink: props.cursorBlink,
					loop: props.loop
				};
				// Only add optional props if they differ from defaults
				if (props.deleteSpeed !== 30) options.deleteSpeed = props.deleteSpeed;
				if (props.pauseOnComplete !== 1000) options.pauseOnComplete = props.pauseOnComplete;
				if (props.size && props.size !== 'md') options.size = props.size;
				if (props.mono) options.mono = props.mono;
				return "Funky.Typewriter.init('#element', " + JSON.stringify(options, null, 2) + ");";
			},
			codeExample: function() {
				return '// Basic usage\n' +
					"Funky.Typewriter.init('#hero', {\n" +
					"  text: 'Welcome to Funky!',\n" +
					"  mode: 'letter',\n" +
					"  speed: 50\n" +
					"});\n\n" +
					'// Rotating text sequences\n' +
					"Funky.Typewriter.init('#tagline', {\n" +
					"  text: ['Developer', 'Designer', 'Creator'],\n" +
					"  loop: true,\n" +
					"  pauseOnComplete: 2000,\n" +
					"  deleteSpeed: 30\n" +
					"});\n\n" +
					'// Word-by-word typing\n' +
					"Funky.Typewriter.init('#paragraph', {\n" +
					"  text: 'This types one word at a time.',\n" +
					"  mode: 'word',\n" +
					"  speed: 150\n" +
					"});\n\n" +
					'// Programmatic control\n' +
					"const tw = Funky.Typewriter.init('#element', { text: 'Hello' });\n" +
					"tw.pause();   // Pause typing\n" +
					"tw.resume();  // Resume typing\n" +
					"tw.clear();   // Clear and reset\n" +
					"tw.type('New text');  // Type new text\n" +
					"tw.destroy(); // Cleanup\n\n" +
					'// With callbacks\n' +
					"Funky.Typewriter.init('#status', {\n" +
					"  text: 'Loading complete!',\n" +
					"  onComplete: () => console.log('Done!')\n" +
					"});";
			}
		},
		ContextMenu: {
			name: 'ContextMenu',
			icon: 'fa-mouse-pointer',
			description: 'Right-click context menus with submenus and keyboard navigation',
			defaultProps: {
				items: JSON.stringify([
					{ id: 'cut', label: 'Cut' },
					{ id: 'copy', label: 'Copy' },
					{ id: 'paste', label: 'Paste' },
					{ divider: true },
					{ id: 'delete', label: 'Delete', variant: 'danger' }
				], null, 2),
				minWidth: 160,
				maxWidth: 320,
				longPressDelay: 500
			},
			propsSchema: {
				items: { 
					type: 'textarea', 
					label: 'Items (JSON)',
					description: 'JSON array of menu items'
				},
				minWidth: { 
					type: 'number', 
					label: 'Min Width',
					min: 100,
					max: 400,
					description: 'Minimum menu width in pixels'
				},
				maxWidth: { 
					type: 'number', 
					label: 'Max Width',
					min: 200,
					max: 600,
					description: 'Maximum menu width in pixels'
				},
				longPressDelay: { 
					type: 'number', 
					label: 'Long Press Delay (ms)',
					min: 200,
					max: 1500,
					description: 'Touch long-press delay in milliseconds'
				}
			},
			initCode: function(props) {
				return "// Attach to element\n" +
					"Funky.ContextMenu.attach('#my-element', {\n" +
					"  items: " + props.items + ",\n" +
					"  minWidth: " + props.minWidth + ",\n" +
					"  maxWidth: " + props.maxWidth + ",\n" +
					"  onSelect: function(id, target) {\n" +
					"    console.log('Selected:', id);\n" +
					"  }\n" +
					"});";
			},
			codeExample: function() {
				return '// Basic usage\n' +
					"Funky.ContextMenu.attach('.file-item', {\n" +
					"  items: [\n" +
					"    { id: 'open', label: 'Open' },\n" +
					"    { id: 'edit', label: 'Edit' },\n" +
					"    { divider: true },\n" +
					"    { id: 'delete', label: 'Delete', variant: 'danger' }\n" +
					"  ],\n" +
					"  onSelect: function(id, target) {\n" +
					"    console.log('Selected:', id, 'on', target);\n" +
					"  }\n" +
					"});\n\n" +
					'// With icons and shortcuts\n' +
					"Funky.ContextMenu.attach('#editor', {\n" +
					"  items: [\n" +
					"    { id: 'cut', icon: 'fa-scissors', label: 'Cut', shortcut: '\u2318X' },\n" +
					"    { id: 'copy', icon: 'fa-copy', label: 'Copy', shortcut: '\u2318C' },\n" +
					"    { id: 'paste', icon: 'fa-paste', label: 'Paste', shortcut: '\u2318V' }\n" +
					"  ]\n" +
					"});\n\n" +
					'// With submenus\n' +
					"Funky.ContextMenu.attach('.row', {\n" +
					"  items: [\n" +
					"    { id: 'export', label: 'Export As', items: [\n" +
					"      { id: 'pdf', label: 'PDF' },\n" +
					"      { id: 'csv', label: 'CSV' },\n" +
					"      { id: 'json', label: 'JSON' }\n" +
					"    ]}\n" +
					"  ]\n" +
					"});\n\n" +
					'// Dynamic items based on target\n' +
					"Funky.ContextMenu.attach('.data-row', {\n" +
					"  items: function(target) {\n" +
					"    var id = target.dataset.id;\n" +
					"    return [\n" +
					"      { id: 'view', label: 'View #' + id },\n" +
					"      { id: 'edit', label: 'Edit' },\n" +
					"      { divider: true },\n" +
					"      { id: 'delete', label: 'Delete', variant: 'danger' }\n" +
					"    ];\n" +
					"  }\n" +
					"});\n\n" +
					'// Attach to window (global context menu)\n' +
					"Funky.ContextMenu.attach(window, {\n" +
					"  items: [\n" +
					"    { id: 'refresh', label: 'Refresh' },\n" +
					"    { id: 'settings', label: 'Settings' }\n" +
					"  ]\n" +
					"});\n\n" +
					'// Programmatic show\n' +
					"Funky.ContextMenu.show(100, 200, {\n" +
					"  items: [{ id: 'action', label: 'Action' }]\n" +
					"});\n\n" +
					'// Hide and cleanup\n' +
					"Funky.ContextMenu.hide();\n" +
					"Funky.ContextMenu.destroy('.file-item');";
			}
		},

		FuzzySearch: {
			name: 'FuzzySearch',
			icon: 'fa-magnifying-glass',
			description: 'Fuzzy string matching engine with scoring and highlighting',
			defaultProps: {
				threshold: 0.3,
				caseSensitive: false,
				tokenize: false,
				matchAllTokens: false,
				limit: 10
			},
			propsSchema: {
				threshold: { 
					type: 'range', 
					label: 'Threshold', 
					min: 0, 
					max: 1, 
					step: 0.1,
					description: 'Minimum score (0-1) for match'
				},
				caseSensitive: { 
					type: 'checkbox', 
					label: 'Case Sensitive',
					description: 'Enable case-sensitive matching'
				},
				tokenize: { 
					type: 'checkbox', 
					label: 'Tokenize',
					description: 'Split query into space-separated tokens'
				},
				matchAllTokens: { 
					type: 'checkbox', 
					label: 'Match All Tokens',
					description: 'Require all tokens to match (when tokenize enabled)'
				},
				limit: { 
					type: 'number', 
					label: 'Limit', 
					min: 1, 
					max: 100,
					description: 'Maximum results to return'
				}
			},
			initCode: function(props) {
				return "// Single string match\n" +
					"var result = Funky.FuzzySearch.match('hlo', 'Hello World');\n" +
					"// { score: 0.65, matches: [[0,0], [2,2], [4,4]] }\n\n" +
					"// Search array of objects\n" +
					"var items = [\n" +
					"  { title: 'Dashboard', hint: 'Main overview' },\n" +
					"  { title: 'Settings', hint: 'User preferences' }\n" +
					"];\n\n" +
					"var results = Funky.FuzzySearch.search('dash', items, {\n" +
					"  keys: ['title', 'hint'],\n" +
					"  threshold: " + (props.threshold || 0.3) + ",\n" +
					"  limit: " + (props.limit || 10) + "\n" +
					"});";
			},
			codeExample: function() {
				return '// Single string match\n' +
					"var result = Funky.FuzzySearch.match('usr', 'User Settings');\n" +
					"// { score: 0.75, matches: [[0,0], [1,1], [5,5]] }\n\n" +
					'// Search array with multiple keys\n' +
					"var results = Funky.FuzzySearch.search('sav', items, {\n" +
					"  keys: ['title', 'keywords'],\n" +
					"  threshold: 0.3,\n" +
					"  limit: 10\n" +
					"});\n\n" +
					'// Tokenized search (space-separated)\n' +
					"var results = Funky.FuzzySearch.search('user set', items, {\n" +
					"  keys: ['title'],\n" +
					"  tokenize: true,\n" +
					"  matchAllTokens: true\n" +
					"});\n\n" +
					'// Create configured instance\n' +
					"var searcher = Funky.FuzzySearch.create({\n" +
					"  threshold: 0.4,\n" +
					"  caseSensitive: false\n" +
					"});\n" +
					"var match = searcher.match('query', 'text');";
			},
			render: function(container, props, logEvent) {
				var FuzzySearch = Funky.FuzzySearch;

				if (!FuzzySearch) {
					D.wrap(container).empty().child(
						D.div().style('padding', '24px').style('text-align', 'center').style('color', 'var(--pro-text-muted)').text('FuzzySearch module not loaded')
					);
					return;
				}

				// Demo data
				var sampleItems = [
					{ id: 1, title: 'Dashboard', hint: 'Main overview', keywords: ['home', 'start'] },
					{ id: 2, title: 'Settings', hint: 'User preferences', keywords: ['config', 'options'] },
					{ id: 3, title: 'Search Trades', hint: 'Find trading records', keywords: ['find', 'lookup'] },
					{ id: 4, title: 'New Trade', hint: 'Create a trade', keywords: ['add', 'create'] },
					{ id: 5, title: 'Export Report', hint: 'Download as CSV', keywords: ['download', 'save'] },
					{ id: 6, title: 'Import Data', hint: 'Upload from file', keywords: ['upload', 'load'] },
					{ id: 7, title: 'User Management', hint: 'Manage team members', keywords: ['users', 'team'] },
					{ id: 8, title: 'Notifications', hint: 'Alert settings', keywords: ['alerts', 'messages'] },
					{ id: 9, title: 'Help Center', hint: 'Documentation', keywords: ['docs', 'support'] },
					{ id: 10, title: 'Keyboard Shortcuts', hint: 'View all shortcuts', keywords: ['keys', 'hotkeys'] }
				];

				D.wrap(container).empty();

				// Build UI
				var wrapper = D.create('div')
					.style({
						padding: '24px',
						maxWidth: '600px',
						margin: '0 auto'
					});

				// Header
				var header = D.create('div')
					.style({ marginBottom: '24px' });

				var title = D.create('h3')
					.style({
						margin: '0 0 8px',
						color: 'var(--pro-text-primary)'
					})
					.text('FuzzySearch Demo');

				var subtitle = D.create('p')
					.style({
						margin: 0,
						color: 'var(--pro-text-secondary)',
						fontSize: '14px'
					})
					.text('Type to search ' + sampleItems.length + ' items with fuzzy matching');

				header.append(title, subtitle);

				// Search input wrapper
				var inputWrapper = D.create('div')
					.style({
						position: 'relative',
						marginBottom: '16px'
					});

				var searchIcon = D.create('i')
					.classAdd('fas', 'fa-search')
					.style({
						position: 'absolute',
						left: '12px',
						top: '50%',
						transform: 'translateY(-50%)',
						color: 'var(--pro-text-muted)',
						pointerEvents: 'none'
					});

				var searchInput = D.create('input')
					.attr({
						type: 'text',
						placeholder: 'Try: "dash", "trad", "usr mgmt", "exp rep"...'
					})
					.style({
						width: '100%',
						padding: '12px 12px 12px 40px',
						border: '1px solid var(--pro-border-color)',
						borderRadius: '8px',
						fontSize: '16px',
						background: 'var(--pro-bg-primary)',
						color: 'var(--pro-text-primary)',
						outline: 'none',
						boxSizing: 'border-box'
					});

				inputWrapper.append(searchIcon, searchInput);

				// Stats bar
				var statsBar = D.create('div')
					.style({
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '8px 0',
						marginBottom: '8px',
						fontSize: '13px',
						color: 'var(--pro-text-muted)'
					});

				var statsLeft = D.create('span').text('');
				var statsRight = D.create('span').text('');
				statsBar.append(statsLeft, statsRight);

				// Results list
				var resultsList = D.create('div')
					.style({
						border: '1px solid var(--pro-border-color)',
						borderRadius: '8px',
						overflow: 'hidden'
					});

				// Helper functions
				function getScoreColor(score) {
					if (score >= 0.8) return '#22c55e';
					if (score >= 0.6) return '#3b82f6';
					if (score >= 0.4) return '#f59e0b';
					return '#ef4444';
				}

				function renderResults(results, query) {
					resultsList.html('');

					if (results.length === 0 && query) {
						var empty = D.create('div')
							.style({
								padding: '24px',
								textAlign: 'center',
								color: 'var(--pro-text-muted)'
							})
							.text('No matches found');
						resultsList.append(empty);
						return;
					}

					if (results.length === 0) {
						var hint = D.create('div')
							.style({
								padding: '24px',
								textAlign: 'center',
								color: 'var(--pro-text-muted)'
							})
							.text('Start typing to search...');
						resultsList.append(hint);
						return;
					}

					results.forEach(function(result, idx) {
						var item = result.item;
						var row = D.create('div')
							.style({
								display: 'flex',
								alignItems: 'center',
								padding: '12px 16px',
								gap: '12px',
								borderBottom: idx < results.length - 1 ? '1px solid var(--pro-border-color)' : 'none',
								background: 'var(--pro-bg-primary)'
							});

						// Score badge
						var scoreBadge = D.create('span')
							.style({
								flexShrink: '0',
								padding: '2px 8px',
								borderRadius: '4px',
								fontSize: '11px',
								fontWeight: '600',
								fontFamily: 'monospace',
								background: getScoreColor(result.score),
								color: '#fff'
							})
							.text((result.score * 100).toFixed(0) + '%');

						// Content
						var content = D.create('div')
							.style({ flex: '1' });

						// Highlighted title
						var titleHtml = result.key === 'title' && result.matches 
							? FuzzySearch.highlight(item.title, result.matches)
							: item.title;
						var titleEl = D.create('div')
							.style({
								fontWeight: '500',
								color: 'var(--pro-text-primary)'
							})
							.html(titleHtml);

						// Hint
						var hintEl = D.create('div')
							.style({
								fontSize: '13px',
								color: 'var(--pro-text-secondary)'
							})
							.text(item.hint);

						content.append(titleEl, hintEl);

						// Match key indicator
						var keyBadge = D.create('span')
							.style({
								fontSize: '11px',
								color: 'var(--pro-text-muted)',
								fontFamily: 'monospace'
							})
							.text(result.key || 'title');

						row.append(scoreBadge, content, keyBadge);
						resultsList.append(row);
					});
				}

				function doSearch() {
					var query = searchInput.el.value.trim();
					var startTime = performance.now();

					if (!query) {
						statsLeft.text('');
						statsRight.text('');
						renderResults([], '');
						return;
					}

					var results = FuzzySearch.search(query, sampleItems, {
						keys: ['title', 'hint', 'keywords'],
						threshold: props.threshold || 0.3,
						caseSensitive: props.caseSensitive || false,
						tokenize: props.tokenize || false,
						matchAllTokens: props.matchAllTokens || false,
						limit: props.limit || 10
					});

					var elapsed = (performance.now() - startTime).toFixed(2);
					statsLeft.text(results.length + ' of ' + sampleItems.length + ' matches');
					statsRight.text(elapsed + 'ms');

					logEvent('search', { query: query, results: results.length, time: elapsed + 'ms' });
					renderResults(results, query);
				}

				// Debounced search
				var searchTimeout;
				searchInput.on('input', function() {
					clearTimeout(searchTimeout);
					searchTimeout = setTimeout(doSearch, 100);
				});

				// Focus styling
				searchInput.on('focus', function() {
					searchInput.style({ borderColor: 'var(--pro-accent-primary)' });
				});
				searchInput.on('blur', function() {
					searchInput.style({ borderColor: 'var(--pro-border-color)' });
				});

				// Assemble
				wrapper.append(header, inputWrapper, statsBar, resultsList);

				// Append to container
				if (container.appendChild) {
					container.appendChild(wrapper.el);
				} else {
					container.append(wrapper);
				}

				// Initial render
				renderResults([], '');

				// Focus input
				setTimeout(function() {
					searchInput.el.focus();
				}, 100);
			}
		},

		History: {
			name: 'History',
			icon: 'fa-history',
			description: 'LRU history tracking with persistence and batch operations',
			defaultProps: {
				key: 'demo_history',
				namespace: '',
				maxItems: 5,
				persist: true,
				dedupe: true,
				emitEvents: true
			},
			propsSchema: {
				key: { 
					type: 'string', 
					label: 'Storage Key',
					description: 'Key for localStorage persistence'
				},
				namespace: { 
					type: 'string', 
					label: 'Namespace',
					description: 'Prefix to prevent key collisions'
				},
				maxItems: { 
					type: 'number', 
					label: 'Max Items', 
					min: 1, 
					max: 50,
					description: 'Maximum items to keep in history'
				},
				persist: { 
					type: 'checkbox', 
					label: 'Persist',
					description: 'Save to localStorage'
				},
				dedupe: { 
					type: 'checkbox', 
					label: 'Deduplicate',
					description: 'Move existing items to front instead of duplicating'
				},
				emitEvents: { 
					type: 'checkbox', 
					label: 'Emit Events',
					description: 'Emit PubSub events on changes'
				}
			},
			initCode: function(props) {
				return "// Create a history instance\n" +
					"var history = Funky.History.create({\n" +
					"  key: '" + (props.key || 'demo_history') + "',\n" +
					(props.namespace ? "  namespace: '" + props.namespace + "',\n" : "") +
					"  maxItems: " + (props.maxItems || 5) + ",\n" +
					"  persist: " + (props.persist !== false) + ",\n" +
					"  dedupe: " + (props.dedupe !== false) + "\n" +
					"});\n\n" +
					"// Add items\n" +
					"history.add('item1');\n" +
					"history.add('item2');\n\n" +
					"// Get items\n" +
					"var items = history.getAll();\n" +
					"var first = history.first();";
			},
			codeExample: function() {
				return '// Create named history\n' +
					"var history = Funky.History.create({\n" +
					"  key: 'recent_searches',\n" +
					"  namespace: 'my_app',\n" +
					"  maxItems: 10,\n" +
					"  persist: true,\n" +
					"  onChange: function(action, data) {\n" +
					"    console.log(action, data);\n" +
					"  }\n" +
					"});\n\n" +
					'// Add items (most recent at front)\n' +
					"history.add('search query');\n" +
					"history.addAll(['a', 'b', 'c']);\n\n" +
					'// Batch operations (single event)\n' +
					"history.batch(function() {\n" +
					"  this.add('x').add('y').add('z');\n" +
					"});\n\n" +
					'// Query methods\n' +
					"history.has('query');  // true/false\n" +
					"history.first();       // Most recent\n" +
					"history.last();        // Oldest\n" +
					"history.size();        // Count\n" +
					"history.getAll();      // All items\n\n" +
					'// Modify\n' +
					"history.remove('item');\n" +
					"history.clear();\n" +
					"history.setMaxItems(5);\n\n" +
					'// Persistence\n' +
					"history.reload();  // Reload from storage\n" +
					"history.save();    // Force save\n\n" +
					'// Get existing instance\n' +
					"var same = Funky.History.get('recent_searches');";
			}
		},

		Keyboard: {
			name: 'Keyboard',
			icon: 'fa-keyboard',
			description: 'Centralized keyboard shortcut manager with scopes and help overlay',
			defaultProps: {},
			propsSchema: {},
			initCode: function(props) {
				return "// Register a global shortcut\n" +
					"Funky.Keyboard.register({\n" +
					"  key: 'k',\n" +
					"  mod: true,\n" +
					"  handler: function() { openSearch(); },\n" +
					"  description: 'Quick search',\n" +
					"  group: 'Navigation'\n" +
					"});";
			},
			codeExample: function() {
				return '// Register a shortcut\n' +
					"var unregister = Funky.Keyboard.register({\n" +
					"  key: 's',\n" +
					"  mod: true,\n" +
					"  handler: function() { save(); },\n" +
					"  description: 'Save document',\n" +
					"  group: 'Editor'\n" +
					"});\n\n" +
					'// Scoped to element (active when focused)\n' +
					"Funky.Keyboard.register({\n" +
					"  key: 'space',\n" +
					"  scope: '#video-player',\n" +
					"  handler: function() { togglePlay(); },\n" +
					"  description: 'Play/Pause',\n" +
					"  group: 'Video'\n" +
					"});\n\n" +
					'// Modal scope management\n' +
					"function openModal() {\n" +
					"  Funky.Keyboard.pushScope('modal');\n" +
					"}\n" +
					"function closeModal() {\n" +
					"  Funky.Keyboard.popScope();\n" +
					"}\n\n" +
					'// Show help overlay (F1)\n' +
					"Funky.Keyboard.showHelp();\n\n" +
					'// Format shortcut for display\n' +
					"Funky.Keyboard.formatShortcut({ key: 's', mod: true });\n" +
					"// Mac: '⌘S', Windows: 'Ctrl+S'";
			}
		},

		CommandPalette: {
			name: 'CommandPalette',
			icon: 'fa-terminal',
			description: 'Spotlight-style keyboard-driven command launcher with fuzzy search',
			defaultProps: {
				placeholder: 'Type a command or search...',
				hotkey: 'mod+k',
				maxResults: 10,
				showRecent: true,
				maxRecent: 5,
				closeOnSelect: true,
				showShortcuts: true,
				showContextBadge: false,
				fuzzyThreshold: 0.4
			},
			propsSchema: {
				placeholder: { 
					type: 'string', 
					label: 'Placeholder',
					description: 'Input placeholder text'
				},
				hotkey: { 
					type: 'string', 
					label: 'Hotkey',
					description: 'Keyboard shortcut to open (mod = Cmd/Ctrl)'
				},
				maxResults: { 
					type: 'number', 
					label: 'Max Results', 
					min: 3, 
					max: 50,
					description: 'Maximum results to display'
				},
				showRecent: { 
					type: 'checkbox', 
					label: 'Show Recent',
					description: 'Show recently used commands'
				},
				maxRecent: { 
					type: 'number', 
					label: 'Max Recent', 
					min: 1, 
					max: 20,
					description: 'Maximum recent commands to remember'
				},
				closeOnSelect: { 
					type: 'checkbox', 
					label: 'Close on Select',
					description: 'Close palette after executing command'
				},
				showShortcuts: { 
					type: 'checkbox', 
					label: 'Show Shortcuts',
					description: 'Display keyboard shortcuts on items'
				},
				showContextBadge: { 
					type: 'checkbox', 
					label: 'Show Context Badge',
					description: 'Show context indicator on commands'
				},
				fuzzyThreshold: { 
					type: 'number', 
					label: 'Fuzzy Threshold', 
					min: 0, 
					max: 1,
					step: 0.1,
					description: 'Fuzzy search sensitivity (0 = exact, 1 = loose)'
				}
			},
			initCode: function(props) {
				return "// Initialize Command Palette\n" +
					"Funky.CommandPalette.init({\n" +
					"  placeholder: '" + (props.placeholder || 'Type a command...') + "',\n" +
					"  hotkey: '" + (props.hotkey || 'mod+k') + "',\n" +
					"  maxResults: " + (props.maxResults || 10) + ",\n" +
					"  showRecent: " + (props.showRecent !== false) + ",\n" +
					"  maxRecent: " + (props.maxRecent || 5) + ",\n" +
					"  closeOnSelect: " + (props.closeOnSelect !== false) + ",\n" +
					"  showShortcuts: " + (props.showShortcuts !== false) + "\n" +
					"});\n\n" +
					"// Register a single command\n" +
					"Funky.CommandPalette.register({\n" +
					"  id: 'save',\n" +
					"  title: 'Save Document',\n" +
					"  hint: 'Save current changes',\n" +
					"  icon: 'fa-save',\n" +
					"  category: 'Actions',\n" +
					"  shortcut: 'mod+s',\n" +
					"  action: function() { console.log('Saved!'); }\n" +
					"});\n\n" +
					"// Open programmatically\n" +
					"Funky.CommandPalette.open();";
			},
			codeExample: function() {
				return '// Initialize with options\n' +
					"Funky.CommandPalette.init({\n" +
					"  hotkey: 'mod+k',\n" +
					"  placeholder: 'Search commands...',\n" +
					"  maxResults: 10,\n" +
					"  showRecent: true,\n" +
					"  maxRecent: 5\n" +
					"});\n\n" +
					'// Register multiple commands\n' +
					"Funky.CommandPalette.registerMany([\n" +
					"  {\n" +
					"    id: 'goto-home',\n" +
					"    title: 'Go to Home',\n" +
					"    hint: 'Navigate to dashboard',\n" +
					"    icon: 'fa-home',\n" +
					"    category: 'Navigation',\n" +
					"    shortcut: 'g h',\n" +
					"    action: function() { window.location = '/'; }\n" +
					"  },\n" +
					"  {\n" +
					"    id: 'toggle-theme',\n" +
					"    title: 'Toggle Dark Mode',\n" +
					"    icon: 'fa-moon',\n" +
					"    category: 'View',\n" +
					"    children: [\n" +
					"      { id: 'theme-light', title: 'Light', action: setLightTheme },\n" +
					"      { id: 'theme-dark', title: 'Dark', action: setDarkTheme }\n" +
					"    ]\n" +
					"  }\n" +
					"]);\n\n" +
					'// Context-aware commands\n' +
					"Funky.CommandPalette.registerContext('edit-mode', [\n" +
					"  { id: 'save', title: 'Save', action: save },\n" +
					"  { id: 'undo', title: 'Undo', action: undo }\n" +
					"]);\n" +
					"Funky.CommandPalette.setContext('edit-mode');\n\n" +
					'// Dynamic state\n' +
					"Funky.CommandPalette.enable('save');\n" +
					"Funky.CommandPalette.disable('delete');\n" +
					"Funky.CommandPalette.update('toggle', { title: 'New Title' });\n\n" +
					'// API search sub-palette\n' +
					"Funky.CommandPalette.openSearch({\n" +
					"  api: '/api/users/search',\n" +
					"  placeholder: 'Search users...',\n" +
					"  transform: function(data) { return data.users; },\n" +
					"  onSelect: function(user) { goToUser(user.id); }\n" +
					"});";
			},
			render: function(container, props, logEvent) {
				var CommandPalette = Funky.CommandPalette;

				if (!CommandPalette) {
					D.wrap(container).empty().child(
						D.div().style('padding', '24px').style('text-align', 'center').style('color', 'var(--pro-text-muted)').text('CommandPalette module not loaded')
					);
					return;
				}

				// Demo commands
				var demoCommands = [
					// Navigation
					{
						id: 'nav-home',
						title: 'Go to Home',
						hint: 'Navigate to dashboard',
						icon: 'fa-home',
						category: 'Navigation',
						shortcut: 'g h',
						action: function() { showDemoToast('Navigating to Home'); }
					},
					{
						id: 'nav-settings',
						title: 'Open Settings',
						hint: 'User preferences',
						icon: 'fa-cog',
						category: 'Navigation',
						shortcut: 'g s',
						action: function() { showDemoToast('Opening Settings'); }
					},
					{
						id: 'nav-profile',
						title: 'View Profile',
						hint: 'Your account',
						icon: 'fa-user',
						category: 'Navigation',
						action: function() { showDemoToast('Opening Profile'); }
					},
					// Actions
					{
						id: 'action-new',
						title: 'Create New Item',
						hint: 'Add something new',
						icon: 'fa-plus',
						category: 'Actions',
						shortcut: 'mod+n',
						action: function() { showDemoToast('Creating new item'); }
					},
					{
						id: 'action-save',
						title: 'Save',
						hint: 'Save current changes',
						icon: 'fa-save',
						category: 'Actions',
						shortcut: 'mod+s',
						action: function() { showDemoToast('Saved!'); }
					},
					{
						id: 'action-delete',
						title: 'Delete',
						hint: 'Remove selected item',
						icon: 'fa-trash',
						category: 'Actions',
						action: function() { showDemoToast('Deleted!'); }
					},
					// View
					{
						id: 'view-fullscreen',
						title: 'Toggle Fullscreen',
						hint: 'Enter/exit fullscreen mode',
						icon: 'fa-expand',
						category: 'View',
						shortcut: 'f11',
						action: function() { showDemoToast('Toggling fullscreen'); }
					},
					{
						id: 'view-sidebar',
						title: 'Toggle Sidebar',
						hint: 'Show/hide navigation',
						icon: 'fa-bars',
						category: 'View',
						shortcut: 'mod+b',
						action: function() { showDemoToast('Toggling sidebar'); }
					},
					// Sub-palette example
					{
						id: 'theme-switcher',
						title: 'Change Theme',
						hint: 'Select color theme',
						icon: 'fa-palette',
						category: 'View',
						children: [
							{
								id: 'theme-light',
								title: 'Light Theme',
								icon: 'fa-sun',
								action: function() { showDemoToast('Switched to light theme'); }
							},
							{
								id: 'theme-dark',
								title: 'Dark Theme',
								icon: 'fa-moon',
								action: function() { showDemoToast('Switched to dark theme'); }
							},
							{
								id: 'theme-system',
								title: 'System Theme',
								icon: 'fa-desktop',
								action: function() { showDemoToast('Using system theme'); }
							}
						]
					},
					// Help
					{
						id: 'help-docs',
						title: 'View Documentation',
						hint: 'Open help center',
						icon: 'fa-book',
						category: 'Help',
						shortcut: '?',
						action: function() { showDemoToast('Opening documentation'); }
					},
					{
						id: 'help-shortcuts',
						title: 'Keyboard Shortcuts',
						hint: 'View all shortcuts',
						icon: 'fa-keyboard',
						category: 'Help',
						action: function() { showDemoToast('Showing keyboard shortcuts'); }
					}
				];

				// Toast helper for demo
				function showDemoToast(message) {
					if (typeof Funky !== 'undefined' && Funky.Toast) {
						Funky.Toast.info(message);
					} else {
						console.log('[Demo]', message);
					}
					logEvent('command:executed', { message: message });
				}

				// Destroy previous instance if exists
				if (CommandPalette.getState && CommandPalette.getState().initialized) {
					CommandPalette.destroy();
				}

				// Initialize with playground props
				CommandPalette.init(props);

				// Register demo commands
				CommandPalette.registerMany(demoCommands);

				// Subscribe to events for logging
				if (Funky.PubSub) {
					var events = [
						'funky:palette:open',
						'funky:palette:close', 
						'funky:palette:execute',
						'funky:palette:search',
						'funky:palette:navigate'
					];
					events.forEach(function(eventName) {
						Funky.PubSub.on(eventName, function(data) {
							logEvent(eventName.replace('funky:palette:', ''), data);
						});
					});
				}

				D.wrap(container).empty();

				// Build demo UI
				var wrapper = D.create('div')
					.style({
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '40px',
						textAlign: 'center',
						minHeight: '300px'
					});

				// Header
				var heading = D.create('h3')
					.style({
						marginBottom: '16px',
						color: 'var(--pro-text-primary)'
					})
					.text('Command Palette Demo');

				// Shortcut hint
				var isMac = navigator.platform.indexOf('Mac') > -1;
				var modKey = isMac ? '⌘' : 'Ctrl';
				var instructions = D.create('p')
					.style({
						marginBottom: '24px',
						color: 'var(--pro-text-secondary)'
					});
				
				var kbd = D.create('kbd')
					.style({
						padding: '4px 8px',
						background: 'var(--pro-bg-tertiary)',
						borderRadius: '4px',
						fontFamily: 'monospace',
						fontSize: '14px'
					})
					.text(modKey + '+K');
				
				instructions.text('Press ');
				instructions.append(kbd);
				instructions.el.appendChild(document.createTextNode(' to open the command palette'));

				// Manual open button
				var openButton = D.create('button')
					.classAdd('btn', 'btn-primary')
					.style({
						display: 'inline-flex',
						alignItems: 'center',
						gap: '8px'
					})
					.on('click', function() {
						CommandPalette.open();
					});
				
				var btnIcon = D.create('i').classAdd('fa', 'fa-search');
				openButton.append(btnIcon);
				openButton.el.appendChild(document.createTextNode(' Open Command Palette'));

				// Info panel
				var infoPanel = D.create('div')
					.style({
						marginTop: '32px',
						padding: '16px',
						background: 'var(--pro-bg-secondary)',
						borderRadius: '8px',
						textAlign: 'left',
						maxWidth: '400px'
					});

				var infoTitle = D.create('h5')
					.style({
						marginBottom: '12px',
						color: 'var(--pro-text-primary)'
					})
					.text('Demo Features');

				var featureList = D.create('ul')
					.style({
						margin: '0',
						paddingLeft: '20px',
						color: 'var(--pro-text-secondary)'
					});

				var features = [
					'12 demo commands across 4 categories',
					'Fuzzy search with highlighting',
					'Keyboard navigation (↑↓ Enter Esc)',
					'Sub-palette for theme selection',
					'Recent commands tracking',
					'Category grouping'
				];

				features.forEach(function(feature) {
					var li = D.create('li')
						.style({ marginBottom: '6px' })
						.text(feature);
					featureList.append(li);
				});

				infoPanel.append(infoTitle, featureList);

				// Assemble
				wrapper.append(heading, instructions, openButton, infoPanel);
				wrapper.appendTo(container);
			}
		},

		DomVsVdom: {
			name: 'Dom vs VDom',
			icon: 'fa-code-compare',
			description: 'Compare Funky.Dom (direct) vs Funky.VDom (virtual) - when to use each',
			defaultProps: {
				scenario: 'create-simple'
			},
			propsSchema: {
				scenario: {
					type: 'select',
					label: 'Scenario',
					options: [
						'create-simple',
						'create-nested',
						'manipulate',
						'update-efficient',
						'when-to-use'
					]
				}
			},
			initCode: function(props) {
				var scenario = props.scenario || 'create-simple';
				var scenarios = {
					'create-simple': '// Creating a simple element\n' +
						'var D = Funky.Dom;\n\n' +
						'// Direct DOM - fast, zero overhead\n' +
						"var card = D.div().class('card').child(\n" +
						"    D.h2().text('Title'),\n" +
						"    D.p().text('Content')\n" +
						');\n' +
						'card.appendTo("#container");\n\n' +
						'// ✅ Winner: Funky.Dom (no VNode allocation needed)',
					
					'create-nested': '// Creating nested structure\n' +
						'var D = Funky.Dom;\n\n' +
						"var list = D.ul().class('items').child(\n" +
						'    D.each([1, 2, 3], function(i) {\n' +
						"        return D.li().class('item').child(\n" +
						"            D.span().class('num').text('#' + i),\n" +
						"            D.button().class('btn').text('Action')\n" +
						'        );\n' +
						'    })\n' +
						');\n\n' +
						'// Same clean API as VDom, but creates real DOM directly',
					
					'manipulate': '// Manipulating existing elements\n' +
						'var D = Funky.Dom;\n\n' +
						'// Select and modify (VDom cannot do this!)\n' +
						"D.one('.card').classAdd('active').show();\n" +
						"D.all('.item').classRemove('hidden');\n\n" +
						'// Toggle class\n' +
						"D.one('.menu').classToggle('open');\n\n" +
						'// Chain operations\n' +
						"D.one('#notification')\n" +
						"    .classRemove('hidden')\n" +
						"    .classAdd('animate-in')\n" +
						"    .on('click', dismiss);\n\n" +
						'// ✅ Winner: Funky.Dom (VDom is for creation, not manipulation)',
					
					'update-efficient': '// Efficient updates to list\n' +
						'var V = Funky.VDom;\n\n' +
						'// When 1 item in 1000 changes, VDom only updates that 1 node\n' +
						'function render(items) {\n' +
						"    return V.ul().class('items').child(\n" +
						'        V.each(items, function(item) {\n' +
						"            return V.li().key(item.id).text(item.name);\n" +
						'        })\n' +
						'    ).build();\n' +
						'}\n\n' +
						'var oldTree = render(oldItems);\n' +
						'var newTree = render(newItems);\n' +
						'var patches = V.diff(oldTree, newTree);\n' +
						'V.patch(container, patches);\n\n' +
						'// ✅ Winner: Funky.VDom (diff/patch is efficient)',
					
					'when-to-use': '// When to use each module\n\n' +
						'// ═══════════════════════════════════════════\n' +
						'// Funky.Dom - Direct DOM (Primary Tool)\n' +
						'// ═══════════════════════════════════════════\n' +
						'// ✅ Toggle classes, show/hide elements\n' +
						'// ✅ One-time element creation\n' +
						'// ✅ Event handling on existing elements\n' +
						'// ✅ Simple DOM manipulation (jQuery replacement)\n' +
						'// ✅ Fast - no VNode overhead\n\n' +
						'// ═══════════════════════════════════════════\n' +
						'// Funky.VDom - Virtual DOM (Reactive UIs)\n' +
						'// ═══════════════════════════════════════════\n' +
						'// ✅ Data-bound lists with frequent updates\n' +
						'// ✅ Complex reactive interfaces\n' +
						'// ✅ When you need diff/patch efficiency\n' +
						'// ✅ State preservation (focus, scroll)\n' +
						'// ⚠️ Initial render is slower (VNode overhead)'
				};
				return scenarios[scenario] || scenarios['create-simple'];
			},
			codeExample: function() {
				return '// Funky.Dom - Direct DOM manipulation\n' +
					'var D = Funky.Dom;\n' +
					"D.one('.card').classAdd('active');\n" +
					"D.div().class('new').text('Created').appendTo('body');\n\n" +
					'// Funky.VDom - Virtual DOM for reactive UIs\n' +
					'var V = Funky.VDom;\n' +
					"var tree = V.div().class('app').child(...).build();\n" +
					'var patches = V.diff(oldTree, newTree);\n' +
					'V.patch(container, patches);';
			}
		},
		Animate: {
			name: 'Animate',
			icon: 'fa-wand-magic-sparkles',
			description: 'Unified animation system with transform utilities, composition, and accessibility',
			defaultProps: {
				demo: 'accessibility',
				animationType: 'fade',
				direction: 'in',
				from: 'right',
				duration: 300,
				easing: 'ease-out',
				stagger: 100
			},
			propsSchema: {
				demo: {
					type: 'select',
					label: 'Demo Type',
					options: ['accessibility', 'transforms', 'composition', 'stagger', 'scroll']
				},
				animationType: {
					type: 'select',
					label: 'Animation',
					options: ['fade', 'slide', 'scale', 'shake']
				},
				direction: {
					type: 'select',
					label: 'Direction',
					options: ['in', 'out']
				},
				from: {
					type: 'select',
					label: 'Slide From',
					options: ['right', 'left', 'top', 'bottom']
				},
				duration: {
					type: 'number',
					label: 'Duration (ms)',
					min: 100,
					max: 2000
				},
				easing: {
					type: 'select',
					label: 'Easing',
					options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']
				},
				stagger: {
					type: 'number',
					label: 'Stagger Delay (ms)',
					min: 50,
					max: 500
				}
			},
			initCode: function(props) {
				var demo = props.demo || 'transforms';
				var code = '';

				if (demo === 'transforms') {
					code = '// Transform Utilities\n\n';
					code += '// Fade animation\n';
					code += "Funky.Animate.fade('#element', 'in');\n";
					code += "Funky.Animate.fade('#element', 'out', { duration: 200 });\n\n";
					code += '// Slide animation\n';
					code += "Funky.Animate.slide('#panel', 'in', { from: 'right' });\n";
					code += "Funky.Animate.slide('#panel', 'out', { from: 'left', duration: 300 });\n\n";
					code += '// Scale animation\n';
					code += "Funky.Animate.scale('#modal', 'in');\n";
					code += "Funky.Animate.scale('#modal', 'out');\n\n";
					code += '// Shake animation (attention)\n';
					code += "Funky.Animate.shake('#form');";
				} else if (demo === 'composition') {
					code = '// Animation Composition\n\n';
					code += '// Sequence - run one after another\n';
					code += 'Funky.Animate.sequence([\n';
					code += "  { element: '#step1', options: { class: 'fade-in' } },\n";
					code += "  { element: '#step2', options: { class: 'slide-in-right' } },\n";
					code += "  { element: '#step3', options: { class: 'fade-in-up' } }\n";
					code += ']).start();\n\n';
					code += '// Parallel - run simultaneously\n';
					code += 'Funky.Animate.parallel([\n';
					code += "  { element: '#hero', options: { class: 'fade-in' } },\n";
					code += "  { element: '#sidebar', options: { class: 'slide-in-left' } }\n";
					code += ']).start();\n\n';
					code += '// Stagger - animate list with delay\n';
					code += "Funky.Animate.stagger('.list-item', {\n";
					code += "  class: 'fade-in-up',\n";
					code += '  stagger: ' + (props.stagger || 100) + ',\n';
					code += '  onComplete: function() { console.log("Done!"); }\n';
					code += '});';
				} else if (demo === 'scroll') {
					code = '// Scroll-Triggered Animations\n\n';
					code += '// HTML Attributes:\n';
					code += '// <div data-animate="fade-in-up"\n';
					code += '//      data-animate-trigger="in-view"\n';
					code += '//      data-animate-once="true">\n';
					code += '//   Animates when scrolled into view\n';
					code += '// </div>\n\n';
					code += '// JavaScript:\n';
					code += 'Funky.PageAnimate.initScrollAnimations();';
				} else if (demo === 'stagger') {
					code = '// Stagger Animations\n\n';
					code += '// HTML:\n';
					code += '// <div data-animate-stagger="100">\n';
					code += '//   <div data-animate="fade-in-up">Item 1</div>\n';
					code += '//   <div data-animate="fade-in-up">Item 2</div>\n';
					code += '//   <div data-animate="fade-in-up">Item 3</div>\n';
					code += '// </div>\n\n';
					code += '// JavaScript:\n';
					code += "Funky.Animate.stagger('.item', {\n";
					code += "  class: 'fade-in-up',\n";
					code += '  stagger: ' + (props.stagger || 100) + '\n';
					code += '});';
				} else if (demo === 'accessibility') {
					code = '// Accessibility Features\n\n';
					code += '// Disable all animations globally\n';
					code += "document.documentElement.setAttribute('data-animations', 'off');\n\n";
					code += '// Re-enable\n';
					code += "document.documentElement.removeAttribute('data-animations');\n\n";
					code += '// Get duration (respects accessibility)\n';
					code += 'var duration = Funky.Animate.getDuration(\n';
					code += '  element,\n';
					code += '  Funky.Animate.DURATION.NORMAL\n';
					code += ');\n';
					code += '// Returns 0 if animations disabled or prefers-reduced-motion\n\n';
					code += '// Duration constants\n';
					code += 'Funky.Animate.DURATION.FAST;    // 150ms - UI components\n';
					code += 'Funky.Animate.DURATION.NORMAL;  // 300ms - Modals, navigation\n';
					code += 'Funky.Animate.DURATION.SLOW;    // 600ms - Page transitions';
				}

				return code;
			}
		},

		Tooltip: {
			name: 'Tooltip',
			icon: 'fa-comment-dots',
			description: 'Lightweight tooltips with multiple triggers and placements',
			defaultProps: {
				placement: 'top',
				trigger: 'hover',
				title: 'Tooltip text',
				html: false,
				delayShow: 0,
				delayHide: 0
			},
			propsSchema: {
				placement: {
					type: 'select',
					label: 'Placement',
					options: ['top', 'bottom', 'left', 'right']
				},
				trigger: {
					type: 'select',
					label: 'Trigger',
					options: ['hover', 'focus', 'click', 'manual']
				},
				title: {
					type: 'text',
					label: 'Tooltip Text'
				},
				html: {
					type: 'checkbox',
					label: 'Allow HTML'
				},
				delayShow: {
					type: 'number',
					label: 'Show Delay (ms)'
				},
				delayHide: {
					type: 'number',
					label: 'Hide Delay (ms)'
				}
			},
			codeGenerator: function(props) {
				var demo = props.demo || 'placements';
				var code = '';

				if (demo === 'placements') {
					code = '// Tooltip Placements\n\n';
					code += '// HTML:\n';
					code += '// <button data-funky-tooltip="Tooltip text" data-placement="top">Top</button>\n';
					code += '// <button data-funky-tooltip="Tooltip text" data-placement="bottom">Bottom</button>\n';
					code += '// <button data-funky-tooltip="Tooltip text" data-placement="left">Left</button>\n';
					code += '// <button data-funky-tooltip="Tooltip text" data-placement="right">Right</button>\n\n';
					code += '// JavaScript:\n';
					code += 'Funky.Tooltip.init(); // Auto-initialize from data attributes';
				} else if (demo === 'triggers') {
					code = '// Tooltip Triggers\n\n';
					code += '// Hover trigger (default)\n';
					code += 'new Funky.Tooltip(\'#btn1\', {\n';
					code += '  title: \'Hover to show\',\n';
					code += '  trigger: \'hover\'\n';
					code += '});\n\n';
					code += '// Click trigger\n';
					code += 'new Funky.Tooltip(\'#btn2\', {\n';
					code += '  title: \'Click to show\',\n';
					code += '  trigger: \'click\'\n';
					code += '});\n\n';
					code += '// Focus trigger\n';
					code += 'new Funky.Tooltip(\'#input1\', {\n';
					code += '  title: \'Focus to show\',\n';
					code += '  trigger: \'focus\'\n';
					code += '});\n\n';
					code += '// Manual control\n';
					code += 'var tooltip = new Funky.Tooltip(\'#btn3\', {\n';
					code += '  title: \'Manual control\',\n';
					code += '  trigger: \'manual\'\n';
					code += '});\n';
					code += 'tooltip.show();\n';
					code += 'tooltip.hide();';
				} else if (demo === 'delays') {
					code = '// Tooltip Delays\n\n';
					code += 'new Funky.Tooltip(\'#btn\', {\n';
					code += '  title: \'Delayed tooltip\',\n';
					code += '  delay: {\n';
					code += '    show: ' + (props.delayShow || 500) + ',  // Wait before showing\n';
					code += '    hide: ' + (props.delayHide || 200) + '   // Wait before hiding\n';
					code += '  }\n';
					code += '});';
				} else if (demo === 'html') {
					code = '// HTML Content Tooltips\n\n';
					code += 'new Funky.Tooltip(\'#btn\', {\n';
					code += '  title: \'<strong>Bold</strong> and <em>italic</em> text\',\n';
					code += '  html: true\n';
					code += '});\n\n';
					code += '// WARNING: Only use html: true with trusted content\n';
					code += '// to prevent XSS vulnerabilities';
				} else if (demo === 'dynamic') {
					code = '// Dynamic Content\n\n';
					code += 'var tooltip = new Funky.Tooltip(\'#btn\', {\n';
					code += '  title: \'Loading...\',\n';
					code += '  trigger: \'manual\'\n';
					code += '});\n\n';
					code += 'tooltip.show();\n\n';
					code += '// Update content dynamically\n';
					code += 'fetchData().then(function(data) {\n';
					code += '  tooltip.setContent(data.message);\n';
					code += '});';
				}

				return code;
			}
		},

		Popover: {
			name: 'Popover',
			icon: 'fa-message',
			description: 'Rich popovers with title and content, click-outside dismissal',
			defaultProps: {
				placement: 'top',
				trigger: 'click',
				title: 'Popover Title',
				content: 'This is the popover content.',
				html: false
			},
			propsSchema: {
				placement: {
					type: 'select',
					label: 'Placement',
					options: ['top', 'bottom', 'left', 'right']
				},
				trigger: {
					type: 'select',
					label: 'Trigger',
					options: ['click', 'hover', 'focus']
				},
				title: {
					type: 'text',
					label: 'Popover Title'
				},
				content: {
					type: 'textarea',
					label: 'Popover Content'
				},
				html: {
					type: 'checkbox',
					label: 'Allow HTML'
				}
			},
			codeGenerator: function(props) {
				var code = '// Popover\n\n';
				code += '// HTML:\n';
				code += '// <button data-funky-popover data-title="' + (props.title || 'Title') + '" data-content="' + (props.content || 'Content') + '" data-placement="' + (props.placement || 'top') + '">Open</button>\n\n';
				code += '// JavaScript:\n';
				code += 'new Funky.Popover(\'#btn\', {\n';
				code += '  title: \'' + (props.title || 'Popover Title') + '\',\n';
				code += '  content: \'' + (props.content || 'Popover content text') + '\',\n';
				code += '  placement: \'' + (props.placement || 'top') + '\',\n';
				code += '  trigger: \'' + (props.trigger || 'click') + '\'';
				if (props.html) {
					code += ',\n  html: true';
				}
				code += '\n});';
				return code;
			}
		},

		InlineEdit: {
			name: 'InlineEdit',
			icon: 'fa-pen-to-square',
			description: 'Click-to-edit any element with automatic API save, validation, and undo',
			defaultProps: {
				type: 'text',
				entity: 'demo',
				id: '1',
				field: 'name',
				value: 'John Smith',
				required: false,
				pattern: '',
				placeholder: ''
			},
			propsSchema: {
				type: {
					type: 'select',
					label: 'Input Type',
					options: ['text', 'number', 'select', 'date', 'textarea']
				},
				entity: {
					type: 'string',
					label: 'Entity Type'
				},
				id: {
					type: 'string',
					label: 'Entity ID'
				},
				field: {
					type: 'string',
					label: 'Field Name'
				},
				value: {
					type: 'string',
					label: 'Initial Value'
				},
				required: {
					type: 'boolean',
					label: 'Required'
				},
				pattern: {
					type: 'string',
					label: 'Regex Pattern'
				},
				placeholder: {
					type: 'string',
					label: 'Placeholder'
				}
			},
			initCode: function(props) {
				var code = '// InlineEdit auto-initializes on .inline-edit elements\n';
				code += '// HTML:\n';
				code += '// <span class="inline-edit"\n';
				code += '//       role="button"\n';
				code += '//       tabindex="0"\n';
				code += '//       data-entity="' + (props.entity || 'client') + '"\n';
				code += '//       data-id="' + (props.id || '123') + '"\n';
				code += '//       data-field="' + (props.field || 'name') + '"';
				if (props.type && props.type !== 'text') {
					code += '\n//       data-type="' + props.type + '"';
				}
				if (props.required) {
					code += '\n//       data-required="true"';
				}
				if (props.pattern) {
					code += '\n//       data-pattern="' + props.pattern + '"';
				}
				code += '>' + (props.value || 'Click to edit') + '</span>\n\n';
				code += '// Get instance programmatically\n';
				code += "var editor = Funky.InlineEdit.getInstance('#myElement');\n\n";
				code += '// Listen to events\n';
				code += "Funky.Events.on('funky.inline-edit.save', function(data) {\n";
				code += "  console.log('Saved:', data.field, '=', data.newValue);\n";
				code += '});';
				return code;
			},
			codeExample: function() {
				return '// Text input (default)\n' +
					'<span class="inline-edit"\n' +
					'      data-entity="client" data-id="123" data-field="name">John</span>\n\n' +
					'// Number with min/max\n' +
					'<span class="inline-edit"\n' +
					'      data-entity="trade" data-id="456" data-field="quantity"\n' +
					'      data-type="number" data-min="1" data-max="1000">100</span>\n\n' +
					'// Select dropdown\n' +
					'<span class="inline-edit"\n' +
					'      data-entity="client" data-id="123" data-field="status"\n' +
					'      data-type="select"\n' +
					'      data-options=\'[{"value":"active","label":"Active"}]\'>Active</span>\n\n' +
					'// Date picker\n' +
					'<span class="inline-edit"\n' +
					'      data-entity="trade" data-id="456" data-field="date"\n' +
					'      data-type="date">2025-01-15</span>\n\n' +
					'// Textarea\n' +
					'<span class="inline-edit"\n' +
					'      data-entity="client" data-id="123" data-field="notes"\n' +
					'      data-type="textarea">Long text...</span>\n\n' +
					'// Keyboard: Enter = save, Escape = cancel, Tab = save & next\n\n' +
					'// LiveBinding integration\n' +
					"var editor = Funky.InlineEdit.getInstance('#field');\n" +
					'editor.bindLive({\n' +
					"  source: 'websocket',\n" +
					"  channel: 'client:123',\n" +
					"  valuePath: 'name'\n" +
					'});';
			}
		},
		RelativeTime: {
			name: 'RelativeTime',
			icon: 'fa-clock',
			description: 'Auto-updating relative timestamps that refresh live',
			defaultProps: {
				showPast: true,
				showFuture: true,
				showAbsolute: true,
				showControls: true
			},
			propsSchema: {
				showPast: {
					type: 'boolean',
					label: 'Show Past Examples'
				},
				showFuture: {
					type: 'boolean',
					label: 'Show Future Examples'
				},
				showAbsolute: {
					type: 'boolean',
					label: 'Show Absolute Threshold'
				},
				showControls: {
					type: 'boolean',
					label: 'Show Pause/Resume Controls'
				}
			},
			initCode: function(props) {
				var code = '// RelativeTime auto-initializes on <time data-relative>\n\n';
				code += '// Format a date programmatically\n';
				code += "var text = Funky.RelativeTime.format('2025-12-24T10:30:00Z');\n";
				code += "// → '2 hours ago'\n\n";
				code += '// Configure globally\n';
				code += 'Funky.RelativeTime.configure({\n';
				code += '  refreshInterval: 60000,\n';
				code += '  thresholdDays: 30,\n';
				code += "  locale: 'en-US'\n";
				code += '});\n\n';
				code += '// Listen for updates\n';
				code += "document.addEventListener('funky.relative-time.update', function(e) {\n";
				code += "  console.log('Updated:', e.detail.newText);\n";
				code += '});';
				return code;
			},
			codeExample: function() {
				return '<!-- Basic relative time -->\n' +
					'<time datetime="2025-12-24T10:30:00Z" data-relative>Loading...</time>\n\n' +
					'<!-- Custom refresh interval (5 seconds) -->\n' +
					'<time datetime="2025-12-24T10:30:00Z" data-relative data-refresh="5000">\n' +
					'  Loading...\n' +
					'</time>\n\n' +
					'<!-- Disable auto-refresh -->\n' +
					'<time datetime="2025-12-24T10:30:00Z" data-relative data-refresh="false">\n' +
					'  Loading...\n' +
					'</time>\n\n' +
					'// DataTable column renderer\n' +
					"{ data: 'created_at', render: Funky.RelativeTime.dtRenderer() }\n\n" +
					'// Manual control\n' +
					'Funky.RelativeTime.pause();\n' +
					'Funky.RelativeTime.resume();\n' +
					'Funky.RelativeTime.refresh();';
			}
		},

		Clock: {
			name: 'Clock',
			icon: 'fa-clock',
			description: 'Real-time ticking clock with digital/analog display, timezone, and countdown',
			defaultProps: {
				style: 'both',
				format: '24h',
				showSeconds: true,
				showDate: 'false',
				timezone: '',
				analogSize: 'lg',
				showMultiple: true
			},
			propsSchema: {
				style: {
					type: 'select',
					label: 'Display Style',
					options: ['digital', 'analog', 'both']
				},
				format: {
					type: 'select',
					label: 'Format',
					options: ['12h', '24h']
				},
				showSeconds: {
					type: 'boolean',
					label: 'Show Seconds'
				},
				showDate: {
					type: 'select',
					label: 'Show Date (digital)',
					options: ['false', 'short', 'long']
				},
				timezone: {
					type: 'string',
					label: 'Timezone (IANA)',
					placeholder: 'America/New_York'
				},
				analogSize: {
					type: 'select',
					label: 'Analog Size',
					options: ['sm', 'md', 'lg', 'xl']
				},
				showMultiple: {
					type: 'boolean',
					label: 'Show World Clocks'
				}
			},
			initCode: function(props) {
				var code = '// Clock auto-initializes on [data-clock]\n\n';
				code += '// Configure globally\n';
				code += 'Funky.Clock.configure({\n';
				code += "  format: '" + (props.format || '24h') + "',\n";
				code += '  showSeconds: ' + (props.showSeconds !== false) + '\n';
				code += '});\n\n';
				code += '// Pause/Resume\n';
				code += 'Funky.Clock.pause();\n';
				code += 'Funky.Clock.resume();\n\n';
				code += '// Listen for ticks\n';
				code += "document.addEventListener('funky.clock.tick', function(e) {\n";
				code += "  console.log('Tick:', e.detail.time);\n";
				code += '});\n\n';
				code += '// Schedule in 30 seconds\n';
				code += 'var taskId = Funky.Clock.after(30000, function() {\n';
				code += "  console.log('30 seconds passed!');\n";
				code += '});\n\n';
				code += '// Repeating every 5 seconds\n';
				code += 'Funky.Clock.after(5000, function() {\n';
				code += "  console.log('Every 5 seconds');\n";
				code += '}, { repeat: true });\n\n';
				code += '// Cancel a scheduled task\n';
				code += 'Funky.Clock.cancel(taskId);\n\n';
				code += '// Countdown timer (5 minutes)\n';
				code += "Funky.Clock.countdown('#my-timer', '5:00');\n\n";
				code += '// Listen for completion\n';
				code += "D.one('#timer').on('funky.clock.countdown-complete', function() {\n";
				code += "  alert('Time is up!');\n";
				code += '});';
				return code;
			},
			codeExample: function() {
				return '<!-- Digital: Basic 24h clock -->\n' +
					'<span data-clock></span>\n\n' +
					'<!-- Digital: 12-hour format -->\n' +
					'<span data-clock data-format="12h"></span>\n\n' +
					'<!-- Digital: Without seconds -->\n' +
					'<span data-clock data-seconds="false"></span>\n\n' +
					'<!-- Digital: With short date -->\n' +
					'<span data-clock data-date="short"></span>\n\n' +
					'<!-- Digital: Different timezone -->\n' +
					'<span data-clock data-timezone="America/New_York"></span>\n\n' +
					'<!-- Analog: Basic 12h round clock -->\n' +
					'<span data-clock data-style="analog"></span>\n\n' +
					'<!-- Analog: 24h with large size -->\n' +
					'<span data-clock data-style="analog" data-format="24h" data-size="xl"></span>\n\n' +
					'<!-- Analog: Without seconds hand -->\n' +
					'<span data-clock data-style="analog" data-seconds="false"></span>\n\n' +
					'<!-- Analog: With timezone -->\n' +
					'<span data-clock data-style="analog" data-timezone="Asia/Tokyo" data-size="lg"></span>\n\n' +
					'<!-- Countdown timer (5 minutes) -->\n' +
					'<span data-clock data-countdown="5:00"></span>\n\n' +
					'<!-- Countdown to specific time -->\n' +
					'<span data-clock data-countdown="2025-12-25T00:00:00"></span>\n\n' +
					'<!-- Large monospace digital -->\n' +
					'<span data-clock class="clock-xl mono"></span>';
			}
		},

		ZeroClick: {
			name: 'ZeroClick',
			icon: 'fa-bolt',
			description: 'Event-to-component automation - trigger actions on events without code',
			defaultProps: {
				showSimpleDemo: true,
				showConditional: true,
				showDebugPanel: true
			},
			propsSchema: {
				showSimpleDemo: { type: 'boolean', label: 'Show Simple Trigger Demo' },
				showConditional: { type: 'boolean', label: 'Show Conditional Demo' },
				showDebugPanel: { type: 'boolean', label: 'Show Debug Panel' }
			},
			initCode: function(props) {
				var code = '// Register a simple trigger\n';
				code += "Funky.ZeroClick.on('funky.user.logged-in', {\n";
				code += "    component: 'Toast',\n";
				code += "    method: 'success',\n";
				code += "    args: ['Welcome back!']\n";
				code += '});\n\n';
				code += '// With debounce\n';
				code += "Funky.ZeroClick.on('funky.search.input', {\n";
				code += "    component: 'Toast',\n";
				code += "    method: 'info',\n";
				code += "    args: ['Searching: {{query}}']\n";
				code += '}, { debounce: 300 });\n\n';
				code += '// Conditional trigger\n';
				code += "Funky.ZeroClick.on('funky.notification.received', {\n";
				code += "    component: 'Toast',\n";
				code += "    method: 'warning',\n";
				code += "    args: ['{{message}}'],\n";
				code += "    condition: '{{priority}} === \"high\"'\n";
				code += '});\n\n';
				code += '// Remove a trigger\n';
				code += 'var id = Funky.ZeroClick.on(...);\n';
				code += 'Funky.ZeroClick.off(id);\n\n';
				code += '// Pause/Resume all\n';
				code += 'Funky.ZeroClick.pause();\n';
				code += 'Funky.ZeroClick.resume();\n\n';
				code += '// Debug mode\n';
				code += 'Funky.ZeroClick.debug(true);';
				return code;
			},
			codeExample: function() {
				return '<!-- Simple attribute syntax -->\n' +
					'<div data-zero-click="funky.user.logged-in -> Toast.success(\'Welcome!\')">' +
					'</div>\n\n' +
					'// JavaScript API\n' +
					"Funky.ZeroClick.on('funky.order.completed', {\n" +
					"    component: 'Toast',\n" +
					"    method: 'success',\n" +
					"    args: ['Order placed!'],\n" +
					'    delay: 500\n' +
					'});';
			}
		},

		Iframe: {
			name: 'Iframe',
			icon: 'fa-window-restore',
			description: 'Secure iframe embedding with embed, modal, and detached modes',
			defaultProps: {
				src: '/playground/pages/iframe-content',
				mode: 'embed',
				width: '100%',
				height: '400px'
			},
			propsSchema: {
				src: {
					type: 'string',
					label: 'Source URL'
				},
				mode: {
					type: 'select',
					label: 'Display Mode',
					options: ['embed', 'modal', 'detached']
				},
				width: {
					type: 'string',
					label: 'Width'
				},
				height: {
					type: 'string',
					label: 'Height'
				}
			},
			initCode: function(props) {
				var code = '// Create an iframe instance\n';
				code += "var iframe = Funky.Iframe.init('#container', {\n";
				code += "  src: '" + (props.src || '/playground/pages/iframe-content') + "',\n";
				code += "  mode: '" + (props.mode || 'embed') + "',\n";
				code += "  width: '" + (props.width || '100%') + "',\n";
				code += "  height: '" + (props.height || '400px') + "',\n";
				code += '  onMessage: function(data) {\n';
				code += "    console.log('Message received:', data);\n";
				code += '  },\n';
				code += '  onClose: function() {\n';
				code += "    console.log('Iframe closed');\n";
				code += '  },\n';
				code += '  onLoad: function() {\n';
				code += "    console.log('Iframe loaded');\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// Methods\n';
				code += 'iframe.show();       // Show modal/trigger window\n';
				code += 'iframe.hide();       // Hide modal/close window\n';
				code += 'iframe.setSrc(url);  // Change source URL\n';
				code += 'iframe.destroy();    // Clean up instance';
				return code;
			},
			codeExample: function() {
				return '// Embed mode - inline iframe\n' +
					"Funky.Iframe.init('#container', {\n" +
					"  src: '/test-runner',\n" +
					"  mode: 'embed',\n" +
					"  height: '500px'\n" +
					'});\n\n' +
					'// Modal mode - opens in modal dialog\n' +
					"Funky.Iframe.init('#trigger', {\n" +
					"  src: '/test-runner',\n" +
					"  mode: 'modal',\n" +
					"  title: 'External Content'\n" +
					'});\n\n' +
					'// Detached mode - opens in new window\n' +
					"Funky.Iframe.init('#container', {\n" +
					"  src: '/test-runner',\n" +
					"  mode: 'detached',\n" +
					"  triggerText: 'Open in New Window'\n" +
					'});\n\n' +
					'// PostMessage communication\n' +
					'// From embedded page:\n' +
					"window.parent.postMessage({ action: 'resize', height: 600 }, '*');";
			}
		},

		Timeline: {
			name: 'Timeline',
			icon: 'fa-stream',
			description: 'Chronological event display with vertical/horizontal layouts, date grouping, and real-time updates',
			defaultProps: {
				orientation: 'vertical',
				groupBy: 'day',
				centered: false,
				density: 'normal',
				showTimestamps: true,
				expandable: true
			},
			propsSchema: {
				orientation: {
					type: 'select',
					label: 'Orientation',
					options: ['vertical', 'horizontal']
				},
				groupBy: {
					type: 'select',
					label: 'Group By',
					options: ['day', 'week', 'month', 'none']
				},
				centered: {
					type: 'boolean',
					label: 'Centered Layout (vertical only)'
				},
				density: {
					type: 'select',
					label: 'Density',
					options: ['compact', 'normal', 'spacious']
				},
				showTimestamps: {
					type: 'boolean',
					label: 'Show Timestamps'
				},
				expandable: {
					type: 'boolean',
					label: 'Expandable Events'
				}
			},
			initCode: function(props) {
				var code = '// Create a timeline\n';
				code += "var timeline = Funky.Timeline.init('#timeline', {\n";
				code += "  orientation: '" + (props.orientation || 'vertical') + "',\n";
				code += "  groupBy: '" + (props.groupBy || 'day') + "',\n";
				if (props.centered) {
					code += '  centered: true,\n';
				}
				if (props.density && props.density !== 'normal') {
					code += "  density: '" + props.density + "',\n";
				}
				code += '  showTimestamps: ' + (props.showTimestamps !== false) + ',\n';
				code += '  expandable: ' + (props.expandable !== false) + '\n';
				code += '});\n\n';
				code += '// Set events\n';
				code += 'timeline.setEvents([\n';
				code += '  {\n';
				code += "    id: 1,\n";
				code += "    title: 'Deployment completed',\n";
				code += "    description: 'Version 2.0 deployed',\n";
				code += '    timestamp: new Date().toISOString(),\n';
				code += "    icon: 'fas fa-rocket',\n";
				code += "    color: 'var(--pro-success)'\n";
				code += '  }\n';
				code += ']);\n\n';
				code += '// Add event dynamically\n';
				code += "timeline.pushEvent({ id: 2, title: 'New event', timestamp: new Date() });\n\n";
				code += '// Listen to events\n';
				code += "Funky.Events.on(el, 'funky.timeline.eventClick', handler);";
				return code;
			},
			codeExample: function() {
				return '// Create timeline with API\n' +
					"var timeline = Funky.Timeline.init('#timeline', {\n" +
					"  api: '/api/events',\n" +
					"  groupBy: 'day',\n" +
					'  lazyLoad: { enabled: true, threshold: 200 }\n' +
					'});\n\n' +
					'// Load and manipulate\n' +
					'timeline.load();              // Load from API\n' +
					'timeline.loadMore();          // Load next page\n' +
					"timeline.filter({ type: 'error' });\n" +
					"timeline.search('deploy');\n\n" +
					'// Real-time updates\n' +
					'timeline.pushEvent(event);    // Add with animation\n' +
					'timeline.updateEvent(event);  // Update with flash\n' +
					'timeline.removeEvent(id);     // Remove with animation\n\n' +
					'// LiveBinding for WebSocket\n' +
					"var timeline = Funky.Timeline.init('#timeline', {\n" +
					'  liveBinding: {\n' +
					'    enabled: true,\n' +
					"    source: 'websocket',\n" +
					"    channel: 'timeline:events'\n" +
					'  }\n' +
					'});';
			}
		},

		Calendar: {
			name: 'Calendar',
			icon: 'fa-calendar-alt',
			description: 'Full-featured event calendar with month, week, day, and agenda views',
			defaultProps: {
				initialView: 'month',
				locale: 'en-GB',
				firstDayOfWeek: 1,
				showWeekNumbers: false
			},
			propsSchema: {
				initialView: {
					type: 'select',
					label: 'Initial View',
					options: ['month', 'week', 'day', 'agenda']
				},
				locale: {
					type: 'select',
					label: 'Locale',
					options: ['en-GB', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP']
				},
				firstDayOfWeek: {
					type: 'select',
					label: 'Week Starts On',
					options: [
						{ value: 0, label: 'Sunday' },
						{ value: 1, label: 'Monday' },
						{ value: 6, label: 'Saturday' }
					]
				},
				showWeekNumbers: {
					type: 'boolean',
					label: 'Show Week Numbers'
				}
			},
			initCode: function(props) {
				var code = '// Initialize Calendar with API\n';
				code += "var calendar = Funky.Calendar.init('#calendar', {\n";
				code += "  api: '/api/events',\n";
				code += "  entity: 'events',\n";
				code += "  view: '" + (props.initialView || 'month') + "',\n";
				code += "  locale: '" + (props.locale || 'en-GB') + "',\n";
				code += '  weekStarts: ' + (props.firstDayOfWeek || 1) + ',\n';
				code += '  showWeekNumbers: ' + (props.showWeekNumbers ? 'true' : 'false') + ',\n';
				code += '  editable: true,\n';
				code += '  clickable: true\n';
				code += '});\n\n';
				code += '// Event handlers (use Funky.Events)\n';
				code += "Funky.Events.on(calendarEl, 'funky.calendar.event-click', function(e) {\n";
				code += "  console.log('Event clicked:', e.detail);\n";
				code += '});\n\n';
				code += "Funky.Events.on(calendarEl, 'funky.calendar.date-select', function(e) {\n";
				code += "  console.log('Date selected:', e.detail.date);\n";
				code += '});';
				return code;
			},
			codeExample: function() {
				return '// Create calendar with API endpoint\n' +
					"var calendar = Funky.Calendar.init('#calendar', {\n" +
					"  api: '/api/events',\n" +
					"  entity: 'events',\n" +
					"  view: 'month',\n" +
					'  editable: true\n' +
					'});\n\n' +
					'// Navigation methods\n' +
					'calendar.prev();         // Previous period\n' +
					'calendar.next();         // Next period\n' +
					'calendar.today();        // Go to today\n' +
					"calendar.gotoDate('2025-06-15');\n\n" +
					'// View changes\n' +
					"calendar.setView('week');\n" +
					"calendar.setView('day');\n" +
					"calendar.setView('agenda');\n\n" +
					'// Listen to events\n' +
					"Funky.Events.on(el, 'funky.calendar.event-click', handler);\n" +
					"Funky.Events.on(el, 'funky.calendar.date-select', handler);\n" +
					"Funky.Events.on(el, 'funky.calendar.navigate', handler);\n" +
					"Funky.Events.on(el, 'funky.calendar.view-change', handler);";
			}
		},
		DatePicker: {
			name: 'DatePicker',
			icon: 'fa-calendar-alt',
			description: 'Native date picker with single date and range selection, time picker support, and presets',
			defaultProps: {
				mode: 'range',
				size: 'default',
				format: 'YYYY-MM-DD',
				showWeekNumbers: false,
				showDropdowns: true,
				autoApply: false,
				timePicker: false,
				timePicker24Hour: true,
				ranges: true,
				placeholder: 'Select date range...',
				minDate: '',
				maxDate: ''
			},
			propsSchema: {
				mode: {
					type: 'select',
					label: 'Selection Mode',
					options: ['single', 'range']
				},
				size: {
					type: 'select',
					label: 'Size',
					options: ['default', 'small', 'compact']
				},
				format: {
					type: 'string',
					label: 'Date Format'
				},
				placeholder: {
					type: 'string',
					label: 'Placeholder Text'
				},
				showWeekNumbers: {
					type: 'boolean',
					label: 'Show Week Numbers'
				},
				showDropdowns: {
					type: 'boolean',
					label: 'Show Month/Year Dropdowns'
				},
				autoApply: {
					type: 'boolean',
					label: 'Auto Apply on Selection'
				},
				timePicker: {
					type: 'boolean',
					label: 'Enable Time Picker'
				},
				timePicker24Hour: {
					type: 'boolean',
					label: '24-Hour Time Format'
				},
				ranges: {
					type: 'boolean',
					label: 'Show Range Presets (range mode)'
				},
				minDate: {
					type: 'string',
					label: 'Min Date (YYYY-MM-DD)'
				},
				maxDate: {
					type: 'string',
					label: 'Max Date (YYYY-MM-DD)'
				}
			},
			initCode: function(props) {
				var lines = [
					'// Create DatePicker',
					"var picker = Funky.DatePicker.init('#myDateInput', {",
					"    mode: '" + (props.mode || 'range') + "',"
				];

				if (props.size && props.size !== 'default') {
					lines.push("    size: '" + props.size + "',");
				}
				lines.push("    format: '" + (props.format || 'YYYY-MM-DD') + "',");

				if (props.timePicker) {
					lines.push('    timePicker: true,');
					lines.push('    timePicker24Hour: ' + (props.timePicker24Hour !== false) + ',');
				}
				if (props.showWeekNumbers) {
					lines.push('    showWeekNumbers: true,');
				}
				if (props.ranges && (props.mode === 'range' || !props.mode)) {
					lines.push('    ranges: true,');
				}
				if (props.minDate) {
					lines.push("    minDate: '" + props.minDate + "',");
				}
				if (props.maxDate) {
					lines.push("    maxDate: '" + props.maxDate + "',");
				}

				lines.push('    autoApply: ' + (props.autoApply !== false));
				lines.push('});');
				lines.push('');
				lines.push('// API Methods');
				lines.push('picker.open();');
				lines.push('picker.getValue();  // Returns Date or {start, end}');
				lines.push('picker.setValue(new Date());');
				if (props.mode === 'range') {
					lines.push('picker.setRange(startDate, endDate);');
				}
				lines.push('picker.destroy();');
				lines.push('');
				lines.push('// Events');
				lines.push("Funky.Events.on(input, 'funky.datepicker.change', function(e) {");
				lines.push("    console.log('Selected:', e.detail.value);");
				lines.push('});');

				return lines.join('\n');
			},
			render: function(container, props, logEvent) {
				// Create demo HTML
				var wrapper = D.div().style('padding', '20px');
				var label = D.create('label')
					.attr('for', 'demo-datepicker')
					.style('display', 'block')
					.style('margin-bottom', '8px')
					.style('font-weight', '500')
					.text('Select Date:');
				var input = D.create('input')
					.attr('type', 'text')
					.attr('id', 'demo-datepicker')
					.classAdd('form-control')
					.style('max-width', '300px')
					.attr('placeholder', props.placeholder || 'Select date...');
				wrapper.child(label, input);

				D.wrap(container).empty().child(wrapper);

				var input = container.querySelector('#demo-datepicker');

				// Build options
				var options = {
					mode: props.mode || 'range',
					size: props.size || 'default',
					format: props.format || 'YYYY-MM-DD',
					showWeekNumbers: props.showWeekNumbers || false,
					showDropdowns: props.showDropdowns !== false,
					autoApply: props.autoApply || false,
					timePicker: props.timePicker || false,
					timePicker24Hour: props.timePicker24Hour !== false
				};

				if (props.ranges && (props.mode === 'range' || !props.mode)) {
					options.ranges = true;
				}
				if (props.minDate) {
					options.minDate = props.minDate;
				}
				if (props.maxDate) {
					options.maxDate = props.maxDate;
				}

				// Create picker
				var picker = Funky.DatePicker.init(input, options);
				container._datepicker = picker;

				// Log events
				Funky.Events.on(input, 'funky.datepicker.open', function() {
					logEvent('open', { timestamp: new Date().toISOString() });
				});

				Funky.Events.on(input, 'funky.datepicker.close', function() {
					logEvent('close', { timestamp: new Date().toISOString() });
				});

				Funky.Events.on(input, 'funky.datepicker.change', function(e) {
					logEvent('change', {
						value: e.detail.value,
						oldValue: e.detail.oldValue
					});
				});

				Funky.Events.on(input, 'funky.datepicker.select', function(e) {
					logEvent('select', e.detail);
				});
			},
			cleanup: function(container) {
				if (container._datepicker) {
					container._datepicker.destroy();
					container._datepicker = null;
				}
			}
		},
		DashboardGrid: {
			name: 'DashboardGrid',
			icon: 'fa-grip',
			description: 'Drag-and-drop dashboard layout with resizable, moveable widgets',
			defaultProps: {
				columns: 12,
				rowHeight: 80,
				gap: 16,
				editable: true,
				editMode: true,
				animate: true
			},
			propsSchema: {
				columns: {
					type: 'number',
					label: 'Columns',
					min: 2,
					max: 24
				},
				rowHeight: {
					type: 'number',
					label: 'Row Height (px)',
					min: 40,
					max: 200
				},
				gap: {
					type: 'number',
					label: 'Gap (px)',
					min: 0,
					max: 32
				},
				editable: {
					type: 'boolean',
					label: 'Editable'
				},
				editMode: {
					type: 'boolean',
					label: 'Edit Mode Active'
				},
				animate: {
					type: 'boolean',
					label: 'Animate Transitions'
				}
			},
			initCode: function(props) {
				var code = '// Initialize DashboardGrid\n';
				code += "var grid = Funky.DashboardGrid.init('#my-grid', {\n";
				code += '  columns: ' + (props.columns || 12) + ',\n';
				code += '  rowHeight: ' + (props.rowHeight || 80) + ',\n';
				code += '  gap: ' + (props.gap || 16) + ',\n';
				code += '  editable: ' + (props.editable !== false) + ',\n';
				code += '  animate: ' + (props.animate !== false) + '\n';
				code += '});\n\n';
				code += '// Add widgets programmatically\n';
				code += "grid.addWidget({\n";
				code += "  id: 'widget-1',\n";
				code += "  title: 'My Widget',\n";
				code += '  col: 1, row: 1, width: 4, height: 2,\n';
				code += "  type: 'html',\n";
				code += "  html: '<p>Hello World</p>'\n";
				code += '});\n\n';
				code += '// Edit mode controls\n';
				code += 'grid.enableEditMode();   // Allow drag/resize\n';
				code += 'grid.disableEditMode();  // Lock layout\n';
				code += 'grid.toggleEditMode();   // Toggle state\n\n';
				code += '// Layout management\n';
				code += 'var layout = grid.getLayout();  // Get current layout\n';
				code += 'grid.setLayout(layout);         // Restore layout\n';
				code += 'grid.clearAll();                // Remove all widgets';
				return code;
			},
			codeExample: function() {
				return '// Initialize with data attributes\n' +
					'<div data-dashboard-grid data-columns="12" data-row-height="80">\n' +
					'  <div data-widget data-col="1" data-row="1" data-width="4" data-height="2"\n' +
					'       data-title="Widget A">Content</div>\n' +
					'</div>\n\n' +
					'// Initialize with JavaScript\n' +
					"var grid = Funky.DashboardGrid.init('#grid', {\n" +
					'  columns: 12,\n' +
					'  rowHeight: 80,\n' +
					'  gap: 16,\n' +
					'  editable: true,\n' +
					"  storageKey: 'my-dashboard'\n" +
					'});\n\n' +
					'// Widget types\n' +
					"grid.addWidget({ type: 'html', content: '<p>HTML</p>' });\n" +
					"grid.addWidget({ type: 'dom', content: myElement });\n" +
					"grid.addWidget({ type: 'component', component: 'StatsBar', config: {} });\n" +
					"grid.addWidget({ type: 'livebinding', api: '/api/data', template: fn });\n\n" +
					'// Events\n' +
					"E.on(gridEl, 'funky.dashboard-grid.widget-move', function(e) {\n" +
					"  console.log('Widget moved:', e.detail);\n" +
					'});\n' +
					"E.on(gridEl, 'funky.dashboard-grid.widget-resize', function(e) {\n" +
					"  console.log('Widget resized:', e.detail);\n" +
					'});\n' +
					"E.on(gridEl, 'funky.dashboard-grid.layout-change', function(e) {\n" +
					"  console.log('Layout changed:', e.detail.layout);\n" +
					'});';
			}
		},
		GestureTracker: {
			name: 'GestureTracker',
			icon: 'fa-hand-pointer',
			description: 'Touch and mouse gesture detection with swipe, tap, long-press, and drag support',
			defaultProps: {
				gestures: 'tap,swipe,longpress',
				swipeThreshold: 50,
				swipeVelocity: 0.3,
				longPressDelay: 500,
				tapThreshold: 10,
				preventDefault: false,
				hapticFeedback: false,
				emitEvents: true
			},
			propsSchema: {
				gestures: {
					type: 'string',
					label: 'Gestures (comma-separated)',
					placeholder: 'tap,swipe,longpress,drag'
				},
				swipeThreshold: {
					type: 'number',
					label: 'Swipe Threshold (px)',
					min: 10,
					max: 200
				},
				swipeVelocity: {
					type: 'number',
					label: 'Swipe Velocity (px/ms)',
					min: 0.1,
					max: 2.0,
					step: 0.1
				},
				longPressDelay: {
					type: 'number',
					label: 'Long Press Delay (ms)',
					min: 100,
					max: 2000
				},
				tapThreshold: {
					type: 'number',
					label: 'Tap Threshold (px)',
					min: 1,
					max: 50
				},
				preventDefault: {
					type: 'boolean',
					label: 'Prevent Default'
				},
				hapticFeedback: {
					type: 'boolean',
					label: 'Haptic Feedback'
				},
				emitEvents: {
					type: 'boolean',
					label: 'Emit PubSub Events'
				}
			},
			initCode: function(props) {
				var gestures = (props.gestures || 'tap,swipe,longpress').split(',');
				var code = '// Create GestureTracker instance\n';
				code += "var gesture = Funky.GestureTracker.init({\n";
				code += "  target: '#my-element',\n";
				code += "  gestures: ['" + gestures.join("', '") + "'],\n";
				code += '  swipeThreshold: ' + (props.swipeThreshold || 50) + ',\n';
				code += '  swipeVelocity: ' + (props.swipeVelocity || 0.3) + ',\n';
				code += '  longPressDelay: ' + (props.longPressDelay || 500) + ',\n';
				code += '  hapticFeedback: ' + (props.hapticFeedback || false) + ',\n';
				code += '  emitEvents: ' + (props.emitEvents !== false) + ',\n';
				code += '  onTap: function(data) {\n';
				code += "    console.log('Tap at', data.x, data.y);\n";
				code += '  },\n';
				code += '  onSwipe: function(data) {\n';
				code += "    console.log('Swipe', data.direction, 'velocity:', data.velocity);\n";
				code += '  },\n';
				code += '  onLongPress: function(data) {\n';
				code += "    console.log('Long press at', data.x, data.y);\n";
				code += '  },\n';
				code += '  onDragStart: function(data) {\n';
				code += "    console.log('Drag started');\n";
				code += '  },\n';
				code += '  onDragMove: function(data) {\n';
				code += "    console.log('Dragging', data.deltaX, data.deltaY);\n";
				code += '  },\n';
				code += '  onDragEnd: function(data) {\n';
				code += "    console.log('Drag ended');\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// API methods\n';
				code += 'gesture.start();     // Start tracking\n';
				code += 'gesture.stop();      // Stop tracking\n';
				code += 'gesture.isActive();  // Check if active\n';
				code += 'gesture.destroy();   // Clean up';
				return code;
			},
			codeExample: function() {
				return '// Basic usage\n' +
					"var gesture = Funky.GestureTracker.init({\n" +
					"  target: '#gesture-area',\n" +
					"  gestures: ['tap', 'swipe', 'longpress', 'drag'],\n" +
					'  onSwipe: function(data) {\n' +
					"    console.log('Swiped', data.direction);\n" +
					'  },\n' +
					'  onLongPress: function(data) {\n' +
					'    showContextMenu(data.x, data.y);\n' +
					'  }\n' +
					'});\n\n' +
					'// PubSub events (if emitEvents: true)\n' +
					"Funky.PubSub.on('funky:gesture:swipe', function(data) {\n" +
					"  console.log('Swipe event:', data.gesture.direction);\n" +
					'});\n\n' +
					'// Cleanup\n' +
					'gesture.destroy();';
			}
		},
		Preferences: {
			name: 'Preferences',
			icon: 'fa-sliders-h',
			description: 'User preferences management for themes, notifications, display settings, and more',
			defaultProps: {
				themeMode: 'dark',
				accentColor: '#0d6efd',
				fontScale: 1.0,
				density: 'comfortable',
				animationsEnabled: true,
				navPosition: 'left',
				sidebarCollapsed: false
			},
			propsSchema: {
				themeMode: {
					type: 'select',
					label: 'Theme Mode',
					options: ['light', 'dark', 'system', 'high-contrast']
				},
				accentColor: {
					type: 'string',
					label: 'Accent Color',
					placeholder: '#0d6efd'
				},
				fontScale: {
					type: 'number',
					label: 'Font Scale',
					min: 0.8,
					max: 1.5,
					step: 0.1
				},
				density: {
					type: 'select',
					label: 'Density',
					options: ['compact', 'comfortable', 'spacious']
				},
				animationsEnabled: {
					type: 'boolean',
					label: 'Animations Enabled'
				},
				navPosition: {
					type: 'select',
					label: 'Navigation Position',
					options: ['left', 'right', 'top', 'bottom']
				},
				sidebarCollapsed: {
					type: 'boolean',
					label: 'Sidebar Collapsed'
				}
			},
			initCode: function(props) {
				var code = '// Load and apply user preferences\n';
				code += 'Funky.Preferences.load().then(function() {\n';
				code += '  Funky.Preferences.apply();\n';
				code += '});\n\n';
				code += '// Get a preference value\n';
				code += "var mode = Funky.Preferences.get('theme.mode');\n\n";
				code += '// Set a preference (auto-saves)\n';
				code += "Funky.Preferences.set('theme.mode', '" + (props.themeMode || 'dark') + "');\n";
				code += "Funky.Preferences.set('theme.accent_color', '" + (props.accentColor || '#0d6efd') + "');\n";
				code += "Funky.Preferences.set('theme.font_scale', " + (props.fontScale || 1.0) + ");\n\n";
				code += '// Listen for preference changes\n';
				code += 'Funky.Preferences.addListener(function(category, data) {\n';
				code += "  console.log('Preferences changed:', category, data);\n";
				code += '});\n\n';
				code += '// Reset a category to defaults\n';
				code += "Funky.Preferences.reset('theme');";
				return code;
			},
			codeExample: function() {
				return '// Basic preference management\n' +
					'Funky.Preferences.load().then(function() {\n' +
					'  Funky.Preferences.apply();\n' +
					'});\n\n' +
					'// Get/Set preferences\n' +
					"Funky.Preferences.get('theme.mode');  // 'dark'\n" +
					"Funky.Preferences.set('theme.mode', 'light');\n\n" +
					'// Save all preferences\n' +
					'Funky.Preferences.saveAll({\n' +
					'  theme: { mode: "dark", accent_color: "#0d6efd" },\n' +
					'  notifications: { email_enabled: true }\n' +
					'});\n\n' +
					'// Preference binding for components\n' +
					'var binding = Funky.Preferences.bind({\n' +
					"  key: 'myComponent',\n" +
					"  persist: ['position', 'collapsed'],\n" +
					'  getState: function() { return myState; },\n' +
					'  applyState: function(saved) { applyTo(saved); }\n' +
					'});';
			}
		},
		QueueStatus: {
			name: 'QueueStatus',
			icon: 'fa-sync-alt',
			description: 'Visual indicator showing offline queue status with job management',
			defaultProps: {
				position: 'inline',
				showWhenEmpty: true,
				clickAction: 'modal',
				animated: true,
				showControls: true
			},
			propsSchema: {
				position: {
					type: 'select',
					label: 'Position',
					options: ['inline', 'fixed']
				},
				showWhenEmpty: {
					type: 'boolean',
					label: 'Show When Empty'
				},
				clickAction: {
					type: 'select',
					label: 'Click Action',
					options: ['modal', 'custom', 'none']
				},
				animated: {
					type: 'boolean',
					label: 'Animated'
				},
				showControls: {
					type: 'boolean',
					label: 'Show Control Buttons'
				}
			},
			initCode: function(props) {
				var code = '// Initialize QueueStatus indicator\n';
				code += "var status = Funky.QueueStatus.init({\n";
				code += "  container: '#my-container',\n";
				code += "  position: '" + (props.position || 'inline') + "',\n";
				code += '  showWhenEmpty: ' + (props.showWhenEmpty !== false) + ',\n';
				code += "  clickAction: '" + (props.clickAction || 'modal') + "',\n";
				code += '  animated: ' + (props.animated !== false) + '\n';
				code += '});\n\n';
				code += '// Create a job queue for testing\n';
				code += "var queue = new Funky.JobQueue({\n";
				code += "  name: 'my-queue',\n";
				code += '  processor: function(job) {\n';
				code += '    return new Promise(function(resolve) {\n';
				code += '      setTimeout(resolve, 1000);\n';
				code += '    });\n';
				code += '  },\n';
				code += '  persist: false\n';
				code += '});\n\n';
				code += '// Add jobs to see status update\n';
				code += "queue.add({ type: 'test', data: { msg: 'Hello' } });\n\n";
				code += '// Methods\n';
				code += 'status.showModal();  // Open queue viewer\n';
				code += 'status.refresh();    // Force update\n';
				code += 'status.destroy();    // Clean up';
				return code;
			}
		},
		QuickNav: {
			name: 'QuickNav',
			icon: 'fa-compass',
			description: 'Floating navigation widget with section discovery and custom actions',
			defaultProps: {
				position: 'bottom-right',
				collapsed: true,
				showHome: true,
				showSettings: true,
				enableSectionDiscovery: true
			},
			propsSchema: {
				position: {
					type: 'select',
					label: 'Position',
					options: ['bottom-right', 'bottom-left', 'top-right', 'top-left']
				},
				collapsed: {
					type: 'boolean',
					label: 'Start Collapsed'
				},
				showHome: {
					type: 'boolean',
					label: 'Show Home Action'
				},
				showSettings: {
					type: 'boolean',
					label: 'Show Settings Action'
				},
				enableSectionDiscovery: {
					type: 'boolean',
					label: 'Enable Section Discovery'
				}
			},
			initCode: function(props) {
				var code = '// QuickNav initializes automatically on page load\n';
				code += '// Configure via data attributes or JavaScript:\n\n';
				code += '// Position control\n';
				code += "Funky.QuickNav.setPosition('" + (props.position || 'bottom-right') + "');\n\n";
				code += '// Expand/collapse\n';
				code += 'Funky.QuickNav.expand();\n';
				code += 'Funky.QuickNav.collapse();\n';
				code += 'Funky.QuickNav.toggle();\n\n';
				code += '// Add custom action\n';
				code += 'Funky.QuickNav.addAction({\n';
				code += "  id: 'my-action',\n";
				code += "  label: 'My Action',\n";
				code += "  icon: 'fa-star',\n";
				code += "  section: 'main',\n";
				code += "  emit: 'my-custom-event',\n";
				code += '  emitData: { foo: "bar" }\n';
				code += '});\n\n';
				code += '// Badge management\n';
				code += "Funky.QuickNav.setBadge('home', 5);\n";
				code += "Funky.QuickNav.clearBadge('home');\n\n";
				code += '// Events (via PubSub)\n';
				code += "Funky.PubSub.on('funky:quick-nav:expanded', fn);\n";
				code += "Funky.PubSub.on('funky:quick-nav:collapsed', fn);\n";
				code += "Funky.PubSub.on('funky:quick-nav:action:click', fn);\n";
				code += "Funky.PubSub.on('funky:quick-nav:position:changed', fn);";
				return code;
			}
		},
		SelectableList: {
			name: 'SelectableList',
			icon: 'fa-list',
			description: 'Accessible list with keyboard navigation, selection modes, and theming',
			defaultProps: {
				selectable: 'single',
				density: 'default',
				variant: '',
				vimKeys: false,
				typeAhead: true,
				wrapAround: true,
				showGroups: false
			},
			propsSchema: {
				selectable: {
					type: 'select',
					label: 'Selection Mode',
					options: ['none', 'single', 'multi']
				},
				density: {
					type: 'select',
					label: 'Density',
					options: ['compact', 'default', 'comfortable']
				},
				variant: {
					type: 'select',
					label: 'Variant',
					options: ['', 'bordered', 'cards', 'striped', 'checkboxes']
				},
				vimKeys: {
					type: 'boolean',
					label: 'Vim Keys (j/k)'
				},
				typeAhead: {
					type: 'boolean',
					label: 'Type-Ahead Search'
				},
				wrapAround: {
					type: 'boolean',
					label: 'Wrap Navigation'
				},
				showGroups: {
					type: 'boolean',
					label: 'Show Grouped Demo'
				}
			},
			initCode: function(props) {
				var code = '// Initialize SelectableList\n';
				code += "var list = Funky.SelectableList.init('#container', {\n";
				code += '  items: [\n';
				code += "    { id: 'apple', label: 'Apple', icon: 'fa-apple-alt' },\n";
				code += "    { id: 'banana', label: 'Banana', icon: 'fa-leaf' },\n";
				code += "    { id: 'cherry', label: 'Cherry', icon: 'fa-circle' }\n";
				code += '  ],\n';
				code += "  selectable: '" + (props.selectable || 'single') + "',\n";
				code += "  density: '" + (props.density || 'default') + "',\n";
				if (props.variant) {
					code += "  variant: '" + props.variant + "',\n";
				}
				code += '  vimKeys: ' + (props.vimKeys || false) + ',\n';
				code += '  typeAhead: ' + (props.typeAhead !== false) + ',\n';
				code += '  renderItem: function(item) {\n';
				code += "    return '<i class=\"fas ' + item.icon + ' me-2\"></i>' +\n";
				code += "           '<span>' + item.label + '</span>';\n";
				code += '  },\n';
				code += '  onSelect: function(items, ids) {\n';
				code += "    console.log('Selected:', ids);\n";
				code += '  },\n';
				code += '  onActivate: function(item) {\n';
				code += "    console.log('Activated:', item.label);\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// API Methods\n';
				code += 'list.select(id);           // Select by ID\n';
				code += 'list.selectAll();          // Select all (multi mode)\n';
				code += 'list.clearSelection();     // Clear selection\n';
				code += 'list.setDensity("compact"); // Change density\n';
				code += 'list.setVariant("cards");   // Change variant\n';
				code += 'list.focus();              // Focus the list';
				return code;
			},
			codeExample: function() {
				return '// Basic initialization\n' +
					"var list = Funky.SelectableList.init('#container', {\n" +
					'  items: myItems,\n' +
					"  selectable: 'multi',\n" +
					'  renderItem: function(item) {\n' +
					"    return '<span>' + item.name + '</span>';\n" +
					'  }\n' +
					'});\n\n' +
					'// With grouping\n' +
					"var grouped = Funky.SelectableList.init('#container', {\n" +
					'  items: locations,\n' +
					'  groupBy: function(item) {\n' +
					'    return item.type;  // "City", "State", "Country"\n' +
					'  },\n' +
					'  renderGroupHeader: function(key, items) {\n' +
					"    return '<strong>' + key + 's</strong> (' + items.length + ')';\n" +
					'  }\n' +
					'});\n\n' +
					'// Keyboard shortcuts\n' +
					'// ↑↓ - Navigate | Enter/Space - Select | Escape - Clear\n' +
					'// Home/End - Jump | Page Up/Down - Skip 10 | a-z - Type-ahead\n' +
					'// Ctrl+A - Select all (multi) | j/k - Vim navigation (if enabled)\n\n' +
					'// Selection API\n' +
					'list.select(id);              // Select single\n' +
					'list.selectRange(start, end); // Select range\n' +
					'list.toggleSelection(id);     // Toggle item\n' +
					'list.getSelected();           // Get selected items\n' +
					'list.getSelectedIds();        // Get selected IDs\n\n' +
					'// Theming\n' +
					"list.setDensity('compact');   // compact | default | comfortable\n" +
					"list.setVariant('cards');     // bordered | cards | striped | checkboxes";
			}
		},
		Tour: {
			name: 'Tour',
			icon: 'fa-route',
			description: 'Guided tour component with step-by-step walkthroughs and LiveBinding support',
			defaultProps: {
				showOverlay: true,
				showProgress: true,
				showClose: true,
				keyboardNav: true,
				animate: true,
				position: 'auto',
				scrollBehavior: 'smooth'
			},
			propsSchema: {
				showOverlay: {
					type: 'boolean',
					label: 'Show Overlay'
				},
				showProgress: {
					type: 'boolean',
					label: 'Show Progress'
				},
				showClose: {
					type: 'boolean',
					label: 'Show Close Button'
				},
				keyboardNav: {
					type: 'boolean',
					label: 'Keyboard Navigation'
				},
				animate: {
					type: 'boolean',
					label: 'Animate Transitions'
				},
				position: {
					type: 'select',
					label: 'Tooltip Position',
					options: ['auto', 'top', 'bottom', 'left', 'right']
				},
				scrollBehavior: {
					type: 'select',
					label: 'Scroll Behavior',
					options: ['smooth', 'instant', 'none']
				}
			},
			initCode: function(props) {
				var code = '// Create a guided tour\n';
				code += 'var tour = Funky.Tour.init({\n';
				code += "  id: 'my-tour',\n";
				code += '  showOverlay: ' + (props.showOverlay !== false) + ',\n';
				code += '  showProgress: ' + (props.showProgress !== false) + ',\n';
				code += '  showCloseButton: ' + (props.showClose !== false) + ',\n';
				code += '  keyboardNavigation: ' + (props.keyboardNav !== false) + ',\n';
				code += '  animate: ' + (props.animate !== false) + ',\n';
				code += "  position: '" + (props.position || 'auto') + "',\n";
				code += '  steps: [\n';
				code += '    {\n';
				code += "      target: '#element-1',\n";
				code += "      title: 'Welcome!',\n";
				code += "      content: 'This is the first step of the tour.'\n";
				code += '    },\n';
				code += '    {\n';
				code += "      target: '#element-2',\n";
				code += "      title: 'Next Step',\n";
				code += "      content: 'Continue exploring the app.',\n";
				code += "      position: 'bottom'\n";
				code += '    }\n';
				code += '  ]\n';
				code += '});\n\n';
				code += '// Start the tour\n';
				code += 'tour.start();\n\n';
				code += '// Navigation\n';
				code += 'tour.next();      // Go to next step\n';
				code += 'tour.prev();      // Go to previous step\n';
				code += 'tour.goTo(2);     // Jump to step index\n';
				code += 'tour.stop();      // End tour\n\n';
				code += '// LiveBinding support\n';
				code += 'tour.updateData({ name: "User", count: 5 });\n\n';
				code += '// Events (via PubSub)\n';
				code += "Funky.PubSub.on('funky:tour:start', fn);\n";
				code += "Funky.PubSub.on('funky:tour:end', fn);\n";
				code += "Funky.PubSub.on('funky:tour:step', fn);\n";
				code += "Funky.PubSub.on('funky:tour:complete', fn);";
				return code;
			}
		},
		CodePreview: {
			name: 'CodePreview',
			icon: 'fa-code',
			description: 'Syntax-highlighted code display with line numbers and copy button',
			defaultProps: {
				language: 'javascript',
				lineNumbers: true,
				showCopy: true,
				showLanguage: true,
				collapsible: false,
				collapsed: false,
				wrapLines: false,
				maxHeight: 300,
				editable: false,
				showRun: false,
				demoCode: 'function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nvar message = greet("World");\nconsole.log(message);'
			},
			propsSchema: {
				language: { type: 'select', label: 'Language', options: ['javascript', 'json', 'html', 'css', 'text'] },
				lineNumbers: { type: 'boolean', label: 'Line Numbers' },
				showCopy: { type: 'boolean', label: 'Show Copy Button' },
				showLanguage: { type: 'boolean', label: 'Show Language Label' },
				collapsible: { type: 'boolean', label: 'Collapsible' },
				collapsed: { type: 'boolean', label: 'Start Collapsed' },
				wrapLines: { type: 'boolean', label: 'Wrap Long Lines' },
				maxHeight: { type: 'number', label: 'Max Height (px)', min: 100, max: 600 },
				editable: { type: 'boolean', label: 'Editable' },
				showRun: { type: 'boolean', label: 'Show Run Button' },
				demoCode: { type: 'textarea', label: 'Demo Code' }
			},
			initCode: function(props) {
				var code = '// Render code with syntax highlighting\n';
				code += 'Funky.CodePreview.render(\'#container\', code, {\n';
				code += '  language: \'' + (props.language || 'javascript') + '\',\n';
				code += '  lineNumbers: ' + (props.lineNumbers !== false) + ',\n';
				code += '  showCopy: ' + (props.showCopy !== false) + ',\n';
				code += '  showLanguage: ' + (props.showLanguage !== false) + ',\n';
				if (props.collapsible) {
					code += '  collapsible: true,\n';
					code += '  collapsed: ' + (props.collapsed || false) + ',\n';
				}
				if (props.wrapLines) {
					code += '  wrapLines: true,\n';
				}
				if (props.maxHeight) {
					code += '  maxHeight: ' + props.maxHeight + ',\n';
				}
				if (props.editable) {
					code += '  editable: true,\n';
					code += '  showRun: ' + (props.showRun || false) + ',\n';
					code += '  onRun: function(code) { eval(code); },\n';
					code += '  onChange: function(code) { console.log(\'Changed\'); }\n';
				}
				code += '});\n\n';
				code += '// Static HTML generation\n';
				code += 'var html = Funky.CodePreview.toHTML(code, { language: \'json\' });\n\n';
				code += '// Highlight only (returns HTML string)\n';
				code += 'var highlighted = Funky.CodePreview.highlight(code, \'javascript\');\n\n';
				code += '// With LiveBinding\n';
				code += 'Funky.CodePreview.createWithBinding(\'#code\', template, options, {\n';
				code += '  source: \'memory\',\n';
				code += '  key: \'code-data\'\n';
				code += '});';
				return code;
			}
		},
		ComboBox: {
			name: 'ComboBox',
			icon: 'fa-square-caret-down',
			description: 'Select2 replacement with search, keyboard navigation, and remote data support',
			defaultProps: {
				mode: 'single',
				searchable: true,
				clearable: true,
				placeholder: 'Select an option...',
				size: '',
				maxSelection: null,
				maxTags: 5,
				showSelectAll: false,
				tags: false,
				minSearchLength: 0,
				scrollTags: false,
				fixedWidth: null,
				dropdownFitContent: false
			},
			propsSchema: {
				mode: {
					type: 'select',
					label: 'Selection Mode',
					options: ['single', 'multi']
				},
				size: {
					type: 'select',
					label: 'Size',
					options: ['', 'sm', 'lg']
				},
				searchable: {
					type: 'boolean',
					label: 'Searchable'
				},
				clearable: {
					type: 'boolean',
					label: 'Clearable'
				},
				dropdownFitContent: {
					type: 'boolean',
					label: 'Dropdown Fit Content'
				},
				placeholder: {
					type: 'string',
					label: 'Placeholder'
				},
				maxSelection: {
					type: 'number',
					label: 'Max Selection (multi)',
					min: 1,
					max: 20
				},
				maxTags: {
					type: 'number',
					label: 'Max Tags Display',
					min: 1,
					max: 10
				},
				showSelectAll: {
					type: 'boolean',
					label: 'Show Select All (multi)'
				},
				tags: {
					type: 'boolean',
					label: 'Allow Tag Creation'
				},
				minSearchLength: {
					type: 'number',
					label: 'Min Search Length',
					min: 0,
					max: 5
				},
				scrollTags: {
					type: 'boolean',
					label: 'Scroll Tags (horizontal)'
				},
				fixedWidth: {
					type: 'number',
					label: 'Fixed Width (px)',
					min: 100,
					max: 500
				}
			},
			initCode: function(props) {
				var code = '// Initialize ComboBox\n';
				code += "var combo = Funky.ComboBox.init('#my-select', {\n";
				code += "  placeholder: '" + (props.placeholder || 'Select...') + "',\n";
				code += "  mode: '" + (props.mode || 'single') + "',\n";
				code += '  searchable: ' + (props.searchable !== false) + ',\n';
				code += '  clearable: ' + (props.clearable !== false) + ',\n';
				if (props.size) {
					code += "  size: '" + props.size + "',\n";
				}
				if (props.dropdownFitContent) {
					code += '  dropdownFitContent: true,\n';
				}
				if (props.mode === 'multi') {
					if (props.maxSelection) {
						code += '  maxSelection: ' + props.maxSelection + ',\n';
					}
					code += '  maxTags: ' + (props.maxTags || 5) + ',\n';
					code += '  showSelectAll: ' + (props.showSelectAll || false) + ',\n';
					if (props.scrollTags) {
						code += '  scrollTags: true,\n';
					}
				}
				if (props.tags) {
					code += '  tags: true,\n';
				}
				if (props.minSearchLength > 0) {
					code += '  minSearchLength: ' + props.minSearchLength + ',\n';
				}
				if (props.fixedWidth) {
					code += '  fixedWidth: ' + props.fixedWidth + ',\n';
				}
				code += '  items: [\n';
				code += "    { id: 'apple', name: 'Apple' },\n";
				code += "    { id: 'banana', name: 'Banana' },\n";
				code += "    { id: 'cherry', name: 'Cherry' }\n";
				code += '  ],\n';
				code += '  onChange: function(value, items) {\n';
				code += "    console.log('Selected:', value);\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// API Methods\n';
				code += "combo.setValue('apple');   // Set value\n";
				code += 'combo.getValue();          // Get value\n';
				code += 'combo.getSelectedItems();  // Get full items\n';
				code += 'combo.clear();             // Clear selection\n';
				code += 'combo.open() / close();    // Toggle dropdown\n';
				code += 'combo.enable() / disable();// Toggle state\n';
				code += 'combo.destroy();           // Cleanup';
				return code;
			},
			codeExample: function() {
				return '// Basic single-select\n' +
					"var combo = Funky.ComboBox.init('#select', {\n" +
					"  placeholder: 'Choose a fruit...',\n" +
					'  items: fruits\n' +
					'});\n\n' +
					'// Multi-select with tags\n' +
					"var multi = Funky.ComboBox.init('#multi', {\n" +
					"  mode: 'multi',\n" +
					'  maxTags: 3,\n' +
					'  showSelectAll: true,\n' +
					'  items: colors\n' +
					'});\n\n' +
					'// Custom dropdown item template\n' +
					"var custom = Funky.ComboBox.init('#custom', {\n" +
					'  items: users,\n' +
					'  templateResult: function(item, state) {\n' +
					"    return '<div class=\"user-item\">' +\n" +
					"      '<img src=\"' + item.avatar + '\" />' +\n" +
					"      '<span>' + item.name + '</span>' +\n" +
					"    '</div>';\n" +
					'  },\n' +
					'  templateSelection: function(item) {\n' +
					"    return item.name + ' (' + item.email + ')';\n" +
					'  }\n' +
					'});\n\n' +
					'// Custom tags in multi-select\n' +
					"var taggedMulti = Funky.ComboBox.init('#tagged', {\n" +
					"  mode: 'multi',\n" +
					'  items: colors,\n' +
					'  templateTag: function(item) {\n' +
					"    return '<span style=\"color:' + item.hex + '\">' +\n" +
					"      item.name + '</span>';\n" +
					'  }\n' +
					'});\n\n' +
					'// Remote data (AJAX search)\n' +
					"var remote = Funky.ComboBox.init('#remote', {\n" +
					'  remote: {\n' +
					"    url: '/api/users/search',\n" +
					"    searchParam: 'q',\n" +
					"    dataKey: 'users',\n" +
					'    delay: 300\n' +
					'  }\n' +
					'});\n\n' +
					'// From existing <select>\n' +
					"Funky.ComboBox.initAll('[data-combobox]');\n\n" +
					'// Events: change, open, close, search, clear, tagcreate, tagremove';
			},
			render: function(container, props, logEvent) {
				var ComboBox = Funky.ComboBox;

				if (!ComboBox) {
					D.wrap(container).empty().child(
						D.div().style('padding', '24px').style('text-align', 'center').style('color', 'var(--pro-text-muted)').text('ComboBox module not loaded')
					);
					return;
				}

				D.wrap(container).empty();

				// Sample data
				var fruits = [
					{ id: 'apple', name: 'Apple' },
					{ id: 'banana', name: 'Banana' },
					{ id: 'cherry', name: 'Cherry' },
					{ id: 'date', name: 'Date' },
					{ id: 'elderberry', name: 'Elderberry' },
					{ id: 'fig', name: 'Fig' },
					{ id: 'grape', name: 'Grape' },
					{ id: 'honeydew', name: 'Honeydew' }
				];

				var wrapper = D.create('div')
					.style({
						padding: '24px',
						maxWidth: '500px',
						margin: '0 auto'
					});

				// Title
				var title = D.create('h3')
					.style({ margin: '0 0 16px', color: 'var(--pro-text-primary)' })
					.text(props.mode === 'multi' ? 'Multi-Select ComboBox' : 'Single-Select ComboBox');
				wrapper.append(title);

				// Description
				var desc = D.create('p')
					.style({ margin: '0 0 24px', color: 'var(--pro-text-muted)', fontSize: '14px' })
					.text(props.mode === 'multi' 
						? 'Select multiple items. Use checkboxes or click to toggle.'
						: 'Search and select a single option. Use keyboard or mouse.');
				wrapper.append(desc);

				// Create select element
				var selectId = 'demo-combobox-' + Date.now();
				var selectEl = D.create('select')
					.attr('id', selectId)
					.style({ width: '100%' });

				// Add options
				fruits.forEach(function(item) {
					var opt = D.create('option')
						.attr('value', item.id)
						.text(item.name);
					selectEl.append(opt);
				});

				wrapper.append(selectEl);

				// Add to container first
				container.appendChild(wrapper.raw);

				// Initialize ComboBox
				var comboOptions = {
					placeholder: props.placeholder || 'Select...',
					mode: props.mode || 'single',
					searchable: props.searchable !== false,
					clearable: props.clearable !== false,
					items: fruits,
					onChange: function(value, items) {
						logEvent('change', { value: value, items: items });
					},
					onOpen: function() {
						logEvent('open');
					},
					onClose: function() {
						logEvent('close');
					},
					onSearch: function(query) {
						logEvent('search', { query: query });
					},
					onClear: function() {
						logEvent('clear');
					}
				};

				// Apply size variant
				if (props.size) {
					comboOptions.size = props.size;
				}

				// Apply dropdown fit content
				if (props.dropdownFitContent) {
					comboOptions.dropdownFitContent = true;
				}

				if (props.mode === 'multi') {
					if (props.maxSelection) {
						comboOptions.maxSelection = parseInt(props.maxSelection, 10);
					}
					comboOptions.maxTags = props.maxTags || 5;
					comboOptions.showSelectAll = props.showSelectAll || false;
				}

				if (props.tags) {
					comboOptions.tags = true;
				}

				if (props.minSearchLength > 0) {
					comboOptions.minSearchLength = parseInt(props.minSearchLength, 10);
				}

				var combo = ComboBox.init('#' + selectId, comboOptions);

				// Store for cleanup
				if (combo) {
					container._comboInstance = combo;
				}

				// Instructions
				var instructions = D.create('div')
					.style({
						marginTop: '24px',
						padding: '16px',
						background: 'var(--pro-bg-secondary)',
						borderRadius: 'var(--pro-radius-md)',
						fontSize: '13px',
						color: 'var(--pro-text-muted)'
					});

				var instructionText = '<strong>Keyboard:</strong> ↑↓ Navigate, Enter Select, Escape Close, Backspace Remove tag';
				if (props.searchable !== false) {
					instructionText += '<br><strong>Search:</strong> Type to filter options';
				}
				if (props.mode === 'multi') {
					instructionText += '<br><strong>Multi:</strong> Click or press Enter to toggle selection';
				}

				instructions.html(instructionText);
				wrapper.append(instructions);
			}
		},

		NotificationCenter: {
			name: 'NotificationCenter',
			icon: 'fa-bell',
			description: 'In-app notification system with bell icon, dropdown, real-time updates, and desktop notifications',
			defaultProps: {
				sound: true,
				soundVolume: 50,
				desktop: false,
				maxVisible: 10,
				groupByDate: false,
				showTimestamp: true
			},
			propsSchema: {
				sound: { type: 'boolean', label: 'Enable Sound' },
				soundVolume: { type: 'number', label: 'Sound Volume (%)', min: 0, max: 100 },
				desktop: { type: 'boolean', label: 'Enable Desktop Notifications' },
				maxVisible: { type: 'number', label: 'Max Visible', min: 5, max: 50 },
				groupByDate: { type: 'boolean', label: 'Group by Date' },
				showTimestamp: { type: 'boolean', label: 'Show Timestamps' }
			},
			initCode: function(props) {
				var code = '// Initialize NotificationCenter\n';
				code += "Funky.NotificationCenter.init({\n";
				code += "    container: '#notification-bell',\n";
				code += '    sound: ' + (props.sound !== false) + ',\n';
				code += '    soundVolume: ' + ((props.soundVolume || 50) / 100) + ',\n';
				code += '    desktop: ' + (props.desktop || false) + ',\n';
				code += '    maxVisible: ' + (props.maxVisible || 10) + '\n';
				code += '});\n\n';
				code += '// Add a notification\n';
				code += "Funky.NotificationCenter.add({\n";
				code += "    title: 'Trade Executed',\n";
				code += "    body: 'Your order has been filled',\n";
				code += "    category: 'trade',\n";
				code += "    iconColor: 'success',\n";
				code += "    href: '/trades/123'\n";
				code += '});\n\n';
				code += '// Other methods\n';
				code += 'NotificationCenter.markRead(id);       // Mark single as read\n';
				code += 'NotificationCenter.markAllRead();      // Mark all as read\n';
				code += 'NotificationCenter.remove(id);         // Remove notification\n';
				code += "NotificationCenter.filter('trade');    // Filter by category\n";
				code += 'NotificationCenter.getUnreadCount();   // Get unread count\n';
				code += 'NotificationCenter.open() / close();   // Toggle dropdown';
				return code;
			},
			codeExample: function() {
				return '// Basic initialization\n' +
					"Funky.NotificationCenter.init({\n" +
					"    container: '#notification-bell',\n" +
					'    sound: true,\n' +
					'    desktop: false,\n' +
					'    maxVisible: 10\n' +
					'});\n\n' +
					'// Add notification with actions\n' +
					'Funky.NotificationCenter.add({\n' +
					"    title: 'Approval Required',\n" +
					"    body: 'Trade needs your approval',\n" +
					"    category: 'alert',\n" +
					"    iconColor: 'warning',\n" +
					'    actions: [\n' +
					"        { label: 'Approve', action: 'approve' },\n" +
					"        { label: 'Reject', action: 'reject' }\n" +
					'    ]\n' +
					'});\n\n' +
					'// Register custom action handler\n' +
					"NotificationCenter.registerAction('approve', function(notification) {\n" +
					"    Api.post('/trades/' + notification.data.id + '/approve');\n" +
					'    this.remove(notification.id);\n' +
					'});\n\n' +
					'// LiveBinding integration\n' +
					'Funky.LiveBinding.bind({\n' +
					"    source: { type: 'state', key: 'notifications' },\n" +
					'    target: {\n' +
					"        type: 'component',\n" +
					"        component: 'NotificationCenter'\n" +
					'    }\n' +
					'});\n\n' +
					'// WebSocket real-time updates\n' +
					'NotificationCenter.init({\n' +
					'    websocket: Funky.WebSocket,\n' +
					"    channel: 'user_notifications'\n" +
					'});';
			},
			render: function(container, props, logEvent) {
				var NC = Funky.NotificationCenter;

				if (!NC) {
					D.wrap(container).empty().child(
						D.div().style('padding', '24px').style('text-align', 'center').style('color', 'var(--pro-text-muted)').text('NotificationCenter module not loaded')
					);
					return;
				}

				D.wrap(container).empty();

				// Sample notifications
				var sampleNotifications = [
					{ title: 'Trade Executed', body: 'AAPL order filled at $150.00', category: 'trade', iconColor: 'success', icon: 'fa-check-circle' },
					{ title: 'Trade Failed', body: 'Order rejected: Insufficient funds', category: 'trade', iconColor: 'danger', icon: 'fa-times-circle' },
					{ title: 'Price Alert', body: 'TSLA reached target price of $250', category: 'alert', iconColor: 'warning', icon: 'fa-exclamation-triangle' },
					{ title: 'System Maintenance', body: 'Scheduled maintenance at 11 PM', category: 'system', iconColor: 'info', icon: 'fa-info-circle' },
					{ title: 'New Message', body: 'You have a new message from Support', category: 'message', iconColor: 'info', icon: 'fa-envelope' }
				];

				var wrapper = D.create('div')
					.style({
						padding: '24px'
					});

				// Demo header with bell
				var demoHeader = D.create('div')
					.style({
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '24px',
						padding: '16px',
						background: 'var(--pro-bg-secondary)',
						borderRadius: 'var(--pro-radius-md)'
					});

				var headerTitle = D.create('h3')
					.style({ margin: '0', color: 'var(--pro-text-primary)' })
					.text('NotificationCenter Demo');

				var bellContainer = D.create('div')
					.attr('id', 'demo-notification-bell')
					.style({
						display: 'inline-flex',
						alignItems: 'center'
					});

				demoHeader.append(headerTitle);
				demoHeader.append(bellContainer);
				wrapper.append(demoHeader);

				// Control panel
				var controls = D.create('div')
					.style({
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
						gap: '12px',
						marginBottom: '24px'
					});

				// Add notification button
				var addBtn = D.create('button')
					.classAdd('btn', 'btn-funky-primary')
					.html('<i class="fas fa-plus me-2"></i>Add Notification')
					.on('click', function() {
						var sample = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
						NC.add(Object.assign({}, sample, {
							id: 'demo_' + Date.now(),
							timestamp: Date.now()
						}));
						logEvent('add', { title: sample.title });
					});

				// Mark all read button
				var markReadBtn = D.create('button')
					.classAdd('btn', 'btn-funky-outline-primary')
					.html('<i class="fas fa-check-double me-2"></i>Mark All Read')
					.on('click', function() {
						NC.markAllRead();
						logEvent('markAllRead');
					});

				// Clear all button
				var clearBtn = D.create('button')
					.classAdd('btn', 'btn-funky-outline-danger')
					.html('<i class="fas fa-trash me-2"></i>Clear All')
					.on('click', function() {
						NC.clear();
						logEvent('clear');
					});

				// Toggle button
				var toggleBtn = D.create('button')
					.classAdd('btn', 'btn-funky-secondary')
					.html('<i class="fas fa-bell me-2"></i>Toggle')
					.on('click', function() {
						NC.toggle();
						logEvent('toggle', { isOpen: NC.isOpen() });
					});

				controls.append(addBtn);
				controls.append(markReadBtn);
				controls.append(clearBtn);
				controls.append(toggleBtn);
				wrapper.append(controls);

				// Stats row
				var statsRow = D.create('div')
					.attr('id', 'nc-stats-row')
					.style({
						display: 'flex',
						gap: '16px',
						marginBottom: '24px',
						padding: '12px 16px',
						background: 'var(--pro-bg-tertiary)',
						borderRadius: 'var(--pro-radius-sm)',
						fontSize: '14px'
					});

				var totalStat = D.create('span').html('<strong>Total:</strong> <span id="nc-total">0</span>');
				var unreadStat = D.create('span').html('<strong>Unread:</strong> <span id="nc-unread">0</span>');
				var filterStat = D.create('span').html('<strong>Filter:</strong> <span id="nc-filter">all</span>');

				statsRow.append(totalStat);
				statsRow.append(unreadStat);
				statsRow.append(filterStat);
				wrapper.append(statsRow);

				// Category filter buttons
				var filterSection = D.create('div')
					.style({ marginBottom: '24px' });

				var filterLabel = D.create('span')
					.style({ marginRight: '12px', fontWeight: 'bold', fontSize: '14px' })
					.text('Filter:');

				var filterBtns = D.create('div')
					.classAdd('btn-group')
					.attr('role', 'group');

				var categories = ['all', 'trade', 'alert', 'system', 'message'];
				categories.forEach(function(cat) {
					var btn = D.create('button')
						.classAdd('btn', 'btn-outline-secondary', 'btn-sm')
						.attr('type', 'button')
						.text(cat.charAt(0).toUpperCase() + cat.slice(1))
						.on('click', function() {
							NC.filter(cat);
							logEvent('filter', { category: cat });
							updateStats();
						});
					filterBtns.append(btn);
				});

				filterSection.append(filterLabel);
				filterSection.append(filterBtns);
				wrapper.append(filterSection);

				// Instructions
				var instructions = D.create('div')
					.style({
						padding: '16px',
						background: 'var(--pro-bg-secondary)',
						borderRadius: 'var(--pro-radius-md)',
						fontSize: '13px',
						color: 'var(--pro-text-muted)'
					})
					.html(
						'<strong>Keyboard:</strong> Alt+N Toggle, ↑↓ Navigate list, Enter/Space View, Delete Dismiss, R Toggle read<br>' +
						'<strong>Click:</strong> Bell icon to toggle, notification to view, × to dismiss'
					);
				wrapper.append(instructions);

				container.appendChild(wrapper.raw);

				// Initialize NotificationCenter
				NC.init({
					container: '#demo-notification-bell',
					instanceId: 'playground_demo',
					sound: props.sound !== false,
					soundVolume: (props.soundVolume || 50) / 100,
					desktop: props.desktop || false,
					maxVisible: props.maxVisible || 10,
					groupByDate: props.groupByDate || false,
					showTimestamp: props.showTimestamp !== false
				});

				// Add initial notifications
				NC.setData([
					{ id: '1', title: 'Welcome!', body: 'Click the bell icon or use controls below', category: 'system', iconColor: 'info', read: false, timestamp: Date.now() - 60000 },
					{ id: '2', title: 'Sample Trade', body: 'This is a sample trade notification', category: 'trade', iconColor: 'success', read: true, timestamp: Date.now() - 120000 }
				]);

				// Update stats function
				function updateStats() {
					var totalEl = document.getElementById('nc-total');
					var unreadEl = document.getElementById('nc-unread');
					var filterEl = document.getElementById('nc-filter');

					if (totalEl) totalEl.textContent = NC.getData().length;
					if (unreadEl) unreadEl.textContent = NC.getUnreadCount();
					if (filterEl) filterEl.textContent = NC.getFilter();
				}

				// Listen for events to update stats
				if (Funky.PubSub) {
					Funky.PubSub.on('funky:notification:add', updateStats);
					Funky.PubSub.on('funky:notification:remove', updateStats);
					Funky.PubSub.on('funky:notification:read', updateStats);
				}

				// Initial stats
				setTimeout(updateStats, 100);

				// Store for cleanup
				container._ncInstance = NC;
			}
		},

		Morph: {
			name: 'Morph',
			icon: 'fa-expand-arrows-alt',
			description: 'FLIP-based animation engine for smooth element morphing, shared transitions, and list animations',
			defaultProps: {
				preset: 'expand',
				duration: 300,
				easing: 'standard',
				showOverlay: true,
				demoType: 'card-modal',
				enterFrom: 'right',
				exitTo: 'left',
				stagger: 50
			},
			propsSchema: {
				demoType: {
					type: 'select',
					label: 'Demo Type',
					options: ['card-modal', 'list-animations', 'shared-elements']
				},
				preset: {
					type: 'select',
					label: 'Preset',
					options: ['expand', 'slide', 'fade', 'flip', 'morph', 'zoom', 'hero'],
					visibleWhen: { demoType: ['card-modal', 'shared-elements'] }
				},
				duration: {
					type: 'number',
					label: 'Duration (ms)',
					min: 100,
					max: 2000
				},
				easing: {
					type: 'select',
					label: 'Easing',
					options: ['standard', 'easeOut', 'easeInOut', 'overshoot', 'bounce', 'decelerate']
				},
				showOverlay: {
					type: 'boolean',
					label: 'Show Overlay',
					visibleWhen: { demoType: ['card-modal'] }
				},
				enterFrom: {
					type: 'select',
					label: 'Enter From',
					options: ['left', 'right', 'top', 'bottom', 'scale', 'fade'],
					visibleWhen: { demoType: ['list-animations'] }
				},
				exitTo: {
					type: 'select',
					label: 'Exit To',
					options: ['left', 'right', 'top', 'bottom', 'scale', 'fade'],
					visibleWhen: { demoType: ['list-animations'] }
				},
				stagger: {
					type: 'number',
					label: 'Stagger (ms)',
					min: 0,
					max: 200,
					visibleWhen: { demoType: ['list-animations'] }
				}
			},
			initCode: function(props) {
				var code = '// Basic morph - expand card to modal\n';
				code += 'Funky.Morph.to({\n';
				code += "  from: '#card',\n";
				code += "  to: '#modal',\n";
				code += "  preset: '" + (props.preset || 'expand') + "',\n";
				code += '  duration: ' + (props.duration || 300) + ',\n';
				code += "  easing: '" + (props.easing || 'standard') + "',\n";
				code += '  onComplete: function() {\n';
				code += "    console.log('Morph complete!');\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// Reverse (close modal)\n';
				code += "Funky.Morph.reverse('#modal');\n\n";
				code += '// List animations\n';
				code += "var list = Funky.Morph.list('#my-list', {\n";
				code += "  enterFrom: 'right',\n";
				code += "  exitTo: 'left',\n";
				code += '  stagger: 50\n';
				code += '});\n\n';
				code += "list.add('<li>New Item</li>');\n";
				code += 'list.remove(0);\n';
				code += "list.reorder(['c', 'a', 'b']);";
				return code;
			},
			codeExample: function() {
				return '// Shared element transitions\n' +
					'Funky.Morph.shared({\n' +
					"  from: '.card',\n" +
					"  to: '.modal',\n" +
					"  children: ['image', 'title', 'description'],\n" +
					'  duration: 400\n' +
					'});\n\n' +
					'// Available presets\n' +
					"Funky.Morph.getPresets();  // ['expand', 'slide', 'fade', ...]\n\n" +
					'// Custom easing\n' +
					"Funky.Morph.getEasings();  // ['standard', 'overshoot', ...]\n\n" +
					'// Register custom preset\n' +
					"Funky.Morph.registerPreset('custom', {\n" +
					'  duration: 400,\n' +
					"  easing: 'bounce',\n" +
					'  scale: true\n' +
					'});\n\n' +
					'// Spring physics animation\n' +
					'Funky.Morph.spring({\n' +
					'  from: 0,\n' +
					'  to: 1,\n' +
					'  stiffness: 120,\n' +
					'  damping: 14,\n' +
					'  onUpdate: function(progress) {\n' +
					"    element.style.transform = 'scale(' + progress + ')';\n" +
					'  }\n' +
					'});';
			},
			render: function(container, props, logEvent) {
				var Morph = Funky.Morph;

				if (!Morph) {
					D.wrap(container).empty().child(
						D.div().style('padding', '24px').style('text-align', 'center').style('color', 'var(--pro-text-muted)').text('Morph module not loaded')
					);
					return;
				}

				D.wrap(container).empty();

				var wrapper = D.create('div')
					.classAdd('morph-demo')
					.style({ padding: '24px' });

				var demoType = props.demoType || 'card-modal';

				if (demoType === 'card-modal') {
					// Card to modal demo
					var cardGrid = D.create('div')
						.style({
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
							gap: '16px',
							marginBottom: '24px'
						});

					var items = [
						{ id: 1, title: 'Product A', color: 'var(--pro-primary)' },
						{ id: 2, title: 'Product B', color: 'var(--pro-success)' },
						{ id: 3, title: 'Product C', color: 'var(--pro-warning)' }
					];

					items.forEach(function(item) {
						var card = D.create('div')
							.attr('data-morph-id', 'item-' + item.id)
							.style({
								background: 'var(--pro-surface)',
								border: '1px solid var(--pro-border-color)',
								borderRadius: 'var(--pro-radius-md)',
								padding: '16px',
								cursor: 'pointer',
								transition: 'box-shadow 0.2s'
							})
							.append(
								D.create('div')
									.attr('data-morph-child', 'icon')
									.style({
										width: '48px',
										height: '48px',
										background: item.color,
										borderRadius: '50%',
										marginBottom: '12px'
									})
							)
							.append(
								D.create('h4')
									.attr('data-morph-child', 'title')
									.text(item.title)
									.style({ margin: '0 0 8px' })
							)
							.append(
								D.create('p')
									.text('Click to expand')
									.style({ margin: 0, color: 'var(--pro-text-secondary)', fontSize: '0.875rem' })
							)
							.on('mouseenter', function() {
								this.style.boxShadow = 'var(--pro-shadow-md)';
							})
							.on('mouseleave', function() {
								this.style.boxShadow = '';
							})
							.on('click', function() {
								logEvent('morph:start', { item: item.title });
								// For demo, just log - actual morph would need modal element
								logEvent('morph:demo', { preset: props.preset, duration: props.duration });
							});

						cardGrid.append(card);
					});

					wrapper.append(cardGrid);

					// Info text
					wrapper.append(
						D.create('p')
							.style({ color: 'var(--pro-text-secondary)', fontSize: '0.875rem' })
							.text('Click cards to trigger morph animation (demo mode - logs events)')
					);

				} else if (demoType === 'list-animations') {
					// List animation demo
					var listContainer = D.create('div').style({ maxWidth: '400px' });

					var list = D.create('ul')
						.attr('id', 'morph-demo-list')
						.style({
							listStyle: 'none',
							padding: 0,
							margin: '0 0 16px'
						});

					var sampleItems = ['Apple', 'Banana', 'Cherry', 'Date'];
					var itemCounter = sampleItems.length;

					sampleItems.forEach(function(item, i) {
						list.append(
							D.create('li')
								.attr('data-morph-item', 'item-' + i)
								.text(item)
								.style({
									padding: '12px 16px',
									background: 'var(--pro-surface)',
									border: '1px solid var(--pro-border-color)',
									borderRadius: 'var(--pro-radius-sm)',
									marginBottom: '8px'
								})
						);
					});

					listContainer.append(list);

					// Controls
					var controls = D.create('div').style({ display: 'flex', gap: '8px', flexWrap: 'wrap' });

					controls.append(
						D.create('button')
							.classAdd('btn', 'btn-funky-primary', 'btn-sm')
							.text('Add Item')
							.on('click', function() {
								itemCounter++;
								logEvent('list:add', { item: 'Item ' + itemCounter });
							})
					);

					controls.append(
						D.create('button')
							.classAdd('btn', 'btn-funky-secondary', 'btn-sm')
							.text('Remove First')
							.on('click', function() {
								logEvent('list:remove', { index: 0 });
							})
					);

					controls.append(
						D.create('button')
							.classAdd('btn', 'btn-funky-outline-primary', 'btn-sm')
							.text('Shuffle')
							.on('click', function() {
								logEvent('list:reorder', { action: 'shuffle' });
							})
					);

					listContainer.append(controls);
					wrapper.append(listContainer);

				} else if (demoType === 'shared-elements') {
					// Shared elements demo
					wrapper.append(
						D.create('div')
							.style({ textAlign: 'center', padding: '40px' })
							.append(
								D.create('i')
									.classAdd('fas', 'fa-layer-group')
									.style({ fontSize: '48px', color: 'var(--pro-primary)', marginBottom: '16px', display: 'block' })
							)
							.append(
								D.create('h4').text('Shared Element Transitions')
							)
							.append(
								D.create('p')
									.style({ color: 'var(--pro-text-secondary)' })
									.text('Use data-morph-child attributes to match elements between source and target')
							)
					);
				}

				container.appendChild(wrapper.el);
			}
		},

		MorphPanel: {
			name: 'MorphPanel',
			icon: 'fa-window-maximize',
			description: 'FLIP-animated panels that morph from trigger elements with optional forms',
			defaultProps: {
				position: 'center',
				size: 'md',
				duration: 300,
				backdrop: true,
				closeOnBackdrop: true,
				demoType: 'triggers'
			},
			propsSchema: {
				position: { type: 'select', label: 'Position', options: [
					{ value: 'center', label: 'Center (Modal)' },
					{ value: 'top', label: 'Top' },
					{ value: 'bottom', label: 'Bottom' },
					{ value: 'left', label: 'Left (Drawer)' },
					{ value: 'right', label: 'Right (Drawer)' }
				]},
				size: { type: 'select', label: 'Size', options: [
					{ value: 'sm', label: 'Small' },
					{ value: 'md', label: 'Medium' },
					{ value: 'lg', label: 'Large' },
					{ value: 'xl', label: 'Extra Large' },
					{ value: 'full', label: 'Full Screen' }
				]},
				duration: { type: 'select', label: 'Animation Duration', options: [
					{ value: 150, label: '150ms (Fast)' },
					{ value: 300, label: '300ms (Default)' },
					{ value: 450, label: '450ms (Slow)' },
					{ value: 600, label: '600ms (Very Slow)' }
				]},
				backdrop: { type: 'boolean', label: 'Show Backdrop' },
				closeOnBackdrop: { type: 'boolean', label: 'Close on Backdrop Click' },
				demoType: { type: 'select', label: 'Demo Type', options: [
					{ value: 'triggers', label: 'Trigger Morphing' },
					{ value: 'sizes', label: 'Size Comparison' },
					{ value: 'no-trigger', label: 'No Trigger (CSS Fallback)' }
				]}
			},
			initCode: function(props) {
				var code = '// Register a MorphPanel\n';
				code += "var panel = Funky.MorphPanel.register('my-panel', {\n";
				code += "  position: '" + (props.position || 'center') + "',\n";
				code += "  size: '" + (props.size || 'md') + "',\n";
				code += '  duration: ' + (props.duration || 300) + ',\n';
				code += '  backdrop: ' + (props.backdrop !== false) + ',\n';
				code += '  closeOnBackdrop: ' + (props.closeOnBackdrop !== false) + ',\n';
				code += '  header: { title: "My Panel", icon: "fas fa-edit" },\n';
				code += '  content: "<p>Panel content goes here</p>"\n';
				code += '});\n\n';
				code += '// Show from a trigger element (FLIP morph animation)\n';
				code += "var trigger = D.one('#my-button');\n";
				code += "Funky.MorphPanel.show('my-panel', trigger);\n\n";
				code += '// Show without trigger (CSS fallback animation)\n';
				code += "Funky.MorphPanel.show('my-panel');\n\n";
				code += '// Hide the panel\n';
				code += "Funky.MorphPanel.hide('my-panel');\n\n";
				code += '// Form mode with schema\n';
				code += "var formPanel = Funky.MorphPanel.register('edit-user', {\n";
				code += "  position: 'right',\n";
				code += "  size: 'md',\n";
				code += "  formMode: true,\n";
				code += "  formSchema: {\n";
				code += "    name: { type: 'text', label: 'Name', required: true },\n";
				code += "    email: { type: 'email', label: 'Email', required: true }\n";
				code += '  },\n';
				code += '  onSubmit: function(data) {\n';
				code += "    console.log('Form submitted:', data);\n";
				code += '  }\n';
				code += '});\n\n';
				code += '// Show with data for editing\n';
				code += "Funky.MorphPanel.show('edit-user', trigger, {\n";
				code += "  name: 'John Doe',\n";
				code += "  email: 'john@example.com'\n";
				code += '});';
				return code;
			}
		},

		IdleDetector: {
			name: 'IdleDetector',
			icon: 'fa-hourglass-half',
			description: 'User activity tracking and idle state detection',
			defaultProps: {
				idleTimeout: 5000,
				awayTimeout: 3000,
				throttle: 500,
				trackVisibility: true,
				debug: true
			},
			propsSchema: {
				idleTimeout: { type: 'number', label: 'Idle Timeout (ms)', min: 1000, max: 60000 },
				awayTimeout: { type: 'number', label: 'Away Timeout (ms)', min: 1000, max: 30000 },
				throttle: { type: 'number', label: 'Throttle (ms)', min: 100, max: 2000 },
				trackVisibility: { type: 'boolean', label: 'Track Visibility' },
				debug: { type: 'boolean', label: 'Debug Mode' }
			},
			initCode: function(props) {
				var code = '// Initialize IdleDetector\n';
				code += 'Funky.IdleDetector.init({\n';
				code += '  idleTimeout: ' + (props.idleTimeout || 300000) + ',  // Time until idle\n';
				code += '  awayTimeout: ' + (props.awayTimeout || 60000) + ',   // Time until away (when hidden)\n';
				code += '  throttle: ' + (props.throttle || 1000) + ',          // Activity throttle\n';
				code += '  trackVisibility: ' + (props.trackVisibility !== false) + ',\n';
				code += '  debug: ' + (props.debug || false) + '\n';
				code += '});\n\n';
				code += '// Event handlers\n';
				code += "Funky.IdleDetector.on('idle', function(data) {\n";
				code += "  console.log('User went idle:', data.idleTime, 'ms');\n";
				code += '});\n\n';
				code += "Funky.IdleDetector.on('active', function(data) {\n";
				code += "  console.log('User active again after:', data.idleDuration, 'ms');\n";
				code += '});\n\n';
				code += '// State checks\n';
				code += 'Funky.IdleDetector.isIdle();       // Check if idle\n';
				code += 'Funky.IdleDetector.isAway();       // Check if away (tab hidden)\n';
				code += 'Funky.IdleDetector.getIdleTime();  // Ms since last activity\n';
				code += 'Funky.IdleDetector.getStateInfo(); // Full state object\n\n';
				code += '// Control\n';
				code += 'Funky.IdleDetector.triggerActivity();  // Reset idle timer\n';
				code += 'Funky.IdleDetector.pause();            // Pause detection\n';
				code += 'Funky.IdleDetector.resume();           // Resume detection';
				return code;
			}
		},

		PointerTracker: {
			name: 'PointerTracker',
			icon: 'fa-pen-fancy',
			description: 'Continuous pointer tracking with pressure and velocity',
			defaultProps: {
				pressure: true,
				velocity: true,
				tilt: false,
				coalesced: false,
				throttle: 0
			},
			propsSchema: {
				pressure: { type: 'boolean', label: 'Track Pressure' },
				velocity: { type: 'boolean', label: 'Calculate Velocity' },
				tilt: { type: 'boolean', label: 'Track Tilt (Stylus)' },
				coalesced: { type: 'boolean', label: 'Coalesced Events' },
				throttle: { type: 'select', label: 'Throttle', options: [
					{ value: 0, label: 'None' },
					{ value: 8, label: '8ms (~120fps)' },
					{ value: 16, label: '16ms (~60fps)' },
					{ value: 32, label: '32ms (~30fps)' }
				]}
			},
			initCode: function(props) {
				var code = '// Initialize PointerTracker on an element\n';
				code += 'var tracker = new Funky.PointerTracker(canvas, {\n';
				code += '  pressure: ' + (props.pressure !== false) + ',\n';
				code += '  velocity: ' + (props.velocity !== false) + ',\n';
				code += '  tilt: ' + (props.tilt || false) + ',\n';
				code += '  coalesced: ' + (props.coalesced || false) + ',\n';
				code += '  throttle: ' + (props.throttle || 0) + ',\n\n';
				code += '  onStart: function(point) {\n';
				code += '    ctx.beginPath();\n';
				code += '    ctx.moveTo(point.x, point.y);\n';
				code += '  },\n\n';
				code += '  onMove: function(point) {\n';
				code += '    // Line width from pressure (1-10px)\n';
				code += '    ctx.lineWidth = 1 + point.pressure * 9;\n';
				code += '    ctx.lineTo(point.x, point.y);\n';
				code += '    ctx.stroke();\n';
				code += '    ctx.beginPath();\n';
				code += '    ctx.moveTo(point.x, point.y);\n';
				code += '  },\n\n';
				code += '  onEnd: function(point) {\n';
				code += '    ctx.closePath();\n';
				code += '  }\n';
				code += '});\n\n';
				code += '// Check if tracking\n';
				code += 'tracker.isActive();  // true while pointer is down\n\n';
				code += '// Cleanup\n';
				code += 'tracker.destroy();';
				return code;
			}
		},

		Signature: {
			name: 'Signature',
			icon: 'fa-signature',
			description: 'Canvas-based signature capture with touch and pressure support',
			defaultProps: {
				width: 400,
				height: 200,
				penColour: '#000000',
				penWidth: 2,
				backgroundColour: '#ffffff',
				minWidth: 0.5,
				maxWidth: 2.5,
				showTypedOption: true,
				required: false
			},
			propsSchema: {
				width: { type: 'number', label: 'Width', min: 200, max: 800 },
				height: { type: 'number', label: 'Height', min: 100, max: 400 },
				penColour: { type: 'colour', label: 'Pen Colour' },
				penWidth: { type: 'number', label: 'Pen Width', min: 1, max: 10 },
				backgroundColour: { type: 'colour', label: 'Background' },
				minWidth: { type: 'number', label: 'Min Width (pressure)', min: 0.1, max: 5 },
				maxWidth: { type: 'number', label: 'Max Width (pressure)', min: 1, max: 10 },
				showTypedOption: { type: 'boolean', label: 'Show Typed Option' },
				required: { type: 'boolean', label: 'Required' }
			},
			initCode: function(props) {
				var code = '// Initialize Signature\n';
				code += 'var signature = Funky.Signature.init(\'#signature-container\', {\n';
				code += '  width: ' + (props.width || 400) + ',\n';
				code += '  height: ' + (props.height || 200) + ',\n';
				code += '  penColour: \'' + (props.penColour || '#000000') + '\',\n';
				code += '  backgroundColour: \'' + (props.backgroundColour || '#ffffff') + '\',\n';
				code += '  showTypedOption: ' + (props.showTypedOption !== false) + ',\n';
				code += '  required: ' + (props.required || false) + '\n';
				code += '});\n\n';
				code += '// Export as PNG data URL\n';
				code += 'var dataURL = signature.toDataURL();\n\n';
				code += '// Export as SVG\n';
				code += 'var svg = signature.toSVG();\n\n';
				code += '// Check if empty\n';
				code += 'if (!signature.isEmpty()) {\n';
				code += '  console.log(\'Signature provided\');\n';
				code += '}\n\n';
				code += '// Clear signature\n';
				code += 'signature.clear();\n\n';
				code += '// Undo last stroke\n';
				code += 'signature.undo();';
				return code;
			}
		},

		Accordion: {
			name: 'Accordion',
			icon: 'fa-bars-staggered',
			description: 'Collapsible panel system with search, lazy loading, and keyboard navigation',
			defaultProps: {
				itemCount: 3,
				allowMultiple: true,
				expandFirst: true,
				collapsible: true,
				animated: true,
				iconPosition: 'right',
				searchable: false,
				showBadges: false,
				showNested: false,
				disableSecond: false
			},
			propsSchema: {
				itemCount: { type: 'number', label: 'Item Count', min: 1, max: 6 },
				allowMultiple: { type: 'boolean', label: 'Allow Multiple Open' },
				expandFirst: { type: 'boolean', label: 'Expand First Item' },
				collapsible: { type: 'boolean', label: 'All Collapsible' },
				animated: { type: 'boolean', label: 'Animated' },
				iconPosition: { type: 'select', label: 'Chevron Position', options: ['left', 'right'] },
				searchable: { type: 'boolean', label: 'Show Search' },
				showBadges: { type: 'boolean', label: 'Show Badges' },
				showNested: { type: 'boolean', label: 'Show Nested Items' },
				disableSecond: { type: 'boolean', label: 'Disable Second Item' }
			},
			initCode: function(props) {
				var code = '// Create accordion\n';
				code += 'var accordion = Funky.Accordion.init(\'#container\', {\n';
				code += '  items: [\n';
				code += '    { id: \'section-1\', title: \'Getting Started\', content: \'<p>Welcome...</p>\' },\n';
				code += '    { id: \'section-2\', title: \'Configuration\', content: \'<p>Options...</p>\' },\n';
				code += '    { id: \'section-3\', title: \'Advanced\', content: \'<p>Power user...</p>\' }\n';
				code += '  ],\n';
				code += '  allowMultiple: ' + (props.allowMultiple !== false) + ',\n';
				code += '  expandFirst: ' + (props.expandFirst !== false) + ',\n';
				code += '  collapsible: ' + (props.collapsible !== false) + ',\n';
				code += '  animated: ' + (props.animated !== false) + ',\n';
				code += '  iconPosition: \'' + (props.iconPosition || 'right') + '\',\n';
				code += '  searchable: ' + (props.searchable === true) + '\n';
				code += '});\n\n';
				code += '// Programmatic control\n';
				code += 'accordion.expand(\'section-1\');\n';
				code += 'accordion.collapse(\'section-2\');\n';
				code += 'accordion.toggle(\'section-3\');\n\n';
				code += '// Expand/collapse all\n';
				code += 'accordion.expandAll();\n';
				code += 'accordion.collapseAll();\n\n';
				code += '// Query state\n';
				code += 'accordion.isExpanded(\'section-1\'); // true/false\n';
				code += 'accordion.getExpanded(); // [\'section-1\', ...]\n\n';
				code += '// Listen for events\n';
				code += 'container.addEventListener(\'funky.accordion.expand\', function(e) {\n';
				code += '  console.log(\'Expanded:\', e.detail.id);\n';
				code += '});';
				return code;
			}
		},

		Markdown: {
			name: 'Markdown',
			icon: 'fa-file-alt',
			description: 'Markdown renderer with syntax highlighting, GFM extensions, and TOC',
			defaultProps: {
				sampleType: 'full',
				syntaxHighlight: true,
				lineNumbers: false,
				headingAnchors: false,
				showToc: false,
				tocPosition: 'top-right',
				tocSticky: true,
				density: ''
			},
			propsSchema: {
				sampleType: { type: 'select', label: 'Sample Content', options: [
					{ value: 'basic', label: 'Basic Text' },
					{ value: 'code', label: 'Code Blocks' },
					{ value: 'table', label: 'Tables' },
					{ value: 'abbr', label: 'Abbreviations' },
					{ value: 'full', label: 'Full Demo' }
				]},
				syntaxHighlight: { type: 'boolean', label: 'Syntax Highlighting' },
				lineNumbers: { type: 'boolean', label: 'Line Numbers' },
				headingAnchors: { type: 'boolean', label: 'Heading Anchors' },
				showToc: { type: 'boolean', label: 'Show TOC' },
				tocPosition: { type: 'select', label: 'TOC Position', options: [
					{ value: 'top-left', label: 'Top Left' },
					{ value: 'top-right', label: 'Top Right' },
					{ value: 'bottom-left', label: 'Bottom Left' },
					{ value: 'bottom-right', label: 'Bottom Right' }
				]},
				tocSticky: { type: 'boolean', label: 'TOC Sticky' },
				density: { type: 'select', label: 'Density', options: [
					{ value: '', label: 'Default' },
					{ value: 'compact', label: 'Compact' },
					{ value: 'comfortable', label: 'Comfortable' }
				]}
			},
			initCode: function(props) {
				var code = '// Render markdown to container\n';
				code += 'Funky.Markdown.renderTo(markdown, \'#content\', {\n';
				code += '  syntaxHighlight: ' + (props.syntaxHighlight !== false) + ',\n';
				code += '  lineNumbers: ' + (props.lineNumbers === true) + ',\n';
				code += '  headingAnchors: ' + (props.headingAnchors === true) + ',\n';
				if (props.density) {
					code += '  density: \'' + props.density + '\',\n';
				}
				code += '  abbreviations: true\n';
				code += '});\n\n';
				code += '// Extract headings for TOC\n';
				code += 'var headings = Funky.Markdown.extractHeadings(markdown);\n';
				code += 'var toc = Funky.Markdown.renderToc(headings, { maxLevel: 3 });\n\n';
				code += '// Load markdown from file\n';
				code += 'Funky.Markdown.renderFile(\'/docs/api.md\', \'#docs\', {\n';
				code += '  syntaxHighlight: true,\n';
				code += '  linkTarget: \'_blank\'\n';
				code += '});\n\n';
				code += '// Prefetch for performance\n';
				code += 'Funky.Markdown.prefetch(\'/docs/guide.md\');\n\n';
				code += '// Listen for events\n';
				code += 'container.addEventListener(\'funky.markdown.render\', function(e) {\n';
				code += '  console.log(\'Rendered:\', e.detail.headings.length, \'headings\');\n';
				code += '});';
				return code;
			}
		},

		Channel: {
			name: 'Channel',
			icon: 'fa-broadcast-tower',
			description: 'Real-time room-based pub/sub with member tracking',
			defaultProps: {
				channelName: 'room:demo',
				userName: 'Demo User',
				simulateMembers: true,
				memberCount: 3,
				messageInterval: 0
			},
			propsSchema: {
				channelName: { type: 'string', label: 'Channel Name' },
				userName: { type: 'string', label: 'User Name' },
				simulateMembers: { type: 'boolean', label: 'Simulate Members' },
				memberCount: { type: 'number', label: 'Simulated Member Count', min: 1, max: 10 },
				messageInterval: { type: 'select', label: 'Auto-Message Interval', options: [
					{ value: 0, label: 'Off' },
					{ value: 2000, label: '2 seconds' },
					{ value: 5000, label: '5 seconds' },
					{ value: 10000, label: '10 seconds' }
				]}
			},
			initCode: function(props) {
				var code = '// Initialize Channel with WebSocket\n';
				code += 'Funky.Channel.init({\n';
				code += '  websocket: Funky.WebSocket,\n';
				code += '  userId: \'user-123\',\n';
				code += '  userName: \'' + (props.userName || 'My Name') + '\',\n';
				code += '  autoReconnect: true,\n';
				code += '  debug: true\n';
				code += '});\n\n';

				code += '// Join a channel\n';
				code += 'Funky.Channel.join(\'' + (props.channelName || 'room:demo') + '\', {\n';
				code += '  metadata: { role: \'member\' },\n';
				code += '  onJoin: function(members) {\n';
				code += '    console.log(\'Joined with\', members.length, \'members\');\n';
				code += '  }\n';
				code += '});\n\n';

				code += '// Subscribe to messages\n';
				code += 'Funky.Channel.subscribe(\'' + (props.channelName || 'room:demo') + '\', function(message, sender) {\n';
				code += '  console.log(sender.name + \':\', message.text);\n';
				code += '});\n\n';

				code += '// Publish a message\n';
				code += 'Funky.Channel.publish(\'' + (props.channelName || 'room:demo') + '\', {\n';
				code += '  type: \'chat\',\n';
				code += '  text: \'Hello everyone!\'\n';
				code += '});\n\n';

				code += '// Listen for member events\n';
				code += 'Funky.Channel.on(\'join\', function(data) {\n';
				code += '  console.log(data.member.name + \' joined\');\n';
				code += '});\n\n';

				code += '// Query members\n';
				code += 'Funky.Channel.getMembers(\'' + (props.channelName || 'room:demo') + '\');\n';
				code += 'Funky.Channel.getMemberCount(\'' + (props.channelName || 'room:demo') + '\');\n\n';

				code += '// Leave channel\n';
				code += 'Funky.Channel.leave(\'' + (props.channelName || 'room:demo') + '\');';

				return code;
			},
			render: function(container, props, logEvent) {
				D.wrap(container).empty();

				var channelName = props.channelName || 'room:demo';

				// Create demo UI
				var wrapper = document.createElement('div');
				wrapper.className = 'channel-playground';
				wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 16px; height: 100%; min-height: 400px;';

				// Channel info header
				var header = document.createElement('div');
				header.className = 'channel-header';
				header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--pro-surface); border-radius: 8px; border: 1px solid var(--pro-border);';
				header.innerHTML =
					'<div style="display: flex; align-items: center; gap: 12px;">' +
						'<i class="fas fa-broadcast-tower" style="color: var(--pro-primary); font-size: 1.25rem;"></i>' +
						'<div>' +
							'<div style="font-weight: 600;">' + channelName + '</div>' +
							'<div class="member-count" style="font-size: 0.875rem; color: var(--pro-text-secondary);">0 members</div>' +
						'</div>' +
					'</div>' +
					'<div class="connection-status" style="display: flex; align-items: center; gap: 8px;">' +
						'<span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--pro-warning);"></span>' +
						'<span style="font-size: 0.875rem;">Simulated</span>' +
					'</div>';
				wrapper.appendChild(header);

				// Main content area (members + messages)
				var content = document.createElement('div');
				content.style.cssText = 'display: flex; gap: 16px; flex: 1; min-height: 0;';

				// Members panel
				var membersPanel = document.createElement('div');
				membersPanel.className = 'members-panel';
				membersPanel.style.cssText = 'width: 200px; flex-shrink: 0; background: var(--pro-surface); border-radius: 8px; border: 1px solid var(--pro-border); overflow: hidden;';
				membersPanel.innerHTML =
					'<div style="padding: 12px; border-bottom: 1px solid var(--pro-border); font-weight: 600; font-size: 0.875rem;">Members</div>' +
					'<div class="members-list" style="padding: 8px; max-height: 300px; overflow-y: auto;"></div>';
				content.appendChild(membersPanel);

				// Messages area
				var messagesArea = document.createElement('div');
				messagesArea.style.cssText = 'flex: 1; display: flex; flex-direction: column; background: var(--pro-surface); border-radius: 8px; border: 1px solid var(--pro-border); overflow: hidden;';
				messagesArea.innerHTML =
					'<div style="padding: 12px; border-bottom: 1px solid var(--pro-border); font-weight: 600; font-size: 0.875rem;">Messages</div>' +
					'<div class="messages-list" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;"></div>' +
					'<div class="message-input-area" style="padding: 12px; border-top: 1px solid var(--pro-border); display: flex; gap: 8px;">' +
						'<input type="text" class="message-input" placeholder="Type a message..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--pro-border); border-radius: 6px; background: var(--pro-bg); color: var(--pro-text);">' +
						'<button class="send-btn" style="padding: 8px 16px; background: var(--pro-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Send</button>' +
					'</div>';
				content.appendChild(messagesArea);

				wrapper.appendChild(content);
				container.appendChild(wrapper);

				// Get DOM references
				var membersList = wrapper.querySelector('.members-list');
				var messagesList = wrapper.querySelector('.messages-list');
				var messageInput = wrapper.querySelector('.message-input');
				var sendBtn = wrapper.querySelector('.send-btn');
				var memberCountEl = wrapper.querySelector('.member-count');

				// Simulated state
				var members = [];
				var messages = [];
				var currentUser = {
					id: 'user-' + Math.floor(Math.random() * 1000),
					name: props.userName || 'You'
				};

				// Add current user
				members.push(currentUser);

				// Simulate other members if enabled
				if (props.simulateMembers) {
					var simulatedNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
					var count = Math.min(props.memberCount || 3, simulatedNames.length);
					for (var i = 0; i < count; i++) {
						members.push({
							id: 'sim-user-' + i,
							name: simulatedNames[i],
							simulated: true
						});
					}
				}

				// Render members
				function renderMembers() {
					membersList.innerHTML = '';
					memberCountEl.textContent = members.length + ' member' + (members.length !== 1 ? 's' : '');

					members.forEach(function(member) {
						var memberEl = document.createElement('div');
						memberEl.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px;' +
							(member.id === currentUser.id ? ' background: var(--pro-primary-alpha, rgba(59, 130, 246, 0.1));' : '');
						memberEl.innerHTML =
							'<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--pro-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem;">' +
								member.name.charAt(0).toUpperCase() +
							'</div>' +
							'<div>' +
								'<div style="font-weight: 500; font-size: 0.875rem;">' + member.name + (member.id === currentUser.id ? ' (you)' : '') + '</div>' +
								'<div style="font-size: 0.75rem; color: var(--pro-text-secondary);">' + (member.simulated ? 'Simulated' : 'Active') + '</div>' +
							'</div>';
						membersList.appendChild(memberEl);
					});
				}

				// Render messages
				function renderMessages() {
					messagesList.innerHTML = '';

					if (messages.length === 0) {
						messagesList.innerHTML = '<div style="text-align: center; color: var(--pro-text-secondary); padding: 32px;">No messages yet. Send one to start!</div>';
						return;
					}

					messages.forEach(function(msg) {
						var isOwnMessage = msg.sender.id === currentUser.id;
						var msgEl = document.createElement('div');
						msgEl.style.cssText = 'display: flex; flex-direction: column; ' +
							(isOwnMessage ? 'align-items: flex-end;' : 'align-items: flex-start;');
						msgEl.innerHTML =
							'<div style="font-size: 0.75rem; color: var(--pro-text-secondary); margin-bottom: 4px;">' + msg.sender.name + '</div>' +
							'<div style="padding: 8px 12px; border-radius: 12px; max-width: 70%; ' +
								(isOwnMessage ? 'background: var(--pro-primary); color: white;' : 'background: var(--pro-bg); border: 1px solid var(--pro-border);') +
							'">' + msg.text + '</div>';
						messagesList.appendChild(msgEl);
					});

					// Scroll to bottom
					messagesList.scrollTop = messagesList.scrollHeight;
				}

				// Add message
				function addMessage(text, sender) {
					messages.push({
						id: 'msg-' + Date.now(),
						text: text,
						sender: sender,
						timestamp: new Date()
					});
					renderMessages();
					logEvent('message', { channel: channelName, text: text, sender: sender.name });
				}

				// Send message handler
				function sendMessage() {
					var text = messageInput.value.trim();
					if (!text) return;

					addMessage(text, currentUser);
					messageInput.value = '';

					// Simulate response from random member if enabled
					if (props.simulateMembers && members.length > 1) {
						var delay = 500 + Math.random() * 1500;
						setTimeout(function() {
							var otherMembers = members.filter(function(m) { return m.id !== currentUser.id; });
							var responder = otherMembers[Math.floor(Math.random() * otherMembers.length)];
							var responses = [
								'Got it!',
								'Interesting...',
								'Thanks for sharing!',
								'I see what you mean.',
								'Makes sense!',
								'Cool!',
								'Noted.',
								'Good point!'
							];
							addMessage(responses[Math.floor(Math.random() * responses.length)], responder);
						}, delay);
					}
				}

				sendBtn.addEventListener('click', sendMessage);
				messageInput.addEventListener('keypress', function(e) {
					if (e.key === 'Enter') sendMessage();
				});

				// Auto-message interval
				var autoMessageInterval = null;
				if (props.messageInterval && props.messageInterval > 0 && props.simulateMembers) {
					var autoMessages = [
						'Anyone here?',
						'Just checking in...',
						'How\'s everyone doing?',
						'Updates?',
						'Any news?',
						'Hello!',
						'What\'s happening?'
					];
					autoMessageInterval = setInterval(function() {
						var otherMembers = members.filter(function(m) { return m.id !== currentUser.id; });
						if (otherMembers.length > 0) {
							var sender = otherMembers[Math.floor(Math.random() * otherMembers.length)];
							addMessage(autoMessages[Math.floor(Math.random() * autoMessages.length)], sender);
						}
					}, props.messageInterval);
				}

				// Log initial join
				logEvent('joined', { channel: channelName, members: members.length });

				// Initial render
				renderMembers();
				renderMessages();

				// Cleanup function
				container._channelCleanup = function() {
					if (autoMessageInterval) {
						clearInterval(autoMessageInterval);
					}
				};
			}
		},

		TypingIndicator: {
			name: 'TypingIndicator',
			icon: 'fa-ellipsis-h',
			description: 'Real-time typing status display with animated dots',
			defaultProps: {
				showDots: true,
				timeout: 3000,
				debounce: 300,
				maxTypers: 5,
				simulateTypers: true,
				typerCount: 2,
				variant: 'default'
			},
			propsSchema: {
				showDots: { type: 'boolean', label: 'Show Animated Dots' },
				timeout: { type: 'number', label: 'Auto-Stop Timeout (ms)', min: 1000, max: 10000, step: 500 },
				debounce: { type: 'number', label: 'Debounce Delay (ms)', min: 100, max: 1000, step: 50 },
				maxTypers: { type: 'number', label: 'Max Typer Names', min: 1, max: 10 },
				simulateTypers: { type: 'boolean', label: 'Simulate Remote Typers' },
				typerCount: { type: 'number', label: 'Simulated Typer Count', min: 1, max: 5 },
				variant: { type: 'select', label: 'Style Variant', options: [
					{ value: 'default', label: 'Default' },
					{ value: 'bubble', label: 'Bubble' },
					{ value: 'inline', label: 'Inline' },
					{ value: 'sm', label: 'Small' },
					{ value: 'lg', label: 'Large' }
				]}
			},
			initCode: function(props) {
				var code = '// Create typing indicator\n';
				code += 'var indicator = Funky.TypingIndicator.create({\n';
				code += '  container: \'#typing-container\',\n';
				code += '  channel: \'chat:room-1\',\n';
				code += '  timeout: ' + (props.timeout || 3000) + ',\n';
				code += '  debounce: ' + (props.debounce || 300) + ',\n';
				code += '  maxTypers: ' + (props.maxTypers || 5) + ',\n';
				code += '  showDots: ' + (props.showDots !== false) + '\n';
				code += '});\n\n';

				code += '// Bind to an input element\n';
				code += 'indicator.bindInput(\'#message-input\');\n\n';

				code += '// Add remote typers\n';
				code += 'indicator.addTyper({ id: \'user-1\', name: \'John\' });\n';
				code += 'indicator.addTyper({ id: \'user-2\', name: \'Jane\' });\n\n';

				code += '// Get formatted text\n';
				code += 'indicator.getText(); // "John and Jane are typing..."\n\n';

				code += '// Listen for changes\n';
				code += 'indicator.on(\'change\', function(data) {\n';
				code += '  console.log(data.typers.length + \' typing\');\n';
				code += '});\n\n';

				code += '// Manual control\n';
				code += 'indicator.startTyping();\n';
				code += 'indicator.stopTyping();\n\n';

				code += '// Static helper\n';
				code += 'Funky.TypingIndicator.formatText([{ name: \'John\' }]);\n';
				code += '// "John is typing..."';

				return code;
			},
			render: function(container, props, logEvent) {
				D.wrap(container).empty();

				// Render is handled by canvas - this is just for props panel preview
				var preview = document.createElement('div');
				preview.className = 'typing-indicator-preview';
				preview.style.cssText = 'padding: 16px; text-align: center; color: var(--pro-text-secondary);';
				preview.innerHTML = '<p>TypingIndicator renders in the canvas.</p>';
				container.appendChild(preview);
			}
		},

		Presence: {
			name: 'Presence',
			icon: 'fa-users',
			description: 'Real-time user presence with avatar stacks, status dots, and typing indicators',
			defaultProps: {
				showAvatarStack: true,
				showViewersList: true,
				showStatusDot: true,
				showTypingIndicator: true,
				maxAvatars: 5,
				excludeSelf: false,
				simulateUsers: true,
				userCount: 4,
				showTypingUsers: true,
				currentStatus: 'online'
			},
			propsSchema: {
				showAvatarStack: { type: 'boolean', label: 'Show Avatar Stack' },
				showViewersList: { type: 'boolean', label: 'Show Viewers List' },
				showStatusDot: { type: 'boolean', label: 'Show Status Dot' },
				showTypingIndicator: { type: 'boolean', label: 'Show Typing Indicator' },
				maxAvatars: { type: 'number', label: 'Max Avatars', min: 1, max: 10 },
				excludeSelf: { type: 'boolean', label: 'Exclude Self from List' },
				simulateUsers: { type: 'boolean', label: 'Simulate Remote Users' },
				userCount: { type: 'number', label: 'Simulated User Count', min: 1, max: 10 },
				showTypingUsers: { type: 'boolean', label: 'Simulate Typing Users' },
				currentStatus: { type: 'select', label: 'Current User Status', options: [
					{ value: 'online', label: 'Online' },
					{ value: 'away', label: 'Away' },
					{ value: 'idle', label: 'Idle' },
					{ value: 'busy', label: 'Busy' },
					{ value: 'offline', label: 'Offline' }
				]}
			},
			initCode: function(props) {
				var code = '// Initialize Presence system\n';
				code += 'Funky.Presence.init({\n';
				code += '  userId: \'user-123\',\n';
				code += '  userName: \'John Doe\',\n';
				code += '  userAvatar: \'/avatars/john.jpg\',\n';
				code += '  autoJoinPage: true\n';
				code += '});\n\n';

				code += '// Join a channel\n';
				code += 'Funky.Presence.join(\'page:/trades/123\', {\n';
				code += '  status: \'viewing\'\n';
				code += '});\n\n';

				code += '// Get other users in channel\n';
				code += 'var others = Funky.Presence.getOtherUsers(\'page:/trades/123\');\n';
				code += 'console.log(others.length + \' other users viewing\');\n\n';

				code += '// Create avatar stack UI\n';
				code += 'var stack = Funky.Presence.createAvatarStack(\'#container\', \'page:/trades/123\', {\n';
				code += '  maxAvatars: ' + (props.maxAvatars || 5) + ',\n';
				code += '  excludeSelf: ' + (props.excludeSelf || false) + ',\n';
				code += '  showCount: true\n';
				code += '});\n\n';

				code += '// Create viewers list\n';
				code += 'var list = Funky.Presence.createViewersList(\'#viewers\', \'page:/trades/123\', {\n';
				code += '  label: \'Also viewing:\',\n';
				code += '  showStatus: true\n';
				code += '});\n\n';

				code += '// Create status dot\n';
				code += 'var dot = Funky.Presence.createStatusDot(\'#status\');\n\n';

				code += '// Listen for events\n';
				code += 'Funky.Presence.on(\'user:join\', function(data) {\n';
				code += '  console.log(data.user.name + \' joined\');\n';
				code += '});\n\n';

				code += 'Funky.Presence.on(\'user:leave\', function(data) {\n';
				code += '  console.log(data.user.name + \' left\');\n';
				code += '});\n\n';

				code += '// Set status\n';
				code += 'Funky.Presence.setStatus(\'' + (props.currentStatus || 'online') + '\');\n';
				code += 'Funky.Presence.setChannelStatus(\'page:/trades/123\', \'editing\');\n\n';

				code += '// Typing indicators\n';
				code += 'Funky.Presence.startTyping(\'chat:room-1\');\n';
				code += 'Funky.Presence.stopTyping(\'chat:room-1\');\n\n';

				code += '// Cleanup\n';
				code += 'Funky.Presence.leave(\'page:/trades/123\');\n';
				code += 'Funky.Presence.destroy();';

				return code;
			},
			render: function(container, props, logEvent) {
				D.wrap(container).empty();

				// Render is handled by canvas - this is just for props panel preview
				var preview = document.createElement('div');
				preview.className = 'presence-preview';
				preview.style.cssText = 'padding: 16px; text-align: center; color: var(--pro-text-secondary);';
				preview.innerHTML = '<p>Presence renders in the canvas.</p>';
				container.appendChild(preview);
			}
		},

		Mask: {
			name: 'Mask',
			icon: 'fa-keyboard',
			description: 'Input masking for formatted data entry with validation and redact mode',
			defaultProps: {
				pattern: 'phone',
				placeholder: '_',
				transform: '',
				showRedact: true,
				redactValue: '4111111111111234',
				redactPattern: 'credit-card',
				showLast: 4,
				revealMode: 'click'
			},
			propsSchema: {
				pattern: {
					type: 'select',
					label: 'Pattern Preset',
					options: [
						{ value: 'phone', label: 'Phone (555) 123-4567' },
						{ value: 'phone-intl', label: 'Intl Phone +1 (555) 123-4567' },
						{ value: 'credit-card', label: 'Credit Card' },
						{ value: 'ssn', label: 'SSN 123-45-6789' },
						{ value: 'date', label: 'Date MM/DD/YYYY' },
						{ value: 'date-iso', label: 'Date YYYY-MM-DD' },
						{ value: 'time', label: 'Time 24hr HH:MM' },
						{ value: 'zip', label: 'ZIP 12345' },
						{ value: 'zip-plus4', label: 'ZIP+4 12345-6789' },
						{ value: 'expiry', label: 'Expiry MM/YY' },
						{ value: '(999) 999-9999', label: 'Custom: (999) 999-9999' },
						{ value: 'AAA-9999', label: 'Custom: AAA-9999' }
					]
				},
				transform: {
					type: 'select',
					label: 'Transform',
					options: [
						{ value: '', label: 'None' },
						{ value: 'uppercase', label: 'Uppercase' },
						{ value: 'lowercase', label: 'Lowercase' }
					]
				},
				showRedact: { type: 'boolean', label: 'Show Redact Demo' },
				redactPattern: {
					type: 'select',
					label: 'Redact Pattern',
					options: [
						{ value: 'credit-card', label: 'Credit Card' },
						{ value: 'ssn', label: 'SSN' },
						{ value: 'phone', label: 'Phone' }
					]
				},
				showLast: { type: 'number', label: 'Show Last N Chars', min: 0, max: 8 },
				revealMode: {
					type: 'select',
					label: 'Reveal Mode',
					options: [
						{ value: 'click', label: 'Click' },
						{ value: 'hover', label: 'Hover' },
						{ value: 'button', label: 'Button' }
					]
				}
			},
			initCode: function(props) {
				var code = '// Initialize Mask with pattern preset\n';
				code += 'var mask = new Funky.Mask(\'#phone-input\', {\n';
				code += '  pattern: \'' + (props.pattern || 'phone') + '\'\n';
				code += '});\n\n';
				code += '// Get values\n';
				code += 'mask.getRaw();        // "5551234567"\n';
				code += 'mask.getFormatted();  // "(555) 123-4567"\n';
				code += 'mask.isComplete();    // true\n';
				code += 'mask.isValid();       // true (includes Luhn for credit cards)\n\n';
				code += '// Built-in patterns: phone, credit-card, ssn, date, time, zip, expiry\n\n';
				code += '// Card type detection\n';
				code += 'var type = Funky.Mask.detectCardType(\'4111111111111111\');\n';
				code += '// Returns: "visa", "mastercard", "amex", "discover", etc.\n\n';
				code += '// Redact mode for sensitive data\n';
				code += 'var redact = Funky.Mask.redact(\'#ssn-display\', {\n';
				code += '  value: \'123456789\',\n';
				code += '  pattern: \'ssn\',\n';
				code += '  showLast: 4,\n';
				code += '  reveal: \'click\'  // or "hover", "button"\n';
				code += '});\n\n';
				code += '// Custom pattern registration\n';
				code += 'Funky.Mask.registerPattern(\'invoice\', {\n';
				code += '  pattern: \'AAA-9999\',\n';
				code += '  transform: \'uppercase\'\n';
				code += '});';
				return code;
			}
		},

		Form: {
			name: 'Form',
			icon: 'fa-rectangle-list',
			description: 'Native form component with field types, layouts, validation, and LiveBinding',
			defaultProps: {
				// Schema selection
				preset: 'contact',

				// Layout options
				layout: 'linear',
				columns: 2,

				// Field types to show (for custom preset)
				showTextField: true,
				showEmailField: true,
				showNumberField: true,
				showTextareaField: true,
				showSelectField: true,
				showCheckboxField: true,
				showRadioField: true,
				showDateField: true,
				showComboboxField: false,
				showFileField: false,
				showSwitchField: false,
				showTimeField: false,
				showRangeField: false,
				showColorField: false,
				showSearchField: false,
				showCurrencyField: false,
				showPhoneField: false,
				showTagsField: false,
				showRatingField: false,
				showSignatureField: false,
				showCodeField: false,

				// Validation behavior
				validateOnChange: true,
				validateOnBlur: true,
				showErrorsInline: true,

				// Form behavior
				mode: 'create',
				disabled: false,

				// Initial data (JSON string)
				initialData: '{}'
			},
			propsSchema: {
				preset: {
					type: 'select',
					label: 'Preset Schema',
					options: ['contact', 'registration', 'settings', 'custom']
				},
				layout: {
					type: 'select',
					label: 'Layout Type',
					options: ['linear', 'sections', 'columns', 'grid', 'tabs']
				},
				columns: {
					type: 'number',
					label: 'Columns',
					min: 2,
					max: 4,
					visibleWhen: { layout: ['columns', 'grid'] }
				},
				// Field toggles - only visible when preset is 'custom'
				showTextField: { type: 'boolean', label: 'Text Field', visibleWhen: { preset: ['custom'] } },
				showEmailField: { type: 'boolean', label: 'Email Field', visibleWhen: { preset: ['custom'] } },
				showNumberField: { type: 'boolean', label: 'Number Field', visibleWhen: { preset: ['custom'] } },
				showTextareaField: { type: 'boolean', label: 'Textarea Field', visibleWhen: { preset: ['custom'] } },
				showSelectField: { type: 'boolean', label: 'Select Field', visibleWhen: { preset: ['custom'] } },
				showCheckboxField: { type: 'boolean', label: 'Checkbox Field', visibleWhen: { preset: ['custom'] } },
				showRadioField: { type: 'boolean', label: 'Radio Field', visibleWhen: { preset: ['custom'] } },
				showDateField: { type: 'boolean', label: 'Date Field', visibleWhen: { preset: ['custom'] } },
				showComboboxField: { type: 'boolean', label: 'ComboBox Field', visibleWhen: { preset: ['custom'] } },
				showFileField: { type: 'boolean', label: 'File Upload Field', visibleWhen: { preset: ['custom'] } },
				showSwitchField: { type: 'boolean', label: 'Switch Field', visibleWhen: { preset: ['custom'] } },
				showTimeField: { type: 'boolean', label: 'Time Field', visibleWhen: { preset: ['custom'] } },
				showRangeField: { type: 'boolean', label: 'Range/Slider Field', visibleWhen: { preset: ['custom'] } },
				showColorField: { type: 'boolean', label: 'Color Field', visibleWhen: { preset: ['custom'] } },
				showSearchField: { type: 'boolean', label: 'Search Field', visibleWhen: { preset: ['custom'] } },
				showCurrencyField: { type: 'boolean', label: 'Currency Field', visibleWhen: { preset: ['custom'] } },
				showPhoneField: { type: 'boolean', label: 'Phone Field', visibleWhen: { preset: ['custom'] } },
				showTagsField: { type: 'boolean', label: 'Tags Field', visibleWhen: { preset: ['custom'] } },
				showRatingField: { type: 'boolean', label: 'Rating Field', visibleWhen: { preset: ['custom'] } },
				showSignatureField: { type: 'boolean', label: 'Signature Field', visibleWhen: { preset: ['custom'] } },
				showCodeField: { type: 'boolean', label: 'Code Field', visibleWhen: { preset: ['custom'] } },
				validateOnChange: { type: 'boolean', label: 'Validate on Change' },
				validateOnBlur: { type: 'boolean', label: 'Validate on Blur' },
				showErrorsInline: { type: 'boolean', label: 'Show Inline Errors' },
				mode: {
					type: 'select',
					label: 'Form Mode',
					options: ['create', 'edit', 'view']
				},
				disabled: { type: 'boolean', label: 'Disabled' },
				initialData: { type: 'json', label: 'Initial Data (JSON)' }
			},
			initCode: function(props) {
				var code = "// Create a form with native schema\n";
				code += "var form = Funky.Form.create('#my-form', {\n";
				code += "  schema: {\n";
				code += "    fields: {\n";

				// Build fields based on preset
				if (props.preset === 'contact') {
					code += "      name: { type: 'text', label: 'Full Name', required: true },\n";
					code += "      email: { type: 'email', label: 'Email', required: true },\n";
					code += "      phone: { type: 'tel', label: 'Phone' },\n";
					code += "      subject: {\n";
					code += "        type: 'select', label: 'Subject',\n";
					code += "        options: [\n";
					code += "          { value: 'general', label: 'General Inquiry' },\n";
					code += "          { value: 'support', label: 'Technical Support' }\n";
					code += "        ]\n";
					code += "      },\n";
					code += "      message: { type: 'textarea', label: 'Message', required: true, rows: 4 }\n";
				} else if (props.preset === 'registration') {
					code += "      username: { type: 'text', label: 'Username', required: true, minLength: 3 },\n";
					code += "      email: { type: 'email', label: 'Email', required: true },\n";
					code += "      password: { type: 'password', label: 'Password', required: true, minLength: 8 },\n";
					code += "      birthdate: { type: 'date', label: 'Date of Birth' },\n";
					code += "      role: {\n";
					code += "        type: 'radio', label: 'Account Type',\n";
					code += "        options: [{ value: 'personal', label: 'Personal' }, { value: 'business', label: 'Business' }]\n";
					code += "      },\n";
					code += "      terms: { type: 'checkbox', label: 'I agree to terms', required: true }\n";
				} else if (props.preset === 'settings') {
					code += "      display_name: { type: 'text', label: 'Display Name' },\n";
					code += "      timezone: {\n";
					code += "        type: 'select', label: 'Timezone',\n";
					code += "        options: [{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern' }]\n";
					code += "      },\n";
					code += "      notifications: { type: 'checkbox', label: 'Enable notifications' },\n";
					code += "      theme: {\n";
					code += "        type: 'select', label: 'Theme',\n";
					code += "        options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]\n";
					code += "      }\n";
				} else {
					// Custom - show enabled fields
					if (props.showTextField) code += "      name: { type: 'text', label: 'Name', required: true },\n";
					if (props.showEmailField) code += "      email: { type: 'email', label: 'Email', required: true },\n";
					if (props.showNumberField) code += "      age: { type: 'number', label: 'Age', min: 0, max: 150 },\n";
					if (props.showTextareaField) code += "      description: { type: 'textarea', label: 'Description', rows: 3 },\n";
					if (props.showSelectField) {
						code += "      country: {\n";
						code += "        type: 'select', label: 'Country',\n";
						code += "        options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }]\n";
						code += "      },\n";
					}
					if (props.showCheckboxField) code += "      agree: { type: 'checkbox', label: 'I agree to terms' },\n";
					if (props.showRadioField) {
						code += "      priority: {\n";
						code += "        type: 'radio', label: 'Priority',\n";
						code += "        options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]\n";
						code += "      },\n";
					}
					if (props.showDateField) code += "      date: { type: 'date', label: 'Date' },\n";
					if (props.showComboboxField) {
						code += "      tags: {\n";
						code += "        type: 'combobox', label: 'Tags', multiple: true,\n";
						code += "        options: [{ value: 'frontend', label: 'Frontend' }, { value: 'backend', label: 'Backend' }]\n";
						code += "      },\n";
					}
					if (props.showFileField) code += "      attachment: { type: 'file', label: 'Attachment', accept: '.pdf,.doc' },\n";
					if (props.showSwitchField) code += "      enabled: { type: 'switch', label: 'Enabled', onText: 'Yes', offText: 'No' },\n";
					if (props.showTimeField) code += "      meeting_time: { type: 'time', label: 'Meeting Time', step: 900 },\n";
					if (props.showRangeField) code += "      volume: { type: 'range', label: 'Volume', min: 0, max: 100, step: 5 },\n";
					if (props.showColorField) code += "      accent_color: { type: 'color', label: 'Accent Color' },\n";
					if (props.showSearchField) code += "      query: { type: 'search', label: 'Search', placeholder: 'Search...' },\n";
					if (props.showCurrencyField) code += "      amount: { type: 'currency', label: 'Amount', currency: 'USD' },\n";
					if (props.showPhoneField) code += "      phone: { type: 'phone', label: 'Phone Number' },\n";
					if (props.showTagsField) code += "      keywords: { type: 'tags', label: 'Keywords', maxTags: 5 },\n";
					if (props.showRatingField) code += "      rating: { type: 'rating', label: 'Rating', maxStars: 5 },\n";
					if (props.showSignatureField) code += "      signature: { type: 'signature', label: 'Signature', required: true },\n";
					if (props.showCodeField) code += "      code_snippet: { type: 'code', label: 'Code Snippet', language: 'javascript' },\n";
				}

				code += "    }";

				// Add layout if not linear
				if (props.layout !== 'linear') {
					code += ",\n    layout: { type: '" + props.layout + "'";
					if (props.layout === 'columns') {
						code += ", columns: " + (props.columns || 2);
					}
					code += " }";
				}

				code += "\n  },\n";
				code += "  mode: '" + (props.mode || 'create') + "',\n";
				code += "  validateOnChange: " + (props.validateOnChange !== false) + ",\n";
				code += "  validateOnBlur: " + (props.validateOnBlur !== false) + ",\n";
				code += "  onChange: function(detail) {\n";
				code += "    console.log('Field changed:', detail.field, detail.value);\n";
				code += "  },\n";
				code += "  onSubmit: function(data) {\n";
				code += "    console.log('Form submitted:', data);\n";
				code += "    // return fetch('/api/save', { method: 'POST', body: JSON.stringify(data) });\n";
				code += "  },\n";
				code += "  onError: function(detail) {\n";
				code += "    console.log('Validation errors:', detail.errors);\n";
				code += "  }\n";
				code += "});\n\n";
				code += "// API methods:\n";
				code += "// form.getData()           - Get all field values\n";
				code += "// form.setData({ ... })    - Set multiple field values\n";
				code += "// form.validate()          - Validate all fields\n";
				code += "// form.submit()            - Trigger submission\n";
				code += "// form.reset()             - Reset to initial values\n";
				code += "// form.showField('name')   - Show hidden field\n";
				code += "// form.hideField('name')   - Hide field\n";
				code += "// form.destroy()           - Cleanup";

				return code;
			}
		},

		CardGrid: {
			name: 'CardGrid',
			icon: 'fa-grip',
			description: 'Responsive grid of data cards with search, sort, selection, and virtualization',

			defaultProps: {
				itemCount: 12,
				columns: 'auto',
				gap: 'md',
				layout: 'grid',
				searchable: true,
				sortable: true,
				viewToggle: true,
				selectable: 'multi',
				virtualize: false,
				cardMinWidth: '250'
			},

			propsSchema: {
				itemCount: { type: 'number', label: 'Number of Items', min: 1, max: 1000 },
				columns: { type: 'select', label: 'Columns', options: ['auto', '1', '2', '3', '4', '5', '6'] },
				gap: { type: 'select', label: 'Gap', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
				layout: { type: 'select', label: 'Layout', options: ['grid', 'list'] },
				searchable: { type: 'boolean', label: 'Searchable' },
				sortable: { type: 'boolean', label: 'Sortable' },
				viewToggle: { type: 'boolean', label: 'View Toggle' },
				selectable: { type: 'select', label: 'Selection Mode', options: ['false', 'single', 'multi'] },
				virtualize: { type: 'boolean', label: 'Virtualize (for large datasets)' },
				cardMinWidth: { type: 'number', label: 'Card Min Width (px)', min: 100, max: 500 }
			},

			initCode: function(props) {
				var code = "// Create a CardGrid\n";
				code += "var grid = Funky.CardGrid.init('#my-grid', {\n";
				code += "  items: items,\n";
				code += "  columns: '" + props.columns + "',\n";
				code += "  gap: '" + props.gap + "',\n";
				code += "  layout: '" + props.layout + "',\n";
				code += "  cardMinWidth: '" + props.cardMinWidth + "px',\n";
				if (props.searchable) {
					code += "  searchable: true,\n";
					code += "  searchFields: ['name', 'category'],\n";
				}
				if (props.sortable) {
					code += "  sortable: true,\n";
					code += "  sortFields: [\n";
					code += "    { field: 'name', label: 'Name' },\n";
					code += "    { field: 'price', label: 'Price' }\n";
					code += "  ],\n";
				}
				if (props.viewToggle) {
					code += "  viewToggle: true,\n";
				}
				if (props.selectable !== 'false') {
					code += "  selectable: '" + props.selectable + "',\n";
				}
				if (props.virtualize) {
					code += "  virtualize: true,\n";
					code += "  containerHeight: '500px',\n";
				}
				code += "  renderCard: function(item, view) {\n";
				code += "    return D.div().classAdd('product-card')\n";
				code += "      .append(\n";
				code += "        D.div().classAdd('image').style({ backgroundImage: 'url(' + item.image + ')' }),\n";
				code += "        D.div().classAdd('title').text(item.name),\n";
				code += "        D.div().classAdd('price').text('$' + item.price)\n";
				code += "      );\n";
				code += "  }\n";
				code += "});\n\n";
				code += "// API Methods:\n";
				code += "// grid.setItems(items)        - Replace all items\n";
				code += "// grid.addItems(items)        - Append items\n";
				code += "// grid.search(query)          - Filter by search\n";
				code += "// grid.sort(field, direction) - Sort items\n";
				code += "// grid.select(id)             - Select item\n";
				code += "// grid.selectAll()            - Select all\n";
				code += "// grid.clearSelection()       - Clear selection\n";
				code += "// grid.setView('grid'|'list') - Switch layout\n";
				code += "// grid.scrollToItem(id)       - Scroll to item";

				return code;
			}
		},

		StickyHeader: {
			name: 'StickyHeader',
			icon: 'fa-thumbtack',
			description: 'Headers that stick to viewport on scroll with IntersectionObserver detection',
			defaultProps: {
				showShadow: true,
				compactOnStick: false,
				hideSubtitle: true,
				hideOnScrollDown: false,
				showOnScroll: false
			},
			propsSchema: {
				showShadow: { type: 'boolean', label: 'Show Shadow When Sticky' },
				compactOnStick: { type: 'boolean', label: 'Compact Title When Sticky' },
				hideSubtitle: { type: 'boolean', label: 'Hide Subtitle When Sticky' },
				hideOnScrollDown: { type: 'boolean', label: 'Hide Header on Scroll Down' },
				showOnScroll: { type: 'boolean', label: 'Start Hidden, Show on Scroll' }
			},
			initCode: function(props) {
				var code = "// Initialize sticky headers with options\n";
				code += "Funky.StickyHeader.init({\n";
				code += "  showShadow: " + (props.showShadow !== false) + ",\n";
				code += "  compactOnStick: " + (props.compactOnStick === true) + ",\n";
				code += "  hideSubtitle: " + (props.hideSubtitle !== false) + ",\n";
				code += "  hideOnScrollDown: " + (props.hideOnScrollDown === true) + ",\n";
				code += "  showOnScroll: " + (props.showOnScroll === true) + "\n";
				code += "});\n\n";
				code += "// HTML structure:\n";
				code += "// <header class=\"page-header page-header-sticky\">\n";
				code += "//   <h1 class=\"page-header-title\">Page Title</h1>\n";
				code += "//   <p class=\"page-header-subtitle\">Subtitle text</p>\n";
				code += "// </header>\n\n";
				code += "// Update options dynamically:\n";
				code += "// Funky.StickyHeader.updateOptions(element, { showShadow: false });\n\n";
				code += "// Cleanup:\n";
				code += "// Funky.StickyHeader.destroy(element);\n";
				code += "// Funky.StickyHeader.destroyAll();";
				return code;
			}
		},
		SkipLink: {
			name: 'SkipLink',
			icon: 'fa-forward',
			description: 'Accessible skip links for keyboard navigation to bypass repetitive content',
			defaultProps: {
				focusScrollBehavior: 'smooth',
				fKeyStart: 3,
				showHelp: true
			},
			propsSchema: {
				focusScrollBehavior: { type: 'select', label: 'Focus Scroll Behavior', options: ['smooth', 'auto'] },
				fKeyStart: { type: 'select', label: 'F-Key Start', options: [2, 3, 4, 5, 7] },
				showHelp: { type: 'boolean', label: 'Show Help on First Tab' }
			},
			initCode: function(props) {
				var code = "// Initialize skip links\n";
				code += "Funky.SkipLink.init({\n";
				code += "  focusScrollBehavior: '" + (props.focusScrollBehavior || 'smooth') + "',\n";
				code += "  fKeyStart: " + (props.fKeyStart || 3) + "\n";
				code += "});\n\n";
				code += "// HTML attributes for auto-discovery:\n";
				code += "// <main id=\"content\" data-skip-target=\"main\" data-skip-label=\"main content\" data-skip-order=\"0\">\n";
				code += "// <nav data-skip-target=\"nav\" data-skip-label=\"navigation\" data-skip-order=\"1\">\n\n";
				code += "// Manual registration:\n";
				code += "// Funky.SkipLink.register({ label: 'Skip to footer', target: '#footer', order: 10 });\n\n";
				code += "// Programmatic skip:\n";
				code += "// Funky.SkipLink.skipTo('#main-content');\n\n";
				code += "// Refresh after DOM changes:\n";
				code += "// Funky.SkipLink.refresh();";
				return code;
			}
		}
	};

	/**
	 * Playground Constructor
	 */
	function Playground() {
		this.container = null;
		this.iframe = null;
		this.currentComponent = null;
		this.currentProps = {};
		this.eventLog = [];
		this.instances = [];
		
		// DOM references
		this.elements = {};

		// Pending state for restoration from cache
		this._pendingState = null;
	}

	/**
	 * Storage key for playground state persistence
	 */
	var STORAGE_KEY = 'funky_playground_state';

	/**
	 * Save playground state to localStorage
	 */
	function saveState(state) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) {
			// localStorage may be unavailable or full
		}
	}

	/**
	 * Load playground state from localStorage
	 */
	function loadState() {
		try {
			var stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		} catch (e) {
			return null;
		}
	}

	/**
	 * Initialize the playground
	 * @param {string} containerSelector - CSS selector for the container
	 * @param {Object} [state] - Optional state to restore from cache
	 */
	Playground.prototype.init = function(containerSelector, state) {
		var self = this;

		this.container = document.querySelector(containerSelector);
		if (!this.container) {
			console.error('[Playground] Container not found:', containerSelector);
			return this;
		}

		// Restore nav position from localStorage if persisted
		this._restoreNavPosition();

		// If no state passed, try to restore from localStorage (for page refreshes)
		if (!state || !state.component) {
			var savedState = loadState();
			if (savedState && savedState.component && COMPONENTS[savedState.component]) {
				state = savedState;
			}
		}

		// Store state for restoration after canvas is ready
		if (state && state.component) {
			this._pendingState = state;
		}

		// Cache DOM elements
		this._cacheElements();

		// Initialize component sidebar with SideNav
		this._initSideNav();

		// Set up event listeners
		this._setupEventListeners();

		// Set up iframe communication
		this._setupIframeCommunication();

		return this;
	};

	/**
	 * Restore nav position from localStorage
	 */
	Playground.prototype._restoreNavPosition = function() {
		try {
			var savedPosition = localStorage.getItem('funky-playground-nav-position');
			if (savedPosition) {
				var validPositions = ['left', 'right', 'top', 'bottom'];
				if (validPositions.indexOf(savedPosition) !== -1) {
					document.body.setAttribute('data-nav-position', savedPosition);
				}
			}
		} catch (e) {
			// Ignore storage errors
		}
	};

	/**
	 * Destroy and cleanup the playground
	 * @returns {Object} State to preserve in cache
	 */
	Playground.prototype.destroy = function() {
		// Capture state BEFORE cleanup
		var state = {
			component: this.currentComponent,
			props: this.currentProps ? JSON.parse(JSON.stringify(this.currentProps)) : null,
			theme: this.elements.themeSelector ? this.elements.themeSelector.value : 'dark',
			viewport: this.elements.playgroundCanvas ? 
				this.elements.playgroundCanvas.getAttribute('data-viewport') : 'full',
			activePanel: document.querySelector('.panel-tab.active') ?
				document.querySelector('.panel-tab.active').dataset.panel : 'props'
		};

		if (!this.container) {
			return state;
		}

		// Clear event log
		this.eventLog = [];

		// Destroy SideNav if it exists
		if (this.sideNav && typeof this.sideNav.destroy === 'function') {
			this.sideNav.destroy();
			this.sideNav = null;
		}

		// Destroy CodePreview instance if it exists
		if (this._codePreviewInstance && typeof this._codePreviewInstance.destroy === 'function') {
			this._codePreviewInstance.destroy();
			this._codePreviewInstance = null;
		}

		// Clear references
		this.container = null;
		this.iframe = null;
		this.elements = {};
		this.currentComponent = null;
		this.currentProps = {};
		this._pendingState = null;

		return state;  // Return state for Pages cache
	};

	/**
	 * Cache DOM element references
	 */
	Playground.prototype._cacheElements = function() {
		this.iframe = document.getElementById('playgroundIframe');
		this.elements = {
			sidenavContainer: document.getElementById('componentSideNav'),
			currentComponentName: document.getElementById('currentComponentName'),
			themeSelector: document.getElementById('themeSelector'),
			propsEditor: document.getElementById('propsEditor'),
			eventsLog: document.getElementById('eventsLog'),
			codeExample: document.getElementById('codeExample'),
			playgroundCanvas: document.getElementById('playgroundCanvas'),
			
			// Buttons
			addInstanceBtn: document.getElementById('addInstanceBtn'),
			resetPropsBtn: document.getElementById('resetPropsBtn'),
			clearEventsBtn: document.getElementById('clearEventsBtn'),
			copyCodeBtn: document.getElementById('copyCodeBtn'),
			
			// Panels
			propsPanel: document.getElementById('propsPanel'),
			eventsPanel: document.getElementById('eventsPanel'),
			codePanel: document.getElementById('codePanel')
		};
	};

	/**
	 * Initialize component sidebar using Funky.SideNav
	 */
	Playground.prototype._initSideNav = function() {
		var self = this;
		
		// Check if SideNav is available
		if (!Funky.SideNav) {
			console.error('[Playground] Funky.SideNav not available');
			return;
		}
		
		// Check if container exists
		if (!this.elements.sidenavContainer) {
			console.error('[Playground] SideNav container not found');
			return;
		}
		
		// Build items array from COMPONENTS registry
		var items = Object.keys(COMPONENTS).map(function(key) {
			var comp = COMPONENTS[key];
			return {
				id: key,
				label: comp.name,
				icon: 'fas ' + comp.icon,
				description: comp.description
			};
		});
		
		// Initialize SideNav with sorting enabled
		this.sideNav = Funky.SideNav.init(this.elements.sidenavContainer, {
			items: items,
			searchable: true,
			searchPlaceholder: 'Search components...',
			collapsible: false,
			rememberState: true,
			storageKey: 'funky_playground_sidenav',
			sortable: true,
			sortOrder: 'asc',
			sortKey: 'label',
			onChange: function(item) {
				if (item) {
					self._selectComponent(item.id);
					// Only focus iframe if selection was via mouse click (not keyboard)
					// Keyboard users want to stay in sidenav to continue navigating
					if (!item._keyboard) {
						self._focusIframe();
					}
				}
			}
		});
	};

	/**
	 * Focus the iframe for keyboard interaction
	 * Uses FocusManager for proper focus history
	 */
	Playground.prototype._focusIframe = function() {
		if (this.iframe) {
			var self = this;
			// Use setTimeout to ensure the component is rendered first
			setTimeout(function() {
				if (Funky.FocusManager && Funky.FocusManager.focusAndPush) {
					Funky.FocusManager.focusAndPush(self.iframe, { label: 'Playground Canvas' });
				} else {
					self.iframe.focus();
				}
			}, 100);
		}
	};

	/**
	 * Return focus from iframe to sidenav
	 * Uses FocusManager to pop focus history
	 */
	Playground.prototype._focusSideNav = function() {
		if (Funky.FocusManager && Funky.FocusManager.popFocus) {
			Funky.FocusManager.popFocus();
		} else {
			// Fallback if FocusManager not available - focus the search input
			if (this.sideNav && this.sideNav.elements && this.sideNav.elements.search) {
				this.sideNav.elements.search.focus();
			} else if (this.elements.sidenavContainer) {
				// Last resort: try to find any focusable element in sidenav
				var focusable = this.elements.sidenavContainer.querySelector('input, button, [tabindex="0"]');
				if (focusable) {
					focusable.focus();
				}
			}
		}
	};

	/**
	 * Set up event listeners
	 */
	Playground.prototype._setupEventListeners = function() {
		var self = this;
		
		// Theme selector (optional - may be removed from toolbar)
		if (this.elements.themeSelector) {
			this.elements.themeSelector.addEventListener('change', function(e) {
				self._setTheme(e.target.value);
			});
		}
		
		// Viewport buttons
		document.querySelectorAll('.viewport-btn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				self._setViewport(btn.dataset.viewport);
				document.querySelectorAll('.viewport-btn').forEach(function(b) {
					b.classList.remove('active');
				});
				btn.classList.add('active');
			});
		});
		
		// Panel tabs
		document.querySelectorAll('.panel-tab').forEach(function(tab) {
			tab.addEventListener('click', function() {
				self._switchPanel(tab.dataset.panel);
			});
		});
		
		// Reset props
		this.elements.resetPropsBtn.addEventListener('click', function() {
			if (self.currentComponent) {
				self.currentProps = JSON.parse(JSON.stringify(COMPONENTS[self.currentComponent].defaultProps));
				self._renderPropsEditor();
				self._applyProps();
			}
		});
		
		// Clear events
		this.elements.clearEventsBtn.addEventListener('click', function() {
			self.eventLog = [];
			self._renderEventsLog();
		});
		
		// Copy code (optional - CodePreview has its own copy button)
		if (this.elements.copyCodeBtn) {
			this.elements.copyCodeBtn.addEventListener('click', function() {
				var code = self.elements.codeExample.textContent;
				navigator.clipboard.writeText(code).then(function() {
					if (Funky.Toast) {
						Funky.Toast.success('Code copied to clipboard');
					}
				});
			});
		}
		
		// Add instance (optional - may be removed from toolbar)
		if (this.elements.addInstanceBtn) {
			this.elements.addInstanceBtn.addEventListener('click', function() {
				if (self.currentComponent) {
					self._addInstance();
				}
			});
		}
		
		// Enforce full viewport on mobile resize
		var resizeTimeout = null;
		window.addEventListener('resize', function() {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeTimeout = setTimeout(function() {
				if (window.innerWidth <= 576) {
					// Force full viewport on mobile
					self._setViewport('full');
					document.querySelectorAll('.viewport-btn').forEach(function(b) {
						b.classList.remove('active');
					});
					var fullBtn = document.querySelector('.viewport-btn[data-viewport="full"]');
					if (fullBtn) {
						fullBtn.classList.add('active');
					}
				}
			}, 150);
		});
		
		// Check on initial load
		if (window.innerWidth <= 576) {
			this._setViewport('full');
		}

		// Escape key handler - return focus from iframe to sidenav
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') {
				// Check if focus is in the iframe or its container
				var isFocusInIframe = document.activeElement === self.iframe ||
					(self.elements.playgroundCanvas && self.elements.playgroundCanvas.contains(document.activeElement));

				if (isFocusInIframe) {
					e.preventDefault();
					e.stopPropagation();
					self._focusSideNav();
				}
			}
		});

		// Tab key handler - allow Tab to escape sidenav to iframe
		if (this.elements.sidenavContainer) {
			this.elements.sidenavContainer.addEventListener('keydown', function(e) {
				if (e.key === 'Tab' && !e.shiftKey) {
					// Tab from sidenav goes to iframe
					e.preventDefault();
					self._focusIframe();
				} else if (e.key === 'Tab' && e.shiftKey) {
					// Allow Shift+Tab to go backwards naturally
				}
			});
		}
	};

	/**
	 * Set up iframe postMessage communication
	 */
	Playground.prototype._setupIframeCommunication = function() {
		var self = this;

		window.addEventListener('message', function(e) {
			if (!self.iframe || !self.iframe.contentWindow || e.source !== self.iframe.contentWindow) return;
			
			var data = e.data;
			
			switch (data.type) {
				case 'ready':
					self._onCanvasReady();
					break;
					
				case 'event':
					// Event data is nested in data.data from emit(type, data)
					var eventData = data.data || {};
					self._logEvent(eventData.event, eventData.payload);
					break;
					
				case 'error':
					var errorData = data.data || {};
					console.error('[Playground] Canvas error:', errorData.message || data.error);
					break;

				case 'funky-nav-call':
					// Handle navigation API calls from demo iframe
					self._handleNavCall(data, e.source);
					break;

				case 'funky-nav-set-position':
					// Handle navigation position change from demo iframe
					self._handleNavSetPosition(data.position);
					break;

				case 'funky-nav-set-collapsed':
					// Handle sidebar collapsed state from demo iframe
					self._handleNavSetCollapsed(data.collapsed);
					break;
			}
		});
	};

	/**
	 * Handle navigation API calls from demo iframe
	 * @param {Object} data - Message data with namespace, method, id
	 * @param {Window} source - Source window to reply to
	 */
	Playground.prototype._handleNavCall = function(data, source) {
		var ns = data.namespace;
		var method = data.method;
		var id = data.id;
		var result;

		try {
			if (ns === 'NavPosition' && Funky.NavPosition && typeof Funky.NavPosition[method] === 'function') {
				result = Funky.NavPosition[method]();
			} else if (ns === 'Navigation' && Funky.Navigation && typeof Funky.Navigation[method] === 'function') {
				result = Funky.Navigation[method]();
			} else {
				result = 'Method not available';
			}
		} catch (e) {
			result = 'Error: ' + e.message;
		}

		// Send response back to iframe
		source.postMessage({
			type: 'funky-nav-response',
			id: id,
			result: result
		}, '*');
	};

	/**
	 * Handle navigation position change from demo iframe
	 * @param {string} position - New position (left, right, top, bottom)
	 */
	Playground.prototype._handleNavSetPosition = function(position) {
		var validPositions = ['left', 'right', 'top', 'bottom'];
		if (validPositions.indexOf(position) === -1) return;

		// Update the body's data-nav-position attribute
		document.body.setAttribute('data-nav-position', position);

		// Persist to localStorage
		try {
			localStorage.setItem('funky-playground-nav-position', position);
		} catch (e) {
			// Ignore storage errors
		}

		// Trigger NavPosition refresh if available
		if (Funky.NavPosition && Funky.NavPosition.refresh) {
			Funky.NavPosition.refresh();
		}
	};

	/**
	 * Handle sidebar collapsed state from demo iframe
	 * @param {boolean} collapsed - Whether sidebar should be collapsed
	 */
	Playground.prototype._handleNavSetCollapsed = function(collapsed) {
		var sidebar = document.getElementById('sidebar');
		var mainWrapper = document.querySelector('.main-wrapper');

		if (!sidebar) return;

		if (collapsed) {
			sidebar.classList.add('collapsed');
			if (mainWrapper) mainWrapper.classList.add('sidebar-collapsed');
		} else {
			sidebar.classList.remove('collapsed');
			if (mainWrapper) mainWrapper.classList.remove('sidebar-collapsed');
		}

		// Persist to localStorage
		try {
			localStorage.setItem('funky-sidebar-collapsed', collapsed ? 'true' : 'false');
		} catch (e) {
			// Ignore storage errors
		}
	};

	/**
	 * Called when canvas iframe is ready
	 */
	Playground.prototype._onCanvasReady = function() {
		var self = this;

		// Sync current theme (if selector exists)
		if (this.elements.themeSelector) {
			var theme = this.elements.themeSelector.value;
			this._setTheme(theme);
		}

		// Restore state from cache if pending
		if (this._pendingState) {
			var state = this._pendingState;
			this._pendingState = null;

			// Restore theme first
			if (state.theme && this.elements.themeSelector) {
				this.elements.themeSelector.value = state.theme;
				this._setTheme(state.theme);
			}

			// Restore viewport
			if (state.viewport) {
				this._setViewport(state.viewport);
				document.querySelectorAll('.viewport-btn').forEach(function(btn) {
					btn.classList.toggle('active', btn.dataset.viewport === state.viewport);
				});
			}

			// Restore active panel
			if (state.activePanel) {
				this._switchPanel(state.activePanel);
			}

			// Restore component selection with cached props
			if (state.component && COMPONENTS[state.component]) {
				// Use cached props if available
				if (state.props) {
					this.currentProps = state.props;
				}
				this._selectComponent(state.component);
				if (this.sideNav) {
					this.sideNav.select(state.component);
				}
				// If we had cached props, re-render the props editor after selectComponent sets defaults
				if (state.props) {
					this.currentProps = state.props;
					this._renderPropsEditor();
					this._addInstance();
				}
			}
		}
	};

	/**
	 * Select a component
	 */
	Playground.prototype._selectComponent = function(componentName) {
		var comp = COMPONENTS[componentName];
		if (!comp) return;

		// Update selection UI
		document.querySelectorAll('.component-list-item').forEach(function(item) {
			item.classList.remove('active');
			if (item.dataset.component === componentName) {
				item.classList.add('active');
			}
		});

		this.currentComponent = componentName;
		this.currentProps = JSON.parse(JSON.stringify(comp.defaultProps));

		// Update header
		this.elements.currentComponentName.textContent = comp.name;

		// Render props editor
		this._renderPropsEditor();

		// Update code example
		this._updateCodeExample();

		// Clear canvas and render component
		this._clearCanvas();
		this._addInstance();

		// Save state to localStorage for page refresh persistence
		this._saveState();
	};

	/**
	 * Save current state to localStorage
	 */
	Playground.prototype._saveState = function() {
		var state = {
			component: this.currentComponent,
			props: this.currentProps ? JSON.parse(JSON.stringify(this.currentProps)) : null,
			theme: this.elements.themeSelector ? this.elements.themeSelector.value : 'dark',
			viewport: this.elements.playgroundCanvas ?
				this.elements.playgroundCanvas.getAttribute('data-viewport') : 'full',
			activePanel: document.querySelector('.panel-tab.active') ?
				document.querySelector('.panel-tab.active').dataset.panel : 'props'
		};
		saveState(state);
	};

	/**
	 * Render props editor for current component
	 */
	Playground.prototype._renderPropsEditor = function() {
		var self = this;
		var comp = COMPONENTS[this.currentComponent];
		if (!comp || !comp.propsSchema) {
			D.wrap(this.elements.propsEditor).empty().child(
				D.create('p').classAdd('empty-state').text('No configurable props')
			);
			return;
		}

		var form = D.div().classAdd('props-form');

		Object.keys(comp.propsSchema).forEach(function(propName) {
			var schema = comp.propsSchema[propName];
			var value = self.currentProps[propName];

			var field = D.div().classAdd('prop-field');
			field.attr('data-prop-field', propName);
			
			// Check visibleWhen condition
			if (schema.visibleWhen) {
				var isVisible = self._checkVisibleWhen(schema.visibleWhen);
				if (!isVisible) {
					field.style({ display: 'none' });
				}
			}
			
			field.child(D.create('label').classAdd('prop-label').text(schema.label));

			var input;
			switch (schema.type) {
				case 'text':
				case 'string':
					input = D.create('input')
						.attr('type', 'text')
						.classAdd('prop-input')
						.data('prop', propName)
						.attr('value', value || '');
					break;

				case 'number':
					input = D.create('input')
						.attr('type', 'number')
						.classAdd('prop-input')
						.data('prop', propName)
						.attr('value', value || 0);
					if (schema.min !== undefined) input.attr('min', schema.min);
					if (schema.max !== undefined) input.attr('max', schema.max);
					break;

				case 'checkbox':
				case 'boolean':
					input = D.create('input')
						.attr('type', 'checkbox')
						.classAdd('prop-checkbox')
						.data('prop', propName);
					if (value) input.attr('checked', 'checked');
					break;

				case 'color':
				case 'colour':
					input = D.create('input')
						.attr('type', 'color')
						.classAdd('prop-color')
						.data('prop', propName)
						.attr('value', value || '#000000');
					break;

				case 'select':
					input = D.create('select')
						.classAdd('prop-select')
						.data('prop', propName);
					schema.options.forEach(function(opt) {
						var optValue = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
						var optLabel = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
						var option = D.create('option').attr('value', optValue).text(optLabel);
						if (value == optValue) option.attr('selected', 'selected');
						input.child(option);
					});
					break;

				case 'textarea':
					input = D.create('textarea')
						.classAdd('prop-textarea')
						.data('prop', propName)
						.attr('rows', 4)
						.text(value || '');
					break;

				case 'json':
					input = D.create('textarea')
						.classAdd('prop-textarea')
						.data('prop', propName)
						.attr('rows', 4)
						.text(JSON.stringify(value, null, 2));
					break;
			}

			if (input) field.child(input);
			form.child(field);
		});

		D.wrap(this.elements.propsEditor).empty().child(form);
		
		// Auto-size textareas to fit content
		this.elements.propsEditor.querySelectorAll('.prop-textarea').forEach(function(textarea) {
			self._autoSizeTextarea(textarea);
		});
		
		// Add change listeners to update currentProps
		this.elements.propsEditor.querySelectorAll('[data-prop]').forEach(function(input) {
			input.addEventListener('change', function() {
				self._updateProp(input.dataset.prop, input);
			});
			input.addEventListener('input', function() {
				self._updateProp(input.dataset.prop, input);
				// Auto-size textareas on input
				if (input.tagName === 'TEXTAREA') {
					self._autoSizeTextarea(input);
				}
			});
		});
	};

	/**
	 * Auto-size a textarea to fit its content
	 */
	Playground.prototype._autoSizeTextarea = function(textarea) {
		textarea.style.height = 'auto';
		textarea.style.height = Math.max(80, textarea.scrollHeight + 2) + 'px';
	};

	/**
	 * Check if a field should be visible based on visibleWhen condition
	 */
	Playground.prototype._checkVisibleWhen = function(condition) {
		var self = this;
		// condition is an object like { demoType: ['card-modal', 'shared-elements'] }
		for (var propName in condition) {
			if (condition.hasOwnProperty(propName)) {
				var allowedValues = condition[propName];
				var currentValue = self.currentProps[propName];
				if (Array.isArray(allowedValues)) {
					if (allowedValues.indexOf(currentValue) === -1) {
						return false;
					}
				} else if (currentValue !== allowedValues) {
					return false;
				}
			}
		}
		return true;
	};

	/**
	 * Update visibility of fields based on visibleWhen conditions
	 */
	Playground.prototype._updateFieldVisibility = function() {
		var self = this;
		var comp = COMPONENTS[this.currentComponent];
		if (!comp || !comp.propsSchema) return;

		Object.keys(comp.propsSchema).forEach(function(propName) {
			var schema = comp.propsSchema[propName];
			if (schema.visibleWhen) {
				var field = self.elements.propsEditor.querySelector('[data-prop-field="' + propName + '"]');
				if (field) {
					var isVisible = self._checkVisibleWhen(schema.visibleWhen);
					field.style.display = isVisible ? '' : 'none';
				}
			}
		});
	};

	/**
	 * Update a prop value from input
	 */
	Playground.prototype._updateProp = function(propName, input) {
		var comp = COMPONENTS[this.currentComponent];
		var schema = comp.propsSchema[propName];
		
		var value;
		switch (schema.type) {
			case 'number':
				value = parseFloat(input.value) || 0;
				break;
			case 'boolean':
			case 'checkbox':
				value = input.checked;
				break;
			case 'json':
				try {
					value = JSON.parse(input.value);
				} catch (e) {
					return; // Invalid JSON, don't update
				}
				break;
			default:
				value = input.value;
		}
		
		this.currentProps[propName] = value;
		this._updateFieldVisibility();  // Update visibility when any prop changes
		this._updateCodeExample();
		
		// Auto-apply props with debounce
		var self = this;
		clearTimeout(this._applyDebounce);
		this._applyDebounce = setTimeout(function() {
			self._applyProps();
		}, 300);
	};

	/**
	 * Apply props to canvas
	 */
	Playground.prototype._applyProps = function() {
		// If we already have an instance displayed, just send props update
		// instead of clearing and re-rendering (which causes full page reload)
		if (this.instances.length > 0 && this.iframe && this.iframe.contentWindow) {
			this.iframe.contentWindow.postMessage({
				type: 'props',
				props: this.currentProps
			}, '*');
			this._saveState();
			return;
		}

		// Otherwise do full render (initial load)
		this._clearCanvas();
		this._addInstance();
		// Save state when props are applied
		this._saveState();
	};

	/**
	 * Clear canvas
	 */
	Playground.prototype._clearCanvas = function() {
		this.instances = [];
		if (this.iframe && this.iframe.contentWindow) {
			this.iframe.contentWindow.postMessage({
				type: 'clear'
			}, '*');
		}
	};

	/**
	 * Add component instance to canvas
	 */
	Playground.prototype._addInstance = function() {
		var comp = COMPONENTS[this.currentComponent];
		if (!comp) return;
		
		var instanceId = 'instance-' + Date.now();
		this.instances.push(instanceId);

		if (!this.iframe || !this.iframe.contentWindow) return;
		this.iframe.contentWindow.postMessage({
			type: 'render',
			componentId: this.currentComponent,
			instanceId: instanceId,
			props: this.currentProps
		}, '*');
	};

	/**
	 * Set viewport size
	 */
	Playground.prototype._setViewport = function(viewport) {
		var self = this;
		this.elements.playgroundCanvas.setAttribute('data-viewport', viewport);

		// Notify iframe to trigger resize after CSS transition
		setTimeout(function() {
			if (self.iframe && self.iframe.contentWindow) {
				self.iframe.contentWindow.postMessage({
					type: 'resize'
				}, '*');
			}
		}, 350); // Wait for CSS transition to complete

		// Save state when viewport changes
		this._saveState();
	};

	/**
	 * Set theme in canvas
	 */
	Playground.prototype._setTheme = function(theme) {
		if (!this.iframe || !this.iframe.contentWindow) return;
		this.iframe.contentWindow.postMessage({
			type: 'theme',
			theme: theme
		}, '*');
		// Save state when theme changes
		this._saveState();
	};

	/**
	 * Switch panel tab
	 */
	Playground.prototype._switchPanel = function(panel) {
		// Update tabs
		document.querySelectorAll('.panel-tab').forEach(function(tab) {
			tab.classList.toggle('active', tab.dataset.panel === panel);
		});

		// Show/hide panels
		this.elements.propsPanel.style.display = panel === 'props' ? '' : 'none';
		this.elements.eventsPanel.style.display = panel === 'events' ? '' : 'none';
		this.elements.codePanel.style.display = panel === 'code' ? '' : 'none';

		// Save state when panel changes
		this._saveState();
	};

	/**
	 * Log an event from the canvas
	 */
	Playground.prototype._logEvent = function(eventName, payload) {
		var now = new Date();
		var time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		
		this.eventLog.unshift({
			time: time,
			event: eventName,
			payload: payload
		});
		
		// Keep only last 100 events
		if (this.eventLog.length > 100) {
			this.eventLog.pop();
		}
		
		this._renderEventsLog();
	};

	/**
	 * Render events log
	 */
	Playground.prototype._renderEventsLog = function() {
		var container = D.wrap(this.elements.eventsLog).empty();

		if (this.eventLog.length === 0) {
			container.child(D.create('p').classAdd('empty-state').text('Events will appear here'));
			return;
		}

		var self = this;
		this.eventLog.forEach(function(entry) {
			var payloadStr = '';
			if (entry.payload) {
				try {
					payloadStr = JSON.stringify(entry.payload, self._safeReplacer(), 2);
				} catch (e) {
					payloadStr = '[Object with circular reference]';
				}
			}

			var eventEntry = D.div().classAdd('event-entry')
				.child(
					D.span().classAdd('event-time').text(entry.time),
					D.span().classAdd('event-name').text(entry.event)
				);

			if (payloadStr) {
				eventEntry.child(D.div().classAdd('event-data').text(payloadStr));
			}

			container.child(eventEntry);
		});
	};

	/**
	 * Create a safe JSON replacer that handles circular references and DOM elements
	 */
	Playground.prototype._safeReplacer = function() {
		var seen = new WeakSet();
		return function(key, value) {
			// Skip internal properties that cause circular refs
			if (key === '_parent' || key === '_listeners' || key === 'el') {
				return undefined;
			}
			// Handle DOM elements
			if (value instanceof Element) {
				return '[DOM Element: ' + value.tagName + ']';
			}
			// Handle circular references
			if (typeof value === 'object' && value !== null) {
				if (seen.has(value)) {
					return '[Circular]';
				}
				seen.add(value);
			}
			return value;
		};
	};

	/**
	 * Escape HTML special characters - wrapper for Funky.Util.escapeHtml
	 * @param {string} text - Text to escape
	 * @returns {string} Escaped text
	 */
	Playground.prototype._escapeHtml = function(text) {
		if (typeof text !== 'string') return '';
		return Funky.Util.escapeHtml(text);
	};

	/**
	 * Update code example
	 */
	Playground.prototype._updateCodeExample = function() {
		var comp = COMPONENTS[this.currentComponent];
		if (!comp) return;

		var code = comp.initCode ? comp.initCode(this.currentProps) :
			'Funky.' + this.currentComponent + '.init("#container", ' + JSON.stringify(this.currentProps, null, 2) + ');';

		// Use CodePreview if available, otherwise fallback to simple HTML
		if (Funky.CodePreview) {
			// Destroy previous instance if exists
			if (this._codePreviewInstance) {
				this._codePreviewInstance.destroy();
			}
			// Create new CodePreview instance
			this._codePreviewInstance = Funky.CodePreview.render(this.elements.codeExample, code, {
				language: 'javascript',
				showCopy: true,
				showLanguage: false,
				lineNumbers: code.split('\n').length > 5,
				maxHeight: 400
			});
		} else {
			// Fallback for when CodePreview is not loaded
			D.wrap(this.elements.codeExample).empty().child(
				D.create('pre').child(D.create('code').text(code))
			);
		}
	};

	// Create singleton instance
	var instance = new Playground();

	// Register with Funky securely
	Funky.register('Playground', instance);

	// Register as page module for SPA state preservation
	// Register for both public (/play) and authenticated (/playground) routes
	var playgroundPageModule = {
		init: function(state) { 
			var canvas = document.getElementById('playgroundCanvas');
			if (canvas && !instance.container) {
				instance.init('#playgroundCanvas', state);
			}
		},
		destroy: function() { return instance.destroy(); }
	};

	if (typeof Funky !== 'undefined' && Funky.Pages && Funky.Pages.register) {
		Funky.Pages.register('play', playgroundPageModule);
		Funky.Pages.register('playground', playgroundPageModule);
	} else if (typeof Funky !== 'undefined' && Funky.register) {
		// Fallback for older setups without Pages
		Funky.register('play', playgroundPageModule);
		Funky.register('playground', playgroundPageModule);
	}

	// Listen for SPA page loads to auto-initialize when navigating to playground
	var spaListenerRegistered = false;
	if (!spaListenerRegistered) {
		spaListenerRegistered = true;
		document.addEventListener('funky.spa.pageload', function(e) {
			// Check if we're on the playground page (either /play or /playground)
			if (e.detail && (e.detail.page === 'play' || e.detail.page === 'playground' || 
				(e.detail.url && (e.detail.url.indexOf('/play') !== -1 || e.detail.url.indexOf('/playground') !== -1)))) {
				// Small delay to ensure DOM is fully updated
				setTimeout(function() {
					var canvas = document.getElementById('playgroundCanvas');
					if (canvas && !instance.container) {
						instance.init('#playgroundCanvas');
					}
				}, 50);
			}
		});
	}

})(window);
