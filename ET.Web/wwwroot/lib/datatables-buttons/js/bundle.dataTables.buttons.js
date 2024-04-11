/*! Buttons for DataTables 1.6.1
 * ©2016-2019 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
var _instCounter = 0;

// Button namespacing counter for namespacing events on individual buttons
var _buttonCounter = 0;

var _dtButtons = DataTable.ext.buttons;

/**
 * [Buttons description]
 * @param {[type]}
 * @param {[type]}
 */
var Buttons = function( dt, config )
{
	// If not created with a `new` keyword then we return a wrapper function that
	// will take the settings object for a DT. This allows easy use of new instances
	// with the `layout` option - e.g. `topLeft: $.fn.dataTable.Buttons( ... )`.
	if ( !(this instanceof Buttons) ) {
		return function (settings) {
			return new Buttons( settings, dt ).container();
		};
	}

	// If there is no config set it to an empty object
	if ( typeof( config ) === 'undefined' ) {
		config = {};	
	}
	
	// Allow a boolean true for defaults
	if ( config === true ) {
		config = {};
	}

	// For easy configuration of buttons an array can be given
	if ( $.isArray( config ) ) {
		config = { buttons: config };
	}

	this.c = $.extend( true, {}, Buttons.defaults, config );

	// Don't want a deep copy for the buttons
	if ( config.buttons ) {
		this.c.buttons = config.buttons;
	}

	this.s = {
		dt: new DataTable.Api( dt ),
		buttons: [],
		listenKeys: '',
		namespace: 'dtb'+(_instCounter++)
	};

	this.dom = {
		container: $('<'+this.c.dom.container.tag+'/>')
			.addClass( this.c.dom.container.className )
	};

	this._constructor();
};


$.extend( Buttons.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 */

	/**
	 * Get the action of a button
	 * @param  {int|string} Button index
	 * @return {function}
	 *//**
	 * Set the action of a button
	 * @param  {node} node Button element
	 * @param  {function} action Function to set
	 * @return {Buttons} Self for chaining
	 */
	action: function ( node, action )
	{
		var button = this._nodeToButton( node );

		if ( action === undefined ) {
			return button.conf.action;
		}

		button.conf.action = action;

		return this;
	},

	/**
	 * Add an active class to the button to make to look active or get current
	 * active state.
	 * @param  {node} node Button element
	 * @param  {boolean} [flag] Enable / disable flag
	 * @return {Buttons} Self for chaining or boolean for getter
	 */
	active: function ( node, flag ) {
		var button = this._nodeToButton( node );
		var klass = this.c.dom.button.active;
		var jqNode = $(button.node);

		if ( flag === undefined ) {
			return jqNode.hasClass( klass );
		}

		jqNode.toggleClass( klass, flag === undefined ? true : flag );

		return this;
	},

	/**
	 * Add a new button
	 * @param {object} config Button configuration object, base string name or function
	 * @param {int|string} [idx] Button index for where to insert the button
	 * @return {Buttons} Self for chaining
	 */
	add: function ( config, idx )
	{
		var buttons = this.s.buttons;

		if ( typeof idx === 'string' ) {
			var split = idx.split('-');
			var base = this.s;

			for ( var i=0, ien=split.length-1 ; i<ien ; i++ ) {
				base = base.buttons[ split[i]*1 ];
			}

			buttons = base.buttons;
			idx = split[ split.length-1 ]*1;
		}

		this._expandButton( buttons, config, base !== undefined, idx );
		this._draw();

		return this;
	},

	/**
	 * Get the container node for the buttons
	 * @return {jQuery} Buttons node
	 */
	container: function ()
	{
		return this.dom.container;
	},

	/**
	 * Disable a button
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	disable: function ( node ) {
		var button = this._nodeToButton( node );

		$(button.node).addClass( this.c.dom.button.disabled );

		return this;
	},

	/**
	 * Destroy the instance, cleaning up event handlers and removing DOM
	 * elements
	 * @return {Buttons} Self for chaining
	 */
	destroy: function ()
	{
		// Key event listener
		$('body').off( 'keyup.'+this.s.namespace );

		// Individual button destroy (so they can remove their own events if
		// needed). Take a copy as the array is modified by `remove`
		var buttons = this.s.buttons.slice();
		var i, ien;
		
		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			this.remove( buttons[i].node );
		}

		// Container
		this.dom.container.remove();

		// Remove from the settings object collection
		var buttonInsts = this.s.dt.settings()[0];

		for ( i=0, ien=buttonInsts.length ; i<ien ; i++ ) {
			if ( buttonInsts.inst === this ) {
				buttonInsts.splice( i, 1 );
				break;
			}
		}

		return this;
	},

	/**
	 * Enable / disable a button
	 * @param  {node} node Button node
	 * @param  {boolean} [flag=true] Enable / disable flag
	 * @return {Buttons} Self for chaining
	 */
	enable: function ( node, flag )
	{
		if ( flag === false ) {
			return this.disable( node );
		}

		var button = this._nodeToButton( node );
		$(button.node).removeClass( this.c.dom.button.disabled );

		return this;
	},

	/**
	 * Get the instance name for the button set selector
	 * @return {string} Instance name
	 */
	name: function ()
	{
		return this.c.name;
	},

	/**
	 * Get a button's node of the buttons container if no button is given
	 * @param  {node} [node] Button node
	 * @return {jQuery} Button element, or container
	 */
	node: function ( node )
	{
		if ( ! node ) {
			return this.dom.container;
		}

		var button = this._nodeToButton( node );
		return $(button.node);
	},

	/**
	 * Set / get a processing class on the selected button
	 * @param {element} node Triggering button node
	 * @param  {boolean} flag true to add, false to remove, undefined to get
	 * @return {boolean|Buttons} Getter value or this if a setter.
	 */
	processing: function ( node, flag )
	{
		var dt = this.s.dt;
		var button = this._nodeToButton( node );

		if ( flag === undefined ) {
			return $(button.node).hasClass( 'processing' );
		}

		$(button.node).toggleClass( 'processing', flag );

		$(dt.table().node()).triggerHandler( 'buttons-processing.dt', [
			flag, dt.button( node ), dt, $(node), button.conf
		] );

		return this;
	},

	/**
	 * Remove a button.
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	remove: function ( node )
	{
		var button = this._nodeToButton( node );
		var host = this._nodeToHost( node );
		var dt = this.s.dt;

		// Remove any child buttons first
		if ( button.buttons.length ) {
			for ( var i=button.buttons.length-1 ; i>=0 ; i-- ) {
				this.remove( button.buttons[i].node );
			}
		}

		// Allow the button to remove event handlers, etc
		if ( button.conf.destroy ) {
			button.conf.destroy.call( dt.button(node), dt, $(node), button.conf );
		}

		this._removeKey( button.conf );

		$(button.node).remove();

		var idx = $.inArray( button, host );
		host.splice( idx, 1 );

		return this;
	},

	/**
	 * Get the text for a button
	 * @param  {int|string} node Button index
	 * @return {string} Button text
	 *//**
	 * Set the text for a button
	 * @param  {int|string|function} node Button index
	 * @param  {string} label Text
	 * @return {Buttons} Self for chaining
	 */
	text: function ( node, label )
	{
		var button = this._nodeToButton( node );
		var buttonLiner = this.c.dom.collection.buttonLiner;
		var linerTag = button.inCollection && buttonLiner && buttonLiner.tag ?
			buttonLiner.tag :
			this.c.dom.buttonLiner.tag;
		var dt = this.s.dt;
		var jqNode = $(button.node);
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, jqNode, button.conf ) :
				opt;
		};

		if ( label === undefined ) {
			return text( button.conf.text );
		}

		button.conf.text = label;

		if ( linerTag ) {
			jqNode.children( linerTag ).html( text(label) );
		}
		else {
			jqNode.html( text(label) );
		}

		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Buttons constructor
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtSettings = dt.settings()[0];
		var buttons =  this.c.buttons;

		if ( ! dtSettings._buttons ) {
			dtSettings._buttons = [];
		}

		dtSettings._buttons.push( {
			inst: this,
			name: this.c.name
		} );

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			this.add( buttons[i] );
		}

		dt.on( 'destroy', function ( e, settings ) {
			if ( settings === dtSettings ) {
				that.destroy();
			}
		} );

		// Global key event binding to listen for button keys
		$('body').on( 'keyup.'+this.s.namespace, function ( e ) {
			if ( ! document.activeElement || document.activeElement === document.body ) {
				// SUse a string of characters for fast lookup of if we need to
				// handle this
				var character = String.fromCharCode(e.keyCode).toLowerCase();

				if ( that.s.listenKeys.toLowerCase().indexOf( character ) !== -1 ) {
					that._keypress( character, e );
				}
			}
		} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Add a new button to the key press listener
	 * @param {object} conf Resolved button configuration object
	 * @private
	 */
	_addKey: function ( conf )
	{
		if ( conf.key ) {
			this.s.listenKeys += $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;
		}
	},

	/**
	 * Insert the buttons into the container. Call without parameters!
	 * @param  {node} [container] Recursive only - Insert point
	 * @param  {array} [buttons] Recursive only - Buttons array
	 * @private
	 */
	_draw: function ( container, buttons )
	{
		if ( ! container ) {
			container = this.dom.container;
			buttons = this.s.buttons;
		}

		container.children().detach();

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			container.append( buttons[i].inserter );
			container.append( ' ' );

			if ( buttons[i].buttons && buttons[i].buttons.length ) {
				this._draw( buttons[i].collection, buttons[i].buttons );
			}
		}
	},

	/**
	 * Create buttons from an array of buttons
	 * @param  {array} attachTo Buttons array to attach to
	 * @param  {object} button Button definition
	 * @param  {boolean} inCollection true if the button is in a collection
	 * @private
	 */
	_expandButton: function ( attachTo, button, inCollection, attachPoint )
	{
		var dt = this.s.dt;
		var buttonCounter = 0;
		var buttons = ! $.isArray( button ) ?
			[ button ] :
			button;

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			var conf = this._resolveExtends( buttons[i] );

			if ( ! conf ) {
				continue;
			}

			// If the configuration is an array, then expand the buttons at this
			// point
			if ( $.isArray( conf ) ) {
				this._expandButton( attachTo, conf, inCollection, attachPoint );
				continue;
			}

			var built = this._buildButton( conf, inCollection );
			if ( ! built ) {
				continue;
			}

			if ( attachPoint !== undefined ) {
				attachTo.splice( attachPoint, 0, built );
				attachPoint++;
			}
			else {
				attachTo.push( built );
			}

			if ( built.conf.buttons ) {
				built.collection = $('<'+this.c.dom.collection.tag+'/>');

				built.conf._collection = built.collection;

				this._expandButton( built.buttons, built.conf.buttons, true, attachPoint );
			}

			// init call is made here, rather than buildButton as it needs to
			// be selectable, and for that it needs to be in the buttons array
			if ( conf.init ) {
				conf.init.call( dt.button( built.node ), dt, $(built.node), conf );
			}

			buttonCounter++;
		}
	},

	/**
	 * Create an individual button
	 * @param  {object} config            Resolved button configuration
	 * @param  {boolean} inCollection `true` if a collection button
	 * @return {jQuery} Created button node (jQuery)
	 * @private
	 */
	_buildButton: function ( config, inCollection )
	{
		var buttonDom = this.c.dom.button;
		var linerDom = this.c.dom.buttonLiner;
		var collectionDom = this.c.dom.collection;
		var dt = this.s.dt;
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, button, config ) :
				opt;
		};

		if ( inCollection && collectionDom.button ) {
			buttonDom = collectionDom.button;
		}

		if ( inCollection && collectionDom.buttonLiner ) {
			linerDom = collectionDom.buttonLiner;
		}

		// Make sure that the button is available based on whatever requirements
		// it has. For example, Flash buttons require Flash
		if ( config.available && ! config.available( dt, config ) ) {
			return false;
		}

		var action = function ( e, dt, button, config ) {
			config.action.call( dt.button( button ), e, dt, button, config );

			$(dt.table().node()).triggerHandler( 'buttons-action.dt', [
				dt.button( button ), dt, button, config 
			] );
		};

		var tag = config.tag || buttonDom.tag;
		var clickBlurs = config.clickBlurs === undefined ? true : config.clickBlurs
		var button = $('<'+tag+'/>')
			.addClass( buttonDom.className )
			.attr( 'tabindex', this.s.dt.settings()[0].iTabIndex )
			.attr( 'aria-controls', this.s.dt.table().node().id )
			.on( 'click.dtb', function (e) {
				e.preventDefault();

				if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
					action( e, dt, button, config );
				}
				if( clickBlurs ) {
					button.blur();
				}
			} )
			.on( 'keyup.dtb', function (e) {
				if ( e.keyCode === 13 ) {
					if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
						action( e, dt, button, config );
					}
				}
			} );

		// Make `a` tags act like a link
		if ( tag.toLowerCase() === 'a' ) {
			button.attr( 'href', '#' );
		}

		// Button tags should have `type=button` so they don't have any default behaviour
		if ( tag.toLowerCase() === 'button' ) {
			button.attr( 'type', 'button' );
		}

		if ( linerDom.tag ) {
			var liner = $('<'+linerDom.tag+'/>')
				.html( text( config.text ) )
				.addClass( linerDom.className );

			if ( linerDom.tag.toLowerCase() === 'a' ) {
				liner.attr( 'href', '#' );
			}

			button.append( liner );
		}
		else {
			button.html( text( config.text ) );
		}

		if ( config.enabled === false ) {
			button.addClass( buttonDom.disabled );
		}

		if ( config.className ) {
			button.addClass( config.className );
		}

		if ( config.titleAttr ) {
			button.attr( 'title', text( config.titleAttr ) );
		}

		if ( config.attr ) {
			button.attr( config.attr );
		}

		if ( ! config.namespace ) {
			config.namespace = '.dt-button-'+(_buttonCounter++);
		}

		var buttonContainer = this.c.dom.buttonContainer;
		var inserter;
		if ( buttonContainer && buttonContainer.tag ) {
			inserter = $('<'+buttonContainer.tag+'/>')
				.addClass( buttonContainer.className )
				.append( button );
		}
		else {
			inserter = button;
		}

		this._addKey( config );

		// Style integration callback for DOM manipulation
		// Note that this is _not_ documented. It is currently
		// for style integration only
		if( this.c.buttonCreated ) {
			inserter = this.c.buttonCreated( config, inserter );
		}

		return {
			conf:         config,
			node:         button.get(0),
			inserter:     inserter,
			buttons:      [],
			inCollection: inCollection,
			collection:   null
		};
	},

	/**
	 * Get the button object from a node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {object} Button object
	 * @private
	 */
	_nodeToButton: function ( node, buttons )
	{
		if ( ! buttons ) {
			buttons = this.s.buttons;
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			if ( buttons[i].node === node ) {
				return buttons[i];
			}

			if ( buttons[i].buttons.length ) {
				var ret = this._nodeToButton( node, buttons[i].buttons );

				if ( ret ) {
					return ret;
				}
			}
		}
	},

	/**
	 * Get container array for a button from a button node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {array} Button's host array
	 * @private
	 */
	_nodeToHost: function ( node, buttons )
	{
		if ( ! buttons ) {
			buttons = this.s.buttons;
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			if ( buttons[i].node === node ) {
				return buttons;
			}

			if ( buttons[i].buttons.length ) {
				var ret = this._nodeToHost( node, buttons[i].buttons );

				if ( ret ) {
					return ret;
				}
			}
		}
	},

	/**
	 * Handle a key press - determine if any button's key configured matches
	 * what was typed and trigger the action if so.
	 * @param  {string} character The character pressed
	 * @param  {object} e Key event that triggered this call
	 * @private
	 */
	_keypress: function ( character, e )
	{
		// Check if this button press already activated on another instance of Buttons
		if ( e._buttonsHandled ) {
			return;
		}

		var run = function ( conf, node ) {
			if ( ! conf.key ) {
				return;
			}

			if ( conf.key === character ) {
				e._buttonsHandled = true;
				$(node).click();
			}
			else if ( $.isPlainObject( conf.key ) ) {
				if ( conf.key.key !== character ) {
					return;
				}

				if ( conf.key.shiftKey && ! e.shiftKey ) {
					return;
				}

				if ( conf.key.altKey && ! e.altKey ) {
					return;
				}

				if ( conf.key.ctrlKey && ! e.ctrlKey ) {
					return;
				}

				if ( conf.key.metaKey && ! e.metaKey ) {
					return;
				}

				// Made it this far - it is good
				e._buttonsHandled = true;
				$(node).click();
			}
		};

		var recurse = function ( a ) {
			for ( var i=0, ien=a.length ; i<ien ; i++ ) {
				run( a[i].conf, a[i].node );

				if ( a[i].buttons.length ) {
					recurse( a[i].buttons );
				}
			}
		};

		recurse( this.s.buttons );
	},

	/**
	 * Remove a key from the key listener for this instance (to be used when a
	 * button is removed)
	 * @param  {object} conf Button configuration
	 * @private
	 */
	_removeKey: function ( conf )
	{
		if ( conf.key ) {
			var character = $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;

			// Remove only one character, as multiple buttons could have the
			// same listening key
			var a = this.s.listenKeys.split('');
			var idx = $.inArray( character, a );
			a.splice( idx, 1 );
			this.s.listenKeys = a.join('');
		}
	},

	/**
	 * Resolve a button configuration
	 * @param  {string|function|object} conf Button config to resolve
	 * @return {object} Button configuration
	 * @private
	 */
	_resolveExtends: function ( conf )
	{
		var dt = this.s.dt;
		var i, ien;
		var toConfObject = function ( base ) {
			var loop = 0;

			// Loop until we have resolved to a button configuration, or an
			// array of button configurations (which will be iterated
			// separately)
			while ( ! $.isPlainObject(base) && ! $.isArray(base) ) {
				if ( base === undefined ) {
					return;
				}

				if ( typeof base === 'function' ) {
					base = base( dt, conf );

					if ( ! base ) {
						return false;
					}
				}
				else if ( typeof base === 'string' ) {
					if ( ! _dtButtons[ base ] ) {
						throw 'Unknown button type: '+base;
					}

					base = _dtButtons[ base ];
				}

				loop++;
				if ( loop > 30 ) {
					// Protect against misconfiguration killing the browser
					throw 'Buttons: Too many iterations';
				}
			}

			return $.isArray( base ) ?
				base :
				$.extend( {}, base );
		};

		conf = toConfObject( conf );

		while ( conf && conf.extend ) {
			// Use `toConfObject` in case the button definition being extended
			// is itself a string or a function
			if ( ! _dtButtons[ conf.extend ] ) {
				throw 'Cannot extend unknown button type: '+conf.extend;
			}

			var objArray = toConfObject( _dtButtons[ conf.extend ] );
			if ( $.isArray( objArray ) ) {
				return objArray;
			}
			else if ( ! objArray ) {
				// This is a little brutal as it might be possible to have a
				// valid button without the extend, but if there is no extend
				// then the host button would be acting in an undefined state
				return false;
			}

			// Stash the current class name
			var originalClassName = objArray.className;

			conf = $.extend( {}, objArray, conf );

			// The extend will have overwritten the original class name if the
			// `conf` object also assigned a class, but we want to concatenate
			// them so they are list that is combined from all extended buttons
			if ( originalClassName && conf.className !== originalClassName ) {
				conf.className = originalClassName+' '+conf.className;
			}

			// Buttons to be added to a collection  -gives the ability to define
			// if buttons should be added to the start or end of a collection
			var postfixButtons = conf.postfixButtons;
			if ( postfixButtons ) {
				if ( ! conf.buttons ) {
					conf.buttons = [];
				}

				for ( i=0, ien=postfixButtons.length ; i<ien ; i++ ) {
					conf.buttons.push( postfixButtons[i] );
				}

				conf.postfixButtons = null;
			}

			var prefixButtons = conf.prefixButtons;
			if ( prefixButtons ) {
				if ( ! conf.buttons ) {
					conf.buttons = [];
				}

				for ( i=0, ien=prefixButtons.length ; i<ien ; i++ ) {
					conf.buttons.splice( i, 0, prefixButtons[i] );
				}

				conf.prefixButtons = null;
			}

			// Although we want the `conf` object to overwrite almost all of
			// the properties of the object being extended, the `extend`
			// property should come from the object being extended
			conf.extend = objArray.extend;
		}

		return conf;
	},

	/**
	 * Display (and replace if there is an existing one) a popover attached to a button
	 * @param {string|node} content Content to show
	 * @param {DataTable.Api} hostButton DT API instance of the button
	 * @param {object} inOpts Options (see object below for all options)
	 */
	_popover: function ( content, hostButton, inOpts ) {
		var dt = hostButton;
		var buttonsSettings = this.c;
		var options = $.extend( {
			align: 'button-left', // button-right, dt-container
			autoClose: false,
			background: true,
			backgroundClassName: 'dt-button-background',
			contentClassName: buttonsSettings.dom.collection.className,
			collectionLayout: '',
			collectionTitle: '',
			dropup: false,
			fade: 400,
			rightAlignClassName: 'dt-button-right',
			tag: buttonsSettings.dom.collection.tag
		}, inOpts );
		var hostNode = hostButton.node();

		var close = function () {
			$('.dt-button-collection').stop().fadeOut( options.fade, function () {
				$(this).detach();
			} );

			$(dt.buttons( '[aria-haspopup="true"][aria-expanded="true"]' ).nodes())
				.attr('aria-expanded', 'false');

			$('div.dt-button-background').off( 'click.dtb-collection' );
			Buttons.background( false, options.backgroundClassName, options.fade, hostNode );

			$('body').off( '.dtb-collection' );
			dt.off( 'buttons-action.b-internal' );
		};

		if (content === false) {
			close();
		}

		var existingExpanded = $(dt.buttons( '[aria-haspopup="true"][aria-expanded="true"]' ).nodes());
		if ( existingExpanded.length ) {
			hostNode = existingExpanded.eq(0);

			close();
		}

		var display = $('<div/>')
			.addClass('dt-button-collection')
			.addClass(options.collectionLayout)
			.css('display', 'none');

		content = $(content)
			.addClass(options.contentClassName)
			.attr('role', 'menu')
			.appendTo(display);

		hostNode.attr( 'aria-expanded', 'true' );

		if ( hostNode.parents('body')[0] !== document.body ) {
			hostNode = document.body.lastChild;
		}

		if ( options.collectionTitle ) {
			display.prepend('<div class="dt-button-collection-title">'+options.collectionTitle+'</div>');
		}

		display
			.insertAfter( hostNode )
			.fadeIn( options.fade );

		var tableContainer = $( hostButton.table().container() );
		var position = display.css( 'position' );

		if ( options.align === 'dt-container' ) {
			hostNode = hostNode.parent();
			display.css('width', tableContainer.width());
		}

		if ( position === 'absolute' ) {
			var hostPosition = hostNode.position();

			display.css( {
				top: hostPosition.top + hostNode.outerHeight(),
				left: hostPosition.left
			} );

			// calculate overflow when positioned beneath
			var collectionHeight = display.outerHeight();
			var collectionWidth = display.outerWidth();
			var tableBottom = tableContainer.offset().top + tableContainer.height();
			var listBottom = hostPosition.top + hostNode.outerHeight() + collectionHeight;
			var bottomOverflow = listBottom - tableBottom;

			// calculate overflow when positioned above
			var listTop = hostPosition.top - collectionHeight;
			var tableTop = tableContainer.offset().top;
			var topOverflow = tableTop - listTop;

			// if bottom overflow is larger, move to the top because it fits better, or if dropup is requested
			var moveTop = hostPosition.top - collectionHeight - 5;
			if ( (bottomOverflow > topOverflow || options.dropup) && -moveTop < tableTop ) {
				display.css( 'top', moveTop);
			}

			// Right alignment is enabled on a class, e.g. bootstrap:
			// $.fn.dataTable.Buttons.defaults.dom.collection.className += " dropdown-menu-right"; 
			if ( display.hasClass( options.rightAlignClassName ) || options.align === 'button-right' ) {
				display.css( 'left', hostPosition.left + hostNode.outerWidth() - collectionWidth );
			}

			// Right alignment in table container
			var listRight = hostPosition.left + collectionWidth;
			var tableRight = tableContainer.offset().left + tableContainer.width();
			if ( listRight > tableRight ) {
				display.css( 'left', hostPosition.left - ( listRight - tableRight ) );
			}

			// Right alignment to window
			var listOffsetRight = hostNode.offset().left + collectionWidth;
			if ( listOffsetRight > $(window).width() ) {
				display.css( 'left', hostPosition.left - (listOffsetRight-$(window).width()) );
			}
		}
		else {
			// Fix position - centre on screen
			var top = display.height() / 2;
			if ( top > $(window).height() / 2 ) {
				top = $(window).height() / 2;
			}

			display.css( 'marginTop', top*-1 );
		}

		if ( options.background ) {
			Buttons.background( true, options.backgroundClassName, options.fade, hostNode );
		}

		// This is bonkers, but if we don't have a click listener on the
		// background element, iOS Safari will ignore the body click
		// listener below. An empty function here is all that is
		// required to make it work...
		$('div.dt-button-background').on( 'click.dtb-collection', function () {} );

		$('body')
			.on( 'click.dtb-collection', function (e) {
				// andSelf is deprecated in jQ1.8, but we want 1.7 compat
				var back = $.fn.addBack ? 'addBack' : 'andSelf';

				if ( ! $(e.target).parents()[back]().filter( content ).length ) {
					close();
				}
			} )
			.on( 'keyup.dtb-collection', function (e) {
				if ( e.keyCode === 27 ) {
					close();
				}
			} );

		if ( options.autoClose ) {
			setTimeout( function () {
				dt.on( 'buttons-action.b-internal', function (e, btn, dt, node) {
					if ( node[0] === hostNode[0] ) {
						return;
					}
					close();
				} );
			}, 0);
		}
	}
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */

/**
 * Show / hide a background layer behind a collection
 * @param  {boolean} Flag to indicate if the background should be shown or
 *   hidden 
 * @param  {string} Class to assign to the background
 * @static
 */
Buttons.background = function ( show, className, fade, insertPoint ) {
	if ( fade === undefined ) {
		fade = 400;
	}
	if ( ! insertPoint ) {
		insertPoint = document.body;
	}

	if ( show ) {
		$('<div/>')
			.addClass( className )
			.css( 'display', 'none' )
			.insertAfter( insertPoint )
			.stop()
			.fadeIn( fade );
	}
	else {
		$('div.'+className)
			.stop()
			.fadeOut( fade, function () {
				$(this)
					.removeClass( className )
					.remove();
			} );
	}
};

/**
 * Instance selector - select Buttons instances based on an instance selector
 * value from the buttons assigned to a DataTable. This is only useful if
 * multiple instances are attached to a DataTable.
 * @param  {string|int|array} Instance selector - see `instance-selector`
 *   documentation on the DataTables site
 * @param  {array} Button instance array that was attached to the DataTables
 *   settings object
 * @return {array} Buttons instances
 * @static
 */
Buttons.instanceSelector = function ( group, buttons )
{
	if ( group === undefined || group === null ) {
		return $.map( buttons, function ( v ) {
			return v.inst;
		} );
	}

	var ret = [];
	var names = $.map( buttons, function ( v ) {
		return v.name;
	} );

	// Flatten the group selector into an array of single options
	var process = function ( input ) {
		if ( $.isArray( input ) ) {
			for ( var i=0, ien=input.length ; i<ien ; i++ ) {
				process( input[i] );
			}
			return;
		}

		if ( typeof input === 'string' ) {
			if ( input.indexOf( ',' ) !== -1 ) {
				// String selector, list of names
				process( input.split(',') );
			}
			else {
				// String selector individual name
				var idx = $.inArray( $.trim(input), names );

				if ( idx !== -1 ) {
					ret.push( buttons[ idx ].inst );
				}
			}
		}
		else if ( typeof input === 'number' ) {
			// Index selector
			ret.push( buttons[ input ].inst );
		}
	};
	
	process( group );

	return ret;
};

/**
 * Button selector - select one or more buttons from a selector input so some
 * operation can be performed on them.
 * @param  {array} Button instances array that the selector should operate on
 * @param  {string|int|node|jQuery|array} Button selector - see
 *   `button-selector` documentation on the DataTables site
 * @return {array} Array of objects containing `inst` and `idx` properties of
 *   the selected buttons so you know which instance each button belongs to.
 * @static
 */
Buttons.buttonSelector = function ( insts, selector )
{
	var ret = [];
	var nodeBuilder = function ( a, buttons, baseIdx ) {
		var button;
		var idx;

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			button = buttons[i];

			if ( button ) {
				idx = baseIdx !== undefined ?
					baseIdx+i :
					i+'';

				a.push( {
					node: button.node,
					name: button.conf.name,
					idx:  idx
				} );

				if ( button.buttons ) {
					nodeBuilder( a, button.buttons, idx+'-' );
				}
			}
		}
	};

	var run = function ( selector, inst ) {
		var i, ien;
		var buttons = [];
		nodeBuilder( buttons, inst.s.buttons );

		var nodes = $.map( buttons, function (v) {
			return v.node;
		} );

		if ( $.isArray( selector ) || selector instanceof $ ) {
			for ( i=0, ien=selector.length ; i<ien ; i++ ) {
				run( selector[i], inst );
			}
			return;
		}

		if ( selector === null || selector === undefined || selector === '*' ) {
			// Select all
			for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
				ret.push( {
					inst: inst,
					node: buttons[i].node
				} );
			}
		}
		else if ( typeof selector === 'number' ) {
			// Main button index selector
			ret.push( {
				inst: inst,
				node: inst.s.buttons[ selector ].node
			} );
		}
		else if ( typeof selector === 'string' ) {
			if ( selector.indexOf( ',' ) !== -1 ) {
				// Split
				var a = selector.split(',');

				for ( i=0, ien=a.length ; i<ien ; i++ ) {
					run( $.trim(a[i]), inst );
				}
			}
			else if ( selector.match( /^\d+(\-\d+)*$/ ) ) {
				// Sub-button index selector
				var indexes = $.map( buttons, function (v) {
					return v.idx;
				} );

				ret.push( {
					inst: inst,
					node: buttons[ $.inArray( selector, indexes ) ].node
				} );
			}
			else if ( selector.indexOf( ':name' ) !== -1 ) {
				// Button name selector
				var name = selector.replace( ':name', '' );

				for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
					if ( buttons[i].name === name ) {
						ret.push( {
							inst: inst,
							node: buttons[i].node
						} );
					}
				}
			}
			else {
				// jQuery selector on the nodes
				$( nodes ).filter( selector ).each( function () {
					ret.push( {
						inst: inst,
						node: this
					} );
				} );
			}
		}
		else if ( typeof selector === 'object' && selector.nodeName ) {
			// Node selector
			var idx = $.inArray( selector, nodes );

			if ( idx !== -1 ) {
				ret.push( {
					inst: inst,
					node: nodes[ idx ]
				} );
			}
		}
	};


	for ( var i=0, ien=insts.length ; i<ien ; i++ ) {
		var inst = insts[i];

		run( selector, inst );
	}

	return ret;
};


/**
 * Buttons defaults. For full documentation, please refer to the docs/option
 * directory or the DataTables site.
 * @type {Object}
 * @static
 */
Buttons.defaults = {
	buttons: [ 'copy', 'excel', 'csv', 'pdf', 'print' ],
	name: 'main',
	tabIndex: 0,
	dom: {
		container: {
			tag: 'div',
			className: 'dt-buttons'
		},
		collection: {
			tag: 'div',
			className: ''
		},
		button: {
			// Flash buttons will not work with `<button>` in IE - it has to be `<a>`
			tag: 'ActiveXObject' in window ?
				'a' :
				'button',
			className: 'dt-button',
			active: 'active',
			disabled: 'disabled'
		},
		buttonLiner: {
			tag: 'span',
			className: ''
		}
	}
};

/**
 * Version information
 * @type {string}
 * @static
 */
Buttons.version = '1.6.1';


$.extend( _dtButtons, {
	collection: {
		text: function ( dt ) {
			return dt.i18n( 'buttons.collection', 'Collection' );
		},
		className: 'buttons-collection',
		init: function ( dt, button, config ) {
			button.attr( 'aria-expanded', false );
		},
		action: function ( e, dt, button, config ) {
			e.stopPropagation();

			if ( config._collection.parents('body').length ) {
				this.popover(false, config);
			}
			else {
				this.popover(config._collection, config);
			}
		},
		attr: {
			'aria-haspopup': true
		}
		// Also the popover options, defined in Buttons.popover
	},
	copy: function ( dt, conf ) {
		if ( _dtButtons.copyHtml5 ) {
			return 'copyHtml5';
		}
		if ( _dtButtons.copyFlash && _dtButtons.copyFlash.available( dt, conf ) ) {
			return 'copyFlash';
		}
	},
	csv: function ( dt, conf ) {
		// Common option that will use the HTML5 or Flash export buttons
		if ( _dtButtons.csvHtml5 && _dtButtons.csvHtml5.available( dt, conf ) ) {
			return 'csvHtml5';
		}
		if ( _dtButtons.csvFlash && _dtButtons.csvFlash.available( dt, conf ) ) {
			return 'csvFlash';
		}
	},
	excel: function ( dt, conf ) {
		// Common option that will use the HTML5 or Flash export buttons
		if ( _dtButtons.excelHtml5 && _dtButtons.excelHtml5.available( dt, conf ) ) {
			return 'excelHtml5';
		}
		if ( _dtButtons.excelFlash && _dtButtons.excelFlash.available( dt, conf ) ) {
			return 'excelFlash';
		}
	},
	pdf: function ( dt, conf ) {
		// Common option that will use the HTML5 or Flash export buttons
		if ( _dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available( dt, conf ) ) {
			return 'pdfHtml5';
		}
		if ( _dtButtons.pdfFlash && _dtButtons.pdfFlash.available( dt, conf ) ) {
			return 'pdfFlash';
		}
	},
	pageLength: function ( dt ) {
		var lengthMenu = dt.settings()[0].aLengthMenu;
		var vals = $.isArray( lengthMenu[0] ) ? lengthMenu[0] : lengthMenu;
		var lang = $.isArray( lengthMenu[0] ) ? lengthMenu[1] : lengthMenu;
		var text = function ( dt ) {
			return dt.i18n( 'buttons.pageLength', {
				"-1": 'Show all rows',
				_:    'Show %d rows'
			}, dt.page.len() );
		};

		return {
			extend: 'collection',
			text: text,
			className: 'buttons-page-length',
			autoClose: true,
			buttons: $.map( vals, function ( val, i ) {
				return {
					text: lang[i],
					className: 'button-page-length',
					action: function ( e, dt ) {
						dt.page.len( val ).draw();
					},
					init: function ( dt, node, conf ) {
						var that = this;
						var fn = function () {
							that.active( dt.page.len() === val );
						};

						dt.on( 'length.dt'+conf.namespace, fn );
						fn();
					},
					destroy: function ( dt, node, conf ) {
						dt.off( 'length.dt'+conf.namespace );
					}
				};
			} ),
			init: function ( dt, node, conf ) {
				var that = this;
				dt.on( 'length.dt'+conf.namespace, function () {
					that.text( conf.text );
				} );
			},
			destroy: function ( dt, node, conf ) {
				dt.off( 'length.dt'+conf.namespace );
			}
		};
	}
} );


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API
 *
 * For complete documentation, please refer to the docs/api directory or the
 * DataTables site
 */

// Buttons group and individual button selector
DataTable.Api.register( 'buttons()', function ( group, selector ) {
	// Argument shifting
	if ( selector === undefined ) {
		selector = group;
		group = undefined;
	}

	this.selector.buttonGroup = group;

	var res = this.iterator( true, 'table', function ( ctx ) {
		if ( ctx._buttons ) {
			return Buttons.buttonSelector(
				Buttons.instanceSelector( group, ctx._buttons ),
				selector
			);
		}
	}, true );

	res._groupSelector = group;
	return res;
} );

// Individual button selector
DataTable.Api.register( 'button()', function ( group, selector ) {
	// just run buttons() and truncate
	var buttons = this.buttons( group, selector );

	if ( buttons.length > 1 ) {
		buttons.splice( 1, buttons.length );
	}

	return buttons;
} );

// Active buttons
DataTable.Api.registerPlural( 'buttons().active()', 'button().active()', function ( flag ) {
	if ( flag === undefined ) {
		return this.map( function ( set ) {
			return set.inst.active( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.active( set.node, flag );
	} );
} );

// Get / set button action
DataTable.Api.registerPlural( 'buttons().action()', 'button().action()', function ( action ) {
	if ( action === undefined ) {
		return this.map( function ( set ) {
			return set.inst.action( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.action( set.node, action );
	} );
} );

// Enable / disable buttons
DataTable.Api.register( ['buttons().enable()', 'button().enable()'], function ( flag ) {
	return this.each( function ( set ) {
		set.inst.enable( set.node, flag );
	} );
} );

// Disable buttons
DataTable.Api.register( ['buttons().disable()', 'button().disable()'], function () {
	return this.each( function ( set ) {
		set.inst.disable( set.node );
	} );
} );

// Get button nodes
DataTable.Api.registerPlural( 'buttons().nodes()', 'button().node()', function () {
	var jq = $();

	// jQuery will automatically reduce duplicates to a single entry
	$( this.each( function ( set ) {
		jq = jq.add( set.inst.node( set.node ) );
	} ) );

	return jq;
} );

// Get / set button processing state
DataTable.Api.registerPlural( 'buttons().processing()', 'button().processing()', function ( flag ) {
	if ( flag === undefined ) {
		return this.map( function ( set ) {
			return set.inst.processing( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.processing( set.node, flag );
	} );
} );

// Get / set button text (i.e. the button labels)
DataTable.Api.registerPlural( 'buttons().text()', 'button().text()', function ( label ) {
	if ( label === undefined ) {
		return this.map( function ( set ) {
			return set.inst.text( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.text( set.node, label );
	} );
} );

// Trigger a button's action
DataTable.Api.registerPlural( 'buttons().trigger()', 'button().trigger()', function () {
	return this.each( function ( set ) {
		set.inst.node( set.node ).trigger( 'click' );
	} );
} );

// Button resolver to the popover
DataTable.Api.register( 'button().popover()', function (content, options) {
	return this.map( function ( set ) {
		return set.inst._popover( content, this.button(this[0].node), options );
	} );
} );

// Get the container elements
DataTable.Api.register( 'buttons().containers()', function () {
	var jq = $();
	var groupSelector = this._groupSelector;

	// We need to use the group selector directly, since if there are no buttons
	// the result set will be empty
	this.iterator( true, 'table', function ( ctx ) {
		if ( ctx._buttons ) {
			var insts = Buttons.instanceSelector( groupSelector, ctx._buttons );

			for ( var i=0, ien=insts.length ; i<ien ; i++ ) {
				jq = jq.add( insts[i].container() );
			}
		}
	} );

	return jq;
} );

DataTable.Api.register( 'buttons().container()', function () {
	// API level of nesting is `buttons()` so we can zip into the containers method
	return this.containers().eq(0);
} );

// Add a new button
DataTable.Api.register( 'button().add()', function ( idx, conf ) {
	var ctx = this.context;

	// Don't use `this` as it could be empty - select the instances directly
	if ( ctx.length ) {
		var inst = Buttons.instanceSelector( this._groupSelector, ctx[0]._buttons );

		if ( inst.length ) {
			inst[0].add( conf, idx );
		}
	}

	return this.button( this._groupSelector, idx );
} );

// Destroy the button sets selected
DataTable.Api.register( 'buttons().destroy()', function () {
	this.pluck( 'inst' ).unique().each( function ( inst ) {
		inst.destroy();
	} );

	return this;
} );

// Remove a button
DataTable.Api.registerPlural( 'buttons().remove()', 'buttons().remove()', function () {
	this.each( function ( set ) {
		set.inst.remove( set.node );
	} );

	return this;
} );

// Information box that can be used by buttons
var _infoTimer;
DataTable.Api.register( 'buttons.info()', function ( title, message, time ) {
	var that = this;

	if ( title === false ) {
		this.off('destroy.btn-info');
		$('#datatables_buttons_info').fadeOut( function () {
			$(this).remove();
		} );
		clearTimeout( _infoTimer );
		_infoTimer = null;

		return this;
	}

	if ( _infoTimer ) {
		clearTimeout( _infoTimer );
	}

	if ( $('#datatables_buttons_info').length ) {
		$('#datatables_buttons_info').remove();
	}

	title = title ? '<h2>'+title+'</h2>' : '';

	$('<div id="datatables_buttons_info" class="dt-button-info"/>')
		.html( title )
		.append( $('<div/>')[ typeof message === 'string' ? 'html' : 'append' ]( message ) )
		.css( 'display', 'none' )
		.appendTo( 'body' )
		.fadeIn();

	if ( time !== undefined && time !== 0 ) {
		_infoTimer = setTimeout( function () {
			that.buttons.info( false );
		}, time );
	}

	this.on('destroy.btn-info', function () {
		that.buttons.info(false);
	});

	return this;
} );

// Get data from the table for export - this is common to a number of plug-in
// buttons so it is included in the Buttons core library
DataTable.Api.register( 'buttons.exportData()', function ( options ) {
	if ( this.context.length ) {
		return _exportData( new DataTable.Api( this.context[0] ), options );
	}
} );

// Get information about the export that is common to many of the export data
// types (DRY)
DataTable.Api.register( 'buttons.exportInfo()', function ( conf ) {
	if ( ! conf ) {
		conf = {};
	}

	return {
		filename: _filename( conf ),
		title: _title( conf ),
		messageTop: _message(this, conf.message || conf.messageTop, 'top'),
		messageBottom: _message(this, conf.messageBottom, 'bottom')
	};
} );



/**
 * Get the file name for an exported file.
 *
 * @param {object}	config Button configuration
 * @param {boolean} incExtension Include the file name extension
 */
var _filename = function ( config )
{
	// Backwards compatibility
	var filename = config.filename === '*' && config.title !== '*' && config.title !== undefined && config.title !== null && config.title !== '' ?
		config.title :
		config.filename;

	if ( typeof filename === 'function' ) {
		filename = filename();
	}

	if ( filename === undefined || filename === null ) {
		return null;
	}

	if ( filename.indexOf( '*' ) !== -1 ) {
		filename = $.trim( filename.replace( '*', $('head > title').text() ) );
	}

	// Strip characters which the OS will object to
	filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, "");

	var extension = _stringOrFunction( config.extension );
	if ( ! extension ) {
		extension = '';
	}

	return filename + extension;
};

/**
 * Simply utility method to allow parameters to be given as a function
 *
 * @param {undefined|string|function} option Option
 * @return {null|string} Resolved value
 */
var _stringOrFunction = function ( option )
{
	if ( option === null || option === undefined ) {
		return null;
	}
	else if ( typeof option === 'function' ) {
		return option();
	}
	return option;
};

/**
 * Get the title for an exported file.
 *
 * @param {object} config	Button configuration
 */
var _title = function ( config )
{
	var title = _stringOrFunction( config.title );

	return title === null ?
		null : title.indexOf( '*' ) !== -1 ?
			title.replace( '*', $('head > title').text() || 'Exported data' ) :
			title;
};

var _message = function ( dt, option, position )
{
	var message = _stringOrFunction( option );
	if ( message === null ) {
		return null;
	}

	var caption = $('caption', dt.table().container()).eq(0);
	if ( message === '*' ) {
		var side = caption.css( 'caption-side' );
		if ( side !== position ) {
			return null;
		}

		return caption.length ?
			caption.text() :
			'';
	}

	return message;
};







var _exportTextarea = $('<textarea/>')[0];
var _exportData = function ( dt, inOpts )
{
	var config = $.extend( true, {}, {
		rows:           null,
		columns:        '',
		modifier:       {
			search: 'applied',
			order:  'applied'
		},
		orthogonal:     'display',
		stripHtml:      true,
		stripNewlines:  true,
		decodeEntities: true,
		trim:           true,
		format:         {
			header: function ( d ) {
				return strip( d );
			},
			footer: function ( d ) {
				return strip( d );
			},
			body: function ( d ) {
				return strip( d );
			}
		},
		customizeData: null
	}, inOpts );

	var strip = function ( str ) {
		if ( typeof str !== 'string' ) {
			return str;
		}

		// Always remove script tags
		str = str.replace( /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '' );

		// Always remove comments
		str = str.replace( /<!\-\-.*?\-\->/g, '' );

		if ( config.stripHtml ) {
			str = str.replace( /<[^>]*>/g, '' );
		}

		if ( config.trim ) {
			str = str.replace( /^\s+|\s+$/g, '' );
		}

		if ( config.stripNewlines ) {
			str = str.replace( /\n/g, ' ' );
		}

		if ( config.decodeEntities ) {
			_exportTextarea.innerHTML = str;
			str = _exportTextarea.value;
		}

		return str;
	};


	var header = dt.columns( config.columns ).indexes().map( function (idx) {
		var el = dt.column( idx ).header();
		return config.format.header( el.innerHTML, idx, el );
	} ).toArray();

	var footer = dt.table().footer() ?
		dt.columns( config.columns ).indexes().map( function (idx) {
			var el = dt.column( idx ).footer();
			return config.format.footer( el ? el.innerHTML : '', idx, el );
		} ).toArray() :
		null;
	
	// If Select is available on this table, and any rows are selected, limit the export
	// to the selected rows. If no rows are selected, all rows will be exported. Specify
	// a `selected` modifier to control directly.
	var modifier = $.extend( {}, config.modifier );
	if ( dt.select && typeof dt.select.info === 'function' && modifier.selected === undefined ) {
		if ( dt.rows( config.rows, $.extend( { selected: true }, modifier ) ).any() ) {
			$.extend( modifier, { selected: true } )
		}
	}

	var rowIndexes = dt.rows( config.rows, modifier ).indexes().toArray();
	var selectedCells = dt.cells( rowIndexes, config.columns );
	var cells = selectedCells
		.render( config.orthogonal )
		.toArray();
	var cellNodes = selectedCells
		.nodes()
		.toArray();

	var columns = header.length;
	var rows = columns > 0 ? cells.length / columns : 0;
	var body = [];
	var cellCounter = 0;

	for ( var i=0, ien=rows ; i<ien ; i++ ) {
		var row = [ columns ];

		for ( var j=0 ; j<columns ; j++ ) {
			row[j] = config.format.body( cells[ cellCounter ], i, j, cellNodes[ cellCounter ] );
			cellCounter++;
		}

		body[i] = row;
	}

	var data = {
		header: header,
		footer: footer,
		body:   body
	};

	if ( config.customizeData ) {
		config.customizeData( data );
	}

	return data;
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.Buttons = Buttons;
$.fn.DataTable.Buttons = Buttons;



// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
// be removed in future.
$(document).on( 'init.dt plugin-init.dt', function (e, settings) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var opts = settings.oInit.buttons || DataTable.defaults.buttons;

	if ( opts && ! settings._buttons ) {
		new Buttons( settings, opts ).container();
	}
} );

function _init ( settings ) {
	var api = new DataTable.Api( settings );
	var opts = api.init().buttons || DataTable.defaults.buttons;

	return new Buttons( api, opts ).container();
}

// DataTables `dom` feature option
DataTable.ext.feature.push( {
	fnInit: _init,
	cFeature: "B"
} );

// DataTables 2 layout feature
if ( DataTable.ext.features ) {
	DataTable.ext.features.register( 'buttons', _init );
}


return Buttons;
}));

/*!
 * Flash export buttons for Buttons and DataTables.
 * 2015-2017 SpryMedia Ltd - datatables.net/license
 *
 * ZeroClipbaord - MIT license
 * Copyright (c) 2012 Joseph Huckaby
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * ZeroClipboard dependency
 */

/*
 * ZeroClipboard 1.0.4 with modifications
 * Author: Joseph Huckaby
 * License: MIT
 *
 * Copyright (c) 2012 Joseph Huckaby
 */
var ZeroClipboard_TableTools = {
	version: "1.0.4-TableTools2",
	clients: {}, // registered upload clients on page, indexed by id
	moviePath: '', // URL to movie
	nextId: 1, // ID of next movie

	$: function(thingy) {
		// simple DOM lookup utility function
		if (typeof(thingy) == 'string') {
			thingy = document.getElementById(thingy);
		}
		if (!thingy.addClass) {
			// extend element with a few useful methods
			thingy.hide = function() { this.style.display = 'none'; };
			thingy.show = function() { this.style.display = ''; };
			thingy.addClass = function(name) { this.removeClass(name); this.className += ' ' + name; };
			thingy.removeClass = function(name) {
				this.className = this.className.replace( new RegExp("\\s*" + name + "\\s*"), " ").replace(/^\s+/, '').replace(/\s+$/, '');
			};
			thingy.hasClass = function(name) {
				return !!this.className.match( new RegExp("\\s*" + name + "\\s*") );
			};
		}
		return thingy;
	},

	setMoviePath: function(path) {
		// set path to ZeroClipboard.swf
		this.moviePath = path;
	},

	dispatch: function(id, eventName, args) {
		// receive event from flash movie, send to client
		var client = this.clients[id];
		if (client) {
			client.receiveEvent(eventName, args);
		}
	},

	log: function ( str ) {
		console.log( 'Flash: '+str );
	},

	register: function(id, client) {
		// register new client to receive events
		this.clients[id] = client;
	},

	getDOMObjectPosition: function(obj) {
		// get absolute coordinates for dom element
		var info = {
			left: 0,
			top: 0,
			width: obj.width ? obj.width : obj.offsetWidth,
			height: obj.height ? obj.height : obj.offsetHeight
		};

		if ( obj.style.width !== "" ) {
			info.width = obj.style.width.replace("px","");
		}

		if ( obj.style.height !== "" ) {
			info.height = obj.style.height.replace("px","");
		}

		while (obj) {
			info.left += obj.offsetLeft;
			info.top += obj.offsetTop;
			obj = obj.offsetParent;
		}

		return info;
	},

	Client: function(elem) {
		// constructor for new simple upload client
		this.handlers = {};

		// unique ID
		this.id = ZeroClipboard_TableTools.nextId++;
		this.movieId = 'ZeroClipboard_TableToolsMovie_' + this.id;

		// register client with singleton to receive flash events
		ZeroClipboard_TableTools.register(this.id, this);

		// create movie
		if (elem) {
			this.glue(elem);
		}
	}
};

ZeroClipboard_TableTools.Client.prototype = {

	id: 0, // unique ID for us
	ready: false, // whether movie is ready to receive events or not
	movie: null, // reference to movie object
	clipText: '', // text to copy to clipboard
	fileName: '', // default file save name
	action: 'copy', // action to perform
	handCursorEnabled: true, // whether to show hand cursor, or default pointer cursor
	cssEffects: true, // enable CSS mouse effects on dom container
	handlers: null, // user event handlers
	sized: false,
	sheetName: '', // default sheet name for excel export

	glue: function(elem, title) {
		// glue to DOM element
		// elem can be ID or actual DOM element object
		this.domElement = ZeroClipboard_TableTools.$(elem);

		// float just above object, or zIndex 99 if dom element isn't set
		var zIndex = 99;
		if (this.domElement.style.zIndex) {
			zIndex = parseInt(this.domElement.style.zIndex, 10) + 1;
		}

		// find X/Y position of domElement
		var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);

		// create floating DIV above element
		this.div = document.createElement('div');
		var style = this.div.style;
		style.position = 'absolute';
		style.left = '0px';
		style.top = '0px';
		style.width = (box.width) + 'px';
		style.height = box.height + 'px';
		style.zIndex = zIndex;

		if ( typeof title != "undefined" && title !== "" ) {
			this.div.title = title;
		}
		if ( box.width !== 0 && box.height !== 0 ) {
			this.sized = true;
		}

		// style.backgroundColor = '#f00'; // debug
		if ( this.domElement ) {
			this.domElement.appendChild(this.div);
			this.div.innerHTML = this.getHTML( box.width, box.height ).replace(/&/g, '&amp;');
		}
	},

	positionElement: function() {
		var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);
		var style = this.div.style;

		style.position = 'absolute';
		//style.left = (this.domElement.offsetLeft)+'px';
		//style.top = this.domElement.offsetTop+'px';
		style.width = box.width + 'px';
		style.height = box.height + 'px';

		if ( box.width !== 0 && box.height !== 0 ) {
			this.sized = true;
		} else {
			return;
		}

		var flash = this.div.childNodes[0];
		flash.width = box.width;
		flash.height = box.height;
	},

	getHTML: function(width, height) {
		// return HTML for movie
		var html = '';
		var flashvars = 'id=' + this.id +
			'&width=' + width +
			'&height=' + height;

		if (navigator.userAgent.match(/MSIE/)) {
			// IE gets an OBJECT tag
			var protocol = location.href.match(/^https/i) ? 'https://' : 'http://';
			html += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="'+protocol+'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="'+width+'" height="'+height+'" id="'+this.movieId+'" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+ZeroClipboard_TableTools.moviePath+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><param name="wmode" value="transparent"/></object>';
		}
		else {
			// all other browsers get an EMBED tag
			html += '<embed id="'+this.movieId+'" src="'+ZeroClipboard_TableTools.moviePath+'" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+width+'" height="'+height+'" name="'+this.movieId+'" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'" wmode="transparent" />';
		}
		return html;
	},

	hide: function() {
		// temporarily hide floater offscreen
		if (this.div) {
			this.div.style.left = '-2000px';
		}
	},

	show: function() {
		// show ourselves after a call to hide()
		this.reposition();
	},

	destroy: function() {
		// destroy control and floater
		var that = this;

		if (this.domElement && this.div) {
			$(this.div).remove();

			this.domElement = null;
			this.div = null;

			$.each( ZeroClipboard_TableTools.clients, function ( id, client ) {
				if ( client === that ) {
					delete ZeroClipboard_TableTools.clients[ id ];
				}
			} );
		}
	},

	reposition: function(elem) {
		// reposition our floating div, optionally to new container
		// warning: container CANNOT change size, only position
		if (elem) {
			this.domElement = ZeroClipboard_TableTools.$(elem);
			if (!this.domElement) {
				this.hide();
			}
		}

		if (this.domElement && this.div) {
			var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);
			var style = this.div.style;
			style.left = '' + box.left + 'px';
			style.top = '' + box.top + 'px';
		}
	},

	clearText: function() {
		// clear the text to be copy / saved
		this.clipText = '';
		if (this.ready) {
			this.movie.clearText();
		}
	},

	appendText: function(newText) {
		// append text to that which is to be copied / saved
		this.clipText += newText;
		if (this.ready) { this.movie.appendText(newText) ;}
	},

	setText: function(newText) {
		// set text to be copied to be copied / saved
		this.clipText = newText;
		if (this.ready) { this.movie.setText(newText) ;}
	},

	setFileName: function(newText) {
		// set the file name
		this.fileName = newText;
		if (this.ready) {
			this.movie.setFileName(newText);
		}
	},

	setSheetData: function(data) {
		// set the xlsx sheet data
		if (this.ready) {
			this.movie.setSheetData( JSON.stringify( data ) );
		}
	},

	setAction: function(newText) {
		// set action (save or copy)
		this.action = newText;
		if (this.ready) {
			this.movie.setAction(newText);
		}
	},

	addEventListener: function(eventName, func) {
		// add user event listener for event
		// event types: load, queueStart, fileStart, fileComplete, queueComplete, progress, error, cancel
		eventName = eventName.toString().toLowerCase().replace(/^on/, '');
		if (!this.handlers[eventName]) {
			this.handlers[eventName] = [];
		}
		this.handlers[eventName].push(func);
	},

	setHandCursor: function(enabled) {
		// enable hand cursor (true), or default arrow cursor (false)
		this.handCursorEnabled = enabled;
		if (this.ready) {
			this.movie.setHandCursor(enabled);
		}
	},

	setCSSEffects: function(enabled) {
		// enable or disable CSS effects on DOM container
		this.cssEffects = !!enabled;
	},

	receiveEvent: function(eventName, args) {
		var self;

		// receive event from flash
		eventName = eventName.toString().toLowerCase().replace(/^on/, '');

		// special behavior for certain events
		switch (eventName) {
			case 'load':
				// movie claims it is ready, but in IE this isn't always the case...
				// bug fix: Cannot extend EMBED DOM elements in Firefox, must use traditional function
				this.movie = document.getElementById(this.movieId);
				if (!this.movie) {
					self = this;
					setTimeout( function() { self.receiveEvent('load', null); }, 1 );
					return;
				}

				// firefox on pc needs a "kick" in order to set these in certain cases
				if (!this.ready && navigator.userAgent.match(/Firefox/) && navigator.userAgent.match(/Windows/)) {
					self = this;
					setTimeout( function() { self.receiveEvent('load', null); }, 100 );
					this.ready = true;
					return;
				}

				this.ready = true;
				this.movie.clearText();
				this.movie.appendText( this.clipText );
				this.movie.setFileName( this.fileName );
				this.movie.setAction( this.action );
				this.movie.setHandCursor( this.handCursorEnabled );
				break;

			case 'mouseover':
				if (this.domElement && this.cssEffects) {
					//this.domElement.addClass('hover');
					if (this.recoverActive) {
						this.domElement.addClass('active');
					}
				}
				break;

			case 'mouseout':
				if (this.domElement && this.cssEffects) {
					this.recoverActive = false;
					if (this.domElement.hasClass('active')) {
						this.domElement.removeClass('active');
						this.recoverActive = true;
					}
					//this.domElement.removeClass('hover');
				}
				break;

			case 'mousedown':
				if (this.domElement && this.cssEffects) {
					this.domElement.addClass('active');
				}
				break;

			case 'mouseup':
				if (this.domElement && this.cssEffects) {
					this.domElement.removeClass('active');
					this.recoverActive = false;
				}
				break;
		} // switch eventName

		if (this.handlers[eventName]) {
			for (var idx = 0, len = this.handlers[eventName].length; idx < len; idx++) {
				var func = this.handlers[eventName][idx];

				if (typeof(func) == 'function') {
					// actual function reference
					func(this, args);
				}
				else if ((typeof(func) == 'object') && (func.length == 2)) {
					// PHP style object + method, i.e. [myObject, 'myMethod']
					func[0][ func[1] ](this, args);
				}
				else if (typeof(func) == 'string') {
					// name of function
					window[func](this, args);
				}
			} // foreach event handler defined
		} // user defined handler for event
	}
};

ZeroClipboard_TableTools.hasFlash = function ()
{
	try {
		var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
		if (fo) {
			return true;
		}
	}
	catch (e) {
		if (
			navigator.mimeTypes &&
			navigator.mimeTypes['application/x-shockwave-flash'] !== undefined &&
			navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin
		) {
			return true;
		}
	}

	return false;
};

// For the Flash binding to work, ZeroClipboard_TableTools must be on the global
// object list
window.ZeroClipboard_TableTools = ZeroClipboard_TableTools;



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Local (private) functions
 */

/**
 * If a Buttons instance is initlaised before it is placed into the DOM, Flash
 * won't be able to bind to it, so we need to wait until it is available, this
 * method abstracts that out.
 *
 * @param {ZeroClipboard} flash ZeroClipboard instance
 * @param {jQuery} node  Button
 */
var _glue = function ( flash, node )
{
	var id = node.attr('id');

	if ( node.parents('html').length ) {
		flash.glue( node[0], '' );
	}
	else {
		setTimeout( function () {
			_glue( flash, node );
		}, 500 );
	}
};

/**
 * Get the sheet name for Excel exports.
 *
 * @param {object}  config       Button configuration
 */
var _sheetname = function ( config )
{
	var sheetName = 'Sheet1';

	if ( config.sheetName ) {
		sheetName = config.sheetName.replace(/[\[\]\*\/\\\?\:]/g, '');
	}

	return sheetName;
};

/**
 * Set the flash text. This has to be broken up into chunks as the Javascript /
 * Flash bridge has a size limit. There is no indication in the Flash
 * documentation what this is, and it probably depends upon the browser.
 * Experimentation shows that the point is around 50k when data starts to get
 * lost, so an 8K limit used here is safe.
 *
 * @param {ZeroClipboard} flash ZeroClipboard instance
 * @param {string}        data  Data to send to Flash
 */
var _setText = function ( flash, data )
{
	var parts = data.match(/[\s\S]{1,8192}/g) || [];

	flash.clearText();
	for ( var i=0, len=parts.length ; i<len ; i++ )
	{
		flash.appendText( parts[i] );
	}
};

/**
 * Get the newline character(s)
 *
 * @param {object}  config Button configuration
 * @return {string}        Newline character
 */
var _newLine = function ( config )
{
	return config.newline ?
		config.newline :
		navigator.userAgent.match(/Windows/) ?
			'\r\n' :
			'\n';
};

/**
 * Combine the data from the `buttons.exportData` method into a string that
 * will be used in the export file.
 *
 * @param  {DataTable.Api} dt     DataTables API instance
 * @param  {object}        config Button configuration
 * @return {object}               The data to export
 */
var _exportData = function ( dt, config )
{
	var newLine = _newLine( config );
	var data = dt.buttons.exportData( config.exportOptions );
	var boundary = config.fieldBoundary;
	var separator = config.fieldSeparator;
	var reBoundary = new RegExp( boundary, 'g' );
	var escapeChar = config.escapeChar !== undefined ?
		config.escapeChar :
		'\\';
	var join = function ( a ) {
		var s = '';

		// If there is a field boundary, then we might need to escape it in
		// the source data
		for ( var i=0, ien=a.length ; i<ien ; i++ ) {
			if ( i > 0 ) {
				s += separator;
			}

			s += boundary ?
				boundary + ('' + a[i]).replace( reBoundary, escapeChar+boundary ) + boundary :
				a[i];
		}

		return s;
	};

	var header = config.header ? join( data.header )+newLine : '';
	var footer = config.footer && data.footer ? newLine+join( data.footer ) : '';
	var body = [];

	for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
		body.push( join( data.body[i] ) );
	}

	return {
		str: header + body.join( newLine ) + footer,
		rows: body.length
	};
};


// Basic initialisation for the buttons is common between them
var flashButton = {
	available: function () {
		return ZeroClipboard_TableTools.hasFlash();
	},

	init: function ( dt, button, config ) {
		// Insert the Flash movie
		ZeroClipboard_TableTools.moviePath = DataTable.Buttons.swfPath;
		var flash = new ZeroClipboard_TableTools.Client();

		flash.setHandCursor( true );
		flash.addEventListener('mouseDown', function(client) {
			config._fromFlash = true;
			dt.button( button[0] ).trigger();
			config._fromFlash = false;
		} );

		_glue( flash, button );

		config._flash = flash;
	},

	destroy: function ( dt, button, config ) {
		config._flash.destroy();
	},

	fieldSeparator: ',',

	fieldBoundary: '"',

	exportOptions: {},

	title: '*',

	messageTop: '*',

	messageBottom: '*',

	filename: '*',

	extension: '.csv',

	header: true,

	footer: false
};


/**
 * Convert from numeric position to letter for column names in Excel
 * @param  {int} n Column number
 * @return {string} Column letter(s) name
 */
function createCellPos( n ){
	var ordA = 'A'.charCodeAt(0);
	var ordZ = 'Z'.charCodeAt(0);
	var len = ordZ - ordA + 1;
	var s = "";

	while( n >= 0 ) {
		s = String.fromCharCode(n % len + ordA) + s;
		n = Math.floor(n / len) - 1;
	}

	return s;
}

/**
 * Create an XML node and add any children, attributes, etc without needing to
 * be verbose in the DOM.
 *
 * @param  {object} doc      XML document
 * @param  {string} nodeName Node name
 * @param  {object} opts     Options - can be `attr` (attributes), `children`
 *   (child nodes) and `text` (text content)
 * @return {node}            Created node
 */
function _createNode( doc, nodeName, opts ){
	var tempNode = doc.createElement( nodeName );

	if ( opts ) {
		if ( opts.attr ) {
			$(tempNode).attr( opts.attr );
		}

		if ( opts.children ) {
			$.each( opts.children, function ( key, value ) {
				tempNode.appendChild( value );
			} );
		}

		if ( opts.text !== null && opts.text !== undefined ) {
			tempNode.appendChild( doc.createTextNode( opts.text ) );
		}
	}

	return tempNode;
}

/**
 * Get the width for an Excel column based on the contents of that column
 * @param  {object} data Data for export
 * @param  {int}    col  Column index
 * @return {int}         Column width
 */
function _excelColWidth( data, col ) {
	var max = data.header[col].length;
	var len, lineSplit, str;

	if ( data.footer && data.footer[col].length > max ) {
		max = data.footer[col].length;
	}

	for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
		var point = data.body[i][col];
		str = point !== null && point !== undefined ?
			point.toString() :
			'';

		// If there is a newline character, workout the width of the column
		// based on the longest line in the string
		if ( str.indexOf('\n') !== -1 ) {
			lineSplit = str.split('\n');
			lineSplit.sort( function (a, b) {
				return b.length - a.length;
			} );

			len = lineSplit[0].length;
		}
		else {
			len = str.length;
		}

		if ( len > max ) {
			max = len;
		}

		// Max width rather than having potentially massive column widths
		if ( max > 40 ) {
			return 52; // 40 * 1.3
		}
	}

	max *= 1.3;

	// And a min width
	return max > 6 ? max : 6;
}

  var _serialiser = "";
    if (typeof window.XMLSerializer === 'undefined') {
        _serialiser = new function () {
            this.serializeToString = function (input) {
                return input.xml
            }
        };
    } else {
        _serialiser =  new XMLSerializer();
    }

    var _ieExcel;


/**
 * Convert XML documents in an object to strings
 * @param  {object} obj XLSX document object
 */
function _xlsxToStrings( obj ) {
	if ( _ieExcel === undefined ) {
		// Detect if we are dealing with IE's _awful_ serialiser by seeing if it
		// drop attributes
		_ieExcel = _serialiser
			.serializeToString(
				$.parseXML( excelStrings['xl/worksheets/sheet1.xml'] )
			)
			.indexOf( 'xmlns:r' ) === -1;
	}

	$.each( obj, function ( name, val ) {
		if ( $.isPlainObject( val ) ) {
			_xlsxToStrings( val );
		}
		else {
			if ( _ieExcel ) {
				// IE's XML serialiser will drop some name space attributes from
				// from the root node, so we need to save them. Do this by
				// replacing the namespace nodes with a regular attribute that
				// we convert back when serialised. Edge does not have this
				// issue
				var worksheet = val.childNodes[0];
				var i, ien;
				var attrs = [];

				for ( i=worksheet.attributes.length-1 ; i>=0 ; i-- ) {
					var attrName = worksheet.attributes[i].nodeName;
					var attrValue = worksheet.attributes[i].nodeValue;

					if ( attrName.indexOf( ':' ) !== -1 ) {
						attrs.push( { name: attrName, value: attrValue } );

						worksheet.removeAttribute( attrName );
					}
				}

				for ( i=0, ien=attrs.length ; i<ien ; i++ ) {
					var attr = val.createAttribute( attrs[i].name.replace( ':', '_dt_b_namespace_token_' ) );
					attr.value = attrs[i].value;
					worksheet.setAttributeNode( attr );
				}
			}

			var str = _serialiser.serializeToString(val);

			// Fix IE's XML
			if ( _ieExcel ) {
				// IE doesn't include the XML declaration
				if ( str.indexOf( '<?xml' ) === -1 ) {
					str = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+str;
				}

				// Return namespace attributes to being as such
				str = str.replace( /_dt_b_namespace_token_/g, ':' );
			}

			// Safari, IE and Edge will put empty name space attributes onto
			// various elements making them useless. This strips them out
			str = str.replace( /<([^<>]*?) xmlns=""([^<>]*?)>/g, '<$1 $2>' );

			obj[ name ] = str;
		}
	} );
}

// Excel - Pre-defined strings to build a basic XLSX file
var excelStrings = {
	"_rels/.rels":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
		'</Relationships>',

	"xl/_rels/workbook.xml.rels":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
			'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
		'</Relationships>',

	"[Content_Types].xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
			'<Default Extension="xml" ContentType="application/xml" />'+
			'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />'+
			'<Default Extension="jpeg" ContentType="image/jpeg" />'+
			'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />'+
			'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />'+
			'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" />'+
		'</Types>',

	"xl/workbook.xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
			'<fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/>'+
			'<workbookPr showInkAnnotation="0" autoCompressPictures="0"/>'+
			'<bookViews>'+
				'<workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/>'+
			'</bookViews>'+
			'<sheets>'+
				'<sheet name="" sheetId="1" r:id="rId1"/>'+
			'</sheets>'+
		'</workbook>',

	"xl/worksheets/sheet1.xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">'+
			'<sheetData/>'+
			'<mergeCells count="0"/>'+
		'</worksheet>',

	"xl/styles.xml":
		'<?xml version="1.0" encoding="UTF-8"?>'+
		'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">'+
			'<numFmts count="6">'+
				'<numFmt numFmtId="164" formatCode="#,##0.00_-\ [$$-45C]"/>'+
				'<numFmt numFmtId="165" formatCode="&quot;£&quot;#,##0.00"/>'+
				'<numFmt numFmtId="166" formatCode="[$€-2]\ #,##0.00"/>'+
				'<numFmt numFmtId="167" formatCode="0.0%"/>'+
				'<numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/>'+
				'<numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/>'+
			'</numFmts>'+
			'<fonts count="5" x14ac:knownFonts="1">'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<color rgb="FFFFFFFF" />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<b />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<i />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<u />'+
				'</font>'+
			'</fonts>'+
			'<fills count="6">'+
				'<fill>'+
					'<patternFill patternType="none" />'+
				'</fill>'+
				'<fill>'+ // Excel appears to use this as a dotted background regardless of values but
					'<patternFill patternType="none" />'+ // to be valid to the schema, use a patternFill
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="FFD9D9D9" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="FFD99795" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="ffc6efce" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="ffc6cfef" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
			'</fills>'+
			'<borders count="2">'+
				'<border>'+
					'<left />'+
					'<right />'+
					'<top />'+
					'<bottom />'+
					'<diagonal />'+
				'</border>'+
				'<border diagonalUp="false" diagonalDown="false">'+
					'<left style="thin">'+
						'<color auto="1" />'+
					'</left>'+
					'<right style="thin">'+
						'<color auto="1" />'+
					'</right>'+
					'<top style="thin">'+
						'<color auto="1" />'+
					'</top>'+
					'<bottom style="thin">'+
						'<color auto="1" />'+
					'</bottom>'+
					'<diagonal />'+
				'</border>'+
			'</borders>'+
			'<cellStyleXfs count="1">'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" />'+
			'</cellStyleXfs>'+
			'<cellXfs count="61">'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="left"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="center"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="right"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="fill"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment textRotation="90"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment wrapText="1"/>'+
				'</xf>'+
				'<xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
			'</cellXfs>'+
			'<cellStyles count="1">'+
				'<cellStyle name="Normal" xfId="0" builtinId="0" />'+
			'</cellStyles>'+
			'<dxfs count="0" />'+
			'<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" />'+
		'</styleSheet>'
};
// Note we could use 3 `for` loops for the styles, but when gzipped there is
// virtually no difference in size, since the above can be easily compressed

// Pattern matching for special number formats. Perhaps this should be exposed
// via an API in future?
var _excelSpecials = [
	{ match: /^\-?\d+\.\d%$/,       style: 60, fmt: function (d) { return d/100; } }, // Precent with d.p.
	{ match: /^\-?\d+\.?\d*%$/,     style: 56, fmt: function (d) { return d/100; } }, // Percent
	{ match: /^\-?\$[\d,]+.?\d*$/,  style: 57 }, // Dollars
	{ match: /^\-?£[\d,]+.?\d*$/,   style: 58 }, // Pounds
	{ match: /^\-?€[\d,]+.?\d*$/,   style: 59 }, // Euros
	{ match: /^\([\d,]+\)$/,        style: 61, fmt: function (d) { return -1 * d.replace(/[\(\)]/g, ''); } },  // Negative numbers indicated by brackets
	{ match: /^\([\d,]+\.\d{2}\)$/, style: 62, fmt: function (d) { return -1 * d.replace(/[\(\)]/g, ''); } },  // Negative numbers indicated by brackets - 2d.p.
	{ match: /^[\d,]+$/,            style: 63 }, // Numbers with thousand separators
	{ match: /^[\d,]+\.\d{2}$/,     style: 64 }  // Numbers with 2d.p. and thousands separators
];



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables options and methods
 */

// Set the default SWF path
DataTable.Buttons.swfPath = '//cdn.datatables.net/buttons/'+DataTable.Buttons.version+'/swf/flashExport.swf';

// Method to allow Flash buttons to be resized when made visible - as they are
// of zero height and width if initialised hidden
DataTable.Api.register( 'buttons.resize()', function () {
	$.each( ZeroClipboard_TableTools.clients, function ( i, client ) {
		if ( client.domElement !== undefined && client.domElement.parentNode ) {
			client.positionElement();
		}
	} );
} );


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Button definitions
 */

// Copy to clipboard
DataTable.ext.buttons.copyFlash = $.extend( {}, flashButton, {
	className: 'buttons-copy buttons-flash',

	text: function ( dt ) {
		return dt.i18n( 'buttons.copy', 'Copy' );
	},

	action: function ( e, dt, button, config ) {
		// Check that the trigger did actually occur due to a Flash activation
		if ( ! config._fromFlash ) {
			return;
		}

		this.processing( true );

		var flash = config._flash;
		var exportData = _exportData( dt, config );
		var info = dt.buttons.exportInfo( config );
		var newline = _newLine(config);
		var output = exportData.str;

		if ( info.title ) {
			output = info.title + newline + newline + output;
		}

		if ( info.messageTop ) {
			output = info.messageTop + newline + newline + output;
		}

		if ( info.messageBottom ) {
			output = output + newline + newline + info.messageBottom;
		}

		if ( config.customize ) {
			output = config.customize( output, config, dt );
		}

		flash.setAction( 'copy' );
		_setText( flash, output );

		this.processing( false );

		dt.buttons.info(
			dt.i18n( 'buttons.copyTitle', 'Copy to clipboard' ),
			dt.i18n( 'buttons.copySuccess', {
				_: 'Copied %d rows to clipboard',
				1: 'Copied 1 row to clipboard'
			}, data.rows ),
			3000
		);
	},

	fieldSeparator: '\t',

	fieldBoundary: ''
} );

// CSV save file
DataTable.ext.buttons.csvFlash = $.extend( {}, flashButton, {
	className: 'buttons-csv buttons-flash',

	text: function ( dt ) {
		return dt.i18n( 'buttons.csv', 'CSV' );
	},

	action: function ( e, dt, button, config ) {
		// Set the text
		var flash = config._flash;
		var data = _exportData( dt, config );
		var info = dt.buttons.exportInfo( config );
		var output = config.customize ?
			config.customize( data.str, config, dt ) :
			data.str;

		flash.setAction( 'csv' );
		flash.setFileName( info.filename );
		_setText( flash, output );
	},

	escapeChar: '"'
} );

// Excel save file - this is really a CSV file using UTF-8 that Excel can read
DataTable.ext.buttons.excelFlash = $.extend( {}, flashButton, {
	className: 'buttons-excel buttons-flash',

	text: function ( dt ) {
		return dt.i18n( 'buttons.excel', 'Excel' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		var flash = config._flash;
		var rowPos = 0;
		var rels = $.parseXML( excelStrings['xl/worksheets/sheet1.xml'] ) ; //Parses xml
		var relsGet = rels.getElementsByTagName( "sheetData" )[0];

		var xlsx = {
			_rels: {
				".rels": $.parseXML( excelStrings['_rels/.rels'] )
			},
			xl: {
				_rels: {
					"workbook.xml.rels": $.parseXML( excelStrings['xl/_rels/workbook.xml.rels'] )
				},
				"workbook.xml": $.parseXML( excelStrings['xl/workbook.xml'] ),
				"styles.xml": $.parseXML( excelStrings['xl/styles.xml'] ),
				"worksheets": {
					"sheet1.xml": rels
				}

			},
			"[Content_Types].xml": $.parseXML( excelStrings['[Content_Types].xml'])
		};

		var data = dt.buttons.exportData( config.exportOptions );
		var currentRow, rowNode;
		var addRow = function ( row ) {
			currentRow = rowPos+1;
			rowNode = _createNode( rels, "row", { attr: {r:currentRow} } );

			for ( var i=0, ien=row.length ; i<ien ; i++ ) {
				// Concat both the Cell Columns as a letter and the Row of the cell.
				var cellId = createCellPos(i) + '' + currentRow;
				var cell = null;

				// For null, undefined of blank cell, continue so it doesn't create the _createNode
				if ( row[i] === null || row[i] === undefined || row[i] === '' ) {
					if ( config.createEmptyCells === true ) {
						row[i] = '';
					}
					else {
						continue;
					}
				}

				row[i] = $.trim( row[i] );

				// Special number formatting options
				for ( var j=0, jen=_excelSpecials.length ; j<jen ; j++ ) {
					var special = _excelSpecials[j];

					// TODO Need to provide the ability for the specials to say
					// if they are returning a string, since at the moment it is
					// assumed to be a number
					if ( row[i].match && ! row[i].match(/^0\d+/) && row[i].match( special.match ) ) {
						var val = row[i].replace(/[^\d\.\-]/g, '');

						if ( special.fmt ) {
							val = special.fmt( val );
						}

						cell = _createNode( rels, 'c', {
							attr: {
								r: cellId,
								s: special.style
							},
							children: [
								_createNode( rels, 'v', { text: val } )
							]
						} );

						break;
					}
				}

				if ( ! cell ) {
					if ( typeof row[i] === 'number' || (
						row[i].match &&
						row[i].match(/^-?\d+(\.\d+)?$/) &&
						! row[i].match(/^0\d+/) )
					) {
						// Detect numbers - don't match numbers with leading zeros
						// or a negative anywhere but the start
						cell = _createNode( rels, 'c', {
							attr: {
								t: 'n',
								r: cellId
							},
							children: [
								_createNode( rels, 'v', { text: row[i] } )
							]
						} );
					}
					else {
						// String output - replace non standard characters for text output
						var text = ! row[i].replace ?
							row[i] :
							row[i].replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

						cell = _createNode( rels, 'c', {
							attr: {
								t: 'inlineStr',
								r: cellId
							},
							children:{
								row: _createNode( rels, 'is', {
									children: {
										row: _createNode( rels, 't', {
											text: text
										} )
									}
								} )
							}
						} );
					}
				}

				rowNode.appendChild( cell );
			}

			relsGet.appendChild(rowNode);
			rowPos++;
		};

		$( 'sheets sheet', xlsx.xl['workbook.xml'] ).attr( 'name', _sheetname( config ) );

		if ( config.customizeData ) {
			config.customizeData( data );
		}

		var mergeCells = function ( row, colspan ) {
			var mergeCells = $('mergeCells', rels);

			mergeCells[0].appendChild( _createNode( rels, 'mergeCell', {
				attr: {
					ref: 'A'+row+':'+createCellPos(colspan)+row
				}
			} ) );
			mergeCells.attr( 'count', mergeCells.attr( 'count' )+1 );
			$('row:eq('+(row-1)+') c', rels).attr( 's', '51' ); // centre
		};

		// Title and top messages
		var exportInfo = dt.buttons.exportInfo( config );
		if ( exportInfo.title ) {
			addRow( [exportInfo.title], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}

		if ( exportInfo.messageTop ) {
			addRow( [exportInfo.messageTop], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}

		// Table itself
		if ( config.header ) {
			addRow( data.header, rowPos );
			$('row:last c', rels).attr( 's', '2' ); // bold
		}

		for ( var n=0, ie=data.body.length ; n<ie ; n++ ) {
			addRow( data.body[n], rowPos );
		}

		if ( config.footer && data.footer ) {
			addRow( data.footer, rowPos);
			$('row:last c', rels).attr( 's', '2' ); // bold
		}

		// Below the table
		if ( exportInfo.messageBottom ) {
			addRow( [exportInfo.messageBottom], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}

		// Set column widths
		var cols = _createNode( rels, 'cols' );
		$('worksheet', rels).prepend( cols );

		for ( var i=0, ien=data.header.length ; i<ien ; i++ ) {
			cols.appendChild( _createNode( rels, 'col', {
				attr: {
					min: i+1,
					max: i+1,
					width: _excelColWidth( data, i ),
					customWidth: 1
				}
			} ) );
		}

		// Let the developer customise the document if they want to
		if ( config.customize ) {
			config.customize( xlsx, config, dt );
		}

		_xlsxToStrings( xlsx );

		flash.setAction( 'excel' );
		flash.setFileName( exportInfo.filename );
		flash.setSheetData( xlsx );
		_setText( flash, '' );

		this.processing( false );
	},

	extension: '.xlsx',
	
	createEmptyCells: false
} );



// PDF export
DataTable.ext.buttons.pdfFlash = $.extend( {}, flashButton, {
	className: 'buttons-pdf buttons-flash',

	text: function ( dt ) {
		return dt.i18n( 'buttons.pdf', 'PDF' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		// Set the text
		var flash = config._flash;
		var data = dt.buttons.exportData( config.exportOptions );
		var info = dt.buttons.exportInfo( config );
		var totalWidth = dt.table().node().offsetWidth;

		// Calculate the column width ratios for layout of the table in the PDF
		var ratios = dt.columns( config.columns ).indexes().map( function ( idx ) {
			return dt.column( idx ).header().offsetWidth / totalWidth;
		} );

		flash.setAction( 'pdf' );
		flash.setFileName( info.filename );

		_setText( flash, JSON.stringify( {
			title:         info.title || '',
			messageTop:    info.messageTop || '',
			messageBottom: info.messageBottom || '',
			colWidth:      ratios.toArray(),
			orientation:   config.orientation,
			size:          config.pageSize,
			header:        config.header ? data.header : null,
			footer:        config.footer ? data.footer : null,
			body:          data.body
		} ) );

		this.processing( false );
	},

	extension: '.pdf',

	orientation: 'portrait',

	pageSize: 'A4',

	newline: '\n'
} );


return DataTable.Buttons;
}));

/*!
 * HTML5 export buttons for Buttons and DataTables.
 * 2016 SpryMedia Ltd - datatables.net/license
 *
 * FileSaver.js (1.3.3) - MIT license
 * Copyright © 2016 Eli Grey - http://eligrey.com
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $, jszip, pdfmake) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document, jszip, pdfmake );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, jszip, pdfmake, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;

// Allow the constructor to pass in JSZip and PDFMake from external requires.
// Otherwise, use globally defined variables, if they are available.
function _jsZip () {
	return jszip || window.JSZip;
}
function _pdfMake () {
	return pdfmake || window.pdfMake;
}

DataTable.Buttons.pdfMake = function (_) {
	if ( ! _ ) {
		return _pdfMake();
	}
	pdfmake = m_ake;
}

DataTable.Buttons.jszip = function (_) {
	if ( ! _ ) {
		return _jsZip();
	}
	jszip = _;
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * FileSaver.js dependency
 */

/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

var _saveAs = (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));


// Expose file saver on the DataTables API. Can't attach to `DataTables.Buttons`
// since this file can be loaded before Button's core!
DataTable.fileSave = _saveAs;


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Local (private) functions
 */

/**
 * Get the sheet name for Excel exports.
 *
 * @param {object}	config Button configuration
 */
var _sheetname = function ( config )
{
	var sheetName = 'Sheet1';

	if ( config.sheetName ) {
		sheetName = config.sheetName.replace(/[\[\]\*\/\\\?\:]/g, '');
	}

	return sheetName;
};

/**
 * Get the newline character(s)
 *
 * @param {object}	config Button configuration
 * @return {string}				Newline character
 */
var _newLine = function ( config )
{
	return config.newline ?
		config.newline :
		navigator.userAgent.match(/Windows/) ?
			'\r\n' :
			'\n';
};

/**
 * Combine the data from the `buttons.exportData` method into a string that
 * will be used in the export file.
 *
 * @param	{DataTable.Api} dt		 DataTables API instance
 * @param	{object}				config Button configuration
 * @return {object}							 The data to export
 */
var _exportData = function ( dt, config )
{
	var newLine = _newLine( config );
	var data = dt.buttons.exportData( config.exportOptions );
	var boundary = config.fieldBoundary;
	var separator = config.fieldSeparator;
	var reBoundary = new RegExp( boundary, 'g' );
	var escapeChar = config.escapeChar !== undefined ?
		config.escapeChar :
		'\\';
	var join = function ( a ) {
		var s = '';

		// If there is a field boundary, then we might need to escape it in
		// the source data
		for ( var i=0, ien=a.length ; i<ien ; i++ ) {
			if ( i > 0 ) {
				s += separator;
			}

			s += boundary ?
				boundary + ('' + a[i]).replace( reBoundary, escapeChar+boundary ) + boundary :
				a[i];
		}

		return s;
	};

	var header = config.header ? join( data.header )+newLine : '';
	var footer = config.footer && data.footer ? newLine+join( data.footer ) : '';
	var body = [];

	for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
		body.push( join( data.body[i] ) );
	}

	return {
		str: header + body.join( newLine ) + footer,
		rows: body.length
	};
};

/**
 * Older versions of Safari (prior to tech preview 18) don't support the
 * download option required.
 *
 * @return {Boolean} `true` if old Safari
 */
var _isDuffSafari = function ()
{
	var safari = navigator.userAgent.indexOf('Safari') !== -1 &&
		navigator.userAgent.indexOf('Chrome') === -1 &&
		navigator.userAgent.indexOf('Opera') === -1;

	if ( ! safari ) {
		return false;
	}

	var version = navigator.userAgent.match( /AppleWebKit\/(\d+\.\d+)/ );
	if ( version && version.length > 1 && version[1]*1 < 603.1 ) {
		return true;
	}

	return false;
};

/**
 * Convert from numeric position to letter for column names in Excel
 * @param  {int} n Column number
 * @return {string} Column letter(s) name
 */
function createCellPos( n ){
	var ordA = 'A'.charCodeAt(0);
	var ordZ = 'Z'.charCodeAt(0);
	var len = ordZ - ordA + 1;
	var s = "";

	while( n >= 0 ) {
		s = String.fromCharCode(n % len + ordA) + s;
		n = Math.floor(n / len) - 1;
	}

	return s;
}

try {
	var _serialiser = new XMLSerializer();
	var _ieExcel;
}
catch (t) {}

/**
 * Recursively add XML files from an object's structure to a ZIP file. This
 * allows the XSLX file to be easily defined with an object's structure matching
 * the files structure.
 *
 * @param {JSZip} zip ZIP package
 * @param {object} obj Object to add (recursive)
 */
function _addToZip( zip, obj ) {
	if ( _ieExcel === undefined ) {
		// Detect if we are dealing with IE's _awful_ serialiser by seeing if it
		// drop attributes
		_ieExcel = _serialiser
			.serializeToString(
				$.parseXML( excelStrings['xl/worksheets/sheet1.xml'] )
			)
			.indexOf( 'xmlns:r' ) === -1;
	}

	$.each( obj, function ( name, val ) {
		if ( $.isPlainObject( val ) ) {
			var newDir = zip.folder( name );
			_addToZip( newDir, val );
		}
		else {
			if ( _ieExcel ) {
				// IE's XML serialiser will drop some name space attributes from
				// from the root node, so we need to save them. Do this by
				// replacing the namespace nodes with a regular attribute that
				// we convert back when serialised. Edge does not have this
				// issue
				var worksheet = val.childNodes[0];
				var i, ien;
				var attrs = [];

				for ( i=worksheet.attributes.length-1 ; i>=0 ; i-- ) {
					var attrName = worksheet.attributes[i].nodeName;
					var attrValue = worksheet.attributes[i].nodeValue;

					if ( attrName.indexOf( ':' ) !== -1 ) {
						attrs.push( { name: attrName, value: attrValue } );

						worksheet.removeAttribute( attrName );
					}
				}

				for ( i=0, ien=attrs.length ; i<ien ; i++ ) {
					var attr = val.createAttribute( attrs[i].name.replace( ':', '_dt_b_namespace_token_' ) );
					attr.value = attrs[i].value;
					worksheet.setAttributeNode( attr );
				}
			}

			var str = _serialiser.serializeToString(val);

			// Fix IE's XML
			if ( _ieExcel ) {
				// IE doesn't include the XML declaration
				if ( str.indexOf( '<?xml' ) === -1 ) {
					str = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+str;
				}

				// Return namespace attributes to being as such
				str = str.replace( /_dt_b_namespace_token_/g, ':' );

				// Remove testing name space that IE puts into the space preserve attr
				str = str.replace( /xmlns:NS[\d]+="" NS[\d]+:/g, '' );
			}

			// Safari, IE and Edge will put empty name space attributes onto
			// various elements making them useless. This strips them out
			str = str.replace( /<([^<>]*?) xmlns=""([^<>]*?)>/g, '<$1 $2>' );

			zip.file( name, str );
		}
	} );
}

/**
 * Create an XML node and add any children, attributes, etc without needing to
 * be verbose in the DOM.
 *
 * @param  {object} doc      XML document
 * @param  {string} nodeName Node name
 * @param  {object} opts     Options - can be `attr` (attributes), `children`
 *   (child nodes) and `text` (text content)
 * @return {node}            Created node
 */
function _createNode( doc, nodeName, opts ) {
	var tempNode = doc.createElement( nodeName );

	if ( opts ) {
		if ( opts.attr ) {
			$(tempNode).attr( opts.attr );
		}

		if ( opts.children ) {
			$.each( opts.children, function ( key, value ) {
				tempNode.appendChild( value );
			} );
		}

		if ( opts.text !== null && opts.text !== undefined ) {
			tempNode.appendChild( doc.createTextNode( opts.text ) );
		}
	}

	return tempNode;
}

/**
 * Get the width for an Excel column based on the contents of that column
 * @param  {object} data Data for export
 * @param  {int}    col  Column index
 * @return {int}         Column width
 */
function _excelColWidth( data, col ) {
	var max = data.header[col].length;
	var len, lineSplit, str;

	if ( data.footer && data.footer[col].length > max ) {
		max = data.footer[col].length;
	}

	for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
		var point = data.body[i][col];
		str = point !== null && point !== undefined ?
			point.toString() :
			'';

		// If there is a newline character, workout the width of the column
		// based on the longest line in the string
		if ( str.indexOf('\n') !== -1 ) {
			lineSplit = str.split('\n');
			lineSplit.sort( function (a, b) {
				return b.length - a.length;
			} );

			len = lineSplit[0].length;
		}
		else {
			len = str.length;
		}

		if ( len > max ) {
			max = len;
		}

		// Max width rather than having potentially massive column widths
		if ( max > 40 ) {
			return 54; // 40 * 1.35
		}
	}

	max *= 1.35;

	// And a min width
	return max > 6 ? max : 6;
}

// Excel - Pre-defined strings to build a basic XLSX file
var excelStrings = {
	"_rels/.rels":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
		'</Relationships>',

	"xl/_rels/workbook.xml.rels":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
			'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
			'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
		'</Relationships>',

	"[Content_Types].xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
			'<Default Extension="xml" ContentType="application/xml" />'+
			'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />'+
			'<Default Extension="jpeg" ContentType="image/jpeg" />'+
			'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />'+
			'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />'+
			'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" />'+
		'</Types>',

	"xl/workbook.xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
			'<fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/>'+
			'<workbookPr showInkAnnotation="0" autoCompressPictures="0"/>'+
			'<bookViews>'+
				'<workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/>'+
			'</bookViews>'+
			'<sheets>'+
				'<sheet name="Sheet1" sheetId="1" r:id="rId1"/>'+
			'</sheets>'+
			'<definedNames/>'+
		'</workbook>',

	"xl/worksheets/sheet1.xml":
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
		'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">'+
			'<sheetData/>'+
			'<mergeCells count="0"/>'+
		'</worksheet>',

	"xl/styles.xml":
		'<?xml version="1.0" encoding="UTF-8"?>'+
		'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">'+
			'<numFmts count="6">'+
				'<numFmt numFmtId="164" formatCode="#,##0.00_-\ [$$-45C]"/>'+
				'<numFmt numFmtId="165" formatCode="&quot;£&quot;#,##0.00"/>'+
				'<numFmt numFmtId="166" formatCode="[$€-2]\ #,##0.00"/>'+
				'<numFmt numFmtId="167" formatCode="0.0%"/>'+
				'<numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/>'+
				'<numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/>'+
			'</numFmts>'+
			'<fonts count="5" x14ac:knownFonts="1">'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<color rgb="FFFFFFFF" />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<b />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<i />'+
				'</font>'+
				'<font>'+
					'<sz val="11" />'+
					'<name val="Calibri" />'+
					'<u />'+
				'</font>'+
			'</fonts>'+
			'<fills count="6">'+
				'<fill>'+
					'<patternFill patternType="none" />'+
				'</fill>'+
				'<fill>'+ // Excel appears to use this as a dotted background regardless of values but
					'<patternFill patternType="none" />'+ // to be valid to the schema, use a patternFill
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="FFD9D9D9" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="FFD99795" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="ffc6efce" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
				'<fill>'+
					'<patternFill patternType="solid">'+
						'<fgColor rgb="ffc6cfef" />'+
						'<bgColor indexed="64" />'+
					'</patternFill>'+
				'</fill>'+
			'</fills>'+
			'<borders count="2">'+
				'<border>'+
					'<left />'+
					'<right />'+
					'<top />'+
					'<bottom />'+
					'<diagonal />'+
				'</border>'+
				'<border diagonalUp="false" diagonalDown="false">'+
					'<left style="thin">'+
						'<color auto="1" />'+
					'</left>'+
					'<right style="thin">'+
						'<color auto="1" />'+
					'</right>'+
					'<top style="thin">'+
						'<color auto="1" />'+
					'</top>'+
					'<bottom style="thin">'+
						'<color auto="1" />'+
					'</bottom>'+
					'<diagonal />'+
				'</border>'+
			'</borders>'+
			'<cellStyleXfs count="1">'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" />'+
			'</cellStyleXfs>'+
			'<cellXfs count="67">'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="left"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="center"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="right"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment horizontal="fill"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment textRotation="90"/>'+
				'</xf>'+
				'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">'+
					'<alignment wrapText="1"/>'+
				'</xf>'+
				'<xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
				'<xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>'+
			'</cellXfs>'+
			'<cellStyles count="1">'+
				'<cellStyle name="Normal" xfId="0" builtinId="0" />'+
			'</cellStyles>'+
			'<dxfs count="0" />'+
			'<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" />'+
		'</styleSheet>'
};
// Note we could use 3 `for` loops for the styles, but when gzipped there is
// virtually no difference in size, since the above can be easily compressed

// Pattern matching for special number formats. Perhaps this should be exposed
// via an API in future?
// Ref: section 3.8.30 - built in formatters in open spreadsheet
//   https://www.ecma-international.org/news/TC45_current_work/Office%20Open%20XML%20Part%204%20-%20Markup%20Language%20Reference.pdf
var _excelSpecials = [
	{ match: /^\-?\d+\.\d%$/,       style: 60, fmt: function (d) { return d/100; } }, // Precent with d.p.
	{ match: /^\-?\d+\.?\d*%$/,     style: 56, fmt: function (d) { return d/100; } }, // Percent
	{ match: /^\-?\$[\d,]+.?\d*$/,  style: 57 }, // Dollars
	{ match: /^\-?£[\d,]+.?\d*$/,   style: 58 }, // Pounds
	{ match: /^\-?€[\d,]+.?\d*$/,   style: 59 }, // Euros
	{ match: /^\-?\d+$/,            style: 65 }, // Numbers without thousand separators
	{ match: /^\-?\d+\.\d{2}$/,     style: 66 }, // Numbers 2 d.p. without thousands separators
	{ match: /^\([\d,]+\)$/,        style: 61, fmt: function (d) { return -1 * d.replace(/[\(\)]/g, ''); } },  // Negative numbers indicated by brackets
	{ match: /^\([\d,]+\.\d{2}\)$/, style: 62, fmt: function (d) { return -1 * d.replace(/[\(\)]/g, ''); } },  // Negative numbers indicated by brackets - 2d.p.
	{ match: /^\-?[\d,]+$/,         style: 63 }, // Numbers with thousand separators
	{ match: /^\-?[\d,]+\.\d{2}$/,  style: 64 }  // Numbers with 2 d.p. and thousands separators
];



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Buttons
 */

//
// Copy to clipboard
//
DataTable.ext.buttons.copyHtml5 = {
	className: 'buttons-copy buttons-html5',

	text: function ( dt ) {
		return dt.i18n( 'buttons.copy', 'Copy' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		var that = this;
		var exportData = _exportData( dt, config );
		var info = dt.buttons.exportInfo( config );
		var newline = _newLine(config);
		var output = exportData.str;
		var hiddenDiv = $('<div/>')
			.css( {
				height: 1,
				width: 1,
				overflow: 'hidden',
				position: 'fixed',
				top: 0,
				left: 0
			} );

		if ( info.title ) {
			output = info.title + newline + newline + output;
		}

		if ( info.messageTop ) {
			output = info.messageTop + newline + newline + output;
		}

		if ( info.messageBottom ) {
			output = output + newline + newline + info.messageBottom;
		}

		if ( config.customize ) {
			output = config.customize( output, config, dt );
		}

		var textarea = $('<textarea readonly/>')
			.val( output )
			.appendTo( hiddenDiv );

		// For browsers that support the copy execCommand, try to use it
		if ( document.queryCommandSupported('copy') ) {
			hiddenDiv.appendTo( dt.table().container() );
			textarea[0].focus();
			textarea[0].select();

			try {
				var successful = document.execCommand( 'copy' );
				hiddenDiv.remove();

				if (successful) {
					dt.buttons.info(
						dt.i18n( 'buttons.copyTitle', 'Copy to clipboard' ),
						dt.i18n( 'buttons.copySuccess', {
							1: 'Copied one row to clipboard',
							_: 'Copied %d rows to clipboard'
						}, exportData.rows ),
						2000
					);

					this.processing( false );
					return;
				}
			}
			catch (t) {}
		}

		// Otherwise we show the text box and instruct the user to use it
		var message = $('<span>'+dt.i18n( 'buttons.copyKeys',
				'Press <i>ctrl</i> or <i>\u2318</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>'+
				'To cancel, click this message or press escape.' )+'</span>'
			)
			.append( hiddenDiv );

		dt.buttons.info( dt.i18n( 'buttons.copyTitle', 'Copy to clipboard' ), message, 0 );

		// Select the text so when the user activates their system clipboard
		// it will copy that text
		textarea[0].focus();
		textarea[0].select();

		// Event to hide the message when the user is done
		var container = $(message).closest('.dt-button-info');
		var close = function () {
			container.off( 'click.buttons-copy' );
			$(document).off( '.buttons-copy' );
			dt.buttons.info( false );
		};

		container.on( 'click.buttons-copy', close );
		$(document)
			.on( 'keydown.buttons-copy', function (e) {
				if ( e.keyCode === 27 ) { // esc
					close();
					that.processing( false );
				}
			} )
			.on( 'copy.buttons-copy cut.buttons-copy', function () {
				close();
				that.processing( false );
			} );
	},

	exportOptions: {},

	fieldSeparator: '\t',

	fieldBoundary: '',

	header: true,

	footer: false,

	title: '*',

	messageTop: '*',

	messageBottom: '*'
};

//
// CSV export
//
DataTable.ext.buttons.csvHtml5 = {
	bom: false,

	className: 'buttons-csv buttons-html5',

	available: function () {
		return window.FileReader !== undefined && window.Blob;
	},

	text: function ( dt ) {
		return dt.i18n( 'buttons.csv', 'CSV' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		// Set the text
		var output = _exportData( dt, config ).str;
		var info = dt.buttons.exportInfo(config);
		var charset = config.charset;

		if ( config.customize ) {
			output = config.customize( output, config, dt );
		}

		if ( charset !== false ) {
			if ( ! charset ) {
				charset = document.characterSet || document.charset;
			}

			if ( charset ) {
				charset = ';charset='+charset;
			}
		}
		else {
			charset = '';
		}

		if ( config.bom ) {
			output = '\ufeff' + output;
		}

		_saveAs(
			new Blob( [output], {type: 'text/csv'+charset} ),
			info.filename,
			true
		);

		this.processing( false );
	},

	filename: '*',

	extension: '.csv',

	exportOptions: {},

	fieldSeparator: ',',

	fieldBoundary: '"',

	escapeChar: '"',

	charset: null,

	header: true,

	footer: false
};

//
// Excel (xlsx) export
//
DataTable.ext.buttons.excelHtml5 = {
	className: 'buttons-excel buttons-html5',

	available: function () {
		return window.FileReader !== undefined && _jsZip() !== undefined && ! _isDuffSafari() && _serialiser;
	},

	text: function ( dt ) {
		return dt.i18n( 'buttons.excel', 'Excel' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		var that = this;
		var rowPos = 0;
		var dataStartRow, dataEndRow;
		var getXml = function ( type ) {
			var str = excelStrings[ type ];

			//str = str.replace( /xmlns:/g, 'xmlns_' ).replace( /mc:/g, 'mc_' );

			return $.parseXML( str );
		};
		var rels = getXml('xl/worksheets/sheet1.xml');
		var relsGet = rels.getElementsByTagName( "sheetData" )[0];

		var xlsx = {
			_rels: {
				".rels": getXml('_rels/.rels')
			},
			xl: {
				_rels: {
					"workbook.xml.rels": getXml('xl/_rels/workbook.xml.rels')
				},
				"workbook.xml": getXml('xl/workbook.xml'),
				"styles.xml": getXml('xl/styles.xml'),
				"worksheets": {
					"sheet1.xml": rels
				}

			},
			"[Content_Types].xml": getXml('[Content_Types].xml')
		};

		var data = dt.buttons.exportData( config.exportOptions );
		var currentRow, rowNode;
		var addRow = function ( row ) {
			currentRow = rowPos+1;
			rowNode = _createNode( rels, "row", { attr: {r:currentRow} } );

			for ( var i=0, ien=row.length ; i<ien ; i++ ) {
				// Concat both the Cell Columns as a letter and the Row of the cell.
				var cellId = createCellPos(i) + '' + currentRow;
				var cell = null;

				// For null, undefined of blank cell, continue so it doesn't create the _createNode
				if ( row[i] === null || row[i] === undefined || row[i] === '' ) {
					if ( config.createEmptyCells === true ) {
						row[i] = '';
					}
					else {
						continue;
					}
				}

				var originalContent = row[i];
				row[i] = $.trim( row[i] );

				// Special number formatting options
				for ( var j=0, jen=_excelSpecials.length ; j<jen ; j++ ) {
					var special = _excelSpecials[j];

					// TODO Need to provide the ability for the specials to say
					// if they are returning a string, since at the moment it is
					// assumed to be a number
					if ( row[i].match && ! row[i].match(/^0\d+/) && row[i].match( special.match ) ) {
						var val = row[i].replace(/[^\d\.\-]/g, '');

						if ( special.fmt ) {
							val = special.fmt( val );
						}

						cell = _createNode( rels, 'c', {
							attr: {
								r: cellId,
								s: special.style
							},
							children: [
								_createNode( rels, 'v', { text: val } )
							]
						} );

						break;
					}
				}

				if ( ! cell ) {
					if ( typeof row[i] === 'number' || (
						row[i].match &&
						row[i].match(/^-?\d+(\.\d+)?$/) &&
						! row[i].match(/^0\d+/) )
					) {
						// Detect numbers - don't match numbers with leading zeros
						// or a negative anywhere but the start
						cell = _createNode( rels, 'c', {
							attr: {
								t: 'n',
								r: cellId
							},
							children: [
								_createNode( rels, 'v', { text: row[i] } )
							]
						} );
					}
					else {
						// String output - replace non standard characters for text output
						var text = ! originalContent.replace ?
							originalContent :
							originalContent.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

						cell = _createNode( rels, 'c', {
							attr: {
								t: 'inlineStr',
								r: cellId
							},
							children:{
								row: _createNode( rels, 'is', {
									children: {
										row: _createNode( rels, 't', {
											text: text,
											attr: {
												'xml:space': 'preserve'
											}
										} )
									}
								} )
							}
						} );
					}
				}

				rowNode.appendChild( cell );
			}

			relsGet.appendChild(rowNode);
			rowPos++;
		};

		if ( config.customizeData ) {
			config.customizeData( data );
		}

		var mergeCells = function ( row, colspan ) {
			var mergeCells = $('mergeCells', rels);

			mergeCells[0].appendChild( _createNode( rels, 'mergeCell', {
				attr: {
					ref: 'A'+row+':'+createCellPos(colspan)+row
				}
			} ) );
			mergeCells.attr( 'count', parseFloat(mergeCells.attr( 'count' ))+1 );
			$('row:eq('+(row-1)+') c', rels).attr( 's', '51' ); // centre
		};

		// Title and top messages
		var exportInfo = dt.buttons.exportInfo( config );
		if ( exportInfo.title ) {
			addRow( [exportInfo.title], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}

		if ( exportInfo.messageTop ) {
			addRow( [exportInfo.messageTop], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}


		// Table itself
		if ( config.header ) {
			addRow( data.header, rowPos );
			$('row:last c', rels).attr( 's', '2' ); // bold
		}
	
		dataStartRow = rowPos;

		for ( var n=0, ie=data.body.length ; n<ie ; n++ ) {
			addRow( data.body[n], rowPos );
		}
	
		dataEndRow = rowPos;

		if ( config.footer && data.footer ) {
			addRow( data.footer, rowPos);
			$('row:last c', rels).attr( 's', '2' ); // bold
		}

		// Below the table
		if ( exportInfo.messageBottom ) {
			addRow( [exportInfo.messageBottom], rowPos );
			mergeCells( rowPos, data.header.length-1 );
		}

		// Set column widths
		var cols = _createNode( rels, 'cols' );
		$('worksheet', rels).prepend( cols );

		for ( var i=0, ien=data.header.length ; i<ien ; i++ ) {
			cols.appendChild( _createNode( rels, 'col', {
				attr: {
					min: i+1,
					max: i+1,
					width: _excelColWidth( data, i ),
					customWidth: 1
				}
			} ) );
		}

		// Workbook modifications
		var workbook = xlsx.xl['workbook.xml'];

		$( 'sheets sheet', workbook ).attr( 'name', _sheetname( config ) );

		// Auto filter for columns
		if ( config.autoFilter ) {
			$('mergeCells', rels).before( _createNode( rels, 'autoFilter', {
				attr: {
					ref: 'A'+dataStartRow+':'+createCellPos(data.header.length-1)+dataEndRow
				}
			} ) );

			$('definedNames', workbook).append( _createNode( workbook, 'definedName', {
				attr: {
					name: '_xlnm._FilterDatabase',
					localSheetId: '0',
					hidden: 1
				},
				text: _sheetname(config)+'!$A$'+dataStartRow+':'+createCellPos(data.header.length-1)+dataEndRow
			} ) );
		}

		// Let the developer customise the document if they want to
		if ( config.customize ) {
			config.customize( xlsx, config, dt );
		}

		// Excel doesn't like an empty mergeCells tag
		if ( $('mergeCells', rels).children().length === 0 ) {
			$('mergeCells', rels).remove();
		}

		var jszip = _jsZip();
		var zip = new jszip();
		var zipConfig = {
			type: 'blob',
			mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		};

		_addToZip( zip, xlsx );

		if ( zip.generateAsync ) {
			// JSZip 3+
			zip
				.generateAsync( zipConfig )
				.then( function ( blob ) {
					_saveAs( blob, exportInfo.filename );
					that.processing( false );
				} );
		}
		else {
			// JSZip 2.5
			_saveAs(
				zip.generate( zipConfig ),
				exportInfo.filename
			);
			this.processing( false );
		}
	},

	filename: '*',

	extension: '.xlsx',

	exportOptions: {},

	header: true,

	footer: false,

	title: '*',

	messageTop: '*',

	messageBottom: '*',

	createEmptyCells: false,

	autoFilter: false,

	sheetName: ''
};

//
// PDF export - using pdfMake - http://pdfmake.org
//
DataTable.ext.buttons.pdfHtml5 = {
	className: 'buttons-pdf buttons-html5',

	available: function () {
		return window.FileReader !== undefined && _pdfMake();
	},

	text: function ( dt ) {
		return dt.i18n( 'buttons.pdf', 'PDF' );
	},

	action: function ( e, dt, button, config ) {
		this.processing( true );

		var that = this;
		var data = dt.buttons.exportData( config.exportOptions );
		var info = dt.buttons.exportInfo( config );
		var rows = [];

		if ( config.header ) {
			rows.push( $.map( data.header, function ( d ) {
				return {
					text: typeof d === 'string' ? d : d+'',
					style: 'tableHeader'
				};
			} ) );
		}

		for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
			rows.push( $.map( data.body[i], function ( d ) {
				if ( d === null || d === undefined ) {
					d = '';
				}
				return {
					text: typeof d === 'string' ? d : d+'',
					style: i % 2 ? 'tableBodyEven' : 'tableBodyOdd'
				};
			} ) );
		}

		if ( config.footer && data.footer) {
			rows.push( $.map( data.footer, function ( d ) {
				return {
					text: typeof d === 'string' ? d : d+'',
					style: 'tableFooter'
				};
			} ) );
		}

		var doc = {
			pageSize: config.pageSize,
			pageOrientation: config.orientation,
			content: [
				{
					table: {
						headerRows: 1,
						body: rows
					},
					layout: 'noBorders'
				}
			],
			styles: {
				tableHeader: {
					bold: true,
					fontSize: 11,
					color: 'white',
					fillColor: '#2d4154',
					alignment: 'center'
				},
				tableBodyEven: {},
				tableBodyOdd: {
					fillColor: '#f3f3f3'
				},
				tableFooter: {
					bold: true,
					fontSize: 11,
					color: 'white',
					fillColor: '#2d4154'
				},
				title: {
					alignment: 'center',
					fontSize: 15
				},
				message: {}
			},
			defaultStyle: {
				fontSize: 10
			}
		};

		if ( info.messageTop ) {
			doc.content.unshift( {
				text: info.messageTop,
				style: 'message',
				margin: [ 0, 0, 0, 12 ]
			} );
		}

		if ( info.messageBottom ) {
			doc.content.push( {
				text: info.messageBottom,
				style: 'message',
				margin: [ 0, 0, 0, 12 ]
			} );
		}

		if ( info.title ) {
			doc.content.unshift( {
				text: info.title,
				style: 'title',
				margin: [ 0, 0, 0, 12 ]
			} );
		}

		if ( config.customize ) {
			config.customize( doc, config, dt );
		}

		var pdf = _pdfMake().createPdf( doc );

		if ( config.download === 'open' && ! _isDuffSafari() ) {
			pdf.open();
		}
		else {
			pdf.download( info.filename );
		}

		this.processing( false );
	},

	title: '*',

	filename: '*',

	extension: '.pdf',

	exportOptions: {},

	orientation: 'portrait',

	pageSize: 'A4',

	header: true,

	footer: false,

	messageTop: '*',

	messageBottom: '*',

	customize: null,

	download: 'download'
};


return DataTable.Buttons;
}));

/*!
 * Print button for Buttons and DataTables.
 * 2016 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var _link = document.createElement( 'a' );

/**
 * Clone link and style tags, taking into account the need to change the source
 * path.
 *
 * @param  {node}     el Element to convert
 */
var _styleToAbs = function( el ) {
	var url;
	var clone = $(el).clone()[0];
	var linkHost;

	if ( clone.nodeName.toLowerCase() === 'link' ) {
		clone.href = _relToAbs( clone.href );
	}

	return clone.outerHTML;
};

/**
 * Convert a URL from a relative to an absolute address so it will work
 * correctly in the popup window which has no base URL.
 *
 * @param  {string} href URL
 */
var _relToAbs = function( href ) {
	// Assign to a link on the original page so the browser will do all the
	// hard work of figuring out where the file actually is
	_link.href = href;
	var linkHost = _link.host;

	// IE doesn't have a trailing slash on the host
	// Chrome has it on the pathname
	if ( linkHost.indexOf('/') === -1 && _link.pathname.indexOf('/') !== 0) {
		linkHost += '/';
	}

	return _link.protocol+"//"+linkHost+_link.pathname+_link.search;
};


DataTable.ext.buttons.print = {
	className: 'buttons-print',

	text: function ( dt ) {
		return dt.i18n( 'buttons.print', 'Print' );
	},

	action: function ( e, dt, button, config ) {
		var data = dt.buttons.exportData(
			$.extend( {decodeEntities: false}, config.exportOptions ) // XSS protection
		);
		var exportInfo = dt.buttons.exportInfo( config );
		var columnClasses = dt
			.columns( config.exportOptions.columns )
			.flatten()
			.map( function (idx) {
				return dt.settings()[0].aoColumns[dt.column(idx).index()].sClass;
			} )
			.toArray();

		var addRow = function ( d, tag ) {
			var str = '<tr>';

			for ( var i=0, ien=d.length ; i<ien ; i++ ) {
				// null and undefined aren't useful in the print output
				var dataOut = d[i] === null || d[i] === undefined ?
					'' :
					d[i];
				var classAttr = columnClasses[i] ?
					'class="'+columnClasses[i]+'"' :
					'';

				str += '<'+tag+' '+classAttr+'>'+dataOut+'</'+tag+'>';
			}

			return str + '</tr>';
		};

		// Construct a table for printing
		var html = '<table class="'+dt.table().node().className+'">';

		if ( config.header ) {
			html += '<thead>'+ addRow( data.header, 'th' ) +'</thead>';
		}

		html += '<tbody>';
		for ( var i=0, ien=data.body.length ; i<ien ; i++ ) {
			html += addRow( data.body[i], 'td' );
		}
		html += '</tbody>';

		if ( config.footer && data.footer ) {
			html += '<tfoot>'+ addRow( data.footer, 'th' ) +'</tfoot>';
		}
		html += '</table>';

		// Open a new window for the printable table
		var win = window.open( '', '' );
		win.document.close();

		// Inject the title and also a copy of the style and link tags from this
		// document so the table can retain its base styling. Note that we have
		// to use string manipulation as IE won't allow elements to be created
		// in the host document and then appended to the new window.
		var head = '<title>'+exportInfo.title+'</title>';
		$('style, link').each( function () {
			head += _styleToAbs( this );
		} );

		try {
			win.document.head.innerHTML = head; // Work around for Edge
		}
		catch (e) {
			$(win.document.head).html( head ); // Old IE
		}

		// Inject the table and other surrounding information
		win.document.body.innerHTML =
			'<h1>'+exportInfo.title+'</h1>'+
			'<div>'+(exportInfo.messageTop || '')+'</div>'+
			html+
			'<div>'+(exportInfo.messageBottom || '')+'</div>';

		$(win.document.body).addClass('dt-print-view');

		$('img', win.document.body).each( function ( i, img ) {
			img.setAttribute( 'src', _relToAbs( img.getAttribute('src') ) );
		} );

		if ( config.customize ) {
			config.customize( win, config, dt );
		}

		// Allow stylesheets time to load
		var autoPrint = function () {
			if ( config.autoPrint ) {
				win.print(); // blocking - so close will not
				win.close(); // execute until this is done
			}
		};

		if ( navigator.userAgent.match(/Trident\/\d.\d/) ) { // IE needs to call this without a setTimeout
			autoPrint();
		}
		else {
			win.setTimeout( autoPrint, 1000 );
		}
	},

	title: '*',

	messageTop: '*',

	messageBottom: '*',

	exportOptions: {},

	header: true,

	footer: false,

	autoPrint: true,

	customize: null
};


return DataTable.Buttons;
}));

/*!

JSZip v3.1.3 - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/

(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.JSZip = f() } })(function () {
    var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
        1: [function (require, module, exports) {
            'use strict';
            var utils = require('./utils');
            var support = require('./support');
            // private property
            var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


            // public method for encoding
            exports.encode = function (input) {
                var output = [];
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0, len = input.length, remainingBytes = len;

                var isArray = utils.getTypeOf(input) !== "string";
                while (i < input.length) {
                    remainingBytes = len - i;

                    if (!isArray) {
                        chr1 = input.charCodeAt(i++);
                        chr2 = i < len ? input.charCodeAt(i++) : 0;
                        chr3 = i < len ? input.charCodeAt(i++) : 0;
                    } else {
                        chr1 = input[i++];
                        chr2 = i < len ? input[i++] : 0;
                        chr3 = i < len ? input[i++] : 0;
                    }

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = remainingBytes > 1 ? (((chr2 & 15) << 2) | (chr3 >> 6)) : 64;
                    enc4 = remainingBytes > 2 ? (chr3 & 63) : 64;

                    output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));

                }

                return output.join("");
            };

            // public method for decoding
            exports.decode = function (input) {
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0, resultIndex = 0;

                var dataUrlPrefix = "data:";

                if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
                    // This is a common error: people give a data url
                    // (data:image/png;base64,iVBOR...) with a {base64: true} and
                    // wonders why things don't work.
                    // We can detect that the string input looks like a data url but we
                    // *can't* be sure it is one: removing everything up to the comma would
                    // be too dangerous.
                    throw new Error("Invalid base64 input, it looks like a data url.");
                }

                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                var totalLength = input.length * 3 / 4;
                if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
                    totalLength--;
                }
                if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
                    totalLength--;
                }
                if (totalLength % 1 !== 0) {
                    // totalLength is not an integer, the length does not match a valid
                    // base64 content. That can happen if:
                    // - the input is not a base64 content
                    // - the input is *almost* a base64 content, with a extra chars at the
                    //   beginning or at the end
                    // - the input uses a base64 variant (base64url for example)
                    throw new Error("Invalid base64 input, bad content length.");
                }
                var output;
                if (support.uint8array) {
                    output = new Uint8Array(totalLength | 0);
                } else {
                    output = new Array(totalLength | 0);
                }

                while (i < input.length) {

                    enc1 = _keyStr.indexOf(input.charAt(i++));
                    enc2 = _keyStr.indexOf(input.charAt(i++));
                    enc3 = _keyStr.indexOf(input.charAt(i++));
                    enc4 = _keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output[resultIndex++] = chr1;

                    if (enc3 !== 64) {
                        output[resultIndex++] = chr2;
                    }
                    if (enc4 !== 64) {
                        output[resultIndex++] = chr3;
                    }

                }

                return output;
            };

        }, { "./support": 30, "./utils": 32 }], 2: [function (require, module, exports) {
            'use strict';

            var external = require("./external");
            var DataWorker = require('./stream/DataWorker');
            var DataLengthProbe = require('./stream/DataLengthProbe');
            var Crc32Probe = require('./stream/Crc32Probe');
            var DataLengthProbe = require('./stream/DataLengthProbe');

            /**
             * Represent a compressed object, with everything needed to decompress it.
             * @constructor
             * @param {number} compressedSize the size of the data compressed.
             * @param {number} uncompressedSize the size of the data after decompression.
             * @param {number} crc32 the crc32 of the decompressed file.
             * @param {object} compression the type of compression, see lib/compressions.js.
             * @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
             */
            function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
                this.compressedSize = compressedSize;
                this.uncompressedSize = uncompressedSize;
                this.crc32 = crc32;
                this.compression = compression;
                this.compressedContent = data;
            }

            CompressedObject.prototype = {
                /**
                 * Create a worker to get the uncompressed content.
                 * @return {GenericWorker} the worker.
                 */
                getContentWorker: function () {
                    var worker = new DataWorker(external.Promise.resolve(this.compressedContent))
                        .pipe(this.compression.uncompressWorker())
                        .pipe(new DataLengthProbe("data_length"));

                    var that = this;
                    worker.on("end", function () {
                        if (this.streamInfo['data_length'] !== that.uncompressedSize) {
                            throw new Error("Bug : uncompressed data size mismatch");
                        }
                    });
                    return worker;
                },
                /**
                 * Create a worker to get the compressed content.
                 * @return {GenericWorker} the worker.
                 */
                getCompressedWorker: function () {
                    return new DataWorker(external.Promise.resolve(this.compressedContent))
                        .withStreamInfo("compressedSize", this.compressedSize)
                        .withStreamInfo("uncompressedSize", this.uncompressedSize)
                        .withStreamInfo("crc32", this.crc32)
                        .withStreamInfo("compression", this.compression)
                        ;
                }
            };

            /**
             * Chain the given worker with other workers to compress the content with the
             * given compresion.
             * @param {GenericWorker} uncompressedWorker the worker to pipe.
             * @param {Object} compression the compression object.
             * @param {Object} compressionOptions the options to use when compressing.
             * @return {GenericWorker} the new worker compressing the content.
             */
            CompressedObject.createWorkerFrom = function (uncompressedWorker, compression, compressionOptions) {
                return uncompressedWorker
                    .pipe(new Crc32Probe())
                    .pipe(new DataLengthProbe("uncompressedSize"))
                    .pipe(compression.compressWorker(compressionOptions))
                    .pipe(new DataLengthProbe("compressedSize"))
                    .withStreamInfo("compression", compression);
            };

            module.exports = CompressedObject;

        }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function (require, module, exports) {
            'use strict';

            var GenericWorker = require("./stream/GenericWorker");

            exports.STORE = {
                magic: "\x00\x00",
                compressWorker: function (compressionOptions) {
                    return new GenericWorker("STORE compression");
                },
                uncompressWorker: function () {
                    return new GenericWorker("STORE decompression");
                }
            };
            exports.DEFLATE = require('./flate');

        }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function (require, module, exports) {
            'use strict';

            var utils = require('./utils');

            /**
             * The following functions come from pako, from pako/lib/zlib/crc32.js
             * released under the MIT license, see pako https://github.com/nodeca/pako/
             */

            // Use ordinary array, since untyped makes no boost here
            function makeTable() {
                var c, table = [];

                for (var n = 0; n < 256; n++) {
                    c = n;
                    for (var k = 0; k < 8; k++) {
                        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                    }
                    table[n] = c;
                }

                return table;
            }

            // Create table on load. Just 255 signed longs. Not a problem.
            var crcTable = makeTable();


            function crc32(crc, buf, len, pos) {
                var t = crcTable, end = pos + len;

                crc = crc ^ (-1);

                for (var i = pos; i < end; i++) {
                    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
                }

                return (crc ^ (-1)); // >>> 0;
            }

            // That's all for the pako functions.

            /**
             * Compute the crc32 of a string.
             * This is almost the same as the function crc32, but for strings. Using the
             * same function for the two use cases leads to horrible performances.
             * @param {Number} crc the starting value of the crc.
             * @param {String} str the string to use.
             * @param {Number} len the length of the string.
             * @param {Number} pos the starting position for the crc32 computation.
             * @return {Number} the computed crc32.
             */
            function crc32str(crc, str, len, pos) {
                var t = crcTable, end = pos + len;

                crc = crc ^ (-1);

                for (var i = pos; i < end; i++) {
                    crc = (crc >>> 8) ^ t[(crc ^ str.charCodeAt(i)) & 0xFF];
                }

                return (crc ^ (-1)); // >>> 0;
            }

            module.exports = function crc32wrapper(input, crc) {
                if (typeof input === "undefined" || !input.length) {
                    return 0;
                }

                var isArray = utils.getTypeOf(input) !== "string";

                if (isArray) {
                    return crc32(crc | 0, input, input.length, 0);
                } else {
                    return crc32str(crc | 0, input, input.length, 0);
                }
            };
            // vim: set shiftwidth=4 softtabstop=4:

        }, { "./utils": 32 }], 5: [function (require, module, exports) {
            'use strict';
            exports.base64 = false;
            exports.binary = false;
            exports.dir = false;
            exports.createFolders = true;
            exports.date = null;
            exports.compression = null;
            exports.compressionOptions = null;
            exports.comment = null;
            exports.unixPermissions = null;
            exports.dosPermissions = null;

        }, {}], 6: [function (require, module, exports) {
            /* global Promise */
            'use strict';

            // load the global object first:
            // - it should be better integrated in the system (unhandledRejection in node)
            // - the environment may have a custom Promise implementation (see zone.js)
            var ES6Promise = null;
            if (typeof Promise !== "undefined") {
                ES6Promise = Promise;
            } else {
                ES6Promise = require("lie");
            }

            /**
             * Let the user use/change some implementations.
             */
            module.exports = {
                Promise: ES6Promise
            };

        }, { "lie": 58 }], 7: [function (require, module, exports) {
            'use strict';
            var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');

            var pako = require("pako");
            var utils = require("./utils");
            var GenericWorker = require("./stream/GenericWorker");

            var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";

            exports.magic = "\x08\x00";

            /**
             * Create a worker that uses pako to inflate/deflate.
             * @constructor
             * @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
             * @param {Object} options the options to use when (de)compressing.
             */
            function FlateWorker(action, options) {
                GenericWorker.call(this, "FlateWorker/" + action);

                this._pako = new pako[action]({
                    raw: true,
                    level: options.level || -1 // default compression
                });
                // the `meta` object from the last chunk received
                // this allow this worker to pass around metadata
                this.meta = {};

                var self = this;
                this._pako.onData = function (data) {
                    self.push({
                        data: data,
                        meta: self.meta
                    });
                };
            }

            utils.inherits(FlateWorker, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            FlateWorker.prototype.processChunk = function (chunk) {
                this.meta = chunk.meta;
                this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
            };

            /**
             * @see GenericWorker.flush
             */
            FlateWorker.prototype.flush = function () {
                GenericWorker.prototype.flush.call(this);
                this._pako.push([], true);
            };
            /**
             * @see GenericWorker.cleanUp
             */
            FlateWorker.prototype.cleanUp = function () {
                GenericWorker.prototype.cleanUp.call(this);
                this._pako = null;
            };

            exports.compressWorker = function (compressionOptions) {
                return new FlateWorker("Deflate", compressionOptions);
            };
            exports.uncompressWorker = function () {
                return new FlateWorker("Inflate", {});
            };

        }, { "./stream/GenericWorker": 28, "./utils": 32, "pako": 59 }], 8: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils');
            var GenericWorker = require('../stream/GenericWorker');
            var utf8 = require('../utf8');
            var crc32 = require('../crc32');
            var signature = require('../signature');

            /**
             * Transform an integer into a string in hexadecimal.
             * @private
             * @param {number} dec the number to convert.
             * @param {number} bytes the number of bytes to generate.
             * @returns {string} the result.
             */
            var decToHex = function (dec, bytes) {
                var hex = "", i;
                for (i = 0; i < bytes; i++) {
                    hex += String.fromCharCode(dec & 0xff);
                    dec = dec >>> 8;
                }
                return hex;
            };

            /**
             * Generate the UNIX part of the external file attributes.
             * @param {Object} unixPermissions the unix permissions or null.
             * @param {Boolean} isDir true if the entry is a directory, false otherwise.
             * @return {Number} a 32 bit integer.
             *
             * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
             *
             * TTTTsstrwxrwxrwx0000000000ADVSHR
             * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
             *     ^^^_________________________ setuid, setgid, sticky
             *        ^^^^^^^^^________________ permissions
             *                 ^^^^^^^^^^______ not used ?
             *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
             */
            var generateUnixExternalFileAttr = function (unixPermissions, isDir) {

                var result = unixPermissions;
                if (!unixPermissions) {
                    // I can't use octal values in strict mode, hence the hexa.
                    //  040775 => 0x41fd
                    // 0100664 => 0x81b4
                    result = isDir ? 0x41fd : 0x81b4;
                }
                return (result & 0xFFFF) << 16;
            };

            /**
             * Generate the DOS part of the external file attributes.
             * @param {Object} dosPermissions the dos permissions or null.
             * @param {Boolean} isDir true if the entry is a directory, false otherwise.
             * @return {Number} a 32 bit integer.
             *
             * Bit 0     Read-Only
             * Bit 1     Hidden
             * Bit 2     System
             * Bit 3     Volume Label
             * Bit 4     Directory
             * Bit 5     Archive
             */
            var generateDosExternalFileAttr = function (dosPermissions, isDir) {

                // the dir flag is already set for compatibility
                return (dosPermissions || 0) & 0x3F;
            };

            /**
             * Generate the various parts used in the construction of the final zip file.
             * @param {Object} streamInfo the hash with informations about the compressed file.
             * @param {Boolean} streamedContent is the content streamed ?
             * @param {Boolean} streamingEnded is the stream finished ?
             * @param {number} offset the current offset from the start of the zip file.
             * @param {String} platform let's pretend we are this platform (change platform dependents fields)
             * @param {Function} encodeFileName the function to encode the file name / comment.
             * @return {Object} the zip parts.
             */
            var generateZipParts = function (streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
                var file = streamInfo['file'],
                    compression = streamInfo['compression'],
                    useCustomEncoding = encodeFileName !== utf8.utf8encode,
                    encodedFileName = utils.transformTo("string", encodeFileName(file.name)),
                    utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)),
                    comment = file.comment,
                    encodedComment = utils.transformTo("string", encodeFileName(comment)),
                    utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
                    useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
                    useUTF8ForComment = utfEncodedComment.length !== comment.length,
                    dosTime,
                    dosDate,
                    extraFields = "",
                    unicodePathExtraField = "",
                    unicodeCommentExtraField = "",
                    dir = file.dir,
                    date = file.date;


                var dataInfo = {
                    crc32: 0,
                    compressedSize: 0,
                    uncompressedSize: 0
                };

                // if the content is streamed, the sizes/crc32 are only available AFTER
                // the end of the stream.
                if (!streamedContent || streamingEnded) {
                    dataInfo.crc32 = streamInfo['crc32'];
                    dataInfo.compressedSize = streamInfo['compressedSize'];
                    dataInfo.uncompressedSize = streamInfo['uncompressedSize'];
                }

                var bitflag = 0;
                if (streamedContent) {
                    // Bit 3: the sizes/crc32 are set to zero in the local header.
                    // The correct values are put in the data descriptor immediately
                    // following the compressed data.
                    bitflag |= 0x0008;
                }
                if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
                    // Bit 11: Language encoding flag (EFS).
                    bitflag |= 0x0800;
                }


                var extFileAttr = 0;
                var versionMadeBy = 0;
                if (dir) {
                    // dos or unix, we set the dos dir flag
                    extFileAttr |= 0x00010;
                }
                if (platform === "UNIX") {
                    versionMadeBy = 0x031E; // UNIX, version 3.0
                    extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
                } else { // DOS or other, fallback to DOS
                    versionMadeBy = 0x0014; // DOS, version 2.0
                    extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
                }

                // date
                // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
                // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
                // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

                dosTime = date.getUTCHours();
                dosTime = dosTime << 6;
                dosTime = dosTime | date.getUTCMinutes();
                dosTime = dosTime << 5;
                dosTime = dosTime | date.getUTCSeconds() / 2;

                dosDate = date.getUTCFullYear() - 1980;
                dosDate = dosDate << 4;
                dosDate = dosDate | (date.getUTCMonth() + 1);
                dosDate = dosDate << 5;
                dosDate = dosDate | date.getUTCDate();

                if (useUTF8ForFileName) {
                    // set the unicode path extra field. unzip needs at least one extra
                    // field to correctly handle unicode path, so using the path is as good
                    // as any other information. This could improve the situation with
                    // other archive managers too.
                    // This field is usually used without the utf8 flag, with a non
                    // unicode path in the header (winrar, winzip). This helps (a bit)
                    // with the messy Windows' default compressed folders feature but
                    // breaks on p7zip which doesn't seek the unicode path extra field.
                    // So for now, UTF-8 everywhere !
                    unicodePathExtraField =
                        // Version
                        decToHex(1, 1) +
                        // NameCRC32
                        decToHex(crc32(encodedFileName), 4) +
                        // UnicodeName
                        utfEncodedFileName;

                    extraFields +=
                        // Info-ZIP Unicode Path Extra Field
                        "\x75\x70" +
                        // size
                        decToHex(unicodePathExtraField.length, 2) +
                        // content
                        unicodePathExtraField;
                }

                if (useUTF8ForComment) {

                    unicodeCommentExtraField =
                        // Version
                        decToHex(1, 1) +
                        // CommentCRC32
                        decToHex(crc32(encodedComment), 4) +
                        // UnicodeName
                        utfEncodedComment;

                    extraFields +=
                        // Info-ZIP Unicode Path Extra Field
                        "\x75\x63" +
                        // size
                        decToHex(unicodeCommentExtraField.length, 2) +
                        // content
                        unicodeCommentExtraField;
                }

                var header = "";

                // version needed to extract
                header += "\x0A\x00";
                // general purpose bit flag
                header += decToHex(bitflag, 2);
                // compression method
                header += compression.magic;
                // last mod file time
                header += decToHex(dosTime, 2);
                // last mod file date
                header += decToHex(dosDate, 2);
                // crc-32
                header += decToHex(dataInfo.crc32, 4);
                // compressed size
                header += decToHex(dataInfo.compressedSize, 4);
                // uncompressed size
                header += decToHex(dataInfo.uncompressedSize, 4);
                // file name length
                header += decToHex(encodedFileName.length, 2);
                // extra field length
                header += decToHex(extraFields.length, 2);


                var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;

                var dirRecord = signature.CENTRAL_FILE_HEADER +
                    // version made by (00: DOS)
                    decToHex(versionMadeBy, 2) +
                    // file header (common to file and central directory)
                    header +
                    // file comment length
                    decToHex(encodedComment.length, 2) +
                    // disk number start
                    "\x00\x00" +
                    // internal file attributes TODO
                    "\x00\x00" +
                    // external file attributes
                    decToHex(extFileAttr, 4) +
                    // relative offset of local header
                    decToHex(offset, 4) +
                    // file name
                    encodedFileName +
                    // extra field
                    extraFields +
                    // file comment
                    encodedComment;

                return {
                    fileRecord: fileRecord,
                    dirRecord: dirRecord
                };
            };

            /**
             * Generate the EOCD record.
             * @param {Number} entriesCount the number of entries in the zip file.
             * @param {Number} centralDirLength the length (in bytes) of the central dir.
             * @param {Number} localDirLength the length (in bytes) of the local dir.
             * @param {String} comment the zip file comment as a binary string.
             * @param {Function} encodeFileName the function to encode the comment.
             * @return {String} the EOCD record.
             */
            var generateCentralDirectoryEnd = function (entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
                var dirEnd = "";
                var encodedComment = utils.transformTo("string", encodeFileName(comment));

                // end of central dir signature
                dirEnd = signature.CENTRAL_DIRECTORY_END +
                    // number of this disk
                    "\x00\x00" +
                    // number of the disk with the start of the central directory
                    "\x00\x00" +
                    // total number of entries in the central directory on this disk
                    decToHex(entriesCount, 2) +
                    // total number of entries in the central directory
                    decToHex(entriesCount, 2) +
                    // size of the central directory   4 bytes
                    decToHex(centralDirLength, 4) +
                    // offset of start of central directory with respect to the starting disk number
                    decToHex(localDirLength, 4) +
                    // .ZIP file comment length
                    decToHex(encodedComment.length, 2) +
                    // .ZIP file comment
                    encodedComment;

                return dirEnd;
            };

            /**
             * Generate data descriptors for a file entry.
             * @param {Object} streamInfo the hash generated by a worker, containing informations
             * on the file entry.
             * @return {String} the data descriptors.
             */
            var generateDataDescriptors = function (streamInfo) {
                var descriptor = "";
                descriptor = signature.DATA_DESCRIPTOR +
                    // crc-32                          4 bytes
                    decToHex(streamInfo['crc32'], 4) +
                    // compressed size                 4 bytes
                    decToHex(streamInfo['compressedSize'], 4) +
                    // uncompressed size               4 bytes
                    decToHex(streamInfo['uncompressedSize'], 4);

                return descriptor;
            };


            /**
             * A worker to concatenate other workers to create a zip file.
             * @param {Boolean} streamFiles `true` to stream the content of the files,
             * `false` to accumulate it.
             * @param {String} comment the comment to use.
             * @param {String} platform the platform to use, "UNIX" or "DOS".
             * @param {Function} encodeFileName the function to encode file names and comments.
             */
            function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
                GenericWorker.call(this, "ZipFileWorker");
                // The number of bytes written so far. This doesn't count accumulated chunks.
                this.bytesWritten = 0;
                // The comment of the zip file
                this.zipComment = comment;
                // The platform "generating" the zip file.
                this.zipPlatform = platform;
                // the function to encode file names and comments.
                this.encodeFileName = encodeFileName;
                // Should we stream the content of the files ?
                this.streamFiles = streamFiles;
                // If `streamFiles` is false, we will need to accumulate the content of the
                // files to calculate sizes / crc32 (and write them *before* the content).
                // This boolean indicates if we are accumulating chunks (it will change a lot
                // during the lifetime of this worker).
                this.accumulate = false;
                // The buffer receiving chunks when accumulating content.
                this.contentBuffer = [];
                // The list of generated directory records.
                this.dirRecords = [];
                // The offset (in bytes) from the beginning of the zip file for the current source.
                this.currentSourceOffset = 0;
                // The total number of entries in this zip file.
                this.entriesCount = 0;
                // the name of the file currently being added, null when handling the end of the zip file.
                // Used for the emited metadata.
                this.currentFile = null;



                this._sources = [];
            }
            utils.inherits(ZipFileWorker, GenericWorker);

            /**
             * @see GenericWorker.push
             */
            ZipFileWorker.prototype.push = function (chunk) {

                var currentFilePercent = chunk.meta.percent || 0;
                var entriesCount = this.entriesCount;
                var remainingFiles = this._sources.length;

                if (this.accumulate) {
                    this.contentBuffer.push(chunk);
                } else {
                    this.bytesWritten += chunk.data.length;

                    GenericWorker.prototype.push.call(this, {
                        data: chunk.data,
                        meta: {
                            currentFile: this.currentFile,
                            percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
                        }
                    });
                }
            };

            /**
             * The worker started a new source (an other worker).
             * @param {Object} streamInfo the streamInfo object from the new source.
             */
            ZipFileWorker.prototype.openedSource = function (streamInfo) {
                this.currentSourceOffset = this.bytesWritten;
                this.currentFile = streamInfo['file'].name;

                var streamedContent = this.streamFiles && !streamInfo['file'].dir;

                // don't stream folders (because they don't have any content)
                if (streamedContent) {
                    var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
                    this.push({
                        data: record.fileRecord,
                        meta: { percent: 0 }
                    });
                } else {
                    // we need to wait for the whole file before pushing anything
                    this.accumulate = true;
                }
            };

            /**
             * The worker finished a source (an other worker).
             * @param {Object} streamInfo the streamInfo object from the finished source.
             */
            ZipFileWorker.prototype.closedSource = function (streamInfo) {
                this.accumulate = false;
                var streamedContent = this.streamFiles && !streamInfo['file'].dir;
                var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);

                this.dirRecords.push(record.dirRecord);
                if (streamedContent) {
                    // after the streamed file, we put data descriptors
                    this.push({
                        data: generateDataDescriptors(streamInfo),
                        meta: { percent: 100 }
                    });
                } else {
                    // the content wasn't streamed, we need to push everything now
                    // first the file record, then the content
                    this.push({
                        data: record.fileRecord,
                        meta: { percent: 0 }
                    });
                    while (this.contentBuffer.length) {
                        this.push(this.contentBuffer.shift());
                    }
                }
                this.currentFile = null;
            };

            /**
             * @see GenericWorker.flush
             */
            ZipFileWorker.prototype.flush = function () {

                var localDirLength = this.bytesWritten;
                for (var i = 0; i < this.dirRecords.length; i++) {
                    this.push({
                        data: this.dirRecords[i],
                        meta: { percent: 100 }
                    });
                }
                var centralDirLength = this.bytesWritten - localDirLength;

                var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);

                this.push({
                    data: dirEnd,
                    meta: { percent: 100 }
                });
            };

            /**
             * Prepare the next source to be read.
             */
            ZipFileWorker.prototype.prepareNextSource = function () {
                this.previous = this._sources.shift();
                this.openedSource(this.previous.streamInfo);
                if (this.isPaused) {
                    this.previous.pause();
                } else {
                    this.previous.resume();
                }
            };

            /**
             * @see GenericWorker.registerPrevious
             */
            ZipFileWorker.prototype.registerPrevious = function (previous) {
                this._sources.push(previous);
                var self = this;

                previous.on('data', function (chunk) {
                    self.processChunk(chunk);
                });
                previous.on('end', function () {
                    self.closedSource(self.previous.streamInfo);
                    if (self._sources.length) {
                        self.prepareNextSource();
                    } else {
                        self.end();
                    }
                });
                previous.on('error', function (e) {
                    self.error(e);
                });
                return this;
            };

            /**
             * @see GenericWorker.resume
             */
            ZipFileWorker.prototype.resume = function () {
                if (!GenericWorker.prototype.resume.call(this)) {
                    return false;
                }

                if (!this.previous && this._sources.length) {
                    this.prepareNextSource();
                    return true;
                }
                if (!this.previous && !this._sources.length && !this.generatedError) {
                    this.end();
                    return true;
                }
            };

            /**
             * @see GenericWorker.error
             */
            ZipFileWorker.prototype.error = function (e) {
                var sources = this._sources;
                if (!GenericWorker.prototype.error.call(this, e)) {
                    return false;
                }
                for (var i = 0; i < sources.length; i++) {
                    try {
                        sources[i].error(e);
                    } catch (e) {
                        // the `error` exploded, nothing to do
                    }
                }
                return true;
            };

            /**
             * @see GenericWorker.lock
             */
            ZipFileWorker.prototype.lock = function () {
                GenericWorker.prototype.lock.call(this);
                var sources = this._sources;
                for (var i = 0; i < sources.length; i++) {
                    sources[i].lock();
                }
            };

            module.exports = ZipFileWorker;

        }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function (require, module, exports) {
            'use strict';

            var compressions = require('../compressions');
            var ZipFileWorker = require('./ZipFileWorker');

            /**
             * Find the compression to use.
             * @param {String} fileCompression the compression defined at the file level, if any.
             * @param {String} zipCompression the compression defined at the load() level.
             * @return {Object} the compression object to use.
             */
            var getCompression = function (fileCompression, zipCompression) {

                var compressionName = fileCompression || zipCompression;
                var compression = compressions[compressionName];
                if (!compression) {
                    throw new Error(compressionName + " is not a valid compression method !");
                }
                return compression;
            };

            /**
             * Create a worker to generate a zip file.
             * @param {JSZip} zip the JSZip instance at the right root level.
             * @param {Object} options to generate the zip file.
             * @param {String} comment the comment to use.
             */
            exports.generateWorker = function (zip, options, comment) {

                var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
                var entriesCount = 0;
                try {

                    zip.forEach(function (relativePath, file) {
                        entriesCount++;
                        var compression = getCompression(file.options.compression, options.compression);
                        var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
                        var dir = file.dir, date = file.date;

                        file._compressWorker(compression, compressionOptions)
                            .withStreamInfo("file", {
                                name: relativePath,
                                dir: dir,
                                date: date,
                                comment: file.comment || "",
                                unixPermissions: file.unixPermissions,
                                dosPermissions: file.dosPermissions
                            })
                            .pipe(zipFileWorker);
                    });
                    zipFileWorker.entriesCount = entriesCount;
                } catch (e) {
                    zipFileWorker.error(e);
                }

                return zipFileWorker;
            };

        }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function (require, module, exports) {
            'use strict';

            /**
             * Representation a of zip file in js
             * @constructor
             */
            function JSZip() {
                // if this constructor is used without `new`, it adds `new` before itself:
                if (!(this instanceof JSZip)) {
                    return new JSZip();
                }

                if (arguments.length) {
                    throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
                }

                // object containing the files :
                // {
                //   "folder/" : {...},
                //   "folder/data.txt" : {...}
                // }
                this.files = {};

                this.comment = null;

                // Where we are in the hierarchy
                this.root = "";
                this.clone = function () {
                    var newObj = new JSZip();
                    for (var i in this) {
                        if (typeof this[i] !== "function") {
                            newObj[i] = this[i];
                        }
                    }
                    return newObj;
                };
            }
            JSZip.prototype = require('./object');
            JSZip.prototype.loadAsync = require('./load');
            JSZip.support = require('./support');
            JSZip.defaults = require('./defaults');

            // TODO find a better way to handle this version,
            // a require('package.json').version doesn't work with webpack, see #327
            JSZip.version = "3.1.3";

            JSZip.loadAsync = function (content, options) {
                return new JSZip().loadAsync(content, options);
            };

            JSZip.external = require("./external");
            module.exports = JSZip;

        }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function (require, module, exports) {
            'use strict';
            var utils = require('./utils');
            var external = require("./external");
            var utf8 = require('./utf8');
            var utils = require('./utils');
            var ZipEntries = require('./zipEntries');
            var Crc32Probe = require('./stream/Crc32Probe');
            var nodejsUtils = require("./nodejsUtils");

            /**
             * Check the CRC32 of an entry.
             * @param {ZipEntry} zipEntry the zip entry to check.
             * @return {Promise} the result.
             */
            function checkEntryCRC32(zipEntry) {
                return new external.Promise(function (resolve, reject) {
                    var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
                    worker.on("error", function (e) {
                        reject(e);
                    })
                        .on("end", function () {
                            if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
                                reject(new Error("Corrupted zip : CRC32 mismatch"));
                            } else {
                                resolve();
                            }
                        })
                        .resume();
                });
            }

            module.exports = function (data, options) {
                var zip = this;
                options = utils.extend(options || {}, {
                    base64: false,
                    checkCRC32: false,
                    optimizedBinaryString: false,
                    createFolders: false,
                    decodeFileName: utf8.utf8decode
                });

                if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
                    return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
                }

                return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64)
                    .then(function (data) {
                        var zipEntries = new ZipEntries(options);
                        zipEntries.load(data);
                        return zipEntries;
                    }).then(function checkCRC32(zipEntries) {
                        var promises = [external.Promise.resolve(zipEntries)];
                        var files = zipEntries.files;
                        if (options.checkCRC32) {
                            for (var i = 0; i < files.length; i++) {
                                promises.push(checkEntryCRC32(files[i]));
                            }
                        }
                        return external.Promise.all(promises);
                    }).then(function addFiles(results) {
                        var zipEntries = results.shift();
                        var files = zipEntries.files;
                        for (var i = 0; i < files.length; i++) {
                            var input = files[i];
                            zip.file(input.fileNameStr, input.decompressed, {
                                binary: true,
                                optimizedBinaryString: true,
                                date: input.date,
                                dir: input.dir,
                                comment: input.fileCommentStr.length ? input.fileCommentStr : null,
                                unixPermissions: input.unixPermissions,
                                dosPermissions: input.dosPermissions,
                                createFolders: options.createFolders
                            });
                        }
                        if (zipEntries.zipComment.length) {
                            zip.comment = zipEntries.zipComment;
                        }

                        return zip;
                    });
            };

        }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function (require, module, exports) {
            "use strict";

            var utils = require('../utils');
            var GenericWorker = require('../stream/GenericWorker');

            /**
             * A worker that use a nodejs stream as source.
             * @constructor
             * @param {String} filename the name of the file entry for this stream.
             * @param {Readable} stream the nodejs stream.
             */
            function NodejsStreamInputAdapter(filename, stream) {
                GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
                this._upstreamEnded = false;
                this._bindStream(stream);
            }

            utils.inherits(NodejsStreamInputAdapter, GenericWorker);

            /**
             * Prepare the stream and bind the callbacks on it.
             * Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
             * @param {Stream} stream the nodejs stream to use.
             */
            NodejsStreamInputAdapter.prototype._bindStream = function (stream) {
                var self = this;
                this._stream = stream;
                stream.pause();
                stream
                    .on("data", function (chunk) {
                        self.push({
                            data: chunk,
                            meta: {
                                percent: 0
                            }
                        });
                    })
                    .on("error", function (e) {
                        if (self.isPaused) {
                            this.generatedError = e;
                        } else {
                            self.error(e);
                        }
                    })
                    .on("end", function () {
                        if (self.isPaused) {
                            self._upstreamEnded = true;
                        } else {
                            self.end();
                        }
                    });
            };
            NodejsStreamInputAdapter.prototype.pause = function () {
                if (!GenericWorker.prototype.pause.call(this)) {
                    return false;
                }
                this._stream.pause();
                return true;
            };
            NodejsStreamInputAdapter.prototype.resume = function () {
                if (!GenericWorker.prototype.resume.call(this)) {
                    return false;
                }

                if (this._upstreamEnded) {
                    this.end();
                } else {
                    this._stream.resume();
                }

                return true;
            };

            module.exports = NodejsStreamInputAdapter;

        }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function (require, module, exports) {
            'use strict';

            var Readable = require('readable-stream').Readable;

            var util = require('util');
            util.inherits(NodejsStreamOutputAdapter, Readable);

            /**
            * A nodejs stream using a worker as source.
            * @see the SourceWrapper in http://nodejs.org/api/stream.html
            * @constructor
            * @param {StreamHelper} helper the helper wrapping the worker
            * @param {Object} options the nodejs stream options
            * @param {Function} updateCb the update callback.
            */
            function NodejsStreamOutputAdapter(helper, options, updateCb) {
                Readable.call(this, options);
                this._helper = helper;

                var self = this;
                helper.on("data", function (data, meta) {
                    if (!self.push(data)) {
                        self._helper.pause();
                    }
                    if (updateCb) {
                        updateCb(meta);
                    }
                })
                    .on("error", function (e) {
                        self.emit('error', e);
                    })
                    .on("end", function () {
                        self.push(null);
                    });
            }


            NodejsStreamOutputAdapter.prototype._read = function () {
                this._helper.resume();
            };

            module.exports = NodejsStreamOutputAdapter;

        }, { "readable-stream": 16, "util": undefined }], 14: [function (require, module, exports) {
            'use strict';

            module.exports = {
                /**
                 * True if this is running in Nodejs, will be undefined in a browser.
                 * In a browser, browserify won't include this file and the whole module
                 * will be resolved an empty object.
                 */
                isNode: typeof Buffer !== "undefined",
                /**
                 * Create a new nodejs Buffer.
                 * @param {Object} data the data to pass to the constructor.
                 * @param {String} encoding the encoding to use.
                 * @return {Buffer} a new Buffer.
                 */
                newBuffer: function (data, encoding) {
                    return new Buffer(data, encoding);
                },
                /**
                 * Find out if an object is a Buffer.
                 * @param {Object} b the object to test.
                 * @return {Boolean} true if the object is a Buffer, false otherwise.
                 */
                isBuffer: function (b) {
                    return Buffer.isBuffer(b);
                },

                isStream: function (obj) {
                    return obj &&
                        typeof obj.on === "function" &&
                        typeof obj.pause === "function" &&
                        typeof obj.resume === "function";
                }
            };

        }, {}], 15: [function (require, module, exports) {
            'use strict';
            var utf8 = require('./utf8');
            var utils = require('./utils');
            var GenericWorker = require('./stream/GenericWorker');
            var StreamHelper = require('./stream/StreamHelper');
            var defaults = require('./defaults');
            var CompressedObject = require('./compressedObject');
            var ZipObject = require('./zipObject');
            var generate = require("./generate");
            var nodejsUtils = require("./nodejsUtils");
            var NodejsStreamInputAdapter = require("./nodejs/NodejsStreamInputAdapter");


            /**
             * Add a file in the current folder.
             * @private
             * @param {string} name the name of the file
             * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
             * @param {Object} originalOptions the options of the file
             * @return {Object} the new file.
             */
            var fileAdd = function (name, data, originalOptions) {
                // be sure sub folders exist
                var dataType = utils.getTypeOf(data),
                    parent;


                /*
                 * Correct options.
                 */

                var o = utils.extend(originalOptions || {}, defaults);
                o.date = o.date || new Date();
                if (o.compression !== null) {
                    o.compression = o.compression.toUpperCase();
                }

                if (typeof o.unixPermissions === "string") {
                    o.unixPermissions = parseInt(o.unixPermissions, 8);
                }

                // UNX_IFDIR  0040000 see zipinfo.c
                if (o.unixPermissions && (o.unixPermissions & 0x4000)) {
                    o.dir = true;
                }
                // Bit 4    Directory
                if (o.dosPermissions && (o.dosPermissions & 0x0010)) {
                    o.dir = true;
                }

                if (o.dir) {
                    name = forceTrailingSlash(name);
                }
                if (o.createFolders && (parent = parentFolder(name))) {
                    folderAdd.call(this, parent, true);
                }

                var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
                if (!originalOptions || typeof originalOptions.binary === "undefined") {
                    o.binary = !isUnicodeString;
                }


                var isCompressedEmpty = (data instanceof CompressedObject) && data.uncompressedSize === 0;

                if (isCompressedEmpty || o.dir || !data || data.length === 0) {
                    o.base64 = false;
                    o.binary = true;
                    data = "";
                    o.compression = "STORE";
                    dataType = "string";
                }

                /*
                 * Convert content to fit.
                 */

                var zipObjectContent = null;
                if (data instanceof CompressedObject || data instanceof GenericWorker) {
                    zipObjectContent = data;
                } else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
                    zipObjectContent = new NodejsStreamInputAdapter(name, data);
                } else {
                    zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
                }

                var object = new ZipObject(name, zipObjectContent, o);
                this.files[name] = object;
                /*
                TODO: we can't throw an exception because we have async promises
                (we can have a promise of a Date() for example) but returning a
                promise is useless because file(name, data) returns the JSZip
                object for chaining. Should we break that to allow the user
                to catch the error ?
            
                return external.Promise.resolve(zipObjectContent)
                .then(function () {
                    return object;
                });
                */
            };

            /**
             * Find the parent folder of the path.
             * @private
             * @param {string} path the path to use
             * @return {string} the parent folder, or ""
             */
            var parentFolder = function (path) {
                if (path.slice(-1) === '/') {
                    path = path.substring(0, path.length - 1);
                }
                var lastSlash = path.lastIndexOf('/');
                return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
            };

            /**
             * Returns the path with a slash at the end.
             * @private
             * @param {String} path the path to check.
             * @return {String} the path with a trailing slash.
             */
            var forceTrailingSlash = function (path) {
                // Check the name ends with a /
                if (path.slice(-1) !== "/") {
                    path += "/"; // IE doesn't like substr(-1)
                }
                return path;
            };

            /**
             * Add a (sub) folder in the current folder.
             * @private
             * @param {string} name the folder's name
             * @param {boolean=} [createFolders] If true, automatically create sub
             *  folders. Defaults to false.
             * @return {Object} the new folder.
             */
            var folderAdd = function (name, createFolders) {
                createFolders = (typeof createFolders !== 'undefined') ? createFolders : defaults.createFolders;

                name = forceTrailingSlash(name);

                // Does this folder already exist?
                if (!this.files[name]) {
                    fileAdd.call(this, name, null, {
                        dir: true,
                        createFolders: createFolders
                    });
                }
                return this.files[name];
            };

            /**
            * Cross-window, cross-Node-context regular expression detection
            * @param  {Object}  object Anything
            * @return {Boolean}        true if the object is a regular expression,
            * false otherwise
            */
            function isRegExp(object) {
                return Object.prototype.toString.call(object) === "[object RegExp]";
            }

            // return the actual prototype of JSZip
            var out = {
                /**
                 * @see loadAsync
                 */
                load: function () {
                    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
                },


                /**
                 * Call a callback function for each entry at this folder level.
                 * @param {Function} cb the callback function:
                 * function (relativePath, file) {...}
                 * It takes 2 arguments : the relative path and the file.
                 */
                forEach: function (cb) {
                    var filename, relativePath, file;
                    for (filename in this.files) {
                        if (!this.files.hasOwnProperty(filename)) {
                            continue;
                        }
                        file = this.files[filename];
                        relativePath = filename.slice(this.root.length, filename.length);
                        if (relativePath && filename.slice(0, this.root.length) === this.root) { // the file is in the current root
                            cb(relativePath, file); // TODO reverse the parameters ? need to be clean AND consistent with the filter search fn...
                        }
                    }
                },

                /**
                 * Filter nested files/folders with the specified function.
                 * @param {Function} search the predicate to use :
                 * function (relativePath, file) {...}
                 * It takes 2 arguments : the relative path and the file.
                 * @return {Array} An array of matching elements.
                 */
                filter: function (search) {
                    var result = [];
                    this.forEach(function (relativePath, entry) {
                        if (search(relativePath, entry)) { // the file matches the function
                            result.push(entry);
                        }

                    });
                    return result;
                },

                /**
                 * Add a file to the zip file, or search a file.
                 * @param   {string|RegExp} name The name of the file to add (if data is defined),
                 * the name of the file to find (if no data) or a regex to match files.
                 * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
                 * @param   {Object} o     File options
                 * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
                 * a file (when searching by string) or an array of files (when searching by regex).
                 */
                file: function (name, data, o) {
                    if (arguments.length === 1) {
                        if (isRegExp(name)) {
                            var regexp = name;
                            return this.filter(function (relativePath, file) {
                                return !file.dir && regexp.test(relativePath);
                            });
                        }
                        else { // text
                            var obj = this.files[this.root + name];
                            if (obj && !obj.dir) {
                                return obj;
                            } else {
                                return null;
                            }
                        }
                    }
                    else { // more than one argument : we have data !
                        name = this.root + name;
                        fileAdd.call(this, name, data, o);
                    }
                    return this;
                },

                /**
                 * Add a directory to the zip file, or search.
                 * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
                 * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
                 */
                folder: function (arg) {
                    if (!arg) {
                        return this;
                    }

                    if (isRegExp(arg)) {
                        return this.filter(function (relativePath, file) {
                            return file.dir && arg.test(relativePath);
                        });
                    }

                    // else, name is a new folder
                    var name = this.root + arg;
                    var newFolder = folderAdd.call(this, name);

                    // Allow chaining by returning a new object with this folder as the root
                    var ret = this.clone();
                    ret.root = newFolder.name;
                    return ret;
                },

                /**
                 * Delete a file, or a directory and all sub-files, from the zip
                 * @param {string} name the name of the file to delete
                 * @return {JSZip} this JSZip object
                 */
                remove: function (name) {
                    name = this.root + name;
                    var file = this.files[name];
                    if (!file) {
                        // Look for any folders
                        if (name.slice(-1) !== "/") {
                            name += "/";
                        }
                        file = this.files[name];
                    }

                    if (file && !file.dir) {
                        // file
                        delete this.files[name];
                    } else {
                        // maybe a folder, delete recursively
                        var kids = this.filter(function (relativePath, file) {
                            return file.name.slice(0, name.length) === name;
                        });
                        for (var i = 0; i < kids.length; i++) {
                            delete this.files[kids[i].name];
                        }
                    }

                    return this;
                },

                /**
                 * Generate the complete zip file
                 * @param {Object} options the options to generate the zip file :
                 * - compression, "STORE" by default.
                 * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
                 * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
                 */
                generate: function (options) {
                    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
                },

                /**
                 * Generate the complete zip file as an internal stream.
                 * @param {Object} options the options to generate the zip file :
                 * - compression, "STORE" by default.
                 * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
                 * @return {StreamHelper} the streamed zip file.
                 */
                generateInternalStream: function (options) {
                    var worker, opts = {};
                    try {
                        opts = utils.extend(options || {}, {
                            streamFiles: false,
                            compression: "STORE",
                            compressionOptions: null,
                            type: "",
                            platform: "DOS",
                            comment: null,
                            mimeType: 'application/zip',
                            encodeFileName: utf8.utf8encode
                        });

                        opts.type = opts.type.toLowerCase();
                        opts.compression = opts.compression.toUpperCase();

                        // "binarystring" is prefered but the internals use "string".
                        if (opts.type === "binarystring") {
                            opts.type = "string";
                        }

                        if (!opts.type) {
                            throw new Error("No output type specified.");
                        }

                        utils.checkSupport(opts.type);

                        // accept nodejs `process.platform`
                        if (
                            opts.platform === 'darwin' ||
                            opts.platform === 'freebsd' ||
                            opts.platform === 'linux' ||
                            opts.platform === 'sunos'
                        ) {
                            opts.platform = "UNIX";
                        }
                        if (opts.platform === 'win32') {
                            opts.platform = "DOS";
                        }

                        var comment = opts.comment || this.comment || "";
                        worker = generate.generateWorker(this, opts, comment);
                    } catch (e) {
                        worker = new GenericWorker("error");
                        worker.error(e);
                    }
                    return new StreamHelper(worker, opts.type || "string", opts.mimeType);
                },
                /**
                 * Generate the complete zip file asynchronously.
                 * @see generateInternalStream
                 */
                generateAsync: function (options, onUpdate) {
                    return this.generateInternalStream(options).accumulate(onUpdate);
                },
                /**
                 * Generate the complete zip file asynchronously.
                 * @see generateInternalStream
                 */
                generateNodeStream: function (options, onUpdate) {
                    options = options || {};
                    if (!options.type) {
                        options.type = "nodebuffer";
                    }
                    return this.generateInternalStream(options).toNodejsStream(onUpdate);
                }
            };
            module.exports = out;

        }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function (require, module, exports) {
            /*
             * This file is used by module bundlers (browserify/webpack/etc) when
             * including a stream implementation. We use "readable-stream" to get a
             * consistent behavior between nodejs versions but bundlers often have a shim
             * for "stream". Using this shim greatly improve the compatibility and greatly
             * reduce the final size of the bundle (only one stream implementation, not
             * two).
             */
            module.exports = require("stream");

        }, { "stream": undefined }], 17: [function (require, module, exports) {
            'use strict';
            var DataReader = require('./DataReader');
            var utils = require('../utils');

            function ArrayReader(data) {
                DataReader.call(this, data);
                for (var i = 0; i < this.data.length; i++) {
                    data[i] = data[i] & 0xFF;
                }
            }
            utils.inherits(ArrayReader, DataReader);
            /**
             * @see DataReader.byteAt
             */
            ArrayReader.prototype.byteAt = function (i) {
                return this.data[this.zero + i];
            };
            /**
             * @see DataReader.lastIndexOfSignature
             */
            ArrayReader.prototype.lastIndexOfSignature = function (sig) {
                var sig0 = sig.charCodeAt(0),
                    sig1 = sig.charCodeAt(1),
                    sig2 = sig.charCodeAt(2),
                    sig3 = sig.charCodeAt(3);
                for (var i = this.length - 4; i >= 0; --i) {
                    if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
                        return i - this.zero;
                    }
                }

                return -1;
            };
            /**
             * @see DataReader.readAndCheckSignature
             */
            ArrayReader.prototype.readAndCheckSignature = function (sig) {
                var sig0 = sig.charCodeAt(0),
                    sig1 = sig.charCodeAt(1),
                    sig2 = sig.charCodeAt(2),
                    sig3 = sig.charCodeAt(3),
                    data = this.readData(4);
                return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
            };
            /**
             * @see DataReader.readData
             */
            ArrayReader.prototype.readData = function (size) {
                this.checkOffset(size);
                if (size === 0) {
                    return [];
                }
                var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
                this.index += size;
                return result;
            };
            module.exports = ArrayReader;

        }, { "../utils": 32, "./DataReader": 18 }], 18: [function (require, module, exports) {
            'use strict';
            var utils = require('../utils');

            function DataReader(data) {
                this.data = data; // type : see implementation
                this.length = data.length;
                this.index = 0;
                this.zero = 0;
            }
            DataReader.prototype = {
                /**
                 * Check that the offset will not go too far.
                 * @param {string} offset the additional offset to check.
                 * @throws {Error} an Error if the offset is out of bounds.
                 */
                checkOffset: function (offset) {
                    this.checkIndex(this.index + offset);
                },
                /**
                 * Check that the specifed index will not be too far.
                 * @param {string} newIndex the index to check.
                 * @throws {Error} an Error if the index is out of bounds.
                 */
                checkIndex: function (newIndex) {
                    if (this.length < this.zero + newIndex || newIndex < 0) {
                        throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
                    }
                },
                /**
                 * Change the index.
                 * @param {number} newIndex The new index.
                 * @throws {Error} if the new index is out of the data.
                 */
                setIndex: function (newIndex) {
                    this.checkIndex(newIndex);
                    this.index = newIndex;
                },
                /**
                 * Skip the next n bytes.
                 * @param {number} n the number of bytes to skip.
                 * @throws {Error} if the new index is out of the data.
                 */
                skip: function (n) {
                    this.setIndex(this.index + n);
                },
                /**
                 * Get the byte at the specified index.
                 * @param {number} i the index to use.
                 * @return {number} a byte.
                 */
                byteAt: function (i) {
                    // see implementations
                },
                /**
                 * Get the next number with a given byte size.
                 * @param {number} size the number of bytes to read.
                 * @return {number} the corresponding number.
                 */
                readInt: function (size) {
                    var result = 0,
                        i;
                    this.checkOffset(size);
                    for (i = this.index + size - 1; i >= this.index; i--) {
                        result = (result << 8) + this.byteAt(i);
                    }
                    this.index += size;
                    return result;
                },
                /**
                 * Get the next string with a given byte size.
                 * @param {number} size the number of bytes to read.
                 * @return {string} the corresponding string.
                 */
                readString: function (size) {
                    return utils.transformTo("string", this.readData(size));
                },
                /**
                 * Get raw data without conversion, <size> bytes.
                 * @param {number} size the number of bytes to read.
                 * @return {Object} the raw data, implementation specific.
                 */
                readData: function (size) {
                    // see implementations
                },
                /**
                 * Find the last occurence of a zip signature (4 bytes).
                 * @param {string} sig the signature to find.
                 * @return {number} the index of the last occurence, -1 if not found.
                 */
                lastIndexOfSignature: function (sig) {
                    // see implementations
                },
                /**
                 * Read the signature (4 bytes) at the current position and compare it with sig.
                 * @param {string} sig the expected signature
                 * @return {boolean} true if the signature matches, false otherwise.
                 */
                readAndCheckSignature: function (sig) {
                    // see implementations
                },
                /**
                 * Get the next date.
                 * @return {Date} the date.
                 */
                readDate: function () {
                    var dostime = this.readInt(4);
                    return new Date(Date.UTC(
                        ((dostime >> 25) & 0x7f) + 1980, // year
                        ((dostime >> 21) & 0x0f) - 1, // month
                        (dostime >> 16) & 0x1f, // day
                        (dostime >> 11) & 0x1f, // hour
                        (dostime >> 5) & 0x3f, // minute
                        (dostime & 0x1f) << 1)); // second
                }
            };
            module.exports = DataReader;

        }, { "../utils": 32 }], 19: [function (require, module, exports) {
            'use strict';
            var Uint8ArrayReader = require('./Uint8ArrayReader');
            var utils = require('../utils');

            function NodeBufferReader(data) {
                Uint8ArrayReader.call(this, data);
            }
            utils.inherits(NodeBufferReader, Uint8ArrayReader);

            /**
             * @see DataReader.readData
             */
            NodeBufferReader.prototype.readData = function (size) {
                this.checkOffset(size);
                var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
                this.index += size;
                return result;
            };
            module.exports = NodeBufferReader;

        }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function (require, module, exports) {
            'use strict';
            var DataReader = require('./DataReader');
            var utils = require('../utils');

            function StringReader(data) {
                DataReader.call(this, data);
            }
            utils.inherits(StringReader, DataReader);
            /**
             * @see DataReader.byteAt
             */
            StringReader.prototype.byteAt = function (i) {
                return this.data.charCodeAt(this.zero + i);
            };
            /**
             * @see DataReader.lastIndexOfSignature
             */
            StringReader.prototype.lastIndexOfSignature = function (sig) {
                return this.data.lastIndexOf(sig) - this.zero;
            };
            /**
             * @see DataReader.readAndCheckSignature
             */
            StringReader.prototype.readAndCheckSignature = function (sig) {
                var data = this.readData(4);
                return sig === data;
            };
            /**
             * @see DataReader.readData
             */
            StringReader.prototype.readData = function (size) {
                this.checkOffset(size);
                // this will work because the constructor applied the "& 0xff" mask.
                var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
                this.index += size;
                return result;
            };
            module.exports = StringReader;

        }, { "../utils": 32, "./DataReader": 18 }], 21: [function (require, module, exports) {
            'use strict';
            var ArrayReader = require('./ArrayReader');
            var utils = require('../utils');

            function Uint8ArrayReader(data) {
                ArrayReader.call(this, data);
            }
            utils.inherits(Uint8ArrayReader, ArrayReader);
            /**
             * @see DataReader.readData
             */
            Uint8ArrayReader.prototype.readData = function (size) {
                this.checkOffset(size);
                if (size === 0) {
                    // in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
                    return new Uint8Array(0);
                }
                var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
                this.index += size;
                return result;
            };
            module.exports = Uint8ArrayReader;

        }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils');
            var support = require('../support');
            var ArrayReader = require('./ArrayReader');
            var StringReader = require('./StringReader');
            var NodeBufferReader = require('./NodeBufferReader');
            var Uint8ArrayReader = require('./Uint8ArrayReader');

            /**
             * Create a reader adapted to the data.
             * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
             * @return {DataReader} the data reader.
             */
            module.exports = function (data) {
                var type = utils.getTypeOf(data);
                utils.checkSupport(type);
                if (type === "string" && !support.uint8array) {
                    return new StringReader(data);
                }
                if (type === "nodebuffer") {
                    return new NodeBufferReader(data);
                }
                if (support.uint8array) {
                    return new Uint8ArrayReader(utils.transformTo("uint8array", data));
                }
                return new ArrayReader(utils.transformTo("array", data));
            };

            // vim: set shiftwidth=4 softtabstop=4:

        }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function (require, module, exports) {
            'use strict';
            exports.LOCAL_FILE_HEADER = "PK\x03\x04";
            exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
            exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
            exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
            exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
            exports.DATA_DESCRIPTOR = "PK\x07\x08";

        }, {}], 24: [function (require, module, exports) {
            'use strict';

            var GenericWorker = require('./GenericWorker');
            var utils = require('../utils');

            /**
             * A worker which convert chunks to a specified type.
             * @constructor
             * @param {String} destType the destination type.
             */
            function ConvertWorker(destType) {
                GenericWorker.call(this, "ConvertWorker to " + destType);
                this.destType = destType;
            }
            utils.inherits(ConvertWorker, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            ConvertWorker.prototype.processChunk = function (chunk) {
                this.push({
                    data: utils.transformTo(this.destType, chunk.data),
                    meta: chunk.meta
                });
            };
            module.exports = ConvertWorker;

        }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function (require, module, exports) {
            'use strict';

            var GenericWorker = require('./GenericWorker');
            var crc32 = require('../crc32');
            var utils = require('../utils');

            /**
             * A worker which calculate the crc32 of the data flowing through.
             * @constructor
             */
            function Crc32Probe() {
                GenericWorker.call(this, "Crc32Probe");
                this.withStreamInfo("crc32", 0);
            }
            utils.inherits(Crc32Probe, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            Crc32Probe.prototype.processChunk = function (chunk) {
                this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
                this.push(chunk);
            };
            module.exports = Crc32Probe;

        }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils');
            var GenericWorker = require('./GenericWorker');

            /**
             * A worker which calculate the total length of the data flowing through.
             * @constructor
             * @param {String} propName the name used to expose the length
             */
            function DataLengthProbe(propName) {
                GenericWorker.call(this, "DataLengthProbe for " + propName);
                this.propName = propName;
                this.withStreamInfo(propName, 0);
            }
            utils.inherits(DataLengthProbe, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            DataLengthProbe.prototype.processChunk = function (chunk) {
                if (chunk) {
                    var length = this.streamInfo[this.propName] || 0;
                    this.streamInfo[this.propName] = length + chunk.data.length;
                }
                GenericWorker.prototype.processChunk.call(this, chunk);
            };
            module.exports = DataLengthProbe;


        }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils');
            var GenericWorker = require('./GenericWorker');

            // the size of the generated chunks
            // TODO expose this as a public variable
            var DEFAULT_BLOCK_SIZE = 16 * 1024;

            /**
             * A worker that reads a content and emits chunks.
             * @constructor
             * @param {Promise} dataP the promise of the data to split
             */
            function DataWorker(dataP) {
                GenericWorker.call(this, "DataWorker");
                var self = this;
                this.dataIsReady = false;
                this.index = 0;
                this.max = 0;
                this.data = null;
                this.type = "";

                this._tickScheduled = false;

                dataP.then(function (data) {
                    self.dataIsReady = true;
                    self.data = data;
                    self.max = data && data.length || 0;
                    self.type = utils.getTypeOf(data);
                    if (!self.isPaused) {
                        self._tickAndRepeat();
                    }
                }, function (e) {
                    self.error(e);
                });
            }

            utils.inherits(DataWorker, GenericWorker);

            /**
             * @see GenericWorker.cleanUp
             */
            DataWorker.prototype.cleanUp = function () {
                GenericWorker.prototype.cleanUp.call(this);
                this.data = null;
            };

            /**
             * @see GenericWorker.resume
             */
            DataWorker.prototype.resume = function () {
                if (!GenericWorker.prototype.resume.call(this)) {
                    return false;
                }

                if (!this._tickScheduled && this.dataIsReady) {
                    this._tickScheduled = true;
                    utils.delay(this._tickAndRepeat, [], this);
                }
                return true;
            };

            /**
             * Trigger a tick a schedule an other call to this function.
             */
            DataWorker.prototype._tickAndRepeat = function () {
                this._tickScheduled = false;
                if (this.isPaused || this.isFinished) {
                    return;
                }
                this._tick();
                if (!this.isFinished) {
                    utils.delay(this._tickAndRepeat, [], this);
                    this._tickScheduled = true;
                }
            };

            /**
             * Read and push a chunk.
             */
            DataWorker.prototype._tick = function () {

                if (this.isPaused || this.isFinished) {
                    return false;
                }

                var size = DEFAULT_BLOCK_SIZE;
                var data = null, nextIndex = Math.min(this.max, this.index + size);
                if (this.index >= this.max) {
                    // EOF
                    return this.end();
                } else {
                    switch (this.type) {
                        case "string":
                            data = this.data.substring(this.index, nextIndex);
                            break;
                        case "uint8array":
                            data = this.data.subarray(this.index, nextIndex);
                            break;
                        case "array":
                        case "nodebuffer":
                            data = this.data.slice(this.index, nextIndex);
                            break;
                    }
                    this.index = nextIndex;
                    return this.push({
                        data: data,
                        meta: {
                            percent: this.max ? this.index / this.max * 100 : 0
                        }
                    });
                }
            };

            module.exports = DataWorker;

        }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function (require, module, exports) {
            'use strict';

            /**
             * A worker that does nothing but passing chunks to the next one. This is like
             * a nodejs stream but with some differences. On the good side :
             * - it works on IE 6-9 without any issue / polyfill
             * - it weights less than the full dependencies bundled with browserify
             * - it forwards errors (no need to declare an error handler EVERYWHERE)
             *
             * A chunk is an object with 2 attributes : `meta` and `data`. The former is an
             * object containing anything (`percent` for example), see each worker for more
             * details. The latter is the real data (String, Uint8Array, etc).
             *
             * @constructor
             * @param {String} name the name of the stream (mainly used for debugging purposes)
             */
            function GenericWorker(name) {
                // the name of the worker
                this.name = name || "default";
                // an object containing metadata about the workers chain
                this.streamInfo = {};
                // an error which happened when the worker was paused
                this.generatedError = null;
                // an object containing metadata to be merged by this worker into the general metadata
                this.extraStreamInfo = {};
                // true if the stream is paused (and should not do anything), false otherwise
                this.isPaused = true;
                // true if the stream is finished (and should not do anything), false otherwise
                this.isFinished = false;
                // true if the stream is locked to prevent further structure updates (pipe), false otherwise
                this.isLocked = false;
                // the event listeners
                this._listeners = {
                    'data': [],
                    'end': [],
                    'error': []
                };
                // the previous worker, if any
                this.previous = null;
            }

            GenericWorker.prototype = {
                /**
                 * Push a chunk to the next workers.
                 * @param {Object} chunk the chunk to push
                 */
                push: function (chunk) {
                    this.emit("data", chunk);
                },
                /**
                 * End the stream.
                 * @return {Boolean} true if this call ended the worker, false otherwise.
                 */
                end: function () {
                    if (this.isFinished) {
                        return false;
                    }

                    this.flush();
                    try {
                        this.emit("end");
                        this.cleanUp();
                        this.isFinished = true;
                    } catch (e) {
                        this.emit("error", e);
                    }
                    return true;
                },
                /**
                 * End the stream with an error.
                 * @param {Error} e the error which caused the premature end.
                 * @return {Boolean} true if this call ended the worker with an error, false otherwise.
                 */
                error: function (e) {
                    if (this.isFinished) {
                        return false;
                    }

                    if (this.isPaused) {
                        this.generatedError = e;
                    } else {
                        this.isFinished = true;

                        this.emit("error", e);

                        // in the workers chain exploded in the middle of the chain,
                        // the error event will go downward but we also need to notify
                        // workers upward that there has been an error.
                        if (this.previous) {
                            this.previous.error(e);
                        }

                        this.cleanUp();
                    }
                    return true;
                },
                /**
                 * Add a callback on an event.
                 * @param {String} name the name of the event (data, end, error)
                 * @param {Function} listener the function to call when the event is triggered
                 * @return {GenericWorker} the current object for chainability
                 */
                on: function (name, listener) {
                    this._listeners[name].push(listener);
                    return this;
                },
                /**
                 * Clean any references when a worker is ending.
                 */
                cleanUp: function () {
                    this.streamInfo = this.generatedError = this.extraStreamInfo = null;
                    this._listeners = [];
                },
                /**
                 * Trigger an event. This will call registered callback with the provided arg.
                 * @param {String} name the name of the event (data, end, error)
                 * @param {Object} arg the argument to call the callback with.
                 */
                emit: function (name, arg) {
                    if (this._listeners[name]) {
                        for (var i = 0; i < this._listeners[name].length; i++) {
                            this._listeners[name][i].call(this, arg);
                        }
                    }
                },
                /**
                 * Chain a worker with an other.
                 * @param {Worker} next the worker receiving events from the current one.
                 * @return {worker} the next worker for chainability
                 */
                pipe: function (next) {
                    return next.registerPrevious(this);
                },
                /**
                 * Same as `pipe` in the other direction.
                 * Using an API with `pipe(next)` is very easy.
                 * Implementing the API with the point of view of the next one registering
                 * a source is easier, see the ZipFileWorker.
                 * @param {Worker} previous the previous worker, sending events to this one
                 * @return {Worker} the current worker for chainability
                 */
                registerPrevious: function (previous) {
                    if (this.isLocked) {
                        throw new Error("The stream '" + this + "' has already been used.");
                    }

                    // sharing the streamInfo...
                    this.streamInfo = previous.streamInfo;
                    // ... and adding our own bits
                    this.mergeStreamInfo();
                    this.previous = previous;
                    var self = this;
                    previous.on('data', function (chunk) {
                        self.processChunk(chunk);
                    });
                    previous.on('end', function () {
                        self.end();
                    });
                    previous.on('error', function (e) {
                        self.error(e);
                    });
                    return this;
                },
                /**
                 * Pause the stream so it doesn't send events anymore.
                 * @return {Boolean} true if this call paused the worker, false otherwise.
                 */
                pause: function () {
                    if (this.isPaused || this.isFinished) {
                        return false;
                    }
                    this.isPaused = true;

                    if (this.previous) {
                        this.previous.pause();
                    }
                    return true;
                },
                /**
                 * Resume a paused stream.
                 * @return {Boolean} true if this call resumed the worker, false otherwise.
                 */
                resume: function () {
                    if (!this.isPaused || this.isFinished) {
                        return false;
                    }
                    this.isPaused = false;

                    // if true, the worker tried to resume but failed
                    var withError = false;
                    if (this.generatedError) {
                        this.error(this.generatedError);
                        withError = true;
                    }
                    if (this.previous) {
                        this.previous.resume();
                    }

                    return !withError;
                },
                /**
                 * Flush any remaining bytes as the stream is ending.
                 */
                flush: function () { },
                /**
                 * Process a chunk. This is usually the method overridden.
                 * @param {Object} chunk the chunk to process.
                 */
                processChunk: function (chunk) {
                    this.push(chunk);
                },
                /**
                 * Add a key/value to be added in the workers chain streamInfo once activated.
                 * @param {String} key the key to use
                 * @param {Object} value the associated value
                 * @return {Worker} the current worker for chainability
                 */
                withStreamInfo: function (key, value) {
                    this.extraStreamInfo[key] = value;
                    this.mergeStreamInfo();
                    return this;
                },
                /**
                 * Merge this worker's streamInfo into the chain's streamInfo.
                 */
                mergeStreamInfo: function () {
                    for (var key in this.extraStreamInfo) {
                        if (!this.extraStreamInfo.hasOwnProperty(key)) {
                            continue;
                        }
                        this.streamInfo[key] = this.extraStreamInfo[key];
                    }
                },

                /**
                 * Lock the stream to prevent further updates on the workers chain.
                 * After calling this method, all calls to pipe will fail.
                 */
                lock: function () {
                    if (this.isLocked) {
                        throw new Error("The stream '" + this + "' has already been used.");
                    }
                    this.isLocked = true;
                    if (this.previous) {
                        this.previous.lock();
                    }
                },

                /**
                 *
                 * Pretty print the workers chain.
                 */
                toString: function () {
                    var me = "Worker " + this.name;
                    if (this.previous) {
                        return this.previous + " -> " + me;
                    } else {
                        return me;
                    }
                }
            };

            module.exports = GenericWorker;

        }, {}], 29: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils');
            var ConvertWorker = require('./ConvertWorker');
            var GenericWorker = require('./GenericWorker');
            var base64 = require('../base64');
            var support = require("../support");
            var external = require("../external");

            var NodejsStreamOutputAdapter = null;
            if (support.nodestream) {
                try {
                    NodejsStreamOutputAdapter = require('../nodejs/NodejsStreamOutputAdapter');
                } catch (e) { }
            }

            /**
             * Apply the final transformation of the data. If the user wants a Blob for
             * example, it's easier to work with an U8intArray and finally do the
             * ArrayBuffer/Blob conversion.
             * @param {String} resultType the name of the final type
             * @param {String} chunkType the type of the data in the given array.
             * @param {Array} dataArray the array containing the data chunks to concatenate
             * @param {String|Uint8Array|Buffer} content the content to transform
             * @param {String} mimeType the mime type of the content, if applicable.
             * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
             */
            function transformZipOutput(resultType, chunkType, dataArray, mimeType) {
                var content = null;
                switch (resultType) {
                    case "blob":
                        return utils.newBlob(dataArray, mimeType);
                    case "base64":
                        content = concat(chunkType, dataArray);
                        return base64.encode(content);
                    default:
                        content = concat(chunkType, dataArray);
                        return utils.transformTo(resultType, content);
                }
            }

            /**
             * Concatenate an array of data of the given type.
             * @param {String} type the type of the data in the given array.
             * @param {Array} dataArray the array containing the data chunks to concatenate
             * @return {String|Uint8Array|Buffer} the concatenated data
             * @throws Error if the asked type is unsupported
             */
            function concat(type, dataArray) {
                var i, index = 0, res = null, totalLength = 0;
                for (i = 0; i < dataArray.length; i++) {
                    totalLength += dataArray[i].length;
                }
                switch (type) {
                    case "string":
                        return dataArray.join("");
                    case "array":
                        return Array.prototype.concat.apply([], dataArray);
                    case "uint8array":
                        res = new Uint8Array(totalLength);
                        for (i = 0; i < dataArray.length; i++) {
                            res.set(dataArray[i], index);
                            index += dataArray[i].length;
                        }
                        return res;
                    case "nodebuffer":
                        return Buffer.concat(dataArray);
                    default:
                        throw new Error("concat : unsupported type '" + type + "'");
                }
            }

            /**
             * Listen a StreamHelper, accumulate its content and concatenate it into a
             * complete block.
             * @param {StreamHelper} helper the helper to use.
             * @param {Function} updateCallback a callback called on each update. Called
             * with one arg :
             * - the metadata linked to the update received.
             * @return Promise the promise for the accumulation.
             */
            function accumulate(helper, updateCallback) {
                return new external.Promise(function (resolve, reject) {
                    var dataArray = [];
                    var chunkType = helper._internalType,
                        resultType = helper._outputType,
                        mimeType = helper._mimeType;
                    helper
                        .on('data', function (data, meta) {
                            dataArray.push(data);
                            if (updateCallback) {
                                updateCallback(meta);
                            }
                        })
                        .on('error', function (err) {
                            dataArray = [];
                            reject(err);
                        })
                        .on('end', function () {
                            try {
                                var result = transformZipOutput(resultType, chunkType, dataArray, mimeType);
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                            dataArray = [];
                        })
                        .resume();
                });
            }

            /**
             * An helper to easily use workers outside of JSZip.
             * @constructor
             * @param {Worker} worker the worker to wrap
             * @param {String} outputType the type of data expected by the use
             * @param {String} mimeType the mime type of the content, if applicable.
             */
            function StreamHelper(worker, outputType, mimeType) {
                var internalType = outputType;
                switch (outputType) {
                    case "blob":
                        internalType = "arraybuffer";
                        break;
                    case "arraybuffer":
                        internalType = "uint8array";
                        break;
                    case "base64":
                        internalType = "string";
                        break;
                }

                try {
                    // the type used internally
                    this._internalType = internalType;
                    // the type used to output results
                    this._outputType = outputType;
                    // the mime type
                    this._mimeType = mimeType;
                    utils.checkSupport(internalType);
                    this._worker = worker.pipe(new ConvertWorker(internalType));
                    // the last workers can be rewired without issues but we need to
                    // prevent any updates on previous workers.
                    worker.lock();
                } catch (e) {
                    this._worker = new GenericWorker("error");
                    this._worker.error(e);
                }
            }

            StreamHelper.prototype = {
                /**
                 * Listen a StreamHelper, accumulate its content and concatenate it into a
                 * complete block.
                 * @param {Function} updateCb the update callback.
                 * @return Promise the promise for the accumulation.
                 */
                accumulate: function (updateCb) {
                    return accumulate(this, updateCb);
                },
                /**
                 * Add a listener on an event triggered on a stream.
                 * @param {String} evt the name of the event
                 * @param {Function} fn the listener
                 * @return {StreamHelper} the current helper.
                 */
                on: function (evt, fn) {
                    var self = this;

                    if (evt === "data") {
                        this._worker.on(evt, function (chunk) {
                            fn.call(self, chunk.data, chunk.meta);
                        });
                    } else {
                        this._worker.on(evt, function () {
                            utils.delay(fn, arguments, self);
                        });
                    }
                    return this;
                },
                /**
                 * Resume the flow of chunks.
                 * @return {StreamHelper} the current helper.
                 */
                resume: function () {
                    utils.delay(this._worker.resume, [], this._worker);
                    return this;
                },
                /**
                 * Pause the flow of chunks.
                 * @return {StreamHelper} the current helper.
                 */
                pause: function () {
                    this._worker.pause();
                    return this;
                },
                /**
                 * Return a nodejs stream for this helper.
                 * @param {Function} updateCb the update callback.
                 * @return {NodejsStreamOutputAdapter} the nodejs stream.
                 */
                toNodejsStream: function (updateCb) {
                    utils.checkSupport("nodestream");
                    if (this._outputType !== "nodebuffer") {
                        // an object stream containing blob/arraybuffer/uint8array/string
                        // is strange and I don't know if it would be useful.
                        // I you find this comment and have a good usecase, please open a
                        // bug report !
                        throw new Error(this._outputType + " is not supported by this method");
                    }

                    return new NodejsStreamOutputAdapter(this, {
                        objectMode: this._outputType !== "nodebuffer"
                    }, updateCb);
                }
            };


            module.exports = StreamHelper;

        }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function (require, module, exports) {
            'use strict';

            exports.base64 = true;
            exports.array = true;
            exports.string = true;
            exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
            exports.nodebuffer = typeof Buffer !== "undefined";
            // contains true if JSZip can read/generate Uint8Array, false otherwise.
            exports.uint8array = typeof Uint8Array !== "undefined";

            if (typeof ArrayBuffer === "undefined") {
                exports.blob = false;
            }
            else {
                var buffer = new ArrayBuffer(0);
                try {
                    exports.blob = new Blob([buffer], {
                        type: "application/zip"
                    }).size === 0;
                }
                catch (e) {
                    try {
                        var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                        var builder = new Builder();
                        builder.append(buffer);
                        exports.blob = builder.getBlob('application/zip').size === 0;
                    }
                    catch (e) {
                        exports.blob = false;
                    }
                }
            }

            try {
                exports.nodestream = !!require('readable-stream').Readable;
            } catch (e) {
                exports.nodestream = false;
            }

        }, { "readable-stream": 16 }], 31: [function (require, module, exports) {
            'use strict';

            var utils = require('./utils');
            var support = require('./support');
            var nodejsUtils = require('./nodejsUtils');
            var GenericWorker = require('./stream/GenericWorker');

            /**
             * The following functions come from pako, from pako/lib/utils/strings
             * released under the MIT license, see pako https://github.com/nodeca/pako/
             */

            // Table with utf8 lengths (calculated by first byte of sequence)
            // Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
            // because max possible codepoint is 0x10ffff
            var _utf8len = new Array(256);
            for (var i = 0; i < 256; i++) {
                _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
            }
            _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start

            // convert string to array (typed, when possible)
            var string2buf = function (str) {
                var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

                // count binary size
                for (m_pos = 0; m_pos < str_len; m_pos++) {
                    c = str.charCodeAt(m_pos);
                    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                        c2 = str.charCodeAt(m_pos + 1);
                        if ((c2 & 0xfc00) === 0xdc00) {
                            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                            m_pos++;
                        }
                    }
                    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
                }

                // allocate buffer
                if (support.uint8array) {
                    buf = new Uint8Array(buf_len);
                } else {
                    buf = new Array(buf_len);
                }

                // convert
                for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
                    c = str.charCodeAt(m_pos);
                    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                        c2 = str.charCodeAt(m_pos + 1);
                        if ((c2 & 0xfc00) === 0xdc00) {
                            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                            m_pos++;
                        }
                    }
                    if (c < 0x80) {
                        /* one byte */
                        buf[i++] = c;
                    } else if (c < 0x800) {
                        /* two bytes */
                        buf[i++] = 0xC0 | (c >>> 6);
                        buf[i++] = 0x80 | (c & 0x3f);
                    } else if (c < 0x10000) {
                        /* three bytes */
                        buf[i++] = 0xE0 | (c >>> 12);
                        buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                        buf[i++] = 0x80 | (c & 0x3f);
                    } else {
                        /* four bytes */
                        buf[i++] = 0xf0 | (c >>> 18);
                        buf[i++] = 0x80 | (c >>> 12 & 0x3f);
                        buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                        buf[i++] = 0x80 | (c & 0x3f);
                    }
                }

                return buf;
            };

            // Calculate max possible position in utf8 buffer,
            // that will not break sequence. If that's not possible
            // - (very small limits) return max size as is.
            //
            // buf[] - utf8 bytes array
            // max   - length limit (mandatory);
            var utf8border = function (buf, max) {
                var pos;

                max = max || buf.length;
                if (max > buf.length) { max = buf.length; }

                // go back from last position, until start of sequence found
                pos = max - 1;
                while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

                // Fuckup - very small and broken sequence,
                // return max, because we should return something anyway.
                if (pos < 0) { return max; }

                // If we came to start of buffer - that means vuffer is too small,
                // return max too.
                if (pos === 0) { return max; }

                return (pos + _utf8len[buf[pos]] > max) ? pos : max;
            };

            // convert array to string
            var buf2string = function (buf) {
                var str, i, out, c, c_len;
                var len = buf.length;

                // Reserve max possible length (2 words per char)
                // NB: by unknown reasons, Array is significantly faster for
                //     String.fromCharCode.apply than Uint16Array.
                var utf16buf = new Array(len * 2);

                for (out = 0, i = 0; i < len;) {
                    c = buf[i++];
                    // quick process ascii
                    if (c < 0x80) { utf16buf[out++] = c; continue; }

                    c_len = _utf8len[c];
                    // skip 5 & 6 byte codes
                    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

                    // apply mask on first byte
                    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
                    // join the rest
                    while (c_len > 1 && i < len) {
                        c = (c << 6) | (buf[i++] & 0x3f);
                        c_len--;
                    }

                    // terminated by end of string?
                    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

                    if (c < 0x10000) {
                        utf16buf[out++] = c;
                    } else {
                        c -= 0x10000;
                        utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
                        utf16buf[out++] = 0xdc00 | (c & 0x3ff);
                    }
                }

                // shrinkBuf(utf16buf, out)
                if (utf16buf.length !== out) {
                    if (utf16buf.subarray) {
                        utf16buf = utf16buf.subarray(0, out);
                    } else {
                        utf16buf.length = out;
                    }
                }

                // return String.fromCharCode.apply(null, utf16buf);
                return utils.applyFromCharCode(utf16buf);
            };


            // That's all for the pako functions.


            /**
             * Transform a javascript string into an array (typed if possible) of bytes,
             * UTF-8 encoded.
             * @param {String} str the string to encode
             * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
             */
            exports.utf8encode = function utf8encode(str) {
                if (support.nodebuffer) {
                    return nodejsUtils.newBuffer(str, "utf-8");
                }

                return string2buf(str);
            };


            /**
             * Transform a bytes array (or a representation) representing an UTF-8 encoded
             * string into a javascript string.
             * @param {Array|Uint8Array|Buffer} buf the data de decode
             * @return {String} the decoded string.
             */
            exports.utf8decode = function utf8decode(buf) {
                if (support.nodebuffer) {
                    return utils.transformTo("nodebuffer", buf).toString("utf-8");
                }

                buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

                return buf2string(buf);
            };

            /**
             * A worker to decode utf8 encoded binary chunks into string chunks.
             * @constructor
             */
            function Utf8DecodeWorker() {
                GenericWorker.call(this, "utf-8 decode");
                // the last bytes if a chunk didn't end with a complete codepoint.
                this.leftOver = null;
            }
            utils.inherits(Utf8DecodeWorker, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            Utf8DecodeWorker.prototype.processChunk = function (chunk) {

                var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);

                // 1st step, re-use what's left of the previous chunk
                if (this.leftOver && this.leftOver.length) {
                    if (support.uint8array) {
                        var previousData = data;
                        data = new Uint8Array(previousData.length + this.leftOver.length);
                        data.set(this.leftOver, 0);
                        data.set(previousData, this.leftOver.length);
                    } else {
                        data = this.leftOver.concat(data);
                    }
                    this.leftOver = null;
                }

                var nextBoundary = utf8border(data);
                var usableData = data;
                if (nextBoundary !== data.length) {
                    if (support.uint8array) {
                        usableData = data.subarray(0, nextBoundary);
                        this.leftOver = data.subarray(nextBoundary, data.length);
                    } else {
                        usableData = data.slice(0, nextBoundary);
                        this.leftOver = data.slice(nextBoundary, data.length);
                    }
                }

                this.push({
                    data: exports.utf8decode(usableData),
                    meta: chunk.meta
                });
            };

            /**
             * @see GenericWorker.flush
             */
            Utf8DecodeWorker.prototype.flush = function () {
                if (this.leftOver && this.leftOver.length) {
                    this.push({
                        data: exports.utf8decode(this.leftOver),
                        meta: {}
                    });
                    this.leftOver = null;
                }
            };
            exports.Utf8DecodeWorker = Utf8DecodeWorker;

            /**
             * A worker to endcode string chunks into utf8 encoded binary chunks.
             * @constructor
             */
            function Utf8EncodeWorker() {
                GenericWorker.call(this, "utf-8 encode");
            }
            utils.inherits(Utf8EncodeWorker, GenericWorker);

            /**
             * @see GenericWorker.processChunk
             */
            Utf8EncodeWorker.prototype.processChunk = function (chunk) {
                this.push({
                    data: exports.utf8encode(chunk.data),
                    meta: chunk.meta
                });
            };
            exports.Utf8EncodeWorker = Utf8EncodeWorker;

        }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function (require, module, exports) {
            'use strict';

            var support = require('./support');
            var base64 = require('./base64');
            var nodejsUtils = require('./nodejsUtils');
            var setImmediate = require('core-js/library/fn/set-immediate');
            var external = require("./external");


            /**
             * Convert a string that pass as a "binary string": it should represent a byte
             * array but may have > 255 char codes. Be sure to take only the first byte
             * and returns the byte array.
             * @param {String} str the string to transform.
             * @return {Array|Uint8Array} the string in a binary format.
             */
            function string2binary(str) {
                var result = null;
                if (support.uint8array) {
                    result = new Uint8Array(str.length);
                } else {
                    result = new Array(str.length);
                }
                return stringToArrayLike(str, result);
            }

            /**
             * Create a new blob with the given content and the given type.
             * @param {Array[String|ArrayBuffer]} parts the content to put in the blob. DO NOT use
             * an Uint8Array because the stock browser of android 4 won't accept it (it
             * will be silently converted to a string, "[object Uint8Array]").
             * @param {String} type the mime type of the blob.
             * @return {Blob} the created blob.
             */
            exports.newBlob = function (parts, type) {
                exports.checkSupport("blob");

                try {
                    // Blob constructor
                    return new Blob(parts, {
                        type: type
                    });
                }
                catch (e) {

                    try {
                        // deprecated, browser only, old way
                        var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                        var builder = new Builder();
                        for (var i = 0; i < parts.length; i++) {
                            builder.append(parts[i]);
                        }
                        return builder.getBlob(type);
                    }
                    catch (e) {

                        // well, fuck ?!
                        throw new Error("Bug : can't construct the Blob.");
                    }
                }


            };
            /**
             * The identity function.
             * @param {Object} input the input.
             * @return {Object} the same input.
             */
            function identity(input) {
                return input;
            }

            /**
             * Fill in an array with a string.
             * @param {String} str the string to use.
             * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
             * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
             */
            function stringToArrayLike(str, array) {
                for (var i = 0; i < str.length; ++i) {
                    array[i] = str.charCodeAt(i) & 0xFF;
                }
                return array;
            }

            /**
             * An helper for the function arrayLikeToString.
             * This contains static informations and functions that
             * can be optimized by the browser JIT compiler.
             */
            var arrayToStringHelper = {
                /**
                 * Transform an array of int into a string, chunk by chunk.
                 * See the performances notes on arrayLikeToString.
                 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
                 * @param {String} type the type of the array.
                 * @param {Integer} chunk the chunk size.
                 * @return {String} the resulting string.
                 * @throws Error if the chunk is too big for the stack.
                 */
                stringifyByChunk: function (array, type, chunk) {
                    var result = [], k = 0, len = array.length;
                    // shortcut
                    if (len <= chunk) {
                        return String.fromCharCode.apply(null, array);
                    }
                    while (k < len) {
                        if (type === "array" || type === "nodebuffer") {
                            result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
                        }
                        else {
                            result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
                        }
                        k += chunk;
                    }
                    return result.join("");
                },
                /**
                 * Call String.fromCharCode on every item in the array.
                 * This is the naive implementation, which generate A LOT of intermediate string.
                 * This should be used when everything else fail.
                 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
                 * @return {String} the result.
                 */
                stringifyByChar: function (array) {
                    var resultStr = "";
                    for (var i = 0; i < array.length; i++) {
                        resultStr += String.fromCharCode(array[i]);
                    }
                    return resultStr;
                },
                applyCanBeUsed: {
                    /**
                     * true if the browser accepts to use String.fromCharCode on Uint8Array
                     */
                    uint8array: (function () {
                        try {
                            return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
                        } catch (e) {
                            return false;
                        }
                    })(),
                    /**
                     * true if the browser accepts to use String.fromCharCode on nodejs Buffer.
                     */
                    nodebuffer: (function () {
                        try {
                            return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.newBuffer(1)).length === 1;
                        } catch (e) {
                            return false;
                        }
                    })()
                }
            };

            /**
             * Transform an array-like object to a string.
             * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
             * @return {String} the result.
             */
            function arrayLikeToString(array) {
                // Performances notes :
                // --------------------
                // String.fromCharCode.apply(null, array) is the fastest, see
                // see http://jsperf.com/converting-a-uint8array-to-a-string/2
                // but the stack is limited (and we can get huge arrays !).
                //
                // result += String.fromCharCode(array[i]); generate too many strings !
                //
                // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
                // TODO : we now have workers that split the work. Do we still need that ?
                var chunk = 65536,
                    type = exports.getTypeOf(array),
                    canUseApply = true;
                if (type === "uint8array") {
                    canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
                } else if (type === "nodebuffer") {
                    canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
                }

                if (canUseApply) {
                    while (chunk > 1) {
                        try {
                            return arrayToStringHelper.stringifyByChunk(array, type, chunk);
                        } catch (e) {
                            chunk = Math.floor(chunk / 2);
                        }
                    }
                }

                // no apply or chunk error : slow and painful algorithm
                // default browser on android 4.*
                return arrayToStringHelper.stringifyByChar(array);
            }

            exports.applyFromCharCode = arrayLikeToString;


            /**
             * Copy the data from an array-like to an other array-like.
             * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
             * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
             * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
             */
            function arrayLikeToArrayLike(arrayFrom, arrayTo) {
                for (var i = 0; i < arrayFrom.length; i++) {
                    arrayTo[i] = arrayFrom[i];
                }
                return arrayTo;
            }

            // a matrix containing functions to transform everything into everything.
            var transform = {};

            // string to ?
            transform["string"] = {
                "string": identity,
                "array": function (input) {
                    return stringToArrayLike(input, new Array(input.length));
                },
                "arraybuffer": function (input) {
                    return transform["string"]["uint8array"](input).buffer;
                },
                "uint8array": function (input) {
                    return stringToArrayLike(input, new Uint8Array(input.length));
                },
                "nodebuffer": function (input) {
                    return stringToArrayLike(input, nodejsUtils.newBuffer(input.length));
                }
            };

            // array to ?
            transform["array"] = {
                "string": arrayLikeToString,
                "array": identity,
                "arraybuffer": function (input) {
                    return (new Uint8Array(input)).buffer;
                },
                "uint8array": function (input) {
                    return new Uint8Array(input);
                },
                "nodebuffer": function (input) {
                    return nodejsUtils.newBuffer(input);
                }
            };

            // arraybuffer to ?
            transform["arraybuffer"] = {
                "string": function (input) {
                    return arrayLikeToString(new Uint8Array(input));
                },
                "array": function (input) {
                    return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
                },
                "arraybuffer": identity,
                "uint8array": function (input) {
                    return new Uint8Array(input);
                },
                "nodebuffer": function (input) {
                    return nodejsUtils.newBuffer(new Uint8Array(input));
                }
            };

            // uint8array to ?
            transform["uint8array"] = {
                "string": arrayLikeToString,
                "array": function (input) {
                    return arrayLikeToArrayLike(input, new Array(input.length));
                },
                "arraybuffer": function (input) {
                    // copy the uint8array: DO NOT propagate the original ArrayBuffer, it
                    // can be way larger (the whole zip file for example).
                    var copy = new Uint8Array(input.length);
                    if (input.length) {
                        copy.set(input, 0);
                    }
                    return copy.buffer;
                },
                "uint8array": identity,
                "nodebuffer": function (input) {
                    return nodejsUtils.newBuffer(input);
                }
            };

            // nodebuffer to ?
            transform["nodebuffer"] = {
                "string": arrayLikeToString,
                "array": function (input) {
                    return arrayLikeToArrayLike(input, new Array(input.length));
                },
                "arraybuffer": function (input) {
                    return transform["nodebuffer"]["uint8array"](input).buffer;
                },
                "uint8array": function (input) {
                    return arrayLikeToArrayLike(input, new Uint8Array(input.length));
                },
                "nodebuffer": identity
            };

            /**
             * Transform an input into any type.
             * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
             * If no output type is specified, the unmodified input will be returned.
             * @param {String} outputType the output type.
             * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
             * @throws {Error} an Error if the browser doesn't support the requested output type.
             */
            exports.transformTo = function (outputType, input) {
                if (!input) {
                    // undefined, null, etc
                    // an empty string won't harm.
                    input = "";
                }
                if (!outputType) {
                    return input;
                }
                exports.checkSupport(outputType);
                var inputType = exports.getTypeOf(input);
                var result = transform[inputType][outputType](input);
                return result;
            };

            /**
             * Return the type of the input.
             * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
             * @param {Object} input the input to identify.
             * @return {String} the (lowercase) type of the input.
             */
            exports.getTypeOf = function (input) {
                if (typeof input === "string") {
                    return "string";
                }
                if (Object.prototype.toString.call(input) === "[object Array]") {
                    return "array";
                }
                if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
                    return "nodebuffer";
                }
                if (support.uint8array && input instanceof Uint8Array) {
                    return "uint8array";
                }
                if (support.arraybuffer && input instanceof ArrayBuffer) {
                    return "arraybuffer";
                }
            };

            /**
             * Throw an exception if the type is not supported.
             * @param {String} type the type to check.
             * @throws {Error} an Error if the browser doesn't support the requested type.
             */
            exports.checkSupport = function (type) {
                var supported = support[type.toLowerCase()];
                if (!supported) {
                    throw new Error(type + " is not supported by this platform");
                }
            };

            exports.MAX_VALUE_16BITS = 65535;
            exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

            /**
             * Prettify a string read as binary.
             * @param {string} str the string to prettify.
             * @return {string} a pretty string.
             */
            exports.pretty = function (str) {
                var res = '',
                    code, i;
                for (i = 0; i < (str || "").length; i++) {
                    code = str.charCodeAt(i);
                    res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
                }
                return res;
            };

            /**
             * Defer the call of a function.
             * @param {Function} callback the function to call asynchronously.
             * @param {Array} args the arguments to give to the callback.
             */
            exports.delay = function (callback, args, self) {
                setImmediate(function () {
                    callback.apply(self || null, args || []);
                });
            };

            /**
             * Extends a prototype with an other, without calling a constructor with
             * side effects. Inspired by nodejs' `utils.inherits`
             * @param {Function} ctor the constructor to augment
             * @param {Function} superCtor the parent constructor to use
             */
            exports.inherits = function (ctor, superCtor) {
                var Obj = function () { };
                Obj.prototype = superCtor.prototype;
                ctor.prototype = new Obj();
            };

            /**
             * Merge the objects passed as parameters into a new one.
             * @private
             * @param {...Object} var_args All objects to merge.
             * @return {Object} a new object with the data of the others.
             */
            exports.extend = function () {
                var result = {}, i, attr;
                for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
                    for (attr in arguments[i]) {
                        if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
                            result[attr] = arguments[i][attr];
                        }
                    }
                }
                return result;
            };

            /**
             * Transform arbitrary content into a Promise.
             * @param {String} name a name for the content being processed.
             * @param {Object} inputData the content to process.
             * @param {Boolean} isBinary true if the content is not an unicode string
             * @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
             * @param {Boolean} isBase64 true if the string content is encoded with base64.
             * @return {Promise} a promise in a format usable by JSZip.
             */
            exports.prepareContent = function (name, inputData, isBinary, isOptimizedBinaryString, isBase64) {

                // if inputData is already a promise, this flatten it.
                var promise = external.Promise.resolve(inputData).then(function (data) {


                    var isBlob = support.blob && (data instanceof Blob || ['[object File]', '[object Blob]'].indexOf(Object.prototype.toString.call(data)) !== -1);

                    if (isBlob && typeof FileReader !== "undefined") {
                        return new external.Promise(function (resolve, reject) {
                            var reader = new FileReader();

                            reader.onload = function (e) {
                                resolve(e.target.result);
                            };
                            reader.onerror = function (e) {
                                reject(e.target.error);
                            };
                            reader.readAsArrayBuffer(data);
                        });
                    } else {
                        return data;
                    }
                });

                return promise.then(function (data) {
                    var dataType = exports.getTypeOf(data);

                    if (!dataType) {
                        return external.Promise.reject(
                            new Error("The data of '" + name + "' is in an unsupported format !")
                        );
                    }
                    // special case : it's way easier to work with Uint8Array than with ArrayBuffer
                    if (dataType === "arraybuffer") {
                        data = exports.transformTo("uint8array", data);
                    } else if (dataType === "string") {
                        if (isBase64) {
                            data = base64.decode(data);
                        }
                        else if (isBinary) {
                            // optimizedBinaryString === true means that the file has already been filtered with a 0xFF mask
                            if (isOptimizedBinaryString !== true) {
                                // this is a string, not in a base64 format.
                                // Be sure that this is a correct "binary string"
                                data = string2binary(data);
                            }
                        }
                    }
                    return data;
                });
            };

        }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, "core-js/library/fn/set-immediate": 36 }], 33: [function (require, module, exports) {
            'use strict';
            var readerFor = require('./reader/readerFor');
            var utils = require('./utils');
            var sig = require('./signature');
            var ZipEntry = require('./zipEntry');
            var utf8 = require('./utf8');
            var support = require('./support');
            //  class ZipEntries {{{
            /**
             * All the entries in the zip file.
             * @constructor
             * @param {Object} loadOptions Options for loading the stream.
             */
            function ZipEntries(loadOptions) {
                this.files = [];
                this.loadOptions = loadOptions;
            }
            ZipEntries.prototype = {
                /**
                 * Check that the reader is on the speficied signature.
                 * @param {string} expectedSignature the expected signature.
                 * @throws {Error} if it is an other signature.
                 */
                checkSignature: function (expectedSignature) {
                    if (!this.reader.readAndCheckSignature(expectedSignature)) {
                        this.reader.index -= 4;
                        var signature = this.reader.readString(4);
                        throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
                    }
                },
                /**
                 * Check if the given signature is at the given index.
                 * @param {number} askedIndex the index to check.
                 * @param {string} expectedSignature the signature to expect.
                 * @return {boolean} true if the signature is here, false otherwise.
                 */
                isSignature: function (askedIndex, expectedSignature) {
                    var currentIndex = this.reader.index;
                    this.reader.setIndex(askedIndex);
                    var signature = this.reader.readString(4);
                    var result = signature === expectedSignature;
                    this.reader.setIndex(currentIndex);
                    return result;
                },
                /**
                 * Read the end of the central directory.
                 */
                readBlockEndOfCentral: function () {
                    this.diskNumber = this.reader.readInt(2);
                    this.diskWithCentralDirStart = this.reader.readInt(2);
                    this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
                    this.centralDirRecords = this.reader.readInt(2);
                    this.centralDirSize = this.reader.readInt(4);
                    this.centralDirOffset = this.reader.readInt(4);

                    this.zipCommentLength = this.reader.readInt(2);
                    // warning : the encoding depends of the system locale
                    // On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
                    // On a windows machine, this field is encoded with the localized windows code page.
                    var zipComment = this.reader.readData(this.zipCommentLength);
                    var decodeParamType = support.uint8array ? "uint8array" : "array";
                    // To get consistent behavior with the generation part, we will assume that
                    // this is utf8 encoded unless specified otherwise.
                    var decodeContent = utils.transformTo(decodeParamType, zipComment);
                    this.zipComment = this.loadOptions.decodeFileName(decodeContent);
                },
                /**
                 * Read the end of the Zip 64 central directory.
                 * Not merged with the method readEndOfCentral :
                 * The end of central can coexist with its Zip64 brother,
                 * I don't want to read the wrong number of bytes !
                 */
                readBlockZip64EndOfCentral: function () {
                    this.zip64EndOfCentralSize = this.reader.readInt(8);
                    this.reader.skip(4);
                    // this.versionMadeBy = this.reader.readString(2);
                    // this.versionNeeded = this.reader.readInt(2);
                    this.diskNumber = this.reader.readInt(4);
                    this.diskWithCentralDirStart = this.reader.readInt(4);
                    this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
                    this.centralDirRecords = this.reader.readInt(8);
                    this.centralDirSize = this.reader.readInt(8);
                    this.centralDirOffset = this.reader.readInt(8);

                    this.zip64ExtensibleData = {};
                    var extraDataSize = this.zip64EndOfCentralSize - 44,
                        index = 0,
                        extraFieldId,
                        extraFieldLength,
                        extraFieldValue;
                    while (index < extraDataSize) {
                        extraFieldId = this.reader.readInt(2);
                        extraFieldLength = this.reader.readInt(4);
                        extraFieldValue = this.reader.readData(extraFieldLength);
                        this.zip64ExtensibleData[extraFieldId] = {
                            id: extraFieldId,
                            length: extraFieldLength,
                            value: extraFieldValue
                        };
                    }
                },
                /**
                 * Read the end of the Zip 64 central directory locator.
                 */
                readBlockZip64EndOfCentralLocator: function () {
                    this.diskWithZip64CentralDirStart = this.reader.readInt(4);
                    this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
                    this.disksCount = this.reader.readInt(4);
                    if (this.disksCount > 1) {
                        throw new Error("Multi-volumes zip are not supported");
                    }
                },
                /**
                 * Read the local files, based on the offset read in the central part.
                 */
                readLocalFiles: function () {
                    var i, file;
                    for (i = 0; i < this.files.length; i++) {
                        file = this.files[i];
                        this.reader.setIndex(file.localHeaderOffset);
                        this.checkSignature(sig.LOCAL_FILE_HEADER);
                        file.readLocalPart(this.reader);
                        file.handleUTF8();
                        file.processAttributes();
                    }
                },
                /**
                 * Read the central directory.
                 */
                readCentralDir: function () {
                    var file;

                    this.reader.setIndex(this.centralDirOffset);
                    while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
                        file = new ZipEntry({
                            zip64: this.zip64
                        }, this.loadOptions);
                        file.readCentralPart(this.reader);
                        this.files.push(file);
                    }

                    if (this.centralDirRecords !== this.files.length) {
                        if (this.centralDirRecords !== 0 && this.files.length === 0) {
                            // We expected some records but couldn't find ANY.
                            // This is really suspicious, as if something went wrong.
                            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
                        } else {
                            // We found some records but not all.
                            // Something is wrong but we got something for the user: no error here.
                            // console.warn("expected", this.centralDirRecords, "records in central dir, got", this.files.length);
                        }
                    }
                },
                /**
                 * Read the end of central directory.
                 */
                readEndOfCentral: function () {
                    var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
                    if (offset < 0) {
                        // Check if the content is a truncated zip or complete garbage.
                        // A "LOCAL_FILE_HEADER" is not required at the beginning (auto
                        // extractible zip for example) but it can give a good hint.
                        // If an ajax request was used without responseType, we will also
                        // get unreadable data.
                        var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);

                        if (isGarbage) {
                            throw new Error("Can't find end of central directory : is this a zip file ? " +
                                "If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html");
                        } else {
                            throw new Error("Corrupted zip : can't find end of central directory");
                        }

                    }
                    this.reader.setIndex(offset);
                    var endOfCentralDirOffset = offset;
                    this.checkSignature(sig.CENTRAL_DIRECTORY_END);
                    this.readBlockEndOfCentral();


                    /* extract from the zip spec :
                        4)  If one of the fields in the end of central directory
                            record is too small to hold required data, the field
                            should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                            ZIP64 format record should be created.
                        5)  The end of central directory record and the
                            Zip64 end of central directory locator record must
                            reside on the same disk when splitting or spanning
                            an archive.
                     */
                    if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
                        this.zip64 = true;

                        /*
                        Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
                        the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
                        all numbers as 64-bit double precision IEEE 754 floating point numbers.
                        So, we have 53bits for integers and bitwise operations treat everything as 32bits.
                        see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
                        and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
                        */

                        // should look for a zip64 EOCD locator
                        offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                        if (offset < 0) {
                            throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
                        }
                        this.reader.setIndex(offset);
                        this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                        this.readBlockZip64EndOfCentralLocator();

                        // now the zip64 EOCD record
                        if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
                            // console.warn("ZIP64 end of central directory not where expected.");
                            this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                            if (this.relativeOffsetEndOfZip64CentralDir < 0) {
                                throw new Error("Corrupted zip : can't find the ZIP64 end of central directory");
                            }
                        }
                        this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
                        this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                        this.readBlockZip64EndOfCentral();
                    }

                    var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
                    if (this.zip64) {
                        expectedEndOfCentralDirOffset += 20; // end of central dir 64 locator
                        expectedEndOfCentralDirOffset += 12 /* should not include the leading 12 bytes */ + this.zip64EndOfCentralSize;
                    }

                    var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;

                    if (extraBytes > 0) {
                        // console.warn(extraBytes, "extra bytes at beginning or within zipfile");
                        if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
                            // The offsets seem wrong, but we have something at the specified offset.
                            // So… we keep it.
                        } else {
                            // the offset is wrong, update the "zero" of the reader
                            // this happens if data has been prepended (crx files for example)
                            this.reader.zero = extraBytes;
                        }
                    } else if (extraBytes < 0) {
                        throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
                    }
                },
                prepareReader: function (data) {
                    this.reader = readerFor(data);
                },
                /**
                 * Read a zip file and create ZipEntries.
                 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
                 */
                load: function (data) {
                    this.prepareReader(data);
                    this.readEndOfCentral();
                    this.readCentralDir();
                    this.readLocalFiles();
                }
            };
            // }}} end of ZipEntries
            module.exports = ZipEntries;

        }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utf8": 31, "./utils": 32, "./zipEntry": 34 }], 34: [function (require, module, exports) {
            'use strict';
            var readerFor = require('./reader/readerFor');
            var utils = require('./utils');
            var CompressedObject = require('./compressedObject');
            var crc32fn = require('./crc32');
            var utf8 = require('./utf8');
            var compressions = require('./compressions');
            var support = require('./support');

            var MADE_BY_DOS = 0x00;
            var MADE_BY_UNIX = 0x03;

            /**
             * Find a compression registered in JSZip.
             * @param {string} compressionMethod the method magic to find.
             * @return {Object|null} the JSZip compression object, null if none found.
             */
            var findCompression = function (compressionMethod) {
                for (var method in compressions) {
                    if (!compressions.hasOwnProperty(method)) {
                        continue;
                    }
                    if (compressions[method].magic === compressionMethod) {
                        return compressions[method];
                    }
                }
                return null;
            };

            // class ZipEntry {{{
            /**
             * An entry in the zip file.
             * @constructor
             * @param {Object} options Options of the current file.
             * @param {Object} loadOptions Options for loading the stream.
             */
            function ZipEntry(options, loadOptions) {
                this.options = options;
                this.loadOptions = loadOptions;
            }
            ZipEntry.prototype = {
                /**
                 * say if the file is encrypted.
                 * @return {boolean} true if the file is encrypted, false otherwise.
                 */
                isEncrypted: function () {
                    // bit 1 is set
                    return (this.bitFlag & 0x0001) === 0x0001;
                },
                /**
                 * say if the file has utf-8 filename/comment.
                 * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
                 */
                useUTF8: function () {
                    // bit 11 is set
                    return (this.bitFlag & 0x0800) === 0x0800;
                },
                /**
                 * Read the local part of a zip file and add the info in this object.
                 * @param {DataReader} reader the reader to use.
                 */
                readLocalPart: function (reader) {
                    var compression, localExtraFieldsLength;

                    // we already know everything from the central dir !
                    // If the central dir data are false, we are doomed.
                    // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
                    // The less data we get here, the more reliable this should be.
                    // Let's skip the whole header and dash to the data !
                    reader.skip(22);
                    // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
                    // Strangely, the filename here is OK.
                    // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
                    // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
                    // Search "unzip mismatching "local" filename continuing with "central" filename version" on
                    // the internet.
                    //
                    // I think I see the logic here : the central directory is used to display
                    // content and the local directory is used to extract the files. Mixing / and \
                    // may be used to display \ to windows users and use / when extracting the files.
                    // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
                    this.fileNameLength = reader.readInt(2);
                    localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
                    // the fileName is stored as binary data, the handleUTF8 method will take care of the encoding.
                    this.fileName = reader.readData(this.fileNameLength);
                    reader.skip(localExtraFieldsLength);

                    if (this.compressedSize === -1 || this.uncompressedSize === -1) {
                        throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize === -1 || uncompressedSize === -1)");
                    }

                    compression = findCompression(this.compressionMethod);
                    if (compression === null) { // no compression found
                        throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
                    }
                    this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
                },

                /**
                 * Read the central part of a zip file and add the info in this object.
                 * @param {DataReader} reader the reader to use.
                 */
                readCentralPart: function (reader) {
                    this.versionMadeBy = reader.readInt(2);
                    reader.skip(2);
                    // this.versionNeeded = reader.readInt(2);
                    this.bitFlag = reader.readInt(2);
                    this.compressionMethod = reader.readString(2);
                    this.date = reader.readDate();
                    this.crc32 = reader.readInt(4);
                    this.compressedSize = reader.readInt(4);
                    this.uncompressedSize = reader.readInt(4);
                    var fileNameLength = reader.readInt(2);
                    this.extraFieldsLength = reader.readInt(2);
                    this.fileCommentLength = reader.readInt(2);
                    this.diskNumberStart = reader.readInt(2);
                    this.internalFileAttributes = reader.readInt(2);
                    this.externalFileAttributes = reader.readInt(4);
                    this.localHeaderOffset = reader.readInt(4);

                    if (this.isEncrypted()) {
                        throw new Error("Encrypted zip are not supported");
                    }

                    // will be read in the local part, see the comments there
                    reader.skip(fileNameLength);
                    this.readExtraFields(reader);
                    this.parseZIP64ExtraField(reader);
                    this.fileComment = reader.readData(this.fileCommentLength);
                },

                /**
                 * Parse the external file attributes and get the unix/dos permissions.
                 */
                processAttributes: function () {
                    this.unixPermissions = null;
                    this.dosPermissions = null;
                    var madeBy = this.versionMadeBy >> 8;

                    // Check if we have the DOS directory flag set.
                    // We look for it in the DOS and UNIX permissions
                    // but some unknown platform could set it as a compatibility flag.
                    this.dir = this.externalFileAttributes & 0x0010 ? true : false;

                    if (madeBy === MADE_BY_DOS) {
                        // first 6 bits (0 to 5)
                        this.dosPermissions = this.externalFileAttributes & 0x3F;
                    }

                    if (madeBy === MADE_BY_UNIX) {
                        this.unixPermissions = (this.externalFileAttributes >> 16) & 0xFFFF;
                        // the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
                    }

                    // fail safe : if the name ends with a / it probably means a folder
                    if (!this.dir && this.fileNameStr.slice(-1) === '/') {
                        this.dir = true;
                    }
                },

                /**
                 * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
                 * @param {DataReader} reader the reader to use.
                 */
                parseZIP64ExtraField: function (reader) {

                    if (!this.extraFields[0x0001]) {
                        return;
                    }

                    // should be something, preparing the extra reader
                    var extraReader = readerFor(this.extraFields[0x0001].value);

                    // I really hope that these 64bits integer can fit in 32 bits integer, because js
                    // won't let us have more.
                    if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
                        this.uncompressedSize = extraReader.readInt(8);
                    }
                    if (this.compressedSize === utils.MAX_VALUE_32BITS) {
                        this.compressedSize = extraReader.readInt(8);
                    }
                    if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
                        this.localHeaderOffset = extraReader.readInt(8);
                    }
                    if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
                        this.diskNumberStart = extraReader.readInt(4);
                    }
                },
                /**
                 * Read the central part of a zip file and add the info in this object.
                 * @param {DataReader} reader the reader to use.
                 */
                readExtraFields: function (reader) {
                    var end = reader.index + this.extraFieldsLength,
                        extraFieldId,
                        extraFieldLength,
                        extraFieldValue;

                    if (!this.extraFields) {
                        this.extraFields = {};
                    }

                    while (reader.index < end) {
                        extraFieldId = reader.readInt(2);
                        extraFieldLength = reader.readInt(2);
                        extraFieldValue = reader.readData(extraFieldLength);

                        this.extraFields[extraFieldId] = {
                            id: extraFieldId,
                            length: extraFieldLength,
                            value: extraFieldValue
                        };
                    }
                },
                /**
                 * Apply an UTF8 transformation if needed.
                 */
                handleUTF8: function () {
                    var decodeParamType = support.uint8array ? "uint8array" : "array";
                    if (this.useUTF8()) {
                        this.fileNameStr = utf8.utf8decode(this.fileName);
                        this.fileCommentStr = utf8.utf8decode(this.fileComment);
                    } else {
                        var upath = this.findExtraFieldUnicodePath();
                        if (upath !== null) {
                            this.fileNameStr = upath;
                        } else {
                            // ASCII text or unsupported code page
                            var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
                            this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
                        }

                        var ucomment = this.findExtraFieldUnicodeComment();
                        if (ucomment !== null) {
                            this.fileCommentStr = ucomment;
                        } else {
                            // ASCII text or unsupported code page
                            var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
                            this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
                        }
                    }
                },

                /**
                 * Find the unicode path declared in the extra field, if any.
                 * @return {String} the unicode path, null otherwise.
                 */
                findExtraFieldUnicodePath: function () {
                    var upathField = this.extraFields[0x7075];
                    if (upathField) {
                        var extraReader = readerFor(upathField.value);

                        // wrong version
                        if (extraReader.readInt(1) !== 1) {
                            return null;
                        }

                        // the crc of the filename changed, this field is out of date.
                        if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
                            return null;
                        }

                        return utf8.utf8decode(extraReader.readData(upathField.length - 5));
                    }
                    return null;
                },

                /**
                 * Find the unicode comment declared in the extra field, if any.
                 * @return {String} the unicode comment, null otherwise.
                 */
                findExtraFieldUnicodeComment: function () {
                    var ucommentField = this.extraFields[0x6375];
                    if (ucommentField) {
                        var extraReader = readerFor(ucommentField.value);

                        // wrong version
                        if (extraReader.readInt(1) !== 1) {
                            return null;
                        }

                        // the crc of the comment changed, this field is out of date.
                        if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
                            return null;
                        }

                        return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
                    }
                    return null;
                }
            };
            module.exports = ZipEntry;

        }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function (require, module, exports) {
            'use strict';

            var StreamHelper = require('./stream/StreamHelper');
            var DataWorker = require('./stream/DataWorker');
            var utf8 = require('./utf8');
            var CompressedObject = require('./compressedObject');
            var GenericWorker = require('./stream/GenericWorker');

            /**
             * A simple object representing a file in the zip file.
             * @constructor
             * @param {string} name the name of the file
             * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
             * @param {Object} options the options of the file
             */
            var ZipObject = function (name, data, options) {
                this.name = name;
                this.dir = options.dir;
                this.date = options.date;
                this.comment = options.comment;
                this.unixPermissions = options.unixPermissions;
                this.dosPermissions = options.dosPermissions;

                this._data = data;
                this._dataBinary = options.binary;
                // keep only the compression
                this.options = {
                    compression: options.compression,
                    compressionOptions: options.compressionOptions
                };
            };

            ZipObject.prototype = {
                /**
                 * Create an internal stream for the content of this object.
                 * @param {String} type the type of each chunk.
                 * @return StreamHelper the stream.
                 */
                internalStream: function (type) {
                    var outputType = type.toLowerCase();
                    var askUnicodeString = outputType === "string" || outputType === "text";
                    if (outputType === "binarystring" || outputType === "text") {
                        outputType = "string";
                    }
                    var result = this._decompressWorker();

                    var isUnicodeString = !this._dataBinary;

                    if (isUnicodeString && !askUnicodeString) {
                        result = result.pipe(new utf8.Utf8EncodeWorker());
                    }
                    if (!isUnicodeString && askUnicodeString) {
                        result = result.pipe(new utf8.Utf8DecodeWorker());
                    }

                    return new StreamHelper(result, outputType, "");
                },

                /**
                 * Prepare the content in the asked type.
                 * @param {String} type the type of the result.
                 * @param {Function} onUpdate a function to call on each internal update.
                 * @return Promise the promise of the result.
                 */
                async: function (type, onUpdate) {
                    return this.internalStream(type).accumulate(onUpdate);
                },

                /**
                 * Prepare the content as a nodejs stream.
                 * @param {String} type the type of each chunk.
                 * @param {Function} onUpdate a function to call on each internal update.
                 * @return Stream the stream.
                 */
                nodeStream: function (type, onUpdate) {
                    return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
                },

                /**
                 * Return a worker for the compressed content.
                 * @private
                 * @param {Object} compression the compression object to use.
                 * @param {Object} compressionOptions the options to use when compressing.
                 * @return Worker the worker.
                 */
                _compressWorker: function (compression, compressionOptions) {
                    if (
                        this._data instanceof CompressedObject &&
                        this._data.compression.magic === compression.magic
                    ) {
                        return this._data.getCompressedWorker();
                    } else {
                        var result = this._decompressWorker();
                        if (!this._dataBinary) {
                            result = result.pipe(new utf8.Utf8EncodeWorker());
                        }
                        return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
                    }
                },
                /**
                 * Return a worker for the decompressed content.
                 * @private
                 * @return Worker the worker.
                 */
                _decompressWorker: function () {
                    if (this._data instanceof CompressedObject) {
                        return this._data.getContentWorker();
                    } else if (this._data instanceof GenericWorker) {
                        return this._data;
                    } else {
                        return new DataWorker(this._data);
                    }
                }
            };

            var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
            var removedFn = function () {
                throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
            };

            for (var i = 0; i < removedMethods.length; i++) {
                ZipObject.prototype[removedMethods[i]] = removedFn;
            }
            module.exports = ZipObject;

        }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function (require, module, exports) {
            require('../modules/web.immediate');
            module.exports = require('../modules/_core').setImmediate;
        }, { "../modules/_core": 40, "../modules/web.immediate": 56 }], 37: [function (require, module, exports) {
            module.exports = function (it) {
                if (typeof it != 'function') throw TypeError(it + ' is not a function!');
                return it;
            };
        }, {}], 38: [function (require, module, exports) {
            var isObject = require('./_is-object');
            module.exports = function (it) {
                if (!isObject(it)) throw TypeError(it + ' is not an object!');
                return it;
            };
        }, { "./_is-object": 51 }], 39: [function (require, module, exports) {
            var toString = {}.toString;

            module.exports = function (it) {
                return toString.call(it).slice(8, -1);
            };
        }, {}], 40: [function (require, module, exports) {
            var core = module.exports = { version: '2.3.0' };
            if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
        }, {}], 41: [function (require, module, exports) {
            // optional / simple context binding
            var aFunction = require('./_a-function');
            module.exports = function (fn, that, length) {
                aFunction(fn);
                if (that === undefined) return fn;
                switch (length) {
                    case 1: return function (a) {
                        return fn.call(that, a);
                    };
                    case 2: return function (a, b) {
                        return fn.call(that, a, b);
                    };
                    case 3: return function (a, b, c) {
                        return fn.call(that, a, b, c);
                    };
                }
                return function (/* ...args */) {
                    return fn.apply(that, arguments);
                };
            };
        }, { "./_a-function": 37 }], 42: [function (require, module, exports) {
            // Thank's IE8 for his funny defineProperty
            module.exports = !require('./_fails')(function () {
                return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
            });
        }, { "./_fails": 45 }], 43: [function (require, module, exports) {
            var isObject = require('./_is-object')
                , document = require('./_global').document
                // in old IE typeof document.createElement is 'object'
                , is = isObject(document) && isObject(document.createElement);
            module.exports = function (it) {
                return is ? document.createElement(it) : {};
            };
        }, { "./_global": 46, "./_is-object": 51 }], 44: [function (require, module, exports) {
            var global = require('./_global')
                , core = require('./_core')
                , ctx = require('./_ctx')
                , hide = require('./_hide')
                , PROTOTYPE = 'prototype';

            var $export = function (type, name, source) {
                var IS_FORCED = type & $export.F
                    , IS_GLOBAL = type & $export.G
                    , IS_STATIC = type & $export.S
                    , IS_PROTO = type & $export.P
                    , IS_BIND = type & $export.B
                    , IS_WRAP = type & $export.W
                    , exports = IS_GLOBAL ? core : core[name] || (core[name] = {})
                    , expProto = exports[PROTOTYPE]
                    , target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
                    , key, own, out;
                if (IS_GLOBAL) source = name;
                for (key in source) {
                    // contains in native
                    own = !IS_FORCED && target && target[key] !== undefined;
                    if (own && key in exports) continue;
                    // export native or passed
                    out = own ? target[key] : source[key];
                    // prevent global pollution for namespaces
                    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
                        // bind timers to global for call from export context
                        : IS_BIND && own ? ctx(out, global)
                            // wrap global constructors for prevent change them in library
                            : IS_WRAP && target[key] == out ? (function (C) {
                                var F = function (a, b, c) {
                                    if (this instanceof C) {
                                        switch (arguments.length) {
                                            case 0: return new C;
                                            case 1: return new C(a);
                                            case 2: return new C(a, b);
                                        } return new C(a, b, c);
                                    } return C.apply(this, arguments);
                                };
                                F[PROTOTYPE] = C[PROTOTYPE];
                                return F;
                                // make static versions for prototype methods
                            })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
                    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
                    if (IS_PROTO) {
                        (exports.virtual || (exports.virtual = {}))[key] = out;
                        // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
                        if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
                    }
                }
            };
            // type bitmap
            $export.F = 1;   // forced
            $export.G = 2;   // global
            $export.S = 4;   // static
            $export.P = 8;   // proto
            $export.B = 16;  // bind
            $export.W = 32;  // wrap
            $export.U = 64;  // safe
            $export.R = 128; // real proto method for `library` 
            module.exports = $export;
        }, { "./_core": 40, "./_ctx": 41, "./_global": 46, "./_hide": 47 }], 45: [function (require, module, exports) {
            module.exports = function (exec) {
                try {
                    return !!exec();
                } catch (e) {
                    return true;
                }
            };
        }, {}], 46: [function (require, module, exports) {
            // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
            var global = module.exports = typeof window != 'undefined' && window.Math == Math
                ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
            if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
        }, {}], 47: [function (require, module, exports) {
            var dP = require('./_object-dp')
                , createDesc = require('./_property-desc');
            module.exports = require('./_descriptors') ? function (object, key, value) {
                return dP.f(object, key, createDesc(1, value));
            } : function (object, key, value) {
                object[key] = value;
                return object;
            };
        }, { "./_descriptors": 42, "./_object-dp": 52, "./_property-desc": 53 }], 48: [function (require, module, exports) {
            module.exports = require('./_global').document && document.documentElement;
        }, { "./_global": 46 }], 49: [function (require, module, exports) {
            module.exports = !require('./_descriptors') && !require('./_fails')(function () {
                return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
            });
        }, { "./_descriptors": 42, "./_dom-create": 43, "./_fails": 45 }], 50: [function (require, module, exports) {
            // fast apply, http://jsperf.lnkit.com/fast-apply/5
            module.exports = function (fn, args, that) {
                var un = that === undefined;
                switch (args.length) {
                    case 0: return un ? fn()
                        : fn.call(that);
                    case 1: return un ? fn(args[0])
                        : fn.call(that, args[0]);
                    case 2: return un ? fn(args[0], args[1])
                        : fn.call(that, args[0], args[1]);
                    case 3: return un ? fn(args[0], args[1], args[2])
                        : fn.call(that, args[0], args[1], args[2]);
                    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                        : fn.call(that, args[0], args[1], args[2], args[3]);
                } return fn.apply(that, args);
            };
        }, {}], 51: [function (require, module, exports) {
            module.exports = function (it) {
                return typeof it === 'object' ? it !== null : typeof it === 'function';
            };
        }, {}], 52: [function (require, module, exports) {
            var anObject = require('./_an-object')
                , IE8_DOM_DEFINE = require('./_ie8-dom-define')
                , toPrimitive = require('./_to-primitive')
                , dP = Object.defineProperty;

            exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
                anObject(O);
                P = toPrimitive(P, true);
                anObject(Attributes);
                if (IE8_DOM_DEFINE) try {
                    return dP(O, P, Attributes);
                } catch (e) { /* empty */ }
                if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
                if ('value' in Attributes) O[P] = Attributes.value;
                return O;
            };
        }, { "./_an-object": 38, "./_descriptors": 42, "./_ie8-dom-define": 49, "./_to-primitive": 55 }], 53: [function (require, module, exports) {
            module.exports = function (bitmap, value) {
                return {
                    enumerable: !(bitmap & 1),
                    configurable: !(bitmap & 2),
                    writable: !(bitmap & 4),
                    value: value
                };
            };
        }, {}], 54: [function (require, module, exports) {
            var ctx = require('./_ctx')
                , invoke = require('./_invoke')
                , html = require('./_html')
                , cel = require('./_dom-create')
                , global = require('./_global')
                , process = global.process
                , setTask = global.setImmediate
                , clearTask = global.clearImmediate
                , MessageChannel = global.MessageChannel
                , counter = 0
                , queue = {}
                , ONREADYSTATECHANGE = 'onreadystatechange'
                , defer, channel, port;
            var run = function () {
                var id = +this;
                if (queue.hasOwnProperty(id)) {
                    var fn = queue[id];
                    delete queue[id];
                    fn();
                }
            };
            var listener = function (event) {
                run.call(event.data);
            };
            // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
            if (!setTask || !clearTask) {
                setTask = function setImmediate(fn) {
                    var args = [], i = 1;
                    while (arguments.length > i) args.push(arguments[i++]);
                    queue[++counter] = function () {
                        invoke(typeof fn == 'function' ? fn : Function(fn), args);
                    };
                    defer(counter);
                    return counter;
                };
                clearTask = function clearImmediate(id) {
                    delete queue[id];
                };
                // Node.js 0.8-
                if (require('./_cof')(process) == 'process') {
                    defer = function (id) {
                        process.nextTick(ctx(run, id, 1));
                    };
                    // Browsers with MessageChannel, includes WebWorkers
                } else if (MessageChannel) {
                    channel = new MessageChannel;
                    port = channel.port2;
                    channel.port1.onmessage = listener;
                    defer = ctx(port.postMessage, port, 1);
                    // Browsers with postMessage, skip WebWorkers
                    // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
                } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
                    defer = function (id) {
                        global.postMessage(id + '', '*');
                    };
                    global.addEventListener('message', listener, false);
                    // IE8-
                } else if (ONREADYSTATECHANGE in cel('script')) {
                    defer = function (id) {
                        html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
                            html.removeChild(this);
                            run.call(id);
                        };
                    };
                    // Rest old browsers
                } else {
                    defer = function (id) {
                        setTimeout(ctx(run, id, 1), 0);
                    };
                }
            }
            module.exports = {
                set: setTask,
                clear: clearTask
            };
        }, { "./_cof": 39, "./_ctx": 41, "./_dom-create": 43, "./_global": 46, "./_html": 48, "./_invoke": 50 }], 55: [function (require, module, exports) {
            // 7.1.1 ToPrimitive(input [, PreferredType])
            var isObject = require('./_is-object');
            // instead of the ES6 spec version, we didn't implement @@toPrimitive case
            // and the second argument - flag - preferred type is a string
            module.exports = function (it, S) {
                if (!isObject(it)) return it;
                var fn, val;
                if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
                if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
                if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
                throw TypeError("Can't convert object to primitive value");
            };
        }, { "./_is-object": 51 }], 56: [function (require, module, exports) {
            var $export = require('./_export')
                , $task = require('./_task');
            $export($export.G + $export.B, {
                setImmediate: $task.set,
                clearImmediate: $task.clear
            });
        }, { "./_export": 44, "./_task": 54 }], 57: [function (require, module, exports) {
            (function (global) {
                'use strict';
                var Mutation = global.MutationObserver || global.WebKitMutationObserver;

                var scheduleDrain;

                {
                    if (Mutation) {
                        var called = 0;
                        var observer = new Mutation(nextTick);
                        var element = global.document.createTextNode('');
                        observer.observe(element, {
                            characterData: true
                        });
                        scheduleDrain = function () {
                            element.data = (called = ++called % 2);
                        };
                    } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
                        var channel = new global.MessageChannel();
                        channel.port1.onmessage = nextTick;
                        scheduleDrain = function () {
                            channel.port2.postMessage(0);
                        };
                    } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
                        scheduleDrain = function () {

                            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
                            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
                            var scriptEl = global.document.createElement('script');
                            scriptEl.onreadystatechange = function () {
                                nextTick();

                                scriptEl.onreadystatechange = null;
                                scriptEl.parentNode.removeChild(scriptEl);
                                scriptEl = null;
                            };
                            global.document.documentElement.appendChild(scriptEl);
                        };
                    } else {
                        scheduleDrain = function () {
                            setTimeout(nextTick, 0);
                        };
                    }
                }

                var draining;
                var queue = [];
                //named nextTick for less confusing stack traces
                function nextTick() {
                    draining = true;
                    var i, oldQueue;
                    var len = queue.length;
                    while (len) {
                        oldQueue = queue;
                        queue = [];
                        i = -1;
                        while (++i < len) {
                            oldQueue[i]();
                        }
                        len = queue.length;
                    }
                    draining = false;
                }

                module.exports = immediate;
                function immediate(task) {
                    if (queue.push(task) === 1 && !draining) {
                        scheduleDrain();
                    }
                }

            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        }, {}], 58: [function (require, module, exports) {
            'use strict';
            var immediate = require('immediate');

            /* istanbul ignore next */
            function INTERNAL() { }

            var handlers = {};

            var REJECTED = ['REJECTED'];
            var FULFILLED = ['FULFILLED'];
            var PENDING = ['PENDING'];

            module.exports = Promise;

            function Promise(resolver) {
                if (typeof resolver !== 'function') {
                    throw new TypeError('resolver must be a function');
                }
                this.state = PENDING;
                this.queue = [];
                this.outcome = void 0;
                if (resolver !== INTERNAL) {
                    safelyResolveThenable(this, resolver);
                }
            }

            Promise.prototype["catch"] = function (onRejected) {
                return this.then(null, onRejected);
            };
            Promise.prototype.then = function (onFulfilled, onRejected) {
                if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
                    typeof onRejected !== 'function' && this.state === REJECTED) {
                    return this;
                }
                var promise = new this.constructor(INTERNAL);
                if (this.state !== PENDING) {
                    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
                    unwrap(promise, resolver, this.outcome);
                } else {
                    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
                }

                return promise;
            };
            function QueueItem(promise, onFulfilled, onRejected) {
                this.promise = promise;
                if (typeof onFulfilled === 'function') {
                    this.onFulfilled = onFulfilled;
                    this.callFulfilled = this.otherCallFulfilled;
                }
                if (typeof onRejected === 'function') {
                    this.onRejected = onRejected;
                    this.callRejected = this.otherCallRejected;
                }
            }
            QueueItem.prototype.callFulfilled = function (value) {
                handlers.resolve(this.promise, value);
            };
            QueueItem.prototype.otherCallFulfilled = function (value) {
                unwrap(this.promise, this.onFulfilled, value);
            };
            QueueItem.prototype.callRejected = function (value) {
                handlers.reject(this.promise, value);
            };
            QueueItem.prototype.otherCallRejected = function (value) {
                unwrap(this.promise, this.onRejected, value);
            };

            function unwrap(promise, func, value) {
                immediate(function () {
                    var returnValue;
                    try {
                        returnValue = func(value);
                    } catch (e) {
                        return handlers.reject(promise, e);
                    }
                    if (returnValue === promise) {
                        handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
                    } else {
                        handlers.resolve(promise, returnValue);
                    }
                });
            }

            handlers.resolve = function (self, value) {
                var result = tryCatch(getThen, value);
                if (result.status === 'error') {
                    return handlers.reject(self, result.value);
                }
                var thenable = result.value;

                if (thenable) {
                    safelyResolveThenable(self, thenable);
                } else {
                    self.state = FULFILLED;
                    self.outcome = value;
                    var i = -1;
                    var len = self.queue.length;
                    while (++i < len) {
                        self.queue[i].callFulfilled(value);
                    }
                }
                return self;
            };
            handlers.reject = function (self, error) {
                self.state = REJECTED;
                self.outcome = error;
                var i = -1;
                var len = self.queue.length;
                while (++i < len) {
                    self.queue[i].callRejected(error);
                }
                return self;
            };

            function getThen(obj) {
                // Make sure we only access the accessor once as required by the spec
                var then = obj && obj.then;
                if (obj && typeof obj === 'object' && typeof then === 'function') {
                    return function appyThen() {
                        then.apply(obj, arguments);
                    };
                }
            }

            function safelyResolveThenable(self, thenable) {
                // Either fulfill, reject or reject with error
                var called = false;
                function onError(value) {
                    if (called) {
                        return;
                    }
                    called = true;
                    handlers.reject(self, value);
                }

                function onSuccess(value) {
                    if (called) {
                        return;
                    }
                    called = true;
                    handlers.resolve(self, value);
                }

                function tryToUnwrap() {
                    thenable(onSuccess, onError);
                }

                var result = tryCatch(tryToUnwrap);
                if (result.status === 'error') {
                    onError(result.value);
                }
            }

            function tryCatch(func, value) {
                var out = {};
                try {
                    out.value = func(value);
                    out.status = 'success';
                } catch (e) {
                    out.status = 'error';
                    out.value = e;
                }
                return out;
            }

            Promise.resolve = resolve;
            function resolve(value) {
                if (value instanceof this) {
                    return value;
                }
                return handlers.resolve(new this(INTERNAL), value);
            }

            Promise.reject = reject;
            function reject(reason) {
                var promise = new this(INTERNAL);
                return handlers.reject(promise, reason);
            }

            Promise.all = all;
            function all(iterable) {
                var self = this;
                if (Object.prototype.toString.call(iterable) !== '[object Array]') {
                    return this.reject(new TypeError('must be an array'));
                }

                var len = iterable.length;
                var called = false;
                if (!len) {
                    return this.resolve([]);
                }

                var values = new Array(len);
                var resolved = 0;
                var i = -1;
                var promise = new this(INTERNAL);

                while (++i < len) {
                    allResolver(iterable[i], i);
                }
                return promise;
                function allResolver(value, i) {
                    self.resolve(value).then(resolveFromAll, function (error) {
                        if (!called) {
                            called = true;
                            handlers.reject(promise, error);
                        }
                    });
                    function resolveFromAll(outValue) {
                        values[i] = outValue;
                        if (++resolved === len && !called) {
                            called = true;
                            handlers.resolve(promise, values);
                        }
                    }
                }
            }

            Promise.race = race;
            function race(iterable) {
                var self = this;
                if (Object.prototype.toString.call(iterable) !== '[object Array]') {
                    return this.reject(new TypeError('must be an array'));
                }

                var len = iterable.length;
                var called = false;
                if (!len) {
                    return this.resolve([]);
                }

                var i = -1;
                var promise = new this(INTERNAL);

                while (++i < len) {
                    resolver(iterable[i]);
                }
                return promise;
                function resolver(value) {
                    self.resolve(value).then(function (response) {
                        if (!called) {
                            called = true;
                            handlers.resolve(promise, response);
                        }
                    }, function (error) {
                        if (!called) {
                            called = true;
                            handlers.reject(promise, error);
                        }
                    });
                }
            }

        }, { "immediate": 57 }], 59: [function (require, module, exports) {
            // Top level file is just a mixin of submodules & constants
            'use strict';

            var assign = require('./lib/utils/common').assign;

            var deflate = require('./lib/deflate');
            var inflate = require('./lib/inflate');
            var constants = require('./lib/zlib/constants');

            var pako = {};

            assign(pako, deflate, inflate, constants);

            module.exports = pako;

        }, { "./lib/deflate": 60, "./lib/inflate": 61, "./lib/utils/common": 62, "./lib/zlib/constants": 65 }], 60: [function (require, module, exports) {
            'use strict';


            var zlib_deflate = require('./zlib/deflate');
            var utils = require('./utils/common');
            var strings = require('./utils/strings');
            var msg = require('./zlib/messages');
            var ZStream = require('./zlib/zstream');

            var toString = Object.prototype.toString;

            /* Public constants ==========================================================*/
            /* ===========================================================================*/

            var Z_NO_FLUSH = 0;
            var Z_FINISH = 4;

            var Z_OK = 0;
            var Z_STREAM_END = 1;
            var Z_SYNC_FLUSH = 2;

            var Z_DEFAULT_COMPRESSION = -1;

            var Z_DEFAULT_STRATEGY = 0;

            var Z_DEFLATED = 8;

            /* ===========================================================================*/


            /**
             * class Deflate
             *
             * Generic JS-style wrapper for zlib calls. If you don't need
             * streaming behaviour - use more simple functions: [[deflate]],
             * [[deflateRaw]] and [[gzip]].
             **/

            /* internal
             * Deflate.chunks -> Array
             *
             * Chunks of output data, if [[Deflate#onData]] not overriden.
             **/

            /**
             * Deflate.result -> Uint8Array|Array
             *
             * Compressed result, generated by default [[Deflate#onData]]
             * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
             * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
             * push a chunk with explicit flush (call [[Deflate#push]] with
             * `Z_SYNC_FLUSH` param).
             **/

            /**
             * Deflate.err -> Number
             *
             * Error code after deflate finished. 0 (Z_OK) on success.
             * You will not need it in real life, because deflate errors
             * are possible only on wrong options or bad `onData` / `onEnd`
             * custom handlers.
             **/

            /**
             * Deflate.msg -> String
             *
             * Error message, if [[Deflate.err]] != 0
             **/


            /**
             * new Deflate(options)
             * - options (Object): zlib deflate options.
             *
             * Creates new deflator instance with specified params. Throws exception
             * on bad params. Supported options:
             *
             * - `level`
             * - `windowBits`
             * - `memLevel`
             * - `strategy`
             * - `dictionary`
             *
             * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
             * for more information on these.
             *
             * Additional options, for internal needs:
             *
             * - `chunkSize` - size of generated data chunks (16K by default)
             * - `raw` (Boolean) - do raw deflate
             * - `gzip` (Boolean) - create gzip wrapper
             * - `to` (String) - if equal to 'string', then result will be "binary string"
             *    (each char code [0..255])
             * - `header` (Object) - custom header for gzip
             *   - `text` (Boolean) - true if compressed data believed to be text
             *   - `time` (Number) - modification time, unix timestamp
             *   - `os` (Number) - operation system code
             *   - `extra` (Array) - array of bytes with extra data (max 65536)
             *   - `name` (String) - file name (binary string)
             *   - `comment` (String) - comment (binary string)
             *   - `hcrc` (Boolean) - true if header crc should be added
             *
             * ##### Example:
             *
             * ```javascript
             * var pako = require('pako')
             *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
             *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
             *
             * var deflate = new pako.Deflate({ level: 3});
             *
             * deflate.push(chunk1, false);
             * deflate.push(chunk2, true);  // true -> last chunk
             *
             * if (deflate.err) { throw new Error(deflate.err); }
             *
             * console.log(deflate.result);
             * ```
             **/
            function Deflate(options) {
                if (!(this instanceof Deflate)) return new Deflate(options);

                this.options = utils.assign({
                    level: Z_DEFAULT_COMPRESSION,
                    method: Z_DEFLATED,
                    chunkSize: 16384,
                    windowBits: 15,
                    memLevel: 8,
                    strategy: Z_DEFAULT_STRATEGY,
                    to: ''
                }, options || {});

                var opt = this.options;

                if (opt.raw && (opt.windowBits > 0)) {
                    opt.windowBits = -opt.windowBits;
                }

                else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
                    opt.windowBits += 16;
                }

                this.err = 0;      // error code, if happens (0 = Z_OK)
                this.msg = '';     // error message
                this.ended = false;  // used to avoid multiple onEnd() calls
                this.chunks = [];     // chunks of compressed data

                this.strm = new ZStream();
                this.strm.avail_out = 0;

                var status = zlib_deflate.deflateInit2(
                    this.strm,
                    opt.level,
                    opt.method,
                    opt.windowBits,
                    opt.memLevel,
                    opt.strategy
                );

                if (status !== Z_OK) {
                    throw new Error(msg[status]);
                }

                if (opt.header) {
                    zlib_deflate.deflateSetHeader(this.strm, opt.header);
                }

                if (opt.dictionary) {
                    var dict;
                    // Convert data if needed
                    if (typeof opt.dictionary === 'string') {
                        // If we need to compress text, change encoding to utf8.
                        dict = strings.string2buf(opt.dictionary);
                    } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
                        dict = new Uint8Array(opt.dictionary);
                    } else {
                        dict = opt.dictionary;
                    }

                    status = zlib_deflate.deflateSetDictionary(this.strm, dict);

                    if (status !== Z_OK) {
                        throw new Error(msg[status]);
                    }

                    this._dict_set = true;
                }
            }

            /**
             * Deflate#push(data[, mode]) -> Boolean
             * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
             *   converted to utf8 byte sequence.
             * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
             *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
             *
             * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
             * new compressed chunks. Returns `true` on success. The last data block must have
             * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
             * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
             * can use mode Z_SYNC_FLUSH, keeping the compression context.
             *
             * On fail call [[Deflate#onEnd]] with error code and return false.
             *
             * We strongly recommend to use `Uint8Array` on input for best speed (output
             * array format is detected automatically). Also, don't skip last param and always
             * use the same type in your code (boolean or number). That will improve JS speed.
             *
             * For regular `Array`-s make sure all elements are [0..255].
             *
             * ##### Example
             *
             * ```javascript
             * push(chunk, false); // push one of data chunks
             * ...
             * push(chunk, true);  // push last chunk
             * ```
             **/
            Deflate.prototype.push = function (data, mode) {
                var strm = this.strm;
                var chunkSize = this.options.chunkSize;
                var status, _mode;

                if (this.ended) { return false; }

                _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

                // Convert data if needed
                if (typeof data === 'string') {
                    // If we need to compress text, change encoding to utf8.
                    strm.input = strings.string2buf(data);
                } else if (toString.call(data) === '[object ArrayBuffer]') {
                    strm.input = new Uint8Array(data);
                } else {
                    strm.input = data;
                }

                strm.next_in = 0;
                strm.avail_in = strm.input.length;

                do {
                    if (strm.avail_out === 0) {
                        strm.output = new utils.Buf8(chunkSize);
                        strm.next_out = 0;
                        strm.avail_out = chunkSize;
                    }
                    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

                    if (status !== Z_STREAM_END && status !== Z_OK) {
                        this.onEnd(status);
                        this.ended = true;
                        return false;
                    }
                    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
                        if (this.options.to === 'string') {
                            this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
                        } else {
                            this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                        }
                    }
                } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

                // Finalize on the last chunk.
                if (_mode === Z_FINISH) {
                    status = zlib_deflate.deflateEnd(this.strm);
                    this.onEnd(status);
                    this.ended = true;
                    return status === Z_OK;
                }

                // callback interim results if Z_SYNC_FLUSH.
                if (_mode === Z_SYNC_FLUSH) {
                    this.onEnd(Z_OK);
                    strm.avail_out = 0;
                    return true;
                }

                return true;
            };


            /**
             * Deflate#onData(chunk) -> Void
             * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
             *   on js engine support. When string output requested, each chunk
             *   will be string.
             *
             * By default, stores data blocks in `chunks[]` property and glue
             * those in `onEnd`. Override this handler, if you need another behaviour.
             **/
            Deflate.prototype.onData = function (chunk) {
                this.chunks.push(chunk);
            };


            /**
             * Deflate#onEnd(status) -> Void
             * - status (Number): deflate status. 0 (Z_OK) on success,
             *   other if not.
             *
             * Called once after you tell deflate that the input stream is
             * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
             * or if an error happened. By default - join collected chunks,
             * free memory and fill `results` / `err` properties.
             **/
            Deflate.prototype.onEnd = function (status) {
                // On success - join
                if (status === Z_OK) {
                    if (this.options.to === 'string') {
                        this.result = this.chunks.join('');
                    } else {
                        this.result = utils.flattenChunks(this.chunks);
                    }
                }
                this.chunks = [];
                this.err = status;
                this.msg = this.strm.msg;
            };


            /**
             * deflate(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to compress.
             * - options (Object): zlib deflate options.
             *
             * Compress `data` with deflate algorithm and `options`.
             *
             * Supported options are:
             *
             * - level
             * - windowBits
             * - memLevel
             * - strategy
             * - dictionary
             *
             * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
             * for more information on these.
             *
             * Sugar (options):
             *
             * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
             *   negative windowBits implicitly.
             * - `to` (String) - if equal to 'string', then result will be "binary string"
             *    (each char code [0..255])
             *
             * ##### Example:
             *
             * ```javascript
             * var pako = require('pako')
             *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
             *
             * console.log(pako.deflate(data));
             * ```
             **/
            function deflate(input, options) {
                var deflator = new Deflate(options);

                deflator.push(input, true);

                // That will never happens, if you don't cheat with options :)
                if (deflator.err) { throw deflator.msg; }

                return deflator.result;
            }


            /**
             * deflateRaw(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to compress.
             * - options (Object): zlib deflate options.
             *
             * The same as [[deflate]], but creates raw data, without wrapper
             * (header and adler32 crc).
             **/
            function deflateRaw(input, options) {
                options = options || {};
                options.raw = true;
                return deflate(input, options);
            }


            /**
             * gzip(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to compress.
             * - options (Object): zlib deflate options.
             *
             * The same as [[deflate]], but create gzip wrapper instead of
             * deflate one.
             **/
            function gzip(input, options) {
                options = options || {};
                options.gzip = true;
                return deflate(input, options);
            }


            exports.Deflate = Deflate;
            exports.deflate = deflate;
            exports.deflateRaw = deflateRaw;
            exports.gzip = gzip;

        }, { "./utils/common": 62, "./utils/strings": 63, "./zlib/deflate": 67, "./zlib/messages": 72, "./zlib/zstream": 74 }], 61: [function (require, module, exports) {
            'use strict';


            var zlib_inflate = require('./zlib/inflate');
            var utils = require('./utils/common');
            var strings = require('./utils/strings');
            var c = require('./zlib/constants');
            var msg = require('./zlib/messages');
            var ZStream = require('./zlib/zstream');
            var GZheader = require('./zlib/gzheader');

            var toString = Object.prototype.toString;

            /**
             * class Inflate
             *
             * Generic JS-style wrapper for zlib calls. If you don't need
             * streaming behaviour - use more simple functions: [[inflate]]
             * and [[inflateRaw]].
             **/

            /* internal
             * inflate.chunks -> Array
             *
             * Chunks of output data, if [[Inflate#onData]] not overriden.
             **/

            /**
             * Inflate.result -> Uint8Array|Array|String
             *
             * Uncompressed result, generated by default [[Inflate#onData]]
             * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
             * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
             * push a chunk with explicit flush (call [[Inflate#push]] with
             * `Z_SYNC_FLUSH` param).
             **/

            /**
             * Inflate.err -> Number
             *
             * Error code after inflate finished. 0 (Z_OK) on success.
             * Should be checked if broken data possible.
             **/

            /**
             * Inflate.msg -> String
             *
             * Error message, if [[Inflate.err]] != 0
             **/


            /**
             * new Inflate(options)
             * - options (Object): zlib inflate options.
             *
             * Creates new inflator instance with specified params. Throws exception
             * on bad params. Supported options:
             *
             * - `windowBits`
             * - `dictionary`
             *
             * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
             * for more information on these.
             *
             * Additional options, for internal needs:
             *
             * - `chunkSize` - size of generated data chunks (16K by default)
             * - `raw` (Boolean) - do raw inflate
             * - `to` (String) - if equal to 'string', then result will be converted
             *   from utf8 to utf16 (javascript) string. When string output requested,
             *   chunk length can differ from `chunkSize`, depending on content.
             *
             * By default, when no options set, autodetect deflate/gzip data format via
             * wrapper header.
             *
             * ##### Example:
             *
             * ```javascript
             * var pako = require('pako')
             *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
             *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
             *
             * var inflate = new pako.Inflate({ level: 3});
             *
             * inflate.push(chunk1, false);
             * inflate.push(chunk2, true);  // true -> last chunk
             *
             * if (inflate.err) { throw new Error(inflate.err); }
             *
             * console.log(inflate.result);
             * ```
             **/
            function Inflate(options) {
                if (!(this instanceof Inflate)) return new Inflate(options);

                this.options = utils.assign({
                    chunkSize: 16384,
                    windowBits: 0,
                    to: ''
                }, options || {});

                var opt = this.options;

                // Force window size for `raw` data, if not set directly,
                // because we have no header for autodetect.
                if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
                    opt.windowBits = -opt.windowBits;
                    if (opt.windowBits === 0) { opt.windowBits = -15; }
                }

                // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
                if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
                    !(options && options.windowBits)) {
                    opt.windowBits += 32;
                }

                // Gzip header has no info about windows size, we can do autodetect only
                // for deflate. So, if window size not set, force it to max when gzip possible
                if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
                    // bit 3 (16) -> gzipped data
                    // bit 4 (32) -> autodetect gzip/deflate
                    if ((opt.windowBits & 15) === 0) {
                        opt.windowBits |= 15;
                    }
                }

                this.err = 0;      // error code, if happens (0 = Z_OK)
                this.msg = '';     // error message
                this.ended = false;  // used to avoid multiple onEnd() calls
                this.chunks = [];     // chunks of compressed data

                this.strm = new ZStream();
                this.strm.avail_out = 0;

                var status = zlib_inflate.inflateInit2(
                    this.strm,
                    opt.windowBits
                );

                if (status !== c.Z_OK) {
                    throw new Error(msg[status]);
                }

                this.header = new GZheader();

                zlib_inflate.inflateGetHeader(this.strm, this.header);
            }

            /**
             * Inflate#push(data[, mode]) -> Boolean
             * - data (Uint8Array|Array|ArrayBuffer|String): input data
             * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
             *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
             *
             * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
             * new output chunks. Returns `true` on success. The last data block must have
             * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
             * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
             * can use mode Z_SYNC_FLUSH, keeping the decompression context.
             *
             * On fail call [[Inflate#onEnd]] with error code and return false.
             *
             * We strongly recommend to use `Uint8Array` on input for best speed (output
             * format is detected automatically). Also, don't skip last param and always
             * use the same type in your code (boolean or number). That will improve JS speed.
             *
             * For regular `Array`-s make sure all elements are [0..255].
             *
             * ##### Example
             *
             * ```javascript
             * push(chunk, false); // push one of data chunks
             * ...
             * push(chunk, true);  // push last chunk
             * ```
             **/
            Inflate.prototype.push = function (data, mode) {
                var strm = this.strm;
                var chunkSize = this.options.chunkSize;
                var dictionary = this.options.dictionary;
                var status, _mode;
                var next_out_utf8, tail, utf8str;
                var dict;

                // Flag to properly process Z_BUF_ERROR on testing inflate call
                // when we check that all output data was flushed.
                var allowBufError = false;

                if (this.ended) { return false; }
                _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

                // Convert data if needed
                if (typeof data === 'string') {
                    // Only binary strings can be decompressed on practice
                    strm.input = strings.binstring2buf(data);
                } else if (toString.call(data) === '[object ArrayBuffer]') {
                    strm.input = new Uint8Array(data);
                } else {
                    strm.input = data;
                }

                strm.next_in = 0;
                strm.avail_in = strm.input.length;

                do {
                    if (strm.avail_out === 0) {
                        strm.output = new utils.Buf8(chunkSize);
                        strm.next_out = 0;
                        strm.avail_out = chunkSize;
                    }

                    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

                    if (status === c.Z_NEED_DICT && dictionary) {
                        // Convert data if needed
                        if (typeof dictionary === 'string') {
                            dict = strings.string2buf(dictionary);
                        } else if (toString.call(dictionary) === '[object ArrayBuffer]') {
                            dict = new Uint8Array(dictionary);
                        } else {
                            dict = dictionary;
                        }

                        status = zlib_inflate.inflateSetDictionary(this.strm, dict);

                    }

                    if (status === c.Z_BUF_ERROR && allowBufError === true) {
                        status = c.Z_OK;
                        allowBufError = false;
                    }

                    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
                        this.onEnd(status);
                        this.ended = true;
                        return false;
                    }

                    if (strm.next_out) {
                        if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

                            if (this.options.to === 'string') {

                                next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

                                tail = strm.next_out - next_out_utf8;
                                utf8str = strings.buf2string(strm.output, next_out_utf8);

                                // move tail
                                strm.next_out = tail;
                                strm.avail_out = chunkSize - tail;
                                if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

                                this.onData(utf8str);

                            } else {
                                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                            }
                        }
                    }

                    // When no more input data, we should check that internal inflate buffers
                    // are flushed. The only way to do it when avail_out = 0 - run one more
                    // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
                    // Here we set flag to process this error properly.
                    //
                    // NOTE. Deflate does not return error in this case and does not needs such
                    // logic.
                    if (strm.avail_in === 0 && strm.avail_out === 0) {
                        allowBufError = true;
                    }

                } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

                if (status === c.Z_STREAM_END) {
                    _mode = c.Z_FINISH;
                }

                // Finalize on the last chunk.
                if (_mode === c.Z_FINISH) {
                    status = zlib_inflate.inflateEnd(this.strm);
                    this.onEnd(status);
                    this.ended = true;
                    return status === c.Z_OK;
                }

                // callback interim results if Z_SYNC_FLUSH.
                if (_mode === c.Z_SYNC_FLUSH) {
                    this.onEnd(c.Z_OK);
                    strm.avail_out = 0;
                    return true;
                }

                return true;
            };


            /**
             * Inflate#onData(chunk) -> Void
             * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
             *   on js engine support. When string output requested, each chunk
             *   will be string.
             *
             * By default, stores data blocks in `chunks[]` property and glue
             * those in `onEnd`. Override this handler, if you need another behaviour.
             **/
            Inflate.prototype.onData = function (chunk) {
                this.chunks.push(chunk);
            };


            /**
             * Inflate#onEnd(status) -> Void
             * - status (Number): inflate status. 0 (Z_OK) on success,
             *   other if not.
             *
             * Called either after you tell inflate that the input stream is
             * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
             * or if an error happened. By default - join collected chunks,
             * free memory and fill `results` / `err` properties.
             **/
            Inflate.prototype.onEnd = function (status) {
                // On success - join
                if (status === c.Z_OK) {
                    if (this.options.to === 'string') {
                        // Glue & convert here, until we teach pako to send
                        // utf8 alligned strings to onData
                        this.result = this.chunks.join('');
                    } else {
                        this.result = utils.flattenChunks(this.chunks);
                    }
                }
                this.chunks = [];
                this.err = status;
                this.msg = this.strm.msg;
            };


            /**
             * inflate(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to decompress.
             * - options (Object): zlib inflate options.
             *
             * Decompress `data` with inflate/ungzip and `options`. Autodetect
             * format via wrapper header by default. That's why we don't provide
             * separate `ungzip` method.
             *
             * Supported options are:
             *
             * - windowBits
             *
             * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
             * for more information.
             *
             * Sugar (options):
             *
             * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
             *   negative windowBits implicitly.
             * - `to` (String) - if equal to 'string', then result will be converted
             *   from utf8 to utf16 (javascript) string. When string output requested,
             *   chunk length can differ from `chunkSize`, depending on content.
             *
             *
             * ##### Example:
             *
             * ```javascript
             * var pako = require('pako')
             *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
             *   , output;
             *
             * try {
             *   output = pako.inflate(input);
             * } catch (err)
             *   console.log(err);
             * }
             * ```
             **/
            function inflate(input, options) {
                var inflator = new Inflate(options);

                inflator.push(input, true);

                // That will never happens, if you don't cheat with options :)
                if (inflator.err) { throw inflator.msg; }

                return inflator.result;
            }


            /**
             * inflateRaw(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to decompress.
             * - options (Object): zlib inflate options.
             *
             * The same as [[inflate]], but creates raw data, without wrapper
             * (header and adler32 crc).
             **/
            function inflateRaw(input, options) {
                options = options || {};
                options.raw = true;
                return inflate(input, options);
            }


            /**
             * ungzip(data[, options]) -> Uint8Array|Array|String
             * - data (Uint8Array|Array|String): input data to decompress.
             * - options (Object): zlib inflate options.
             *
             * Just shortcut to [[inflate]], because it autodetects format
             * by header.content. Done for convenience.
             **/


            exports.Inflate = Inflate;
            exports.inflate = inflate;
            exports.inflateRaw = inflateRaw;
            exports.ungzip = inflate;

        }, { "./utils/common": 62, "./utils/strings": 63, "./zlib/constants": 65, "./zlib/gzheader": 68, "./zlib/inflate": 70, "./zlib/messages": 72, "./zlib/zstream": 74 }], 62: [function (require, module, exports) {
            'use strict';


            var TYPED_OK = (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


            exports.assign = function (obj /*from1, from2, from3, ...*/) {
                var sources = Array.prototype.slice.call(arguments, 1);
                while (sources.length) {
                    var source = sources.shift();
                    if (!source) { continue; }

                    if (typeof source !== 'object') {
                        throw new TypeError(source + 'must be non-object');
                    }

                    for (var p in source) {
                        if (source.hasOwnProperty(p)) {
                            obj[p] = source[p];
                        }
                    }
                }

                return obj;
            };


            // reduce buffer size, avoiding mem copy
            exports.shrinkBuf = function (buf, size) {
                if (buf.length === size) { return buf; }
                if (buf.subarray) { return buf.subarray(0, size); }
                buf.length = size;
                return buf;
            };


            var fnTyped = {
                arraySet: function (dest, src, src_offs, len, dest_offs) {
                    if (src.subarray && dest.subarray) {
                        dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
                        return;
                    }
                    // Fallback to ordinary array
                    for (var i = 0; i < len; i++) {
                        dest[dest_offs + i] = src[src_offs + i];
                    }
                },
                // Join array of chunks to single array.
                flattenChunks: function (chunks) {
                    var i, l, len, pos, chunk, result;

                    // calculate data length
                    len = 0;
                    for (i = 0, l = chunks.length; i < l; i++) {
                        len += chunks[i].length;
                    }

                    // join chunks
                    result = new Uint8Array(len);
                    pos = 0;
                    for (i = 0, l = chunks.length; i < l; i++) {
                        chunk = chunks[i];
                        result.set(chunk, pos);
                        pos += chunk.length;
                    }

                    return result;
                }
            };

            var fnUntyped = {
                arraySet: function (dest, src, src_offs, len, dest_offs) {
                    for (var i = 0; i < len; i++) {
                        dest[dest_offs + i] = src[src_offs + i];
                    }
                },
                // Join array of chunks to single array.
                flattenChunks: function (chunks) {
                    return [].concat.apply([], chunks);
                }
            };


            // Enable/Disable typed arrays use, for testing
            //
            exports.setTyped = function (on) {
                if (on) {
                    exports.Buf8 = Uint8Array;
                    exports.Buf16 = Uint16Array;
                    exports.Buf32 = Int32Array;
                    exports.assign(exports, fnTyped);
                } else {
                    exports.Buf8 = Array;
                    exports.Buf16 = Array;
                    exports.Buf32 = Array;
                    exports.assign(exports, fnUntyped);
                }
            };

            exports.setTyped(TYPED_OK);

        }, {}], 63: [function (require, module, exports) {
            // String encode/decode helpers
            'use strict';


            var utils = require('./common');


            // Quick check if we can use fast array to bin string conversion
            //
            // - apply(Array) can fail on Android 2.2
            // - apply(Uint8Array) can fail on iOS 5.1 Safary
            //
            var STR_APPLY_OK = true;
            var STR_APPLY_UIA_OK = true;

            try { String.fromCharCode.apply(null, [0]); } catch (__) { STR_APPLY_OK = false; }
            try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


            // Table with utf8 lengths (calculated by first byte of sequence)
            // Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
            // because max possible codepoint is 0x10ffff
            var _utf8len = new utils.Buf8(256);
            for (var q = 0; q < 256; q++) {
                _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
            }
            _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


            // convert string to array (typed, when possible)
            exports.string2buf = function (str) {
                var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

                // count binary size
                for (m_pos = 0; m_pos < str_len; m_pos++) {
                    c = str.charCodeAt(m_pos);
                    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                        c2 = str.charCodeAt(m_pos + 1);
                        if ((c2 & 0xfc00) === 0xdc00) {
                            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                            m_pos++;
                        }
                    }
                    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
                }

                // allocate buffer
                buf = new utils.Buf8(buf_len);

                // convert
                for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
                    c = str.charCodeAt(m_pos);
                    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                        c2 = str.charCodeAt(m_pos + 1);
                        if ((c2 & 0xfc00) === 0xdc00) {
                            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                            m_pos++;
                        }
                    }
                    if (c < 0x80) {
                        /* one byte */
                        buf[i++] = c;
                    } else if (c < 0x800) {
                        /* two bytes */
                        buf[i++] = 0xC0 | (c >>> 6);
                        buf[i++] = 0x80 | (c & 0x3f);
                    } else if (c < 0x10000) {
                        /* three bytes */
                        buf[i++] = 0xE0 | (c >>> 12);
                        buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                        buf[i++] = 0x80 | (c & 0x3f);
                    } else {
                        /* four bytes */
                        buf[i++] = 0xf0 | (c >>> 18);
                        buf[i++] = 0x80 | (c >>> 12 & 0x3f);
                        buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                        buf[i++] = 0x80 | (c & 0x3f);
                    }
                }

                return buf;
            };

            // Helper (used in 2 places)
            function buf2binstring(buf, len) {
                // use fallback for big arrays to avoid stack overflow
                if (len < 65537) {
                    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
                        return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
                    }
                }

                var result = '';
                for (var i = 0; i < len; i++) {
                    result += String.fromCharCode(buf[i]);
                }
                return result;
            }


            // Convert byte array to binary string
            exports.buf2binstring = function (buf) {
                return buf2binstring(buf, buf.length);
            };


            // Convert binary string (typed, when possible)
            exports.binstring2buf = function (str) {
                var buf = new utils.Buf8(str.length);
                for (var i = 0, len = buf.length; i < len; i++) {
                    buf[i] = str.charCodeAt(i);
                }
                return buf;
            };


            // convert array to string
            exports.buf2string = function (buf, max) {
                var i, out, c, c_len;
                var len = max || buf.length;

                // Reserve max possible length (2 words per char)
                // NB: by unknown reasons, Array is significantly faster for
                //     String.fromCharCode.apply than Uint16Array.
                var utf16buf = new Array(len * 2);

                for (out = 0, i = 0; i < len;) {
                    c = buf[i++];
                    // quick process ascii
                    if (c < 0x80) { utf16buf[out++] = c; continue; }

                    c_len = _utf8len[c];
                    // skip 5 & 6 byte codes
                    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

                    // apply mask on first byte
                    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
                    // join the rest
                    while (c_len > 1 && i < len) {
                        c = (c << 6) | (buf[i++] & 0x3f);
                        c_len--;
                    }

                    // terminated by end of string?
                    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

                    if (c < 0x10000) {
                        utf16buf[out++] = c;
                    } else {
                        c -= 0x10000;
                        utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
                        utf16buf[out++] = 0xdc00 | (c & 0x3ff);
                    }
                }

                return buf2binstring(utf16buf, out);
            };


            // Calculate max possible position in utf8 buffer,
            // that will not break sequence. If that's not possible
            // - (very small limits) return max size as is.
            //
            // buf[] - utf8 bytes array
            // max   - length limit (mandatory);
            exports.utf8border = function (buf, max) {
                var pos;

                max = max || buf.length;
                if (max > buf.length) { max = buf.length; }

                // go back from last position, until start of sequence found
                pos = max - 1;
                while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

                // Fuckup - very small and broken sequence,
                // return max, because we should return something anyway.
                if (pos < 0) { return max; }

                // If we came to start of buffer - that means vuffer is too small,
                // return max too.
                if (pos === 0) { return max; }

                return (pos + _utf8len[buf[pos]] > max) ? pos : max;
            };

        }, { "./common": 62 }], 64: [function (require, module, exports) {
            'use strict';

            // Note: adler32 takes 12% for level 0 and 2% for level 6.
            // It doesn't worth to make additional optimizationa as in original.
            // Small size is preferable.

            function adler32(adler, buf, len, pos) {
                var s1 = (adler & 0xffff) | 0,
                    s2 = ((adler >>> 16) & 0xffff) | 0,
                    n = 0;

                while (len !== 0) {
                    // Set limit ~ twice less than 5552, to keep
                    // s2 in 31-bits, because we force signed ints.
                    // in other case %= will fail.
                    n = len > 2000 ? 2000 : len;
                    len -= n;

                    do {
                        s1 = (s1 + buf[pos++]) | 0;
                        s2 = (s2 + s1) | 0;
                    } while (--n);

                    s1 %= 65521;
                    s2 %= 65521;
                }

                return (s1 | (s2 << 16)) | 0;
            }


            module.exports = adler32;

        }, {}], 65: [function (require, module, exports) {
            'use strict';


            module.exports = {

                /* Allowed flush values; see deflate() and inflate() below for details */
                Z_NO_FLUSH: 0,
                Z_PARTIAL_FLUSH: 1,
                Z_SYNC_FLUSH: 2,
                Z_FULL_FLUSH: 3,
                Z_FINISH: 4,
                Z_BLOCK: 5,
                Z_TREES: 6,

                /* Return codes for the compression/decompression functions. Negative values
                * are errors, positive values are used for special but normal events.
                */
                Z_OK: 0,
                Z_STREAM_END: 1,
                Z_NEED_DICT: 2,
                Z_ERRNO: -1,
                Z_STREAM_ERROR: -2,
                Z_DATA_ERROR: -3,
                //Z_MEM_ERROR:     -4,
                Z_BUF_ERROR: -5,
                //Z_VERSION_ERROR: -6,

                /* compression levels */
                Z_NO_COMPRESSION: 0,
                Z_BEST_SPEED: 1,
                Z_BEST_COMPRESSION: 9,
                Z_DEFAULT_COMPRESSION: -1,


                Z_FILTERED: 1,
                Z_HUFFMAN_ONLY: 2,
                Z_RLE: 3,
                Z_FIXED: 4,
                Z_DEFAULT_STRATEGY: 0,

                /* Possible values of the data_type field (though see inflate()) */
                Z_BINARY: 0,
                Z_TEXT: 1,
                //Z_ASCII:                1, // = Z_TEXT (deprecated)
                Z_UNKNOWN: 2,

                /* The deflate compression method */
                Z_DEFLATED: 8
                //Z_NULL:                 null // Use -1 or null inline, depending on var type
            };

        }, {}], 66: [function (require, module, exports) {
            'use strict';

            // Note: we can't get significant speed boost here.
            // So write code to minimize size - no pregenerated tables
            // and array tools dependencies.


            // Use ordinary array, since untyped makes no boost here
            function makeTable() {
                var c, table = [];

                for (var n = 0; n < 256; n++) {
                    c = n;
                    for (var k = 0; k < 8; k++) {
                        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                    }
                    table[n] = c;
                }

                return table;
            }

            // Create table on load. Just 255 signed longs. Not a problem.
            var crcTable = makeTable();


            function crc32(crc, buf, len, pos) {
                var t = crcTable,
                    end = pos + len;

                crc ^= -1;

                for (var i = pos; i < end; i++) {
                    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
                }

                return (crc ^ (-1)); // >>> 0;
            }


            module.exports = crc32;

        }, {}], 67: [function (require, module, exports) {
            'use strict';

            var utils = require('../utils/common');
            var trees = require('./trees');
            var adler32 = require('./adler32');
            var crc32 = require('./crc32');
            var msg = require('./messages');

            /* Public constants ==========================================================*/
            /* ===========================================================================*/


            /* Allowed flush values; see deflate() and inflate() below for details */
            var Z_NO_FLUSH = 0;
            var Z_PARTIAL_FLUSH = 1;
            //var Z_SYNC_FLUSH    = 2;
            var Z_FULL_FLUSH = 3;
            var Z_FINISH = 4;
            var Z_BLOCK = 5;
            //var Z_TREES         = 6;


            /* Return codes for the compression/decompression functions. Negative values
             * are errors, positive values are used for special but normal events.
             */
            var Z_OK = 0;
            var Z_STREAM_END = 1;
            //var Z_NEED_DICT     = 2;
            //var Z_ERRNO         = -1;
            var Z_STREAM_ERROR = -2;
            var Z_DATA_ERROR = -3;
            //var Z_MEM_ERROR     = -4;
            var Z_BUF_ERROR = -5;
            //var Z_VERSION_ERROR = -6;


            /* compression levels */
            //var Z_NO_COMPRESSION      = 0;
            //var Z_BEST_SPEED          = 1;
            //var Z_BEST_COMPRESSION    = 9;
            var Z_DEFAULT_COMPRESSION = -1;


            var Z_FILTERED = 1;
            var Z_HUFFMAN_ONLY = 2;
            var Z_RLE = 3;
            var Z_FIXED = 4;
            var Z_DEFAULT_STRATEGY = 0;

            /* Possible values of the data_type field (though see inflate()) */
            //var Z_BINARY              = 0;
            //var Z_TEXT                = 1;
            //var Z_ASCII               = 1; // = Z_TEXT
            var Z_UNKNOWN = 2;


            /* The deflate compression method */
            var Z_DEFLATED = 8;

            /*============================================================================*/


            var MAX_MEM_LEVEL = 9;
            /* Maximum value for memLevel in deflateInit2 */
            var MAX_WBITS = 15;
            /* 32K LZ77 window */
            var DEF_MEM_LEVEL = 8;


            var LENGTH_CODES = 29;
            /* number of length codes, not counting the special END_BLOCK code */
            var LITERALS = 256;
            /* number of literal bytes 0..255 */
            var L_CODES = LITERALS + 1 + LENGTH_CODES;
            /* number of Literal or Length codes, including the END_BLOCK code */
            var D_CODES = 30;
            /* number of distance codes */
            var BL_CODES = 19;
            /* number of codes used to transfer the bit lengths */
            var HEAP_SIZE = 2 * L_CODES + 1;
            /* maximum heap size */
            var MAX_BITS = 15;
            /* All codes must not exceed MAX_BITS bits */

            var MIN_MATCH = 3;
            var MAX_MATCH = 258;
            var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

            var PRESET_DICT = 0x20;

            var INIT_STATE = 42;
            var EXTRA_STATE = 69;
            var NAME_STATE = 73;
            var COMMENT_STATE = 91;
            var HCRC_STATE = 103;
            var BUSY_STATE = 113;
            var FINISH_STATE = 666;

            var BS_NEED_MORE = 1; /* block not completed, need more input or more output */
            var BS_BLOCK_DONE = 2; /* block flush performed */
            var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
            var BS_FINISH_DONE = 4; /* finish done, accept no more input or output */

            var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

            function err(strm, errorCode) {
                strm.msg = msg[errorCode];
                return errorCode;
            }

            function rank(f) {
                return ((f) << 1) - ((f) > 4 ? 9 : 0);
            }

            function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


            /* =========================================================================
             * Flush as much pending output as possible. All deflate() output goes
             * through this function so some applications may wish to modify it
             * to avoid allocating a large strm->output buffer and copying into it.
             * (See also read_buf()).
             */
            function flush_pending(strm) {
                var s = strm.state;

                //_tr_flush_bits(s);
                var len = s.pending;
                if (len > strm.avail_out) {
                    len = strm.avail_out;
                }
                if (len === 0) { return; }

                utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
                strm.next_out += len;
                s.pending_out += len;
                strm.total_out += len;
                strm.avail_out -= len;
                s.pending -= len;
                if (s.pending === 0) {
                    s.pending_out = 0;
                }
            }


            function flush_block_only(s, last) {
                trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
                s.block_start = s.strstart;
                flush_pending(s.strm);
            }


            function put_byte(s, b) {
                s.pending_buf[s.pending++] = b;
            }


            /* =========================================================================
             * Put a short in the pending buffer. The 16-bit value is put in MSB order.
             * IN assertion: the stream state is correct and there is enough room in
             * pending_buf.
             */
            function putShortMSB(s, b) {
                //  put_byte(s, (Byte)(b >> 8));
                //  put_byte(s, (Byte)(b & 0xff));
                s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
                s.pending_buf[s.pending++] = b & 0xff;
            }


            /* ===========================================================================
             * Read a new buffer from the current input stream, update the adler32
             * and total number of bytes read.  All deflate() input goes through
             * this function so some applications may wish to modify it to avoid
             * allocating a large strm->input buffer and copying from it.
             * (See also flush_pending()).
             */
            function read_buf(strm, buf, start, size) {
                var len = strm.avail_in;

                if (len > size) { len = size; }
                if (len === 0) { return 0; }

                strm.avail_in -= len;

                // zmemcpy(buf, strm->next_in, len);
                utils.arraySet(buf, strm.input, strm.next_in, len, start);
                if (strm.state.wrap === 1) {
                    strm.adler = adler32(strm.adler, buf, len, start);
                }

                else if (strm.state.wrap === 2) {
                    strm.adler = crc32(strm.adler, buf, len, start);
                }

                strm.next_in += len;
                strm.total_in += len;

                return len;
            }


            /* ===========================================================================
             * Set match_start to the longest match starting at the given string and
             * return its length. Matches shorter or equal to prev_length are discarded,
             * in which case the result is equal to prev_length and match_start is
             * garbage.
             * IN assertions: cur_match is the head of the hash chain for the current
             *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
             * OUT assertion: the match length is not greater than s->lookahead.
             */
            function longest_match(s, cur_match) {
                var chain_length = s.max_chain_length;      /* max hash chain length */
                var scan = s.strstart; /* current string */
                var match;                       /* matched string */
                var len;                           /* length of current match */
                var best_len = s.prev_length;              /* best match length so far */
                var nice_match = s.nice_match;             /* stop if match long enough */
                var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
                    s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

                var _win = s.window; // shortcut

                var wmask = s.w_mask;
                var prev = s.prev;

                /* Stop when cur_match becomes <= limit. To simplify the code,
                 * we prevent matches with the string of window index 0.
                 */

                var strend = s.strstart + MAX_MATCH;
                var scan_end1 = _win[scan + best_len - 1];
                var scan_end = _win[scan + best_len];

                /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
                 * It is easy to get rid of this optimization if necessary.
                 */
                // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

                /* Do not waste too much time if we already have a good match: */
                if (s.prev_length >= s.good_match) {
                    chain_length >>= 2;
                }
                /* Do not look for matches beyond the end of the input. This is necessary
                 * to make deflate deterministic.
                 */
                if (nice_match > s.lookahead) { nice_match = s.lookahead; }

                // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

                do {
                    // Assert(cur_match < s->strstart, "no future");
                    match = cur_match;

                    /* Skip to next match if the match length cannot increase
                     * or if the match length is less than 2.  Note that the checks below
                     * for insufficient lookahead only occur occasionally for performance
                     * reasons.  Therefore uninitialized memory will be accessed, and
                     * conditional jumps will be made that depend on those values.
                     * However the length of the match is limited to the lookahead, so
                     * the output of deflate is not affected by the uninitialized values.
                     */

                    if (_win[match + best_len] !== scan_end ||
                        _win[match + best_len - 1] !== scan_end1 ||
                        _win[match] !== _win[scan] ||
                        _win[++match] !== _win[scan + 1]) {
                        continue;
                    }

                    /* The check at best_len-1 can be removed because it will be made
                     * again later. (This heuristic is not always a win.)
                     * It is not necessary to compare scan[2] and match[2] since they
                     * are always equal when the other bytes match, given that
                     * the hash keys are equal and that HASH_BITS >= 8.
                     */
                    scan += 2;
                    match++;
                    // Assert(*scan == *match, "match[2]?");

                    /* We check for insufficient lookahead only every 8th comparison;
                     * the 256th check will be made at strstart+258.
                     */
                    do {
                        /*jshint noempty:false*/
                    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                    _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                    _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                    _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                        scan < strend);

                    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

                    len = MAX_MATCH - (strend - scan);
                    scan = strend - MAX_MATCH;

                    if (len > best_len) {
                        s.match_start = cur_match;
                        best_len = len;
                        if (len >= nice_match) {
                            break;
                        }
                        scan_end1 = _win[scan + best_len - 1];
                        scan_end = _win[scan + best_len];
                    }
                } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

                if (best_len <= s.lookahead) {
                    return best_len;
                }
                return s.lookahead;
            }


            /* ===========================================================================
             * Fill the window when the lookahead becomes insufficient.
             * Updates strstart and lookahead.
             *
             * IN assertion: lookahead < MIN_LOOKAHEAD
             * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
             *    At least one byte has been read, or avail_in == 0; reads are
             *    performed for at least two bytes (required for the zip translate_eol
             *    option -- not supported here).
             */
            function fill_window(s) {
                var _w_size = s.w_size;
                var p, n, m, more, str;

                //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

                do {
                    more = s.window_size - s.lookahead - s.strstart;

                    // JS ints have 32 bit, block below not needed
                    /* Deal with !@#$% 64K limit: */
                    //if (sizeof(int) <= 2) {
                    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
                    //        more = wsize;
                    //
                    //  } else if (more == (unsigned)(-1)) {
                    //        /* Very unlikely, but possible on 16 bit machine if
                    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
                    //         */
                    //        more--;
                    //    }
                    //}


                    /* If the window is almost full and there is insufficient lookahead,
                     * move the upper half to the lower one to make room in the upper half.
                     */
                    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

                        utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
                        s.match_start -= _w_size;
                        s.strstart -= _w_size;
                        /* we now have strstart >= MAX_DIST */
                        s.block_start -= _w_size;

                        /* Slide the hash table (could be avoided with 32 bit values
                         at the expense of memory usage). We slide even when level == 0
                         to keep the hash table consistent if we switch back to level > 0
                         later. (Using level 0 permanently is not an optimal usage of
                         zlib, so we don't care about this pathological case.)
                         */

                        n = s.hash_size;
                        p = n;
                        do {
                            m = s.head[--p];
                            s.head[p] = (m >= _w_size ? m - _w_size : 0);
                        } while (--n);

                        n = _w_size;
                        p = n;
                        do {
                            m = s.prev[--p];
                            s.prev[p] = (m >= _w_size ? m - _w_size : 0);
                            /* If n is not on any hash chain, prev[n] is garbage but
                             * its value will never be used.
                             */
                        } while (--n);

                        more += _w_size;
                    }
                    if (s.strm.avail_in === 0) {
                        break;
                    }

                    /* If there was no sliding:
                     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
                     *    more == window_size - lookahead - strstart
                     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
                     * => more >= window_size - 2*WSIZE + 2
                     * In the BIG_MEM or MMAP case (not yet supported),
                     *   window_size == input_size + MIN_LOOKAHEAD  &&
                     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
                     * Otherwise, window_size == 2*WSIZE so more >= 2.
                     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
                     */
                    //Assert(more >= 2, "more < 2");
                    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
                    s.lookahead += n;

                    /* Initialize the hash value now that we have some input: */
                    if (s.lookahead + s.insert >= MIN_MATCH) {
                        str = s.strstart - s.insert;
                        s.ins_h = s.window[str];

                        /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
                        //#if MIN_MATCH != 3
                        //        Call update_hash() MIN_MATCH-3 more times
                        //#endif
                        while (s.insert) {
                            /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
                            s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

                            s.prev[str & s.w_mask] = s.head[s.ins_h];
                            s.head[s.ins_h] = str;
                            str++;
                            s.insert--;
                            if (s.lookahead + s.insert < MIN_MATCH) {
                                break;
                            }
                        }
                    }
                    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
                     * but this is not important since only literal bytes will be emitted.
                     */

                } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

                /* If the WIN_INIT bytes after the end of the current data have never been
                 * written, then zero those bytes in order to avoid memory check reports of
                 * the use of uninitialized (or uninitialised as Julian writes) bytes by
                 * the longest match routines.  Update the high water mark for the next
                 * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
                 * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
                 */
                //  if (s.high_water < s.window_size) {
                //    var curr = s.strstart + s.lookahead;
                //    var init = 0;
                //
                //    if (s.high_water < curr) {
                //      /* Previous high water mark below current data -- zero WIN_INIT
                //       * bytes or up to end of window, whichever is less.
                //       */
                //      init = s.window_size - curr;
                //      if (init > WIN_INIT)
                //        init = WIN_INIT;
                //      zmemzero(s->window + curr, (unsigned)init);
                //      s->high_water = curr + init;
                //    }
                //    else if (s->high_water < (ulg)curr + WIN_INIT) {
                //      /* High water mark at or above current data, but below current data
                //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
                //       * to end of window, whichever is less.
                //       */
                //      init = (ulg)curr + WIN_INIT - s->high_water;
                //      if (init > s->window_size - s->high_water)
                //        init = s->window_size - s->high_water;
                //      zmemzero(s->window + s->high_water, (unsigned)init);
                //      s->high_water += init;
                //    }
                //  }
                //
                //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
                //    "not enough room for search");
            }

            /* ===========================================================================
             * Copy without compression as much as possible from the input stream, return
             * the current block state.
             * This function does not insert new strings in the dictionary since
             * uncompressible data is probably not useful. This function is used
             * only for the level=0 compression option.
             * NOTE: this function should be optimized to avoid extra copying from
             * window to pending_buf.
             */
            function deflate_stored(s, flush) {
                /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
                 * to pending_buf_size, and each stored block has a 5 byte header:
                 */
                var max_block_size = 0xffff;

                if (max_block_size > s.pending_buf_size - 5) {
                    max_block_size = s.pending_buf_size - 5;
                }

                /* Copy as much as possible from input to output: */
                for (; ;) {
                    /* Fill the window as much as possible: */
                    if (s.lookahead <= 1) {

                        //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
                        //  s->block_start >= (long)s->w_size, "slide too late");
                        //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
                        //        s.block_start >= s.w_size)) {
                        //        throw  new Error("slide too late");
                        //      }

                        fill_window(s);
                        if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
                            return BS_NEED_MORE;
                        }

                        if (s.lookahead === 0) {
                            break;
                        }
                        /* flush the current block */
                    }
                    //Assert(s->block_start >= 0L, "block gone");
                    //    if (s.block_start < 0) throw new Error("block gone");

                    s.strstart += s.lookahead;
                    s.lookahead = 0;

                    /* Emit a stored block if pending_buf will be full: */
                    var max_start = s.block_start + max_block_size;

                    if (s.strstart === 0 || s.strstart >= max_start) {
                        /* strstart == 0 is possible when wraparound on 16-bit machine */
                        s.lookahead = s.strstart - max_start;
                        s.strstart = max_start;
                        /*** FLUSH_BLOCK(s, 0); ***/
                        flush_block_only(s, false);
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                        /***/


                    }
                    /* Flush if we may have to slide, otherwise block_start may become
                     * negative and the data will be gone:
                     */
                    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
                        /*** FLUSH_BLOCK(s, 0); ***/
                        flush_block_only(s, false);
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                        /***/
                    }
                }

                s.insert = 0;

                if (flush === Z_FINISH) {
                    /*** FLUSH_BLOCK(s, 1); ***/
                    flush_block_only(s, true);
                    if (s.strm.avail_out === 0) {
                        return BS_FINISH_STARTED;
                    }
                    /***/
                    return BS_FINISH_DONE;
                }

                if (s.strstart > s.block_start) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }

                return BS_NEED_MORE;
            }

            /* ===========================================================================
             * Compress as much as possible from the input stream, return the current
             * block state.
             * This function does not perform lazy evaluation of matches and inserts
             * new strings in the dictionary only for unmatched strings or for short
             * matches. It is used only for the fast compression options.
             */
            function deflate_fast(s, flush) {
                var hash_head;        /* head of the hash chain */
                var bflush;           /* set if current block must be flushed */

                for (; ;) {
                    /* Make sure that we always have enough lookahead, except
                     * at the end of the input file. We need MAX_MATCH bytes
                     * for the next match, plus MIN_MATCH bytes to insert the
                     * string following the next match.
                     */
                    if (s.lookahead < MIN_LOOKAHEAD) {
                        fill_window(s);
                        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                            return BS_NEED_MORE;
                        }
                        if (s.lookahead === 0) {
                            break; /* flush the current block */
                        }
                    }

                    /* Insert the string window[strstart .. strstart+2] in the
                     * dictionary, and set hash_head to the head of the hash chain:
                     */
                    hash_head = 0/*NIL*/;
                    if (s.lookahead >= MIN_MATCH) {
                        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                        /***/
                    }

                    /* Find the longest match, discarding those <= prev_length.
                     * At this point we have always match_length < MIN_MATCH
                     */
                    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
                        /* To simplify the code, we prevent matches with the string
                         * of window index 0 (in particular we have to avoid a match
                         * of the string with itself at the start of the input file).
                         */
                        s.match_length = longest_match(s, hash_head);
                        /* longest_match() sets match_start */
                    }
                    if (s.match_length >= MIN_MATCH) {
                        // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

                        /*** _tr_tally_dist(s, s.strstart - s.match_start,
                                       s.match_length - MIN_MATCH, bflush); ***/
                        bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

                        s.lookahead -= s.match_length;

                        /* Insert new strings in the hash table only if the match length
                         * is not too large. This saves time but degrades compression.
                         */
                        if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
                            s.match_length--; /* string at strstart already in table */
                            do {
                                s.strstart++;
                                /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                                s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                                s.head[s.ins_h] = s.strstart;
                                /***/
                                /* strstart never exceeds WSIZE-MAX_MATCH, so there are
                                 * always MIN_MATCH bytes ahead.
                                 */
                            } while (--s.match_length !== 0);
                            s.strstart++;
                        } else {
                            s.strstart += s.match_length;
                            s.match_length = 0;
                            s.ins_h = s.window[s.strstart];
                            /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
                            s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

                            //#if MIN_MATCH != 3
                            //                Call UPDATE_HASH() MIN_MATCH-3 more times
                            //#endif
                            /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
                             * matter since it will be recomputed at next deflate call.
                             */
                        }
                    } else {
                        /* No match, output a literal byte */
                        //Tracevv((stderr,"%c", s.window[s.strstart]));
                        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
                        bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

                        s.lookahead--;
                        s.strstart++;
                    }
                    if (bflush) {
                        /*** FLUSH_BLOCK(s, 0); ***/
                        flush_block_only(s, false);
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                        /***/
                    }
                }
                s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
                if (flush === Z_FINISH) {
                    /*** FLUSH_BLOCK(s, 1); ***/
                    flush_block_only(s, true);
                    if (s.strm.avail_out === 0) {
                        return BS_FINISH_STARTED;
                    }
                    /***/
                    return BS_FINISH_DONE;
                }
                if (s.last_lit) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }
                return BS_BLOCK_DONE;
            }

            /* ===========================================================================
             * Same as above, but achieves better compression. We use a lazy
             * evaluation for matches: a match is finally adopted only if there is
             * no better match at the next window position.
             */
            function deflate_slow(s, flush) {
                var hash_head;          /* head of hash chain */
                var bflush;              /* set if current block must be flushed */

                var max_insert;

                /* Process the input block. */
                for (; ;) {
                    /* Make sure that we always have enough lookahead, except
                     * at the end of the input file. We need MAX_MATCH bytes
                     * for the next match, plus MIN_MATCH bytes to insert the
                     * string following the next match.
                     */
                    if (s.lookahead < MIN_LOOKAHEAD) {
                        fill_window(s);
                        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                            return BS_NEED_MORE;
                        }
                        if (s.lookahead === 0) { break; } /* flush the current block */
                    }

                    /* Insert the string window[strstart .. strstart+2] in the
                     * dictionary, and set hash_head to the head of the hash chain:
                     */
                    hash_head = 0/*NIL*/;
                    if (s.lookahead >= MIN_MATCH) {
                        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                        /***/
                    }

                    /* Find the longest match, discarding those <= prev_length.
                     */
                    s.prev_length = s.match_length;
                    s.prev_match = s.match_start;
                    s.match_length = MIN_MATCH - 1;

                    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
                        s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
                        /* To simplify the code, we prevent matches with the string
                         * of window index 0 (in particular we have to avoid a match
                         * of the string with itself at the start of the input file).
                         */
                        s.match_length = longest_match(s, hash_head);
                        /* longest_match() sets match_start */

                        if (s.match_length <= 5 &&
                            (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

                            /* If prev_match is also MIN_MATCH, match_start is garbage
                             * but we will ignore the current match anyway.
                             */
                            s.match_length = MIN_MATCH - 1;
                        }
                    }
                    /* If there was a match at the previous step and the current
                     * match is not better, output the previous match:
                     */
                    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
                        max_insert = s.strstart + s.lookahead - MIN_MATCH;
                        /* Do not insert strings in hash table beyond this. */

                        //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

                        /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                                       s.prev_length - MIN_MATCH, bflush);***/
                        bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
                        /* Insert in hash table all strings up to the end of the match.
                         * strstart-1 and strstart are already inserted. If there is not
                         * enough lookahead, the last two strings are not inserted in
                         * the hash table.
                         */
                        s.lookahead -= s.prev_length - 1;
                        s.prev_length -= 2;
                        do {
                            if (++s.strstart <= max_insert) {
                                /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                                s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                                s.head[s.ins_h] = s.strstart;
                                /***/
                            }
                        } while (--s.prev_length !== 0);
                        s.match_available = 0;
                        s.match_length = MIN_MATCH - 1;
                        s.strstart++;

                        if (bflush) {
                            /*** FLUSH_BLOCK(s, 0); ***/
                            flush_block_only(s, false);
                            if (s.strm.avail_out === 0) {
                                return BS_NEED_MORE;
                            }
                            /***/
                        }

                    } else if (s.match_available) {
                        /* If there was no match at the previous position, output a
                         * single literal. If there was a match but the current match
                         * is longer, truncate the previous match to a single literal.
                         */
                        //Tracevv((stderr,"%c", s->window[s->strstart-1]));
                        /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
                        bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

                        if (bflush) {
                            /*** FLUSH_BLOCK_ONLY(s, 0) ***/
                            flush_block_only(s, false);
                            /***/
                        }
                        s.strstart++;
                        s.lookahead--;
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                    } else {
                        /* There is no previous match to compare with, wait for
                         * the next step to decide.
                         */
                        s.match_available = 1;
                        s.strstart++;
                        s.lookahead--;
                    }
                }
                //Assert (flush != Z_NO_FLUSH, "no flush?");
                if (s.match_available) {
                    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
                    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
                    bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

                    s.match_available = 0;
                }
                s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
                if (flush === Z_FINISH) {
                    /*** FLUSH_BLOCK(s, 1); ***/
                    flush_block_only(s, true);
                    if (s.strm.avail_out === 0) {
                        return BS_FINISH_STARTED;
                    }
                    /***/
                    return BS_FINISH_DONE;
                }
                if (s.last_lit) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }

                return BS_BLOCK_DONE;
            }


            /* ===========================================================================
             * For Z_RLE, simply look for runs of bytes, generate matches only of distance
             * one.  Do not maintain a hash table.  (It will be regenerated if this run of
             * deflate switches away from Z_RLE.)
             */
            function deflate_rle(s, flush) {
                var bflush;            /* set if current block must be flushed */
                var prev;              /* byte at distance one to match */
                var scan, strend;      /* scan goes up to strend for length of run */

                var _win = s.window;

                for (; ;) {
                    /* Make sure that we always have enough lookahead, except
                     * at the end of the input file. We need MAX_MATCH bytes
                     * for the longest run, plus one for the unrolled loop.
                     */
                    if (s.lookahead <= MAX_MATCH) {
                        fill_window(s);
                        if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
                            return BS_NEED_MORE;
                        }
                        if (s.lookahead === 0) { break; } /* flush the current block */
                    }

                    /* See how many times the previous byte repeats */
                    s.match_length = 0;
                    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
                        scan = s.strstart - 1;
                        prev = _win[scan];
                        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
                            strend = s.strstart + MAX_MATCH;
                            do {
                                /*jshint noempty:false*/
                            } while (prev === _win[++scan] && prev === _win[++scan] &&
                            prev === _win[++scan] && prev === _win[++scan] &&
                            prev === _win[++scan] && prev === _win[++scan] &&
                            prev === _win[++scan] && prev === _win[++scan] &&
                                scan < strend);
                            s.match_length = MAX_MATCH - (strend - scan);
                            if (s.match_length > s.lookahead) {
                                s.match_length = s.lookahead;
                            }
                        }
                        //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
                    }

                    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
                    if (s.match_length >= MIN_MATCH) {
                        //check_match(s, s.strstart, s.strstart - 1, s.match_length);

                        /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
                        bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

                        s.lookahead -= s.match_length;
                        s.strstart += s.match_length;
                        s.match_length = 0;
                    } else {
                        /* No match, output a literal byte */
                        //Tracevv((stderr,"%c", s->window[s->strstart]));
                        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
                        bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

                        s.lookahead--;
                        s.strstart++;
                    }
                    if (bflush) {
                        /*** FLUSH_BLOCK(s, 0); ***/
                        flush_block_only(s, false);
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                        /***/
                    }
                }
                s.insert = 0;
                if (flush === Z_FINISH) {
                    /*** FLUSH_BLOCK(s, 1); ***/
                    flush_block_only(s, true);
                    if (s.strm.avail_out === 0) {
                        return BS_FINISH_STARTED;
                    }
                    /***/
                    return BS_FINISH_DONE;
                }
                if (s.last_lit) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }
                return BS_BLOCK_DONE;
            }

            /* ===========================================================================
             * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
             * (It will be regenerated if this run of deflate switches away from Huffman.)
             */
            function deflate_huff(s, flush) {
                var bflush;             /* set if current block must be flushed */

                for (; ;) {
                    /* Make sure that we have a literal to write. */
                    if (s.lookahead === 0) {
                        fill_window(s);
                        if (s.lookahead === 0) {
                            if (flush === Z_NO_FLUSH) {
                                return BS_NEED_MORE;
                            }
                            break;      /* flush the current block */
                        }
                    }

                    /* Output a literal byte */
                    s.match_length = 0;
                    //Tracevv((stderr,"%c", s->window[s->strstart]));
                    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
                    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
                    s.lookahead--;
                    s.strstart++;
                    if (bflush) {
                        /*** FLUSH_BLOCK(s, 0); ***/
                        flush_block_only(s, false);
                        if (s.strm.avail_out === 0) {
                            return BS_NEED_MORE;
                        }
                        /***/
                    }
                }
                s.insert = 0;
                if (flush === Z_FINISH) {
                    /*** FLUSH_BLOCK(s, 1); ***/
                    flush_block_only(s, true);
                    if (s.strm.avail_out === 0) {
                        return BS_FINISH_STARTED;
                    }
                    /***/
                    return BS_FINISH_DONE;
                }
                if (s.last_lit) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }
                return BS_BLOCK_DONE;
            }

            /* Values for max_lazy_match, good_match and max_chain_length, depending on
             * the desired pack level (0..9). The values given below have been tuned to
             * exclude worst case performance for pathological files. Better values may be
             * found for specific files.
             */
            function Config(good_length, max_lazy, nice_length, max_chain, func) {
                this.good_length = good_length;
                this.max_lazy = max_lazy;
                this.nice_length = nice_length;
                this.max_chain = max_chain;
                this.func = func;
            }

            var configuration_table;

            configuration_table = [
                /*      good lazy nice chain */
                new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
                new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
                new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
                new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

                new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
                new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
                new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
                new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
                new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
                new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
            ];


            /* ===========================================================================
             * Initialize the "longest match" routines for a new zlib stream
             */
            function lm_init(s) {
                s.window_size = 2 * s.w_size;

                /*** CLEAR_HASH(s); ***/
                zero(s.head); // Fill with NIL (= 0);

                /* Set the default configuration parameters:
                 */
                s.max_lazy_match = configuration_table[s.level].max_lazy;
                s.good_match = configuration_table[s.level].good_length;
                s.nice_match = configuration_table[s.level].nice_length;
                s.max_chain_length = configuration_table[s.level].max_chain;

                s.strstart = 0;
                s.block_start = 0;
                s.lookahead = 0;
                s.insert = 0;
                s.match_length = s.prev_length = MIN_MATCH - 1;
                s.match_available = 0;
                s.ins_h = 0;
            }


            function DeflateState() {
                this.strm = null;            /* pointer back to this zlib stream */
                this.status = 0;            /* as the name implies */
                this.pending_buf = null;      /* output still pending */
                this.pending_buf_size = 0;  /* size of pending_buf */
                this.pending_out = 0;       /* next pending byte to output to the stream */
                this.pending = 0;           /* nb of bytes in the pending buffer */
                this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
                this.gzhead = null;         /* gzip header information to write */
                this.gzindex = 0;           /* where in extra, name, or comment */
                this.method = Z_DEFLATED; /* can only be DEFLATED */
                this.last_flush = -1;   /* value of flush param for previous deflate call */

                this.w_size = 0;  /* LZ77 window size (32K by default) */
                this.w_bits = 0;  /* log2(w_size)  (8..16) */
                this.w_mask = 0;  /* w_size - 1 */

                this.window = null;
                /* Sliding window. Input bytes are read into the second half of the window,
                 * and move to the first half later to keep a dictionary of at least wSize
                 * bytes. With this organization, matches are limited to a distance of
                 * wSize-MAX_MATCH bytes, but this ensures that IO is always
                 * performed with a length multiple of the block size.
                 */

                this.window_size = 0;
                /* Actual size of window: 2*wSize, except when the user input buffer
                 * is directly used as sliding window.
                 */

                this.prev = null;
                /* Link to older string with same hash index. To limit the size of this
                 * array to 64K, this link is maintained only for the last 32K strings.
                 * An index in this array is thus a window index modulo 32K.
                 */

                this.head = null;   /* Heads of the hash chains or NIL. */

                this.ins_h = 0;       /* hash index of string to be inserted */
                this.hash_size = 0;   /* number of elements in hash table */
                this.hash_bits = 0;   /* log2(hash_size) */
                this.hash_mask = 0;   /* hash_size-1 */

                this.hash_shift = 0;
                /* Number of bits by which ins_h must be shifted at each input
                 * step. It must be such that after MIN_MATCH steps, the oldest
                 * byte no longer takes part in the hash key, that is:
                 *   hash_shift * MIN_MATCH >= hash_bits
                 */

                this.block_start = 0;
                /* Window position at the beginning of the current output block. Gets
                 * negative when the window is moved backwards.
                 */

                this.match_length = 0;      /* length of best match */
                this.prev_match = 0;        /* previous match */
                this.match_available = 0;   /* set if previous match exists */
                this.strstart = 0;          /* start of string to insert */
                this.match_start = 0;       /* start of matching string */
                this.lookahead = 0;         /* number of valid bytes ahead in window */

                this.prev_length = 0;
                /* Length of the best match at previous step. Matches not greater than this
                 * are discarded. This is used in the lazy match evaluation.
                 */

                this.max_chain_length = 0;
                /* To speed up deflation, hash chains are never searched beyond this
                 * length.  A higher limit improves compression ratio but degrades the
                 * speed.
                 */

                this.max_lazy_match = 0;
                /* Attempt to find a better match only when the current match is strictly
                 * smaller than this value. This mechanism is used only for compression
                 * levels >= 4.
                 */
                // That's alias to max_lazy_match, don't use directly
                //this.max_insert_length = 0;
                /* Insert new strings in the hash table only if the match length is not
                 * greater than this length. This saves time but degrades compression.
                 * max_insert_length is used only for compression levels <= 3.
                 */

                this.level = 0;     /* compression level (1..9) */
                this.strategy = 0;  /* favor or force Huffman coding*/

                this.good_match = 0;
                /* Use a faster search when the previous match is longer than this */

                this.nice_match = 0; /* Stop searching when current match exceeds this */

                /* used by trees.c: */

                /* Didn't use ct_data typedef below to suppress compiler warning */

                // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
                // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
                // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

                // Use flat array of DOUBLE size, with interleaved fata,
                // because JS does not support effective
                this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
                this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
                this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
                zero(this.dyn_ltree);
                zero(this.dyn_dtree);
                zero(this.bl_tree);

                this.l_desc = null;         /* desc. for literal tree */
                this.d_desc = null;         /* desc. for distance tree */
                this.bl_desc = null;         /* desc. for bit length tree */

                //ush bl_count[MAX_BITS+1];
                this.bl_count = new utils.Buf16(MAX_BITS + 1);
                /* number of codes at each bit length for an optimal tree */

                //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
                this.heap = new utils.Buf16(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
                zero(this.heap);

                this.heap_len = 0;               /* number of elements in the heap */
                this.heap_max = 0;               /* element of largest frequency */
                /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
                 * The same heap array is used to build all trees.
                 */

                this.depth = new utils.Buf16(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
                zero(this.depth);
                /* Depth of each subtree used as tie breaker for trees of equal frequency
                 */

                this.l_buf = 0;          /* buffer index for literals or lengths */

                this.lit_bufsize = 0;
                /* Size of match buffer for literals/lengths.  There are 4 reasons for
                 * limiting lit_bufsize to 64K:
                 *   - frequencies can be kept in 16 bit counters
                 *   - if compression is not successful for the first block, all input
                 *     data is still in the window so we can still emit a stored block even
                 *     when input comes from standard input.  (This can also be done for
                 *     all blocks if lit_bufsize is not greater than 32K.)
                 *   - if compression is not successful for a file smaller than 64K, we can
                 *     even emit a stored file instead of a stored block (saving 5 bytes).
                 *     This is applicable only for zip (not gzip or zlib).
                 *   - creating new Huffman trees less frequently may not provide fast
                 *     adaptation to changes in the input data statistics. (Take for
                 *     example a binary file with poorly compressible code followed by
                 *     a highly compressible string table.) Smaller buffer sizes give
                 *     fast adaptation but have of course the overhead of transmitting
                 *     trees more frequently.
                 *   - I can't count above 4
                 */

                this.last_lit = 0;      /* running index in l_buf */

                this.d_buf = 0;
                /* Buffer index for distances. To simplify the code, d_buf and l_buf have
                 * the same number of elements. To use different lengths, an extra flag
                 * array would be necessary.
                 */

                this.opt_len = 0;       /* bit length of current block with optimal trees */
                this.static_len = 0;    /* bit length of current block with static trees */
                this.matches = 0;       /* number of string matches in current block */
                this.insert = 0;        /* bytes at end of window left to insert */


                this.bi_buf = 0;
                /* Output buffer. bits are inserted starting at the bottom (least
                 * significant bits).
                 */
                this.bi_valid = 0;
                /* Number of valid bits in bi_buf.  All bits above the last valid bit
                 * are always zero.
                 */

                // Used for window memory init. We safely ignore it for JS. That makes
                // sense only for pointers and memory check tools.
                //this.high_water = 0;
                /* High water mark offset in window for initialized bytes -- bytes above
                 * this are set to zero in order to avoid memory check warnings when
                 * longest match routines access bytes past the input.  This is then
                 * updated to the new high water mark.
                 */
            }


            function deflateResetKeep(strm) {
                var s;

                if (!strm || !strm.state) {
                    return err(strm, Z_STREAM_ERROR);
                }

                strm.total_in = strm.total_out = 0;
                strm.data_type = Z_UNKNOWN;

                s = strm.state;
                s.pending = 0;
                s.pending_out = 0;

                if (s.wrap < 0) {
                    s.wrap = -s.wrap;
                    /* was made negative by deflate(..., Z_FINISH); */
                }
                s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
                strm.adler = (s.wrap === 2) ?
                    0  // crc32(0, Z_NULL, 0)
                    :
                    1; // adler32(0, Z_NULL, 0)
                s.last_flush = Z_NO_FLUSH;
                trees._tr_init(s);
                return Z_OK;
            }


            function deflateReset(strm) {
                var ret = deflateResetKeep(strm);
                if (ret === Z_OK) {
                    lm_init(strm.state);
                }
                return ret;
            }


            function deflateSetHeader(strm, head) {
                if (!strm || !strm.state) { return Z_STREAM_ERROR; }
                if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
                strm.state.gzhead = head;
                return Z_OK;
            }


            function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
                if (!strm) { // === Z_NULL
                    return Z_STREAM_ERROR;
                }
                var wrap = 1;

                if (level === Z_DEFAULT_COMPRESSION) {
                    level = 6;
                }

                if (windowBits < 0) { /* suppress zlib wrapper */
                    wrap = 0;
                    windowBits = -windowBits;
                }

                else if (windowBits > 15) {
                    wrap = 2;           /* write gzip wrapper instead */
                    windowBits -= 16;
                }


                if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
                    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
                    strategy < 0 || strategy > Z_FIXED) {
                    return err(strm, Z_STREAM_ERROR);
                }


                if (windowBits === 8) {
                    windowBits = 9;
                }
                /* until 256-byte window bug fixed */

                var s = new DeflateState();

                strm.state = s;
                s.strm = strm;

                s.wrap = wrap;
                s.gzhead = null;
                s.w_bits = windowBits;
                s.w_size = 1 << s.w_bits;
                s.w_mask = s.w_size - 1;

                s.hash_bits = memLevel + 7;
                s.hash_size = 1 << s.hash_bits;
                s.hash_mask = s.hash_size - 1;
                s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

                s.window = new utils.Buf8(s.w_size * 2);
                s.head = new utils.Buf16(s.hash_size);
                s.prev = new utils.Buf16(s.w_size);

                // Don't need mem init magic for JS.
                //s.high_water = 0;  /* nothing written to s->window yet */

                s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

                s.pending_buf_size = s.lit_bufsize * 4;

                //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
                //s->pending_buf = (uchf *) overlay;
                s.pending_buf = new utils.Buf8(s.pending_buf_size);

                // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
                //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
                s.d_buf = 1 * s.lit_bufsize;

                //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
                s.l_buf = (1 + 2) * s.lit_bufsize;

                s.level = level;
                s.strategy = strategy;
                s.method = method;

                return deflateReset(strm);
            }

            function deflateInit(strm, level) {
                return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
            }


            function deflate(strm, flush) {
                var old_flush, s;
                var beg, val; // for gzip header write only

                if (!strm || !strm.state ||
                    flush > Z_BLOCK || flush < 0) {
                    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
                }

                s = strm.state;

                if (!strm.output ||
                    (!strm.input && strm.avail_in !== 0) ||
                    (s.status === FINISH_STATE && flush !== Z_FINISH)) {
                    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
                }

                s.strm = strm; /* just in case */
                old_flush = s.last_flush;
                s.last_flush = flush;

                /* Write the header */
                if (s.status === INIT_STATE) {

                    if (s.wrap === 2) { // GZIP header
                        strm.adler = 0;  //crc32(0L, Z_NULL, 0);
                        put_byte(s, 31);
                        put_byte(s, 139);
                        put_byte(s, 8);
                        if (!s.gzhead) { // s->gzhead == Z_NULL
                            put_byte(s, 0);
                            put_byte(s, 0);
                            put_byte(s, 0);
                            put_byte(s, 0);
                            put_byte(s, 0);
                            put_byte(s, s.level === 9 ? 2 :
                                (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                                    4 : 0));
                            put_byte(s, OS_CODE);
                            s.status = BUSY_STATE;
                        }
                        else {
                            put_byte(s, (s.gzhead.text ? 1 : 0) +
                                (s.gzhead.hcrc ? 2 : 0) +
                                (!s.gzhead.extra ? 0 : 4) +
                                (!s.gzhead.name ? 0 : 8) +
                                (!s.gzhead.comment ? 0 : 16)
                            );
                            put_byte(s, s.gzhead.time & 0xff);
                            put_byte(s, (s.gzhead.time >> 8) & 0xff);
                            put_byte(s, (s.gzhead.time >> 16) & 0xff);
                            put_byte(s, (s.gzhead.time >> 24) & 0xff);
                            put_byte(s, s.level === 9 ? 2 :
                                (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                                    4 : 0));
                            put_byte(s, s.gzhead.os & 0xff);
                            if (s.gzhead.extra && s.gzhead.extra.length) {
                                put_byte(s, s.gzhead.extra.length & 0xff);
                                put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
                            }
                            if (s.gzhead.hcrc) {
                                strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
                            }
                            s.gzindex = 0;
                            s.status = EXTRA_STATE;
                        }
                    }
                    else // DEFLATE header
                    {
                        var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
                        var level_flags = -1;

                        if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
                            level_flags = 0;
                        } else if (s.level < 6) {
                            level_flags = 1;
                        } else if (s.level === 6) {
                            level_flags = 2;
                        } else {
                            level_flags = 3;
                        }
                        header |= (level_flags << 6);
                        if (s.strstart !== 0) { header |= PRESET_DICT; }
                        header += 31 - (header % 31);

                        s.status = BUSY_STATE;
                        putShortMSB(s, header);

                        /* Save the adler32 of the preset dictionary: */
                        if (s.strstart !== 0) {
                            putShortMSB(s, strm.adler >>> 16);
                            putShortMSB(s, strm.adler & 0xffff);
                        }
                        strm.adler = 1; // adler32(0L, Z_NULL, 0);
                    }
                }

                //#ifdef GZIP
                if (s.status === EXTRA_STATE) {
                    if (s.gzhead.extra/* != Z_NULL*/) {
                        beg = s.pending;  /* start of bytes to update crc */

                        while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
                            if (s.pending === s.pending_buf_size) {
                                if (s.gzhead.hcrc && s.pending > beg) {
                                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                                }
                                flush_pending(strm);
                                beg = s.pending;
                                if (s.pending === s.pending_buf_size) {
                                    break;
                                }
                            }
                            put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
                            s.gzindex++;
                        }
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        if (s.gzindex === s.gzhead.extra.length) {
                            s.gzindex = 0;
                            s.status = NAME_STATE;
                        }
                    }
                    else {
                        s.status = NAME_STATE;
                    }
                }
                if (s.status === NAME_STATE) {
                    if (s.gzhead.name/* != Z_NULL*/) {
                        beg = s.pending;  /* start of bytes to update crc */
                        //int val;

                        do {
                            if (s.pending === s.pending_buf_size) {
                                if (s.gzhead.hcrc && s.pending > beg) {
                                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                                }
                                flush_pending(strm);
                                beg = s.pending;
                                if (s.pending === s.pending_buf_size) {
                                    val = 1;
                                    break;
                                }
                            }
                            // JS specific: little magic to add zero terminator to end of string
                            if (s.gzindex < s.gzhead.name.length) {
                                val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
                            } else {
                                val = 0;
                            }
                            put_byte(s, val);
                        } while (val !== 0);

                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        if (val === 0) {
                            s.gzindex = 0;
                            s.status = COMMENT_STATE;
                        }
                    }
                    else {
                        s.status = COMMENT_STATE;
                    }
                }
                if (s.status === COMMENT_STATE) {
                    if (s.gzhead.comment/* != Z_NULL*/) {
                        beg = s.pending;  /* start of bytes to update crc */
                        //int val;

                        do {
                            if (s.pending === s.pending_buf_size) {
                                if (s.gzhead.hcrc && s.pending > beg) {
                                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                                }
                                flush_pending(strm);
                                beg = s.pending;
                                if (s.pending === s.pending_buf_size) {
                                    val = 1;
                                    break;
                                }
                            }
                            // JS specific: little magic to add zero terminator to end of string
                            if (s.gzindex < s.gzhead.comment.length) {
                                val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
                            } else {
                                val = 0;
                            }
                            put_byte(s, val);
                        } while (val !== 0);

                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        if (val === 0) {
                            s.status = HCRC_STATE;
                        }
                    }
                    else {
                        s.status = HCRC_STATE;
                    }
                }
                if (s.status === HCRC_STATE) {
                    if (s.gzhead.hcrc) {
                        if (s.pending + 2 > s.pending_buf_size) {
                            flush_pending(strm);
                        }
                        if (s.pending + 2 <= s.pending_buf_size) {
                            put_byte(s, strm.adler & 0xff);
                            put_byte(s, (strm.adler >> 8) & 0xff);
                            strm.adler = 0; //crc32(0L, Z_NULL, 0);
                            s.status = BUSY_STATE;
                        }
                    }
                    else {
                        s.status = BUSY_STATE;
                    }
                }
                //#endif

                /* Flush as much pending output as possible */
                if (s.pending !== 0) {
                    flush_pending(strm);
                    if (strm.avail_out === 0) {
                        /* Since avail_out is 0, deflate will be called again with
                         * more output space, but possibly with both pending and
                         * avail_in equal to zero. There won't be anything to do,
                         * but this is not an error situation so make sure we
                         * return OK instead of BUF_ERROR at next call of deflate:
                         */
                        s.last_flush = -1;
                        return Z_OK;
                    }

                    /* Make sure there is something to do and avoid duplicate consecutive
                     * flushes. For repeated and useless calls with Z_FINISH, we keep
                     * returning Z_STREAM_END instead of Z_BUF_ERROR.
                     */
                } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
                    flush !== Z_FINISH) {
                    return err(strm, Z_BUF_ERROR);
                }

                /* User must not provide more input after the first FINISH: */
                if (s.status === FINISH_STATE && strm.avail_in !== 0) {
                    return err(strm, Z_BUF_ERROR);
                }

                /* Start a new block or continue the current one.
                 */
                if (strm.avail_in !== 0 || s.lookahead !== 0 ||
                    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
                    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
                        (s.strategy === Z_RLE ? deflate_rle(s, flush) :
                            configuration_table[s.level].func(s, flush));

                    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
                        s.status = FINISH_STATE;
                    }
                    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
                        if (strm.avail_out === 0) {
                            s.last_flush = -1;
                            /* avoid BUF_ERROR next call, see above */
                        }
                        return Z_OK;
                        /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
                         * of deflate should use the same flush parameter to make sure
                         * that the flush is complete. So we don't have to output an
                         * empty block here, this will be done at next call. This also
                         * ensures that for a very small output buffer, we emit at most
                         * one empty block.
                         */
                    }
                    if (bstate === BS_BLOCK_DONE) {
                        if (flush === Z_PARTIAL_FLUSH) {
                            trees._tr_align(s);
                        }
                        else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

                            trees._tr_stored_block(s, 0, 0, false);
                            /* For a full flush, this empty block will be recognized
                             * as a special marker by inflate_sync().
                             */
                            if (flush === Z_FULL_FLUSH) {
                                /*** CLEAR_HASH(s); ***/             /* forget history */
                                zero(s.head); // Fill with NIL (= 0);

                                if (s.lookahead === 0) {
                                    s.strstart = 0;
                                    s.block_start = 0;
                                    s.insert = 0;
                                }
                            }
                        }
                        flush_pending(strm);
                        if (strm.avail_out === 0) {
                            s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
                            return Z_OK;
                        }
                    }
                }
                //Assert(strm->avail_out > 0, "bug2");
                //if (strm.avail_out <= 0) { throw new Error("bug2");}

                if (flush !== Z_FINISH) { return Z_OK; }
                if (s.wrap <= 0) { return Z_STREAM_END; }

                /* Write the trailer */
                if (s.wrap === 2) {
                    put_byte(s, strm.adler & 0xff);
                    put_byte(s, (strm.adler >> 8) & 0xff);
                    put_byte(s, (strm.adler >> 16) & 0xff);
                    put_byte(s, (strm.adler >> 24) & 0xff);
                    put_byte(s, strm.total_in & 0xff);
                    put_byte(s, (strm.total_in >> 8) & 0xff);
                    put_byte(s, (strm.total_in >> 16) & 0xff);
                    put_byte(s, (strm.total_in >> 24) & 0xff);
                }
                else {
                    putShortMSB(s, strm.adler >>> 16);
                    putShortMSB(s, strm.adler & 0xffff);
                }

                flush_pending(strm);
                /* If avail_out is zero, the application will call deflate again
                 * to flush the rest.
                 */
                if (s.wrap > 0) { s.wrap = -s.wrap; }
                /* write the trailer only once! */
                return s.pending !== 0 ? Z_OK : Z_STREAM_END;
            }

            function deflateEnd(strm) {
                var status;

                if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
                    return Z_STREAM_ERROR;
                }

                status = strm.state.status;
                if (status !== INIT_STATE &&
                    status !== EXTRA_STATE &&
                    status !== NAME_STATE &&
                    status !== COMMENT_STATE &&
                    status !== HCRC_STATE &&
                    status !== BUSY_STATE &&
                    status !== FINISH_STATE
                ) {
                    return err(strm, Z_STREAM_ERROR);
                }

                strm.state = null;

                return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
            }


            /* =========================================================================
             * Initializes the compression dictionary from the given byte
             * sequence without producing any compressed output.
             */
            function deflateSetDictionary(strm, dictionary) {
                var dictLength = dictionary.length;

                var s;
                var str, n;
                var wrap;
                var avail;
                var next;
                var input;
                var tmpDict;

                if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
                    return Z_STREAM_ERROR;
                }

                s = strm.state;
                wrap = s.wrap;

                if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
                    return Z_STREAM_ERROR;
                }

                /* when using zlib wrappers, compute Adler-32 for provided dictionary */
                if (wrap === 1) {
                    /* adler32(strm->adler, dictionary, dictLength); */
                    strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
                }

                s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

                /* if dictionary would fill window, just replace the history */
                if (dictLength >= s.w_size) {
                    if (wrap === 0) {            /* already empty otherwise */
                        /*** CLEAR_HASH(s); ***/
                        zero(s.head); // Fill with NIL (= 0);
                        s.strstart = 0;
                        s.block_start = 0;
                        s.insert = 0;
                    }
                    /* use the tail */
                    // dictionary = dictionary.slice(dictLength - s.w_size);
                    tmpDict = new utils.Buf8(s.w_size);
                    utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
                    dictionary = tmpDict;
                    dictLength = s.w_size;
                }
                /* insert dictionary into window and hash */
                avail = strm.avail_in;
                next = strm.next_in;
                input = strm.input;
                strm.avail_in = dictLength;
                strm.next_in = 0;
                strm.input = dictionary;
                fill_window(s);
                while (s.lookahead >= MIN_MATCH) {
                    str = s.strstart;
                    n = s.lookahead - (MIN_MATCH - 1);
                    do {
                        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

                        s.prev[str & s.w_mask] = s.head[s.ins_h];

                        s.head[s.ins_h] = str;
                        str++;
                    } while (--n);
                    s.strstart = str;
                    s.lookahead = MIN_MATCH - 1;
                    fill_window(s);
                }
                s.strstart += s.lookahead;
                s.block_start = s.strstart;
                s.insert = s.lookahead;
                s.lookahead = 0;
                s.match_length = s.prev_length = MIN_MATCH - 1;
                s.match_available = 0;
                strm.next_in = next;
                strm.input = input;
                strm.avail_in = avail;
                s.wrap = wrap;
                return Z_OK;
            }


            exports.deflateInit = deflateInit;
            exports.deflateInit2 = deflateInit2;
            exports.deflateReset = deflateReset;
            exports.deflateResetKeep = deflateResetKeep;
            exports.deflateSetHeader = deflateSetHeader;
            exports.deflate = deflate;
            exports.deflateEnd = deflateEnd;
            exports.deflateSetDictionary = deflateSetDictionary;
            exports.deflateInfo = 'pako deflate (from Nodeca project)';

            /* Not implemented
            exports.deflateBound = deflateBound;
            exports.deflateCopy = deflateCopy;
            exports.deflateParams = deflateParams;
            exports.deflatePending = deflatePending;
            exports.deflatePrime = deflatePrime;
            exports.deflateTune = deflateTune;
            */

        }, { "../utils/common": 62, "./adler32": 64, "./crc32": 66, "./messages": 72, "./trees": 73 }], 68: [function (require, module, exports) {
            'use strict';


            function GZheader() {
                /* true if compressed data believed to be text */
                this.text = 0;
                /* modification time */
                this.time = 0;
                /* extra flags (not used when writing a gzip file) */
                this.xflags = 0;
                /* operating system */
                this.os = 0;
                /* pointer to extra field or Z_NULL if none */
                this.extra = null;
                /* extra field length (valid if extra != Z_NULL) */
                this.extra_len = 0; // Actually, we don't need it in JS,
                // but leave for few code modifications

                //
                // Setup limits is not necessary because in js we should not preallocate memory
                // for inflate use constant limit in 65536 bytes
                //

                /* space at extra (only when reading header) */
                // this.extra_max  = 0;
                /* pointer to zero-terminated file name or Z_NULL */
                this.name = '';
                /* space at name (only when reading header) */
                // this.name_max   = 0;
                /* pointer to zero-terminated comment or Z_NULL */
                this.comment = '';
                /* space at comment (only when reading header) */
                // this.comm_max   = 0;
                /* true if there was or will be a header crc */
                this.hcrc = 0;
                /* true when done reading gzip header (not used when writing a gzip file) */
                this.done = false;
            }

            module.exports = GZheader;

        }, {}], 69: [function (require, module, exports) {
            'use strict';

            // See state defs from inflate.js
            var BAD = 30;       /* got a data error -- remain here until reset */
            var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

            /*
               Decode literal, length, and distance codes and write out the resulting
               literal and match bytes until either not enough input or output is
               available, an end-of-block is encountered, or a data error is encountered.
               When large enough input and output buffers are supplied to inflate(), for
               example, a 16K input buffer and a 64K output buffer, more than 95% of the
               inflate execution time is spent in this routine.
            
               Entry assumptions:
            
                    state.mode === LEN
                    strm.avail_in >= 6
                    strm.avail_out >= 258
                    start >= strm.avail_out
                    state.bits < 8
            
               On return, state.mode is one of:
            
                    LEN -- ran out of enough output space or enough available input
                    TYPE -- reached end of block code, inflate() to interpret next block
                    BAD -- error in block data
            
               Notes:
            
                - The maximum input bits used by a length/distance pair is 15 bits for the
                  length code, 5 bits for the length extra, 15 bits for the distance code,
                  and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
                  Therefore if strm.avail_in >= 6, then there is enough input to avoid
                  checking for available input while decoding.
            
                - The maximum bytes that a single length/distance pair can output is 258
                  bytes, which is the maximum length that can be coded.  inflate_fast()
                  requires strm.avail_out >= 258 for each loop to avoid checking for
                  output space.
             */
            module.exports = function inflate_fast(strm, start) {
                var state;
                var _in;                    /* local strm.input */
                var last;                   /* have enough input while in < last */
                var _out;                   /* local strm.output */
                var beg;                    /* inflate()'s initial strm.output */
                var end;                    /* while out < end, enough space available */
                //#ifdef INFLATE_STRICT
                var dmax;                   /* maximum distance from zlib header */
                //#endif
                var wsize;                  /* window size or zero if not using window */
                var whave;                  /* valid bytes in the window */
                var wnext;                  /* window write index */
                // Use `s_window` instead `window`, avoid conflict with instrumentation tools
                var s_window;               /* allocated sliding window, if wsize != 0 */
                var hold;                   /* local strm.hold */
                var bits;                   /* local strm.bits */
                var lcode;                  /* local strm.lencode */
                var dcode;                  /* local strm.distcode */
                var lmask;                  /* mask for first level of length codes */
                var dmask;                  /* mask for first level of distance codes */
                var here;                   /* retrieved table entry */
                var op;                     /* code bits, operation, extra bits, or */
                /*  window position, window bytes to copy */
                var len;                    /* match length, unused bytes */
                var dist;                   /* match distance */
                var from;                   /* where to copy match from */
                var from_source;


                var input, output; // JS specific, because we have no pointers

                /* copy state to local variables */
                state = strm.state;
                //here = state.here;
                _in = strm.next_in;
                input = strm.input;
                last = _in + (strm.avail_in - 5);
                _out = strm.next_out;
                output = strm.output;
                beg = _out - (start - strm.avail_out);
                end = _out + (strm.avail_out - 257);
                //#ifdef INFLATE_STRICT
                dmax = state.dmax;
                //#endif
                wsize = state.wsize;
                whave = state.whave;
                wnext = state.wnext;
                s_window = state.window;
                hold = state.hold;
                bits = state.bits;
                lcode = state.lencode;
                dcode = state.distcode;
                lmask = (1 << state.lenbits) - 1;
                dmask = (1 << state.distbits) - 1;


                /* decode literals and length/distances until end-of-block or not enough
                   input data or output space */

                top:
                do {
                    if (bits < 15) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        hold += input[_in++] << bits;
                        bits += 8;
                    }

                    here = lcode[hold & lmask];

                    dolen:
                    for (; ;) { // Goto emulation
                        op = here >>> 24/*here.bits*/;
                        hold >>>= op;
                        bits -= op;
                        op = (here >>> 16) & 0xff/*here.op*/;
                        if (op === 0) {                          /* literal */
                            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                            //        "inflate:         literal '%c'\n" :
                            //        "inflate:         literal 0x%02x\n", here.val));
                            output[_out++] = here & 0xffff/*here.val*/;
                        }
                        else if (op & 16) {                     /* length base */
                            len = here & 0xffff/*here.val*/;
                            op &= 15;                           /* number of extra bits */
                            if (op) {
                                if (bits < op) {
                                    hold += input[_in++] << bits;
                                    bits += 8;
                                }
                                len += hold & ((1 << op) - 1);
                                hold >>>= op;
                                bits -= op;
                            }
                            //Tracevv((stderr, "inflate:         length %u\n", len));
                            if (bits < 15) {
                                hold += input[_in++] << bits;
                                bits += 8;
                                hold += input[_in++] << bits;
                                bits += 8;
                            }
                            here = dcode[hold & dmask];

                            dodist:
                            for (; ;) { // goto emulation
                                op = here >>> 24/*here.bits*/;
                                hold >>>= op;
                                bits -= op;
                                op = (here >>> 16) & 0xff/*here.op*/;

                                if (op & 16) {                      /* distance base */
                                    dist = here & 0xffff/*here.val*/;
                                    op &= 15;                       /* number of extra bits */
                                    if (bits < op) {
                                        hold += input[_in++] << bits;
                                        bits += 8;
                                        if (bits < op) {
                                            hold += input[_in++] << bits;
                                            bits += 8;
                                        }
                                    }
                                    dist += hold & ((1 << op) - 1);
                                    //#ifdef INFLATE_STRICT
                                    if (dist > dmax) {
                                        strm.msg = 'invalid distance too far back';
                                        state.mode = BAD;
                                        break top;
                                    }
                                    //#endif
                                    hold >>>= op;
                                    bits -= op;
                                    //Tracevv((stderr, "inflate:         distance %u\n", dist));
                                    op = _out - beg;                /* max distance in output */
                                    if (dist > op) {                /* see if copy from window */
                                        op = dist - op;               /* distance back in window */
                                        if (op > whave) {
                                            if (state.sane) {
                                                strm.msg = 'invalid distance too far back';
                                                state.mode = BAD;
                                                break top;
                                            }

                                            // (!) This block is disabled in zlib defailts,
                                            // don't enable it for binary compatibility
                                            //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                                            //                if (len <= op - whave) {
                                            //                  do {
                                            //                    output[_out++] = 0;
                                            //                  } while (--len);
                                            //                  continue top;
                                            //                }
                                            //                len -= op - whave;
                                            //                do {
                                            //                  output[_out++] = 0;
                                            //                } while (--op > whave);
                                            //                if (op === 0) {
                                            //                  from = _out - dist;
                                            //                  do {
                                            //                    output[_out++] = output[from++];
                                            //                  } while (--len);
                                            //                  continue top;
                                            //                }
                                            //#endif
                                        }
                                        from = 0; // window index
                                        from_source = s_window;
                                        if (wnext === 0) {           /* very common case */
                                            from += wsize - op;
                                            if (op < len) {         /* some from window */
                                                len -= op;
                                                do {
                                                    output[_out++] = s_window[from++];
                                                } while (--op);
                                                from = _out - dist;  /* rest from output */
                                                from_source = output;
                                            }
                                        }
                                        else if (wnext < op) {      /* wrap around window */
                                            from += wsize + wnext - op;
                                            op -= wnext;
                                            if (op < len) {         /* some from end of window */
                                                len -= op;
                                                do {
                                                    output[_out++] = s_window[from++];
                                                } while (--op);
                                                from = 0;
                                                if (wnext < len) {  /* some from start of window */
                                                    op = wnext;
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = _out - dist;      /* rest from output */
                                                    from_source = output;
                                                }
                                            }
                                        }
                                        else {                      /* contiguous in window */
                                            from += wnext - op;
                                            if (op < len) {         /* some from window */
                                                len -= op;
                                                do {
                                                    output[_out++] = s_window[from++];
                                                } while (--op);
                                                from = _out - dist;  /* rest from output */
                                                from_source = output;
                                            }
                                        }
                                        while (len > 2) {
                                            output[_out++] = from_source[from++];
                                            output[_out++] = from_source[from++];
                                            output[_out++] = from_source[from++];
                                            len -= 3;
                                        }
                                        if (len) {
                                            output[_out++] = from_source[from++];
                                            if (len > 1) {
                                                output[_out++] = from_source[from++];
                                            }
                                        }
                                    }
                                    else {
                                        from = _out - dist;          /* copy direct from output */
                                        do {                        /* minimum length is three */
                                            output[_out++] = output[from++];
                                            output[_out++] = output[from++];
                                            output[_out++] = output[from++];
                                            len -= 3;
                                        } while (len > 2);
                                        if (len) {
                                            output[_out++] = output[from++];
                                            if (len > 1) {
                                                output[_out++] = output[from++];
                                            }
                                        }
                                    }
                                }
                                else if ((op & 64) === 0) {          /* 2nd level distance code */
                                    here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                                    continue dodist;
                                }
                                else {
                                    strm.msg = 'invalid distance code';
                                    state.mode = BAD;
                                    break top;
                                }

                                break; // need to emulate goto via "continue"
                            }
                        }
                        else if ((op & 64) === 0) {              /* 2nd level length code */
                            here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                            continue dolen;
                        }
                        else if (op & 32) {                     /* end-of-block */
                            //Tracevv((stderr, "inflate:         end of block\n"));
                            state.mode = TYPE;
                            break top;
                        }
                        else {
                            strm.msg = 'invalid literal/length code';
                            state.mode = BAD;
                            break top;
                        }

                        break; // need to emulate goto via "continue"
                    }
                } while (_in < last && _out < end);

                /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
                len = bits >> 3;
                _in -= len;
                bits -= len << 3;
                hold &= (1 << bits) - 1;

                /* update state and return */
                strm.next_in = _in;
                strm.next_out = _out;
                strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
                strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
                state.hold = hold;
                state.bits = bits;
                return;
            };

        }, {}], 70: [function (require, module, exports) {
            'use strict';


            var utils = require('../utils/common');
            var adler32 = require('./adler32');
            var crc32 = require('./crc32');
            var inflate_fast = require('./inffast');
            var inflate_table = require('./inftrees');

            var CODES = 0;
            var LENS = 1;
            var DISTS = 2;

            /* Public constants ==========================================================*/
            /* ===========================================================================*/


            /* Allowed flush values; see deflate() and inflate() below for details */
            //var Z_NO_FLUSH      = 0;
            //var Z_PARTIAL_FLUSH = 1;
            //var Z_SYNC_FLUSH    = 2;
            //var Z_FULL_FLUSH    = 3;
            var Z_FINISH = 4;
            var Z_BLOCK = 5;
            var Z_TREES = 6;


            /* Return codes for the compression/decompression functions. Negative values
             * are errors, positive values are used for special but normal events.
             */
            var Z_OK = 0;
            var Z_STREAM_END = 1;
            var Z_NEED_DICT = 2;
            //var Z_ERRNO         = -1;
            var Z_STREAM_ERROR = -2;
            var Z_DATA_ERROR = -3;
            var Z_MEM_ERROR = -4;
            var Z_BUF_ERROR = -5;
            //var Z_VERSION_ERROR = -6;

            /* The deflate compression method */
            var Z_DEFLATED = 8;


            /* STATES ====================================================================*/
            /* ===========================================================================*/


            var HEAD = 1;       /* i: waiting for magic header */
            var FLAGS = 2;      /* i: waiting for method and flags (gzip) */
            var TIME = 3;       /* i: waiting for modification time (gzip) */
            var OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
            var EXLEN = 5;      /* i: waiting for extra length (gzip) */
            var EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
            var NAME = 7;       /* i: waiting for end of file name (gzip) */
            var COMMENT = 8;    /* i: waiting for end of comment (gzip) */
            var HCRC = 9;       /* i: waiting for header crc (gzip) */
            var DICTID = 10;    /* i: waiting for dictionary check value */
            var DICT = 11;      /* waiting for inflateSetDictionary() call */
            var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
            var TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
            var STORED = 14;    /* i: waiting for stored size (length and complement) */
            var COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
            var COPY = 16;      /* i/o: waiting for input or output to copy stored block */
            var TABLE = 17;     /* i: waiting for dynamic block table lengths */
            var LENLENS = 18;   /* i: waiting for code length code lengths */
            var CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
            var LEN_ = 20;      /* i: same as LEN below, but only first time in */
            var LEN = 21;       /* i: waiting for length/lit/eob code */
            var LENEXT = 22;    /* i: waiting for length extra bits */
            var DIST = 23;      /* i: waiting for distance code */
            var DISTEXT = 24;   /* i: waiting for distance extra bits */
            var MATCH = 25;     /* o: waiting for output space to copy string */
            var LIT = 26;       /* o: waiting for output space to write literal */
            var CHECK = 27;     /* i: waiting for 32-bit check value */
            var LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
            var DONE = 29;      /* finished check, done -- remain here until reset */
            var BAD = 30;       /* got a data error -- remain here until reset */
            var MEM = 31;       /* got an inflate() memory error -- remain here until reset */
            var SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

            /* ===========================================================================*/



            var ENOUGH_LENS = 852;
            var ENOUGH_DISTS = 592;
            //var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

            var MAX_WBITS = 15;
            /* 32K LZ77 window */
            var DEF_WBITS = MAX_WBITS;


            function zswap32(q) {
                return (((q >>> 24) & 0xff) +
                    ((q >>> 8) & 0xff00) +
                    ((q & 0xff00) << 8) +
                    ((q & 0xff) << 24));
            }


            function InflateState() {
                this.mode = 0;             /* current inflate mode */
                this.last = false;          /* true if processing last block */
                this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
                this.havedict = false;      /* true if dictionary provided */
                this.flags = 0;             /* gzip header method and flags (0 if zlib) */
                this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
                this.check = 0;             /* protected copy of check value */
                this.total = 0;             /* protected copy of output count */
                // TODO: may be {}
                this.head = null;           /* where to save gzip header information */

                /* sliding window */
                this.wbits = 0;             /* log base 2 of requested window size */
                this.wsize = 0;             /* window size or zero if not using window */
                this.whave = 0;             /* valid bytes in the window */
                this.wnext = 0;             /* window write index */
                this.window = null;         /* allocated sliding window, if needed */

                /* bit accumulator */
                this.hold = 0;              /* input bit accumulator */
                this.bits = 0;              /* number of bits in "in" */

                /* for string and stored block copying */
                this.length = 0;            /* literal or length of data to copy */
                this.offset = 0;            /* distance back to copy string from */

                /* for table and code decoding */
                this.extra = 0;             /* extra bits needed */

                /* fixed and dynamic code tables */
                this.lencode = null;          /* starting table for length/literal codes */
                this.distcode = null;         /* starting table for distance codes */
                this.lenbits = 0;           /* index bits for lencode */
                this.distbits = 0;          /* index bits for distcode */

                /* dynamic table building */
                this.ncode = 0;             /* number of code length code lengths */
                this.nlen = 0;              /* number of length code lengths */
                this.ndist = 0;             /* number of distance code lengths */
                this.have = 0;              /* number of code lengths in lens[] */
                this.next = null;              /* next available space in codes[] */

                this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
                this.work = new utils.Buf16(288); /* work area for code table building */

                /*
                 because we don't have pointers in js, we use lencode and distcode directly
                 as buffers so we don't need codes
                */
                //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
                this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
                this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
                this.sane = 0;                   /* if false, allow invalid distance too far */
                this.back = 0;                   /* bits back of last unprocessed length/lit */
                this.was = 0;                    /* initial length of match */
            }

            function inflateResetKeep(strm) {
                var state;

                if (!strm || !strm.state) { return Z_STREAM_ERROR; }
                state = strm.state;
                strm.total_in = strm.total_out = state.total = 0;
                strm.msg = ''; /*Z_NULL*/
                if (state.wrap) {       /* to support ill-conceived Java test suite */
                    strm.adler = state.wrap & 1;
                }
                state.mode = HEAD;
                state.last = 0;
                state.havedict = 0;
                state.dmax = 32768;
                state.head = null/*Z_NULL*/;
                state.hold = 0;
                state.bits = 0;
                //state.lencode = state.distcode = state.next = state.codes;
                state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
                state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

                state.sane = 1;
                state.back = -1;
                //Tracev((stderr, "inflate: reset\n"));
                return Z_OK;
            }

            function inflateReset(strm) {
                var state;

                if (!strm || !strm.state) { return Z_STREAM_ERROR; }
                state = strm.state;
                state.wsize = 0;
                state.whave = 0;
                state.wnext = 0;
                return inflateResetKeep(strm);

            }

            function inflateReset2(strm, windowBits) {
                var wrap;
                var state;

                /* get the state */
                if (!strm || !strm.state) { return Z_STREAM_ERROR; }
                state = strm.state;

                /* extract wrap request from windowBits parameter */
                if (windowBits < 0) {
                    wrap = 0;
                    windowBits = -windowBits;
                }
                else {
                    wrap = (windowBits >> 4) + 1;
                    if (windowBits < 48) {
                        windowBits &= 15;
                    }
                }

                /* set number of window bits, free window if different */
                if (windowBits && (windowBits < 8 || windowBits > 15)) {
                    return Z_STREAM_ERROR;
                }
                if (state.window !== null && state.wbits !== windowBits) {
                    state.window = null;
                }

                /* update state and reset the rest of it */
                state.wrap = wrap;
                state.wbits = windowBits;
                return inflateReset(strm);
            }

            function inflateInit2(strm, windowBits) {
                var ret;
                var state;

                if (!strm) { return Z_STREAM_ERROR; }
                //strm.msg = Z_NULL;                 /* in case we return an error */

                state = new InflateState();

                //if (state === Z_NULL) return Z_MEM_ERROR;
                //Tracev((stderr, "inflate: allocated\n"));
                strm.state = state;
                state.window = null/*Z_NULL*/;
                ret = inflateReset2(strm, windowBits);
                if (ret !== Z_OK) {
                    strm.state = null/*Z_NULL*/;
                }
                return ret;
            }

            function inflateInit(strm) {
                return inflateInit2(strm, DEF_WBITS);
            }


            /*
             Return state with length and distance decoding tables and index sizes set to
             fixed code decoding.  Normally this returns fixed tables from inffixed.h.
             If BUILDFIXED is defined, then instead this routine builds the tables the
             first time it's called, and returns those tables the first time and
             thereafter.  This reduces the size of the code by about 2K bytes, in
             exchange for a little execution time.  However, BUILDFIXED should not be
             used for threaded applications, since the rewriting of the tables and virgin
             may not be thread-safe.
             */
            var virgin = true;

            var lenfix, distfix; // We have no pointers in JS, so keep tables separate

            function fixedtables(state) {
                /* build fixed huffman tables if first call (may not be thread safe) */
                if (virgin) {
                    var sym;

                    lenfix = new utils.Buf32(512);
                    distfix = new utils.Buf32(32);

                    /* literal/length table */
                    sym = 0;
                    while (sym < 144) { state.lens[sym++] = 8; }
                    while (sym < 256) { state.lens[sym++] = 9; }
                    while (sym < 280) { state.lens[sym++] = 7; }
                    while (sym < 288) { state.lens[sym++] = 8; }

                    inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });

                    /* distance table */
                    sym = 0;
                    while (sym < 32) { state.lens[sym++] = 5; }

                    inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });

                    /* do this just once */
                    virgin = false;
                }

                state.lencode = lenfix;
                state.lenbits = 9;
                state.distcode = distfix;
                state.distbits = 5;
            }


            /*
             Update the window with the last wsize (normally 32K) bytes written before
             returning.  If window does not exist yet, create it.  This is only called
             when a window is already in use, or when output has been written during this
             inflate call, but the end of the deflate stream has not been reached yet.
             It is also called to create a window for dictionary data when a dictionary
             is loaded.
            
             Providing output buffers larger than 32K to inflate() should provide a speed
             advantage, since only the last 32K of output is copied to the sliding window
             upon return from inflate(), and since all distances after the first 32K of
             output will fall in the output data, making match copies simpler and faster.
             The advantage may be dependent on the size of the processor's data caches.
             */
            function updatewindow(strm, src, end, copy) {
                var dist;
                var state = strm.state;

                /* if it hasn't been done already, allocate space for the window */
                if (state.window === null) {
                    state.wsize = 1 << state.wbits;
                    state.wnext = 0;
                    state.whave = 0;

                    state.window = new utils.Buf8(state.wsize);
                }

                /* copy state->wsize or less output bytes into the circular window */
                if (copy >= state.wsize) {
                    utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
                    state.wnext = 0;
                    state.whave = state.wsize;
                }
                else {
                    dist = state.wsize - state.wnext;
                    if (dist > copy) {
                        dist = copy;
                    }
                    //zmemcpy(state->window + state->wnext, end - copy, dist);
                    utils.arraySet(state.window, src, end - copy, dist, state.wnext);
                    copy -= dist;
                    if (copy) {
                        //zmemcpy(state->window, end - copy, copy);
                        utils.arraySet(state.window, src, end - copy, copy, 0);
                        state.wnext = copy;
                        state.whave = state.wsize;
                    }
                    else {
                        state.wnext += dist;
                        if (state.wnext === state.wsize) { state.wnext = 0; }
                        if (state.whave < state.wsize) { state.whave += dist; }
                    }
                }
                return 0;
            }

            function inflate(strm, flush) {
                var state;
                var input, output;          // input/output buffers
                var next;                   /* next input INDEX */
                var put;                    /* next output INDEX */
                var have, left;             /* available input and output */
                var hold;                   /* bit buffer */
                var bits;                   /* bits in bit buffer */
                var _in, _out;              /* save starting available input and output */
                var copy;                   /* number of stored or match bytes to copy */
                var from;                   /* where to copy match bytes from */
                var from_source;
                var here = 0;               /* current decoding table entry */
                var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
                //var last;                   /* parent table entry */
                var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
                var len;                    /* length to copy for repeats, bits to drop */
                var ret;                    /* return code */
                var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
                var opts;

                var n; // temporary var for NEED_BITS

                var order = /* permutation of code lengths */
                    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


                if (!strm || !strm.state || !strm.output ||
                    (!strm.input && strm.avail_in !== 0)) {
                    return Z_STREAM_ERROR;
                }

                state = strm.state;
                if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


                //--- LOAD() ---
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                //---

                _in = have;
                _out = left;
                ret = Z_OK;

                inf_leave: // goto emulation
                for (; ;) {
                    switch (state.mode) {
                        case HEAD:
                            if (state.wrap === 0) {
                                state.mode = TYPEDO;
                                break;
                            }
                            //=== NEEDBITS(16);
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
                                state.check = 0/*crc32(0L, Z_NULL, 0)*/;
                                //=== CRC2(state.check, hold);
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                state.check = crc32(state.check, hbuf, 2, 0);
                                //===//

                                //=== INITBITS();
                                hold = 0;
                                bits = 0;
                                //===//
                                state.mode = FLAGS;
                                break;
                            }
                            state.flags = 0;           /* expect zlib header */
                            if (state.head) {
                                state.head.done = false;
                            }
                            if (!(state.wrap & 1) ||   /* check if zlib header allowed */
                                (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
                                strm.msg = 'incorrect header check';
                                state.mode = BAD;
                                break;
                            }
                            if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
                                strm.msg = 'unknown compression method';
                                state.mode = BAD;
                                break;
                            }
                            //--- DROPBITS(4) ---//
                            hold >>>= 4;
                            bits -= 4;
                            //---//
                            len = (hold & 0x0f)/*BITS(4)*/ + 8;
                            if (state.wbits === 0) {
                                state.wbits = len;
                            }
                            else if (len > state.wbits) {
                                strm.msg = 'invalid window size';
                                state.mode = BAD;
                                break;
                            }
                            state.dmax = 1 << len;
                            //Tracev((stderr, "inflate:   zlib header ok\n"));
                            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                            state.mode = hold & 0x200 ? DICTID : TYPE;
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            break;
                        case FLAGS:
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.flags = hold;
                            if ((state.flags & 0xff) !== Z_DEFLATED) {
                                strm.msg = 'unknown compression method';
                                state.mode = BAD;
                                break;
                            }
                            if (state.flags & 0xe000) {
                                strm.msg = 'unknown header flags set';
                                state.mode = BAD;
                                break;
                            }
                            if (state.head) {
                                state.head.text = ((hold >> 8) & 1);
                            }
                            if (state.flags & 0x0200) {
                                //=== CRC2(state.check, hold);
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                state.check = crc32(state.check, hbuf, 2, 0);
                                //===//
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = TIME;
                        /* falls through */
                        case TIME:
                            //=== NEEDBITS(32); */
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (state.head) {
                                state.head.time = hold;
                            }
                            if (state.flags & 0x0200) {
                                //=== CRC4(state.check, hold)
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                hbuf[2] = (hold >>> 16) & 0xff;
                                hbuf[3] = (hold >>> 24) & 0xff;
                                state.check = crc32(state.check, hbuf, 4, 0);
                                //===
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = OS;
                        /* falls through */
                        case OS:
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (state.head) {
                                state.head.xflags = (hold & 0xff);
                                state.head.os = (hold >> 8);
                            }
                            if (state.flags & 0x0200) {
                                //=== CRC2(state.check, hold);
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                state.check = crc32(state.check, hbuf, 2, 0);
                                //===//
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = EXLEN;
                        /* falls through */
                        case EXLEN:
                            if (state.flags & 0x0400) {
                                //=== NEEDBITS(16); */
                                while (bits < 16) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                state.length = hold;
                                if (state.head) {
                                    state.head.extra_len = hold;
                                }
                                if (state.flags & 0x0200) {
                                    //=== CRC2(state.check, hold);
                                    hbuf[0] = hold & 0xff;
                                    hbuf[1] = (hold >>> 8) & 0xff;
                                    state.check = crc32(state.check, hbuf, 2, 0);
                                    //===//
                                }
                                //=== INITBITS();
                                hold = 0;
                                bits = 0;
                                //===//
                            }
                            else if (state.head) {
                                state.head.extra = null/*Z_NULL*/;
                            }
                            state.mode = EXTRA;
                        /* falls through */
                        case EXTRA:
                            if (state.flags & 0x0400) {
                                copy = state.length;
                                if (copy > have) { copy = have; }
                                if (copy) {
                                    if (state.head) {
                                        len = state.head.extra_len - state.length;
                                        if (!state.head.extra) {
                                            // Use untyped array for more conveniend processing later
                                            state.head.extra = new Array(state.head.extra_len);
                                        }
                                        utils.arraySet(
                                            state.head.extra,
                                            input,
                                            next,
                                            // extra field is limited to 65536 bytes
                                            // - no need for additional size check
                                            copy,
                                            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                                            len
                                        );
                                        //zmemcpy(state.head.extra + len, next,
                                        //        len + copy > state.head.extra_max ?
                                        //        state.head.extra_max - len : copy);
                                    }
                                    if (state.flags & 0x0200) {
                                        state.check = crc32(state.check, input, copy, next);
                                    }
                                    have -= copy;
                                    next += copy;
                                    state.length -= copy;
                                }
                                if (state.length) { break inf_leave; }
                            }
                            state.length = 0;
                            state.mode = NAME;
                        /* falls through */
                        case NAME:
                            if (state.flags & 0x0800) {
                                if (have === 0) { break inf_leave; }
                                copy = 0;
                                do {
                                    // TODO: 2 or 1 bytes?
                                    len = input[next + copy++];
                                    /* use constant limit because in js we should not preallocate memory */
                                    if (state.head && len &&
                                        (state.length < 65536 /*state.head.name_max*/)) {
                                        state.head.name += String.fromCharCode(len);
                                    }
                                } while (len && copy < have);

                                if (state.flags & 0x0200) {
                                    state.check = crc32(state.check, input, copy, next);
                                }
                                have -= copy;
                                next += copy;
                                if (len) { break inf_leave; }
                            }
                            else if (state.head) {
                                state.head.name = null;
                            }
                            state.length = 0;
                            state.mode = COMMENT;
                        /* falls through */
                        case COMMENT:
                            if (state.flags & 0x1000) {
                                if (have === 0) { break inf_leave; }
                                copy = 0;
                                do {
                                    len = input[next + copy++];
                                    /* use constant limit because in js we should not preallocate memory */
                                    if (state.head && len &&
                                        (state.length < 65536 /*state.head.comm_max*/)) {
                                        state.head.comment += String.fromCharCode(len);
                                    }
                                } while (len && copy < have);
                                if (state.flags & 0x0200) {
                                    state.check = crc32(state.check, input, copy, next);
                                }
                                have -= copy;
                                next += copy;
                                if (len) { break inf_leave; }
                            }
                            else if (state.head) {
                                state.head.comment = null;
                            }
                            state.mode = HCRC;
                        /* falls through */
                        case HCRC:
                            if (state.flags & 0x0200) {
                                //=== NEEDBITS(16); */
                                while (bits < 16) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                if (hold !== (state.check & 0xffff)) {
                                    strm.msg = 'header crc mismatch';
                                    state.mode = BAD;
                                    break;
                                }
                                //=== INITBITS();
                                hold = 0;
                                bits = 0;
                                //===//
                            }
                            if (state.head) {
                                state.head.hcrc = ((state.flags >> 9) & 1);
                                state.head.done = true;
                            }
                            strm.adler = state.check = 0;
                            state.mode = TYPE;
                            break;
                        case DICTID:
                            //=== NEEDBITS(32); */
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            strm.adler = state.check = zswap32(hold);
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = DICT;
                        /* falls through */
                        case DICT:
                            if (state.havedict === 0) {
                                //--- RESTORE() ---
                                strm.next_out = put;
                                strm.avail_out = left;
                                strm.next_in = next;
                                strm.avail_in = have;
                                state.hold = hold;
                                state.bits = bits;
                                //---
                                return Z_NEED_DICT;
                            }
                            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                            state.mode = TYPE;
                        /* falls through */
                        case TYPE:
                            if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
                        /* falls through */
                        case TYPEDO:
                            if (state.last) {
                                //--- BYTEBITS() ---//
                                hold >>>= bits & 7;
                                bits -= bits & 7;
                                //---//
                                state.mode = CHECK;
                                break;
                            }
                            //=== NEEDBITS(3); */
                            while (bits < 3) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.last = (hold & 0x01)/*BITS(1)*/;
                            //--- DROPBITS(1) ---//
                            hold >>>= 1;
                            bits -= 1;
                            //---//

                            switch ((hold & 0x03)/*BITS(2)*/) {
                                case 0:                             /* stored block */
                                    //Tracev((stderr, "inflate:     stored block%s\n",
                                    //        state.last ? " (last)" : ""));
                                    state.mode = STORED;
                                    break;
                                case 1:                             /* fixed block */
                                    fixedtables(state);
                                    //Tracev((stderr, "inflate:     fixed codes block%s\n",
                                    //        state.last ? " (last)" : ""));
                                    state.mode = LEN_;             /* decode codes */
                                    if (flush === Z_TREES) {
                                        //--- DROPBITS(2) ---//
                                        hold >>>= 2;
                                        bits -= 2;
                                        //---//
                                        break inf_leave;
                                    }
                                    break;
                                case 2:                             /* dynamic block */
                                    //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                                    //        state.last ? " (last)" : ""));
                                    state.mode = TABLE;
                                    break;
                                case 3:
                                    strm.msg = 'invalid block type';
                                    state.mode = BAD;
                            }
                            //--- DROPBITS(2) ---//
                            hold >>>= 2;
                            bits -= 2;
                            //---//
                            break;
                        case STORED:
                            //--- BYTEBITS() ---// /* go to byte boundary */
                            hold >>>= bits & 7;
                            bits -= bits & 7;
                            //---//
                            //=== NEEDBITS(32); */
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
                                strm.msg = 'invalid stored block lengths';
                                state.mode = BAD;
                                break;
                            }
                            state.length = hold & 0xffff;
                            //Tracev((stderr, "inflate:       stored length %u\n",
                            //        state.length));
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = COPY_;
                            if (flush === Z_TREES) { break inf_leave; }
                        /* falls through */
                        case COPY_:
                            state.mode = COPY;
                        /* falls through */
                        case COPY:
                            copy = state.length;
                            if (copy) {
                                if (copy > have) { copy = have; }
                                if (copy > left) { copy = left; }
                                if (copy === 0) { break inf_leave; }
                                //--- zmemcpy(put, next, copy); ---
                                utils.arraySet(output, input, next, copy, put);
                                //---//
                                have -= copy;
                                next += copy;
                                left -= copy;
                                put += copy;
                                state.length -= copy;
                                break;
                            }
                            //Tracev((stderr, "inflate:       stored end\n"));
                            state.mode = TYPE;
                            break;
                        case TABLE:
                            //=== NEEDBITS(14); */
                            while (bits < 14) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
                            //--- DROPBITS(5) ---//
                            hold >>>= 5;
                            bits -= 5;
                            //---//
                            state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
                            //--- DROPBITS(5) ---//
                            hold >>>= 5;
                            bits -= 5;
                            //---//
                            state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
                            //--- DROPBITS(4) ---//
                            hold >>>= 4;
                            bits -= 4;
                            //---//
                            //#ifndef PKZIP_BUG_WORKAROUND
                            if (state.nlen > 286 || state.ndist > 30) {
                                strm.msg = 'too many length or distance symbols';
                                state.mode = BAD;
                                break;
                            }
                            //#endif
                            //Tracev((stderr, "inflate:       table sizes ok\n"));
                            state.have = 0;
                            state.mode = LENLENS;
                        /* falls through */
                        case LENLENS:
                            while (state.have < state.ncode) {
                                //=== NEEDBITS(3);
                                while (bits < 3) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
                                //--- DROPBITS(3) ---//
                                hold >>>= 3;
                                bits -= 3;
                                //---//
                            }
                            while (state.have < 19) {
                                state.lens[order[state.have++]] = 0;
                            }
                            // We have separate tables & no pointers. 2 commented lines below not needed.
                            //state.next = state.codes;
                            //state.lencode = state.next;
                            // Switch to use dynamic table
                            state.lencode = state.lendyn;
                            state.lenbits = 7;

                            opts = { bits: state.lenbits };
                            ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                            state.lenbits = opts.bits;

                            if (ret) {
                                strm.msg = 'invalid code lengths set';
                                state.mode = BAD;
                                break;
                            }
                            //Tracev((stderr, "inflate:       code lengths ok\n"));
                            state.have = 0;
                            state.mode = CODELENS;
                        /* falls through */
                        case CODELENS:
                            while (state.have < state.nlen + state.ndist) {
                                for (; ;) {
                                    here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
                                    here_bits = here >>> 24;
                                    here_op = (here >>> 16) & 0xff;
                                    here_val = here & 0xffff;

                                    if ((here_bits) <= bits) { break; }
                                    //--- PULLBYTE() ---//
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                    //---//
                                }
                                if (here_val < 16) {
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    state.lens[state.have++] = here_val;
                                }
                                else {
                                    if (here_val === 16) {
                                        //=== NEEDBITS(here.bits + 2);
                                        n = here_bits + 2;
                                        while (bits < n) {
                                            if (have === 0) { break inf_leave; }
                                            have--;
                                            hold += input[next++] << bits;
                                            bits += 8;
                                        }
                                        //===//
                                        //--- DROPBITS(here.bits) ---//
                                        hold >>>= here_bits;
                                        bits -= here_bits;
                                        //---//
                                        if (state.have === 0) {
                                            strm.msg = 'invalid bit length repeat';
                                            state.mode = BAD;
                                            break;
                                        }
                                        len = state.lens[state.have - 1];
                                        copy = 3 + (hold & 0x03);//BITS(2);
                                        //--- DROPBITS(2) ---//
                                        hold >>>= 2;
                                        bits -= 2;
                                        //---//
                                    }
                                    else if (here_val === 17) {
                                        //=== NEEDBITS(here.bits + 3);
                                        n = here_bits + 3;
                                        while (bits < n) {
                                            if (have === 0) { break inf_leave; }
                                            have--;
                                            hold += input[next++] << bits;
                                            bits += 8;
                                        }
                                        //===//
                                        //--- DROPBITS(here.bits) ---//
                                        hold >>>= here_bits;
                                        bits -= here_bits;
                                        //---//
                                        len = 0;
                                        copy = 3 + (hold & 0x07);//BITS(3);
                                        //--- DROPBITS(3) ---//
                                        hold >>>= 3;
                                        bits -= 3;
                                        //---//
                                    }
                                    else {
                                        //=== NEEDBITS(here.bits + 7);
                                        n = here_bits + 7;
                                        while (bits < n) {
                                            if (have === 0) { break inf_leave; }
                                            have--;
                                            hold += input[next++] << bits;
                                            bits += 8;
                                        }
                                        //===//
                                        //--- DROPBITS(here.bits) ---//
                                        hold >>>= here_bits;
                                        bits -= here_bits;
                                        //---//
                                        len = 0;
                                        copy = 11 + (hold & 0x7f);//BITS(7);
                                        //--- DROPBITS(7) ---//
                                        hold >>>= 7;
                                        bits -= 7;
                                        //---//
                                    }
                                    if (state.have + copy > state.nlen + state.ndist) {
                                        strm.msg = 'invalid bit length repeat';
                                        state.mode = BAD;
                                        break;
                                    }
                                    while (copy--) {
                                        state.lens[state.have++] = len;
                                    }
                                }
                            }

                            /* handle error breaks in while */
                            if (state.mode === BAD) { break; }

                            /* check for end-of-block code (better have one) */
                            if (state.lens[256] === 0) {
                                strm.msg = 'invalid code -- missing end-of-block';
                                state.mode = BAD;
                                break;
                            }

                            /* build code tables -- note: do not change the lenbits or distbits
                               values here (9 and 6) without reading the comments in inftrees.h
                               concerning the ENOUGH constants, which depend on those values */
                            state.lenbits = 9;

                            opts = { bits: state.lenbits };
                            ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                            // We have separate tables & no pointers. 2 commented lines below not needed.
                            // state.next_index = opts.table_index;
                            state.lenbits = opts.bits;
                            // state.lencode = state.next;

                            if (ret) {
                                strm.msg = 'invalid literal/lengths set';
                                state.mode = BAD;
                                break;
                            }

                            state.distbits = 6;
                            //state.distcode.copy(state.codes);
                            // Switch to use dynamic table
                            state.distcode = state.distdyn;
                            opts = { bits: state.distbits };
                            ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                            // We have separate tables & no pointers. 2 commented lines below not needed.
                            // state.next_index = opts.table_index;
                            state.distbits = opts.bits;
                            // state.distcode = state.next;

                            if (ret) {
                                strm.msg = 'invalid distances set';
                                state.mode = BAD;
                                break;
                            }
                            //Tracev((stderr, 'inflate:       codes ok\n'));
                            state.mode = LEN_;
                            if (flush === Z_TREES) { break inf_leave; }
                        /* falls through */
                        case LEN_:
                            state.mode = LEN;
                        /* falls through */
                        case LEN:
                            if (have >= 6 && left >= 258) {
                                //--- RESTORE() ---
                                strm.next_out = put;
                                strm.avail_out = left;
                                strm.next_in = next;
                                strm.avail_in = have;
                                state.hold = hold;
                                state.bits = bits;
                                //---
                                inflate_fast(strm, _out);
                                //--- LOAD() ---
                                put = strm.next_out;
                                output = strm.output;
                                left = strm.avail_out;
                                next = strm.next_in;
                                input = strm.input;
                                have = strm.avail_in;
                                hold = state.hold;
                                bits = state.bits;
                                //---

                                if (state.mode === TYPE) {
                                    state.back = -1;
                                }
                                break;
                            }
                            state.back = 0;
                            for (; ;) {
                                here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if (here_bits <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            if (here_op && (here_op & 0xf0) === 0) {
                                last_bits = here_bits;
                                last_op = here_op;
                                last_val = here_val;
                                for (; ;) {
                                    here = state.lencode[last_val +
                                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                    here_bits = here >>> 24;
                                    here_op = (here >>> 16) & 0xff;
                                    here_val = here & 0xffff;

                                    if ((last_bits + here_bits) <= bits) { break; }
                                    //--- PULLBYTE() ---//
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                    //---//
                                }
                                //--- DROPBITS(last.bits) ---//
                                hold >>>= last_bits;
                                bits -= last_bits;
                                //---//
                                state.back += last_bits;
                            }
                            //--- DROPBITS(here.bits) ---//
                            hold >>>= here_bits;
                            bits -= here_bits;
                            //---//
                            state.back += here_bits;
                            state.length = here_val;
                            if (here_op === 0) {
                                //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                                //        "inflate:         literal '%c'\n" :
                                //        "inflate:         literal 0x%02x\n", here.val));
                                state.mode = LIT;
                                break;
                            }
                            if (here_op & 32) {
                                //Tracevv((stderr, "inflate:         end of block\n"));
                                state.back = -1;
                                state.mode = TYPE;
                                break;
                            }
                            if (here_op & 64) {
                                strm.msg = 'invalid literal/length code';
                                state.mode = BAD;
                                break;
                            }
                            state.extra = here_op & 15;
                            state.mode = LENEXT;
                        /* falls through */
                        case LENEXT:
                            if (state.extra) {
                                //=== NEEDBITS(state.extra);
                                n = state.extra;
                                while (bits < n) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                                //--- DROPBITS(state.extra) ---//
                                hold >>>= state.extra;
                                bits -= state.extra;
                                //---//
                                state.back += state.extra;
                            }
                            //Tracevv((stderr, "inflate:         length %u\n", state.length));
                            state.was = state.length;
                            state.mode = DIST;
                        /* falls through */
                        case DIST:
                            for (; ;) {
                                here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            if ((here_op & 0xf0) === 0) {
                                last_bits = here_bits;
                                last_op = here_op;
                                last_val = here_val;
                                for (; ;) {
                                    here = state.distcode[last_val +
                                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                    here_bits = here >>> 24;
                                    here_op = (here >>> 16) & 0xff;
                                    here_val = here & 0xffff;

                                    if ((last_bits + here_bits) <= bits) { break; }
                                    //--- PULLBYTE() ---//
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                    //---//
                                }
                                //--- DROPBITS(last.bits) ---//
                                hold >>>= last_bits;
                                bits -= last_bits;
                                //---//
                                state.back += last_bits;
                            }
                            //--- DROPBITS(here.bits) ---//
                            hold >>>= here_bits;
                            bits -= here_bits;
                            //---//
                            state.back += here_bits;
                            if (here_op & 64) {
                                strm.msg = 'invalid distance code';
                                state.mode = BAD;
                                break;
                            }
                            state.offset = here_val;
                            state.extra = (here_op) & 15;
                            state.mode = DISTEXT;
                        /* falls through */
                        case DISTEXT:
                            if (state.extra) {
                                //=== NEEDBITS(state.extra);
                                n = state.extra;
                                while (bits < n) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                                //--- DROPBITS(state.extra) ---//
                                hold >>>= state.extra;
                                bits -= state.extra;
                                //---//
                                state.back += state.extra;
                            }
                            //#ifdef INFLATE_STRICT
                            if (state.offset > state.dmax) {
                                strm.msg = 'invalid distance too far back';
                                state.mode = BAD;
                                break;
                            }
                            //#endif
                            //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
                            state.mode = MATCH;
                        /* falls through */
                        case MATCH:
                            if (left === 0) { break inf_leave; }
                            copy = _out - left;
                            if (state.offset > copy) {         /* copy from window */
                                copy = state.offset - copy;
                                if (copy > state.whave) {
                                    if (state.sane) {
                                        strm.msg = 'invalid distance too far back';
                                        state.mode = BAD;
                                        break;
                                    }
                                    // (!) This block is disabled in zlib defailts,
                                    // don't enable it for binary compatibility
                                    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                                    //          Trace((stderr, "inflate.c too far\n"));
                                    //          copy -= state.whave;
                                    //          if (copy > state.length) { copy = state.length; }
                                    //          if (copy > left) { copy = left; }
                                    //          left -= copy;
                                    //          state.length -= copy;
                                    //          do {
                                    //            output[put++] = 0;
                                    //          } while (--copy);
                                    //          if (state.length === 0) { state.mode = LEN; }
                                    //          break;
                                    //#endif
                                }
                                if (copy > state.wnext) {
                                    copy -= state.wnext;
                                    from = state.wsize - copy;
                                }
                                else {
                                    from = state.wnext - copy;
                                }
                                if (copy > state.length) { copy = state.length; }
                                from_source = state.window;
                            }
                            else {                              /* copy from output */
                                from_source = output;
                                from = put - state.offset;
                                copy = state.length;
                            }
                            if (copy > left) { copy = left; }
                            left -= copy;
                            state.length -= copy;
                            do {
                                output[put++] = from_source[from++];
                            } while (--copy);
                            if (state.length === 0) { state.mode = LEN; }
                            break;
                        case LIT:
                            if (left === 0) { break inf_leave; }
                            output[put++] = state.length;
                            left--;
                            state.mode = LEN;
                            break;
                        case CHECK:
                            if (state.wrap) {
                                //=== NEEDBITS(32);
                                while (bits < 32) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    // Use '|' insdead of '+' to make sure that result is signed
                                    hold |= input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                _out -= left;
                                strm.total_out += _out;
                                state.total += _out;
                                if (_out) {
                                    strm.adler = state.check =
                                        /*UPDATE(state.check, put - _out, _out);*/
                                        (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

                                }
                                _out = left;
                                // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
                                if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                                    strm.msg = 'incorrect data check';
                                    state.mode = BAD;
                                    break;
                                }
                                //=== INITBITS();
                                hold = 0;
                                bits = 0;
                                //===//
                                //Tracev((stderr, "inflate:   check matches trailer\n"));
                            }
                            state.mode = LENGTH;
                        /* falls through */
                        case LENGTH:
                            if (state.wrap && state.flags) {
                                //=== NEEDBITS(32);
                                while (bits < 32) {
                                    if (have === 0) { break inf_leave; }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                //===//
                                if (hold !== (state.total & 0xffffffff)) {
                                    strm.msg = 'incorrect length check';
                                    state.mode = BAD;
                                    break;
                                }
                                //=== INITBITS();
                                hold = 0;
                                bits = 0;
                                //===//
                                //Tracev((stderr, "inflate:   length matches trailer\n"));
                            }
                            state.mode = DONE;
                        /* falls through */
                        case DONE:
                            ret = Z_STREAM_END;
                            break inf_leave;
                        case BAD:
                            ret = Z_DATA_ERROR;
                            break inf_leave;
                        case MEM:
                            return Z_MEM_ERROR;
                        case SYNC:
                        /* falls through */
                        default:
                            return Z_STREAM_ERROR;
                    }
                }

                // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

                /*
                   Return from inflate(), updating the total counts and the check value.
                   If there was no progress during the inflate() call, return a buffer
                   error.  Call updatewindow() to create and/or update the window state.
                   Note: a memory error from inflate() is non-recoverable.
                 */

                //--- RESTORE() ---
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                //---

                if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                    (state.mode < CHECK || flush !== Z_FINISH))) {
                    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
                        state.mode = MEM;
                        return Z_MEM_ERROR;
                    }
                }
                _in -= strm.avail_in;
                _out -= strm.avail_out;
                strm.total_in += _in;
                strm.total_out += _out;
                state.total += _out;
                if (state.wrap && _out) {
                    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
                        (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
                }
                strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
                if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
                    ret = Z_BUF_ERROR;
                }
                return ret;
            }

            function inflateEnd(strm) {

                if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
                    return Z_STREAM_ERROR;
                }

                var state = strm.state;
                if (state.window) {
                    state.window = null;
                }
                strm.state = null;
                return Z_OK;
            }

            function inflateGetHeader(strm, head) {
                var state;

                /* check state */
                if (!strm || !strm.state) { return Z_STREAM_ERROR; }
                state = strm.state;
                if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

                /* save header structure */
                state.head = head;
                head.done = false;
                return Z_OK;
            }

            function inflateSetDictionary(strm, dictionary) {
                var dictLength = dictionary.length;

                var state;
                var dictid;
                var ret;

                /* check state */
                if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
                state = strm.state;

                if (state.wrap !== 0 && state.mode !== DICT) {
                    return Z_STREAM_ERROR;
                }

                /* check for correct dictionary identifier */
                if (state.mode === DICT) {
                    dictid = 1; /* adler32(0, null, 0)*/
                    /* dictid = adler32(dictid, dictionary, dictLength); */
                    dictid = adler32(dictid, dictionary, dictLength, 0);
                    if (dictid !== state.check) {
                        return Z_DATA_ERROR;
                    }
                }
                /* copy dictionary to window using updatewindow(), which will amend the
                 existing dictionary if appropriate */
                ret = updatewindow(strm, dictionary, dictLength, dictLength);
                if (ret) {
                    state.mode = MEM;
                    return Z_MEM_ERROR;
                }
                state.havedict = 1;
                // Tracev((stderr, "inflate:   dictionary set\n"));
                return Z_OK;
            }

            exports.inflateReset = inflateReset;
            exports.inflateReset2 = inflateReset2;
            exports.inflateResetKeep = inflateResetKeep;
            exports.inflateInit = inflateInit;
            exports.inflateInit2 = inflateInit2;
            exports.inflate = inflate;
            exports.inflateEnd = inflateEnd;
            exports.inflateGetHeader = inflateGetHeader;
            exports.inflateSetDictionary = inflateSetDictionary;
            exports.inflateInfo = 'pako inflate (from Nodeca project)';

            /* Not implemented
            exports.inflateCopy = inflateCopy;
            exports.inflateGetDictionary = inflateGetDictionary;
            exports.inflateMark = inflateMark;
            exports.inflatePrime = inflatePrime;
            exports.inflateSync = inflateSync;
            exports.inflateSyncPoint = inflateSyncPoint;
            exports.inflateUndermine = inflateUndermine;
            */

        }, { "../utils/common": 62, "./adler32": 64, "./crc32": 66, "./inffast": 69, "./inftrees": 71 }], 71: [function (require, module, exports) {
            'use strict';


            var utils = require('../utils/common');

            var MAXBITS = 15;
            var ENOUGH_LENS = 852;
            var ENOUGH_DISTS = 592;
            //var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

            var CODES = 0;
            var LENS = 1;
            var DISTS = 2;

            var lbase = [ /* Length codes 257..285 base */
                3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
                35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
            ];

            var lext = [ /* Length codes 257..285 extra */
                16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
                19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
            ];

            var dbase = [ /* Distance codes 0..29 base */
                1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
                257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
                8193, 12289, 16385, 24577, 0, 0
            ];

            var dext = [ /* Distance codes 0..29 extra */
                16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
                23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
                28, 28, 29, 29, 64, 64
            ];

            module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
                var bits = opts.bits;
                //here = opts.here; /* table entry for duplication */

                var len = 0;               /* a code's length in bits */
                var sym = 0;               /* index of code symbols */
                var min = 0, max = 0;          /* minimum and maximum code lengths */
                var root = 0;              /* number of index bits for root table */
                var curr = 0;              /* number of index bits for current table */
                var drop = 0;              /* code bits to drop for sub-table */
                var left = 0;                   /* number of prefix codes available */
                var used = 0;              /* code entries in table used */
                var huff = 0;              /* Huffman code */
                var incr;              /* for incrementing code, index */
                var fill;              /* index for replicating entries */
                var low;               /* low bits for current root entry */
                var mask;              /* mask for low root bits */
                var next;             /* next available space in table */
                var base = null;     /* base value table to use */
                var base_index = 0;
                //  var shoextra;    /* extra bits table to use */
                var end;                    /* use base and extra for symbol > end */
                var count = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
                var offs = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
                var extra = null;
                var extra_index = 0;

                var here_bits, here_op, here_val;

                /*
                 Process a set of code lengths to create a canonical Huffman code.  The
                 code lengths are lens[0..codes-1].  Each length corresponds to the
                 symbols 0..codes-1.  The Huffman code is generated by first sorting the
                 symbols by length from short to long, and retaining the symbol order
                 for codes with equal lengths.  Then the code starts with all zero bits
                 for the first code of the shortest length, and the codes are integer
                 increments for the same length, and zeros are appended as the length
                 increases.  For the deflate format, these bits are stored backwards
                 from their more natural integer increment ordering, and so when the
                 decoding tables are built in the large loop below, the integer codes
                 are incremented backwards.
              
                 This routine assumes, but does not check, that all of the entries in
                 lens[] are in the range 0..MAXBITS.  The caller must assure this.
                 1..MAXBITS is interpreted as that code length.  zero means that that
                 symbol does not occur in this code.
              
                 The codes are sorted by computing a count of codes for each length,
                 creating from that a table of starting indices for each length in the
                 sorted table, and then entering the symbols in order in the sorted
                 table.  The sorted table is work[], with that space being provided by
                 the caller.
              
                 The length counts are used for other purposes as well, i.e. finding
                 the minimum and maximum length codes, determining if there are any
                 codes at all, checking for a valid set of lengths, and looking ahead
                 at length counts to determine sub-table sizes when building the
                 decoding tables.
                 */

                /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
                for (len = 0; len <= MAXBITS; len++) {
                    count[len] = 0;
                }
                for (sym = 0; sym < codes; sym++) {
                    count[lens[lens_index + sym]]++;
                }

                /* bound code lengths, force root to be within code lengths */
                root = bits;
                for (max = MAXBITS; max >= 1; max--) {
                    if (count[max] !== 0) { break; }
                }
                if (root > max) {
                    root = max;
                }
                if (max === 0) {                     /* no symbols to code at all */
                    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
                    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
                    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
                    table[table_index++] = (1 << 24) | (64 << 16) | 0;


                    //table.op[opts.table_index] = 64;
                    //table.bits[opts.table_index] = 1;
                    //table.val[opts.table_index++] = 0;
                    table[table_index++] = (1 << 24) | (64 << 16) | 0;

                    opts.bits = 1;
                    return 0;     /* no symbols, but wait for decoding to report error */
                }
                for (min = 1; min < max; min++) {
                    if (count[min] !== 0) { break; }
                }
                if (root < min) {
                    root = min;
                }

                /* check for an over-subscribed or incomplete set of lengths */
                left = 1;
                for (len = 1; len <= MAXBITS; len++) {
                    left <<= 1;
                    left -= count[len];
                    if (left < 0) {
                        return -1;
                    }        /* over-subscribed */
                }
                if (left > 0 && (type === CODES || max !== 1)) {
                    return -1;                      /* incomplete set */
                }

                /* generate offsets into symbol table for each length for sorting */
                offs[1] = 0;
                for (len = 1; len < MAXBITS; len++) {
                    offs[len + 1] = offs[len] + count[len];
                }

                /* sort symbols by length, by symbol order within each length */
                for (sym = 0; sym < codes; sym++) {
                    if (lens[lens_index + sym] !== 0) {
                        work[offs[lens[lens_index + sym]]++] = sym;
                    }
                }

                /*
                 Create and fill in decoding tables.  In this loop, the table being
                 filled is at next and has curr index bits.  The code being used is huff
                 with length len.  That code is converted to an index by dropping drop
                 bits off of the bottom.  For codes where len is less than drop + curr,
                 those top drop + curr - len bits are incremented through all values to
                 fill the table with replicated entries.
              
                 root is the number of index bits for the root table.  When len exceeds
                 root, sub-tables are created pointed to by the root entry with an index
                 of the low root bits of huff.  This is saved in low to check for when a
                 new sub-table should be started.  drop is zero when the root table is
                 being filled, and drop is root when sub-tables are being filled.
              
                 When a new sub-table is needed, it is necessary to look ahead in the
                 code lengths to determine what size sub-table is needed.  The length
                 counts are used for this, and so count[] is decremented as codes are
                 entered in the tables.
              
                 used keeps track of how many table entries have been allocated from the
                 provided *table space.  It is checked for LENS and DIST tables against
                 the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
                 the initial root table size constants.  See the comments in inftrees.h
                 for more information.
              
                 sym increments through all symbols, and the loop terminates when
                 all codes of length max, i.e. all codes, have been processed.  This
                 routine permits incomplete codes, so another loop after this one fills
                 in the rest of the decoding tables with invalid code markers.
                 */

                /* set up for code type */
                // poor man optimization - use if-else instead of switch,
                // to avoid deopts in old v8
                if (type === CODES) {
                    base = extra = work;    /* dummy value--not used */
                    end = 19;

                } else if (type === LENS) {
                    base = lbase;
                    base_index -= 257;
                    extra = lext;
                    extra_index -= 257;
                    end = 256;

                } else {                    /* DISTS */
                    base = dbase;
                    extra = dext;
                    end = -1;
                }

                /* initialize opts for loop */
                huff = 0;                   /* starting code */
                sym = 0;                    /* starting code symbol */
                len = min;                  /* starting code length */
                next = table_index;              /* current table to fill in */
                curr = root;                /* current table index bits */
                drop = 0;                   /* current bits to drop from code for index */
                low = -1;                   /* trigger new sub-table when len > root */
                used = 1 << root;          /* use root table entries */
                mask = used - 1;            /* mask for comparing low */

                /* check available table space */
                if ((type === LENS && used > ENOUGH_LENS) ||
                    (type === DISTS && used > ENOUGH_DISTS)) {
                    return 1;
                }

                var i = 0;
                /* process all codes and make table entries */
                for (; ;) {
                    i++;
                    /* create table entry */
                    here_bits = len - drop;
                    if (work[sym] < end) {
                        here_op = 0;
                        here_val = work[sym];
                    }
                    else if (work[sym] > end) {
                        here_op = extra[extra_index + work[sym]];
                        here_val = base[base_index + work[sym]];
                    }
                    else {
                        here_op = 32 + 64;         /* end of block */
                        here_val = 0;
                    }

                    /* replicate for those indices with low len bits equal to huff */
                    incr = 1 << (len - drop);
                    fill = 1 << curr;
                    min = fill;                 /* save offset to next table */
                    do {
                        fill -= incr;
                        table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val | 0;
                    } while (fill !== 0);

                    /* backwards increment the len-bit code huff */
                    incr = 1 << (len - 1);
                    while (huff & incr) {
                        incr >>= 1;
                    }
                    if (incr !== 0) {
                        huff &= incr - 1;
                        huff += incr;
                    } else {
                        huff = 0;
                    }

                    /* go to next symbol, update count, len */
                    sym++;
                    if (--count[len] === 0) {
                        if (len === max) { break; }
                        len = lens[lens_index + work[sym]];
                    }

                    /* create new sub-table if needed */
                    if (len > root && (huff & mask) !== low) {
                        /* if first time, transition to sub-tables */
                        if (drop === 0) {
                            drop = root;
                        }

                        /* increment past last table */
                        next += min;            /* here min is 1 << curr */

                        /* determine length of next table */
                        curr = len - drop;
                        left = 1 << curr;
                        while (curr + drop < max) {
                            left -= count[curr + drop];
                            if (left <= 0) { break; }
                            curr++;
                            left <<= 1;
                        }

                        /* check for enough space */
                        used += 1 << curr;
                        if ((type === LENS && used > ENOUGH_LENS) ||
                            (type === DISTS && used > ENOUGH_DISTS)) {
                            return 1;
                        }

                        /* point entry in root table to sub-table */
                        low = huff & mask;
                        /*table.op[low] = curr;
                        table.bits[low] = root;
                        table.val[low] = next - opts.table_index;*/
                        table[low] = (root << 24) | (curr << 16) | (next - table_index) | 0;
                    }
                }

                /* fill in remaining table entry if code is incomplete (guaranteed to have
                 at most one remaining entry, since if the code is incomplete, the
                 maximum code length that was allowed to get this far is one bit) */
                if (huff !== 0) {
                    //table.op[next + huff] = 64;            /* invalid code marker */
                    //table.bits[next + huff] = len - drop;
                    //table.val[next + huff] = 0;
                    table[next + huff] = ((len - drop) << 24) | (64 << 16) | 0;
                }

                /* set return parameters */
                //opts.table_index += used;
                opts.bits = root;
                return 0;
            };

        }, { "../utils/common": 62 }], 72: [function (require, module, exports) {
            'use strict';

            module.exports = {
                2: 'need dictionary',     /* Z_NEED_DICT       2  */
                1: 'stream end',          /* Z_STREAM_END      1  */
                0: '',                    /* Z_OK              0  */
                '-1': 'file error',          /* Z_ERRNO         (-1) */
                '-2': 'stream error',        /* Z_STREAM_ERROR  (-2) */
                '-3': 'data error',          /* Z_DATA_ERROR    (-3) */
                '-4': 'insufficient memory', /* Z_MEM_ERROR     (-4) */
                '-5': 'buffer error',        /* Z_BUF_ERROR     (-5) */
                '-6': 'incompatible version' /* Z_VERSION_ERROR (-6) */
            };

        }, {}], 73: [function (require, module, exports) {
            'use strict';


            var utils = require('../utils/common');

            /* Public constants ==========================================================*/
            /* ===========================================================================*/


            //var Z_FILTERED          = 1;
            //var Z_HUFFMAN_ONLY      = 2;
            //var Z_RLE               = 3;
            var Z_FIXED = 4;
            //var Z_DEFAULT_STRATEGY  = 0;

            /* Possible values of the data_type field (though see inflate()) */
            var Z_BINARY = 0;
            var Z_TEXT = 1;
            //var Z_ASCII             = 1; // = Z_TEXT
            var Z_UNKNOWN = 2;

            /*============================================================================*/


            function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

            // From zutil.h

            var STORED_BLOCK = 0;
            var STATIC_TREES = 1;
            var DYN_TREES = 2;
            /* The three kinds of block type */

            var MIN_MATCH = 3;
            var MAX_MATCH = 258;
            /* The minimum and maximum match lengths */

            // From deflate.h
            /* ===========================================================================
             * Internal compression state.
             */

            var LENGTH_CODES = 29;
            /* number of length codes, not counting the special END_BLOCK code */

            var LITERALS = 256;
            /* number of literal bytes 0..255 */

            var L_CODES = LITERALS + 1 + LENGTH_CODES;
            /* number of Literal or Length codes, including the END_BLOCK code */

            var D_CODES = 30;
            /* number of distance codes */

            var BL_CODES = 19;
            /* number of codes used to transfer the bit lengths */

            var HEAP_SIZE = 2 * L_CODES + 1;
            /* maximum heap size */

            var MAX_BITS = 15;
            /* All codes must not exceed MAX_BITS bits */

            var Buf_size = 16;
            /* size of bit buffer in bi_buf */


            /* ===========================================================================
             * Constants
             */

            var MAX_BL_BITS = 7;
            /* Bit length codes must not exceed MAX_BL_BITS bits */

            var END_BLOCK = 256;
            /* end of block literal code */

            var REP_3_6 = 16;
            /* repeat previous bit length 3-6 times (2 bits of repeat count) */

            var REPZ_3_10 = 17;
            /* repeat a zero length 3-10 times  (3 bits of repeat count) */

            var REPZ_11_138 = 18;
            /* repeat a zero length 11-138 times  (7 bits of repeat count) */

            /* eslint-disable comma-spacing,array-bracket-spacing */
            var extra_lbits =   /* extra bits for each length code */
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];

            var extra_dbits =   /* extra bits for each distance code */
                [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

            var extra_blbits =  /* extra bits for each bit length code */
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];

            var bl_order =
                [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            /* eslint-enable comma-spacing,array-bracket-spacing */

            /* The lengths of the bit length codes are sent in order of decreasing
             * probability, to avoid transmitting the lengths for unused bit length codes.
             */

            /* ===========================================================================
             * Local data. These are initialized only once.
             */

            // We pre-fill arrays with 0 to avoid uninitialized gaps

            var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

            // !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
            var static_ltree = new Array((L_CODES + 2) * 2);
            zero(static_ltree);
            /* The static literal tree. Since the bit lengths are imposed, there is no
             * need for the L_CODES extra codes used during heap construction. However
             * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
             * below).
             */

            var static_dtree = new Array(D_CODES * 2);
            zero(static_dtree);
            /* The static distance tree. (Actually a trivial tree since all codes use
             * 5 bits.)
             */

            var _dist_code = new Array(DIST_CODE_LEN);
            zero(_dist_code);
            /* Distance codes. The first 256 values correspond to the distances
             * 3 .. 258, the last 256 values correspond to the top 8 bits of
             * the 15 bit distances.
             */

            var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
            zero(_length_code);
            /* length code for each normalized match length (0 == MIN_MATCH) */

            var base_length = new Array(LENGTH_CODES);
            zero(base_length);
            /* First normalized length for each code (0 = MIN_MATCH) */

            var base_dist = new Array(D_CODES);
            zero(base_dist);
            /* First normalized distance for each code (0 = distance of 1) */


            function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

                this.static_tree = static_tree;  /* static tree or NULL */
                this.extra_bits = extra_bits;   /* extra bits for each code or NULL */
                this.extra_base = extra_base;   /* base index for extra_bits */
                this.elems = elems;        /* max number of elements in the tree */
                this.max_length = max_length;   /* max bit length for the codes */

                // show if `static_tree` has data or dummy - needed for monomorphic objects
                this.has_stree = static_tree && static_tree.length;
            }


            var static_l_desc;
            var static_d_desc;
            var static_bl_desc;


            function TreeDesc(dyn_tree, stat_desc) {
                this.dyn_tree = dyn_tree;     /* the dynamic tree */
                this.max_code = 0;            /* largest code with non zero frequency */
                this.stat_desc = stat_desc;   /* the corresponding static tree */
            }



            function d_code(dist) {
                return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
            }


            /* ===========================================================================
             * Output a short LSB first on the stream.
             * IN assertion: there is enough room in pendingBuf.
             */
            function put_short(s, w) {
                //    put_byte(s, (uch)((w) & 0xff));
                //    put_byte(s, (uch)((ush)(w) >> 8));
                s.pending_buf[s.pending++] = (w) & 0xff;
                s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
            }


            /* ===========================================================================
             * Send a value on a given number of bits.
             * IN assertion: length <= 16 and value fits in length bits.
             */
            function send_bits(s, value, length) {
                if (s.bi_valid > (Buf_size - length)) {
                    s.bi_buf |= (value << s.bi_valid) & 0xffff;
                    put_short(s, s.bi_buf);
                    s.bi_buf = value >> (Buf_size - s.bi_valid);
                    s.bi_valid += length - Buf_size;
                } else {
                    s.bi_buf |= (value << s.bi_valid) & 0xffff;
                    s.bi_valid += length;
                }
            }


            function send_code(s, c, tree) {
                send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
            }


            /* ===========================================================================
             * Reverse the first len bits of a code, using straightforward code (a faster
             * method would use a table)
             * IN assertion: 1 <= len <= 15
             */
            function bi_reverse(code, len) {
                var res = 0;
                do {
                    res |= code & 1;
                    code >>>= 1;
                    res <<= 1;
                } while (--len > 0);
                return res >>> 1;
            }


            /* ===========================================================================
             * Flush the bit buffer, keeping at most 7 bits in it.
             */
            function bi_flush(s) {
                if (s.bi_valid === 16) {
                    put_short(s, s.bi_buf);
                    s.bi_buf = 0;
                    s.bi_valid = 0;

                } else if (s.bi_valid >= 8) {
                    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
                    s.bi_buf >>= 8;
                    s.bi_valid -= 8;
                }
            }


            /* ===========================================================================
             * Compute the optimal bit lengths for a tree and update the total bit length
             * for the current block.
             * IN assertion: the fields freq and dad are set, heap[heap_max] and
             *    above are the tree nodes sorted by increasing frequency.
             * OUT assertions: the field len is set to the optimal bit length, the
             *     array bl_count contains the frequencies for each bit length.
             *     The length opt_len is updated; static_len is also updated if stree is
             *     not null.
             */
            function gen_bitlen(s, desc)
            //    deflate_state *s;
            //    tree_desc *desc;    /* the tree descriptor */
            {
                var tree = desc.dyn_tree;
                var max_code = desc.max_code;
                var stree = desc.stat_desc.static_tree;
                var has_stree = desc.stat_desc.has_stree;
                var extra = desc.stat_desc.extra_bits;
                var base = desc.stat_desc.extra_base;
                var max_length = desc.stat_desc.max_length;
                var h;              /* heap index */
                var n, m;           /* iterate over the tree elements */
                var bits;           /* bit length */
                var xbits;          /* extra bits */
                var f;              /* frequency */
                var overflow = 0;   /* number of elements with bit length too large */

                for (bits = 0; bits <= MAX_BITS; bits++) {
                    s.bl_count[bits] = 0;
                }

                /* In a first pass, compute the optimal bit lengths (which may
                 * overflow in the case of the bit length tree).
                 */
                tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

                for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
                    n = s.heap[h];
                    bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
                    if (bits > max_length) {
                        bits = max_length;
                        overflow++;
                    }
                    tree[n * 2 + 1]/*.Len*/ = bits;
                    /* We overwrite tree[n].Dad which is no longer needed */

                    if (n > max_code) { continue; } /* not a leaf node */

                    s.bl_count[bits]++;
                    xbits = 0;
                    if (n >= base) {
                        xbits = extra[n - base];
                    }
                    f = tree[n * 2]/*.Freq*/;
                    s.opt_len += f * (bits + xbits);
                    if (has_stree) {
                        s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
                    }
                }
                if (overflow === 0) { return; }

                // Trace((stderr,"\nbit length overflow\n"));
                /* This happens for example on obj2 and pic of the Calgary corpus */

                /* Find the first bit length which could increase: */
                do {
                    bits = max_length - 1;
                    while (s.bl_count[bits] === 0) { bits--; }
                    s.bl_count[bits]--;      /* move one leaf down the tree */
                    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
                    s.bl_count[max_length]--;
                    /* The brother of the overflow item also moves one step up,
                     * but this does not affect bl_count[max_length]
                     */
                    overflow -= 2;
                } while (overflow > 0);

                /* Now recompute all bit lengths, scanning in increasing frequency.
                 * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
                 * lengths instead of fixing only the wrong ones. This idea is taken
                 * from 'ar' written by Haruhiko Okumura.)
                 */
                for (bits = max_length; bits !== 0; bits--) {
                    n = s.bl_count[bits];
                    while (n !== 0) {
                        m = s.heap[--h];
                        if (m > max_code) { continue; }
                        if (tree[m * 2 + 1]/*.Len*/ !== bits) {
                            // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
                            s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
                            tree[m * 2 + 1]/*.Len*/ = bits;
                        }
                        n--;
                    }
                }
            }


            /* ===========================================================================
             * Generate the codes for a given tree and bit counts (which need not be
             * optimal).
             * IN assertion: the array bl_count contains the bit length statistics for
             * the given tree and the field len is set for all tree elements.
             * OUT assertion: the field code is set for all tree elements of non
             *     zero code length.
             */
            function gen_codes(tree, max_code, bl_count)
            //    ct_data *tree;             /* the tree to decorate */
            //    int max_code;              /* largest code with non zero frequency */
            //    ushf *bl_count;            /* number of codes at each bit length */
            {
                var next_code = new Array(MAX_BITS + 1); /* next code value for each bit length */
                var code = 0;              /* running code value */
                var bits;                  /* bit index */
                var n;                     /* code index */

                /* The distribution counts are first used to generate the code values
                 * without bit reversal.
                 */
                for (bits = 1; bits <= MAX_BITS; bits++) {
                    next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
                }
                /* Check that the bit counts in bl_count are consistent. The last code
                 * must be all ones.
                 */
                //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
                //        "inconsistent bit counts");
                //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

                for (n = 0; n <= max_code; n++) {
                    var len = tree[n * 2 + 1]/*.Len*/;
                    if (len === 0) { continue; }
                    /* Now reverse the bits */
                    tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

                    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
                    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
                }
            }


            /* ===========================================================================
             * Initialize the various 'constant' tables.
             */
            function tr_static_init() {
                var n;        /* iterates over tree elements */
                var bits;     /* bit counter */
                var length;   /* length value */
                var code;     /* code value */
                var dist;     /* distance index */
                var bl_count = new Array(MAX_BITS + 1);
                /* number of codes at each bit length for an optimal tree */

                // do check in _tr_init()
                //if (static_init_done) return;

                /* For some embedded targets, global variables are not initialized: */
                /*#ifdef NO_INIT_GLOBAL_POINTERS
                  static_l_desc.static_tree = static_ltree;
                  static_l_desc.extra_bits = extra_lbits;
                  static_d_desc.static_tree = static_dtree;
                  static_d_desc.extra_bits = extra_dbits;
                  static_bl_desc.extra_bits = extra_blbits;
                #endif*/

                /* Initialize the mapping length (0..255) -> length code (0..28) */
                length = 0;
                for (code = 0; code < LENGTH_CODES - 1; code++) {
                    base_length[code] = length;
                    for (n = 0; n < (1 << extra_lbits[code]); n++) {
                        _length_code[length++] = code;
                    }
                }
                //Assert (length == 256, "tr_static_init: length != 256");
                /* Note that the length 255 (match length 258) can be represented
                 * in two different ways: code 284 + 5 bits or code 285, so we
                 * overwrite length_code[255] to use the best encoding:
                 */
                _length_code[length - 1] = code;

                /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
                dist = 0;
                for (code = 0; code < 16; code++) {
                    base_dist[code] = dist;
                    for (n = 0; n < (1 << extra_dbits[code]); n++) {
                        _dist_code[dist++] = code;
                    }
                }
                //Assert (dist == 256, "tr_static_init: dist != 256");
                dist >>= 7; /* from now on, all distances are divided by 128 */
                for (; code < D_CODES; code++) {
                    base_dist[code] = dist << 7;
                    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
                        _dist_code[256 + dist++] = code;
                    }
                }
                //Assert (dist == 256, "tr_static_init: 256+dist != 512");

                /* Construct the codes of the static literal tree */
                for (bits = 0; bits <= MAX_BITS; bits++) {
                    bl_count[bits] = 0;
                }

                n = 0;
                while (n <= 143) {
                    static_ltree[n * 2 + 1]/*.Len*/ = 8;
                    n++;
                    bl_count[8]++;
                }
                while (n <= 255) {
                    static_ltree[n * 2 + 1]/*.Len*/ = 9;
                    n++;
                    bl_count[9]++;
                }
                while (n <= 279) {
                    static_ltree[n * 2 + 1]/*.Len*/ = 7;
                    n++;
                    bl_count[7]++;
                }
                while (n <= 287) {
                    static_ltree[n * 2 + 1]/*.Len*/ = 8;
                    n++;
                    bl_count[8]++;
                }
                /* Codes 286 and 287 do not exist, but we must include them in the
                 * tree construction to get a canonical Huffman tree (longest code
                 * all ones)
                 */
                gen_codes(static_ltree, L_CODES + 1, bl_count);

                /* The static distance tree is trivial: */
                for (n = 0; n < D_CODES; n++) {
                    static_dtree[n * 2 + 1]/*.Len*/ = 5;
                    static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
                }

                // Now data ready and we can init static trees
                static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
                static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
                static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);

                //static_init_done = true;
            }


            /* ===========================================================================
             * Initialize a new block.
             */
            function init_block(s) {
                var n; /* iterates over tree elements */

                /* Initialize the trees. */
                for (n = 0; n < L_CODES; n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
                for (n = 0; n < D_CODES; n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
                for (n = 0; n < BL_CODES; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

                s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
                s.opt_len = s.static_len = 0;
                s.last_lit = s.matches = 0;
            }


            /* ===========================================================================
             * Flush the bit buffer and align the output on a byte boundary
             */
            function bi_windup(s) {
                if (s.bi_valid > 8) {
                    put_short(s, s.bi_buf);
                } else if (s.bi_valid > 0) {
                    //put_byte(s, (Byte)s->bi_buf);
                    s.pending_buf[s.pending++] = s.bi_buf;
                }
                s.bi_buf = 0;
                s.bi_valid = 0;
            }

            /* ===========================================================================
             * Copy a stored block, storing first the length and its
             * one's complement if requested.
             */
            function copy_block(s, buf, len, header)
            //DeflateState *s;
            //charf    *buf;    /* the input data */
            //unsigned len;     /* its length */
            //int      header;  /* true if block header must be written */
            {
                bi_windup(s);        /* align on byte boundary */

                if (header) {
                    put_short(s, len);
                    put_short(s, ~len);
                }
                //  while (len--) {
                //    put_byte(s, *buf++);
                //  }
                utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
                s.pending += len;
            }

            /* ===========================================================================
             * Compares to subtrees, using the tree depth as tie breaker when
             * the subtrees have equal frequency. This minimizes the worst case length.
             */
            function smaller(tree, n, m, depth) {
                var _n2 = n * 2;
                var _m2 = m * 2;
                return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
                    (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
            }

            /* ===========================================================================
             * Restore the heap property by moving down the tree starting at node k,
             * exchanging a node with the smallest of its two sons if necessary, stopping
             * when the heap property is re-established (each father smaller than its
             * two sons).
             */
            function pqdownheap(s, tree, k)
            //    deflate_state *s;
            //    ct_data *tree;  /* the tree to restore */
            //    int k;               /* node to move down */
            {
                var v = s.heap[k];
                var j = k << 1;  /* left son of k */
                while (j <= s.heap_len) {
                    /* Set j to the smallest of the two sons: */
                    if (j < s.heap_len &&
                        smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
                        j++;
                    }
                    /* Exit if v is smaller than both sons */
                    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

                    /* Exchange v with the smallest son */
                    s.heap[k] = s.heap[j];
                    k = j;

                    /* And continue down the tree, setting j to the left son of k */
                    j <<= 1;
                }
                s.heap[k] = v;
            }


            // inlined manually
            // var SMALLEST = 1;

            /* ===========================================================================
             * Send the block data compressed using the given Huffman trees
             */
            function compress_block(s, ltree, dtree)
            //    deflate_state *s;
            //    const ct_data *ltree; /* literal tree */
            //    const ct_data *dtree; /* distance tree */
            {
                var dist;           /* distance of matched string */
                var lc;             /* match length or unmatched char (if dist == 0) */
                var lx = 0;         /* running index in l_buf */
                var code;           /* the code to send */
                var extra;          /* number of extra bits to send */

                if (s.last_lit !== 0) {
                    do {
                        dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
                        lc = s.pending_buf[s.l_buf + lx];
                        lx++;

                        if (dist === 0) {
                            send_code(s, lc, ltree); /* send a literal byte */
                            //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
                        } else {
                            /* Here, lc is the match length - MIN_MATCH */
                            code = _length_code[lc];
                            send_code(s, code + LITERALS + 1, ltree); /* send the length code */
                            extra = extra_lbits[code];
                            if (extra !== 0) {
                                lc -= base_length[code];
                                send_bits(s, lc, extra);       /* send the extra length bits */
                            }
                            dist--; /* dist is now the match distance - 1 */
                            code = d_code(dist);
                            //Assert (code < D_CODES, "bad d_code");

                            send_code(s, code, dtree);       /* send the distance code */
                            extra = extra_dbits[code];
                            if (extra !== 0) {
                                dist -= base_dist[code];
                                send_bits(s, dist, extra);   /* send the extra distance bits */
                            }
                        } /* literal or match pair ? */

                        /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
                        //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
                        //       "pendingBuf overflow");

                    } while (lx < s.last_lit);
                }

                send_code(s, END_BLOCK, ltree);
            }


            /* ===========================================================================
             * Construct one Huffman tree and assigns the code bit strings and lengths.
             * Update the total bit length for the current block.
             * IN assertion: the field freq is set for all tree elements.
             * OUT assertions: the fields len and code are set to the optimal bit length
             *     and corresponding code. The length opt_len is updated; static_len is
             *     also updated if stree is not null. The field max_code is set.
             */
            function build_tree(s, desc)
            //    deflate_state *s;
            //    tree_desc *desc; /* the tree descriptor */
            {
                var tree = desc.dyn_tree;
                var stree = desc.stat_desc.static_tree;
                var has_stree = desc.stat_desc.has_stree;
                var elems = desc.stat_desc.elems;
                var n, m;          /* iterate over heap elements */
                var max_code = -1; /* largest code with non zero frequency */
                var node;          /* new node being created */

                /* Construct the initial heap, with least frequent element in
                 * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
                 * heap[0] is not used.
                 */
                s.heap_len = 0;
                s.heap_max = HEAP_SIZE;

                for (n = 0; n < elems; n++) {
                    if (tree[n * 2]/*.Freq*/ !== 0) {
                        s.heap[++s.heap_len] = max_code = n;
                        s.depth[n] = 0;

                    } else {
                        tree[n * 2 + 1]/*.Len*/ = 0;
                    }
                }

                /* The pkzip format requires that at least one distance code exists,
                 * and that at least one bit should be sent even if there is only one
                 * possible code. So to avoid special checks later on we force at least
                 * two codes of non zero frequency.
                 */
                while (s.heap_len < 2) {
                    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
                    tree[node * 2]/*.Freq*/ = 1;
                    s.depth[node] = 0;
                    s.opt_len--;

                    if (has_stree) {
                        s.static_len -= stree[node * 2 + 1]/*.Len*/;
                    }
                    /* node is 0 or 1 so it does not have extra bits */
                }
                desc.max_code = max_code;

                /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
                 * establish sub-heaps of increasing lengths:
                 */
                for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

                /* Construct the Huffman tree by repeatedly combining the least two
                 * frequent nodes.
                 */
                node = elems;              /* next internal node of the tree */
                do {
                    //pqremove(s, tree, n);  /* n = node of least frequency */
                    /*** pqremove ***/
                    n = s.heap[1/*SMALLEST*/];
                    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
                    pqdownheap(s, tree, 1/*SMALLEST*/);
                    /***/

                    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

                    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
                    s.heap[--s.heap_max] = m;

                    /* Create a new node father of n and m */
                    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
                    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
                    tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

                    /* and insert the new node in the heap */
                    s.heap[1/*SMALLEST*/] = node++;
                    pqdownheap(s, tree, 1/*SMALLEST*/);

                } while (s.heap_len >= 2);

                s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

                /* At this point, the fields freq and dad are set. We can now
                 * generate the bit lengths.
                 */
                gen_bitlen(s, desc);

                /* The field len is now set, we can generate the bit codes */
                gen_codes(tree, max_code, s.bl_count);
            }


            /* ===========================================================================
             * Scan a literal or distance tree to determine the frequencies of the codes
             * in the bit length tree.
             */
            function scan_tree(s, tree, max_code)
            //    deflate_state *s;
            //    ct_data *tree;   /* the tree to be scanned */
            //    int max_code;    /* and its largest code of non zero frequency */
            {
                var n;                     /* iterates over all tree elements */
                var prevlen = -1;          /* last emitted length */
                var curlen;                /* length of current code */

                var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

                var count = 0;             /* repeat count of the current code */
                var max_count = 7;         /* max repeat count */
                var min_count = 4;         /* min repeat count */

                if (nextlen === 0) {
                    max_count = 138;
                    min_count = 3;
                }
                tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

                    if (++count < max_count && curlen === nextlen) {
                        continue;

                    } else if (count < min_count) {
                        s.bl_tree[curlen * 2]/*.Freq*/ += count;

                    } else if (curlen !== 0) {

                        if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
                        s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

                    } else if (count <= 10) {
                        s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

                    } else {
                        s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
                    }

                    count = 0;
                    prevlen = curlen;

                    if (nextlen === 0) {
                        max_count = 138;
                        min_count = 3;

                    } else if (curlen === nextlen) {
                        max_count = 6;
                        min_count = 3;

                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            }


            /* ===========================================================================
             * Send a literal or distance tree in compressed form, using the codes in
             * bl_tree.
             */
            function send_tree(s, tree, max_code)
            //    deflate_state *s;
            //    ct_data *tree; /* the tree to be scanned */
            //    int max_code;       /* and its largest code of non zero frequency */
            {
                var n;                     /* iterates over all tree elements */
                var prevlen = -1;          /* last emitted length */
                var curlen;                /* length of current code */

                var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

                var count = 0;             /* repeat count of the current code */
                var max_count = 7;         /* max repeat count */
                var min_count = 4;         /* min repeat count */

                /* tree[max_code+1].Len = -1; */  /* guard already set */
                if (nextlen === 0) {
                    max_count = 138;
                    min_count = 3;
                }

                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

                    if (++count < max_count && curlen === nextlen) {
                        continue;

                    } else if (count < min_count) {
                        do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

                    } else if (curlen !== 0) {
                        if (curlen !== prevlen) {
                            send_code(s, curlen, s.bl_tree);
                            count--;
                        }
                        //Assert(count >= 3 && count <= 6, " 3_6?");
                        send_code(s, REP_3_6, s.bl_tree);
                        send_bits(s, count - 3, 2);

                    } else if (count <= 10) {
                        send_code(s, REPZ_3_10, s.bl_tree);
                        send_bits(s, count - 3, 3);

                    } else {
                        send_code(s, REPZ_11_138, s.bl_tree);
                        send_bits(s, count - 11, 7);
                    }

                    count = 0;
                    prevlen = curlen;
                    if (nextlen === 0) {
                        max_count = 138;
                        min_count = 3;

                    } else if (curlen === nextlen) {
                        max_count = 6;
                        min_count = 3;

                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            }


            /* ===========================================================================
             * Construct the Huffman tree for the bit lengths and return the index in
             * bl_order of the last bit length code to send.
             */
            function build_bl_tree(s) {
                var max_blindex;  /* index of last bit length code of non zero freq */

                /* Determine the bit length frequencies for literal and distance trees */
                scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
                scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

                /* Build the bit length tree: */
                build_tree(s, s.bl_desc);
                /* opt_len now includes the length of the tree representations, except
                 * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
                 */

                /* Determine the number of bit length codes to send. The pkzip format
                 * requires that at least 4 bit length codes be sent. (appnote.txt says
                 * 3 but the actual value used is 4.)
                 */
                for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
                    if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
                        break;
                    }
                }
                /* Update opt_len to include the bit length tree and counts */
                s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
                //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
                //        s->opt_len, s->static_len));

                return max_blindex;
            }


            /* ===========================================================================
             * Send the header for a block using dynamic Huffman trees: the counts, the
             * lengths of the bit length codes, the literal tree and the distance tree.
             * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
             */
            function send_all_trees(s, lcodes, dcodes, blcodes)
            //    deflate_state *s;
            //    int lcodes, dcodes, blcodes; /* number of codes for each tree */
            {
                var rank;                    /* index in bl_order */

                //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
                //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
                //        "too many codes");
                //Tracev((stderr, "\nbl counts: "));
                send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
                send_bits(s, dcodes - 1, 5);
                send_bits(s, blcodes - 4, 4); /* not -3 as stated in appnote.txt */
                for (rank = 0; rank < blcodes; rank++) {
                    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
                    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
                }
                //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

                send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
                //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

                send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
                //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
            }


            /* ===========================================================================
             * Check if the data type is TEXT or BINARY, using the following algorithm:
             * - TEXT if the two conditions below are satisfied:
             *    a) There are no non-portable control characters belonging to the
             *       "black list" (0..6, 14..25, 28..31).
             *    b) There is at least one printable character belonging to the
             *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
             * - BINARY otherwise.
             * - The following partially-portable control characters form a
             *   "gray list" that is ignored in this detection algorithm:
             *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
             * IN assertion: the fields Freq of dyn_ltree are set.
             */
            function detect_data_type(s) {
                /* black_mask is the bit mask of black-listed bytes
                 * set bits 0..6, 14..25, and 28..31
                 * 0xf3ffc07f = binary 11110011111111111100000001111111
                 */
                var black_mask = 0xf3ffc07f;
                var n;

                /* Check for non-textual ("black-listed") bytes. */
                for (n = 0; n <= 31; n++ , black_mask >>>= 1) {
                    if ((black_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
                        return Z_BINARY;
                    }
                }

                /* Check for textual ("white-listed") bytes. */
                if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
                    s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
                    return Z_TEXT;
                }
                for (n = 32; n < LITERALS; n++) {
                    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
                        return Z_TEXT;
                    }
                }

                /* There are no "black-listed" or "white-listed" bytes:
                 * this stream either is empty or has tolerated ("gray-listed") bytes only.
                 */
                return Z_BINARY;
            }


            var static_init_done = false;

            /* ===========================================================================
             * Initialize the tree data structures for a new zlib stream.
             */
            function _tr_init(s) {

                if (!static_init_done) {
                    tr_static_init();
                    static_init_done = true;
                }

                s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
                s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
                s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

                s.bi_buf = 0;
                s.bi_valid = 0;

                /* Initialize the first block of the first file: */
                init_block(s);
            }


            /* ===========================================================================
             * Send a stored block
             */
            function _tr_stored_block(s, buf, stored_len, last)
            //DeflateState *s;
            //charf *buf;       /* input block */
            //ulg stored_len;   /* length of input block */
            //int last;         /* one if this is the last block for a file */
            {
                send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
                copy_block(s, buf, stored_len, true); /* with header */
            }


            /* ===========================================================================
             * Send one empty static block to give enough lookahead for inflate.
             * This takes 10 bits, of which 7 may remain in the bit buffer.
             */
            function _tr_align(s) {
                send_bits(s, STATIC_TREES << 1, 3);
                send_code(s, END_BLOCK, static_ltree);
                bi_flush(s);
            }


            /* ===========================================================================
             * Determine the best encoding for the current block: dynamic trees, static
             * trees or store, and output the encoded block to the zip file.
             */
            function _tr_flush_block(s, buf, stored_len, last)
            //DeflateState *s;
            //charf *buf;       /* input block, or NULL if too old */
            //ulg stored_len;   /* length of input block */
            //int last;         /* one if this is the last block for a file */
            {
                var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
                var max_blindex = 0;        /* index of last bit length code of non zero freq */

                /* Build the Huffman trees unless a stored block is forced */
                if (s.level > 0) {

                    /* Check if the file is binary or text */
                    if (s.strm.data_type === Z_UNKNOWN) {
                        s.strm.data_type = detect_data_type(s);
                    }

                    /* Construct the literal and distance trees */
                    build_tree(s, s.l_desc);
                    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
                    //        s->static_len));

                    build_tree(s, s.d_desc);
                    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
                    //        s->static_len));
                    /* At this point, opt_len and static_len are the total bit lengths of
                     * the compressed block data, excluding the tree representations.
                     */

                    /* Build the bit length tree for the above two trees, and get the index
                     * in bl_order of the last bit length code to send.
                     */
                    max_blindex = build_bl_tree(s);

                    /* Determine the best encoding. Compute the block lengths in bytes. */
                    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
                    static_lenb = (s.static_len + 3 + 7) >>> 3;

                    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
                    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
                    //        s->last_lit));

                    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

                } else {
                    // Assert(buf != (char*)0, "lost buf");
                    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
                }

                if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
                    /* 4: two words for the lengths */

                    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
                     * Otherwise we can't have processed more than WSIZE input bytes since
                     * the last block flush, because compression would have been
                     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
                     * transform a block into a stored block.
                     */
                    _tr_stored_block(s, buf, stored_len, last);

                } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

                    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
                    compress_block(s, static_ltree, static_dtree);

                } else {
                    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
                    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
                    compress_block(s, s.dyn_ltree, s.dyn_dtree);
                }
                // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
                /* The above check is made mod 2^32, for files larger than 512 MB
                 * and uLong implemented on 32 bits.
                 */
                init_block(s);

                if (last) {
                    bi_windup(s);
                }
                // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
                //       s->compressed_len-7*last));
            }

            /* ===========================================================================
             * Save the match info and tally the frequency counts. Return true if
             * the current block must be flushed.
             */
            function _tr_tally(s, dist, lc)
            //    deflate_state *s;
            //    unsigned dist;  /* distance of matched string */
            //    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
            {
                //var out_length, in_length, dcode;

                s.pending_buf[s.d_buf + s.last_lit * 2] = (dist >>> 8) & 0xff;
                s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

                s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
                s.last_lit++;

                if (dist === 0) {
                    /* lc is the unmatched char */
                    s.dyn_ltree[lc * 2]/*.Freq*/++;
                } else {
                    s.matches++;
                    /* Here, lc is the match length - MIN_MATCH */
                    dist--;             /* dist = match distance - 1 */
                    //Assert((ush)dist < (ush)MAX_DIST(s) &&
                    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
                    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

                    s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]/*.Freq*/++;
                    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
                }

                // (!) This block is disabled in zlib defailts,
                // don't enable it for binary compatibility

                //#ifdef TRUNCATE_BLOCK
                //  /* Try to guess if it is profitable to stop the current block here */
                //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
                //    /* Compute an upper bound for the compressed length */
                //    out_length = s.last_lit*8;
                //    in_length = s.strstart - s.block_start;
                //
                //    for (dcode = 0; dcode < D_CODES; dcode++) {
                //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
                //    }
                //    out_length >>>= 3;
                //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
                //    //       s->last_lit, in_length, out_length,
                //    //       100L - out_length*100L/in_length));
                //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
                //      return true;
                //    }
                //  }
                //#endif

                return (s.last_lit === s.lit_bufsize - 1);
                /* We avoid equality with lit_bufsize because of wraparound at 64K
                 * on 16 bit machines and because stored blocks are restricted to
                 * 64K-1 bytes.
                 */
            }

            exports._tr_init = _tr_init;
            exports._tr_stored_block = _tr_stored_block;
            exports._tr_flush_block = _tr_flush_block;
            exports._tr_tally = _tr_tally;
            exports._tr_align = _tr_align;

        }, { "../utils/common": 62 }], 74: [function (require, module, exports) {
            'use strict';


            function ZStream() {
                /* next input byte */
                this.input = null; // JS specific, because we have no pointers
                this.next_in = 0;
                /* number of bytes available at input */
                this.avail_in = 0;
                /* total number of input bytes read so far */
                this.total_in = 0;
                /* next output byte should be put there */
                this.output = null; // JS specific, because we have no pointers
                this.next_out = 0;
                /* remaining free space at output */
                this.avail_out = 0;
                /* total number of bytes output so far */
                this.total_out = 0;
                /* last error message, NULL if no error */
                this.msg = ''/*Z_NULL*/;
                /* not visible by applications */
                this.state = null;
                /* best guess about the data type: binary or text */
                this.data_type = 2/*Z_UNKNOWN*/;
                /* adler32 value of the uncompressed data */
                this.adler = 0;
            }

            module.exports = ZStream;

        }, {}]
    }, {}, [10])(10)
});
/*! pdfmake v0.1.53, @license MIT, @link http://pdfmake.org */
!function (t, e) { if ("object" == typeof exports && "object" == typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n = e(); for (var r in n) ("object" == typeof exports ? exports : t)[r] = n[r] } }("undefined" != typeof self ? self : this, function () {
    return function (t) { function e(r) { if (n[r]) return n[r].exports; var i = n[r] = { i: r, l: !1, exports: {} }; return t[r].call(i.exports, i, i.exports, e), i.l = !0, i.exports } var n = {}; return e.m = t, e.c = n, e.d = function (t, n, r) { e.o(t, n) || Object.defineProperty(t, n, { configurable: !1, enumerable: !0, get: r }) }, e.n = function (t) { var n = t && t.__esModule ? function () { return t.default } : function () { return t }; return e.d(n, "a", n), n }, e.o = function (t, e) { return Object.prototype.hasOwnProperty.call(t, e) }, e.p = "", e(e.s = 205) }([function (t, e, n) { "use strict"; function r(t) { return "string" == typeof t || t instanceof String } function i(t) { return "number" == typeof t || t instanceof Number } function o(t) { return "boolean" == typeof t } function a(t) { return Array.isArray(t) } function s(t) { return "function" == typeof t } function u(t) { return null !== t && "object" == typeof t } function l(t) { return null === t } function c(t) { return void 0 === t } function f() { for (var t = {}, e = 0, n = arguments.length; e < n; e++) { var r = arguments[e]; if (r) for (var i in r) r.hasOwnProperty(i) && (t[i] = r[i]) } return t } function h(t, e, n) { switch (t.type) { case "ellipse": case "rect": t.x += e, t.y += n; break; case "line": t.x1 += e, t.x2 += e, t.y1 += n, t.y2 += n; break; case "polyline": for (var r = 0, i = t.points.length; r < i; r++)t.points[r].x += e, t.points[r].y += n } } function d(t, e) { return "font" === t ? "font" : e } t.exports = { isString: r, isNumber: i, isBoolean: o, isArray: a, isFunction: s, isObject: u, isNull: l, isUndefined: c, pack: f, fontStringify: d, offsetVector: h } }, function (t, e, n) { !function (n, r) { t.exports = e = r() }(0, function () { var t = t || function (t, e) { var n = Object.create || function () { function t() { } return function (e) { var n; return t.prototype = e, n = new t, t.prototype = null, n } }(), r = {}, i = r.lib = {}, o = i.Base = function () { return { extend: function (t) { var e = n(this); return t && e.mixIn(t), e.hasOwnProperty("init") && this.init !== e.init || (e.init = function () { e.$super.init.apply(this, arguments) }), e.init.prototype = e, e.$super = this, e }, create: function () { var t = this.extend(); return t.init.apply(t, arguments), t }, init: function () { }, mixIn: function (t) { for (var e in t) t.hasOwnProperty(e) && (this[e] = t[e]); t.hasOwnProperty("toString") && (this.toString = t.toString) }, clone: function () { return this.init.prototype.extend(this) } } }(), a = i.WordArray = o.extend({ init: function (t, e) { t = this.words = t || [], this.sigBytes = void 0 != e ? e : 4 * t.length }, toString: function (t) { return (t || u).stringify(this) }, concat: function (t) { var e = this.words, n = t.words, r = this.sigBytes, i = t.sigBytes; if (this.clamp(), r % 4) for (var o = 0; o < i; o++) { var a = n[o >>> 2] >>> 24 - o % 4 * 8 & 255; e[r + o >>> 2] |= a << 24 - (r + o) % 4 * 8 } else for (var o = 0; o < i; o += 4)e[r + o >>> 2] = n[o >>> 2]; return this.sigBytes += i, this }, clamp: function () { var e = this.words, n = this.sigBytes; e[n >>> 2] &= 4294967295 << 32 - n % 4 * 8, e.length = t.ceil(n / 4) }, clone: function () { var t = o.clone.call(this); return t.words = this.words.slice(0), t }, random: function (e) { for (var n, r = [], i = 0; i < e; i += 4) { var o = function (e) { var e = e, n = 987654321, r = 4294967295; return function () { n = 36969 * (65535 & n) + (n >> 16) & r, e = 18e3 * (65535 & e) + (e >> 16) & r; var i = (n << 16) + e & r; return i /= 4294967296, (i += .5) * (t.random() > .5 ? 1 : -1) } }(4294967296 * (n || t.random())); n = 987654071 * o(), r.push(4294967296 * o() | 0) } return new a.init(r, e) } }), s = r.enc = {}, u = s.Hex = { stringify: function (t) { for (var e = t.words, n = t.sigBytes, r = [], i = 0; i < n; i++) { var o = e[i >>> 2] >>> 24 - i % 4 * 8 & 255; r.push((o >>> 4).toString(16)), r.push((15 & o).toString(16)) } return r.join("") }, parse: function (t) { for (var e = t.length, n = [], r = 0; r < e; r += 2)n[r >>> 3] |= parseInt(t.substr(r, 2), 16) << 24 - r % 8 * 4; return new a.init(n, e / 2) } }, l = s.Latin1 = { stringify: function (t) { for (var e = t.words, n = t.sigBytes, r = [], i = 0; i < n; i++) { var o = e[i >>> 2] >>> 24 - i % 4 * 8 & 255; r.push(String.fromCharCode(o)) } return r.join("") }, parse: function (t) { for (var e = t.length, n = [], r = 0; r < e; r++)n[r >>> 2] |= (255 & t.charCodeAt(r)) << 24 - r % 4 * 8; return new a.init(n, e) } }, c = s.Utf8 = { stringify: function (t) { try { return decodeURIComponent(escape(l.stringify(t))) } catch (t) { throw new Error("Malformed UTF-8 data") } }, parse: function (t) { return l.parse(unescape(encodeURIComponent(t))) } }, f = i.BufferedBlockAlgorithm = o.extend({ reset: function () { this._data = new a.init, this._nDataBytes = 0 }, _append: function (t) { "string" == typeof t && (t = c.parse(t)), this._data.concat(t), this._nDataBytes += t.sigBytes }, _process: function (e) { var n = this._data, r = n.words, i = n.sigBytes, o = this.blockSize, s = 4 * o, u = i / s; u = e ? t.ceil(u) : t.max((0 | u) - this._minBufferSize, 0); var l = u * o, c = t.min(4 * l, i); if (l) { for (var f = 0; f < l; f += o)this._doProcessBlock(r, f); var h = r.splice(0, l); n.sigBytes -= c } return new a.init(h, c) }, clone: function () { var t = o.clone.call(this); return t._data = this._data.clone(), t }, _minBufferSize: 0 }), h = (i.Hasher = f.extend({ cfg: o.extend(), init: function (t) { this.cfg = this.cfg.extend(t), this.reset() }, reset: function () { f.reset.call(this), this._doReset() }, update: function (t) { return this._append(t), this._process(), this }, finalize: function (t) { return t && this._append(t), this._doFinalize() }, blockSize: 16, _createHelper: function (t) { return function (e, n) { return new t.init(n).finalize(e) } }, _createHmacHelper: function (t) { return function (e, n) { return new h.HMAC.init(t, n).finalize(e) } } }), r.algo = {}); return r }(Math); return t }) }, function (t, e) { var n = t.exports = { version: "2.6.5" }; "number" == typeof __e && (__e = n) }, function (t, e, n) {
        "use strict"; (function (t) {
            function r() { return o.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823 } function i(t, e) { if (r() < e) throw new RangeError("Invalid typed array length"); return o.TYPED_ARRAY_SUPPORT ? (t = new Uint8Array(e), t.__proto__ = o.prototype) : (null === t && (t = new o(e)), t.length = e), t } function o(t, e, n) { if (!(o.TYPED_ARRAY_SUPPORT || this instanceof o)) return new o(t, e, n); if ("number" == typeof t) { if ("string" == typeof e) throw new Error("If encoding is specified then the first argument must be a string"); return l(this, t) } return a(this, t, e, n) } function a(t, e, n, r) { if ("number" == typeof e) throw new TypeError('"value" argument must not be a number'); return "undefined" != typeof ArrayBuffer && e instanceof ArrayBuffer ? h(t, e, n, r) : "string" == typeof e ? c(t, e, n) : d(t, e) } function s(t) { if ("number" != typeof t) throw new TypeError('"size" argument must be a number'); if (t < 0) throw new RangeError('"size" argument must not be negative') } function u(t, e, n, r) { return s(e), e <= 0 ? i(t, e) : void 0 !== n ? "string" == typeof r ? i(t, e).fill(n, r) : i(t, e).fill(n) : i(t, e) } function l(t, e) { if (s(e), t = i(t, e < 0 ? 0 : 0 | p(e)), !o.TYPED_ARRAY_SUPPORT) for (var n = 0; n < e; ++n)t[n] = 0; return t } function c(t, e, n) { if ("string" == typeof n && "" !== n || (n = "utf8"), !o.isEncoding(n)) throw new TypeError('"encoding" must be a valid string encoding'); var r = 0 | v(e, n); t = i(t, r); var a = t.write(e, n); return a !== r && (t = t.slice(0, a)), t } function f(t, e) { var n = e.length < 0 ? 0 : 0 | p(e.length); t = i(t, n); for (var r = 0; r < n; r += 1)t[r] = 255 & e[r]; return t } function h(t, e, n, r) { if (e.byteLength, n < 0 || e.byteLength < n) throw new RangeError("'offset' is out of bounds"); if (e.byteLength < n + (r || 0)) throw new RangeError("'length' is out of bounds"); return e = void 0 === n && void 0 === r ? new Uint8Array(e) : void 0 === r ? new Uint8Array(e, n) : new Uint8Array(e, n, r), o.TYPED_ARRAY_SUPPORT ? (t = e, t.__proto__ = o.prototype) : t = f(t, e), t } function d(t, e) { if (o.isBuffer(e)) { var n = 0 | p(e.length); return t = i(t, n), 0 === t.length ? t : (e.copy(t, 0, 0, n), t) } if (e) { if ("undefined" != typeof ArrayBuffer && e.buffer instanceof ArrayBuffer || "length" in e) return "number" != typeof e.length || X(e.length) ? i(t, 0) : f(t, e); if ("Buffer" === e.type && Q(e.data)) return f(t, e.data) } throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.") } function p(t) { if (t >= r()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + r().toString(16) + " bytes"); return 0 | t } function g(t) { return +t != t && (t = 0), o.alloc(+t) } function v(t, e) { if (o.isBuffer(t)) return t.length; if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t) || t instanceof ArrayBuffer)) return t.byteLength; "string" != typeof t && (t = "" + t); var n = t.length; if (0 === n) return 0; for (var r = !1; ;)switch (e) { case "ascii": case "latin1": case "binary": return n; case "utf8": case "utf-8": case void 0: return H(t).length; case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": return 2 * n; case "hex": return n >>> 1; case "base64": return Z(t).length; default: if (r) return H(t).length; e = ("" + e).toLowerCase(), r = !0 } } function y(t, e, n) { var r = !1; if ((void 0 === e || e < 0) && (e = 0), e > this.length) return ""; if ((void 0 === n || n > this.length) && (n = this.length), n <= 0) return ""; if (n >>>= 0, e >>>= 0, n <= e) return ""; for (t || (t = "utf8"); ;)switch (t) { case "hex": return B(this, e, n); case "utf8": case "utf-8": return E(this, e, n); case "ascii": return T(this, e, n); case "latin1": case "binary": return I(this, e, n); case "base64": return P(this, e, n); case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": return L(this, e, n); default: if (r) throw new TypeError("Unknown encoding: " + t); t = (t + "").toLowerCase(), r = !0 } } function b(t, e, n) { var r = t[e]; t[e] = t[n], t[n] = r } function m(t, e, n, r, i) { if (0 === t.length) return -1; if ("string" == typeof n ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), n = +n, isNaN(n) && (n = i ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) { if (i) return -1; n = t.length - 1 } else if (n < 0) { if (!i) return -1; n = 0 } if ("string" == typeof e && (e = o.from(e, r)), o.isBuffer(e)) return 0 === e.length ? -1 : w(t, e, n, r, i); if ("number" == typeof e) return e &= 255, o.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : w(t, [e], n, r, i); throw new TypeError("val must be string, number or Buffer") } function w(t, e, n, r, i) { function o(t, e) { return 1 === a ? t[e] : t.readUInt16BE(e * a) } var a = 1, s = t.length, u = e.length; if (void 0 !== r && ("ucs2" === (r = String(r).toLowerCase()) || "ucs-2" === r || "utf16le" === r || "utf-16le" === r)) { if (t.length < 2 || e.length < 2) return -1; a = 2, s /= 2, u /= 2, n /= 2 } var l; if (i) { var c = -1; for (l = n; l < s; l++)if (o(t, l) === o(e, -1 === c ? 0 : l - c)) { if (-1 === c && (c = l), l - c + 1 === u) return c * a } else -1 !== c && (l -= l - c), c = -1 } else for (n + u > s && (n = s - u), l = n; l >= 0; l--) { for (var f = !0, h = 0; h < u; h++)if (o(t, l + h) !== o(e, h)) { f = !1; break } if (f) return l } return -1 } function x(t, e, n, r) { n = Number(n) || 0; var i = t.length - n; r ? (r = Number(r)) > i && (r = i) : r = i; var o = e.length; if (o % 2 != 0) throw new TypeError("Invalid hex string"); r > o / 2 && (r = o / 2); for (var a = 0; a < r; ++a) { var s = parseInt(e.substr(2 * a, 2), 16); if (isNaN(s)) return a; t[n + a] = s } return a } function _(t, e, n, r) { return Y(H(e, t.length - n), t, n, r) } function k(t, e, n, r) { return Y(V(e), t, n, r) } function S(t, e, n, r) { return k(t, e, n, r) } function C(t, e, n, r) { return Y(Z(e), t, n, r) } function A(t, e, n, r) { return Y(q(e, t.length - n), t, n, r) } function P(t, e, n) { return 0 === e && n === t.length ? K.fromByteArray(t) : K.fromByteArray(t.slice(e, n)) } function E(t, e, n) { n = Math.min(t.length, n); for (var r = [], i = e; i < n;) { var o = t[i], a = null, s = o > 239 ? 4 : o > 223 ? 3 : o > 191 ? 2 : 1; if (i + s <= n) { var u, l, c, f; switch (s) { case 1: o < 128 && (a = o); break; case 2: u = t[i + 1], 128 == (192 & u) && (f = (31 & o) << 6 | 63 & u) > 127 && (a = f); break; case 3: u = t[i + 1], l = t[i + 2], 128 == (192 & u) && 128 == (192 & l) && (f = (15 & o) << 12 | (63 & u) << 6 | 63 & l) > 2047 && (f < 55296 || f > 57343) && (a = f); break; case 4: u = t[i + 1], l = t[i + 2], c = t[i + 3], 128 == (192 & u) && 128 == (192 & l) && 128 == (192 & c) && (f = (15 & o) << 18 | (63 & u) << 12 | (63 & l) << 6 | 63 & c) > 65535 && f < 1114112 && (a = f) } } null === a ? (a = 65533, s = 1) : a > 65535 && (a -= 65536, r.push(a >>> 10 & 1023 | 55296), a = 56320 | 1023 & a), r.push(a), i += s } return O(r) } function O(t) { var e = t.length; if (e <= $) return String.fromCharCode.apply(String, t); for (var n = "", r = 0; r < e;)n += String.fromCharCode.apply(String, t.slice(r, r += $)); return n } function T(t, e, n) { var r = ""; n = Math.min(t.length, n); for (var i = e; i < n; ++i)r += String.fromCharCode(127 & t[i]); return r } function I(t, e, n) { var r = ""; n = Math.min(t.length, n); for (var i = e; i < n; ++i)r += String.fromCharCode(t[i]); return r } function B(t, e, n) { var r = t.length; (!e || e < 0) && (e = 0), (!n || n < 0 || n > r) && (n = r); for (var i = "", o = e; o < n; ++o)i += G(t[o]); return i } function L(t, e, n) { for (var r = t.slice(e, n), i = "", o = 0; o < r.length; o += 2)i += String.fromCharCode(r[o] + 256 * r[o + 1]); return i } function R(t, e, n) { if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint"); if (t + e > n) throw new RangeError("Trying to access beyond buffer length") } function M(t, e, n, r, i, a) { if (!o.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance'); if (e > i || e < a) throw new RangeError('"value" argument is out of bounds'); if (n + r > t.length) throw new RangeError("Index out of range") } function F(t, e, n, r) { e < 0 && (e = 65535 + e + 1); for (var i = 0, o = Math.min(t.length - n, 2); i < o; ++i)t[n + i] = (e & 255 << 8 * (r ? i : 1 - i)) >>> 8 * (r ? i : 1 - i) } function D(t, e, n, r) { e < 0 && (e = 4294967295 + e + 1); for (var i = 0, o = Math.min(t.length - n, 4); i < o; ++i)t[n + i] = e >>> 8 * (r ? i : 3 - i) & 255 } function z(t, e, n, r, i, o) { if (n + r > t.length) throw new RangeError("Index out of range"); if (n < 0) throw new RangeError("Index out of range") } function N(t, e, n, r, i) { return i || z(t, e, n, 4, 3.4028234663852886e38, -3.4028234663852886e38), J.write(t, e, n, r, 23, 4), n + 4 } function W(t, e, n, r, i) { return i || z(t, e, n, 8, 1.7976931348623157e308, -1.7976931348623157e308), J.write(t, e, n, r, 52, 8), n + 8 } function U(t) { if (t = j(t).replace(tt, ""), t.length < 2) return ""; for (; t.length % 4 != 0;)t += "="; return t } function j(t) { return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "") } function G(t) { return t < 16 ? "0" + t.toString(16) : t.toString(16) } function H(t, e) { e = e || 1 / 0; for (var n, r = t.length, i = null, o = [], a = 0; a < r; ++a) { if ((n = t.charCodeAt(a)) > 55295 && n < 57344) { if (!i) { if (n > 56319) { (e -= 3) > -1 && o.push(239, 191, 189); continue } if (a + 1 === r) { (e -= 3) > -1 && o.push(239, 191, 189); continue } i = n; continue } if (n < 56320) { (e -= 3) > -1 && o.push(239, 191, 189), i = n; continue } n = 65536 + (i - 55296 << 10 | n - 56320) } else i && (e -= 3) > -1 && o.push(239, 191, 189); if (i = null, n < 128) { if ((e -= 1) < 0) break; o.push(n) } else if (n < 2048) { if ((e -= 2) < 0) break; o.push(n >> 6 | 192, 63 & n | 128) } else if (n < 65536) { if ((e -= 3) < 0) break; o.push(n >> 12 | 224, n >> 6 & 63 | 128, 63 & n | 128) } else { if (!(n < 1114112)) throw new Error("Invalid code point"); if ((e -= 4) < 0) break; o.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, 63 & n | 128) } } return o } function V(t) { for (var e = [], n = 0; n < t.length; ++n)e.push(255 & t.charCodeAt(n)); return e } function q(t, e) { for (var n, r, i, o = [], a = 0; a < t.length && !((e -= 2) < 0); ++a)n = t.charCodeAt(a), r = n >> 8, i = n % 256, o.push(i), o.push(r); return o } function Z(t) { return K.toByteArray(U(t)) } function Y(t, e, n, r) { for (var i = 0; i < r && !(i + n >= e.length || i >= t.length); ++i)e[i + n] = t[i]; return i } function X(t) { return t !== t }/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
            var K = n(207), J = n(208), Q = n(136); e.Buffer = o, e.SlowBuffer = g, e.INSPECT_MAX_BYTES = 50, o.TYPED_ARRAY_SUPPORT = void 0 !== t.TYPED_ARRAY_SUPPORT ? t.TYPED_ARRAY_SUPPORT : function () { try { var t = new Uint8Array(1); return t.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }, 42 === t.foo() && "function" == typeof t.subarray && 0 === t.subarray(1, 1).byteLength } catch (t) { return !1 } }(), e.kMaxLength = r(), o.poolSize = 8192, o._augment = function (t) { return t.__proto__ = o.prototype, t }, o.from = function (t, e, n) { return a(null, t, e, n) }, o.TYPED_ARRAY_SUPPORT && (o.prototype.__proto__ = Uint8Array.prototype, o.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && o[Symbol.species] === o && Object.defineProperty(o, Symbol.species, { value: null, configurable: !0 })), o.alloc = function (t, e, n) { return u(null, t, e, n) }, o.allocUnsafe = function (t) { return l(null, t) }, o.allocUnsafeSlow = function (t) { return l(null, t) }, o.isBuffer = function (t) { return !(null == t || !t._isBuffer) }, o.compare = function (t, e) { if (!o.isBuffer(t) || !o.isBuffer(e)) throw new TypeError("Arguments must be Buffers"); if (t === e) return 0; for (var n = t.length, r = e.length, i = 0, a = Math.min(n, r); i < a; ++i)if (t[i] !== e[i]) { n = t[i], r = e[i]; break } return n < r ? -1 : r < n ? 1 : 0 }, o.isEncoding = function (t) { switch (String(t).toLowerCase()) { case "hex": case "utf8": case "utf-8": case "ascii": case "latin1": case "binary": case "base64": case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": return !0; default: return !1 } }, o.concat = function (t, e) { if (!Q(t)) throw new TypeError('"list" argument must be an Array of Buffers'); if (0 === t.length) return o.alloc(0); var n; if (void 0 === e) for (e = 0, n = 0; n < t.length; ++n)e += t[n].length; var r = o.allocUnsafe(e), i = 0; for (n = 0; n < t.length; ++n) { var a = t[n]; if (!o.isBuffer(a)) throw new TypeError('"list" argument must be an Array of Buffers'); a.copy(r, i), i += a.length } return r }, o.byteLength = v, o.prototype._isBuffer = !0, o.prototype.swap16 = function () { var t = this.length; if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits"); for (var e = 0; e < t; e += 2)b(this, e, e + 1); return this }, o.prototype.swap32 = function () { var t = this.length; if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits"); for (var e = 0; e < t; e += 4)b(this, e, e + 3), b(this, e + 1, e + 2); return this }, o.prototype.swap64 = function () { var t = this.length; if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits"); for (var e = 0; e < t; e += 8)b(this, e, e + 7), b(this, e + 1, e + 6), b(this, e + 2, e + 5), b(this, e + 3, e + 4); return this }, o.prototype.toString = function () { var t = 0 | this.length; return 0 === t ? "" : 0 === arguments.length ? E(this, 0, t) : y.apply(this, arguments) }, o.prototype.equals = function (t) { if (!o.isBuffer(t)) throw new TypeError("Argument must be a Buffer"); return this === t || 0 === o.compare(this, t) }, o.prototype.inspect = function () { var t = "", n = e.INSPECT_MAX_BYTES; return this.length > 0 && (t = this.toString("hex", 0, n).match(/.{2}/g).join(" "), this.length > n && (t += " ... ")), "<Buffer " + t + ">" }, o.prototype.compare = function (t, e, n, r, i) { if (!o.isBuffer(t)) throw new TypeError("Argument must be a Buffer"); if (void 0 === e && (e = 0), void 0 === n && (n = t ? t.length : 0), void 0 === r && (r = 0), void 0 === i && (i = this.length), e < 0 || n > t.length || r < 0 || i > this.length) throw new RangeError("out of range index"); if (r >= i && e >= n) return 0; if (r >= i) return -1; if (e >= n) return 1; if (e >>>= 0, n >>>= 0, r >>>= 0, i >>>= 0, this === t) return 0; for (var a = i - r, s = n - e, u = Math.min(a, s), l = this.slice(r, i), c = t.slice(e, n), f = 0; f < u; ++f)if (l[f] !== c[f]) { a = l[f], s = c[f]; break } return a < s ? -1 : s < a ? 1 : 0 }, o.prototype.includes = function (t, e, n) { return -1 !== this.indexOf(t, e, n) }, o.prototype.indexOf = function (t, e, n) { return m(this, t, e, n, !0) }, o.prototype.lastIndexOf = function (t, e, n) { return m(this, t, e, n, !1) }, o.prototype.write = function (t, e, n, r) { if (void 0 === e) r = "utf8", n = this.length, e = 0; else if (void 0 === n && "string" == typeof e) r = e, n = this.length, e = 0; else { if (!isFinite(e)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported"); e |= 0, isFinite(n) ? (n |= 0, void 0 === r && (r = "utf8")) : (r = n, n = void 0) } var i = this.length - e; if ((void 0 === n || n > i) && (n = i), t.length > 0 && (n < 0 || e < 0) || e > this.length) throw new RangeError("Attempt to write outside buffer bounds"); r || (r = "utf8"); for (var o = !1; ;)switch (r) { case "hex": return x(this, t, e, n); case "utf8": case "utf-8": return _(this, t, e, n); case "ascii": return k(this, t, e, n); case "latin1": case "binary": return S(this, t, e, n); case "base64": return C(this, t, e, n); case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": return A(this, t, e, n); default: if (o) throw new TypeError("Unknown encoding: " + r); r = ("" + r).toLowerCase(), o = !0 } }, o.prototype.toJSON = function () { return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) } }; var $ = 4096; o.prototype.slice = function (t, e) { var n = this.length; t = ~~t, e = void 0 === e ? n : ~~e, t < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), e < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), e < t && (e = t); var r; if (o.TYPED_ARRAY_SUPPORT) r = this.subarray(t, e), r.__proto__ = o.prototype; else { var i = e - t; r = new o(i, void 0); for (var a = 0; a < i; ++a)r[a] = this[a + t] } return r }, o.prototype.readUIntLE = function (t, e, n) { t |= 0, e |= 0, n || R(t, e, this.length); for (var r = this[t], i = 1, o = 0; ++o < e && (i *= 256);)r += this[t + o] * i; return r }, o.prototype.readUIntBE = function (t, e, n) { t |= 0, e |= 0, n || R(t, e, this.length); for (var r = this[t + --e], i = 1; e > 0 && (i *= 256);)r += this[t + --e] * i; return r }, o.prototype.readUInt8 = function (t, e) { return e || R(t, 1, this.length), this[t] }, o.prototype.readUInt16LE = function (t, e) { return e || R(t, 2, this.length), this[t] | this[t + 1] << 8 }, o.prototype.readUInt16BE = function (t, e) { return e || R(t, 2, this.length), this[t] << 8 | this[t + 1] }, o.prototype.readUInt32LE = function (t, e) { return e || R(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3] }, o.prototype.readUInt32BE = function (t, e) { return e || R(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]) }, o.prototype.readIntLE = function (t, e, n) { t |= 0, e |= 0, n || R(t, e, this.length); for (var r = this[t], i = 1, o = 0; ++o < e && (i *= 256);)r += this[t + o] * i; return i *= 128, r >= i && (r -= Math.pow(2, 8 * e)), r }, o.prototype.readIntBE = function (t, e, n) { t |= 0, e |= 0, n || R(t, e, this.length); for (var r = e, i = 1, o = this[t + --r]; r > 0 && (i *= 256);)o += this[t + --r] * i; return i *= 128, o >= i && (o -= Math.pow(2, 8 * e)), o }, o.prototype.readInt8 = function (t, e) { return e || R(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t] }, o.prototype.readInt16LE = function (t, e) { e || R(t, 2, this.length); var n = this[t] | this[t + 1] << 8; return 32768 & n ? 4294901760 | n : n }, o.prototype.readInt16BE = function (t, e) { e || R(t, 2, this.length); var n = this[t + 1] | this[t] << 8; return 32768 & n ? 4294901760 | n : n }, o.prototype.readInt32LE = function (t, e) { return e || R(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24 }, o.prototype.readInt32BE = function (t, e) { return e || R(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3] }, o.prototype.readFloatLE = function (t, e) { return e || R(t, 4, this.length), J.read(this, t, !0, 23, 4) }, o.prototype.readFloatBE = function (t, e) { return e || R(t, 4, this.length), J.read(this, t, !1, 23, 4) }, o.prototype.readDoubleLE = function (t, e) { return e || R(t, 8, this.length), J.read(this, t, !0, 52, 8) }, o.prototype.readDoubleBE = function (t, e) { return e || R(t, 8, this.length), J.read(this, t, !1, 52, 8) }, o.prototype.writeUIntLE = function (t, e, n, r) { if (t = +t, e |= 0, n |= 0, !r) { M(this, t, e, n, Math.pow(2, 8 * n) - 1, 0) } var i = 1, o = 0; for (this[e] = 255 & t; ++o < n && (i *= 256);)this[e + o] = t / i & 255; return e + n }, o.prototype.writeUIntBE = function (t, e, n, r) { if (t = +t, e |= 0, n |= 0, !r) { M(this, t, e, n, Math.pow(2, 8 * n) - 1, 0) } var i = n - 1, o = 1; for (this[e + i] = 255 & t; --i >= 0 && (o *= 256);)this[e + i] = t / o & 255; return e + n }, o.prototype.writeUInt8 = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 1, 255, 0), o.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), this[e] = 255 & t, e + 1 }, o.prototype.writeUInt16LE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[e] = 255 & t, this[e + 1] = t >>> 8) : F(this, t, e, !0), e + 2 }, o.prototype.writeUInt16BE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[e] = t >>> 8, this[e + 1] = 255 & t) : F(this, t, e, !1), e + 2 }, o.prototype.writeUInt32LE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[e + 3] = t >>> 24, this[e + 2] = t >>> 16, this[e + 1] = t >>> 8, this[e] = 255 & t) : D(this, t, e, !0), e + 4 }, o.prototype.writeUInt32BE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[e] = t >>> 24, this[e + 1] = t >>> 16, this[e + 2] = t >>> 8, this[e + 3] = 255 & t) : D(this, t, e, !1), e + 4 }, o.prototype.writeIntLE = function (t, e, n, r) { if (t = +t, e |= 0, !r) { var i = Math.pow(2, 8 * n - 1); M(this, t, e, n, i - 1, -i) } var o = 0, a = 1, s = 0; for (this[e] = 255 & t; ++o < n && (a *= 256);)t < 0 && 0 === s && 0 !== this[e + o - 1] && (s = 1), this[e + o] = (t / a >> 0) - s & 255; return e + n }, o.prototype.writeIntBE = function (t, e, n, r) { if (t = +t, e |= 0, !r) { var i = Math.pow(2, 8 * n - 1); M(this, t, e, n, i - 1, -i) } var o = n - 1, a = 1, s = 0; for (this[e + o] = 255 & t; --o >= 0 && (a *= 256);)t < 0 && 0 === s && 0 !== this[e + o + 1] && (s = 1), this[e + o] = (t / a >> 0) - s & 255; return e + n }, o.prototype.writeInt8 = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 1, 127, -128), o.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), t < 0 && (t = 255 + t + 1), this[e] = 255 & t, e + 1 }, o.prototype.writeInt16LE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[e] = 255 & t, this[e + 1] = t >>> 8) : F(this, t, e, !0), e + 2 }, o.prototype.writeInt16BE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[e] = t >>> 8, this[e + 1] = 255 & t) : F(this, t, e, !1), e + 2 }, o.prototype.writeInt32LE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 4, 2147483647, -2147483648), o.TYPED_ARRAY_SUPPORT ? (this[e] = 255 & t, this[e + 1] = t >>> 8, this[e + 2] = t >>> 16, this[e + 3] = t >>> 24) : D(this, t, e, !0), e + 4 }, o.prototype.writeInt32BE = function (t, e, n) { return t = +t, e |= 0, n || M(this, t, e, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), o.TYPED_ARRAY_SUPPORT ? (this[e] = t >>> 24, this[e + 1] = t >>> 16, this[e + 2] = t >>> 8, this[e + 3] = 255 & t) : D(this, t, e, !1), e + 4 }, o.prototype.writeFloatLE = function (t, e, n) { return N(this, t, e, !0, n) }, o.prototype.writeFloatBE = function (t, e, n) { return N(this, t, e, !1, n) }, o.prototype.writeDoubleLE = function (t, e, n) { return W(this, t, e, !0, n) }, o.prototype.writeDoubleBE = function (t, e, n) { return W(this, t, e, !1, n) }, o.prototype.copy = function (t, e, n, r) { if (n || (n = 0), r || 0 === r || (r = this.length), e >= t.length && (e = t.length), e || (e = 0), r > 0 && r < n && (r = n), r === n) return 0; if (0 === t.length || 0 === this.length) return 0; if (e < 0) throw new RangeError("targetStart out of bounds"); if (n < 0 || n >= this.length) throw new RangeError("sourceStart out of bounds"); if (r < 0) throw new RangeError("sourceEnd out of bounds"); r > this.length && (r = this.length), t.length - e < r - n && (r = t.length - e + n); var i, a = r - n; if (this === t && n < e && e < r) for (i = a - 1; i >= 0; --i)t[i + e] = this[i + n]; else if (a < 1e3 || !o.TYPED_ARRAY_SUPPORT) for (i = 0; i < a; ++i)t[i + e] = this[i + n]; else Uint8Array.prototype.set.call(t, this.subarray(n, n + a), e); return a }, o.prototype.fill = function (t, e, n, r) { if ("string" == typeof t) { if ("string" == typeof e ? (r = e, e = 0, n = this.length) : "string" == typeof n && (r = n, n = this.length), 1 === t.length) { var i = t.charCodeAt(0); i < 256 && (t = i) } if (void 0 !== r && "string" != typeof r) throw new TypeError("encoding must be a string"); if ("string" == typeof r && !o.isEncoding(r)) throw new TypeError("Unknown encoding: " + r) } else "number" == typeof t && (t &= 255); if (e < 0 || this.length < e || this.length < n) throw new RangeError("Out of range index"); if (n <= e) return this; e >>>= 0, n = void 0 === n ? this.length : n >>> 0, t || (t = 0); var a; if ("number" == typeof t) for (a = e; a < n; ++a)this[a] = t; else { var s = o.isBuffer(t) ? t : H(new o(t, r).toString()), u = s.length; for (a = 0; a < n - e; ++a)this[a + e] = s[a % u] } return this }; var tt = /[^+\/0-9A-Za-z-_]/g
        }).call(e, n(22))
    }, function (t, e, n) { var r = n(61)("wks"), i = n(29), o = n(8).Symbol, a = "function" == typeof o; (t.exports = function (t) { return r[t] || (r[t] = a && o[t] || (a ? o : i)("Symbol." + t)) }).store = r }, function (t, e, n) { !function (r, i, o) { t.exports = e = i(n(1), n(34)) }(0, function (t) { t.lib.Cipher || function (e) { var n = t, r = n.lib, i = r.Base, o = r.WordArray, a = r.BufferedBlockAlgorithm, s = n.enc, u = (s.Utf8, s.Base64), l = n.algo, c = l.EvpKDF, f = r.Cipher = a.extend({ cfg: i.extend(), createEncryptor: function (t, e) { return this.create(this._ENC_XFORM_MODE, t, e) }, createDecryptor: function (t, e) { return this.create(this._DEC_XFORM_MODE, t, e) }, init: function (t, e, n) { this.cfg = this.cfg.extend(n), this._xformMode = t, this._key = e, this.reset() }, reset: function () { a.reset.call(this), this._doReset() }, process: function (t) { return this._append(t), this._process() }, finalize: function (t) { return t && this._append(t), this._doFinalize() }, keySize: 4, ivSize: 4, _ENC_XFORM_MODE: 1, _DEC_XFORM_MODE: 2, _createHelper: function () { function t(t) { return "string" == typeof t ? k : w } return function (e) { return { encrypt: function (n, r, i) { return t(r).encrypt(e, n, r, i) }, decrypt: function (n, r, i) { return t(r).decrypt(e, n, r, i) } } } }() }), h = (r.StreamCipher = f.extend({ _doFinalize: function () { return this._process(!0) }, blockSize: 1 }), n.mode = {}), d = r.BlockCipherMode = i.extend({ createEncryptor: function (t, e) { return this.Encryptor.create(t, e) }, createDecryptor: function (t, e) { return this.Decryptor.create(t, e) }, init: function (t, e) { this._cipher = t, this._iv = e } }), p = h.CBC = function () { function t(t, n, r) { var i = this._iv; if (i) { var o = i; this._iv = e } else var o = this._prevBlock; for (var a = 0; a < r; a++)t[n + a] ^= o[a] } var n = d.extend(); return n.Encryptor = n.extend({ processBlock: function (e, n) { var r = this._cipher, i = r.blockSize; t.call(this, e, n, i), r.encryptBlock(e, n), this._prevBlock = e.slice(n, n + i) } }), n.Decryptor = n.extend({ processBlock: function (e, n) { var r = this._cipher, i = r.blockSize, o = e.slice(n, n + i); r.decryptBlock(e, n), t.call(this, e, n, i), this._prevBlock = o } }), n }(), g = n.pad = {}, v = g.Pkcs7 = { pad: function (t, e) { for (var n = 4 * e, r = n - t.sigBytes % n, i = r << 24 | r << 16 | r << 8 | r, a = [], s = 0; s < r; s += 4)a.push(i); var u = o.create(a, r); t.concat(u) }, unpad: function (t) { var e = 255 & t.words[t.sigBytes - 1 >>> 2]; t.sigBytes -= e } }, y = (r.BlockCipher = f.extend({ cfg: f.cfg.extend({ mode: p, padding: v }), reset: function () { f.reset.call(this); var t = this.cfg, e = t.iv, n = t.mode; if (this._xformMode == this._ENC_XFORM_MODE) var r = n.createEncryptor; else { var r = n.createDecryptor; this._minBufferSize = 1 } this._mode && this._mode.__creator == r ? this._mode.init(this, e && e.words) : (this._mode = r.call(n, this, e && e.words), this._mode.__creator = r) }, _doProcessBlock: function (t, e) { this._mode.processBlock(t, e) }, _doFinalize: function () { var t = this.cfg.padding; if (this._xformMode == this._ENC_XFORM_MODE) { t.pad(this._data, this.blockSize); var e = this._process(!0) } else { var e = this._process(!0); t.unpad(e) } return e }, blockSize: 4 }), r.CipherParams = i.extend({ init: function (t) { this.mixIn(t) }, toString: function (t) { return (t || this.formatter).stringify(this) } })), b = n.format = {}, m = b.OpenSSL = { stringify: function (t) { var e = t.ciphertext, n = t.salt; if (n) var r = o.create([1398893684, 1701076831]).concat(n).concat(e); else var r = e; return r.toString(u) }, parse: function (t) { var e = u.parse(t), n = e.words; if (1398893684 == n[0] && 1701076831 == n[1]) { var r = o.create(n.slice(2, 4)); n.splice(0, 4), e.sigBytes -= 16 } return y.create({ ciphertext: e, salt: r }) } }, w = r.SerializableCipher = i.extend({ cfg: i.extend({ format: m }), encrypt: function (t, e, n, r) { r = this.cfg.extend(r); var i = t.createEncryptor(n, r), o = i.finalize(e), a = i.cfg; return y.create({ ciphertext: o, key: n, iv: a.iv, algorithm: t, mode: a.mode, padding: a.padding, blockSize: t.blockSize, formatter: r.format }) }, decrypt: function (t, e, n, r) { return r = this.cfg.extend(r), e = this._parse(e, r.format), t.createDecryptor(n, r).finalize(e.ciphertext) }, _parse: function (t, e) { return "string" == typeof t ? e.parse(t, this) : t } }), x = n.kdf = {}, _ = x.OpenSSL = { execute: function (t, e, n, r) { r || (r = o.random(8)); var i = c.create({ keySize: e + n }).compute(t, r), a = o.create(i.words.slice(e), 4 * n); return i.sigBytes = 4 * e, y.create({ key: i, iv: a, salt: r }) } }, k = r.PasswordBasedCipher = w.extend({ cfg: w.cfg.extend({ kdf: _ }), encrypt: function (t, e, n, r) { r = this.cfg.extend(r); var i = r.kdf.execute(n, t.keySize, t.ivSize); r.iv = i.iv; var o = w.encrypt.call(this, t, e, i.key, r); return o.mixIn(i), o }, decrypt: function (t, e, n, r) { r = this.cfg.extend(r), e = this._parse(e, r.format); var i = r.kdf.execute(n, t.keySize, t.ivSize, e.salt); return r.iv = i.iv, w.decrypt.call(this, t, e, i.key, r) } }) }() }) }, function (t, e, n) { var r = n(20), i = n(2), o = n(38), a = n(27), s = n(36), u = function (t, e, n) { var l, c, f, h = t & u.F, d = t & u.G, p = t & u.S, g = t & u.P, v = t & u.B, y = t & u.W, b = d ? i : i[e] || (i[e] = {}), m = b.prototype, w = d ? r : p ? r[e] : (r[e] || {}).prototype; d && (n = e); for (l in n) (c = !h && w && void 0 !== w[l]) && s(b, l) || (f = c ? w[l] : n[l], b[l] = d && "function" != typeof w[l] ? n[l] : v && c ? o(f, r) : y && w[l] == f ? function (t) { var e = function (e, n, r) { if (this instanceof t) { switch (arguments.length) { case 0: return new t; case 1: return new t(e); case 2: return new t(e, n) }return new t(e, n, r) } return t.apply(this, arguments) }; return e.prototype = t.prototype, e }(f) : g && "function" == typeof f ? o(Function.call, f) : f, g && ((b.virtual || (b.virtual = {}))[l] = f, t & u.R && m && !m[l] && a(m, l, f))) }; u.F = 1, u.G = 2, u.S = 4, u.P = 8, u.B = 16, u.W = 32, u.U = 64, u.R = 128, t.exports = u }, function (t, e, n) { var r = n(8), i = n(51), o = n(16), a = n(23), s = n(30), u = function (t, e, n) { var l, c, f, h, d = t & u.F, p = t & u.G, g = t & u.S, v = t & u.P, y = t & u.B, b = p ? r : g ? r[e] || (r[e] = {}) : (r[e] || {}).prototype, m = p ? i : i[e] || (i[e] = {}), w = m.prototype || (m.prototype = {}); p && (n = e); for (l in n) c = !d && b && void 0 !== b[l], f = (c ? b : n)[l], h = y && c ? s(f, r) : v && "function" == typeof f ? s(Function.call, f) : f, b && a(b, l, f, t & u.U), m[l] != f && o(m, l, h), v && w[l] != f && (w[l] = f) }; r.core = i, u.F = 1, u.G = 2, u.S = 4, u.P = 8, u.B = 16, u.W = 32, u.U = 64, u.R = 128, t.exports = u }, function (t, e) { var n = t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")(); "number" == typeof __g && (__g = n) }, function (t, e, n) { var r = n(10), i = n(137), o = n(60), a = Object.defineProperty; e.f = n(11) ? Object.defineProperty : function (t, e, n) { if (r(t), e = o(e, !0), r(n), i) try { return a(t, e, n) } catch (t) { } if ("get" in n || "set" in n) throw TypeError("Accessors not supported!"); return "value" in n && (t[e] = n.value), t } }, function (t, e, n) { var r = n(13); t.exports = function (t) { if (!r(t)) throw TypeError(t + " is not an object!"); return t } }, function (t, e, n) { t.exports = !n(14)(function () { return 7 != Object.defineProperty({}, "a", { get: function () { return 7 } }).a }) }, function (t, e, n) { var r = n(122)("wks"), i = n(77), o = n(20).Symbol, a = "function" == typeof o; (t.exports = function (t) { return r[t] || (r[t] = a && o[t] || (a ? o : i)("Symbol." + t)) }).store = r }, function (t, e) { t.exports = function (t) { return "object" == typeof t ? null !== t : "function" == typeof t } }, function (t, e) { t.exports = function (t) { try { return !!t() } catch (t) { return !0 } } }, function (t, e, n) { var r = n(31), i = Math.min; t.exports = function (t) { return t > 0 ? i(r(t), 9007199254740991) : 0 } }, function (t, e, n) { var r = n(9), i = n(39); t.exports = n(11) ? function (t, e, n) { return r.f(t, e, i(1, n)) } : function (t, e, n) { return t[e] = n, t } }, function (t, e, n) { t.exports = !n(37)(function () { return 7 != Object.defineProperty({}, "a", { get: function () { return 7 } }).a }) }, function (t, e, n) { var r = n(28), i = n(173), o = n(116), a = Object.defineProperty; e.f = n(17) ? Object.defineProperty : function (t, e, n) { if (r(t), e = o(e, !0), r(n), i) try { return a(t, e, n) } catch (t) { } if ("get" in n || "set" in n) throw TypeError("Accessors not supported!"); return "value" in n && (t[e] = n.value), t } }, function (t, e) { t.exports = function (t) { return "object" == typeof t ? null !== t : "function" == typeof t } }, function (t, e) { var n = t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")(); "number" == typeof __g && (__g = n) }, function (t, e) { function n() { throw new Error("setTimeout has not been defined") } function r() { throw new Error("clearTimeout has not been defined") } function i(t) { if (c === setTimeout) return setTimeout(t, 0); if ((c === n || !c) && setTimeout) return c = setTimeout, setTimeout(t, 0); try { return c(t, 0) } catch (e) { try { return c.call(null, t, 0) } catch (e) { return c.call(this, t, 0) } } } function o(t) { if (f === clearTimeout) return clearTimeout(t); if ((f === r || !f) && clearTimeout) return f = clearTimeout, clearTimeout(t); try { return f(t) } catch (e) { try { return f.call(null, t) } catch (e) { return f.call(this, t) } } } function a() { g && d && (g = !1, d.length ? p = d.concat(p) : v = -1, p.length && s()) } function s() { if (!g) { var t = i(a); g = !0; for (var e = p.length; e;) { for (d = p, p = []; ++v < e;)d && d[v].run(); v = -1, e = p.length } d = null, g = !1, o(t) } } function u(t, e) { this.fun = t, this.array = e } function l() { } var c, f, h = t.exports = {}; !function () { try { c = "function" == typeof setTimeout ? setTimeout : n } catch (t) { c = n } try { f = "function" == typeof clearTimeout ? clearTimeout : r } catch (t) { f = r } }(); var d, p = [], g = !1, v = -1; h.nextTick = function (t) { var e = new Array(arguments.length - 1); if (arguments.length > 1) for (var n = 1; n < arguments.length; n++)e[n - 1] = arguments[n]; p.push(new u(t, e)), 1 !== p.length || g || i(s) }, u.prototype.run = function () { this.fun.apply(null, this.array) }, h.title = "browser", h.browser = !0, h.env = {}, h.argv = [], h.version = "", h.versions = {}, h.on = l, h.addListener = l, h.once = l, h.off = l, h.removeListener = l, h.removeAllListeners = l, h.emit = l, h.prependListener = l, h.prependOnceListener = l, h.listeners = function (t) { return [] }, h.binding = function (t) { throw new Error("process.binding is not supported") }, h.cwd = function () { return "/" }, h.chdir = function (t) { throw new Error("process.chdir is not supported") }, h.umask = function () { return 0 } }, function (t, e) { var n; n = function () { return this }(); try { n = n || Function("return this")() || (0, eval)("this") } catch (t) { "object" == typeof window && (n = window) } t.exports = n }, function (t, e, n) { var r = n(8), i = n(16), o = n(24), a = n(29)("src"), s = n(213), u = ("" + s).split("toString"); n(51).inspectSource = function (t) { return s.call(t) }, (t.exports = function (t, e, n, s) { var l = "function" == typeof n; l && (o(n, "name") || i(n, "name", e)), t[e] !== n && (l && (o(n, a) || i(n, a, t[e] ? "" + t[e] : u.join(String(e)))), t === r ? t[e] = n : s ? t[e] ? t[e] = n : i(t, e, n) : (delete t[e], i(t, e, n))) })(Function.prototype, "toString", function () { return "function" == typeof this && this[a] || s.call(this) }) }, function (t, e) { var n = {}.hasOwnProperty; t.exports = function (t, e) { return n.call(t, e) } }, function (t, e, n) { var r = n(42); t.exports = function (t) { return Object(r(t)) } }, function (t, e, n) { (function () { var t, r; t = n(48).Number, e.resolveLength = function (e, n, r) { var i; if ("number" == typeof e ? i = e : "function" == typeof e ? i = e.call(r, r) : r && "string" == typeof e ? i = r[e] : n && e instanceof t && (i = e.decode(n)), isNaN(i)) throw new Error("Not a fixed size"); return i }, r = function () { function t(t) { var e, n; null == t && (t = {}), this.enumerable = !0, this.configurable = !0; for (e in t) n = t[e], this[e] = n } return t }(), e.PropertyDescriptor = r }).call(this) }, function (t, e, n) { var r = n(18), i = n(56); t.exports = n(17) ? function (t, e, n) { return r.f(t, e, i(1, n)) } : function (t, e, n) { return t[e] = n, t } }, function (t, e, n) { var r = n(19); t.exports = function (t) { if (!r(t)) throw TypeError(t + " is not an object!"); return t } }, function (t, e) { var n = 0, r = Math.random(); t.exports = function (t) { return "Symbol(".concat(void 0 === t ? "" : t, ")_", (++n + r).toString(36)) } }, function (t, e, n) { var r = n(139); t.exports = function (t, e, n) { if (r(t), void 0 === e) return t; switch (n) { case 1: return function (n) { return t.call(e, n) }; case 2: return function (n, r) { return t.call(e, n, r) }; case 3: return function (n, r, i) { return t.call(e, n, r, i) } }return function () { return t.apply(e, arguments) } } }, function (t, e) { var n = Math.ceil, r = Math.floor; t.exports = function (t) { return isNaN(t = +t) ? 0 : (t > 0 ? r : n)(t) } }, function (t, e) { "function" == typeof Object.create ? t.exports = function (t, e) { t.super_ = e, t.prototype = Object.create(e.prototype, { constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 } }) } : t.exports = function (t, e) { t.super_ = e; var n = function () { }; n.prototype = e.prototype, t.prototype = new n, t.prototype.constructor = t } }, function (t, e, n) { "use strict"; function r(t) { if (!(this instanceof r)) return new r(t); l.call(this, t), c.call(this, t), t && !1 === t.readable && (this.readable = !1), t && !1 === t.writable && (this.writable = !1), this.allowHalfOpen = !0, t && !1 === t.allowHalfOpen && (this.allowHalfOpen = !1), this.once("end", i) } function i() { this.allowHalfOpen || this._writableState.ended || a.nextTick(o, this) } function o(t) { t.end() } var a = n(69), s = Object.keys || function (t) { var e = []; for (var n in t) e.push(n); return e }; t.exports = r; var u = n(55); u.inherits = n(32); var l = n(158), c = n(104); u.inherits(r, l); for (var f = s(c.prototype), h = 0; h < f.length; h++) { var d = f[h]; r.prototype[d] || (r.prototype[d] = c.prototype[d]) } Object.defineProperty(r.prototype, "writableHighWaterMark", { enumerable: !1, get: function () { return this._writableState.highWaterMark } }), Object.defineProperty(r.prototype, "destroyed", { get: function () { return void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed && this._writableState.destroyed) }, set: function (t) { void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed = t, this._writableState.destroyed = t) } }), r.prototype._destroy = function (t, e) { this.push(null), this.end(), a.nextTick(e, t) } }, function (t, e, n) { !function (r, i, o) { t.exports = e = i(n(1), n(107), n(108)) }(0, function (t) { return function () { var e = t, n = e.lib, r = n.Base, i = n.WordArray, o = e.algo, a = o.MD5, s = o.EvpKDF = r.extend({ cfg: r.extend({ keySize: 4, hasher: a, iterations: 1 }), init: function (t) { this.cfg = this.cfg.extend(t) }, compute: function (t, e) { for (var n = this.cfg, r = n.hasher.create(), o = i.create(), a = o.words, s = n.keySize, u = n.iterations; a.length < s;) { l && r.update(l); var l = r.update(t).finalize(e); r.reset(); for (var c = 1; c < u; c++)l = r.finalize(l), r.reset(); o.concat(l) } return o.sigBytes = 4 * s, o } }); e.EvpKDF = function (t, e, n) { return s.create(n).compute(t, e) } }(), t.EvpKDF }) }, function (t, e, n) { var r = n(112), i = n(114); t.exports = function (t) { return r(i(t)) } }, function (t, e) { var n = {}.hasOwnProperty; t.exports = function (t, e) { return n.call(t, e) } }, function (t, e) { t.exports = function (t) { try { return !!t() } catch (t) { return !0 } } }, function (t, e, n) { var r = n(175); t.exports = function (t, e, n) { if (r(t), void 0 === e) return t; switch (n) { case 1: return function (n) { return t.call(e, n) }; case 2: return function (n, r) { return t.call(e, n, r) }; case 3: return function (n, r, i) { return t.call(e, n, r, i) } }return function () { return t.apply(e, arguments) } } }, function (t, e) { t.exports = function (t, e) { return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e } } }, function (t, e) { t.exports = !1 }, function (t, e, n) { var r = n(81), i = n(42); t.exports = function (t) { return r(i(t)) } }, function (t, e) { t.exports = function (t) { if (void 0 == t) throw TypeError("Can't call method on  " + t); return t } }, function (t, e) { t.exports = {} }, function (t, e, n) { !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) { return function () { function e(t, e, n) { for (var r = [], o = 0, a = 0; a < e; a++)if (a % 4) { var s = n[t.charCodeAt(a - 1)] << a % 4 * 2, u = n[t.charCodeAt(a)] >>> 6 - a % 4 * 2; r[o >>> 2] |= (s | u) << 24 - o % 4 * 8, o++ } return i.create(r, o) } var n = t, r = n.lib, i = r.WordArray, o = n.enc; o.Base64 = { stringify: function (t) { var e = t.words, n = t.sigBytes, r = this._map; t.clamp(); for (var i = [], o = 0; o < n; o += 3)for (var a = e[o >>> 2] >>> 24 - o % 4 * 8 & 255, s = e[o + 1 >>> 2] >>> 24 - (o + 1) % 4 * 8 & 255, u = e[o + 2 >>> 2] >>> 24 - (o + 2) % 4 * 8 & 255, l = a << 16 | s << 8 | u, c = 0; c < 4 && o + .75 * c < n; c++)i.push(r.charAt(l >>> 6 * (3 - c) & 63)); var f = r.charAt(64); if (f) for (; i.length % 4;)i.push(f); return i.join("") }, parse: function (t) { var n = t.length, r = this._map, i = this._reverseMap; if (!i) { i = this._reverseMap = []; for (var o = 0; o < r.length; o++)i[r.charCodeAt(o)] = o } var a = r.charAt(64); if (a) { var s = t.indexOf(a); -1 !== s && (n = s) } return e(t, n, i) }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" } }(), t.enc.Base64 }) }, function (t, e, n) { !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) { return function (e) { function n(t, e, n, r, i, o, a) { var s = t + (e & n | ~e & r) + i + a; return (s << o | s >>> 32 - o) + e } function r(t, e, n, r, i, o, a) { var s = t + (e & r | n & ~r) + i + a; return (s << o | s >>> 32 - o) + e } function i(t, e, n, r, i, o, a) { var s = t + (e ^ n ^ r) + i + a; return (s << o | s >>> 32 - o) + e } function o(t, e, n, r, i, o, a) { var s = t + (n ^ (e | ~r)) + i + a; return (s << o | s >>> 32 - o) + e } var a = t, s = a.lib, u = s.WordArray, l = s.Hasher, c = a.algo, f = []; !function () { for (var t = 0; t < 64; t++)f[t] = 4294967296 * e.abs(e.sin(t + 1)) | 0 }(); var h = c.MD5 = l.extend({ _doReset: function () { this._hash = new u.init([1732584193, 4023233417, 2562383102, 271733878]) }, _doProcessBlock: function (t, e) { for (var a = 0; a < 16; a++) { var s = e + a, u = t[s]; t[s] = 16711935 & (u << 8 | u >>> 24) | 4278255360 & (u << 24 | u >>> 8) } var l = this._hash.words, c = t[e + 0], h = t[e + 1], d = t[e + 2], p = t[e + 3], g = t[e + 4], v = t[e + 5], y = t[e + 6], b = t[e + 7], m = t[e + 8], w = t[e + 9], x = t[e + 10], _ = t[e + 11], k = t[e + 12], S = t[e + 13], C = t[e + 14], A = t[e + 15], P = l[0], E = l[1], O = l[2], T = l[3]; P = n(P, E, O, T, c, 7, f[0]), T = n(T, P, E, O, h, 12, f[1]), O = n(O, T, P, E, d, 17, f[2]), E = n(E, O, T, P, p, 22, f[3]), P = n(P, E, O, T, g, 7, f[4]), T = n(T, P, E, O, v, 12, f[5]), O = n(O, T, P, E, y, 17, f[6]), E = n(E, O, T, P, b, 22, f[7]), P = n(P, E, O, T, m, 7, f[8]), T = n(T, P, E, O, w, 12, f[9]), O = n(O, T, P, E, x, 17, f[10]), E = n(E, O, T, P, _, 22, f[11]), P = n(P, E, O, T, k, 7, f[12]), T = n(T, P, E, O, S, 12, f[13]), O = n(O, T, P, E, C, 17, f[14]), E = n(E, O, T, P, A, 22, f[15]), P = r(P, E, O, T, h, 5, f[16]), T = r(T, P, E, O, y, 9, f[17]), O = r(O, T, P, E, _, 14, f[18]), E = r(E, O, T, P, c, 20, f[19]), P = r(P, E, O, T, v, 5, f[20]), T = r(T, P, E, O, x, 9, f[21]), O = r(O, T, P, E, A, 14, f[22]), E = r(E, O, T, P, g, 20, f[23]), P = r(P, E, O, T, w, 5, f[24]), T = r(T, P, E, O, C, 9, f[25]), O = r(O, T, P, E, p, 14, f[26]), E = r(E, O, T, P, m, 20, f[27]), P = r(P, E, O, T, S, 5, f[28]), T = r(T, P, E, O, d, 9, f[29]), O = r(O, T, P, E, b, 14, f[30]), E = r(E, O, T, P, k, 20, f[31]), P = i(P, E, O, T, v, 4, f[32]), T = i(T, P, E, O, m, 11, f[33]), O = i(O, T, P, E, _, 16, f[34]), E = i(E, O, T, P, C, 23, f[35]), P = i(P, E, O, T, h, 4, f[36]), T = i(T, P, E, O, g, 11, f[37]), O = i(O, T, P, E, b, 16, f[38]), E = i(E, O, T, P, x, 23, f[39]), P = i(P, E, O, T, S, 4, f[40]), T = i(T, P, E, O, c, 11, f[41]), O = i(O, T, P, E, p, 16, f[42]), E = i(E, O, T, P, y, 23, f[43]), P = i(P, E, O, T, w, 4, f[44]), T = i(T, P, E, O, k, 11, f[45]), O = i(O, T, P, E, A, 16, f[46]), E = i(E, O, T, P, d, 23, f[47]), P = o(P, E, O, T, c, 6, f[48]), T = o(T, P, E, O, b, 10, f[49]), O = o(O, T, P, E, C, 15, f[50]), E = o(E, O, T, P, v, 21, f[51]), P = o(P, E, O, T, k, 6, f[52]), T = o(T, P, E, O, p, 10, f[53]), O = o(O, T, P, E, x, 15, f[54]), E = o(E, O, T, P, h, 21, f[55]), P = o(P, E, O, T, m, 6, f[56]), T = o(T, P, E, O, A, 10, f[57]), O = o(O, T, P, E, y, 15, f[58]), E = o(E, O, T, P, S, 21, f[59]), P = o(P, E, O, T, g, 6, f[60]), T = o(T, P, E, O, _, 10, f[61]), O = o(O, T, P, E, d, 15, f[62]), E = o(E, O, T, P, w, 21, f[63]), l[0] = l[0] + P | 0, l[1] = l[1] + E | 0, l[2] = l[2] + O | 0, l[3] = l[3] + T | 0 }, _doFinalize: function () { var t = this._data, n = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; n[i >>> 5] |= 128 << 24 - i % 32; var o = e.floor(r / 4294967296), a = r; n[15 + (i + 64 >>> 9 << 4)] = 16711935 & (o << 8 | o >>> 24) | 4278255360 & (o << 24 | o >>> 8), n[14 + (i + 64 >>> 9 << 4)] = 16711935 & (a << 8 | a >>> 24) | 4278255360 & (a << 24 | a >>> 8), t.sigBytes = 4 * (n.length + 1), this._process(); for (var s = this._hash, u = s.words, l = 0; l < 4; l++) { var c = u[l]; u[l] = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8) } return s }, clone: function () { var t = l.clone.call(this); return t._hash = this._hash.clone(), t } }); a.MD5 = l._createHelper(h), a.HmacMD5 = l._createHmacHelper(h) }(Math), t.MD5 }) }, function (t, e, n) { "use strict"; (function (e, n) { function r() { this.fileSystem = {}, this.dataSystem = {} } function i(t) { return 0 === t.indexOf(n) && (t = t.substring(n.length)), 0 === t.indexOf("/") && (t = t.substring(1)), t } r.prototype.readFileSync = function (t) { t = i(t); var n = this.dataSystem[t]; if (n) return new e(n, "string" == typeof n ? "base64" : void 0); var r = this.fileSystem[t]; if (r) return r; throw "File '" + t + "' not found in virtual file system" }, r.prototype.writeFileSync = function (t, e) { this.fileSystem[i(t)] = e }, r.prototype.bindFS = function (t) { this.dataSystem = t || {} }, t.exports = new r }).call(e, n(3).Buffer, "/") }, function (t, e, n) { "use strict"; (function (e) { var r, i = n(3), o = i.Buffer, a = {}; for (r in i) i.hasOwnProperty(r) && "SlowBuffer" !== r && "Buffer" !== r && (a[r] = i[r]); var s = a.Buffer = {}; for (r in o) o.hasOwnProperty(r) && "allocUnsafe" !== r && "allocUnsafeSlow" !== r && (s[r] = o[r]); if (a.Buffer.prototype = o.prototype, s.from && s.from !== Uint8Array.from || (s.from = function (t, e, n) { if ("number" == typeof t) throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof t); if (t && void 0 === t.length) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t); return o(t, e, n) }), s.alloc || (s.alloc = function (t, e, n) { if ("number" != typeof t) throw new TypeError('The "size" argument must be of type number. Received type ' + typeof t); if (t < 0 || t >= 2 * (1 << 30)) throw new RangeError('The value "' + t + '" is invalid for option "size"'); var r = o(t); return e && 0 !== e.length ? "string" == typeof n ? r.fill(e, n) : r.fill(e) : r.fill(0), r }), !a.kStringMaxLength) try { a.kStringMaxLength = e.binding("buffer").kStringMaxLength } catch (t) { } a.constants || (a.constants = { MAX_LENGTH: a.kMaxLength }, a.kStringMaxLength && (a.constants.MAX_STRING_LENGTH = a.kStringMaxLength)), t.exports = a }).call(e, n(21)) }, function (t, e, n) { (function () { var t, r, i, o = {}.hasOwnProperty, a = function (t, e) { function n() { this.constructor = t } for (var r in e) o.call(e, r) && (t[r] = e[r]); return n.prototype = e.prototype, t.prototype = new n, t.__super__ = e.prototype, t }; t = n(109), i = function () { function e(t, e) { this.type = t, this.endian = null != e ? e : "BE", this.fn = this.type, "8" !== this.type[this.type.length - 1] && (this.fn += this.endian) } return e.prototype.size = function () { return t.TYPES[this.type] }, e.prototype.decode = function (t) { return t["read" + this.fn]() }, e.prototype.encode = function (t, e) { return t["write" + this.fn](e) }, e }(), e.Number = i, e.uint8 = new i("UInt8"), e.uint16be = e.uint16 = new i("UInt16", "BE"), e.uint16le = new i("UInt16", "LE"), e.uint24be = e.uint24 = new i("UInt24", "BE"), e.uint24le = new i("UInt24", "LE"), e.uint32be = e.uint32 = new i("UInt32", "BE"), e.uint32le = new i("UInt32", "LE"), e.int8 = new i("Int8"), e.int16be = e.int16 = new i("Int16", "BE"), e.int16le = new i("Int16", "LE"), e.int24be = e.int24 = new i("Int24", "BE"), e.int24le = new i("Int24", "LE"), e.int32be = e.int32 = new i("Int32", "BE"), e.int32le = new i("Int32", "LE"), e.floatbe = e.float = new i("Float", "BE"), e.floatle = new i("Float", "LE"), e.doublebe = e.double = new i("Double", "BE"), e.doublele = new i("Double", "LE"), r = function (t) { function e(t, n, r) { null == r && (r = t >> 1), e.__super__.constructor.call(this, "Int" + t, n), this._point = 1 << r } return a(e, t), e.prototype.decode = function (t) { return e.__super__.decode.call(this, t) / this._point }, e.prototype.encode = function (t, n) { return e.__super__.encode.call(this, t, n * this._point | 0) }, e }(i), e.Fixed = r, e.fixed16be = e.fixed16 = new r(16, "BE"), e.fixed16le = new r(16, "LE"), e.fixed32be = e.fixed32 = new r(32, "BE"), e.fixed32le = new r(32, "LE") }).call(this) }, function (t, e) { t.exports = {} }, function (t, e, n) { "use strict"; var r = n(337)(!0); n(119)(String, "String", function (t) { this._t = String(t), this._i = 0 }, function () { var t, e = this._t, n = this._i; return n >= e.length ? { value: void 0, done: !0 } : (t = r(e, n), this._i += t.length, { value: t, done: !1 }) }) }, function (t, e) { var n = t.exports = { version: "2.6.5" }; "number" == typeof __e && (__e = n) }, function (t, e, n) { var r = n(140), i = n(84); t.exports = Object.keys || function (t) { return r(t, i) } }, function (t, e, n) { var r = n(31), i = Math.max, o = Math.min; t.exports = function (t, e) { return t = r(t), t < 0 ? i(t + e, 0) : o(t, e) } }, function (t, e, n) { var r = n(9).f, i = n(24), o = n(4)("toStringTag"); t.exports = function (t, e, n) { t && !i(t = n ? t : t.prototype, o) && r(t, o, { configurable: !0, value: e }) } }, function (t, e, n) { (function (t) { function n(t) { return Array.isArray ? Array.isArray(t) : "[object Array]" === v(t) } function r(t) { return "boolean" == typeof t } function i(t) { return null === t } function o(t) { return null == t } function a(t) { return "number" == typeof t } function s(t) { return "string" == typeof t } function u(t) { return "symbol" == typeof t } function l(t) { return void 0 === t } function c(t) { return "[object RegExp]" === v(t) } function f(t) { return "object" == typeof t && null !== t } function h(t) { return "[object Date]" === v(t) } function d(t) { return "[object Error]" === v(t) || t instanceof Error } function p(t) { return "function" == typeof t } function g(t) { return null === t || "boolean" == typeof t || "number" == typeof t || "string" == typeof t || "symbol" == typeof t || void 0 === t } function v(t) { return Object.prototype.toString.call(t) } e.isArray = n, e.isBoolean = r, e.isNull = i, e.isNullOrUndefined = o, e.isNumber = a, e.isString = s, e.isSymbol = u, e.isUndefined = l, e.isRegExp = c, e.isObject = f, e.isDate = h, e.isError = d, e.isFunction = p, e.isPrimitive = g, e.isBuffer = t.isBuffer }).call(e, n(3).Buffer) }, function (t, e) { t.exports = function (t, e) { return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e } } }, function (t, e, n) { n(331); for (var r = n(20), i = n(27), o = n(49), a = n(12)("toStringTag"), s = "CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,TextTrackList,TouchList".split(","), u = 0; u < s.length; u++) { var l = s[u], c = r[l], f = c && c.prototype; f && !f[a] && i(f, a, l), o[l] = o.Array } }, function (t, e, n) { var r = n(179), i = n(123); t.exports = Object.keys || function (t) { return r(t, i) } }, function (t, e, n) { var r = n(114); t.exports = function (t) { return Object(r(t)) } }, function (t, e, n) { var r = n(13); t.exports = function (t, e) { if (!r(t)) return t; var n, i; if (e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i; if ("function" == typeof (n = t.valueOf) && !r(i = n.call(t))) return i; if (!e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i; throw TypeError("Can't convert object to primitive value") } }, function (t, e, n) { var r = n(51), i = n(8), o = i["__core-js_shared__"] || (i["__core-js_shared__"] = {}); (t.exports = function (t, e) { return o[t] || (o[t] = void 0 !== e ? e : {}) })("versions", []).push({ version: r.version, mode: n(40) ? "pure" : "global", copyright: "© 2019 Denis Pushkarev (zloirock.ru)" }) }, function (t, e) { var n = {}.toString; t.exports = function (t) { return n.call(t).slice(8, -1) } }, function (t, e) { e.f = {}.propertyIsEnumerable }, function (t, e, n) { var r = n(23); t.exports = function (t, e, n) { for (var i in e) r(t, i, e[i], n); return t } }, function (t, e) { t.exports = function (t, e, n, r) { if (!(t instanceof e) || void 0 !== r && r in t) throw TypeError(n + ": incorrect invocation!"); return t } }, function (t, e, n) { var r = n(140), i = n(84).concat("length", "prototype"); e.f = Object.getOwnPropertyNames || function (t) { return r(t, i) } }, function (t, e, n) { var r = n(10), i = n(221), o = n(84), a = n(83)("IE_PROTO"), s = function () { }, u = function () { var t, e = n(138)("iframe"), r = o.length; for (e.style.display = "none", n(222).appendChild(e), e.src = "javascript:", t = e.contentWindow.document, t.open(), t.write("<script>document.F=Object<\/script>"), t.close(), u = t.F; r--;)delete u.prototype[o[r]]; return u() }; t.exports = Object.create || function (t, e) { var n; return null !== t ? (s.prototype = r(t), n = new s, s.prototype = null, n[a] = t) : n = u(), void 0 === e ? n : i(n, e) } }, function (t, e, n) { "use strict"; function r(t) { console && console.warn && console.warn(t) } function i() { i.init.call(this) } function o(t) { return void 0 === t._maxListeners ? i.defaultMaxListeners : t._maxListeners } function a(t, e, n, i) { var a, s, u; if ("function" != typeof n) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof n); if (s = t._events, void 0 === s ? (s = t._events = Object.create(null), t._eventsCount = 0) : (void 0 !== s.newListener && (t.emit("newListener", e, n.listener ? n.listener : n), s = t._events), u = s[e]), void 0 === u) u = s[e] = n, ++t._eventsCount; else if ("function" == typeof u ? u = s[e] = i ? [n, u] : [u, n] : i ? u.unshift(n) : u.push(n), (a = o(t)) > 0 && u.length > a && !u.warned) { u.warned = !0; var l = new Error("Possible EventEmitter memory leak detected. " + u.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit"); l.name = "MaxListenersExceededWarning", l.emitter = t, l.type = e, l.count = u.length, r(l) } return t } function s() { for (var t = [], e = 0; e < arguments.length; e++)t.push(arguments[e]); this.fired || (this.target.removeListener(this.type, this.wrapFn), this.fired = !0, v(this.listener, this.target, t)) } function u(t, e, n) { var r = { fired: !1, wrapFn: void 0, target: t, type: e, listener: n }, i = s.bind(r); return i.listener = n, r.wrapFn = i, i } function l(t, e, n) { var r = t._events; if (void 0 === r) return []; var i = r[e]; return void 0 === i ? [] : "function" == typeof i ? n ? [i.listener || i] : [i] : n ? d(i) : f(i, i.length) } function c(t) { var e = this._events; if (void 0 !== e) { var n = e[t]; if ("function" == typeof n) return 1; if (void 0 !== n) return n.length } return 0 } function f(t, e) { for (var n = new Array(e), r = 0; r < e; ++r)n[r] = t[r]; return n } function h(t, e) { for (; e + 1 < t.length; e++)t[e] = t[e + 1]; t.pop() } function d(t) { for (var e = new Array(t.length), n = 0; n < e.length; ++n)e[n] = t[n].listener || t[n]; return e } var p, g = "object" == typeof Reflect ? Reflect : null, v = g && "function" == typeof g.apply ? g.apply : function (t, e, n) { return Function.prototype.apply.call(t, e, n) }; p = g && "function" == typeof g.ownKeys ? g.ownKeys : Object.getOwnPropertySymbols ? function (t) { return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t)) } : function (t) { return Object.getOwnPropertyNames(t) }; var y = Number.isNaN || function (t) { return t !== t }; t.exports = i, i.EventEmitter = i, i.prototype._events = void 0, i.prototype._eventsCount = 0, i.prototype._maxListeners = void 0; var b = 10; Object.defineProperty(i, "defaultMaxListeners", { enumerable: !0, get: function () { return b }, set: function (t) { if ("number" != typeof t || t < 0 || y(t)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + t + "."); b = t } }), i.init = function () { void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0 }, i.prototype.setMaxListeners = function (t) { if ("number" != typeof t || t < 0 || y(t)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + t + "."); return this._maxListeners = t, this }, i.prototype.getMaxListeners = function () { return o(this) }, i.prototype.emit = function (t) { for (var e = [], n = 1; n < arguments.length; n++)e.push(arguments[n]); var r = "error" === t, i = this._events; if (void 0 !== i) r = r && void 0 === i.error; else if (!r) return !1; if (r) { var o; if (e.length > 0 && (o = e[0]), o instanceof Error) throw o; var a = new Error("Unhandled error." + (o ? " (" + o.message + ")" : "")); throw a.context = o, a } var s = i[t]; if (void 0 === s) return !1; if ("function" == typeof s) v(s, this, e); else for (var u = s.length, l = f(s, u), n = 0; n < u; ++n)v(l[n], this, e); return !0 }, i.prototype.addListener = function (t, e) { return a(this, t, e, !1) }, i.prototype.on = i.prototype.addListener, i.prototype.prependListener = function (t, e) { return a(this, t, e, !0) }, i.prototype.once = function (t, e) { if ("function" != typeof e) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e); return this.on(t, u(this, t, e)), this }, i.prototype.prependOnceListener = function (t, e) { if ("function" != typeof e) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e); return this.prependListener(t, u(this, t, e)), this }, i.prototype.removeListener = function (t, e) { var n, r, i, o, a; if ("function" != typeof e) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e); if (void 0 === (r = this._events)) return this; if (void 0 === (n = r[t])) return this; if (n === e || n.listener === e) 0 == --this._eventsCount ? this._events = Object.create(null) : (delete r[t], r.removeListener && this.emit("removeListener", t, n.listener || e)); else if ("function" != typeof n) { for (i = -1, o = n.length - 1; o >= 0; o--)if (n[o] === e || n[o].listener === e) { a = n[o].listener, i = o; break } if (i < 0) return this; 0 === i ? n.shift() : h(n, i), 1 === n.length && (r[t] = n[0]), void 0 !== r.removeListener && this.emit("removeListener", t, a || e) } return this }, i.prototype.off = i.prototype.removeListener, i.prototype.removeAllListeners = function (t) { var e, n, r; if (void 0 === (n = this._events)) return this; if (void 0 === n.removeListener) return 0 === arguments.length ? (this._events = Object.create(null), this._eventsCount = 0) : void 0 !== n[t] && (0 == --this._eventsCount ? this._events = Object.create(null) : delete n[t]), this; if (0 === arguments.length) { var i, o = Object.keys(n); for (r = 0; r < o.length; ++r)"removeListener" !== (i = o[r]) && this.removeAllListeners(i); return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this } if ("function" == typeof (e = n[t])) this.removeListener(t, e); else if (void 0 !== e) for (r = e.length - 1; r >= 0; r--)this.removeListener(t, e[r]); return this }, i.prototype.listeners = function (t) { return l(this, t, !0) }, i.prototype.rawListeners = function (t) { return l(this, t, !1) }, i.listenerCount = function (t, e) { return "function" == typeof t.listenerCount ? t.listenerCount(e) : c.call(t, e) }, i.prototype.listenerCount = c, i.prototype.eventNames = function () { return this._eventsCount > 0 ? p(this._events) : [] } }, function (t, e, n) { "use strict"; (function (e) { function n(t, n, r, i) { if ("function" != typeof t) throw new TypeError('"callback" argument must be a function'); var o, a, s = arguments.length; switch (s) { case 0: case 1: return e.nextTick(t); case 2: return e.nextTick(function () { t.call(null, n) }); case 3: return e.nextTick(function () { t.call(null, n, r) }); case 4: return e.nextTick(function () { t.call(null, n, r, i) }); default: for (o = new Array(s - 1), a = 0; a < o.length;)o[a++] = arguments[a]; return e.nextTick(function () { t.apply(null, o) }) } } !e.version || 0 === e.version.indexOf("v0.") || 0 === e.version.indexOf("v1.") && 0 !== e.version.indexOf("v1.8.") ? t.exports = { nextTick: n } : t.exports = e }).call(e, n(21)) }, function (t, e, n) { function r(t, e) { for (var n in t) e[n] = t[n] } function i(t, e, n) { return a(t, e, n) } var o = n(3), a = o.Buffer; a.from && a.alloc && a.allocUnsafe && a.allocUnsafeSlow ? t.exports = o : (r(o, e), e.Buffer = i), r(a, i), i.from = function (t, e, n) { if ("number" == typeof t) throw new TypeError("Argument must not be a number"); return a(t, e, n) }, i.alloc = function (t, e, n) { if ("number" != typeof t) throw new TypeError("Argument must be a number"); var r = a(t); return void 0 !== e ? "string" == typeof n ? r.fill(e, n) : r.fill(e) : r.fill(0), r }, i.allocUnsafe = function (t) { if ("number" != typeof t) throw new TypeError("Argument must be a number"); return a(t) }, i.allocUnsafeSlow = function (t) { if ("number" != typeof t) throw new TypeError("Argument must be a number"); return o.SlowBuffer(t) } }, function (t, e, n) { "use strict"; function r(t, e) { return Object.prototype.hasOwnProperty.call(t, e) } var i = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array; e.assign = function (t) { for (var e = Array.prototype.slice.call(arguments, 1); e.length;) { var n = e.shift(); if (n) { if ("object" != typeof n) throw new TypeError(n + "must be non-object"); for (var i in n) r(n, i) && (t[i] = n[i]) } } return t }, e.shrinkBuf = function (t, e) { return t.length === e ? t : t.subarray ? t.subarray(0, e) : (t.length = e, t) }; var o = { arraySet: function (t, e, n, r, i) { if (e.subarray && t.subarray) return void t.set(e.subarray(n, n + r), i); for (var o = 0; o < r; o++)t[i + o] = e[n + o] }, flattenChunks: function (t) { var e, n, r, i, o, a; for (r = 0, e = 0, n = t.length; e < n; e++)r += t[e].length; for (a = new Uint8Array(r), i = 0, e = 0, n = t.length; e < n; e++)o = t[e], a.set(o, i), i += o.length; return a } }, a = { arraySet: function (t, e, n, r, i) { for (var o = 0; o < r; o++)t[i + o] = e[n + o] }, flattenChunks: function (t) { return [].concat.apply([], t) } }; e.setTyped = function (t) { t ? (e.Buf8 = Uint8Array, e.Buf16 = Uint16Array, e.Buf32 = Int32Array, e.assign(e, o)) : (e.Buf8 = Array, e.Buf16 = Array, e.Buf32 = Array, e.assign(e, a)) }, e.setTyped(i) }, function (t, e, n) { !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) { return function (e) { var n = t, r = n.lib, i = r.Base, o = r.WordArray, a = n.x64 = {}; a.Word = i.extend({ init: function (t, e) { this.high = t, this.low = e } }), a.WordArray = i.extend({ init: function (t, e) { t = this.words = t || [], this.sigBytes = void 0 != e ? e : 8 * t.length }, toX32: function () { for (var t = this.words, e = t.length, n = [], r = 0; r < e; r++) { var i = t[r]; n.push(i.high), n.push(i.low) } return o.create(n, this.sigBytes) }, clone: function () { for (var t = i.clone.call(this), e = t.words = this.words.slice(0), n = e.length, r = 0; r < n; r++)e[r] = e[r].clone(); return t } }) }(), t }) }, function (t, e) { e.f = {}.propertyIsEnumerable }, function (t, e) { t.exports = !0 }, function (t, e, n) { var r = n(28), i = n(178), o = n(123), a = n(121)("IE_PROTO"), s = function () { }, u = function () { var t, e = n(174)("iframe"), r = o.length; for (e.style.display = "none", n(335).appendChild(e), e.src = "javascript:", t = e.contentWindow.document, t.open(), t.write("<script>document.F=Object<\/script>"), t.close(), u = t.F; r--;)delete u.prototype[o[r]]; return u() }; t.exports = Object.create || function (t, e) { var n; return null !== t ? (s.prototype = r(t), n = new s, s.prototype = null, n[a] = t) : n = u(), void 0 === e ? n : i(n, e) } }, function (t, e, n) { var r = n(120), i = Math.min; t.exports = function (t) { return t > 0 ? i(r(t), 9007199254740991) : 0 } }, function (t, e) { var n = 0, r = Math.random(); t.exports = function (t) { return "Symbol(".concat(void 0 === t ? "" : t, ")_", (++n + r).toString(36)) } }, function (t, e, n) { var r = n(18).f, i = n(36), o = n(12)("toStringTag"); t.exports = function (t, e, n) { t && !i(t = n ? t : t.prototype, o) && r(t, o, { configurable: !0, value: e }) } }, function (t, e, n) { var r = n(77)("meta"), i = n(19), o = n(36), a = n(18).f, s = 0, u = Object.isExtensible || function () { return !0 }, l = !n(37)(function () { return u(Object.preventExtensions({})) }), c = function (t) { a(t, r, { value: { i: "O" + ++s, w: {} } }) }, f = function (t, e) { if (!i(t)) return "symbol" == typeof t ? t : ("string" == typeof t ? "S" : "P") + t; if (!o(t, r)) { if (!u(t)) return "F"; if (!e) return "E"; c(t) } return t[r].i }, h = function (t, e) { if (!o(t, r)) { if (!u(t)) return !0; if (!e) return !1; c(t) } return t[r].w }, d = function (t) { return l && p.NEED && u(t) && !o(t, r) && c(t), t }, p = t.exports = { KEY: r, NEED: !1, fastKey: f, getWeak: h, onFreeze: d } }, function (t, e, n) { var r = n(38), i = n(189), o = n(190), a = n(28), s = n(76), u = n(124), l = {}, c = {}, e = t.exports = function (t, e, n, f, h) { var d, p, g, v, y = h ? function () { return t } : u(t), b = r(n, f, e ? 2 : 1), m = 0; if ("function" != typeof y) throw TypeError(t + " is not iterable!"); if (o(y)) { for (d = s(t.length); d > m; m++)if ((v = e ? b(a(p = t[m])[0], p[1]) : b(t[m])) === l || v === c) return v } else for (g = y.call(t); !(p = g.next()).done;)if ((v = i(g, b, p.value, e)) === l || v === c) return v }; e.BREAK = l, e.RETURN = c }, function (t, e, n) { var r = n(62); t.exports = Object("z").propertyIsEnumerable(0) ? Object : function (t) { return "String" == r(t) ? t.split("") : Object(t) } }, function (t, e, n) { var r = n(41), i = n(15), o = n(53); t.exports = function (t) { return function (e, n, a) { var s, u = r(e), l = i(u.length), c = o(a, l); if (t && n != n) { for (; l > c;)if ((s = u[c++]) != s) return !0 } else for (; l > c; c++)if ((t || c in u) && u[c] === n) return t || c || 0; return !t && -1 } } }, function (t, e, n) { var r = n(61)("keys"), i = n(29); t.exports = function (t) { return r[t] || (r[t] = i(t)) } }, function (t, e) { t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",") }, function (t, e) { e.f = Object.getOwnPropertySymbols }, function (t, e, n) { "use strict"; var r = n(25), i = n(53), o = n(15); t.exports = function (t) { for (var e = r(this), n = o(e.length), a = arguments.length, s = i(a > 1 ? arguments[1] : void 0, n), u = a > 2 ? arguments[2] : void 0, l = void 0 === u ? n : i(u, n); l > s;)e[s++] = t; return e } }, function (t, e, n) { var r = n(4)("unscopables"), i = Array.prototype; void 0 == i[r] && n(16)(i, r, {}), t.exports = function (t) { i[r][t] = !0 } }, function (t, e, n) { var r = n(62), i = n(4)("toStringTag"), o = "Arguments" == r(function () { return arguments }()), a = function (t, e) { try { return t[e] } catch (t) { } }; t.exports = function (t) { var e, n, s; return void 0 === t ? "Undefined" : null === t ? "Null" : "string" == typeof (n = a(e = Object(t), i)) ? n : o ? r(e) : "Object" == (s = r(e)) && "function" == typeof e.callee ? "Arguments" : s } }, function (t, e, n) { var r = n(43), i = n(4)("iterator"), o = Array.prototype; t.exports = function (t) { return void 0 !== t && (r.Array === t || o[i] === t) } }, function (t, e, n) { var r = n(88), i = n(4)("iterator"), o = n(43); t.exports = n(51).getIteratorMethod = function (t) { if (void 0 != t) return t[i] || t["@@iterator"] || o[r(t)] } }, function (t, e, n) { "use strict"; var r = n(87), i = n(147), o = n(43), a = n(41); t.exports = n(92)(Array, "Array", function (t, e) { this._t = a(t), this._i = 0, this._k = e }, function () { var t = this._t, e = this._k, n = this._i++; return !t || n >= t.length ? (this._t = void 0, i(1)) : "keys" == e ? i(0, n) : "values" == e ? i(0, t[n]) : i(0, [n, t[n]]) }, "values"), o.Arguments = o.Array, r("keys"), r("values"), r("entries") }, function (t, e, n) { "use strict"; var r = n(40), i = n(7), o = n(23), a = n(16), s = n(43), u = n(226), l = n(54), c = n(144), f = n(4)("iterator"), h = !([].keys && "next" in [].keys()), d = function () { return this }; t.exports = function (t, e, n, p, g, v, y) { u(n, e, p); var b, m, w, x = function (t) { if (!h && t in C) return C[t]; switch (t) { case "keys": case "values": return function () { return new n(this, t) } }return function () { return new n(this, t) } }, _ = e + " Iterator", k = "values" == g, S = !1, C = t.prototype, A = C[f] || C["@@iterator"] || g && C[g], P = A || x(g), E = g ? k ? x("entries") : P : void 0, O = "Array" == e ? C.entries || A : A; if (O && (w = c(O.call(new t))) !== Object.prototype && w.next && (l(w, _, !0), r || "function" == typeof w[f] || a(w, f, d)), k && A && "values" !== A.name && (S = !0, P = function () { return A.call(this) }), r && !y || !h && !S && C[f] || a(C, f, P), s[e] = P, s[_] = d, g) if (b = { values: k ? P : x("values"), keys: v ? P : x("keys"), entries: E }, y) for (m in b) m in C || o(C, m, b[m]); else i(i.P + i.F * (h || S), e, b); return b } }, function (t, e, n) { var r = n(4)("iterator"), i = !1; try { var o = [7][r](); o.return = function () { i = !0 }, Array.from(o, function () { throw 2 }) } catch (t) { } t.exports = function (t, e) { if (!e && !i) return !1; var n = !1; try { var o = [7], a = o[r](); a.next = function () { return { done: n = !0 } }, o[r] = function () { return a }, t(o) } catch (t) { } return n } }, function (t, e, n) { var r = n(63), i = n(39), o = n(41), a = n(60), s = n(24), u = n(137), l = Object.getOwnPropertyDescriptor; e.f = n(11) ? l : function (t, e) { if (t = o(t), e = a(e, !0), u) try { return l(t, e) } catch (t) { } if (s(t, e)) return i(!r.f.call(t, e), t[e]) } }, function (t, e, n) { "use strict"; var r = n(96)(!0); t.exports = function (t, e, n) { return e + (n ? r(t, e).length : 1) } }, function (t, e, n) { var r = n(31), i = n(42); t.exports = function (t) { return function (e, n) { var o, a, s = String(i(e)), u = r(n), l = s.length; return u < 0 || u >= l ? t ? "" : void 0 : (o = s.charCodeAt(u), o < 55296 || o > 56319 || u + 1 === l || (a = s.charCodeAt(u + 1)) < 56320 || a > 57343 ? t ? s.charAt(u) : o : t ? s.slice(u, u + 2) : a - 56320 + (o - 55296 << 10) + 65536) } } }, function (t, e, n) { "use strict"; var r = n(88), i = RegExp.prototype.exec; t.exports = function (t, e) { var n = t.exec; if ("function" == typeof n) { var o = n.call(t, e); if ("object" != typeof o) throw new TypeError("RegExp exec method returned something other than an Object or null"); return o } if ("RegExp" !== r(t)) throw new TypeError("RegExp#exec called on incompatible receiver"); return i.call(t, e) } }, function (t, e, n) { "use strict"; n(230); var r = n(23), i = n(16), o = n(14), a = n(42), s = n(4), u = n(99), l = s("species"), c = !o(function () { var t = /./; return t.exec = function () { var t = []; return t.groups = { a: "7" }, t }, "7" !== "".replace(t, "$<a>") }), f = function () { var t = /(?:)/, e = t.exec; t.exec = function () { return e.apply(this, arguments) }; var n = "ab".split(t); return 2 === n.length && "a" === n[0] && "b" === n[1] }(); t.exports = function (t, e, n) { var h = s(t), d = !o(function () { var e = {}; return e[h] = function () { return 7 }, 7 != ""[t](e) }), p = d ? !o(function () { var e = !1, n = /a/; return n.exec = function () { return e = !0, null }, "split" === t && (n.constructor = {}, n.constructor[l] = function () { return n }), n[h](""), !e }) : void 0; if (!d || !p || "replace" === t && !c || "split" === t && !f) { var g = /./[h], v = n(a, h, ""[t], function (t, e, n, r, i) { return e.exec === u ? d && !i ? { done: !0, value: g.call(e, n, r) } : { done: !0, value: t.call(n, e, r) } : { done: !1 } }), y = v[0], b = v[1]; r(String.prototype, t, y), i(RegExp.prototype, h, 2 == e ? function (t, e) { return b.call(t, this, e) } : function (t) { return b.call(t, this) }) } } }, function (t, e, n) { "use strict"; var r = n(100), i = RegExp.prototype.exec, o = String.prototype.replace, a = i, s = function () { var t = /a/, e = /b*/g; return i.call(t, "a"), i.call(e, "a"), 0 !== t.lastIndex || 0 !== e.lastIndex }(), u = void 0 !== /()??/.exec("")[1]; (s || u) && (a = function (t) { var e, n, a, l, c = this; return u && (n = new RegExp("^" + c.source + "$(?!\\s)", r.call(c))), s && (e = c.lastIndex), a = i.call(c, t), s && a && (c.lastIndex = c.global ? a.index + a[0].length : e), u && a && a.length > 1 && o.call(a[0], n, function () { for (l = 1; l < arguments.length - 2; l++)void 0 === arguments[l] && (a[l] = void 0) }), a }), t.exports = a }, function (t, e, n) { "use strict"; var r = n(10); t.exports = function () { var t = r(this), e = ""; return t.global && (e += "g"), t.ignoreCase && (e += "i"), t.multiline && (e += "m"), t.unicode && (e += "u"), t.sticky && (e += "y"), e } }, function (t, e, n) { var r = n(29)("meta"), i = n(13), o = n(24), a = n(9).f, s = 0, u = Object.isExtensible || function () { return !0 }, l = !n(14)(function () { return u(Object.preventExtensions({})) }), c = function (t) { a(t, r, { value: { i: "O" + ++s, w: {} } }) }, f = function (t, e) { if (!i(t)) return "symbol" == typeof t ? t : ("string" == typeof t ? "S" : "P") + t; if (!o(t, r)) { if (!u(t)) return "F"; if (!e) return "E"; c(t) } return t[r].i }, h = function (t, e) { if (!o(t, r)) { if (!u(t)) return !0; if (!e) return !1; c(t) } return t[r].w }, d = function (t) { return l && p.NEED && u(t) && !o(t, r) && c(t), t }, p = t.exports = { KEY: r, NEED: !1, fastKey: f, getWeak: h, onFreeze: d } }, function (t, e, n) { function r() { i.call(this) } t.exports = r; var i = n(68).EventEmitter; n(32)(r, i), r.Readable = n(103), r.Writable = n(250), r.Duplex = n(251), r.Transform = n(252), r.PassThrough = n(253), r.Stream = r, r.prototype.pipe = function (t, e) { function n(e) { t.writable && !1 === t.write(e) && l.pause && l.pause() } function r() { l.readable && l.resume && l.resume() } function o() { c || (c = !0, t.end()) } function a() { c || (c = !0, "function" == typeof t.destroy && t.destroy()) } function s(t) { if (u(), 0 === i.listenerCount(this, "error")) throw t } function u() { l.removeListener("data", n), t.removeListener("drain", r), l.removeListener("end", o), l.removeListener("close", a), l.removeListener("error", s), t.removeListener("error", s), l.removeListener("end", u), l.removeListener("close", u), t.removeListener("close", u) } var l = this; l.on("data", n), t.on("drain", r), t._isStdio || e && !1 === e.end || (l.on("end", o), l.on("close", a)); var c = !1; return l.on("error", s), t.on("error", s), l.on("end", u), l.on("close", u), t.on("close", u), t.emit("pipe", l), t } }, function (t, e, n) { e = t.exports = n(158), e.Stream = e, e.Readable = e, e.Writable = n(104), e.Duplex = n(33), e.Transform = n(161), e.PassThrough = n(249) }, function (t, e, n) { "use strict"; (function (e, r) { function i(t) { var e = this; this.next = null, this.entry = null, this.finish = function () { A(e, t) } } function o(t) { return L.from(t) } function a(t) { return L.isBuffer(t) || t instanceof R } function s() { } function u(t, e) { E = E || n(33), t = t || {}; var r = e instanceof E; this.objectMode = !!t.objectMode, r && (this.objectMode = this.objectMode || !!t.writableObjectMode); var o = t.highWaterMark, a = t.writableHighWaterMark, s = this.objectMode ? 16 : 16384; this.highWaterMark = o || 0 === o ? o : r && (a || 0 === a) ? a : s, this.highWaterMark = Math.floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1; var u = !1 === t.decodeStrings; this.decodeStrings = !u, this.defaultEncoding = t.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function (t) { y(e, t) }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new i(this) } function l(t) { if (E = E || n(33), !(F.call(l, this) || this instanceof E)) return new l(t); this._writableState = new u(t, this), this.writable = !0, t && ("function" == typeof t.write && (this._write = t.write), "function" == typeof t.writev && (this._writev = t.writev), "function" == typeof t.destroy && (this._destroy = t.destroy), "function" == typeof t.final && (this._final = t.final)), B.call(this) } function c(t, e) { var n = new Error("write after end"); t.emit("error", n), P.nextTick(e, n) } function f(t, e, n, r) { var i = !0, o = !1; return null === n ? o = new TypeError("May not write null values to stream") : "string" == typeof n || void 0 === n || e.objectMode || (o = new TypeError("Invalid non-string/buffer chunk")), o && (t.emit("error", o), P.nextTick(r, o), i = !1), i } function h(t, e, n) { return t.objectMode || !1 === t.decodeStrings || "string" != typeof e || (e = L.from(e, n)), e } function d(t, e, n, r, i, o) { if (!n) { var a = h(e, r, i); r !== a && (n = !0, i = "buffer", r = a) } var s = e.objectMode ? 1 : r.length; e.length += s; var u = e.length < e.highWaterMark; if (u || (e.needDrain = !0), e.writing || e.corked) { var l = e.lastBufferedRequest; e.lastBufferedRequest = { chunk: r, encoding: i, isBuf: n, callback: o, next: null }, l ? l.next = e.lastBufferedRequest : e.bufferedRequest = e.lastBufferedRequest, e.bufferedRequestCount += 1 } else p(t, e, !1, s, r, i, o); return u } function p(t, e, n, r, i, o, a) { e.writelen = r, e.writecb = a, e.writing = !0, e.sync = !0, n ? t._writev(i, e.onwrite) : t._write(i, o, e.onwrite), e.sync = !1 } function g(t, e, n, r, i) { --e.pendingcb, n ? (P.nextTick(i, r), P.nextTick(S, t, e), t._writableState.errorEmitted = !0, t.emit("error", r)) : (i(r), t._writableState.errorEmitted = !0, t.emit("error", r), S(t, e)) } function v(t) { t.writing = !1, t.writecb = null, t.length -= t.writelen, t.writelen = 0 } function y(t, e) { var n = t._writableState, r = n.sync, i = n.writecb; if (v(n), e) g(t, n, r, e, i); else { var o = x(n); o || n.corked || n.bufferProcessing || !n.bufferedRequest || w(t, n), r ? O(b, t, n, o, i) : b(t, n, o, i) } } function b(t, e, n, r) { n || m(t, e), e.pendingcb-- , r(), S(t, e) } function m(t, e) { 0 === e.length && e.needDrain && (e.needDrain = !1, t.emit("drain")) } function w(t, e) { e.bufferProcessing = !0; var n = e.bufferedRequest; if (t._writev && n && n.next) { var r = e.bufferedRequestCount, o = new Array(r), a = e.corkedRequestsFree; a.entry = n; for (var s = 0, u = !0; n;)o[s] = n, n.isBuf || (u = !1), n = n.next, s += 1; o.allBuffers = u, p(t, e, !0, e.length, o, "", a.finish), e.pendingcb++ , e.lastBufferedRequest = null, a.next ? (e.corkedRequestsFree = a.next, a.next = null) : e.corkedRequestsFree = new i(e), e.bufferedRequestCount = 0 } else { for (; n;) { var l = n.chunk, c = n.encoding, f = n.callback; if (p(t, e, !1, e.objectMode ? 1 : l.length, l, c, f), n = n.next, e.bufferedRequestCount-- , e.writing) break } null === n && (e.lastBufferedRequest = null) } e.bufferedRequest = n, e.bufferProcessing = !1 } function x(t) { return t.ending && 0 === t.length && null === t.bufferedRequest && !t.finished && !t.writing } function _(t, e) { t._final(function (n) { e.pendingcb-- , n && t.emit("error", n), e.prefinished = !0, t.emit("prefinish"), S(t, e) }) } function k(t, e) { e.prefinished || e.finalCalled || ("function" == typeof t._final ? (e.pendingcb++ , e.finalCalled = !0, P.nextTick(_, t, e)) : (e.prefinished = !0, t.emit("prefinish"))) } function S(t, e) { var n = x(e); return n && (k(t, e), 0 === e.pendingcb && (e.finished = !0, t.emit("finish"))), n } function C(t, e, n) { e.ending = !0, S(t, e), n && (e.finished ? P.nextTick(n) : t.once("finish", n)), e.ended = !0, t.writable = !1 } function A(t, e, n) { var r = t.entry; for (t.entry = null; r;) { var i = r.callback; e.pendingcb-- , i(n), r = r.next } e.corkedRequestsFree ? e.corkedRequestsFree.next = t : e.corkedRequestsFree = t } var P = n(69); t.exports = l; var E, O = !e.browser && ["v0.10", "v0.9."].indexOf(e.version.slice(0, 5)) > -1 ? setImmediate : P.nextTick; l.WritableState = u; var T = n(55); T.inherits = n(32); var I = { deprecate: n(248) }, B = n(159), L = n(70).Buffer, R = r.Uint8Array || function () { }, M = n(160); T.inherits(l, B), u.prototype.getBuffer = function () { for (var t = this.bufferedRequest, e = []; t;)e.push(t), t = t.next; return e }, function () { try { Object.defineProperty(u.prototype, "buffer", { get: I.deprecate(function () { return this.getBuffer() }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003") }) } catch (t) { } }(); var F; "function" == typeof Symbol && Symbol.hasInstance && "function" == typeof Function.prototype[Symbol.hasInstance] ? (F = Function.prototype[Symbol.hasInstance], Object.defineProperty(l, Symbol.hasInstance, { value: function (t) { return !!F.call(this, t) || this === l && (t && t._writableState instanceof u) } })) : F = function (t) { return t instanceof this }, l.prototype.pipe = function () { this.emit("error", new Error("Cannot pipe, not readable")) }, l.prototype.write = function (t, e, n) { var r = this._writableState, i = !1, u = !r.objectMode && a(t); return u && !L.isBuffer(t) && (t = o(t)), "function" == typeof e && (n = e, e = null), u ? e = "buffer" : e || (e = r.defaultEncoding), "function" != typeof n && (n = s), r.ended ? c(this, n) : (u || f(this, r, t, n)) && (r.pendingcb++ , i = d(this, r, u, t, e, n)), i }, l.prototype.cork = function () { this._writableState.corked++ }, l.prototype.uncork = function () { var t = this._writableState; t.corked && (t.corked-- , t.writing || t.corked || t.finished || t.bufferProcessing || !t.bufferedRequest || w(this, t)) }, l.prototype.setDefaultEncoding = function (t) { if ("string" == typeof t && (t = t.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((t + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t); return this._writableState.defaultEncoding = t, this }, Object.defineProperty(l.prototype, "writableHighWaterMark", { enumerable: !1, get: function () { return this._writableState.highWaterMark } }), l.prototype._write = function (t, e, n) { n(new Error("_write() is not implemented")) }, l.prototype._writev = null, l.prototype.end = function (t, e, n) { var r = this._writableState; "function" == typeof t ? (n = t, t = null, e = null) : "function" == typeof e && (n = e, e = null), null !== t && void 0 !== t && this.write(t, e), r.corked && (r.corked = 1, this.uncork()), r.ending || r.finished || C(this, r, n) }, Object.defineProperty(l.prototype, "destroyed", { get: function () { return void 0 !== this._writableState && this._writableState.destroyed }, set: function (t) { this._writableState && (this._writableState.destroyed = t) } }), l.prototype.destroy = M.destroy, l.prototype._undestroy = M.undestroy, l.prototype._destroy = function (t, e) { this.end(), e(t) } }).call(e, n(21), n(22)) }, function (t, e, n) { "use strict"; function r(t) { if (!t) return "utf8"; for (var e; ;)switch (t) { case "utf8": case "utf-8": return "utf8"; case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": return "utf16le"; case "latin1": case "binary": return "latin1"; case "base64": case "ascii": case "hex": return t; default: if (e) return; t = ("" + t).toLowerCase(), e = !0 } } function i(t) { var e = r(t); if ("string" != typeof e && (b.isEncoding === m || !m(t))) throw new Error("Unknown encoding: " + t); return e || t } function o(t) { this.encoding = i(t); var e; switch (this.encoding) { case "utf16le": this.text = h, this.end = d, e = 4; break; case "utf8": this.fillLast = l, e = 4; break; case "base64": this.text = p, this.end = g, e = 3; break; default: return this.write = v, void (this.end = y) }this.lastNeed = 0, this.lastTotal = 0, this.lastChar = b.allocUnsafe(e) } function a(t) { return t <= 127 ? 0 : t >> 5 == 6 ? 2 : t >> 4 == 14 ? 3 : t >> 3 == 30 ? 4 : t >> 6 == 2 ? -1 : -2 } function s(t, e, n) { var r = e.length - 1; if (r < n) return 0; var i = a(e[r]); return i >= 0 ? (i > 0 && (t.lastNeed = i - 1), i) : --r < n || -2 === i ? 0 : (i = a(e[r])) >= 0 ? (i > 0 && (t.lastNeed = i - 2), i) : --r < n || -2 === i ? 0 : (i = a(e[r]), i >= 0 ? (i > 0 && (2 === i ? i = 0 : t.lastNeed = i - 3), i) : 0) } function u(t, e, n) { if (128 != (192 & e[0])) return t.lastNeed = 0, "�"; if (t.lastNeed > 1 && e.length > 1) { if (128 != (192 & e[1])) return t.lastNeed = 1, "�"; if (t.lastNeed > 2 && e.length > 2 && 128 != (192 & e[2])) return t.lastNeed = 2, "�" } } function l(t) { var e = this.lastTotal - this.lastNeed, n = u(this, t, e); return void 0 !== n ? n : this.lastNeed <= t.length ? (t.copy(this.lastChar, e, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : (t.copy(this.lastChar, e, 0, t.length), void (this.lastNeed -= t.length)) } function c(t, e) { var n = s(this, t, e); if (!this.lastNeed) return t.toString("utf8", e); this.lastTotal = n; var r = t.length - (n - this.lastNeed); return t.copy(this.lastChar, 0, r), t.toString("utf8", e, r) } function f(t) { var e = t && t.length ? this.write(t) : ""; return this.lastNeed ? e + "�" : e } function h(t, e) { if ((t.length - e) % 2 == 0) { var n = t.toString("utf16le", e); if (n) { var r = n.charCodeAt(n.length - 1); if (r >= 55296 && r <= 56319) return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1], n.slice(0, -1) } return n } return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = t[t.length - 1], t.toString("utf16le", e, t.length - 1) } function d(t) { var e = t && t.length ? this.write(t) : ""; if (this.lastNeed) { var n = this.lastTotal - this.lastNeed; return e + this.lastChar.toString("utf16le", 0, n) } return e } function p(t, e) { var n = (t.length - e) % 3; return 0 === n ? t.toString("base64", e) : (this.lastNeed = 3 - n, this.lastTotal = 3, 1 === n ? this.lastChar[0] = t[t.length - 1] : (this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1]), t.toString("base64", e, t.length - n)) } function g(t) { var e = t && t.length ? this.write(t) : ""; return this.lastNeed ? e + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : e } function v(t) { return t.toString(this.encoding) } function y(t) { return t && t.length ? this.write(t) : "" } var b = n(70).Buffer, m = b.isEncoding || function (t) { switch ((t = "" + t) && t.toLowerCase()) { case "hex": case "utf8": case "utf-8": case "ascii": case "binary": case "base64": case "ucs2": case "ucs-2": case "utf16le": case "utf-16le": case "raw": return !0; default: return !1 } }; e.StringDecoder = o, o.prototype.write = function (t) { if (0 === t.length) return ""; var e, n; if (this.lastNeed) { if (void 0 === (e = this.fillLast(t))) return ""; n = this.lastNeed, this.lastNeed = 0 } else n = 0; return n < t.length ? e ? e + this.text(t, n) : this.text(t, n) : e || "" }, o.prototype.end = f, o.prototype.text = c, o.prototype.fillLast = function (t) { if (this.lastNeed <= t.length) return t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal); t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t.length), this.lastNeed -= t.length } }, function (t, e, n) { (function (t) { function r(t, n) { var r = { seen: [], stylize: o }; return arguments.length >= 3 && (r.depth = arguments[2]), arguments.length >= 4 && (r.colors = arguments[3]), p(n) ? r.showHidden = n : n && e._extend(r, n), w(r.showHidden) && (r.showHidden = !1), w(r.depth) && (r.depth = 2), w(r.colors) && (r.colors = !1), w(r.customInspect) && (r.customInspect = !0), r.colors && (r.stylize = i), s(r, t, r.depth) } function i(t, e) { var n = r.styles[e]; return n ? "[" + r.colors[n][0] + "m" + t + "[" + r.colors[n][1] + "m" : t } function o(t, e) { return t } function a(t) { var e = {}; return t.forEach(function (t, n) { e[t] = !0 }), e } function s(t, n, r) { if (t.customInspect && n && C(n.inspect) && n.inspect !== e.inspect && (!n.constructor || n.constructor.prototype !== n)) { var i = n.inspect(r, t); return b(i) || (i = s(t, i, r)), i } var o = u(t, n); if (o) return o; var p = Object.keys(n), g = a(p); if (t.showHidden && (p = Object.getOwnPropertyNames(n)), S(n) && (p.indexOf("message") >= 0 || p.indexOf("description") >= 0)) return l(n); if (0 === p.length) { if (C(n)) { var v = n.name ? ": " + n.name : ""; return t.stylize("[Function" + v + "]", "special") } if (x(n)) return t.stylize(RegExp.prototype.toString.call(n), "regexp"); if (k(n)) return t.stylize(Date.prototype.toString.call(n), "date"); if (S(n)) return l(n) } var y = "", m = !1, w = ["{", "}"]; if (d(n) && (m = !0, w = ["[", "]"]), C(n)) { y = " [Function" + (n.name ? ": " + n.name : "") + "]" } if (x(n) && (y = " " + RegExp.prototype.toString.call(n)), k(n) && (y = " " + Date.prototype.toUTCString.call(n)), S(n) && (y = " " + l(n)), 0 === p.length && (!m || 0 == n.length)) return w[0] + y + w[1]; if (r < 0) return x(n) ? t.stylize(RegExp.prototype.toString.call(n), "regexp") : t.stylize("[Object]", "special"); t.seen.push(n); var _; return _ = m ? c(t, n, r, g, p) : p.map(function (e) { return f(t, n, r, g, e, m) }), t.seen.pop(), h(_, y, w) } function u(t, e) { if (w(e)) return t.stylize("undefined", "undefined"); if (b(e)) { var n = "'" + JSON.stringify(e).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'"; return t.stylize(n, "string") } return y(e) ? t.stylize("" + e, "number") : p(e) ? t.stylize("" + e, "boolean") : g(e) ? t.stylize("null", "null") : void 0 } function l(t) { return "[" + Error.prototype.toString.call(t) + "]" } function c(t, e, n, r, i) { for (var o = [], a = 0, s = e.length; a < s; ++a)T(e, String(a)) ? o.push(f(t, e, n, r, String(a), !0)) : o.push(""); return i.forEach(function (i) { i.match(/^\d+$/) || o.push(f(t, e, n, r, i, !0)) }), o } function f(t, e, n, r, i, o) { var a, u, l; if (l = Object.getOwnPropertyDescriptor(e, i) || { value: e[i] }, l.get ? u = l.set ? t.stylize("[Getter/Setter]", "special") : t.stylize("[Getter]", "special") : l.set && (u = t.stylize("[Setter]", "special")), T(r, i) || (a = "[" + i + "]"), u || (t.seen.indexOf(l.value) < 0 ? (u = g(n) ? s(t, l.value, null) : s(t, l.value, n - 1), u.indexOf("\n") > -1 && (u = o ? u.split("\n").map(function (t) { return "  " + t }).join("\n").substr(2) : "\n" + u.split("\n").map(function (t) { return "   " + t }).join("\n"))) : u = t.stylize("[Circular]", "special")), w(a)) { if (o && i.match(/^\d+$/)) return u; a = JSON.stringify("" + i), a.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (a = a.substr(1, a.length - 2), a = t.stylize(a, "name")) : (a = a.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), a = t.stylize(a, "string")) } return a + ": " + u } function h(t, e, n) { var r = 0; return t.reduce(function (t, e) { return r++ , e.indexOf("\n") >= 0 && r++ , t + e.replace(/\u001b\[\d\d?m/g, "").length + 1 }, 0) > 60 ? n[0] + ("" === e ? "" : e + "\n ") + " " + t.join(",\n  ") + " " + n[1] : n[0] + e + " " + t.join(", ") + " " + n[1] } function d(t) { return Array.isArray(t) } function p(t) { return "boolean" == typeof t } function g(t) { return null === t } function v(t) { return null == t } function y(t) { return "number" == typeof t } function b(t) { return "string" == typeof t } function m(t) { return "symbol" == typeof t } function w(t) { return void 0 === t } function x(t) { return _(t) && "[object RegExp]" === P(t) } function _(t) { return "object" == typeof t && null !== t } function k(t) { return _(t) && "[object Date]" === P(t) } function S(t) { return _(t) && ("[object Error]" === P(t) || t instanceof Error) } function C(t) { return "function" == typeof t } function A(t) { return null === t || "boolean" == typeof t || "number" == typeof t || "string" == typeof t || "symbol" == typeof t || void 0 === t } function P(t) { return Object.prototype.toString.call(t) } function E(t) { return t < 10 ? "0" + t.toString(10) : t.toString(10) } function O() { var t = new Date, e = [E(t.getHours()), E(t.getMinutes()), E(t.getSeconds())].join(":"); return [t.getDate(), D[t.getMonth()], e].join(" ") } function T(t, e) { return Object.prototype.hasOwnProperty.call(t, e) } function I(t, e) { if (!t) { var n = new Error("Promise was rejected with a falsy value"); n.reason = t, t = n } return e(t) } function B(e) { function n() { for (var n = [], r = 0; r < arguments.length; r++)n.push(arguments[r]); var i = n.pop(); if ("function" != typeof i) throw new TypeError("The last argument must be of type Function"); var o = this, a = function () { return i.apply(o, arguments) }; e.apply(this, n).then(function (e) { t.nextTick(a, null, e) }, function (e) { t.nextTick(I, e, a) }) } if ("function" != typeof e) throw new TypeError('The "original" argument must be of type Function'); return Object.setPrototypeOf(n, Object.getPrototypeOf(e)), Object.defineProperties(n, L(e)), n } var L = Object.getOwnPropertyDescriptors || function (t) { for (var e = Object.keys(t), n = {}, r = 0; r < e.length; r++)n[e[r]] = Object.getOwnPropertyDescriptor(t, e[r]); return n }, R = /%[sdj%]/g; e.format = function (t) { if (!b(t)) { for (var e = [], n = 0; n < arguments.length; n++)e.push(r(arguments[n])); return e.join(" ") } for (var n = 1, i = arguments, o = i.length, a = String(t).replace(R, function (t) { if ("%%" === t) return "%"; if (n >= o) return t; switch (t) { case "%s": return String(i[n++]); case "%d": return Number(i[n++]); case "%j": try { return JSON.stringify(i[n++]) } catch (t) { return "[Circular]" } default: return t } }), s = i[n]; n < o; s = i[++n])g(s) || !_(s) ? a += " " + s : a += " " + r(s); return a }, e.deprecate = function (n, r) { function i() { if (!o) { if (t.throwDeprecation) throw new Error(r); t.traceDeprecation ? console.trace(r) : console.error(r), o = !0 } return n.apply(this, arguments) } if (void 0 !== t && !0 === t.noDeprecation) return n; if (void 0 === t) return function () { return e.deprecate(n, r).apply(this, arguments) }; var o = !1; return i }; var M, F = {}; e.debuglog = function (n) { if (w(M) && (M = t.env.NODE_DEBUG || ""), n = n.toUpperCase(), !F[n]) if (new RegExp("\\b" + n + "\\b", "i").test(M)) { var r = t.pid; F[n] = function () { var t = e.format.apply(e, arguments); console.error("%s %d: %s", n, r, t) } } else F[n] = function () { }; return F[n] }, e.inspect = r, r.colors = { bold: [1, 22], italic: [3, 23], underline: [4, 24], inverse: [7, 27], white: [37, 39], grey: [90, 39], black: [30, 39], blue: [34, 39], cyan: [36, 39], green: [32, 39], magenta: [35, 39], red: [31, 39], yellow: [33, 39] }, r.styles = { special: "cyan", number: "yellow", boolean: "yellow", undefined: "grey", null: "bold", string: "green", date: "magenta", regexp: "red" }, e.isArray = d, e.isBoolean = p, e.isNull = g, e.isNullOrUndefined = v, e.isNumber = y, e.isString = b, e.isSymbol = m, e.isUndefined = w, e.isRegExp = x, e.isObject = _, e.isDate = k, e.isError = S, e.isFunction = C, e.isPrimitive = A, e.isBuffer = n(255); var D = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; e.log = function () { console.log("%s - %s", O(), e.format.apply(e, arguments)) }, e.inherits = n(32), e._extend = function (t, e) { if (!e || !_(e)) return t; for (var n = Object.keys(e), r = n.length; r--;)t[n[r]] = e[n[r]]; return t }; var z = "undefined" != typeof Symbol ? Symbol("util.promisify.custom") : void 0; e.promisify = function (t) { function e() { for (var e, n, r = new Promise(function (t, r) { e = t, n = r }), i = [], o = 0; o < arguments.length; o++)i.push(arguments[o]); i.push(function (t, r) { t ? n(t) : e(r) }); try { t.apply(this, i) } catch (t) { n(t) } return r } if ("function" != typeof t) throw new TypeError('The "original" argument must be of type Function'); if (z && t[z]) { var e = t[z]; if ("function" != typeof e) throw new TypeError('The "util.promisify.custom" argument must be of type Function'); return Object.defineProperty(e, z, { value: e, enumerable: !1, writable: !1, configurable: !0 }), e } return Object.setPrototypeOf(e, Object.getPrototypeOf(t)), z && Object.defineProperty(e, z, { value: e, enumerable: !1, writable: !1, configurable: !0 }), Object.defineProperties(e, L(t)) }, e.promisify.custom = z, e.callbackify = B }).call(e, n(21)) }, function (t, e, n) { !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) { return function () { var e = t, n = e.lib, r = n.WordArray, i = n.Hasher, o = e.algo, a = [], s = o.SHA1 = i.extend({ _doReset: function () { this._hash = new r.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (t, e) { for (var n = this._hash.words, r = n[0], i = n[1], o = n[2], s = n[3], u = n[4], l = 0; l < 80; l++) { if (l < 16) a[l] = 0 | t[e + l]; else { var c = a[l - 3] ^ a[l - 8] ^ a[l - 14] ^ a[l - 16]; a[l] = c << 1 | c >>> 31 } var f = (r << 5 | r >>> 27) + u + a[l]; f += l < 20 ? 1518500249 + (i & o | ~i & s) : l < 40 ? 1859775393 + (i ^ o ^ s) : l < 60 ? (i & o | i & s | o & s) - 1894007588 : (i ^ o ^ s) - 899497514, u = s, s = o, o = i << 30 | i >>> 2, i = r, r = f } n[0] = n[0] + r | 0, n[1] = n[1] + i | 0, n[2] = n[2] + o | 0, n[3] = n[3] + s | 0, n[4] = n[4] + u | 0 }, _doFinalize: function () { var t = this._data, e = t.words, n = 8 * this._nDataBytes, r = 8 * t.sigBytes; return e[r >>> 5] |= 128 << 24 - r % 32, e[14 + (r + 64 >>> 9 << 4)] = Math.floor(n / 4294967296), e[15 + (r + 64 >>> 9 << 4)] = n, t.sigBytes = 4 * e.length, this._process(), this._hash }, clone: function () { var t = i.clone.call(this); return t._hash = this._hash.clone(), t } }); e.SHA1 = i._createHelper(s), e.HmacSHA1 = i._createHmacHelper(s) }(), t.SHA1 }) }, function (t, e, n) { !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) { !function () { var e = t, n = e.lib, r = n.Base, i = e.enc, o = i.Utf8, a = e.algo; a.HMAC = r.extend({ init: function (t, e) { t = this._hasher = new t.init, "string" == typeof e && (e = o.parse(e)); var n = t.blockSize, r = 4 * n; e.sigBytes > r && (e = t.finalize(e)), e.clamp(); for (var i = this._oKey = e.clone(), a = this._iKey = e.clone(), s = i.words, u = a.words, l = 0; l < n; l++)s[l] ^= 1549556828, u[l] ^= 909522486; i.sigBytes = a.sigBytes = r, this.reset() }, reset: function () { var t = this._hasher; t.reset(), t.update(this._iKey) }, update: function (t) { return this._hasher.update(t), this }, finalize: function (t) { var e = this._hasher, n = e.finalize(t); return e.reset(), e.finalize(this._oKey.clone().concat(n)) } }) }() }) }, function (t, e, n) { (function (e) { (function () { var r, i; try { i = n(110) } catch (t) { } r = function () { function t(t) { this.buffer = t, this.pos = 0, this.length = this.buffer.length } var n; t.TYPES = { UInt8: 1, UInt16: 2, UInt24: 3, UInt32: 4, Int8: 1, Int16: 2, Int24: 3, Int32: 4, Float: 4, Double: 8 }; for (n in e.prototype) "read" === n.slice(0, 4) && function (e) { var n; n = t.TYPES[e.replace(/read|[BL]E/g, "")], t.prototype[e] = function () { var t; return t = this.buffer[e](this.pos), this.pos += n, t } }(n); return t.prototype.readString = function (t, n) { var r, o, a, s, u; switch (null == n && (n = "ascii"), n) { case "utf16le": case "ucs2": case "utf8": case "ascii": return this.buffer.toString(n, this.pos, this.pos += t); case "utf16be": for (r = new e(this.readBuffer(t)), a = s = 0, u = r.length - 1; s < u; a = s += 2)o = r[a], r[a] = r[a + 1], r[a + 1] = o; return r.toString("utf16le"); default: if (r = this.readBuffer(t), i) try { return i.decode(r, n) } catch (t) { } return r } }, t.prototype.readBuffer = function (t) { return this.buffer.slice(this.pos, this.pos += t) }, t.prototype.readUInt24BE = function () { return (this.readUInt16BE() << 8) + this.readUInt8() }, t.prototype.readUInt24LE = function () { return this.readUInt16LE() + (this.readUInt8() << 16) }, t.prototype.readInt24BE = function () { return (this.readInt16BE() << 8) + this.readUInt8() }, t.prototype.readInt24LE = function () { return this.readUInt16LE() + (this.readInt8() << 16) }, t }(), t.exports = r }).call(this) }).call(e, n(3).Buffer) }, function (t, e, n) { "use strict"; (function (e) { var r = n(47).Buffer, i = n(300), o = t.exports; o.encodings = null, o.defaultCharUnicode = "�", o.defaultCharSingleByte = "?", o.encode = function (t, e, n) { t = "" + (t || ""); var i = o.getEncoder(e, n), a = i.write(t), s = i.end(); return s && s.length > 0 ? r.concat([a, s]) : a }, o.decode = function (t, e, n) { "string" == typeof t && (o.skipDecodeWarning || (console.error("Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding"), o.skipDecodeWarning = !0), t = r.from("" + (t || ""), "binary")); var i = o.getDecoder(e, n), a = i.write(t), s = i.end(); return s ? a + s : a }, o.encodingExists = function (t) { try { return o.getCodec(t), !0 } catch (t) { return !1 } }, o.toEncoding = o.encode, o.fromEncoding = o.decode, o._codecDataCache = {}, o.getCodec = function (t) { o.encodings || (o.encodings = n(301)); for (var e = o._canonicalizeEncoding(t), r = {}; ;) { var i = o._codecDataCache[e]; if (i) return i; var a = o.encodings[e]; switch (typeof a) { case "string": e = a; break; case "object": for (var s in a) r[s] = a[s]; r.encodingName || (r.encodingName = e), e = a.type; break; case "function": return r.encodingName || (r.encodingName = e), i = new a(r, o), o._codecDataCache[r.encodingName] = i, i; default: throw new Error("Encoding not recognized: '" + t + "' (searched as: '" + e + "')") } } }, o._canonicalizeEncoding = function (t) { return ("" + t).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "") }, o.getEncoder = function (t, e) { var n = o.getCodec(t), r = new n.encoder(e, n); return n.bomAware && e && e.addBOM && (r = new i.PrependBOM(r, e)), r }, o.getDecoder = function (t, e) { var n = o.getCodec(t), r = new n.decoder(e, n); return !n.bomAware || e && !1 === e.stripBOM || (r = new i.StripBOM(r, e)), r }; var a = void 0 !== e && e.versions && e.versions.node; if (a) { var s = a.split(".").map(Number); (s[0] > 0 || s[1] >= 10) && n(315)(o), n(316)(o) } }).call(e, n(21)) }, function (t, e) { t.exports = [["0", "\0", 127, "€"], ["8140", "丂丄丅丆丏丒丗丟丠両丣並丩丮丯丱丳丵丷丼乀乁乂乄乆乊乑乕乗乚乛乢乣乤乥乧乨乪", 5, "乲乴", 9, "乿", 6, "亇亊"], ["8180", "亐亖亗亙亜亝亞亣亪亯亰亱亴亶亷亸亹亼亽亾仈仌仏仐仒仚仛仜仠仢仦仧仩仭仮仯仱仴仸仹仺仼仾伀伂", 6, "伋伌伒", 4, "伜伝伡伣伨伩伬伭伮伱伳伵伷伹伻伾", 4, "佄佅佇", 5, "佒佔佖佡佢佦佨佪佫佭佮佱佲併佷佸佹佺佽侀侁侂侅來侇侊侌侎侐侒侓侕侖侘侙侚侜侞侟価侢"], ["8240", "侤侫侭侰", 4, "侶", 8, "俀俁係俆俇俈俉俋俌俍俒", 4, "俙俛俠俢俤俥俧俫俬俰俲俴俵俶俷俹俻俼俽俿", 11], ["8280", "個倎倐們倓倕倖倗倛倝倞倠倢倣値倧倫倯", 10, "倻倽倿偀偁偂偄偅偆偉偊偋偍偐", 4, "偖偗偘偙偛偝", 7, "偦", 5, "偭", 8, "偸偹偺偼偽傁傂傃傄傆傇傉傊傋傌傎", 20, "傤傦傪傫傭", 4, "傳", 6, "傼"], ["8340", "傽", 17, "僐", 5, "僗僘僙僛", 10, "僨僩僪僫僯僰僱僲僴僶", 4, "僼", 9, "儈"], ["8380", "儉儊儌", 5, "儓", 13, "儢", 28, "兂兇兊兌兎兏児兒兓兗兘兙兛兝", 4, "兣兤兦內兩兪兯兲兺兾兿冃冄円冇冊冋冎冏冐冑冓冔冘冚冝冞冟冡冣冦", 4, "冭冮冴冸冹冺冾冿凁凂凃凅凈凊凍凎凐凒", 5], ["8440", "凘凙凚凜凞凟凢凣凥", 5, "凬凮凱凲凴凷凾刄刅刉刋刌刏刐刓刔刕刜刞刟刡刢刣別刦刧刪刬刯刱刲刴刵刼刾剄", 5, "剋剎剏剒剓剕剗剘"], ["8480", "剙剚剛剝剟剠剢剣剤剦剨剫剬剭剮剰剱剳", 9, "剾劀劃", 4, "劉", 6, "劑劒劔", 6, "劜劤劥劦劧劮劯劰労", 9, "勀勁勂勄勅勆勈勊勌勍勎勏勑勓勔動勗務", 5, "勠勡勢勣勥", 10, "勱", 7, "勻勼勽匁匂匃匄匇匉匊匋匌匎"], ["8540", "匑匒匓匔匘匛匜匞匟匢匤匥匧匨匩匫匬匭匯", 9, "匼匽區卂卄卆卋卌卍卐協単卙卛卝卥卨卪卬卭卲卶卹卻卼卽卾厀厁厃厇厈厊厎厏"], ["8580", "厐", 4, "厖厗厙厛厜厞厠厡厤厧厪厫厬厭厯", 6, "厷厸厹厺厼厽厾叀參", 4, "収叏叐叒叓叕叚叜叝叞叡叢叧叴叺叾叿吀吂吅吇吋吔吘吙吚吜吢吤吥吪吰吳吶吷吺吽吿呁呂呄呅呇呉呌呍呎呏呑呚呝", 4, "呣呥呧呩", 7, "呴呹呺呾呿咁咃咅咇咈咉咊咍咑咓咗咘咜咞咟咠咡"], ["8640", "咢咥咮咰咲咵咶咷咹咺咼咾哃哅哊哋哖哘哛哠", 4, "哫哬哯哰哱哴", 5, "哻哾唀唂唃唄唅唈唊", 4, "唒唓唕", 5, "唜唝唞唟唡唥唦"], ["8680", "唨唩唫唭唲唴唵唶唸唹唺唻唽啀啂啅啇啈啋", 4, "啑啒啓啔啗", 4, "啝啞啟啠啢啣啨啩啫啯", 5, "啹啺啽啿喅喆喌喍喎喐喒喓喕喖喗喚喛喞喠", 6, "喨", 8, "喲喴営喸喺喼喿", 4, "嗆嗇嗈嗊嗋嗎嗏嗐嗕嗗", 4, "嗞嗠嗢嗧嗩嗭嗮嗰嗱嗴嗶嗸", 4, "嗿嘂嘃嘄嘅"], ["8740", "嘆嘇嘊嘋嘍嘐", 7, "嘙嘚嘜嘝嘠嘡嘢嘥嘦嘨嘩嘪嘫嘮嘯嘰嘳嘵嘷嘸嘺嘼嘽嘾噀", 11, "噏", 4, "噕噖噚噛噝", 4], ["8780", "噣噥噦噧噭噮噯噰噲噳噴噵噷噸噹噺噽", 7, "嚇", 6, "嚐嚑嚒嚔", 14, "嚤", 10, "嚰", 6, "嚸嚹嚺嚻嚽", 12, "囋", 8, "囕囖囘囙囜団囥", 5, "囬囮囯囲図囶囷囸囻囼圀圁圂圅圇國", 6], ["8840", "園", 9, "圝圞圠圡圢圤圥圦圧圫圱圲圴", 4, "圼圽圿坁坃坄坅坆坈坉坋坒", 4, "坘坙坢坣坥坧坬坮坰坱坲坴坵坸坹坺坽坾坿垀"], ["8880", "垁垇垈垉垊垍", 4, "垔", 6, "垜垝垞垟垥垨垪垬垯垰垱垳垵垶垷垹", 8, "埄", 6, "埌埍埐埑埓埖埗埛埜埞埡埢埣埥", 7, "埮埰埱埲埳埵埶執埻埼埾埿堁堃堄堅堈堉堊堌堎堏堐堒堓堔堖堗堘堚堛堜堝堟堢堣堥", 4, "堫", 4, "報堲堳場堶", 7], ["8940", "堾", 5, "塅", 6, "塎塏塐塒塓塕塖塗塙", 4, "塟", 5, "塦", 4, "塭", 16, "塿墂墄墆墇墈墊墋墌"], ["8980", "墍", 4, "墔", 4, "墛墜墝墠", 7, "墪", 17, "墽墾墿壀壂壃壄壆", 10, "壒壓壔壖", 13, "壥", 5, "壭壯壱売壴壵壷壸壺", 7, "夃夅夆夈", 4, "夎夐夑夒夓夗夘夛夝夞夠夡夢夣夦夨夬夰夲夳夵夶夻"], ["8a40", "夽夾夿奀奃奅奆奊奌奍奐奒奓奙奛", 4, "奡奣奤奦", 12, "奵奷奺奻奼奾奿妀妅妉妋妌妎妏妐妑妔妕妘妚妛妜妝妟妠妡妢妦"], ["8a80", "妧妬妭妰妱妳", 5, "妺妼妽妿", 6, "姇姈姉姌姍姎姏姕姖姙姛姞", 4, "姤姦姧姩姪姫姭", 11, "姺姼姽姾娀娂娊娋娍娎娏娐娒娔娕娖娗娙娚娛娝娞娡娢娤娦娧娨娪", 6, "娳娵娷", 4, "娽娾娿婁", 4, "婇婈婋", 9, "婖婗婘婙婛", 5], ["8b40", "婡婣婤婥婦婨婩婫", 8, "婸婹婻婼婽婾媀", 17, "媓", 6, "媜", 13, "媫媬"], ["8b80", "媭", 4, "媴媶媷媹", 4, "媿嫀嫃", 5, "嫊嫋嫍", 4, "嫓嫕嫗嫙嫚嫛嫝嫞嫟嫢嫤嫥嫧嫨嫪嫬", 4, "嫲", 22, "嬊", 11, "嬘", 25, "嬳嬵嬶嬸", 7, "孁", 6], ["8c40", "孈", 7, "孒孖孞孠孡孧孨孫孭孮孯孲孴孶孷學孹孻孼孾孿宂宆宊宍宎宐宑宒宔宖実宧宨宩宬宭宮宯宱宲宷宺宻宼寀寁寃寈寉寊寋寍寎寏"], ["8c80", "寑寔", 8, "寠寢寣實寧審", 4, "寯寱", 6, "寽対尀専尃尅將專尋尌對導尐尒尓尗尙尛尞尟尠尡尣尦尨尩尪尫尭尮尯尰尲尳尵尶尷屃屄屆屇屌屍屒屓屔屖屗屘屚屛屜屝屟屢層屧", 6, "屰屲", 6, "屻屼屽屾岀岃", 4, "岉岊岋岎岏岒岓岕岝", 4, "岤", 4], ["8d40", "岪岮岯岰岲岴岶岹岺岻岼岾峀峂峃峅", 5, "峌", 5, "峓", 5, "峚", 6, "峢峣峧峩峫峬峮峯峱", 9, "峼", 4], ["8d80", "崁崄崅崈", 5, "崏", 4, "崕崗崘崙崚崜崝崟", 4, "崥崨崪崫崬崯", 4, "崵", 7, "崿", 7, "嵈嵉嵍", 10, "嵙嵚嵜嵞", 10, "嵪嵭嵮嵰嵱嵲嵳嵵", 12, "嶃", 21, "嶚嶛嶜嶞嶟嶠"], ["8e40", "嶡", 21, "嶸", 12, "巆", 6, "巎", 12, "巜巟巠巣巤巪巬巭"], ["8e80", "巰巵巶巸", 4, "巿帀帄帇帉帊帋帍帎帒帓帗帞", 7, "帨", 4, "帯帰帲", 4, "帹帺帾帿幀幁幃幆", 5, "幍", 6, "幖", 4, "幜幝幟幠幣", 14, "幵幷幹幾庁庂広庅庈庉庌庍庎庒庘庛庝庡庢庣庤庨", 4, "庮", 4, "庴庺庻庼庽庿", 6], ["8f40", "廆廇廈廋", 5, "廔廕廗廘廙廚廜", 11, "廩廫", 8, "廵廸廹廻廼廽弅弆弇弉弌弍弎弐弒弔弖弙弚弜弝弞弡弢弣弤"], ["8f80", "弨弫弬弮弰弲", 6, "弻弽弾弿彁", 14, "彑彔彙彚彛彜彞彟彠彣彥彧彨彫彮彯彲彴彵彶彸彺彽彾彿徃徆徍徎徏徑従徔徖徚徛徝從徟徠徢", 5, "復徫徬徯", 5, "徶徸徹徺徻徾", 4, "忇忈忊忋忎忓忔忕忚忛応忞忟忢忣忥忦忨忩忬忯忰忲忳忴忶忷忹忺忼怇"], ["9040", "怈怉怋怌怐怑怓怗怘怚怞怟怢怣怤怬怭怮怰", 4, "怶", 4, "怽怾恀恄", 6, "恌恎恏恑恓恔恖恗恘恛恜恞恟恠恡恥恦恮恱恲恴恵恷恾悀"], ["9080", "悁悂悅悆悇悈悊悋悎悏悐悑悓悕悗悘悙悜悞悡悢悤悥悧悩悪悮悰悳悵悶悷悹悺悽", 7, "惇惈惉惌", 4, "惒惓惔惖惗惙惛惞惡", 4, "惪惱惲惵惷惸惻", 4, "愂愃愄愅愇愊愋愌愐", 4, "愖愗愘愙愛愜愝愞愡愢愥愨愩愪愬", 18, "慀", 6], ["9140", "慇慉態慍慏慐慒慓慔慖", 6, "慞慟慠慡慣慤慥慦慩", 6, "慱慲慳慴慶慸", 18, "憌憍憏", 4, "憕"], ["9180", "憖", 6, "憞", 8, "憪憫憭", 9, "憸", 5, "憿懀懁懃", 4, "應懌", 4, "懓懕", 16, "懧", 13, "懶", 8, "戀", 5, "戇戉戓戔戙戜戝戞戠戣戦戧戨戩戫戭戯戰戱戲戵戶戸", 4, "扂扄扅扆扊"], ["9240", "扏扐払扖扗扙扚扜", 6, "扤扥扨扱扲扴扵扷扸扺扻扽抁抂抃抅抆抇抈抋", 5, "抔抙抜抝択抣抦抧抩抪抭抮抯抰抲抳抴抶抷抸抺抾拀拁"], ["9280", "拃拋拏拑拕拝拞拠拡拤拪拫拰拲拵拸拹拺拻挀挃挄挅挆挊挋挌挍挏挐挒挓挔挕挗挘挙挜挦挧挩挬挭挮挰挱挳", 5, "挻挼挾挿捀捁捄捇捈捊捑捒捓捔捖", 7, "捠捤捥捦捨捪捫捬捯捰捲捳捴捵捸捹捼捽捾捿掁掃掄掅掆掋掍掑掓掔掕掗掙", 6, "採掤掦掫掯掱掲掵掶掹掻掽掿揀"], ["9340", "揁揂揃揅揇揈揊揋揌揑揓揔揕揗", 6, "揟揢揤", 4, "揫揬揮揯揰揱揳揵揷揹揺揻揼揾搃搄搆", 4, "損搎搑搒搕", 5, "搝搟搢搣搤"], ["9380", "搥搧搨搩搫搮", 5, "搵", 4, "搻搼搾摀摂摃摉摋", 6, "摓摕摖摗摙", 4, "摟", 7, "摨摪摫摬摮", 9, "摻", 6, "撃撆撈", 8, "撓撔撗撘撚撛撜撝撟", 4, "撥撦撧撨撪撫撯撱撲撳撴撶撹撻撽撾撿擁擃擄擆", 6, "擏擑擓擔擕擖擙據"], ["9440", "擛擜擝擟擠擡擣擥擧", 24, "攁", 7, "攊", 7, "攓", 4, "攙", 8], ["9480", "攢攣攤攦", 4, "攬攭攰攱攲攳攷攺攼攽敀", 4, "敆敇敊敋敍敎敐敒敓敔敗敘敚敜敟敠敡敤敥敧敨敩敪敭敮敯敱敳敵敶數", 14, "斈斉斊斍斎斏斒斔斕斖斘斚斝斞斠斢斣斦斨斪斬斮斱", 7, "斺斻斾斿旀旂旇旈旉旊旍旐旑旓旔旕旘", 7, "旡旣旤旪旫"], ["9540", "旲旳旴旵旸旹旻", 4, "昁昄昅昇昈昉昋昍昐昑昒昖昗昘昚昛昜昞昡昢昣昤昦昩昪昫昬昮昰昲昳昷", 4, "昽昿晀時晄", 6, "晍晎晐晑晘"], ["9580", "晙晛晜晝晞晠晢晣晥晧晩", 4, "晱晲晳晵晸晹晻晼晽晿暀暁暃暅暆暈暉暊暋暍暎暏暐暒暓暔暕暘", 4, "暞", 8, "暩", 4, "暯", 4, "暵暶暷暸暺暻暼暽暿", 25, "曚曞", 7, "曧曨曪", 5, "曱曵曶書曺曻曽朁朂會"], ["9640", "朄朅朆朇朌朎朏朑朒朓朖朘朙朚朜朞朠", 5, "朧朩朮朰朲朳朶朷朸朹朻朼朾朿杁杄杅杇杊杋杍杒杔杕杗", 4, "杝杢杣杤杦杧杫杬杮東杴杶"], ["9680", "杸杹杺杻杽枀枂枃枅枆枈枊枌枍枎枏枑枒枓枔枖枙枛枟枠枡枤枦枩枬枮枱枲枴枹", 7, "柂柅", 9, "柕柖柗柛柟柡柣柤柦柧柨柪柫柭柮柲柵", 7, "柾栁栂栃栄栆栍栐栒栔栕栘", 4, "栞栟栠栢", 6, "栫", 6, "栴栵栶栺栻栿桇桋桍桏桒桖", 5], ["9740", "桜桝桞桟桪桬", 7, "桵桸", 8, "梂梄梇", 7, "梐梑梒梔梕梖梘", 9, "梣梤梥梩梪梫梬梮梱梲梴梶梷梸"], ["9780", "梹", 6, "棁棃", 5, "棊棌棎棏棐棑棓棔棖棗棙棛", 4, "棡棢棤", 9, "棯棲棳棴棶棷棸棻棽棾棿椀椂椃椄椆", 4, "椌椏椑椓", 11, "椡椢椣椥", 7, "椮椯椱椲椳椵椶椷椸椺椻椼椾楀楁楃", 16, "楕楖楘楙楛楜楟"], ["9840", "楡楢楤楥楧楨楩楪楬業楯楰楲", 4, "楺楻楽楾楿榁榃榅榊榋榌榎", 5, "榖榗榙榚榝", 9, "榩榪榬榮榯榰榲榳榵榶榸榹榺榼榽"], ["9880", "榾榿槀槂", 7, "構槍槏槑槒槓槕", 5, "槜槝槞槡", 11, "槮槯槰槱槳", 9, "槾樀", 9, "樋", 11, "標", 5, "樠樢", 5, "権樫樬樭樮樰樲樳樴樶", 6, "樿", 4, "橅橆橈", 7, "橑", 6, "橚"], ["9940", "橜", 4, "橢橣橤橦", 10, "橲", 6, "橺橻橽橾橿檁檂檃檅", 8, "檏檒", 4, "檘", 7, "檡", 5], ["9980", "檧檨檪檭", 114, "欥欦欨", 6], ["9a40", "欯欰欱欳欴欵欶欸欻欼欽欿歀歁歂歄歅歈歊歋歍", 11, "歚", 7, "歨歩歫", 13, "歺歽歾歿殀殅殈"], ["9a80", "殌殎殏殐殑殔殕殗殘殙殜", 4, "殢", 7, "殫", 7, "殶殸", 6, "毀毃毄毆", 4, "毌毎毐毑毘毚毜", 4, "毢", 7, "毬毭毮毰毱毲毴毶毷毸毺毻毼毾", 6, "氈", 4, "氎氒気氜氝氞氠氣氥氫氬氭氱氳氶氷氹氺氻氼氾氿汃汄汅汈汋", 4, "汑汒汓汖汘"], ["9b40", "汙汚汢汣汥汦汧汫", 4, "汱汳汵汷汸決汻汼汿沀沄沇沊沋沍沎沑沒沕沖沗沘沚沜沝沞沠沢沨沬沯沰沴沵沶沷沺泀況泂泃泆泇泈泋泍泎泏泑泒泘"], ["9b80", "泙泚泜泝泟泤泦泧泩泬泭泲泴泹泿洀洂洃洅洆洈洉洊洍洏洐洑洓洔洕洖洘洜洝洟", 5, "洦洨洩洬洭洯洰洴洶洷洸洺洿浀浂浄浉浌浐浕浖浗浘浛浝浟浡浢浤浥浧浨浫浬浭浰浱浲浳浵浶浹浺浻浽", 4, "涃涄涆涇涊涋涍涏涐涒涖", 4, "涜涢涥涬涭涰涱涳涴涶涷涹", 5, "淁淂淃淈淉淊"], ["9c40", "淍淎淏淐淒淓淔淕淗淚淛淜淟淢淣淥淧淨淩淪淭淯淰淲淴淵淶淸淺淽", 7, "渆渇済渉渋渏渒渓渕渘渙減渜渞渟渢渦渧渨渪測渮渰渱渳渵"], ["9c80", "渶渷渹渻", 7, "湅", 7, "湏湐湑湒湕湗湙湚湜湝湞湠", 10, "湬湭湯", 14, "満溁溂溄溇溈溊", 4, "溑", 6, "溙溚溛溝溞溠溡溣溤溦溨溩溫溬溭溮溰溳溵溸溹溼溾溿滀滃滄滅滆滈滉滊滌滍滎滐滒滖滘滙滛滜滝滣滧滪", 5], ["9d40", "滰滱滲滳滵滶滷滸滺", 7, "漃漄漅漇漈漊", 4, "漐漑漒漖", 9, "漡漢漣漥漦漧漨漬漮漰漲漴漵漷", 6, "漿潀潁潂"], ["9d80", "潃潄潅潈潉潊潌潎", 9, "潙潚潛潝潟潠潡潣潤潥潧", 5, "潯潰潱潳潵潶潷潹潻潽", 6, "澅澆澇澊澋澏", 12, "澝澞澟澠澢", 4, "澨", 10, "澴澵澷澸澺", 5, "濁濃", 5, "濊", 6, "濓", 10, "濟濢濣濤濥"], ["9e40", "濦", 7, "濰", 32, "瀒", 7, "瀜", 6, "瀤", 6], ["9e80", "瀫", 9, "瀶瀷瀸瀺", 17, "灍灎灐", 13, "灟", 11, "灮灱灲灳灴灷灹灺灻災炁炂炃炄炆炇炈炋炌炍炏炐炑炓炗炘炚炛炞", 12, "炰炲炴炵炶為炾炿烄烅烆烇烉烋", 12, "烚"], ["9f40", "烜烝烞烠烡烢烣烥烪烮烰", 6, "烸烺烻烼烾", 10, "焋", 4, "焑焒焔焗焛", 10, "焧", 7, "焲焳焴"], ["9f80", "焵焷", 13, "煆煇煈煉煋煍煏", 12, "煝煟", 4, "煥煩", 4, "煯煰煱煴煵煶煷煹煻煼煾", 5, "熅", 4, "熋熌熍熎熐熑熒熓熕熖熗熚", 4, "熡", 6, "熩熪熫熭", 5, "熴熶熷熸熺", 8, "燄", 9, "燏", 4], ["a040", "燖", 9, "燡燢燣燤燦燨", 5, "燯", 9, "燺", 11, "爇", 19], ["a080", "爛爜爞", 9, "爩爫爭爮爯爲爳爴爺爼爾牀", 6, "牉牊牋牎牏牐牑牓牔牕牗牘牚牜牞牠牣牤牥牨牪牫牬牭牰牱牳牴牶牷牸牻牼牽犂犃犅", 4, "犌犎犐犑犓", 11, "犠", 11, "犮犱犲犳犵犺", 6, "狅狆狇狉狊狋狌狏狑狓狔狕狖狘狚狛"], ["a1a1", "　、。·ˉˇ¨〃々—～‖…‘’“”〔〕〈", 7, "〖〗【】±×÷∶∧∨∑∏∪∩∈∷√⊥∥∠⌒⊙∫∮≡≌≈∽∝≠≮≯≤≥∞∵∴♂♀°′″℃＄¤￠￡‰§№☆★○●◎◇◆□■△▲※→←↑↓〓"], ["a2a1", "ⅰ", 9], ["a2b1", "⒈", 19, "⑴", 19, "①", 9], ["a2e5", "㈠", 9], ["a2f1", "Ⅰ", 11], ["a3a1", "！＂＃￥％", 88, "￣"], ["a4a1", "ぁ", 82], ["a5a1", "ァ", 85], ["a6a1", "Α", 16, "Σ", 6], ["a6c1", "α", 16, "σ", 6], ["a6e0", "︵︶︹︺︿﹀︽︾﹁﹂﹃﹄"], ["a6ee", "︻︼︷︸︱"], ["a6f4", "︳︴"], ["a7a1", "А", 5, "ЁЖ", 25], ["a7d1", "а", 5, "ёж", 25], ["a840", "ˊˋ˙–―‥‵℅℉↖↗↘↙∕∟∣≒≦≧⊿═", 35, "▁", 6], ["a880", "█", 7, "▓▔▕▼▽◢◣◤◥☉⊕〒〝〞"], ["a8a1", "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêɑ"], ["a8bd", "ńň"], ["a8c0", "ɡ"], ["a8c5", "ㄅ", 36], ["a940", "〡", 8, "㊣㎎㎏㎜㎝㎞㎡㏄㏎㏑㏒㏕︰￢￤"], ["a959", "℡㈱"], ["a95c", "‐"], ["a960", "ー゛゜ヽヾ〆ゝゞ﹉", 9, "﹔﹕﹖﹗﹙", 8], ["a980", "﹢", 4, "﹨﹩﹪﹫"], ["a996", "〇"], ["a9a4", "─", 75], ["aa40", "狜狝狟狢", 5, "狪狫狵狶狹狽狾狿猀猂猄", 5, "猋猌猍猏猐猑猒猔猘猙猚猟猠猣猤猦猧猨猭猯猰猲猳猵猶猺猻猼猽獀", 8], ["aa80", "獉獊獋獌獎獏獑獓獔獕獖獘", 7, "獡", 10, "獮獰獱"], ["ab40", "獲", 11, "獿", 4, "玅玆玈玊玌玍玏玐玒玓玔玕玗玘玙玚玜玝玞玠玡玣", 5, "玪玬玭玱玴玵玶玸玹玼玽玾玿珁珃", 4], ["ab80", "珋珌珎珒", 6, "珚珛珜珝珟珡珢珣珤珦珨珪珫珬珮珯珰珱珳", 4], ["ac40", "珸", 10, "琄琇琈琋琌琍琎琑", 8, "琜", 5, "琣琤琧琩琫琭琯琱琲琷", 4, "琽琾琿瑀瑂", 11], ["ac80", "瑎", 6, "瑖瑘瑝瑠", 12, "瑮瑯瑱", 4, "瑸瑹瑺"], ["ad40", "瑻瑼瑽瑿璂璄璅璆璈璉璊璌璍璏璑", 10, "璝璟", 7, "璪", 15, "璻", 12], ["ad80", "瓈", 9, "瓓", 8, "瓝瓟瓡瓥瓧", 6, "瓰瓱瓲"], ["ae40", "瓳瓵瓸", 6, "甀甁甂甃甅", 7, "甎甐甒甔甕甖甗甛甝甞甠", 4, "甦甧甪甮甴甶甹甼甽甿畁畂畃畄畆畇畉畊畍畐畑畒畓畕畖畗畘"], ["ae80", "畝", 7, "畧畨畩畫", 6, "畳畵當畷畺", 4, "疀疁疂疄疅疇"], ["af40", "疈疉疊疌疍疎疐疓疕疘疛疜疞疢疦", 4, "疭疶疷疺疻疿痀痁痆痋痌痎痏痐痑痓痗痙痚痜痝痟痠痡痥痩痬痭痮痯痲痳痵痶痷痸痺痻痽痾瘂瘄瘆瘇"], ["af80", "瘈瘉瘋瘍瘎瘏瘑瘒瘓瘔瘖瘚瘜瘝瘞瘡瘣瘧瘨瘬瘮瘯瘱瘲瘶瘷瘹瘺瘻瘽癁療癄"], ["b040", "癅", 6, "癎", 5, "癕癗", 4, "癝癟癠癡癢癤", 6, "癬癭癮癰", 7, "癹発發癿皀皁皃皅皉皊皌皍皏皐皒皔皕皗皘皚皛"], ["b080", "皜", 7, "皥", 8, "皯皰皳皵", 9, "盀盁盃啊阿埃挨哎唉哀皑癌蔼矮艾碍爱隘鞍氨安俺按暗岸胺案肮昂盎凹敖熬翱袄傲奥懊澳芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸白柏百摆佰败拜稗斑班搬扳般颁板版扮拌伴瓣半办绊邦帮梆榜膀绑棒磅蚌镑傍谤苞胞包褒剥"], ["b140", "盄盇盉盋盌盓盕盙盚盜盝盞盠", 4, "盦", 7, "盰盳盵盶盷盺盻盽盿眀眂眃眅眆眊県眎", 10, "眛眜眝眞眡眣眤眥眧眪眫"], ["b180", "眬眮眰", 4, "眹眻眽眾眿睂睄睅睆睈", 7, "睒", 7, "睜薄雹保堡饱宝抱报暴豹鲍爆杯碑悲卑北辈背贝钡倍狈备惫焙被奔苯本笨崩绷甭泵蹦迸逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛鞭边编贬扁便变卞辨辩辫遍标彪膘表鳖憋别瘪彬斌濒滨宾摈兵冰柄丙秉饼炳"], ["b240", "睝睞睟睠睤睧睩睪睭", 11, "睺睻睼瞁瞂瞃瞆", 5, "瞏瞐瞓", 11, "瞡瞣瞤瞦瞨瞫瞭瞮瞯瞱瞲瞴瞶", 4], ["b280", "瞼瞾矀", 12, "矎", 8, "矘矙矚矝", 4, "矤病并玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳捕卜哺补埠不布步簿部怖擦猜裁材才财睬踩采彩菜蔡餐参蚕残惭惨灿苍舱仓沧藏操糙槽曹草厕策侧册测层蹭插叉茬茶查碴搽察岔差诧拆柴豺搀掺蝉馋谗缠铲产阐颤昌猖"], ["b340", "矦矨矪矯矰矱矲矴矵矷矹矺矻矼砃", 5, "砊砋砎砏砐砓砕砙砛砞砠砡砢砤砨砪砫砮砯砱砲砳砵砶砽砿硁硂硃硄硆硈硉硊硋硍硏硑硓硔硘硙硚"], ["b380", "硛硜硞", 11, "硯", 7, "硸硹硺硻硽", 6, "场尝常长偿肠厂敞畅唱倡超抄钞朝嘲潮巢吵炒车扯撤掣彻澈郴臣辰尘晨忱沉陈趁衬撑称城橙成呈乘程惩澄诚承逞骋秤吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽充冲虫崇宠抽酬畴踌稠愁筹仇绸瞅丑臭初出橱厨躇锄雏滁除楚"], ["b440", "碄碅碆碈碊碋碏碐碒碔碕碖碙碝碞碠碢碤碦碨", 7, "碵碶碷碸確碻碼碽碿磀磂磃磄磆磇磈磌磍磎磏磑磒磓磖磗磘磚", 9], ["b480", "磤磥磦磧磩磪磫磭", 4, "磳磵磶磸磹磻", 5, "礂礃礄礆", 6, "础储矗搐触处揣川穿椽传船喘串疮窗幢床闯创吹炊捶锤垂春椿醇唇淳纯蠢戳绰疵茨磁雌辞慈瓷词此刺赐次聪葱囱匆从丛凑粗醋簇促蹿篡窜摧崔催脆瘁粹淬翠村存寸磋撮搓措挫错搭达答瘩打大呆歹傣戴带殆代贷袋待逮"], ["b540", "礍", 5, "礔", 9, "礟", 4, "礥", 14, "礵", 4, "礽礿祂祃祄祅祇祊", 8, "祔祕祘祙祡祣"], ["b580", "祤祦祩祪祫祬祮祰", 6, "祹祻", 4, "禂禃禆禇禈禉禋禌禍禎禐禑禒怠耽担丹单郸掸胆旦氮但惮淡诞弹蛋当挡党荡档刀捣蹈倒岛祷导到稻悼道盗德得的蹬灯登等瞪凳邓堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔颠掂滇碘点典靛垫电佃甸店惦奠淀殿碉叼雕凋刁掉吊钓调跌爹碟蝶迭谍叠"], ["b640", "禓", 6, "禛", 11, "禨", 10, "禴", 4, "禼禿秂秄秅秇秈秊秌秎秏秐秓秔秖秗秙", 5, "秠秡秢秥秨秪"], ["b680", "秬秮秱", 6, "秹秺秼秾秿稁稄稅稇稈稉稊稌稏", 4, "稕稖稘稙稛稜丁盯叮钉顶鼎锭定订丢东冬董懂动栋侗恫冻洞兜抖斗陡豆逗痘都督毒犊独读堵睹赌杜镀肚度渡妒端短锻段断缎堆兑队对墩吨蹲敦顿囤钝盾遁掇哆多夺垛躲朵跺舵剁惰堕蛾峨鹅俄额讹娥恶厄扼遏鄂饿恩而儿耳尔饵洱二"], ["b740", "稝稟稡稢稤", 14, "稴稵稶稸稺稾穀", 5, "穇", 9, "穒", 4, "穘", 16], ["b780", "穩", 6, "穱穲穳穵穻穼穽穾窂窅窇窉窊窋窌窎窏窐窓窔窙窚窛窞窡窢贰发罚筏伐乏阀法珐藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛坊芳方肪房防妨仿访纺放菲非啡飞肥匪诽吠肺废沸费芬酚吩氛分纷坟焚汾粉奋份忿愤粪丰封枫蜂峰锋风疯烽逢冯缝讽奉凤佛否夫敷肤孵扶拂辐幅氟符伏俘服"], ["b840", "窣窤窧窩窪窫窮", 4, "窴", 10, "竀", 10, "竌", 9, "竗竘竚竛竜竝竡竢竤竧", 5, "竮竰竱竲竳"], ["b880", "竴", 4, "竻竼竾笀笁笂笅笇笉笌笍笎笐笒笓笖笗笘笚笜笝笟笡笢笣笧笩笭浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐噶嘎该改概钙盖溉干甘杆柑竿肝赶感秆敢赣冈刚钢缸肛纲岗港杠篙皋高膏羔糕搞镐稿告哥歌搁戈鸽胳疙割革葛格蛤阁隔铬个各给根跟耕更庚羹"], ["b940", "笯笰笲笴笵笶笷笹笻笽笿", 5, "筆筈筊筍筎筓筕筗筙筜筞筟筡筣", 10, "筯筰筳筴筶筸筺筼筽筿箁箂箃箄箆", 6, "箎箏"], ["b980", "箑箒箓箖箘箙箚箛箞箟箠箣箤箥箮箯箰箲箳箵箶箷箹", 7, "篂篃範埂耿梗工攻功恭龚供躬公宫弓巩汞拱贡共钩勾沟苟狗垢构购够辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇刮瓜剐寡挂褂乖拐怪棺关官冠观管馆罐惯灌贯光广逛瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽辊滚棍锅郭国果裹过哈"], ["ba40", "篅篈築篊篋篍篎篏篐篒篔", 4, "篛篜篞篟篠篢篣篤篧篨篩篫篬篭篯篰篲", 4, "篸篹篺篻篽篿", 7, "簈簉簊簍簎簐", 5, "簗簘簙"], ["ba80", "簚", 4, "簠", 5, "簨簩簫", 12, "簹", 5, "籂骸孩海氦亥害骇酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉夯杭航壕嚎豪毫郝好耗号浩呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺嘿黑痕很狠恨哼亨横衡恒轰哄烘虹鸿洪宏弘红喉侯猴吼厚候后呼乎忽瑚壶葫胡蝴狐糊湖"], ["bb40", "籃", 9, "籎", 36, "籵", 5, "籾", 9], ["bb80", "粈粊", 6, "粓粔粖粙粚粛粠粡粣粦粧粨粩粫粬粭粯粰粴", 4, "粺粻弧虎唬护互沪户花哗华猾滑画划化话槐徊怀淮坏欢环桓还缓换患唤痪豢焕涣宦幻荒慌黄磺蝗簧皇凰惶煌晃幌恍谎灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘荤昏婚魂浑混豁活伙火获或惑霍货祸击圾基机畸稽积箕"], ["bc40", "粿糀糂糃糄糆糉糋糎", 6, "糘糚糛糝糞糡", 6, "糩", 5, "糰", 7, "糹糺糼", 13, "紋", 5], ["bc80", "紑", 14, "紡紣紤紥紦紨紩紪紬紭紮細", 6, "肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件"], ["bd40", "紷", 54, "絯", 7], ["bd80", "絸", 32, "健舰剑饯渐溅涧建僵姜将浆江疆蒋桨奖讲匠酱降蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸"], ["be40", "継", 12, "綧", 6, "綯", 42], ["be80", "線", 32, "尽劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净炯窘揪究纠玖韭久灸九酒厩救旧臼舅咎就疚鞠拘狙疽居驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧捐鹃娟倦眷卷绢撅攫抉掘倔爵觉决诀绝均菌钧军君峻"], ["bf40", "緻", 62], ["bf80", "縺縼", 4, "繂", 4, "繈", 21, "俊竣浚郡骏喀咖卡咯开揩楷凯慨刊堪勘坎砍看康慷糠扛抗亢炕考拷烤靠坷苛柯棵磕颗科壳咳可渴克刻客课肯啃垦恳坑吭空恐孔控抠口扣寇枯哭窟苦酷库裤夸垮挎跨胯块筷侩快宽款匡筐狂框矿眶旷况亏盔岿窥葵奎魁傀"], ["c040", "繞", 35, "纃", 23, "纜纝纞"], ["c080", "纮纴纻纼绖绤绬绹缊缐缞缷缹缻", 6, "罃罆", 9, "罒罓馈愧溃坤昆捆困括扩廓阔垃拉喇蜡腊辣啦莱来赖蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥琅榔狼廊郎朗浪捞劳牢老佬姥酪烙涝勒乐雷镭蕾磊累儡垒擂肋类泪棱楞冷厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐"], ["c140", "罖罙罛罜罝罞罠罣", 4, "罫罬罭罯罰罳罵罶罷罸罺罻罼罽罿羀羂", 7, "羋羍羏", 4, "羕", 4, "羛羜羠羢羣羥羦羨", 6, "羱"], ["c180", "羳", 4, "羺羻羾翀翂翃翄翆翇翈翉翋翍翏", 4, "翖翗翙", 5, "翢翣痢立粒沥隶力璃哩俩联莲连镰廉怜涟帘敛脸链恋炼练粮凉梁粱良两辆量晾亮谅撩聊僚疗燎寥辽潦了撂镣廖料列裂烈劣猎琳林磷霖临邻鳞淋凛赁吝拎玲菱零龄铃伶羚凌灵陵岭领另令溜琉榴硫馏留刘瘤流柳六龙聋咙笼窿"], ["c240", "翤翧翨翪翫翬翭翯翲翴", 6, "翽翾翿耂耇耈耉耊耎耏耑耓耚耛耝耞耟耡耣耤耫", 5, "耲耴耹耺耼耾聀聁聄聅聇聈聉聎聏聐聑聓聕聖聗"], ["c280", "聙聛", 13, "聫", 5, "聲", 11, "隆垄拢陇楼娄搂篓漏陋芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮驴吕铝侣旅履屡缕虑氯律率滤绿峦挛孪滦卵乱掠略抡轮伦仑沦纶论萝螺罗逻锣箩骡裸落洛骆络妈麻玛码蚂马骂嘛吗埋买麦卖迈脉瞒馒蛮满蔓曼慢漫"], ["c340", "聾肁肂肅肈肊肍", 5, "肔肕肗肙肞肣肦肧肨肬肰肳肵肶肸肹肻胅胇", 4, "胏", 6, "胘胟胠胢胣胦胮胵胷胹胻胾胿脀脁脃脄脅脇脈脋"], ["c380", "脌脕脗脙脛脜脝脟", 12, "脭脮脰脳脴脵脷脹", 4, "脿谩芒茫盲氓忙莽猫茅锚毛矛铆卯茂冒帽貌贸么玫枚梅酶霉煤没眉媒镁每美昧寐妹媚门闷们萌蒙檬盟锰猛梦孟眯醚靡糜迷谜弥米秘觅泌蜜密幂棉眠绵冕免勉娩缅面苗描瞄藐秒渺庙妙蔑灭民抿皿敏悯闽明螟鸣铭名命谬摸"], ["c440", "腀", 5, "腇腉腍腎腏腒腖腗腘腛", 4, "腡腢腣腤腦腨腪腫腬腯腲腳腵腶腷腸膁膃", 4, "膉膋膌膍膎膐膒", 5, "膙膚膞", 4, "膤膥"], ["c480", "膧膩膫", 7, "膴", 5, "膼膽膾膿臄臅臇臈臉臋臍", 6, "摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谋牟某拇牡亩姆母墓暮幕募慕木目睦牧穆拿哪呐钠那娜纳氖乃奶耐奈南男难囊挠脑恼闹淖呢馁内嫩能妮霓倪泥尼拟你匿腻逆溺蔫拈年碾撵捻念娘酿鸟尿捏聂孽啮镊镍涅您柠狞凝宁"], ["c540", "臔", 14, "臤臥臦臨臩臫臮", 4, "臵", 5, "臽臿舃與", 4, "舎舏舑舓舕", 5, "舝舠舤舥舦舧舩舮舲舺舼舽舿"], ["c580", "艀艁艂艃艅艆艈艊艌艍艎艐", 7, "艙艛艜艝艞艠", 7, "艩拧泞牛扭钮纽脓浓农弄奴努怒女暖虐疟挪懦糯诺哦欧鸥殴藕呕偶沤啪趴爬帕怕琶拍排牌徘湃派攀潘盘磐盼畔判叛乓庞旁耪胖抛咆刨炮袍跑泡呸胚培裴赔陪配佩沛喷盆砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯砒霹批披劈琵毗"], ["c640", "艪艫艬艭艱艵艶艷艸艻艼芀芁芃芅芆芇芉芌芐芓芔芕芖芚芛芞芠芢芣芧芲芵芶芺芻芼芿苀苂苃苅苆苉苐苖苙苚苝苢苧苨苩苪苬苭苮苰苲苳苵苶苸"], ["c680", "苺苼", 4, "茊茋茍茐茒茓茖茘茙茝", 9, "茩茪茮茰茲茷茻茽啤脾疲皮匹痞僻屁譬篇偏片骗飘漂瓢票撇瞥拼频贫品聘乒坪苹萍平凭瓶评屏坡泼颇婆破魄迫粕剖扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫掐"], ["c740", "茾茿荁荂荄荅荈荊", 4, "荓荕", 4, "荝荢荰", 6, "荹荺荾", 6, "莇莈莊莋莌莍莏莐莑莔莕莖莗莙莚莝莟莡", 6, "莬莭莮"], ["c780", "莯莵莻莾莿菂菃菄菆菈菉菋菍菎菐菑菒菓菕菗菙菚菛菞菢菣菤菦菧菨菫菬菭恰洽牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉枪呛腔羌墙蔷强抢橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍切茄且怯窃钦侵亲秦琴勤芹擒禽寝沁青轻氢倾卿清擎晴氰情顷请庆琼穷秋丘邱球求囚酋泅趋区蛆曲躯屈驱渠"], ["c840", "菮華菳", 4, "菺菻菼菾菿萀萂萅萇萈萉萊萐萒", 5, "萙萚萛萞", 5, "萩", 7, "萲", 5, "萹萺萻萾", 7, "葇葈葉"], ["c880", "葊", 6, "葒", 4, "葘葝葞葟葠葢葤", 4, "葪葮葯葰葲葴葷葹葻葼取娶龋趣去圈颧权醛泉全痊拳犬券劝缺炔瘸却鹊榷确雀裙群然燃冉染瓤壤攘嚷让饶扰绕惹热壬仁人忍韧任认刃妊纫扔仍日戎茸蓉荣融熔溶容绒冗揉柔肉茹蠕儒孺如辱乳汝入褥软阮蕊瑞锐闰润若弱撒洒萨腮鳃塞赛三叁"], ["c940", "葽", 4, "蒃蒄蒅蒆蒊蒍蒏", 7, "蒘蒚蒛蒝蒞蒟蒠蒢", 12, "蒰蒱蒳蒵蒶蒷蒻蒼蒾蓀蓂蓃蓅蓆蓇蓈蓋蓌蓎蓏蓒蓔蓕蓗"], ["c980", "蓘", 4, "蓞蓡蓢蓤蓧", 4, "蓭蓮蓯蓱", 10, "蓽蓾蔀蔁蔂伞散桑嗓丧搔骚扫嫂瑟色涩森僧莎砂杀刹沙纱傻啥煞筛晒珊苫杉山删煽衫闪陕擅赡膳善汕扇缮墒伤商赏晌上尚裳梢捎稍烧芍勺韶少哨邵绍奢赊蛇舌舍赦摄射慑涉社设砷申呻伸身深娠绅神沈审婶甚肾慎渗声生甥牲升绳"], ["ca40", "蔃", 8, "蔍蔎蔏蔐蔒蔔蔕蔖蔘蔙蔛蔜蔝蔞蔠蔢", 8, "蔭", 9, "蔾", 4, "蕄蕅蕆蕇蕋", 10], ["ca80", "蕗蕘蕚蕛蕜蕝蕟", 4, "蕥蕦蕧蕩", 8, "蕳蕵蕶蕷蕸蕼蕽蕿薀薁省盛剩胜圣师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试收手首守寿授售受瘦兽蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱"], ["cb40", "薂薃薆薈", 6, "薐", 10, "薝", 6, "薥薦薧薩薫薬薭薱", 5, "薸薺", 6, "藂", 6, "藊", 4, "藑藒"], ["cb80", "藔藖", 5, "藝", 6, "藥藦藧藨藪", 14, "恕刷耍摔衰甩帅栓拴霜双爽谁水睡税吮瞬顺舜说硕朔烁斯撕嘶思私司丝死肆寺嗣四伺似饲巳松耸怂颂送宋讼诵搜艘擞嗽苏酥俗素速粟僳塑溯宿诉肃酸蒜算虽隋随绥髓碎岁穗遂隧祟孙损笋蓑梭唆缩琐索锁所塌他它她塔"], ["cc40", "藹藺藼藽藾蘀", 4, "蘆", 10, "蘒蘓蘔蘕蘗", 15, "蘨蘪", 13, "蘹蘺蘻蘽蘾蘿虀"], ["cc80", "虁", 11, "虒虓處", 4, "虛虜虝號虠虡虣", 7, "獭挞蹋踏胎苔抬台泰酞太态汰坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭汤塘搪堂棠膛唐糖倘躺淌趟烫掏涛滔绦萄桃逃淘陶讨套特藤腾疼誊梯剔踢锑提题蹄啼体替嚏惕涕剃屉天添填田甜恬舔腆挑条迢眺跳贴铁帖厅听烃"], ["cd40", "虭虯虰虲", 6, "蚃", 6, "蚎", 4, "蚔蚖", 5, "蚞", 4, "蚥蚦蚫蚭蚮蚲蚳蚷蚸蚹蚻", 4, "蛁蛂蛃蛅蛈蛌蛍蛒蛓蛕蛖蛗蛚蛜"], ["cd80", "蛝蛠蛡蛢蛣蛥蛦蛧蛨蛪蛫蛬蛯蛵蛶蛷蛺蛻蛼蛽蛿蜁蜄蜅蜆蜋蜌蜎蜏蜐蜑蜔蜖汀廷停亭庭挺艇通桐酮瞳同铜彤童桶捅筒统痛偷投头透凸秃突图徒途涂屠土吐兔湍团推颓腿蜕褪退吞屯臀拖托脱鸵陀驮驼椭妥拓唾挖哇蛙洼娃瓦袜歪外豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕汪王亡枉网往旺望忘妄威"], ["ce40", "蜙蜛蜝蜟蜠蜤蜦蜧蜨蜪蜫蜬蜭蜯蜰蜲蜳蜵蜶蜸蜹蜺蜼蜽蝀", 6, "蝊蝋蝍蝏蝐蝑蝒蝔蝕蝖蝘蝚", 5, "蝡蝢蝦", 7, "蝯蝱蝲蝳蝵"], ["ce80", "蝷蝸蝹蝺蝿螀螁螄螆螇螉螊螌螎", 4, "螔螕螖螘", 6, "螠", 4, "巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫瘟温蚊文闻纹吻稳紊问嗡翁瓮挝蜗涡窝我斡卧握沃巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误昔熙析西硒矽晰嘻吸锡牺"], ["cf40", "螥螦螧螩螪螮螰螱螲螴螶螷螸螹螻螼螾螿蟁", 4, "蟇蟈蟉蟌", 4, "蟔", 6, "蟜蟝蟞蟟蟡蟢蟣蟤蟦蟧蟨蟩蟫蟬蟭蟯", 9], ["cf80", "蟺蟻蟼蟽蟿蠀蠁蠂蠄", 5, "蠋", 7, "蠔蠗蠘蠙蠚蠜", 4, "蠣稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细瞎虾匣霞辖暇峡侠狭下厦夏吓掀锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象萧硝霄削哮嚣销消宵淆晓"], ["d040", "蠤", 13, "蠳", 5, "蠺蠻蠽蠾蠿衁衂衃衆", 5, "衎", 5, "衕衖衘衚", 6, "衦衧衪衭衯衱衳衴衵衶衸衹衺"], ["d080", "衻衼袀袃袆袇袉袊袌袎袏袐袑袓袔袕袗", 4, "袝", 4, "袣袥", 5, "小孝校肖啸笑效楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑薪芯锌欣辛新忻心信衅星腥猩惺兴刑型形邢行醒幸杏性姓兄凶胸匈汹雄熊休修羞朽嗅锈秀袖绣墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续轩喧宣悬旋玄"], ["d140", "袬袮袯袰袲", 4, "袸袹袺袻袽袾袿裀裃裄裇裈裊裋裌裍裏裐裑裓裖裗裚", 4, "裠裡裦裧裩", 6, "裲裵裶裷裺裻製裿褀褁褃", 5], ["d180", "褉褋", 4, "褑褔", 4, "褜", 4, "褢褣褤褦褧褨褩褬褭褮褯褱褲褳褵褷选癣眩绚靴薛学穴雪血勋熏循旬询寻驯巡殉汛训讯逊迅压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾邀腰妖瑶"], ["d240", "褸", 8, "襂襃襅", 24, "襠", 5, "襧", 19, "襼"], ["d280", "襽襾覀覂覄覅覇", 26, "摇尧遥窑谣姚咬舀药要耀椰噎耶爷野冶也页掖业叶曳腋夜液一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎茵荫因殷音阴姻吟银淫寅饮尹引隐"], ["d340", "覢", 30, "觃觍觓觔觕觗觘觙觛觝觟觠觡觢觤觧觨觩觪觬觭觮觰觱觲觴", 6], ["d380", "觻", 4, "訁", 5, "計", 21, "印英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映哟拥佣臃痈庸雍踊蛹咏泳涌永恿勇用幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉"], ["d440", "訞", 31, "訿", 8, "詉", 21], ["d480", "詟", 25, "詺", 6, "浴寓裕预豫驭鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院曰约越跃钥岳粤月悦阅耘云郧匀陨允运蕴酝晕韵孕匝砸杂栽哉灾宰载再在咱攒暂赞赃脏葬遭糟凿藻枣早澡蚤躁噪造皂灶燥责择则泽贼怎增憎曾赠扎喳渣札轧"], ["d540", "誁", 7, "誋", 7, "誔", 46], ["d580", "諃", 32, "铡闸眨栅榨咋乍炸诈摘斋宅窄债寨瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽樟章彰漳张掌涨杖丈帐账仗胀瘴障招昭找沼赵照罩兆肇召遮折哲蛰辙者锗蔗这浙珍斟真甄砧臻贞针侦枕疹诊震振镇阵蒸挣睁征狰争怔整拯正政"], ["d640", "諤", 34, "謈", 27], ["d680", "謤謥謧", 30, "帧症郑证芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒中盅忠钟衷终种肿重仲众舟周州洲诌粥轴肘帚咒皱宙昼骤珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑"], ["d740", "譆", 31, "譧", 4, "譭", 25], ["d780", "讇", 24, "讬讱讻诇诐诪谉谞住注祝驻抓爪拽专砖转撰赚篆桩庄装妆撞壮状椎锥追赘坠缀谆准捉拙卓桌琢茁酌啄着灼浊兹咨资姿滋淄孜紫仔籽滓子自渍字鬃棕踪宗综总纵邹走奏揍租足卒族祖诅阻组钻纂嘴醉最罪尊遵昨左佐柞做作坐座"], ["d840", "谸", 8, "豂豃豄豅豈豊豋豍", 7, "豖豗豘豙豛", 5, "豣", 6, "豬", 6, "豴豵豶豷豻", 6, "貃貄貆貇"], ["d880", "貈貋貍", 6, "貕貖貗貙", 20, "亍丌兀丐廿卅丕亘丞鬲孬噩丨禺丿匕乇夭爻卮氐囟胤馗毓睾鼗丶亟鼐乜乩亓芈孛啬嘏仄厍厝厣厥厮靥赝匚叵匦匮匾赜卦卣刂刈刎刭刳刿剀剌剞剡剜蒯剽劂劁劐劓冂罔亻仃仉仂仨仡仫仞伛仳伢佤仵伥伧伉伫佞佧攸佚佝"], ["d940", "貮", 62], ["d980", "賭", 32, "佟佗伲伽佶佴侑侉侃侏佾佻侪佼侬侔俦俨俪俅俚俣俜俑俟俸倩偌俳倬倏倮倭俾倜倌倥倨偾偃偕偈偎偬偻傥傧傩傺僖儆僭僬僦僮儇儋仝氽佘佥俎龠汆籴兮巽黉馘冁夔勹匍訇匐凫夙兕亠兖亳衮袤亵脔裒禀嬴蠃羸冫冱冽冼"], ["da40", "贎", 14, "贠赑赒赗赟赥赨赩赪赬赮赯赱赲赸", 8, "趂趃趆趇趈趉趌", 4, "趒趓趕", 9, "趠趡"], ["da80", "趢趤", 12, "趲趶趷趹趻趽跀跁跂跅跇跈跉跊跍跐跒跓跔凇冖冢冥讠讦讧讪讴讵讷诂诃诋诏诎诒诓诔诖诘诙诜诟诠诤诨诩诮诰诳诶诹诼诿谀谂谄谇谌谏谑谒谔谕谖谙谛谘谝谟谠谡谥谧谪谫谮谯谲谳谵谶卩卺阝阢阡阱阪阽阼陂陉陔陟陧陬陲陴隈隍隗隰邗邛邝邙邬邡邴邳邶邺"], ["db40", "跕跘跙跜跠跡跢跥跦跧跩跭跮跰跱跲跴跶跼跾", 6, "踆踇踈踋踍踎踐踑踒踓踕", 7, "踠踡踤", 4, "踫踭踰踲踳踴踶踷踸踻踼踾"], ["db80", "踿蹃蹅蹆蹌", 4, "蹓", 5, "蹚", 11, "蹧蹨蹪蹫蹮蹱邸邰郏郅邾郐郄郇郓郦郢郜郗郛郫郯郾鄄鄢鄞鄣鄱鄯鄹酃酆刍奂劢劬劭劾哿勐勖勰叟燮矍廴凵凼鬯厶弁畚巯坌垩垡塾墼壅壑圩圬圪圳圹圮圯坜圻坂坩垅坫垆坼坻坨坭坶坳垭垤垌垲埏垧垴垓垠埕埘埚埙埒垸埴埯埸埤埝"], ["dc40", "蹳蹵蹷", 4, "蹽蹾躀躂躃躄躆躈", 6, "躑躒躓躕", 6, "躝躟", 11, "躭躮躰躱躳", 6, "躻", 7], ["dc80", "軃", 10, "軏", 21, "堋堍埽埭堀堞堙塄堠塥塬墁墉墚墀馨鼙懿艹艽艿芏芊芨芄芎芑芗芙芫芸芾芰苈苊苣芘芷芮苋苌苁芩芴芡芪芟苄苎芤苡茉苷苤茏茇苜苴苒苘茌苻苓茑茚茆茔茕苠苕茜荑荛荜茈莒茼茴茱莛荞茯荏荇荃荟荀茗荠茭茺茳荦荥"], ["dd40", "軥", 62], ["dd80", "輤", 32, "荨茛荩荬荪荭荮莰荸莳莴莠莪莓莜莅荼莶莩荽莸荻莘莞莨莺莼菁萁菥菘堇萘萋菝菽菖萜萸萑萆菔菟萏萃菸菹菪菅菀萦菰菡葜葑葚葙葳蒇蒈葺蒉葸萼葆葩葶蒌蒎萱葭蓁蓍蓐蓦蒽蓓蓊蒿蒺蓠蒡蒹蒴蒗蓥蓣蔌甍蔸蓰蔹蔟蔺"], ["de40", "轅", 32, "轪辀辌辒辝辠辡辢辤辥辦辧辪辬辭辮辯農辳辴辵辷辸辺辻込辿迀迃迆"], ["de80", "迉", 4, "迏迒迖迗迚迠迡迣迧迬迯迱迲迴迵迶迺迻迼迾迿逇逈逌逎逓逕逘蕖蔻蓿蓼蕙蕈蕨蕤蕞蕺瞢蕃蕲蕻薤薨薇薏蕹薮薜薅薹薷薰藓藁藜藿蘧蘅蘩蘖蘼廾弈夼奁耷奕奚奘匏尢尥尬尴扌扪抟抻拊拚拗拮挢拶挹捋捃掭揶捱捺掎掴捭掬掊捩掮掼揲揸揠揿揄揞揎摒揆掾摅摁搋搛搠搌搦搡摞撄摭撖"], ["df40", "這逜連逤逥逧", 5, "逰", 4, "逷逹逺逽逿遀遃遅遆遈", 4, "過達違遖遙遚遜", 5, "遤遦遧適遪遫遬遯", 4, "遶", 6, "遾邁"], ["df80", "還邅邆邇邉邊邌", 4, "邒邔邖邘邚邜邞邟邠邤邥邧邨邩邫邭邲邷邼邽邿郀摺撷撸撙撺擀擐擗擤擢攉攥攮弋忒甙弑卟叱叽叩叨叻吒吖吆呋呒呓呔呖呃吡呗呙吣吲咂咔呷呱呤咚咛咄呶呦咝哐咭哂咴哒咧咦哓哔呲咣哕咻咿哌哙哚哜咩咪咤哝哏哞唛哧唠哽唔哳唢唣唏唑唧唪啧喏喵啉啭啁啕唿啐唼"], ["e040", "郂郃郆郈郉郋郌郍郒郔郕郖郘郙郚郞郟郠郣郤郥郩郪郬郮郰郱郲郳郵郶郷郹郺郻郼郿鄀鄁鄃鄅", 19, "鄚鄛鄜"], ["e080", "鄝鄟鄠鄡鄤", 10, "鄰鄲", 6, "鄺", 8, "酄唷啖啵啶啷唳唰啜喋嗒喃喱喹喈喁喟啾嗖喑啻嗟喽喾喔喙嗪嗷嗉嘟嗑嗫嗬嗔嗦嗝嗄嗯嗥嗲嗳嗌嗍嗨嗵嗤辔嘞嘈嘌嘁嘤嘣嗾嘀嘧嘭噘嘹噗嘬噍噢噙噜噌噔嚆噤噱噫噻噼嚅嚓嚯囔囗囝囡囵囫囹囿圄圊圉圜帏帙帔帑帱帻帼"], ["e140", "酅酇酈酑酓酔酕酖酘酙酛酜酟酠酦酧酨酫酭酳酺酻酼醀", 4, "醆醈醊醎醏醓", 6, "醜", 5, "醤", 5, "醫醬醰醱醲醳醶醷醸醹醻"], ["e180", "醼", 10, "釈釋釐釒", 9, "針", 8, "帷幄幔幛幞幡岌屺岍岐岖岈岘岙岑岚岜岵岢岽岬岫岱岣峁岷峄峒峤峋峥崂崃崧崦崮崤崞崆崛嵘崾崴崽嵬嵛嵯嵝嵫嵋嵊嵩嵴嶂嶙嶝豳嶷巅彳彷徂徇徉後徕徙徜徨徭徵徼衢彡犭犰犴犷犸狃狁狎狍狒狨狯狩狲狴狷猁狳猃狺"], ["e240", "釦", 62], ["e280", "鈥", 32, "狻猗猓猡猊猞猝猕猢猹猥猬猸猱獐獍獗獠獬獯獾舛夥飧夤夂饣饧", 5, "饴饷饽馀馄馇馊馍馐馑馓馔馕庀庑庋庖庥庠庹庵庾庳赓廒廑廛廨廪膺忄忉忖忏怃忮怄忡忤忾怅怆忪忭忸怙怵怦怛怏怍怩怫怊怿怡恸恹恻恺恂"], ["e340", "鉆", 45, "鉵", 16], ["e380", "銆", 7, "銏", 24, "恪恽悖悚悭悝悃悒悌悛惬悻悱惝惘惆惚悴愠愦愕愣惴愀愎愫慊慵憬憔憧憷懔懵忝隳闩闫闱闳闵闶闼闾阃阄阆阈阊阋阌阍阏阒阕阖阗阙阚丬爿戕氵汔汜汊沣沅沐沔沌汨汩汴汶沆沩泐泔沭泷泸泱泗沲泠泖泺泫泮沱泓泯泾"], ["e440", "銨", 5, "銯", 24, "鋉", 31], ["e480", "鋩", 32, "洹洧洌浃浈洇洄洙洎洫浍洮洵洚浏浒浔洳涑浯涞涠浞涓涔浜浠浼浣渚淇淅淞渎涿淠渑淦淝淙渖涫渌涮渫湮湎湫溲湟溆湓湔渲渥湄滟溱溘滠漭滢溥溧溽溻溷滗溴滏溏滂溟潢潆潇漤漕滹漯漶潋潴漪漉漩澉澍澌潸潲潼潺濑"], ["e540", "錊", 51, "錿", 10], ["e580", "鍊", 31, "鍫濉澧澹澶濂濡濮濞濠濯瀚瀣瀛瀹瀵灏灞宀宄宕宓宥宸甯骞搴寤寮褰寰蹇謇辶迓迕迥迮迤迩迦迳迨逅逄逋逦逑逍逖逡逵逶逭逯遄遑遒遐遨遘遢遛暹遴遽邂邈邃邋彐彗彖彘尻咫屐屙孱屣屦羼弪弩弭艴弼鬻屮妁妃妍妩妪妣"], ["e640", "鍬", 34, "鎐", 27], ["e680", "鎬", 29, "鏋鏌鏍妗姊妫妞妤姒妲妯姗妾娅娆姝娈姣姘姹娌娉娲娴娑娣娓婀婧婊婕娼婢婵胬媪媛婷婺媾嫫媲嫒嫔媸嫠嫣嫱嫖嫦嫘嫜嬉嬗嬖嬲嬷孀尕尜孚孥孳孑孓孢驵驷驸驺驿驽骀骁骅骈骊骐骒骓骖骘骛骜骝骟骠骢骣骥骧纟纡纣纥纨纩"], ["e740", "鏎", 7, "鏗", 54], ["e780", "鐎", 32, "纭纰纾绀绁绂绉绋绌绐绔绗绛绠绡绨绫绮绯绱绲缍绶绺绻绾缁缂缃缇缈缋缌缏缑缒缗缙缜缛缟缡", 6, "缪缫缬缭缯", 4, "缵幺畿巛甾邕玎玑玮玢玟珏珂珑玷玳珀珉珈珥珙顼琊珩珧珞玺珲琏琪瑛琦琥琨琰琮琬"], ["e840", "鐯", 14, "鐿", 43, "鑬鑭鑮鑯"], ["e880", "鑰", 20, "钑钖钘铇铏铓铔铚铦铻锜锠琛琚瑁瑜瑗瑕瑙瑷瑭瑾璜璎璀璁璇璋璞璨璩璐璧瓒璺韪韫韬杌杓杞杈杩枥枇杪杳枘枧杵枨枞枭枋杷杼柰栉柘栊柩枰栌柙枵柚枳柝栀柃枸柢栎柁柽栲栳桠桡桎桢桄桤梃栝桕桦桁桧桀栾桊桉栩梵梏桴桷梓桫棂楮棼椟椠棹"], ["e940", "锧锳锽镃镈镋镕镚镠镮镴镵長", 7, "門", 42], ["e980", "閫", 32, "椤棰椋椁楗棣椐楱椹楠楂楝榄楫榀榘楸椴槌榇榈槎榉楦楣楹榛榧榻榫榭槔榱槁槊槟榕槠榍槿樯槭樗樘橥槲橄樾檠橐橛樵檎橹樽樨橘橼檑檐檩檗檫猷獒殁殂殇殄殒殓殍殚殛殡殪轫轭轱轲轳轵轶轸轷轹轺轼轾辁辂辄辇辋"], ["ea40", "闌", 27, "闬闿阇阓阘阛阞阠阣", 6, "阫阬阭阯阰阷阸阹阺阾陁陃陊陎陏陑陒陓陖陗"], ["ea80", "陘陙陚陜陝陞陠陣陥陦陫陭", 4, "陳陸", 12, "隇隉隊辍辎辏辘辚軎戋戗戛戟戢戡戥戤戬臧瓯瓴瓿甏甑甓攴旮旯旰昊昙杲昃昕昀炅曷昝昴昱昶昵耆晟晔晁晏晖晡晗晷暄暌暧暝暾曛曜曦曩贲贳贶贻贽赀赅赆赈赉赇赍赕赙觇觊觋觌觎觏觐觑牮犟牝牦牯牾牿犄犋犍犏犒挈挲掰"], ["eb40", "隌階隑隒隓隕隖隚際隝", 9, "隨", 7, "隱隲隴隵隷隸隺隻隿雂雃雈雊雋雐雑雓雔雖", 9, "雡", 6, "雫"], ["eb80", "雬雭雮雰雱雲雴雵雸雺電雼雽雿霂霃霅霊霋霌霐霑霒霔霕霗", 4, "霝霟霠搿擘耄毪毳毽毵毹氅氇氆氍氕氘氙氚氡氩氤氪氲攵敕敫牍牒牖爰虢刖肟肜肓肼朊肽肱肫肭肴肷胧胨胩胪胛胂胄胙胍胗朐胝胫胱胴胭脍脎胲胼朕脒豚脶脞脬脘脲腈腌腓腴腙腚腱腠腩腼腽腭腧塍媵膈膂膑滕膣膪臌朦臊膻"], ["ec40", "霡", 8, "霫霬霮霯霱霳", 4, "霺霻霼霽霿", 18, "靔靕靗靘靚靜靝靟靣靤靦靧靨靪", 7], ["ec80", "靲靵靷", 4, "靽", 7, "鞆", 4, "鞌鞎鞏鞐鞓鞕鞖鞗鞙", 4, "臁膦欤欷欹歃歆歙飑飒飓飕飙飚殳彀毂觳斐齑斓於旆旄旃旌旎旒旖炀炜炖炝炻烀炷炫炱烨烊焐焓焖焯焱煳煜煨煅煲煊煸煺熘熳熵熨熠燠燔燧燹爝爨灬焘煦熹戾戽扃扈扉礻祀祆祉祛祜祓祚祢祗祠祯祧祺禅禊禚禧禳忑忐"], ["ed40", "鞞鞟鞡鞢鞤", 6, "鞬鞮鞰鞱鞳鞵", 46], ["ed80", "韤韥韨韮", 4, "韴韷", 23, "怼恝恚恧恁恙恣悫愆愍慝憩憝懋懑戆肀聿沓泶淼矶矸砀砉砗砘砑斫砭砜砝砹砺砻砟砼砥砬砣砩硎硭硖硗砦硐硇硌硪碛碓碚碇碜碡碣碲碹碥磔磙磉磬磲礅磴礓礤礞礴龛黹黻黼盱眄眍盹眇眈眚眢眙眭眦眵眸睐睑睇睃睚睨"], ["ee40", "頏", 62], ["ee80", "顎", 32, "睢睥睿瞍睽瞀瞌瞑瞟瞠瞰瞵瞽町畀畎畋畈畛畲畹疃罘罡罟詈罨罴罱罹羁罾盍盥蠲钅钆钇钋钊钌钍钏钐钔钗钕钚钛钜钣钤钫钪钭钬钯钰钲钴钶", 4, "钼钽钿铄铈", 6, "铐铑铒铕铖铗铙铘铛铞铟铠铢铤铥铧铨铪"], ["ef40", "顯", 5, "颋颎颒颕颙颣風", 37, "飏飐飔飖飗飛飜飝飠", 4], ["ef80", "飥飦飩", 30, "铩铫铮铯铳铴铵铷铹铼铽铿锃锂锆锇锉锊锍锎锏锒", 4, "锘锛锝锞锟锢锪锫锩锬锱锲锴锶锷锸锼锾锿镂锵镄镅镆镉镌镎镏镒镓镔镖镗镘镙镛镞镟镝镡镢镤", 8, "镯镱镲镳锺矧矬雉秕秭秣秫稆嵇稃稂稞稔"], ["f040", "餈", 4, "餎餏餑", 28, "餯", 26], ["f080", "饊", 9, "饖", 12, "饤饦饳饸饹饻饾馂馃馉稹稷穑黏馥穰皈皎皓皙皤瓞瓠甬鸠鸢鸨", 4, "鸲鸱鸶鸸鸷鸹鸺鸾鹁鹂鹄鹆鹇鹈鹉鹋鹌鹎鹑鹕鹗鹚鹛鹜鹞鹣鹦", 6, "鹱鹭鹳疒疔疖疠疝疬疣疳疴疸痄疱疰痃痂痖痍痣痨痦痤痫痧瘃痱痼痿瘐瘀瘅瘌瘗瘊瘥瘘瘕瘙"], ["f140", "馌馎馚", 10, "馦馧馩", 47], ["f180", "駙", 32, "瘛瘼瘢瘠癀瘭瘰瘿瘵癃瘾瘳癍癞癔癜癖癫癯翊竦穸穹窀窆窈窕窦窠窬窨窭窳衤衩衲衽衿袂袢裆袷袼裉裢裎裣裥裱褚裼裨裾裰褡褙褓褛褊褴褫褶襁襦襻疋胥皲皴矜耒耔耖耜耠耢耥耦耧耩耨耱耋耵聃聆聍聒聩聱覃顸颀颃"], ["f240", "駺", 62], ["f280", "騹", 32, "颉颌颍颏颔颚颛颞颟颡颢颥颦虍虔虬虮虿虺虼虻蚨蚍蚋蚬蚝蚧蚣蚪蚓蚩蚶蛄蚵蛎蚰蚺蚱蚯蛉蛏蚴蛩蛱蛲蛭蛳蛐蜓蛞蛴蛟蛘蛑蜃蜇蛸蜈蜊蜍蜉蜣蜻蜞蜥蜮蜚蜾蝈蜴蜱蜩蜷蜿螂蜢蝽蝾蝻蝠蝰蝌蝮螋蝓蝣蝼蝤蝙蝥螓螯螨蟒"], ["f340", "驚", 17, "驲骃骉骍骎骔骕骙骦骩", 6, "骲骳骴骵骹骻骽骾骿髃髄髆", 4, "髍髎髏髐髒體髕髖髗髙髚髛髜"], ["f380", "髝髞髠髢髣髤髥髧髨髩髪髬髮髰", 8, "髺髼", 6, "鬄鬅鬆蟆螈螅螭螗螃螫蟥螬螵螳蟋蟓螽蟑蟀蟊蟛蟪蟠蟮蠖蠓蟾蠊蠛蠡蠹蠼缶罂罄罅舐竺竽笈笃笄笕笊笫笏筇笸笪笙笮笱笠笥笤笳笾笞筘筚筅筵筌筝筠筮筻筢筲筱箐箦箧箸箬箝箨箅箪箜箢箫箴篑篁篌篝篚篥篦篪簌篾篼簏簖簋"], ["f440", "鬇鬉", 5, "鬐鬑鬒鬔", 10, "鬠鬡鬢鬤", 10, "鬰鬱鬳", 7, "鬽鬾鬿魀魆魊魋魌魎魐魒魓魕", 5], ["f480", "魛", 32, "簟簪簦簸籁籀臾舁舂舄臬衄舡舢舣舭舯舨舫舸舻舳舴舾艄艉艋艏艚艟艨衾袅袈裘裟襞羝羟羧羯羰羲籼敉粑粝粜粞粢粲粼粽糁糇糌糍糈糅糗糨艮暨羿翎翕翥翡翦翩翮翳糸絷綦綮繇纛麸麴赳趄趔趑趱赧赭豇豉酊酐酎酏酤"], ["f540", "魼", 62], ["f580", "鮻", 32, "酢酡酰酩酯酽酾酲酴酹醌醅醐醍醑醢醣醪醭醮醯醵醴醺豕鹾趸跫踅蹙蹩趵趿趼趺跄跖跗跚跞跎跏跛跆跬跷跸跣跹跻跤踉跽踔踝踟踬踮踣踯踺蹀踹踵踽踱蹉蹁蹂蹑蹒蹊蹰蹶蹼蹯蹴躅躏躔躐躜躞豸貂貊貅貘貔斛觖觞觚觜"], ["f640", "鯜", 62], ["f680", "鰛", 32, "觥觫觯訾謦靓雩雳雯霆霁霈霏霎霪霭霰霾龀龃龅", 5, "龌黾鼋鼍隹隼隽雎雒瞿雠銎銮鋈錾鍪鏊鎏鐾鑫鱿鲂鲅鲆鲇鲈稣鲋鲎鲐鲑鲒鲔鲕鲚鲛鲞", 5, "鲥", 4, "鲫鲭鲮鲰", 7, "鲺鲻鲼鲽鳄鳅鳆鳇鳊鳋"], ["f740", "鰼", 62], ["f780", "鱻鱽鱾鲀鲃鲄鲉鲊鲌鲏鲓鲖鲗鲘鲙鲝鲪鲬鲯鲹鲾", 4, "鳈鳉鳑鳒鳚鳛鳠鳡鳌", 4, "鳓鳔鳕鳗鳘鳙鳜鳝鳟鳢靼鞅鞑鞒鞔鞯鞫鞣鞲鞴骱骰骷鹘骶骺骼髁髀髅髂髋髌髑魅魃魇魉魈魍魑飨餍餮饕饔髟髡髦髯髫髻髭髹鬈鬏鬓鬟鬣麽麾縻麂麇麈麋麒鏖麝麟黛黜黝黠黟黢黩黧黥黪黯鼢鼬鼯鼹鼷鼽鼾齄"], ["f840", "鳣", 62], ["f880", "鴢", 32], ["f940", "鵃", 62], ["f980", "鶂", 32], ["fa40", "鶣", 62], ["fa80", "鷢", 32], ["fb40", "鸃", 27, "鸤鸧鸮鸰鸴鸻鸼鹀鹍鹐鹒鹓鹔鹖鹙鹝鹟鹠鹡鹢鹥鹮鹯鹲鹴", 9, "麀"], ["fb80", "麁麃麄麅麆麉麊麌", 5, "麔", 8, "麞麠", 5, "麧麨麩麪"], ["fc40", "麫", 8, "麵麶麷麹麺麼麿", 4, "黅黆黇黈黊黋黌黐黒黓黕黖黗黙黚點黡黣黤黦黨黫黬黭黮黰", 8, "黺黽黿", 6], ["fc80", "鼆", 4, "鼌鼏鼑鼒鼔鼕鼖鼘鼚", 5, "鼡鼣", 8, "鼭鼮鼰鼱"], ["fd40", "鼲", 4, "鼸鼺鼼鼿", 4, "齅", 10, "齒", 38], ["fd80", "齹", 5, "龁龂龍", 11, "龜龝龞龡", 4, "郎凉秊裏隣"], ["fe40", "兀嗀﨎﨏﨑﨓﨔礼﨟蘒﨡﨣﨤﨧﨨﨩"]] }, function (t, e, n) { var r = n(113); t.exports = Object("z").propertyIsEnumerable(0) ? Object : function (t) { return "String" == r(t) ? t.split("") : Object(t) } }, function (t, e) { var n = {}.toString; t.exports = function (t) { return n.call(t).slice(8, -1) } }, function (t, e) { t.exports = function (t) { if (void 0 == t) throw TypeError("Can't call method on  " + t); return t } }, function (t, e, n) { var r = n(73), i = n(56), o = n(35), a = n(116), s = n(36), u = n(173), l = Object.getOwnPropertyDescriptor; e.f = n(17) ? l : function (t, e) { if (t = o(t), e = a(e, !0), u) try { return l(t, e) } catch (t) { } if (s(t, e)) return i(!r.f.call(t, e), t[e]) } }, function (t, e, n) { var r = n(19); t.exports = function (t, e) { if (!r(t)) return t; var n, i; if (e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i; if ("function" == typeof (n = t.valueOf) && !r(i = n.call(t))) return i; if (!e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i; throw TypeError("Can't convert object to primitive value") } }, function (t, e, n) { var r = n(6), i = n(2), o = n(37); t.exports = function (t, e) { var n = (i.Object || {})[t] || Object[t], a = {}; a[t] = e(n), r(r.S + r.F * o(function () { n(1) }), "Object", a) } }, function (t, e, n) { t.exports = { default: n(330), __esModule: !0 } }, function (t, e, n) { "use strict"; var r = n(74), i = n(6), o = n(177), a = n(27), s = n(49), u = n(333), l = n(78), c = n(336), f = n(12)("iterator"), h = !([].keys && "next" in [].keys()), d = function () { return this }; t.exports = function (t, e, n, p, g, v, y) { u(n, e, p); var b, m, w, x = function (t) { if (!h && t in C) return C[t]; switch (t) { case "keys": case "values": return function () { return new n(this, t) } }return function () { return new n(this, t) } }, _ = e + " Iterator", k = "values" == g, S = !1, C = t.prototype, A = C[f] || C["@@iterator"] || g && C[g], P = A || x(g), E = g ? k ? x("entries") : P : void 0, O = "Array" == e ? C.entries || A : A; if (O && (w = c(O.call(new t))) !== Object.prototype && w.next && (l(w, _, !0), r || "function" == typeof w[f] || a(w, f, d)), k && A && "values" !== A.name && (S = !0, P = function () { return A.call(this) }), r && !y || !h && !S && C[f] || a(C, f, P), s[e] = P, s[_] = d, g) if (b = { values: k ? P : x("values"), keys: v ? P : x("keys"), entries: E }, y) for (m in b) m in C || o(C, m, b[m]); else i(i.P + i.F * (h || S), e, b); return b } }, function (t, e) { var n = Math.ceil, r = Math.floor; t.exports = function (t) { return isNaN(t = +t) ? 0 : (t > 0 ? r : n)(t) } }, function (t, e, n) { var r = n(122)("keys"), i = n(77); t.exports = function (t) { return r[t] || (r[t] = i(t)) } }, function (t, e, n) { var r = n(2), i = n(20), o = i["__core-js_shared__"] || (i["__core-js_shared__"] = {}); (t.exports = function (t, e) { return o[t] || (o[t] = void 0 !== e ? e : {}) })("versions", []).push({ version: r.version, mode: n(74) ? "pure" : "global", copyright: "© 2019 Denis Pushkarev (zloirock.ru)" }) }, function (t, e) { t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",") }, function (t, e, n) { var r = n(125), i = n(12)("iterator"), o = n(49); t.exports = n(2).getIteratorMethod = function (t) { if (void 0 != t) return t[i] || t["@@iterator"] || o[r(t)] } }, function (t, e, n) { var r = n(113), i = n(12)("toStringTag"), o = "Arguments" == r(function () { return arguments }()), a = function (t, e) { try { return t[e] } catch (t) { } }; t.exports = function (t) { var e, n, s; return void 0 === t ? "Undefined" : null === t ? "Null" : "string" == typeof (n = a(e = Object(t), i)) ? n : o ? r(e) : "Object" == (s = r(e)) && "function" == typeof e.callee ? "Arguments" : s } }, function (t, e, n) { "use strict"; function r(t) { return t && t.__esModule ? t : { default: t } } e.__esModule = !0; var i = n(181), o = r(i), a = n(346), s = r(a), u = "function" == typeof s.default && "symbol" == typeof o.default ? function (t) { return typeof t } : function (t) { return t && "function" == typeof s.default && t.constructor === s.default && t !== s.default.prototype ? "symbol" : typeof t }; e.default = "function" == typeof s.default && "symbol" === u(o.default) ? function (t) { return void 0 === t ? "undefined" : u(t) } : function (t) { return t && "function" == typeof s.default && t.constructor === s.default && t !== s.default.prototype ? "symbol" : void 0 === t ? "undefined" : u(t) } }, function (t, e, n) { e.f = n(12) }, function (t, e, n) { var r = n(20), i = n(2), o = n(74), a = n(127), s = n(18).f; t.exports = function (t) { var e = i.Symbol || (i.Symbol = o ? {} : r.Symbol || {}); "_" == t.charAt(0) || t in e || s(e, t, { value: a.f(t) }) } }, function (t, e) { e.f = Object.getOwnPropertySymbols }, function (t, e) { }, function (t, e, n) { t.exports = { default: n(353), __esModule: !0 } }, function (t, e, n) { var r = n(19); t.exports = function (t, e) { if (!r(t) || t._t !== e) throw TypeError("Incompatible receiver, " + e + " required!"); return t } }, function (t, e, n) { var r, i; i = n(195), r = function () { function t(t) { var e, n, r; e = "function" == typeof t.readUInt32BE && "function" == typeof t.slice, e || t instanceof Uint8Array ? (e ? (this.highStart = t.readUInt32BE(0), this.errorValue = t.readUInt32BE(4), n = t.readUInt32BE(8), t = t.slice(12)) : (r = new DataView(t.buffer), this.highStart = r.getUint32(0), this.errorValue = r.getUint32(4), n = r.getUint32(8), t = t.subarray(12)), t = i(t, new Uint8Array(n)), t = i(t, new Uint8Array(n)), this.data = new Uint32Array(t.buffer)) : (this.data = t.data, this.highStart = t.highStart, this.errorValue = t.errorValue) } var e, n, r, o, a, s, u, l, c, f, h, d, p, g, v, y; return d = 11, g = 5, p = d - g, h = 65536 >> d, a = 1 << p, u = a - 1, l = 2, e = 1 << g, r = e - 1, f = 65536 >> g, c = 1024 >> g, s = f + c, y = s, v = 32, o = y + v, n = 1 << l, t.prototype.get = function (t) { var e; return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (e = (this.data[t >> g] << l) + (t & r), this.data[e]) : t <= 65535 ? (e = (this.data[f + (t - 55296 >> g)] << l) + (t & r), this.data[e]) : t < this.highStart ? (e = this.data[o - h + (t >> d)], e = this.data[e + (t >> g & u)], e = (e << l) + (t & r), this.data[e]) : this.data[this.data.length - n] }, t }(), t.exports = r }, function (t, e, n) { "use strict"; function r(t) { this.fontProvider = t } function i(t, e) { var n = []; if (t = t.replace(/\t/g, "    "), e) return n.push({ text: t }), n; for (var r, i = new v(t), o = 0; r = i.nextBreak();) { var a = t.slice(o, r.position); r.required || a.match(/\r?\n$|\r$/) ? (a = a.replace(/\r?\n$|\r$/, ""), n.push({ text: a, lineEnd: !0 })) : n.push({ text: a }), o = r.position } return n } function o(t, e) { e = e || {}, t = t || {}; for (var n in t) "text" != n && t.hasOwnProperty(n) && (e[n] = t[n]); return e } function a(t, e) { function n(t) { return t.reduce(function (t, e) { var r = p(e.text) ? n(e.text) : e, i = [].concat(r).some(Array.isArray); return t.concat(i ? n(r) : r) }, []) } function r(t, e, n) { if (g(e[t])) return null; if (e[t].lineEnd) return null; var r = e[t].text; if (n) { var o = i(s(r), !1); if (g(o[o.length - 1])) return null; r = o[o.length - 1].text } return r } var a = []; p(t) || (t = [t]), t = n(t); for (var l = null, c = 0, f = t.length; c < f; c++) { var h, v = t[c], y = null, b = u(v || {}, e, "noWrap", !1); if (d(v) ? (v._textRef && v._textRef._textNodeRef.text && (v.text = v._textRef._textNodeRef.text), h = i(s(v.text), b), y = o(v)) : h = i(s(v), b), l && h.length) { 1 === i(s(l + r(0, h, b)), !1).length && (a[a.length - 1].noNewLine = !0) } for (var m = 0, w = h.length; m < w; m++) { var x = { text: h[m].text }; h[m].lineEnd && (x.lineEnd = !0), o(y, x), a.push(x) } l = null, c + 1 < f && (l = r(h.length - 1, h, b)) } return a } function s(t) { return void 0 === t || null === t ? "" : h(t) ? t.toString() : f(t) ? t : t.toString() } function u(t, e, n, r) { var i; return void 0 !== t[n] && null !== t[n] ? t[n] : e ? (e.auto(t, function () { i = e.getProperty(n) }), null !== i && void 0 !== i ? i : r) : r } function l(t, e, n) { var r = a(e, n); if (r.length) { var i = u(r[0], n, "leadingIndent", 0); i && (r[0].leadingCut = -i, r[0].leadingIndent = i) } return r.forEach(function (e) { var r = u(e, n, "font", "Roboto"), i = u(e, n, "fontSize", 12), o = u(e, n, "fontFeatures", null), a = u(e, n, "bold", !1), s = u(e, n, "italics", !1), l = u(e, n, "color", "black"), f = u(e, n, "decoration", null), h = u(e, n, "decorationColor", null), d = u(e, n, "decorationStyle", null), p = u(e, n, "background", null), g = u(e, n, "lineHeight", 1), v = u(e, n, "characterSpacing", 0), m = u(e, n, "link", null), w = u(e, n, "linkToPage", null), x = u(e, n, "noWrap", null), _ = u(e, n, "preserveLeadingSpaces", !1), k = u(e, n, "preserveTrailingSpaces", !1), S = u(e, n, "opacity", 1), C = t.provideFont(r, a, s); e.width = c(e.text, C, i, v, o), e.height = C.lineHeight(i) * g, e.leadingCut || (e.leadingCut = 0); var A; !_ && (A = e.text.match(y)) && (e.leadingCut += c(A[0], C, i, v, o)); var P; !k && (P = e.text.match(b)) ? e.trailingCut = c(P[0], C, i, v, o) : e.trailingCut = 0, e.alignment = u(e, n, "alignment", "left"), e.font = C, e.fontSize = i, e.fontFeatures = o, e.characterSpacing = v, e.color = l, e.decoration = f, e.decorationColor = h, e.decorationStyle = d, e.background = p, e.link = m, e.linkToPage = w, e.noWrap = x, e.opacity = S }), r } function c(t, e, n, r, i) { return e.widthOfString(t, n, i) + (r || 0) * (t.length - 1) } var f = n(0).isString, h = n(0).isNumber, d = n(0).isObject, p = n(0).isArray, g = n(0).isUndefined, v = n(200), y = /^(\s)+/g, b = /(\s)+$/g; r.prototype.buildInlines = function (t, e) { function n(t) { return Math.max(0, t.width - t.leadingCut - t.trailingCut) } var r, i = l(this.fontProvider, t, e), o = 0, a = 0; return i.forEach(function (t) { o = Math.max(o, t.width - t.leadingCut - t.trailingCut), r || (r = { width: 0, leadingCut: t.leadingCut, trailingCut: 0 }), r.width += t.width, r.trailingCut = t.trailingCut, a = Math.max(a, n(r)), t.lineEnd && (r = null) }), u({}, e, "noWrap", !1) && (o = a), { items: i, minWidth: o, maxWidth: a } }, r.prototype.sizeOfString = function (t, e) { t = t ? t.toString().replace(/\t/g, "    ") : ""; var n = u({}, e, "font", "Roboto"), r = u({}, e, "fontSize", 12), i = u({}, e, "fontFeatures", null), o = u({}, e, "bold", !1), a = u({}, e, "italics", !1), s = u({}, e, "lineHeight", 1), l = u({}, e, "characterSpacing", 0), f = this.fontProvider.provideFont(n, o, a); return { width: c(t, f, r, l, i), height: f.lineHeight(r) * s, fontSize: r, lineHeight: s, ascender: f.ascender / 1e3 * r, descender: f.descender / 1e3 * r } }, r.prototype.widthOfString = function (t, e, n, r, i) { return c(t, e, n, r, i) }, t.exports = r }, function (t, e, n) { "use strict"; function r(t, e) { var n = [], r = 0, a = 0, u = [], l = 0, c = 0, f = [], h = e; t.forEach(function (t) { i(t) ? (n.push(t), r += t._minWidth, a += t._maxWidth) : o(t) ? (u.push(t), l = Math.max(l, t._minWidth), c = Math.max(c, t._maxWidth)) : f.push(t) }), f.forEach(function (t) { s(t.width) && /\d+%/.test(t.width) && (t.width = parseFloat(t.width) * h / 100), t.width < t._minWidth && t.elasticWidth ? t._calcWidth = t._minWidth : t._calcWidth = t.width, e -= t._calcWidth }); var d = r + l * u.length, p = a + c * u.length; if (d >= e) n.forEach(function (t) { t._calcWidth = t._minWidth }), u.forEach(function (t) { t._calcWidth = l }); else { if (p < e) n.forEach(function (t) { t._calcWidth = t._maxWidth, e -= t._calcWidth }); else { var g = e - d, v = p - d; n.forEach(function (t) { var n = t._maxWidth - t._minWidth; t._calcWidth = t._minWidth + n * g / v, e -= t._calcWidth }) } if (u.length > 0) { var y = e / u.length; u.forEach(function (t) { t._calcWidth = y }) } } } function i(t) { return "auto" === t.width } function o(t) { return null === t.width || void 0 === t.width || "*" === t.width || "star" === t.width } function a(t) { for (var e = { min: 0, max: 0 }, n = { min: 0, max: 0 }, r = 0, a = 0, s = t.length; a < s; a++) { var u = t[a]; o(u) ? (n.min = Math.max(n.min, u._minWidth), n.max = Math.max(n.max, u._maxWidth), r++) : i(u) ? (e.min += u._minWidth, e.max += u._maxWidth) : (e.min += void 0 !== u.width && u.width || u._minWidth, e.max += void 0 !== u.width && u.width || u._maxWidth) } return r && (e.min += r * n.min, e.max += r * n.max), e } var s = n(0).isString; t.exports = { buildColumnWidths: r, measureMinMax: a, isAutoColumn: i, isStarColumn: o } }, function (t, e) { var n = {}.toString; t.exports = Array.isArray || function (t) { return "[object Array]" == n.call(t) } }, function (t, e, n) { t.exports = !n(11) && !n(14)(function () { return 7 != Object.defineProperty(n(138)("div"), "a", { get: function () { return 7 } }).a }) }, function (t, e, n) { var r = n(13), i = n(8).document, o = r(i) && r(i.createElement); t.exports = function (t) { return o ? i.createElement(t) : {} } }, function (t, e) { t.exports = function (t) { if ("function" != typeof t) throw TypeError(t + " is not a function!"); return t } }, function (t, e, n) { var r = n(24), i = n(41), o = n(82)(!1), a = n(83)("IE_PROTO"); t.exports = function (t, e) { var n, s = i(t), u = 0, l = []; for (n in s) n != a && r(s, n) && l.push(n); for (; e.length > u;)r(s, n = e[u++]) && (~o(l, n) || l.push(n)); return l } }, function (t, e, n) { var r = n(7), i = n(14), o = n(42), a = /"/g, s = function (t, e, n, r) { var i = String(o(t)), s = "<" + e; return "" !== n && (s += " " + n + '="' + String(r).replace(a, "&quot;") + '"'), s + ">" + i + "</" + e + ">" }; t.exports = function (t, e) { var n = {}; n[t] = e(s), r(r.P + r.F * i(function () { var e = ""[t]('"'); return e !== e.toLowerCase() || e.split('"').length > 3 }), "String", n) } }, function (t, e, n) { for (var r, i = n(8), o = n(16), a = n(29), s = a("typed_array"), u = a("view"), l = !(!i.ArrayBuffer || !i.DataView), c = l, f = 0, h = "Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array".split(","); f < 9;)(r = i[h[f++]]) ? (o(r.prototype, s, !0), o(r.prototype, u, !0)) : c = !1; t.exports = { ABV: l, CONSTR: c, TYPED: s, VIEW: u } }, function (t, e, n) { var r = n(31), i = n(15); t.exports = function (t) { if (void 0 === t) return 0; var e = r(t), n = i(e); if (e !== n) throw RangeError("Wrong length!"); return n } }, function (t, e, n) { var r = n(24), i = n(25), o = n(83)("IE_PROTO"), a = Object.prototype; t.exports = Object.getPrototypeOf || function (t) { return t = i(t), r(t, o) ? t[o] : "function" == typeof t.constructor && t instanceof t.constructor ? t.constructor.prototype : t instanceof Object ? a : null } }, function (t, e, n) { var r = n(62); t.exports = Array.isArray || function (t) { return "Array" == r(t) } }, function (t, e, n) { var r = n(10), i = n(139), o = n(4)("species"); t.exports = function (t, e) { var n, a = r(t).constructor; return void 0 === a || void 0 == (n = r(a)[o]) ? e : i(n) } }, function (t, e) { t.exports = function (t, e) { return { value: e, done: !!t } } }, function (t, e, n) { "use strict"; var r = n(8), i = n(9), o = n(11), a = n(4)("species"); t.exports = function (t) { var e = r[t]; o && e && !e[a] && i.f(e, a, { configurable: !0, get: function () { return this } }) } }, function (t, e, n) { "use strict"; var r = n(150), i = n(10), o = n(146), a = n(95), s = n(15), u = n(97), l = n(99), c = n(14), f = Math.min, h = [].push, d = "length", p = !c(function () { RegExp(4294967295, "y") }); n(98)("split", 2, function (t, e, n, c) { var g; return g = "c" == "abbc".split(/(b)*/)[1] || 4 != "test".split(/(?:)/, -1)[d] || 2 != "ab".split(/(?:ab)*/)[d] || 4 != ".".split(/(.?)(.?)/)[d] || ".".split(/()()/)[d] > 1 || "".split(/.?/)[d] ? function (t, e) { var i = String(this); if (void 0 === t && 0 === e) return []; if (!r(t)) return n.call(i, t, e); for (var o, a, s, u = [], c = (t.ignoreCase ? "i" : "") + (t.multiline ? "m" : "") + (t.unicode ? "u" : "") + (t.sticky ? "y" : ""), f = 0, p = void 0 === e ? 4294967295 : e >>> 0, g = new RegExp(t.source, c + "g"); (o = l.call(g, i)) && !((a = g.lastIndex) > f && (u.push(i.slice(f, o.index)), o[d] > 1 && o.index < i[d] && h.apply(u, o.slice(1)), s = o[0][d], f = a, u[d] >= p));)g.lastIndex === o.index && g.lastIndex++; return f === i[d] ? !s && g.test("") || u.push("") : u.push(i.slice(f)), u[d] > p ? u.slice(0, p) : u } : "0".split(void 0, 0)[d] ? function (t, e) { return void 0 === t && 0 === e ? [] : n.call(this, t, e) } : n, [function (n, r) { var i = t(this), o = void 0 == n ? void 0 : n[e]; return void 0 !== o ? o.call(n, i, r) : g.call(String(i), n, r) }, function (t, e) { var r = c(g, t, this, e, g !== n); if (r.done) return r.value; var l = i(t), h = String(this), d = o(l, RegExp), v = l.unicode, y = (l.ignoreCase ? "i" : "") + (l.multiline ? "m" : "") + (l.unicode ? "u" : "") + (p ? "y" : "g"), b = new d(p ? l : "^(?:" + l.source + ")", y), m = void 0 === e ? 4294967295 : e >>> 0; if (0 === m) return []; if (0 === h.length) return null === u(b, h) ? [h] : []; for (var w = 0, x = 0, _ = []; x < h.length;) { b.lastIndex = p ? x : 0; var k, S = u(b, p ? h : h.slice(x)); if (null === S || (k = f(s(b.lastIndex + (p ? 0 : x)), h.length)) === w) x = a(h, x, v); else { if (_.push(h.slice(w, x)), _.length === m) return _; for (var C = 1; C <= S.length - 1; C++)if (_.push(S[C]), _.length === m) return _; x = w = k } } return _.push(h.slice(w)), _ }] }) }, function (t, e, n) { var r = n(13), i = n(62), o = n(4)("match"); t.exports = function (t) { var e; return r(t) && (void 0 !== (e = t[o]) ? !!e : "RegExp" == i(t)) } }, function (t, e, n) { "use strict"; var r = n(96)(!0); n(92)(String, "String", function (t) { this._t = String(t), this._i = 0 }, function () { var t, e = this._t, n = this._i; return n >= e.length ? { value: void 0, done: !0 } : (t = r(e, n), this._i += t.length, { value: t, done: !1 }) }) }, function (t, e, n) { var r = n(10); t.exports = function (t, e, n, i) { try { return i ? e(r(n)[0], n[1]) : e(n) } catch (e) { var o = t.return; throw void 0 !== o && r(o.call(t)), e } } }, function (t, e, n) { for (var r = n(91), i = n(52), o = n(23), a = n(8), s = n(16), u = n(43), l = n(4), c = l("iterator"), f = l("toStringTag"), h = u.Array, d = { CSSRuleList: !0, CSSStyleDeclaration: !1, CSSValueList: !1, ClientRectList: !1, DOMRectList: !1, DOMStringList: !1, DOMTokenList: !0, DataTransferItemList: !1, FileList: !1, HTMLAllCollection: !1, HTMLCollection: !1, HTMLFormElement: !1, HTMLSelectElement: !1, MediaList: !0, MimeTypeArray: !1, NamedNodeMap: !1, NodeList: !0, PaintRequestList: !1, Plugin: !1, PluginArray: !1, SVGLengthList: !1, SVGNumberList: !1, SVGPathSegList: !1, SVGPointList: !1, SVGStringList: !1, SVGTransformList: !1, SourceBufferList: !1, StyleSheetList: !0, TextTrackCueList: !1, TextTrackList: !1, TouchList: !1 }, p = i(d), g = 0; g < p.length; g++) { var v, y = p[g], b = d[y], m = a[y], w = m && m.prototype; if (w && (w[c] || s(w, c, h), w[f] || s(w, f, y), u[y] = h, b)) for (v in r) w[v] || o(w, v, r[v], !0) } }, function (t, e, n) { var r = n(13), i = n(10), o = function (t, e) { if (i(t), !r(e) && null !== e) throw TypeError(e + ": can't set as prototype!") }; t.exports = { set: Object.setPrototypeOf || ("__proto__" in {} ? function (t, e, r) { try { r = n(30)(Function.call, n(94).f(Object.prototype, "__proto__").set, 2), r(t, []), e = !(t instanceof Array) } catch (t) { e = !0 } return function (t, n) { return o(t, n), e ? t.__proto__ = n : r(t, n), t } }({}, !1) : void 0), check: o } }, function (t, e, n) { var r = n(8), i = n(51), o = n(40), a = n(156), s = n(9).f; t.exports = function (t) { var e = i.Symbol || (i.Symbol = o ? {} : r.Symbol || {}); "_" == t.charAt(0) || t in e || s(e, t, { value: a.f(t) }) } }, function (t, e, n) { e.f = n(4) }, function (t, e, n) { "use strict"; (function (t) { function r(t, e, n) { function r() { for (var e; null !== (e = t.read());)a.push(e), s += e.length; t.once("readable", r) } function i(e) { t.removeListener("end", o), t.removeListener("readable", r), n(e) } function o() { var e, r = null; s >= x ? r = new RangeError(_) : e = v.concat(a, s), a = [], t.close(), n(r, e) } var a = [], s = 0; t.on("error", i), t.on("end", o), t.end(e), r() } function i(t, e) { if ("string" == typeof e && (e = v.from(e)), !v.isBuffer(e)) throw new TypeError("Not a string or buffer"); var n = t._finishFlushFlag; return t._processChunk(e, n) } function o(t) { if (!(this instanceof o)) return new o(t); d.call(this, t, b.DEFLATE) } function a(t) { if (!(this instanceof a)) return new a(t); d.call(this, t, b.INFLATE) } function s(t) { if (!(this instanceof s)) return new s(t); d.call(this, t, b.GZIP) } function u(t) { if (!(this instanceof u)) return new u(t); d.call(this, t, b.GUNZIP) } function l(t) { if (!(this instanceof l)) return new l(t); d.call(this, t, b.DEFLATERAW) } function c(t) { if (!(this instanceof c)) return new c(t); d.call(this, t, b.INFLATERAW) } function f(t) { if (!(this instanceof f)) return new f(t); d.call(this, t, b.UNZIP) } function h(t) { return t === b.Z_NO_FLUSH || t === b.Z_PARTIAL_FLUSH || t === b.Z_SYNC_FLUSH || t === b.Z_FULL_FLUSH || t === b.Z_FINISH || t === b.Z_BLOCK } function d(t, n) { var r = this; if (this._opts = t = t || {}, this._chunkSize = t.chunkSize || e.Z_DEFAULT_CHUNK, y.call(this, t), t.flush && !h(t.flush)) throw new Error("Invalid flush flag: " + t.flush); if (t.finishFlush && !h(t.finishFlush)) throw new Error("Invalid flush flag: " + t.finishFlush); if (this._flushFlag = t.flush || b.Z_NO_FLUSH, this._finishFlushFlag = void 0 !== t.finishFlush ? t.finishFlush : b.Z_FINISH, t.chunkSize && (t.chunkSize < e.Z_MIN_CHUNK || t.chunkSize > e.Z_MAX_CHUNK)) throw new Error("Invalid chunk size: " + t.chunkSize); if (t.windowBits && (t.windowBits < e.Z_MIN_WINDOWBITS || t.windowBits > e.Z_MAX_WINDOWBITS)) throw new Error("Invalid windowBits: " + t.windowBits); if (t.level && (t.level < e.Z_MIN_LEVEL || t.level > e.Z_MAX_LEVEL)) throw new Error("Invalid compression level: " + t.level); if (t.memLevel && (t.memLevel < e.Z_MIN_MEMLEVEL || t.memLevel > e.Z_MAX_MEMLEVEL)) throw new Error("Invalid memLevel: " + t.memLevel); if (t.strategy && t.strategy != e.Z_FILTERED && t.strategy != e.Z_HUFFMAN_ONLY && t.strategy != e.Z_RLE && t.strategy != e.Z_FIXED && t.strategy != e.Z_DEFAULT_STRATEGY) throw new Error("Invalid strategy: " + t.strategy); if (t.dictionary && !v.isBuffer(t.dictionary)) throw new Error("Invalid dictionary: it should be a Buffer instance"); this._handle = new b.Zlib(n); var i = this; this._hadError = !1, this._handle.onerror = function (t, n) { p(i), i._hadError = !0; var r = new Error(t); r.errno = n, r.code = e.codes[n], i.emit("error", r) }; var o = e.Z_DEFAULT_COMPRESSION; "number" == typeof t.level && (o = t.level); var a = e.Z_DEFAULT_STRATEGY; "number" == typeof t.strategy && (a = t.strategy), this._handle.init(t.windowBits || e.Z_DEFAULT_WINDOWBITS, o, t.memLevel || e.Z_DEFAULT_MEMLEVEL, a, t.dictionary), this._buffer = v.allocUnsafe(this._chunkSize), this._offset = 0, this._level = o, this._strategy = a, this.once("end", this.close), Object.defineProperty(this, "_closed", { get: function () { return !r._handle }, configurable: !0, enumerable: !0 }) } function p(e, n) { n && t.nextTick(n), e._handle && (e._handle.close(), e._handle = null) } function g(t) { t.emit("close") } var v = n(3).Buffer, y = n(102).Transform, b = n(254), m = n(106), w = n(162).ok, x = n(3).kMaxLength, _ = "Cannot create final Buffer. It would be larger than 0x" + x.toString(16) + " bytes"; b.Z_MIN_WINDOWBITS = 8, b.Z_MAX_WINDOWBITS = 15, b.Z_DEFAULT_WINDOWBITS = 15, b.Z_MIN_CHUNK = 64, b.Z_MAX_CHUNK = 1 / 0, b.Z_DEFAULT_CHUNK = 16384, b.Z_MIN_MEMLEVEL = 1, b.Z_MAX_MEMLEVEL = 9, b.Z_DEFAULT_MEMLEVEL = 8, b.Z_MIN_LEVEL = -1, b.Z_MAX_LEVEL = 9, b.Z_DEFAULT_LEVEL = b.Z_DEFAULT_COMPRESSION; for (var k = Object.keys(b), S = 0; S < k.length; S++) { var C = k[S]; C.match(/^Z/) && Object.defineProperty(e, C, { enumerable: !0, value: b[C], writable: !1 }) } for (var A = { Z_OK: b.Z_OK, Z_STREAM_END: b.Z_STREAM_END, Z_NEED_DICT: b.Z_NEED_DICT, Z_ERRNO: b.Z_ERRNO, Z_STREAM_ERROR: b.Z_STREAM_ERROR, Z_DATA_ERROR: b.Z_DATA_ERROR, Z_MEM_ERROR: b.Z_MEM_ERROR, Z_BUF_ERROR: b.Z_BUF_ERROR, Z_VERSION_ERROR: b.Z_VERSION_ERROR }, P = Object.keys(A), E = 0; E < P.length; E++) { var O = P[E]; A[A[O]] = O } Object.defineProperty(e, "codes", { enumerable: !0, value: Object.freeze(A), writable: !1 }), e.Deflate = o, e.Inflate = a, e.Gzip = s, e.Gunzip = u, e.DeflateRaw = l, e.InflateRaw = c, e.Unzip = f, e.createDeflate = function (t) { return new o(t) }, e.createInflate = function (t) { return new a(t) }, e.createDeflateRaw = function (t) { return new l(t) }, e.createInflateRaw = function (t) { return new c(t) }, e.createGzip = function (t) { return new s(t) }, e.createGunzip = function (t) { return new u(t) }, e.createUnzip = function (t) { return new f(t) }, e.deflate = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new o(e), t, n) }, e.deflateSync = function (t, e) { return i(new o(e), t) }, e.gzip = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new s(e), t, n) }, e.gzipSync = function (t, e) { return i(new s(e), t) }, e.deflateRaw = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new l(e), t, n) }, e.deflateRawSync = function (t, e) { return i(new l(e), t) }, e.unzip = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new f(e), t, n) }, e.unzipSync = function (t, e) { return i(new f(e), t) }, e.inflate = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new a(e), t, n) }, e.inflateSync = function (t, e) { return i(new a(e), t) }, e.gunzip = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new u(e), t, n) }, e.gunzipSync = function (t, e) { return i(new u(e), t) }, e.inflateRaw = function (t, e, n) { return "function" == typeof e && (n = e, e = {}), r(new c(e), t, n) }, e.inflateRawSync = function (t, e) { return i(new c(e), t) }, m.inherits(d, y), d.prototype.params = function (n, r, i) { if (n < e.Z_MIN_LEVEL || n > e.Z_MAX_LEVEL) throw new RangeError("Invalid compression level: " + n); if (r != e.Z_FILTERED && r != e.Z_HUFFMAN_ONLY && r != e.Z_RLE && r != e.Z_FIXED && r != e.Z_DEFAULT_STRATEGY) throw new TypeError("Invalid strategy: " + r); if (this._level !== n || this._strategy !== r) { var o = this; this.flush(b.Z_SYNC_FLUSH, function () { w(o._handle, "zlib binding closed"), o._handle.params(n, r), o._hadError || (o._level = n, o._strategy = r, i && i()) }) } else t.nextTick(i) }, d.prototype.reset = function () { return w(this._handle, "zlib binding closed"), this._handle.reset() }, d.prototype._flush = function (t) { this._transform(v.alloc(0), "", t) }, d.prototype.flush = function (e, n) { var r = this, i = this._writableState; ("function" == typeof e || void 0 === e && !n) && (n = e, e = b.Z_FULL_FLUSH), i.ended ? n && t.nextTick(n) : i.ending ? n && this.once("end", n) : i.needDrain ? n && this.once("drain", function () { return r.flush(e, n) }) : (this._flushFlag = e, this.write(v.alloc(0), "", n)) }, d.prototype.close = function (e) { p(this, e), t.nextTick(g, this) }, d.prototype._transform = function (t, e, n) { var r, i = this._writableState, o = i.ending || i.ended, a = o && (!t || i.length === t.length); return null === t || v.isBuffer(t) ? this._handle ? (a ? r = this._finishFlushFlag : (r = this._flushFlag, t.length >= i.length && (this._flushFlag = this._opts.flush || b.Z_NO_FLUSH)), void this._processChunk(t, r, n)) : n(new Error("zlib binding closed")) : n(new Error("invalid input")) }, d.prototype._processChunk = function (t, e, n) { function r(l, h) { if (this && (this.buffer = null, this.callback = null), !s._hadError) { var d = o - h; if (w(d >= 0, "have should not go down"), d > 0) { var p = s._buffer.slice(s._offset, s._offset + d); s._offset += d, u ? s.push(p) : (c.push(p), f += p.length) } if ((0 === h || s._offset >= s._chunkSize) && (o = s._chunkSize, s._offset = 0, s._buffer = v.allocUnsafe(s._chunkSize)), 0 === h) { if (a += i - l, i = l, !u) return !0; var g = s._handle.write(e, t, a, i, s._buffer, s._offset, s._chunkSize); return g.callback = r, void (g.buffer = t) } if (!u) return !1; n() } } var i = t && t.length, o = this._chunkSize - this._offset, a = 0, s = this, u = "function" == typeof n; if (!u) { var l, c = [], f = 0; this.on("error", function (t) { l = t }), w(this._handle, "zlib binding closed"); do { var h = this._handle.writeSync(e, t, a, i, this._buffer, this._offset, o) } while (!this._hadError && r(h[0], h[1])); if (this._hadError) throw l; if (f >= x) throw p(this), new RangeError(_); var d = v.concat(c, f); return p(this), d } w(this._handle, "zlib binding closed"); var g = this._handle.write(e, t, a, i, this._buffer, this._offset, o); g.buffer = t, g.callback = r }, m.inherits(o, d), m.inherits(a, d), m.inherits(s, d), m.inherits(u, d), m.inherits(l, d), m.inherits(c, d), m.inherits(f, d) }).call(e, n(21)) }, function (t, e, n) { "use strict"; (function (e, r) { function i(t) { return D.from(t) } function o(t) { return D.isBuffer(t) || t instanceof z } function a(t, e, n) { if ("function" == typeof t.prependListener) return t.prependListener(e, n); t._events && t._events[e] ? R(t._events[e]) ? t._events[e].unshift(n) : t._events[e] = [n, t._events[e]] : t.on(e, n) } function s(t, e) { L = L || n(33), t = t || {}; var r = e instanceof L; this.objectMode = !!t.objectMode, r && (this.objectMode = this.objectMode || !!t.readableObjectMode); var i = t.highWaterMark, o = t.readableHighWaterMark, a = this.objectMode ? 16 : 16384; this.highWaterMark = i || 0 === i ? i : r && (o || 0 === o) ? o : a, this.highWaterMark = Math.floor(this.highWaterMark), this.buffer = new G, this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = t.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, t.encoding && (j || (j = n(105).StringDecoder), this.decoder = new j(t.encoding), this.encoding = t.encoding) } function u(t) { if (L = L || n(33), !(this instanceof u)) return new u(t); this._readableState = new s(t, this), this.readable = !0, t && ("function" == typeof t.read && (this._read = t.read), "function" == typeof t.destroy && (this._destroy = t.destroy)), F.call(this) } function l(t, e, n, r, o) { var a = t._readableState; if (null === e) a.reading = !1, g(t, a); else { var s; o || (s = f(a, e)), s ? t.emit("error", s) : a.objectMode || e && e.length > 0 ? ("string" == typeof e || a.objectMode || Object.getPrototypeOf(e) === D.prototype || (e = i(e)), r ? a.endEmitted ? t.emit("error", new Error("stream.unshift() after end event")) : c(t, a, e, !0) : a.ended ? t.emit("error", new Error("stream.push() after EOF")) : (a.reading = !1, a.decoder && !n ? (e = a.decoder.write(e), a.objectMode || 0 !== e.length ? c(t, a, e, !1) : b(t, a)) : c(t, a, e, !1))) : r || (a.reading = !1) } return h(a) } function c(t, e, n, r) { e.flowing && 0 === e.length && !e.sync ? (t.emit("data", n), t.read(0)) : (e.length += e.objectMode ? 1 : n.length, r ? e.buffer.unshift(n) : e.buffer.push(n), e.needReadable && v(t)), b(t, e) } function f(t, e) { var n; return o(e) || "string" == typeof e || void 0 === e || t.objectMode || (n = new TypeError("Invalid non-string/buffer chunk")), n } function h(t) { return !t.ended && (t.needReadable || t.length < t.highWaterMark || 0 === t.length) } function d(t) { return t >= q ? t = q : (t-- , t |= t >>> 1, t |= t >>> 2, t |= t >>> 4, t |= t >>> 8, t |= t >>> 16, t++), t } function p(t, e) { return t <= 0 || 0 === e.length && e.ended ? 0 : e.objectMode ? 1 : t !== t ? e.flowing && e.length ? e.buffer.head.data.length : e.length : (t > e.highWaterMark && (e.highWaterMark = d(t)), t <= e.length ? t : e.ended ? e.length : (e.needReadable = !0, 0)) } function g(t, e) { if (!e.ended) { if (e.decoder) { var n = e.decoder.end(); n && n.length && (e.buffer.push(n), e.length += e.objectMode ? 1 : n.length) } e.ended = !0, v(t) } } function v(t) { var e = t._readableState; e.needReadable = !1, e.emittedReadable || (U("emitReadable", e.flowing), e.emittedReadable = !0, e.sync ? B.nextTick(y, t) : y(t)) } function y(t) { U("emit readable"), t.emit("readable"), S(t) } function b(t, e) { e.readingMore || (e.readingMore = !0, B.nextTick(m, t, e)) } function m(t, e) { for (var n = e.length; !e.reading && !e.flowing && !e.ended && e.length < e.highWaterMark && (U("maybeReadMore read 0"), t.read(0), n !== e.length);)n = e.length; e.readingMore = !1 } function w(t) { return function () { var e = t._readableState; U("pipeOnDrain", e.awaitDrain), e.awaitDrain && e.awaitDrain-- , 0 === e.awaitDrain && M(t, "data") && (e.flowing = !0, S(t)) } } function x(t) { U("readable nexttick read 0"), t.read(0) } function _(t, e) { e.resumeScheduled || (e.resumeScheduled = !0, B.nextTick(k, t, e)) } function k(t, e) { e.reading || (U("resume read 0"), t.read(0)), e.resumeScheduled = !1, e.awaitDrain = 0, t.emit("resume"), S(t), e.flowing && !e.reading && t.read(0) } function S(t) { var e = t._readableState; for (U("flow", e.flowing); e.flowing && null !== t.read();); } function C(t, e) { if (0 === e.length) return null; var n; return e.objectMode ? n = e.buffer.shift() : !t || t >= e.length ? (n = e.decoder ? e.buffer.join("") : 1 === e.buffer.length ? e.buffer.head.data : e.buffer.concat(e.length), e.buffer.clear()) : n = A(t, e.buffer, e.decoder), n } function A(t, e, n) { var r; return t < e.head.data.length ? (r = e.head.data.slice(0, t), e.head.data = e.head.data.slice(t)) : r = t === e.head.data.length ? e.shift() : n ? P(t, e) : E(t, e), r } function P(t, e) { var n = e.head, r = 1, i = n.data; for (t -= i.length; n = n.next;) { var o = n.data, a = t > o.length ? o.length : t; if (a === o.length ? i += o : i += o.slice(0, t), 0 === (t -= a)) { a === o.length ? (++r, n.next ? e.head = n.next : e.head = e.tail = null) : (e.head = n, n.data = o.slice(a)); break } ++r } return e.length -= r, i } function E(t, e) { var n = D.allocUnsafe(t), r = e.head, i = 1; for (r.data.copy(n), t -= r.data.length; r = r.next;) { var o = r.data, a = t > o.length ? o.length : t; if (o.copy(n, n.length - t, 0, a), 0 === (t -= a)) { a === o.length ? (++i, r.next ? e.head = r.next : e.head = e.tail = null) : (e.head = r, r.data = o.slice(a)); break } ++i } return e.length -= i, n } function O(t) { var e = t._readableState; if (e.length > 0) throw new Error('"endReadable()" called on non-empty stream'); e.endEmitted || (e.ended = !0, B.nextTick(T, e, t)) } function T(t, e) { t.endEmitted || 0 !== t.length || (t.endEmitted = !0, e.readable = !1, e.emit("end")) } function I(t, e) { for (var n = 0, r = t.length; n < r; n++)if (t[n] === e) return n; return -1 } var B = n(69); t.exports = u; var L, R = n(136); u.ReadableState = s; var M = (n(68).EventEmitter, function (t, e) { return t.listeners(e).length }), F = n(159), D = n(70).Buffer, z = e.Uint8Array || function () { }, N = n(55); N.inherits = n(32); var W = n(245), U = void 0; U = W && W.debuglog ? W.debuglog("stream") : function () { }; var j, G = n(246), H = n(160); N.inherits(u, F); var V = ["error", "close", "destroy", "pause", "resume"]; Object.defineProperty(u.prototype, "destroyed", { get: function () { return void 0 !== this._readableState && this._readableState.destroyed }, set: function (t) { this._readableState && (this._readableState.destroyed = t) } }), u.prototype.destroy = H.destroy, u.prototype._undestroy = H.undestroy, u.prototype._destroy = function (t, e) { this.push(null), e(t) }, u.prototype.push = function (t, e) { var n, r = this._readableState; return r.objectMode ? n = !0 : "string" == typeof t && (e = e || r.defaultEncoding, e !== r.encoding && (t = D.from(t, e), e = ""), n = !0), l(this, t, e, !1, n) }, u.prototype.unshift = function (t) { return l(this, t, null, !0, !1) }, u.prototype.isPaused = function () { return !1 === this._readableState.flowing }, u.prototype.setEncoding = function (t) { return j || (j = n(105).StringDecoder), this._readableState.decoder = new j(t), this._readableState.encoding = t, this }; var q = 8388608; u.prototype.read = function (t) { U("read", t), t = parseInt(t, 10); var e = this._readableState, n = t; if (0 !== t && (e.emittedReadable = !1), 0 === t && e.needReadable && (e.length >= e.highWaterMark || e.ended)) return U("read: emitReadable", e.length, e.ended), 0 === e.length && e.ended ? O(this) : v(this), null; if (0 === (t = p(t, e)) && e.ended) return 0 === e.length && O(this), null; var r = e.needReadable; U("need readable", r), (0 === e.length || e.length - t < e.highWaterMark) && (r = !0, U("length less than watermark", r)), e.ended || e.reading ? (r = !1, U("reading or ended", r)) : r && (U("do read"), e.reading = !0, e.sync = !0, 0 === e.length && (e.needReadable = !0), this._read(e.highWaterMark), e.sync = !1, e.reading || (t = p(n, e))); var i; return i = t > 0 ? C(t, e) : null, null === i ? (e.needReadable = !0, t = 0) : e.length -= t, 0 === e.length && (e.ended || (e.needReadable = !0), n !== t && e.ended && O(this)), null !== i && this.emit("data", i), i }, u.prototype._read = function (t) { this.emit("error", new Error("_read() is not implemented")) }, u.prototype.pipe = function (t, e) { function n(t, e) { U("onunpipe"), t === h && e && !1 === e.hasUnpiped && (e.hasUnpiped = !0, o()) } function i() { U("onend"), t.end() } function o() { U("cleanup"), t.removeListener("close", l), t.removeListener("finish", c), t.removeListener("drain", v), t.removeListener("error", u), t.removeListener("unpipe", n), h.removeListener("end", i), h.removeListener("end", f), h.removeListener("data", s), y = !0, !d.awaitDrain || t._writableState && !t._writableState.needDrain || v() } function s(e) { U("ondata"), b = !1, !1 !== t.write(e) || b || ((1 === d.pipesCount && d.pipes === t || d.pipesCount > 1 && -1 !== I(d.pipes, t)) && !y && (U("false write response, pause", h._readableState.awaitDrain), h._readableState.awaitDrain++ , b = !0), h.pause()) } function u(e) { U("onerror", e), f(), t.removeListener("error", u), 0 === M(t, "error") && t.emit("error", e) } function l() { t.removeListener("finish", c), f() } function c() { U("onfinish"), t.removeListener("close", l), f() } function f() { U("unpipe"), h.unpipe(t) } var h = this, d = this._readableState; switch (d.pipesCount) { case 0: d.pipes = t; break; case 1: d.pipes = [d.pipes, t]; break; default: d.pipes.push(t) }d.pipesCount += 1, U("pipe count=%d opts=%j", d.pipesCount, e); var p = (!e || !1 !== e.end) && t !== r.stdout && t !== r.stderr, g = p ? i : f; d.endEmitted ? B.nextTick(g) : h.once("end", g), t.on("unpipe", n); var v = w(h); t.on("drain", v); var y = !1, b = !1; return h.on("data", s), a(t, "error", u), t.once("close", l), t.once("finish", c), t.emit("pipe", h), d.flowing || (U("pipe resume"), h.resume()), t }, u.prototype.unpipe = function (t) { var e = this._readableState, n = { hasUnpiped: !1 }; if (0 === e.pipesCount) return this; if (1 === e.pipesCount) return t && t !== e.pipes ? this : (t || (t = e.pipes), e.pipes = null, e.pipesCount = 0, e.flowing = !1, t && t.emit("unpipe", this, n), this); if (!t) { var r = e.pipes, i = e.pipesCount; e.pipes = null, e.pipesCount = 0, e.flowing = !1; for (var o = 0; o < i; o++)r[o].emit("unpipe", this, n); return this } var a = I(e.pipes, t); return -1 === a ? this : (e.pipes.splice(a, 1), e.pipesCount -= 1, 1 === e.pipesCount && (e.pipes = e.pipes[0]), t.emit("unpipe", this, n), this) }, u.prototype.on = function (t, e) { var n = F.prototype.on.call(this, t, e); if ("data" === t) !1 !== this._readableState.flowing && this.resume(); else if ("readable" === t) { var r = this._readableState; r.endEmitted || r.readableListening || (r.readableListening = r.needReadable = !0, r.emittedReadable = !1, r.reading ? r.length && v(this) : B.nextTick(x, this)) } return n }, u.prototype.addListener = u.prototype.on, u.prototype.resume = function () { var t = this._readableState; return t.flowing || (U("resume"), t.flowing = !0, _(this, t)), this }, u.prototype.pause = function () { return U("call pause flowing=%j", this._readableState.flowing), !1 !== this._readableState.flowing && (U("pause"), this._readableState.flowing = !1, this.emit("pause")), this }, u.prototype.wrap = function (t) { var e = this, n = this._readableState, r = !1; t.on("end", function () { if (U("wrapped end"), n.decoder && !n.ended) { var t = n.decoder.end(); t && t.length && e.push(t) } e.push(null) }), t.on("data", function (i) { if (U("wrapped data"), n.decoder && (i = n.decoder.write(i)), (!n.objectMode || null !== i && void 0 !== i) && (n.objectMode || i && i.length)) { e.push(i) || (r = !0, t.pause()) } }); for (var i in t) void 0 === this[i] && "function" == typeof t[i] && (this[i] = function (e) { return function () { return t[e].apply(t, arguments) } }(i)); for (var o = 0; o < V.length; o++)t.on(V[o], this.emit.bind(this, V[o])); return this._read = function (e) { U("wrapped _read", e), r && (r = !1, t.resume()) }, this }, Object.defineProperty(u.prototype, "readableHighWaterMark", { enumerable: !1, get: function () { return this._readableState.highWaterMark } }), u._fromList = C }).call(e, n(22), n(21)) }, function (t, e, n) { t.exports = n(68).EventEmitter }, function (t, e, n) { "use strict"; function r(t, e) { var n = this, r = this._readableState && this._readableState.destroyed, i = this._writableState && this._writableState.destroyed; return r || i ? (e ? e(t) : !t || this._writableState && this._writableState.errorEmitted || a.nextTick(o, this, t), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(t || null, function (t) { !e && t ? (a.nextTick(o, n, t), n._writableState && (n._writableState.errorEmitted = !0)) : e && e(t) }), this) } function i() { this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1) } function o(t, e) { t.emit("error", e) } var a = n(69); t.exports = { destroy: r, undestroy: i } }, function (t, e, n) { "use strict"; function r(t, e) { var n = this._transformState; n.transforming = !1; var r = n.writecb; if (!r) return this.emit("error", new Error("write callback called multiple times")); n.writechunk = null, n.writecb = null, null != e && this.push(e), r(t); var i = this._readableState; i.reading = !1, (i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark) } function i(t) { if (!(this instanceof i)) return new i(t); s.call(this, t), this._transformState = { afterTransform: r.bind(this), needTransform: !1, transforming: !1, writecb: null, writechunk: null, writeencoding: null }, this._readableState.needReadable = !0, this._readableState.sync = !1, t && ("function" == typeof t.transform && (this._transform = t.transform), "function" == typeof t.flush && (this._flush = t.flush)), this.on("prefinish", o) } function o() { var t = this; "function" == typeof this._flush ? this._flush(function (e, n) { a(t, e, n) }) : a(this, null, null) } function a(t, e, n) { if (e) return t.emit("error", e); if (null != n && t.push(n), t._writableState.length) throw new Error("Calling transform done when ws.length != 0"); if (t._transformState.transforming) throw new Error("Calling transform done when still transforming"); return t.push(null) } t.exports = i; var s = n(33), u = n(55); u.inherits = n(32), u.inherits(i, s), i.prototype.push = function (t, e) { return this._transformState.needTransform = !1, s.prototype.push.call(this, t, e) }, i.prototype._transform = function (t, e, n) { throw new Error("_transform() is not implemented") }, i.prototype._write = function (t, e, n) { var r = this._transformState; if (r.writecb = n, r.writechunk = t, r.writeencoding = e, !r.transforming) { var i = this._readableState; (r.needTransform || i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark) } }, i.prototype._read = function (t) { var e = this._transformState; null !== e.writechunk && e.writecb && !e.transforming ? (e.transforming = !0, this._transform(e.writechunk, e.writeencoding, e.afterTransform)) : e.needTransform = !0 }, i.prototype._destroy = function (t, e) { var n = this; s.prototype._destroy.call(this, t, function (t) { e(t), n.emit("close") }) } }, function (t, e, n) {
        "use strict"; (function (e) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
            function r(t, e) { if (t === e) return 0; for (var n = t.length, r = e.length, i = 0, o = Math.min(n, r); i < o; ++i)if (t[i] !== e[i]) { n = t[i], r = e[i]; break } return n < r ? -1 : r < n ? 1 : 0 } function i(t) { return e.Buffer && "function" == typeof e.Buffer.isBuffer ? e.Buffer.isBuffer(t) : !(null == t || !t._isBuffer) } function o(t) { return Object.prototype.toString.call(t) } function a(t) { return !i(t) && ("function" == typeof e.ArrayBuffer && ("function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t) : !!t && (t instanceof DataView || !!(t.buffer && t.buffer instanceof ArrayBuffer)))) } function s(t) { if (w.isFunction(t)) { if (k) return t.name; var e = t.toString(), n = e.match(C); return n && n[1] } } function u(t, e) { return "string" == typeof t ? t.length < e ? t : t.slice(0, e) : t } function l(t) { if (k || !w.isFunction(t)) return w.inspect(t); var e = s(t); return "[Function" + (e ? ": " + e : "") + "]" } function c(t) { return u(l(t.actual), 128) + " " + t.operator + " " + u(l(t.expected), 128) } function f(t, e, n, r, i) { throw new S.AssertionError({ message: n, actual: t, expected: e, operator: r, stackStartFunction: i }) } function h(t, e) { t || f(t, !0, e, "==", S.ok) } function d(t, e, n, s) { if (t === e) return !0; if (i(t) && i(e)) return 0 === r(t, e); if (w.isDate(t) && w.isDate(e)) return t.getTime() === e.getTime(); if (w.isRegExp(t) && w.isRegExp(e)) return t.source === e.source && t.global === e.global && t.multiline === e.multiline && t.lastIndex === e.lastIndex && t.ignoreCase === e.ignoreCase; if (null !== t && "object" == typeof t || null !== e && "object" == typeof e) { if (a(t) && a(e) && o(t) === o(e) && !(t instanceof Float32Array || t instanceof Float64Array)) return 0 === r(new Uint8Array(t.buffer), new Uint8Array(e.buffer)); if (i(t) !== i(e)) return !1; s = s || { actual: [], expected: [] }; var u = s.actual.indexOf(t); return -1 !== u && u === s.expected.indexOf(e) || (s.actual.push(t), s.expected.push(e), g(t, e, n, s)) } return n ? t === e : t == e } function p(t) { return "[object Arguments]" == Object.prototype.toString.call(t) } function g(t, e, n, r) { if (null === t || void 0 === t || null === e || void 0 === e) return !1; if (w.isPrimitive(t) || w.isPrimitive(e)) return t === e; if (n && Object.getPrototypeOf(t) !== Object.getPrototypeOf(e)) return !1; var i = p(t), o = p(e); if (i && !o || !i && o) return !1; if (i) return t = _.call(t), e = _.call(e), d(t, e, n); var a, s, u = A(t), l = A(e); if (u.length !== l.length) return !1; for (u.sort(), l.sort(), s = u.length - 1; s >= 0; s--)if (u[s] !== l[s]) return !1; for (s = u.length - 1; s >= 0; s--)if (a = u[s], !d(t[a], e[a], n, r)) return !1; return !0 } function v(t, e, n) { d(t, e, !0) && f(t, e, n, "notDeepStrictEqual", v) } function y(t, e) { if (!t || !e) return !1; if ("[object RegExp]" == Object.prototype.toString.call(e)) return e.test(t); try { if (t instanceof e) return !0 } catch (t) { } return !Error.isPrototypeOf(e) && !0 === e.call({}, t) } function b(t) { var e; try { t() } catch (t) { e = t } return e } function m(t, e, n, r) { var i; if ("function" != typeof e) throw new TypeError('"block" argument must be a function'); "string" == typeof n && (r = n, n = null), i = b(e), r = (n && n.name ? " (" + n.name + ")." : ".") + (r ? " " + r : "."), t && !i && f(i, n, "Missing expected exception" + r); var o = "string" == typeof r, a = !t && w.isError(i), s = !t && i && !n; if ((a && o && y(i, n) || s) && f(i, n, "Got unwanted exception" + r), t && i && n && !y(i, n) || !t && i) throw i } var w = n(106), x = Object.prototype.hasOwnProperty, _ = Array.prototype.slice, k = function () { return "foo" === function () { }.name }(), S = t.exports = h, C = /\s*function\s+([^\(\s]*)\s*/; S.AssertionError = function (t) { this.name = "AssertionError", this.actual = t.actual, this.expected = t.expected, this.operator = t.operator, t.message ? (this.message = t.message, this.generatedMessage = !1) : (this.message = c(this), this.generatedMessage = !0); var e = t.stackStartFunction || f; if (Error.captureStackTrace) Error.captureStackTrace(this, e); else { var n = new Error; if (n.stack) { var r = n.stack, i = s(e), o = r.indexOf("\n" + i); if (o >= 0) { var a = r.indexOf("\n", o + 1); r = r.substring(a + 1) } this.stack = r } } }, w.inherits(S.AssertionError, Error), S.fail = f, S.ok = h, S.equal = function (t, e, n) { t != e && f(t, e, n, "==", S.equal) }, S.notEqual = function (t, e, n) { t == e && f(t, e, n, "!=", S.notEqual) }, S.deepEqual = function (t, e, n) { d(t, e, !1) || f(t, e, n, "deepEqual", S.deepEqual) }, S.deepStrictEqual = function (t, e, n) { d(t, e, !0) || f(t, e, n, "deepStrictEqual", S.deepStrictEqual) }, S.notDeepEqual = function (t, e, n) { d(t, e, !1) && f(t, e, n, "notDeepEqual", S.notDeepEqual) }, S.notDeepStrictEqual = v, S.strictEqual = function (t, e, n) { t !== e && f(t, e, n, "===", S.strictEqual) }, S.notStrictEqual = function (t, e, n) { t === e && f(t, e, n, "!==", S.notStrictEqual) }, S.throws = function (t, e, n) { m(!0, t, e, n) }, S.doesNotThrow = function (t, e, n) { m(!1, t, e, n) }, S.ifError = function (t) { if (t) throw t }; var A = Object.keys || function (t) { var e = []; for (var n in t) x.call(t, n) && e.push(n); return e }
        }).call(e, n(22))
        !function (r, i) { t.exports = e = i(n(1)) }(0, function (t) {/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
            return function (e) { function n(t, e, n) { return t ^ e ^ n } function r(t, e, n) { return t & e | ~t & n } function i(t, e, n) { return (t | ~e) ^ n } function o(t, e, n) { return t & n | e & ~n } function a(t, e, n) { return t ^ (e | ~n) } function s(t, e) { return t << e | t >>> 32 - e } var u = t, l = u.lib, c = l.WordArray, f = l.Hasher, h = u.algo, d = c.create([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13]), p = c.create([5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11]), g = c.create([11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6]), v = c.create([8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]), y = c.create([0, 1518500249, 1859775393, 2400959708, 2840853838]), b = c.create([1352829926, 1548603684, 1836072691, 2053994217, 0]), m = h.RIPEMD160 = f.extend({ _doReset: function () { this._hash = c.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (t, e) { for (var u = 0; u < 16; u++) { var l = e + u, c = t[l]; t[l] = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8) } var f, h, m, w, x, _, k, S, C, A, P = this._hash.words, E = y.words, O = b.words, T = d.words, I = p.words, B = g.words, L = v.words; _ = f = P[0], k = h = P[1], S = m = P[2], C = w = P[3], A = x = P[4]; for (var R, u = 0; u < 80; u += 1)R = f + t[e + T[u]] | 0, R += u < 16 ? n(h, m, w) + E[0] : u < 32 ? r(h, m, w) + E[1] : u < 48 ? i(h, m, w) + E[2] : u < 64 ? o(h, m, w) + E[3] : a(h, m, w) + E[4], R |= 0, R = s(R, B[u]), R = R + x | 0, f = x, x = w, w = s(m, 10), m = h, h = R, R = _ + t[e + I[u]] | 0, R += u < 16 ? a(k, S, C) + O[0] : u < 32 ? o(k, S, C) + O[1] : u < 48 ? i(k, S, C) + O[2] : u < 64 ? r(k, S, C) + O[3] : n(k, S, C) + O[4], R |= 0, R = s(R, L[u]), R = R + A | 0, _ = A, A = C, C = s(S, 10), S = k, k = R; R = P[1] + m + C | 0, P[1] = P[2] + w + A | 0, P[2] = P[3] + x + _ | 0, P[3] = P[4] + f + k | 0, P[4] = P[0] + h + S | 0, P[0] = R }, _doFinalize: function () { var t = this._data, e = t.words, n = 8 * this._nDataBytes, r = 8 * t.sigBytes; e[r >>> 5] |= 128 << 24 - r % 32, e[14 + (r + 64 >>> 9 << 4)] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8), t.sigBytes = 4 * (e.length + 1), this._process(); for (var i = this._hash, o = i.words, a = 0; a < 5; a++) { var s = o[a]; o[a] = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8) } return i }, clone: function () { var t = f.clone.call(this); return t._hash = this._hash.clone(), t } }); u.RIPEMD160 = f._createHelper(m), u.HmacRIPEMD160 = f._createHmacHelper(m) }(Math), t.RIPEMD160
        })
    }, function (t, e, n) { !function (r, i, o) { t.exports = e = i(n(1), n(107), n(108)) }(0, function (t) { return function () { var e = t, n = e.lib, r = n.Base, i = n.WordArray, o = e.algo, a = o.SHA1, s = o.HMAC, u = o.PBKDF2 = r.extend({ cfg: r.extend({ keySize: 4, hasher: a, iterations: 1 }), init: function (t) { this.cfg = this.cfg.extend(t) }, compute: function (t, e) { for (var n = this.cfg, r = s.create(n.hasher, t), o = i.create(), a = i.create([1]), u = o.words, l = a.words, c = n.keySize, f = n.iterations; u.length < c;) { var h = r.update(e).finalize(a); r.reset(); for (var d = h.words, p = d.length, g = h, v = 1; v < f; v++) { g = r.finalize(g), r.reset(); for (var y = g.words, b = 0; b < p; b++)d[b] ^= y[b] } o.concat(h), l[0]++ } return o.sigBytes = 4 * c, o } }); e.PBKDF2 = function (t, e, n) { return u.create(n).compute(t, e) } }(), t.PBKDF2 }) }, function (t, e, n) { !function (r, i, o) { t.exports = e = i(n(1), n(5)) }(0, function (t) { return t.mode.CFB = function () { function e(t, e, n, r) { var i = this._iv; if (i) { var o = i.slice(0); this._iv = void 0 } else var o = this._prevBlock; r.encryptBlock(o, 0); for (var a = 0; a < n; a++)t[e + a] ^= o[a] } var n = t.lib.BlockCipherMode.extend(); return n.Encryptor = n.extend({ processBlock: function (t, n) { var r = this._cipher, i = r.blockSize; e.call(this, t, n, i, r), this._prevBlock = t.slice(n, n + i) } }), n.Decryptor = n.extend({ processBlock: function (t, n) { var r = this._cipher, i = r.blockSize, o = t.slice(n, n + i); e.call(this, t, n, i, r), this._prevBlock = o } }), n }(), t.mode.CFB }) }, function (t, e, n) { !function (r, i, o) { t.exports = e = i(n(1), n(5)) }(0, function (t) { return t.mode.CTR = function () { var e = t.lib.BlockCipherMode.extend(), n = e.Encryptor = e.extend({ processBlock: function (t, e) { var n = this._cipher, r = n.blockSize, i = this._iv, o = this._counter; i && (o = this._counter = i.slice(0), this._iv = void 0); var a = o.slice(0); n.encryptBlock(a, 0), o[r - 1] = o[r - 1] + 1 | 0; for (var s = 0; s < r; s++)t[e + s] ^= a[s] } }); return e.Decryptor = n, e }(), t.mode.CTR }) }, function (t, e, n) {
        !function (r, i, o) { t.exports = e = i(n(1), n(5)) }(0, function (t) {/** @preserve
	 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
	 * derived from CryptoJS.mode.CTR
	 * Jan Hruby jhruby.web@gmail.com
	 */
            return t.mode.CTRGladman = function () { function e(t) { if (255 == (t >> 24 & 255)) { var e = t >> 16 & 255, n = t >> 8 & 255, r = 255 & t; 255 === e ? (e = 0, 255 === n ? (n = 0, 255 === r ? r = 0 : ++r) : ++n) : ++e, t = 0, t += e << 16, t += n << 8, t += r } else t += 1 << 24; return t } function n(t) { return 0 === (t[0] = e(t[0])) && (t[1] = e(t[1])), t } var r = t.lib.BlockCipherMode.extend(), i = r.Encryptor = r.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize, o = this._iv, a = this._counter; o && (a = this._counter = o.slice(0), this._iv = void 0), n(a); var s = a.slice(0); r.encryptBlock(s, 0); for (var u = 0; u < i; u++)t[e + u] ^= s[u] } }); return r.Decryptor = i, r }(), t.mode.CTRGladman
        })
});
//# sourceMappingURL=pdfmake.min.js.map
this.pdfMake = this.pdfMake || {}; this.pdfMake.vfs = {
};
/*!
 * Column visibility buttons for Buttons and DataTables.
 * 2016 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


$.extend( DataTable.ext.buttons, {
	// A collection of column visibility buttons
	colvis: function ( dt, conf ) {
		return {
			extend: 'collection',
			text: function ( dt ) {
				return dt.i18n( 'buttons.colvis', 'Column visibility' );
			},
			className: 'buttons-colvis',
			buttons: [ {
				extend: 'columnsToggle',
				columns: conf.columns,
				columnText: conf.columnText
			} ]
		};
	},

	// Selected columns with individual buttons - toggle column visibility
	columnsToggle: function ( dt, conf ) {
		var columns = dt.columns( conf.columns ).indexes().map( function ( idx ) {
			return {
				extend: 'columnToggle',
				columns: idx,
				columnText: conf.columnText
			};
		} ).toArray();

		return columns;
	},

	// Single button to toggle column visibility
	columnToggle: function ( dt, conf ) {
		return {
			extend: 'columnVisibility',
			columns: conf.columns,
			columnText: conf.columnText
		};
	},

	// Selected columns with individual buttons - set column visibility
	columnsVisibility: function ( dt, conf ) {
		var columns = dt.columns( conf.columns ).indexes().map( function ( idx ) {
			return {
				extend: 'columnVisibility',
				columns: idx,
				visibility: conf.visibility,
				columnText: conf.columnText
			};
		} ).toArray();

		return columns;
	},

	// Single button to set column visibility
	columnVisibility: {
		columns: undefined, // column selector
		text: function ( dt, button, conf ) {
			return conf._columnText( dt, conf );
		},
		className: 'buttons-columnVisibility',
		action: function ( e, dt, button, conf ) {
			var col = dt.columns( conf.columns );
			var curr = col.visible();

			col.visible( conf.visibility !== undefined ?
				conf.visibility :
				! (curr.length ? curr[0] : false )
			);
		},
		init: function ( dt, button, conf ) {
			var that = this;
			button.attr( 'data-cv-idx', conf.columns );

			dt
				.on( 'column-visibility.dt'+conf.namespace, function (e, settings) {
					if ( ! settings.bDestroying && settings.nTable == dt.settings()[0].nTable ) {
						that.active( dt.column( conf.columns ).visible() );
					}
				} )
				.on( 'column-reorder.dt'+conf.namespace, function (e, settings, details) {
					if ( dt.columns( conf.columns ).count() !== 1 ) {
						return;
					}

					// This button controls the same column index but the text for the column has
					// changed
					button.text( conf._columnText( dt, conf ) );

					// Since its a different column, we need to check its visibility
					that.active( dt.column( conf.columns ).visible() );
				} );

			this.active( dt.column( conf.columns ).visible() );
		},
		destroy: function ( dt, button, conf ) {
			dt
				.off( 'column-visibility.dt'+conf.namespace )
				.off( 'column-reorder.dt'+conf.namespace );
		},

		_columnText: function ( dt, conf ) {
			// Use DataTables' internal data structure until this is presented
			// is a public API. The other option is to use
			// `$( column(col).node() ).text()` but the node might not have been
			// populated when Buttons is constructed.
			var idx = dt.column( conf.columns ).index();
			var title = dt.settings()[0].aoColumns[ idx ].sTitle
				.replace(/\n/g," ")        // remove new lines
				.replace(/<br\s*\/?>/gi, " ")  // replace line breaks with spaces
				.replace(/<select(.*?)<\/select>/g, "") // remove select tags, including options text
				.replace(/<!\-\-.*?\-\->/g, "") // strip HTML comments
				.replace(/<.*?>/g, "")   // strip HTML
				.replace(/^\s+|\s+$/g,""); // trim

			return conf.columnText ?
				conf.columnText( dt, idx, title ) :
				title;
		}
	},


	colvisRestore: {
		className: 'buttons-colvisRestore',

		text: function ( dt ) {
			return dt.i18n( 'buttons.colvisRestore', 'Restore visibility' );
		},

		init: function ( dt, button, conf ) {
			conf._visOriginal = dt.columns().indexes().map( function ( idx ) {
				return dt.column( idx ).visible();
			} ).toArray();
		},

		action: function ( e, dt, button, conf ) {
			dt.columns().every( function ( i ) {
				// Take into account that ColReorder might have disrupted our
				// indexes
				var idx = dt.colReorder && dt.colReorder.transpose ?
					dt.colReorder.transpose( i, 'toOriginal' ) :
					i;

				this.visible( conf._visOriginal[ idx ] );
			} );
		}
	},


	colvisGroup: {
		className: 'buttons-colvisGroup',

		action: function ( e, dt, button, conf ) {
			dt.columns( conf.show ).visible( true, false );
			dt.columns( conf.hide ).visible( false, false );

			dt.columns.adjust();
		},

		show: [],

		hide: []
	}
} );


return DataTable.Buttons;
}));

/*! Bootstrap integration for DataTables' Buttons
 * ©2016 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs4', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net-bs4')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;

$.extend( true, DataTable.Buttons.defaults, {
	dom: {
		container: {
			className: 'dt-buttons btn-group flex-wrap'
		},
		button: {
			className: 'btn btn-secondary'
		},
		collection: {
			tag: 'div',
			className: 'dropdown-menu',
			button: {
				tag: 'a',
				className: 'dt-button dropdown-item',
				active: 'active',
				disabled: 'disabled'
			}
		}
	},
	buttonCreated: function ( config, button ) {
		return config.buttons ?
			$('<div class="btn-group"/>').append(button) :
			button;
	}
} );

DataTable.ext.buttons.collection.className += ' dropdown-toggle';
DataTable.ext.buttons.collection.rightAlignClassName = 'dropdown-menu-right';

return DataTable.Buttons;
}));