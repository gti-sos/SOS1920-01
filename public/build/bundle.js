
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.22.2 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\Home.svelte generated by Svelte v3.22.2 */

    const file = "src\\front\\Home.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let br0;
    	let t0;
    	let ul3;
    	let li0;
    	let strong0;
    	let t2;
    	let ul0;
    	let li1;
    	let a0;
    	let t4;
    	let li2;
    	let a1;
    	let t6;
    	let li3;
    	let a2;
    	let t8;
    	let li4;
    	let strong1;
    	let t10;
    	let t11;
    	let li5;
    	let strong2;
    	let a3;
    	let t14;
    	let li6;
    	let strong3;
    	let a4;
    	let t17;
    	let li7;
    	let strong4;
    	let t19;
    	let ul1;
    	let li8;
    	let a5;
    	let t21;
    	let a6;
    	let t23;
    	let t24;
    	let li9;
    	let a7;
    	let t26;
    	let li10;
    	let a8;
    	let t28;
    	let a9;
    	let t30;
    	let t31;
    	let li11;
    	let a10;
    	let t33;
    	let li12;
    	let a11;
    	let t35;
    	let a12;
    	let t37;
    	let t38;
    	let li13;
    	let a13;
    	let t40;
    	let li14;
    	let strong5;
    	let t42;
    	let ul2;
    	let li15;
    	let a14;
    	let t44;
    	let a15;
    	let t46;
    	let t47;
    	let li16;
    	let a16;
    	let t49;
    	let a17;
    	let t51;
    	let t52;
    	let li17;
    	let a18;
    	let t54;
    	let a19;
    	let t56;
    	let t57;
    	let br1;
    	let t58;
    	let br2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			br0 = element("br");
    			t0 = space();
    			ul3 = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "Team:";
    			t2 = space();
    			ul0 = element("ul");
    			li1 = element("li");
    			a0 = element("a");
    			a0.textContent = "Juan Francisco Laínez Valle";
    			t4 = space();
    			li2 = element("li");
    			a1 = element("a");
    			a1.textContent = "Ángela Torreño Calvete";
    			t6 = space();
    			li3 = element("li");
    			a2 = element("a");
    			a2.textContent = "Antonio Escobar Nuñez";
    			t8 = space();
    			li4 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "Project description: ";
    			t10 = text("Our source of information is oriented to analyze the relationship between birth, poverty irrigation and emigrants worldwide.");
    			t11 = space();
    			li5 = element("li");
    			strong2 = element("strong");
    			strong2.textContent = "Repository: ";
    			a3 = element("a");
    			a3.textContent = "gti-sos/SOS1920-01";
    			t14 = space();
    			li6 = element("li");
    			strong3 = element("strong");
    			strong3.textContent = "URL: ";
    			a4 = element("a");
    			a4.textContent = "http://sos1920-01.herokuapp.com";
    			t17 = space();
    			li7 = element("li");
    			strong4 = element("strong");
    			strong4.textContent = "APIs:";
    			t19 = space();
    			ul1 = element("ul");
    			li8 = element("li");
    			a5 = element("a");
    			a5.textContent = "https://sos1920-01.herokuapp.com/api/v1/natality-stats";
    			t21 = text(" (developed by ");
    			a6 = element("a");
    			a6.textContent = "Juan Francisco Laínez";
    			t23 = text(")");
    			t24 = space();
    			li9 = element("li");
    			a7 = element("a");
    			a7.textContent = "https://sos1920-01.herokuapp.com/api/v2/natality-stats";
    			t26 = space();
    			li10 = element("li");
    			a8 = element("a");
    			a8.textContent = "https://sos1920-01.herokuapp.com/api/v1/poverty-stats";
    			t28 = text(" (developed by ");
    			a9 = element("a");
    			a9.textContent = "Ángela Torreño";
    			t30 = text(")");
    			t31 = space();
    			li11 = element("li");
    			a10 = element("a");
    			a10.textContent = "https://sos1920-01.herokuapp.com/api/v2/poverty-stats";
    			t33 = space();
    			li12 = element("li");
    			a11 = element("a");
    			a11.textContent = "https://sos1920-01.herokuapp.com/api/v1/emigrants-stats";
    			t35 = text(" (developed by ");
    			a12 = element("a");
    			a12.textContent = "Antonio Escobar";
    			t37 = text(")");
    			t38 = space();
    			li13 = element("li");
    			a13 = element("a");
    			a13.textContent = "https://sos1920-01.herokuapp.com/api/v2/emigrants-stats";
    			t40 = space();
    			li14 = element("li");
    			strong5 = element("strong");
    			strong5.textContent = "POSTMAN:";
    			t42 = space();
    			ul2 = element("ul");
    			li15 = element("li");
    			a14 = element("a");
    			a14.textContent = "SOS1920-01-nataly-stats";
    			t44 = text(" (developed by ");
    			a15 = element("a");
    			a15.textContent = "Juan Francisco Laínez";
    			t46 = text(")");
    			t47 = space();
    			li16 = element("li");
    			a16 = element("a");
    			a16.textContent = "SOS1920-01-poverty-stats";
    			t49 = text(" (developed by ");
    			a17 = element("a");
    			a17.textContent = "Ángela Torreño";
    			t51 = text(")");
    			t52 = space();
    			li17 = element("li");
    			a18 = element("a");
    			a18.textContent = "SOS1920-01-emigrants-stats";
    			t54 = text(" (developed by ");
    			a19 = element("a");
    			a19.textContent = "Antonio Escobar";
    			t56 = text(")");
    			t57 = space();
    			br1 = element("br");
    			t58 = space();
    			br2 = element("br");
    			add_location(br0, file, 4, 3, 75);
    			add_location(strong0, file, 6, 8, 98);
    			add_location(li0, file, 6, 4, 94);
    			attr_dev(a0, "href", "https://github.com/juanfran94");
    			add_location(a0, file, 8, 9, 147);
    			add_location(li1, file, 8, 5, 143);
    			attr_dev(a1, "href", "https://github.com/angtorcal");
    			add_location(a1, file, 9, 9, 234);
    			add_location(li2, file, 9, 5, 230);
    			attr_dev(a2, "href", "https://github.com/Escobar1993");
    			add_location(a2, file, 10, 9, 315);
    			add_location(li3, file, 10, 5, 311);
    			add_location(ul0, file, 7, 4, 132);
    			add_location(strong1, file, 12, 8, 407);
    			add_location(li4, file, 12, 4, 403);
    			add_location(strong2, file, 13, 8, 585);
    			attr_dev(a3, "href", "https://github.com/gti-sos/SOS1920-01");
    			add_location(a3, file, 13, 37, 614);
    			add_location(li5, file, 13, 4, 581);
    			add_location(strong3, file, 14, 8, 699);
    			attr_dev(a4, "href", "http://sos1920-01.herokuapp.com");
    			add_location(a4, file, 14, 30, 721);
    			add_location(li6, file, 14, 4, 695);
    			add_location(strong4, file, 16, 20, 831);
    			add_location(li7, file, 16, 16, 827);
    			attr_dev(a5, "href", "https://sos1920-01.herokuapp.com/api/v1/natality-stats");
    			add_location(a5, file, 18, 9, 880);
    			attr_dev(a6, "href", "https://github.com/juanfran94");
    			add_location(a6, file, 18, 147, 1018);
    			add_location(li8, file, 18, 5, 876);
    			attr_dev(a7, "href", "https://sos1920-01.herokuapp.com/api/v2/natality-stats");
    			add_location(a7, file, 19, 24, 1115);
    			add_location(li9, file, 19, 20, 1111);
    			attr_dev(a8, "href", "https://sos1920-01.herokuapp.com/api/v1/poverty-stats");
    			add_location(a8, file, 21, 24, 1291);
    			attr_dev(a9, "href", "https://github.com/angtorcal");
    			add_location(a9, file, 21, 160, 1427);
    			add_location(li10, file, 21, 20, 1287);
    			attr_dev(a10, "href", "https://sos1920-01.herokuapp.com/api/v2/poverty-stats");
    			add_location(a10, file, 22, 24, 1516);
    			add_location(li11, file, 22, 20, 1512);
    			attr_dev(a11, "href", "https://sos1920-01.herokuapp.com/api/v1/emigrants-stats");
    			add_location(a11, file, 24, 24, 1690);
    			attr_dev(a12, "href", "https://github.com/Escobar1993");
    			add_location(a12, file, 24, 164, 1830);
    			add_location(li12, file, 24, 20, 1686);
    			attr_dev(a13, "href", "https://sos1920-01.herokuapp.com/api/v2/emigrants-stats");
    			add_location(a13, file, 25, 24, 1922);
    			add_location(li13, file, 25, 20, 1918);
    			add_location(ul1, file, 17, 4, 865);
    			add_location(strong5, file, 28, 20, 2115);
    			add_location(li14, file, 28, 16, 2111);
    			attr_dev(a14, "href", "https://documenter.getpostman.com/view/10867933/Szf3bW6K");
    			add_location(a14, file, 30, 9, 2167);
    			attr_dev(a15, "href", "https://github.com/juanfran94");
    			add_location(a15, file, 30, 118, 2276);
    			add_location(li15, file, 30, 5, 2163);
    			attr_dev(a16, "href", "https://documenter.getpostman.com/view/10867933/Szf3bW1r");
    			add_location(a16, file, 32, 9, 2403);
    			attr_dev(a17, "href", "https://github.com/angtorcal");
    			add_location(a17, file, 32, 119, 2513);
    			add_location(li16, file, 32, 5, 2399);
    			attr_dev(a18, "href", "https://documenter.getpostman.com/view/6902825/Szf3bW6G");
    			add_location(a18, file, 34, 9, 2632);
    			attr_dev(a19, "href", "https://github.com/Escobar1993");
    			add_location(a19, file, 34, 120, 2743);
    			add_location(li17, file, 34, 5, 2628);
    			add_location(ul2, file, 29, 4, 2152);
    			add_location(ul3, file, 5, 3, 84);
    			add_location(br1, file, 41, 2, 2897);
    			add_location(br2, file, 47, 8, 3407);
    			set_style(div0, "margin-left", "12.5%");
    			add_location(div0, file, 3, 2, 37);
    			attr_dev(div1, "class", "div-home");
    			add_location(div1, file, 1, 1, 9);
    			add_location(main, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, br0);
    			append_dev(div0, t0);
    			append_dev(div0, ul3);
    			append_dev(ul3, li0);
    			append_dev(li0, strong0);
    			append_dev(ul3, t2);
    			append_dev(ul3, ul0);
    			append_dev(ul0, li1);
    			append_dev(li1, a0);
    			append_dev(ul0, t4);
    			append_dev(ul0, li2);
    			append_dev(li2, a1);
    			append_dev(ul0, t6);
    			append_dev(ul0, li3);
    			append_dev(li3, a2);
    			append_dev(ul3, t8);
    			append_dev(ul3, li4);
    			append_dev(li4, strong1);
    			append_dev(li4, t10);
    			append_dev(ul3, t11);
    			append_dev(ul3, li5);
    			append_dev(li5, strong2);
    			append_dev(li5, a3);
    			append_dev(ul3, t14);
    			append_dev(ul3, li6);
    			append_dev(li6, strong3);
    			append_dev(li6, a4);
    			append_dev(ul3, t17);
    			append_dev(ul3, li7);
    			append_dev(li7, strong4);
    			append_dev(ul3, t19);
    			append_dev(ul3, ul1);
    			append_dev(ul1, li8);
    			append_dev(li8, a5);
    			append_dev(li8, t21);
    			append_dev(li8, a6);
    			append_dev(li8, t23);
    			append_dev(ul1, t24);
    			append_dev(ul1, li9);
    			append_dev(li9, a7);
    			append_dev(ul1, t26);
    			append_dev(ul1, li10);
    			append_dev(li10, a8);
    			append_dev(li10, t28);
    			append_dev(li10, a9);
    			append_dev(li10, t30);
    			append_dev(ul1, t31);
    			append_dev(ul1, li11);
    			append_dev(li11, a10);
    			append_dev(ul1, t33);
    			append_dev(ul1, li12);
    			append_dev(li12, a11);
    			append_dev(li12, t35);
    			append_dev(li12, a12);
    			append_dev(li12, t37);
    			append_dev(ul1, t38);
    			append_dev(ul1, li13);
    			append_dev(li13, a13);
    			append_dev(ul3, t40);
    			append_dev(ul3, li14);
    			append_dev(li14, strong5);
    			append_dev(ul3, t42);
    			append_dev(ul3, ul2);
    			append_dev(ul2, li15);
    			append_dev(li15, a14);
    			append_dev(li15, t44);
    			append_dev(li15, a15);
    			append_dev(li15, t46);
    			append_dev(ul2, t47);
    			append_dev(ul2, li16);
    			append_dev(li16, a16);
    			append_dev(li16, t49);
    			append_dev(li16, a17);
    			append_dev(li16, t51);
    			append_dev(ul2, t52);
    			append_dev(ul2, li17);
    			append_dev(li17, a18);
    			append_dev(li17, t54);
    			append_dev(li17, a19);
    			append_dev(li17, t56);
    			append_dev(div0, t57);
    			append_dev(div0, br1);
    			append_dev(div0, t58);
    			append_dev(div0, br2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function toVal(mix) {
    	var k, y, str='';
    	if (mix) {
    		if (typeof mix === 'object') {
    			if (Array.isArray(mix)) {
    				for (k=0; k < mix.length; k++) {
    					if (mix[k] && (y = toVal(mix[k]))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			} else {
    				for (k in mix) {
    					if (mix[k] && (y = toVal(k))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			}
    		} else if (typeof mix !== 'boolean' && !mix.call) {
    			str && (str += ' ');
    			str += mix;
    		}
    	}
    	return str;
    }

    function clsx () {
    	var i=0, x, str='';
    	while (i < arguments.length) {
    		if (x = toVal(arguments[i++])) {
    			str && (str += ' ');
    			str += x;
    		}
    	}
    	return str;
    }

    function clean($$props) {
      const rest = {};
      for (const key of Object.keys($$props)) {
        if (key !== "children" && key !== "$$scope" && key !== "$$slots") {
          rest[key] = $$props[key];
        }
      }
      return rest;
    }

    /* node_modules\sveltestrap\src\Table.svelte generated by Svelte v3.22.2 */
    const file$1 = "node_modules\\sveltestrap\\src\\Table.svelte";

    // (38:0) {:else}
    function create_else_block$1(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);
    	let table_levels = [/*props*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$1, 38, 2, 908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    				}
    			}

    			set_attributes(table, get_spread_update(table_levels, [
    				dirty & /*props*/ 8 && /*props*/ ctx[3],
    				dirty & /*classes*/ 2 && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(38:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if responsive}
    function create_if_block$1(ctx) {
    	let div;
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);
    	let table_levels = [/*props*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$1, 33, 4, 826);
    			attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			add_location(div, file$1, 32, 2, 788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    				}
    			}

    			set_attributes(table, get_spread_update(table_levels, [
    				dirty & /*props*/ 8 && /*props*/ ctx[3],
    				dirty & /*classes*/ 2 && { class: /*classes*/ ctx[1] }
    			]));

    			if (!current || dirty & /*responsiveClassName*/ 4) {
    				attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(32:0) {#if responsive}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*responsive*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { size = "" } = $$props;
    	let { bordered = false } = $$props;
    	let { borderless = false } = $$props;
    	let { striped = false } = $$props;
    	let { dark = false } = $$props;
    	let { hover = false } = $$props;
    	let { responsive = false } = $$props;
    	const props = clean($$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Table", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("size" in $$new_props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$new_props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$new_props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$new_props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$new_props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$new_props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$new_props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		clsx,
    		clean,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		responsive,
    		props,
    		classes,
    		responsiveClassName
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("size" in $$props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("responsiveClassName" in $$props) $$invalidate(2, responsiveClassName = $$new_props.responsiveClassName);
    	};

    	let classes;
    	let responsiveClassName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, size, bordered, borderless, striped, dark, hover*/ 2032) {
    			 $$invalidate(1, classes = clsx(className, "table", size ? "table-" + size : false, bordered ? "table-bordered" : false, borderless ? "table-borderless" : false, striped ? "table-striped" : false, dark ? "table-dark" : false, hover ? "table-hover" : false));
    		}

    		if ($$self.$$.dirty & /*responsive*/ 1) {
    			 $$invalidate(2, responsiveClassName = responsive === true
    			? "table-responsive"
    			: `table-responsive-${responsive}`);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		responsive,
    		classes,
    		responsiveClassName,
    		props,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			class: 4,
    			size: 5,
    			bordered: 6,
    			borderless: 7,
    			striped: 8,
    			dark: 9,
    			hover: 10,
    			responsive: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get class() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bordered() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bordered(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderless() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderless(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get striped() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set striped(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get responsive() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set responsive(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\sveltestrap\src\Button.svelte generated by Svelte v3.22.2 */
    const file$2 = "node_modules\\sveltestrap\\src\\Button.svelte";

    // (53:0) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	let button_levels = [
    		/*props*/ ctx[10],
    		{ id: /*id*/ ctx[4] },
    		{ class: /*classes*/ ctx[8] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ value: /*value*/ ctx[6] },
    		{
    			"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    		},
    		{ style: /*style*/ ctx[5] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			set_attributes(button, button_data);
    			add_location(button, file$2, 53, 2, 1061);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(button, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[21], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*close, children, $$scope*/ 262147) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty & /*props*/ 1024 && /*props*/ ctx[10],
    				dirty & /*id*/ 16 && { id: /*id*/ ctx[4] },
    				dirty & /*classes*/ 256 && { class: /*classes*/ ctx[8] },
    				dirty & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] },
    				dirty & /*value*/ 64 && { value: /*value*/ ctx[6] },
    				dirty & /*ariaLabel, defaultAriaLabel*/ 640 && {
    					"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    				},
    				dirty & /*style*/ 32 && { style: /*style*/ ctx[5] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (37:0) {#if href}
    function create_if_block$2(ctx) {
    	let a;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*children*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	let a_levels = [
    		/*props*/ ctx[10],
    		{ id: /*id*/ ctx[4] },
    		{ class: /*classes*/ ctx[8] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ href: /*href*/ ctx[3] },
    		{
    			"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    		},
    		{ style: /*style*/ ctx[5] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			set_attributes(a, a_data);
    			add_location(a, file$2, 37, 2, 825);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			if_blocks[current_block_type_index].m(a, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*click_handler*/ ctx[20], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(a, null);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*props*/ 1024 && /*props*/ ctx[10],
    				dirty & /*id*/ 16 && { id: /*id*/ ctx[4] },
    				dirty & /*classes*/ 256 && { class: /*classes*/ ctx[8] },
    				dirty & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] },
    				dirty & /*href*/ 8 && { href: /*href*/ ctx[3] },
    				dirty & /*ariaLabel, defaultAriaLabel*/ 640 && {
    					"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    				},
    				dirty & /*style*/ 32 && { style: /*style*/ ctx[5] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(37:0) {#if href}",
    		ctx
    	});

    	return block_1;
    }

    // (68:6) {:else}
    function create_else_block_2(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(68:6) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (66:25) 
    function create_if_block_3(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(66:25) ",
    		ctx
    	});

    	return block_1;
    }

    // (64:6) {#if close}
    function create_if_block_2(ctx) {
    	let span;

    	const block_1 = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$2, 64, 8, 1250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(64:6) {#if close}",
    		ctx
    	});

    	return block_1;
    }

    // (63:10)        
    function fallback_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*close*/ ctx[1]) return 0;
    		if (/*children*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(63:10)        ",
    		ctx
    	});

    	return block_1;
    }

    // (49:4) {:else}
    function create_else_block$2(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(49:4) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (47:4) {#if children}
    function create_if_block_1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(47:4) {#if children}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { active = false } = $$props;
    	let { block = false } = $$props;
    	let { children = undefined } = $$props;
    	let { close = false } = $$props;
    	let { color = "secondary" } = $$props;
    	let { disabled = false } = $$props;
    	let { href = "" } = $$props;
    	let { id = "" } = $$props;
    	let { outline = false } = $$props;
    	let { size = "" } = $$props;
    	let { style = "" } = $$props;
    	let { value = "" } = $$props;
    	const props = clean($$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(11, className = $$new_props.class);
    		if ("active" in $$new_props) $$invalidate(12, active = $$new_props.active);
    		if ("block" in $$new_props) $$invalidate(13, block = $$new_props.block);
    		if ("children" in $$new_props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$new_props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$new_props) $$invalidate(14, color = $$new_props.color);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$new_props) $$invalidate(3, href = $$new_props.href);
    		if ("id" in $$new_props) $$invalidate(4, id = $$new_props.id);
    		if ("outline" in $$new_props) $$invalidate(15, outline = $$new_props.outline);
    		if ("size" in $$new_props) $$invalidate(16, size = $$new_props.size);
    		if ("style" in $$new_props) $$invalidate(5, style = $$new_props.style);
    		if ("value" in $$new_props) $$invalidate(6, value = $$new_props.value);
    		if ("$$scope" in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		clsx,
    		clean,
    		className,
    		active,
    		block,
    		children,
    		close,
    		color,
    		disabled,
    		href,
    		id,
    		outline,
    		size,
    		style,
    		value,
    		props,
    		ariaLabel,
    		classes,
    		defaultAriaLabel
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(11, className = $$new_props.className);
    		if ("active" in $$props) $$invalidate(12, active = $$new_props.active);
    		if ("block" in $$props) $$invalidate(13, block = $$new_props.block);
    		if ("children" in $$props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$props) $$invalidate(14, color = $$new_props.color);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$props) $$invalidate(3, href = $$new_props.href);
    		if ("id" in $$props) $$invalidate(4, id = $$new_props.id);
    		if ("outline" in $$props) $$invalidate(15, outline = $$new_props.outline);
    		if ("size" in $$props) $$invalidate(16, size = $$new_props.size);
    		if ("style" in $$props) $$invalidate(5, style = $$new_props.style);
    		if ("value" in $$props) $$invalidate(6, value = $$new_props.value);
    		if ("ariaLabel" in $$props) $$invalidate(7, ariaLabel = $$new_props.ariaLabel);
    		if ("classes" in $$props) $$invalidate(8, classes = $$new_props.classes);
    		if ("defaultAriaLabel" in $$props) $$invalidate(9, defaultAriaLabel = $$new_props.defaultAriaLabel);
    	};

    	let ariaLabel;
    	let classes;
    	let defaultAriaLabel;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(7, ariaLabel = $$props["aria-label"]);

    		if ($$self.$$.dirty & /*className, close, outline, color, size, block, active*/ 129026) {
    			 $$invalidate(8, classes = clsx(className, { close }, close || "btn", close || `btn${outline ? "-outline" : ""}-${color}`, size ? `btn-${size}` : false, block ? "btn-block" : false, { active }));
    		}

    		if ($$self.$$.dirty & /*close*/ 2) {
    			 $$invalidate(9, defaultAriaLabel = close ? "Close" : null);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		children,
    		close,
    		disabled,
    		href,
    		id,
    		style,
    		value,
    		ariaLabel,
    		classes,
    		defaultAriaLabel,
    		props,
    		className,
    		active,
    		block,
    		color,
    		outline,
    		size,
    		$$props,
    		$$scope,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			class: 11,
    			active: 12,
    			block: 13,
    			children: 0,
    			close: 1,
    			color: 14,
    			disabled: 2,
    			href: 3,
    			id: 4,
    			outline: 15,
    			size: 16,
    			style: 5,
    			value: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\povertyApi\PovertyTable.svelte generated by Svelte v3.22.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\front\\povertyApi\\PovertyTable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>   import {    onMount   }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import {    onMount   }",
    		ctx
    	});

    	return block;
    }

    // (216:1) {:then stats}
    function create_then_block(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*stats, newStat*/ 2049 | dirty[1] & /*$$scope*/ 128) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(216:1) {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (235:9) <Button outline color="primary" on:click={insertStat}>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Insertar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(235:9) <Button outline color=\\\"primary\\\" on:click={insertStat}>",
    		ctx
    	});

    	return block;
    }

    // (246:10) <Button outline color="danger" on:click="{deleteStat(stat.country,stat.year)}">
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Eliminar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(246:10) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStat(stat.country,stat.year)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (237:4) {#each stats as stat}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*stat*/ ctx[35].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*stat*/ ctx[35].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*stat*/ ctx[35].poverty_prp + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*stat*/ ctx[35].poverty_pt + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*stat*/ ctx[35].poverty_ht + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteStat*/ ctx[16](/*stat*/ ctx[35].country, /*stat*/ ctx[35].year))) /*deleteStat*/ ctx[16](/*stat*/ ctx[35].country, /*stat*/ ctx[35].year).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			create_component(button.$$.fragment);
    			t10 = space();
    			attr_dev(a, "href", a_href_value = "#/poverty-stats/" + /*stat*/ ctx[35].country + "/" + /*stat*/ ctx[35].year);
    			add_location(a, file$3, 239, 7, 7879);
    			add_location(td0, file$3, 238, 6, 7866);
    			add_location(td1, file$3, 241, 6, 7971);
    			add_location(td2, file$3, 242, 6, 7999);
    			add_location(td3, file$3, 243, 6, 8034);
    			add_location(td4, file$3, 244, 6, 8068);
    			add_location(td5, file$3, 245, 6, 8102);
    			add_location(tr, file$3, 237, 5, 7854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a);
    			append_dev(a, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			mount_component(button, td5, null);
    			append_dev(tr, t10);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*stats*/ 2048) && t0_value !== (t0_value = /*stat*/ ctx[35].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*stats*/ 2048 && a_href_value !== (a_href_value = "#/poverty-stats/" + /*stat*/ ctx[35].country + "/" + /*stat*/ ctx[35].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*stats*/ 2048) && t2_value !== (t2_value = /*stat*/ ctx[35].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*stats*/ 2048) && t4_value !== (t4_value = /*stat*/ ctx[35].poverty_prp + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*stats*/ 2048) && t6_value !== (t6_value = /*stat*/ ctx[35].poverty_pt + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*stats*/ 2048) && t8_value !== (t8_value = /*stat*/ ctx[35].poverty_ht + "")) set_data_dev(t8, t8_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(237:4) {#each stats as stat}",
    		ctx
    	});

    	return block;
    }

    // (217:2) <Table bordered>
    function create_default_slot_6(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let tbody;
    	let tr1;
    	let td0;
    	let input0;
    	let t12;
    	let td1;
    	let input1;
    	let t13;
    	let td2;
    	let input2;
    	let t14;
    	let td3;
    	let input3;
    	let t15;
    	let td4;
    	let input4;
    	let t16;
    	let td5;
    	let t17;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*insertStat*/ ctx[15]);
    	let each_value = /*stats*/ ctx[11];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "País";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Año";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Personas en riesgo de pobreza";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Umbral persona";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Umbral hogar";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Acciones";
    			t11 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t12 = space();
    			td1 = element("td");
    			input1 = element("input");
    			t13 = space();
    			td2 = element("td");
    			input2 = element("input");
    			t14 = space();
    			td3 = element("td");
    			input3 = element("input");
    			t15 = space();
    			td4 = element("td");
    			input4 = element("input");
    			t16 = space();
    			td5 = element("td");
    			create_component(button.$$.fragment);
    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$3, 219, 5, 7152);
    			add_location(th1, file$3, 220, 5, 7172);
    			add_location(th2, file$3, 221, 5, 7191);
    			add_location(th3, file$3, 222, 5, 7236);
    			add_location(th4, file$3, 223, 5, 7266);
    			add_location(th5, file$3, 224, 5, 7294);
    			add_location(tr0, file$3, 218, 4, 7141);
    			add_location(thead, file$3, 217, 3, 7128);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$3, 229, 9, 7368);
    			add_location(td0, file$3, 229, 5, 7364);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$3, 230, 9, 7438);
    			add_location(td1, file$3, 230, 5, 7434);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$3, 231, 9, 7507);
    			add_location(td2, file$3, 231, 5, 7503);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$3, 232, 9, 7583);
    			add_location(td3, file$3, 232, 5, 7579);
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$3, 233, 9, 7658);
    			add_location(td4, file$3, 233, 5, 7654);
    			add_location(td5, file$3, 234, 5, 7729);
    			add_location(tr1, file$3, 228, 4, 7353);
    			add_location(tbody, file$3, 227, 3, 7340);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, input0);
    			set_input_value(input0, /*newStat*/ ctx[0].country);
    			append_dev(tr1, t12);
    			append_dev(tr1, td1);
    			append_dev(td1, input1);
    			set_input_value(input1, /*newStat*/ ctx[0].year);
    			append_dev(tr1, t13);
    			append_dev(tr1, td2);
    			append_dev(td2, input2);
    			set_input_value(input2, /*newStat*/ ctx[0].poverty_prp);
    			append_dev(tr1, t14);
    			append_dev(tr1, td3);
    			append_dev(td3, input3);
    			set_input_value(input3, /*newStat*/ ctx[0].poverty_pt);
    			append_dev(tr1, t15);
    			append_dev(tr1, td4);
    			append_dev(td4, input4);
    			set_input_value(input4, /*newStat*/ ctx[0].poverty_ht);
    			append_dev(tr1, t16);
    			append_dev(tr1, td5);
    			mount_component(button, td5, null);
    			append_dev(tbody, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[22]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[23]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[24]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[25]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[26])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newStat*/ 1 && input0.value !== /*newStat*/ ctx[0].country) {
    				set_input_value(input0, /*newStat*/ ctx[0].country);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input1.value) !== /*newStat*/ ctx[0].year) {
    				set_input_value(input1, /*newStat*/ ctx[0].year);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input2.value) !== /*newStat*/ ctx[0].poverty_prp) {
    				set_input_value(input2, /*newStat*/ ctx[0].poverty_prp);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input3.value) !== /*newStat*/ ctx[0].poverty_pt) {
    				set_input_value(input3, /*newStat*/ ctx[0].poverty_pt);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input4.value) !== /*newStat*/ ctx[0].poverty_ht) {
    				set_input_value(input4, /*newStat*/ ctx[0].poverty_ht);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty[0] & /*deleteStat, stats*/ 67584) {
    				each_value = /*stats*/ ctx[11];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(217:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (214:15)     Loading stats...   {:then stats}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading stats...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(214:15)     Loading stats...   {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (252:1) {#if errorMsg}
    function create_if_block_2$1(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[10]);
    			set_style(p, "color", "red");
    			add_location(p, file$3, 252, 8, 8295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*errorMsg*/ 1024) set_data_dev(t1, /*errorMsg*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(252:1) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (255:1) <Button outline color="secondary" on:click="{loadInitialData}">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cargar datos iniciales");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(255:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{loadInitialData}\\\">",
    		ctx
    	});

    	return block;
    }

    // (256:1) <Button outline color="danger" on:click="{deleteStats}">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Borrar todo");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(256:1) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStats}\\\">",
    		ctx
    	});

    	return block;
    }

    // (257:1) {#if numeroDePagina==0}
    function create_if_block_1$1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2))) /*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(257:1) {#if numeroDePagina==0}",
    		ctx
    	});

    	return block;
    }

    // (258:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(">");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(258:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (260:1) {#if numeroDePagina>0}
    function create_if_block$3(ctx) {
    	let t;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 1))) /*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 1).apply(this, arguments);
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2))) /*paginacion*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(260:1) {#if numeroDePagina>0}",
    		ctx
    	});

    	return block;
    }

    // (261:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 1)}">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Pagina anterior");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(261:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 1)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (262:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Pagina siguiente");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(262:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (278:1) <Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht)}">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Buscar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(278:1) <Button outline color=\\\"primary\\\" on:click=\\\"{busqueda (searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht)}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let promise;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let h60;
    	let t9;
    	let tr0;
    	let td0;
    	let label0;
    	let t10;
    	let input0;
    	let t11;
    	let td1;
    	let label1;
    	let t12;
    	let input1;
    	let t13;
    	let td2;
    	let label2;
    	let t14;
    	let input2;
    	let t15;
    	let td3;
    	let label3;
    	let t16;
    	let input3;
    	let t17;
    	let tr1;
    	let td4;
    	let label4;
    	let t18;
    	let input4;
    	let t19;
    	let td5;
    	let label5;
    	let t20;
    	let input5;
    	let t21;
    	let td6;
    	let label6;
    	let t22;
    	let input6;
    	let t23;
    	let td7;
    	let label7;
    	let t24;
    	let input7;
    	let t25;
    	let t26;
    	let h61;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 11,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*stats*/ ctx[11], info);
    	let if_block0 = /*errorMsg*/ ctx[10] && create_if_block_2$1(ctx);

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[14]);

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteStats*/ ctx[17]);
    	let if_block1 = /*numeroDePagina*/ ctx[1] == 0 && create_if_block_1$1(ctx);
    	let if_block2 = /*numeroDePagina*/ ctx[1] > 0 && create_if_block$3(ctx);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", function () {
    		if (is_function(/*busqueda*/ ctx[12](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9]))) /*busqueda*/ ctx[12](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9]).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Vista completa de elementos.";
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			create_component(button0.$$.fragment);
    			t4 = space();
    			create_component(button1.$$.fragment);
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			h60 = element("h6");
    			h60.textContent = "Para verlo mediante páginas pulse el botón de avanzar página.";
    			t9 = space();
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			t10 = text("País: ");
    			input0 = element("input");
    			t11 = space();
    			td1 = element("td");
    			label1 = element("label");
    			t12 = text("Mínimo de personas en riesgo de pobreza: ");
    			input1 = element("input");
    			t13 = space();
    			td2 = element("td");
    			label2 = element("label");
    			t14 = text("Mínimo umbral persona: ");
    			input2 = element("input");
    			t15 = space();
    			td3 = element("td");
    			label3 = element("label");
    			t16 = text("Mínimo umbral hogar: ");
    			input3 = element("input");
    			t17 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			label4 = element("label");
    			t18 = text("Año: ");
    			input4 = element("input");
    			t19 = space();
    			td5 = element("td");
    			label5 = element("label");
    			t20 = text("Máximo de personas en riesgo de pobreza: ");
    			input5 = element("input");
    			t21 = space();
    			td6 = element("td");
    			label6 = element("label");
    			t22 = text("Máximo umbral persona: ");
    			input6 = element("input");
    			t23 = space();
    			td7 = element("td");
    			label7 = element("label");
    			t24 = text("Máximo umbral hogar: ");
    			input7 = element("input");
    			t25 = space();
    			create_component(button2.$$.fragment);
    			t26 = space();
    			h61 = element("h6");
    			h61.textContent = "Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar.";
    			add_location(h3, file$3, 212, 1, 7012);
    			add_location(h60, file$3, 263, 1, 9202);
    			add_location(input0, file$3, 265, 19, 9301);
    			add_location(label0, file$3, 265, 6, 9288);
    			add_location(td0, file$3, 265, 2, 9284);
    			add_location(input1, file$3, 266, 54, 9406);
    			add_location(label1, file$3, 266, 6, 9358);
    			add_location(td1, file$3, 266, 2, 9354);
    			add_location(input2, file$3, 267, 36, 9494);
    			add_location(label2, file$3, 267, 6, 9464);
    			add_location(td2, file$3, 267, 2, 9460);
    			add_location(input3, file$3, 268, 34, 9579);
    			add_location(label3, file$3, 268, 6, 9551);
    			add_location(td3, file$3, 268, 2, 9547);
    			add_location(tr0, file$3, 264, 1, 9276);
    			add_location(input4, file$3, 271, 18, 9663);
    			add_location(label4, file$3, 271, 6, 9651);
    			add_location(td4, file$3, 271, 2, 9647);
    			add_location(input5, file$3, 272, 54, 9765);
    			add_location(label5, file$3, 272, 6, 9717);
    			add_location(td5, file$3, 272, 2, 9713);
    			add_location(input6, file$3, 273, 36, 9853);
    			add_location(label6, file$3, 273, 6, 9823);
    			add_location(td6, file$3, 273, 2, 9819);
    			add_location(input7, file$3, 274, 34, 9938);
    			add_location(label7, file$3, 274, 6, 9910);
    			add_location(td7, file$3, 274, 2, 9906);
    			add_location(tr1, file$3, 270, 1, 9639);
    			add_location(h61, file$3, 278, 1, 10192);
    			add_location(main, file$3, 211, 0, 7003);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t1);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t2;
    			append_dev(main, t2);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t3);
    			mount_component(button0, main, null);
    			append_dev(main, t4);
    			mount_component(button1, main, null);
    			append_dev(main, t5);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t6);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t7);
    			append_dev(main, h60);
    			append_dev(main, t9);
    			append_dev(main, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(label0, t10);
    			append_dev(label0, input0);
    			set_input_value(input0, /*searchCountry*/ ctx[2]);
    			append_dev(tr0, t11);
    			append_dev(tr0, td1);
    			append_dev(td1, label1);
    			append_dev(label1, t12);
    			append_dev(label1, input1);
    			set_input_value(input1, /*minPoverty_prp*/ ctx[4]);
    			append_dev(tr0, t13);
    			append_dev(tr0, td2);
    			append_dev(td2, label2);
    			append_dev(label2, t14);
    			append_dev(label2, input2);
    			set_input_value(input2, /*minPoverty_pt*/ ctx[6]);
    			append_dev(tr0, t15);
    			append_dev(tr0, td3);
    			append_dev(td3, label3);
    			append_dev(label3, t16);
    			append_dev(label3, input3);
    			set_input_value(input3, /*minPoverty_ht*/ ctx[8]);
    			append_dev(main, t17);
    			append_dev(main, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, label4);
    			append_dev(label4, t18);
    			append_dev(label4, input4);
    			set_input_value(input4, /*searchYear*/ ctx[3]);
    			append_dev(tr1, t19);
    			append_dev(tr1, td5);
    			append_dev(td5, label5);
    			append_dev(label5, t20);
    			append_dev(label5, input5);
    			set_input_value(input5, /*maxPoverty_prp*/ ctx[5]);
    			append_dev(tr1, t21);
    			append_dev(tr1, td6);
    			append_dev(td6, label6);
    			append_dev(label6, t22);
    			append_dev(label6, input6);
    			set_input_value(input6, /*maxPoverty_pt*/ ctx[7]);
    			append_dev(tr1, t23);
    			append_dev(tr1, td7);
    			append_dev(td7, label7);
    			append_dev(label7, t24);
    			append_dev(label7, input7);
    			set_input_value(input7, /*maxPoverty_ht*/ ctx[9]);
    			append_dev(main, t25);
    			mount_component(button2, main, null);
    			append_dev(main, t26);
    			append_dev(main, h61);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[27]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[28]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[29]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[30]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[31]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[32]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[33]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[34])
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*stats*/ 2048 && promise !== (promise = /*stats*/ ctx[11]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[11] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(main, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (/*numeroDePagina*/ ctx[1] == 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t6);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*numeroDePagina*/ ctx[1] > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t7);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*searchCountry*/ 4 && input0.value !== /*searchCountry*/ ctx[2]) {
    				set_input_value(input0, /*searchCountry*/ ctx[2]);
    			}

    			if (dirty[0] & /*minPoverty_prp*/ 16 && input1.value !== /*minPoverty_prp*/ ctx[4]) {
    				set_input_value(input1, /*minPoverty_prp*/ ctx[4]);
    			}

    			if (dirty[0] & /*minPoverty_pt*/ 64 && input2.value !== /*minPoverty_pt*/ ctx[6]) {
    				set_input_value(input2, /*minPoverty_pt*/ ctx[6]);
    			}

    			if (dirty[0] & /*minPoverty_ht*/ 256 && input3.value !== /*minPoverty_ht*/ ctx[8]) {
    				set_input_value(input3, /*minPoverty_ht*/ ctx[8]);
    			}

    			if (dirty[0] & /*searchYear*/ 8 && input4.value !== /*searchYear*/ ctx[3]) {
    				set_input_value(input4, /*searchYear*/ ctx[3]);
    			}

    			if (dirty[0] & /*maxPoverty_prp*/ 32 && input5.value !== /*maxPoverty_prp*/ ctx[5]) {
    				set_input_value(input5, /*maxPoverty_prp*/ ctx[5]);
    			}

    			if (dirty[0] & /*maxPoverty_pt*/ 128 && input6.value !== /*maxPoverty_pt*/ ctx[7]) {
    				set_input_value(input6, /*maxPoverty_pt*/ ctx[7]);
    			}

    			if (dirty[0] & /*maxPoverty_ht*/ 512 && input7.value !== /*maxPoverty_ht*/ ctx[9]) {
    				set_input_value(input7, /*maxPoverty_ht*/ ctx[9]);
    			}

    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block0) if_block0.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let stats = [];

    	let newStat = {
    		country: "",
    		year: "",
    		poverty_prp: "",
    		poverty_pt: "",
    		poverty_ht: ""
    	};

    	let numeroDePagina = 0;
    	let numeroAux;
    	let limit = 10;
    	let searchCountry = "";
    	let searchYear = "";
    	let minPoverty_prp = "";
    	let maxPoverty_prp = "";
    	let minPoverty_pt = "";
    	let maxPoverty_pt = "";
    	let minPoverty_ht = "";
    	let maxPoverty_ht = "";
    	let errorMsg = "";
    	onMount(getStats);

    	async function getStats() {
    		console.log("Fetching stats....");
    		const res = await fetch("/api/v2/poverty-stats?offset=" + numeroDePagina + "&limit=" + limit);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(11, stats = json);
    			console.log("Received " + stats.length + " stats.");
    		} else {
    			console.log("ERROR");
    		}

    		
    	}

    	

    	async function busqueda(
    		searchCountry,
    	searchYear,
    	minPoverty_prp,
    	maxPoverty_prp,
    	minPoverty_pt,
    	maxPoverty_pt,
    	minPoverty_ht,
    	maxPoverty_ht
    	) {
    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof minPoverty_prp == "undefined") {
    			minPoverty_prp = "";
    		}

    		if (typeof maxPoverty_prp == "undefined") {
    			maxPoverty_prp = "";
    		}

    		if (typeof minPoverty_pt == "undefined") {
    			minPoverty_pt = "";
    		}

    		if (typeof maxPoverty_pt == "undefined") {
    			maxPoverty_pt = "";
    		}

    		if (typeof minPoverty_ht == "undefined") {
    			minPoverty_ht = "";
    		}

    		if (typeof maxPoverty_ht == "undefined") {
    			maxPoverty_ht = "";
    		}

    		const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht);

    		if (res.ok) {
    			const json = await res.json();
    			$$invalidate(11, stats = json);
    			console.log("Found " + stats.length + " stats");
    			window.alert("Se han encontrado datos.");
    		} else if (res.status == 404) {
    			window.alert("No se encuentran datos.");
    		} else {
    			console.log("ERROR:" + " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    		}

    		
    	}

    	async function paginacion(
    		searchCountry,
    	searchYear,
    	minPoverty_prp,
    	maxPoverty_prp,
    	minPoverty_pt,
    	maxPoverty_pt,
    	minPoverty_ht,
    	maxPoverty_ht,
    	num
    	) {
    		numeroAux = num;

    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof minPoverty_prp == "undefined") {
    			minPoverty_prp = "";
    		}

    		if (typeof maxPoverty_prp == "undefined") {
    			maxPoverty_prp = "";
    		}

    		if (typeof minPoverty_pt == "undefined") {
    			minPoverty_pt = "";
    		}

    		if (typeof maxPoverty_pt == "undefined") {
    			maxPoverty_pt = "";
    		}

    		if (typeof minPoverty_ht == "undefined") {
    			minPoverty_ht = "";
    		}

    		if (typeof maxPoverty_ht == "undefined") {
    			maxPoverty_ht = "";
    		}

    		if (num == 1) {
    			$$invalidate(1, numeroDePagina = numeroDePagina - limit);

    			if (numeroDePagina < 0) {
    				$$invalidate(1, numeroDePagina = 0);
    				const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(11, stats = json);
    					numeroAux = num;
    				}
    			} else {
    				const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(11, stats = json);
    					numeroAux = num;
    				}
    			}
    		} else {
    			$$invalidate(1, numeroDePagina = numeroDePagina + limit);
    			const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht + "&limit=" + limit + "&offset=" + numeroDePagina);

    			if (res.ok) {
    				const json = await res.json();
    				$$invalidate(11, stats = json);
    				numeroAux = num;
    			}
    		}
    	}

    	async function getStatsPov() {
    		/*getStatsAntiguo*/
    		console.log("Fetching stats...");

    		const res = await fetch("/api/v2/poverty-stats");

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(11, stats = json);
    			console.log("Received " + stats.length + " stats.");
    		} else {
    			window.alert("No se encuentra ningún dato.");
    			$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    			console.log("ERROR!");
    		}
    	}

    	async function loadInitialData() {
    		console.log("Loading stats...");

    		const res = await fetch("/api/v2/poverty-stats/loadInitialData", { method: "GET" }).then(function (res) {
    			if (res.ok) {
    				getStatsPov();
    				window.alert("Datos iniciales cargados.");
    			} else if (res.status == 401) {
    				window.alert("La base de datos no está vacía. Debe vaciarla para cargar los datos iniciales");
    			} else {
    				$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}
    		});
    	}

    	async function insertStat() {
    		console.log("Inserting stat...");

    		if (newStat.country == "" || newStat.country == null || newStat.year == "" || newStat.year == null) {
    			window.alert("Pon un país y un año");
    		} else {
    			const res = await fetch("/api/v2/poverty-stats", {
    				method: "POST",
    				body: JSON.stringify(newStat),
    				headers: { "Content-Type": "application/json" }
    			}).then(function (res) {
    				if (res.ok) {
    					console.log("Ok:");
    					getStats();
    					window.alert("Dato insertado correctamente.");
    				} else if (res.status == 400) {
    					window.alert("Campo mal escrito.No puede insertarlo.");
    				} else {
    					window.alert("Dato ya creado. No puede insertarlo.");
    				}

    				$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			});
    		}
    	}

    	async function deleteStat(country, year) {
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/poverty-stats/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			window.alert("Dato eliminado correctamente.");
    			getStats();
    		});
    	}

    	async function deleteStats() {
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/poverty-stats", { method: "DELETE" }).then(function (res) {
    			window.alert("Base de datos eliminada correctamente.");
    			getStatsPov();
    			location.reload();
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<PovertyTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PovertyTable", $$slots, []);

    	function input0_input_handler() {
    		newStat.country = this.value;
    		$$invalidate(0, newStat);
    	}

    	function input1_input_handler() {
    		newStat.year = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input2_input_handler() {
    		newStat.poverty_prp = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input3_input_handler() {
    		newStat.poverty_pt = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input4_input_handler() {
    		newStat.poverty_ht = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input0_input_handler_1() {
    		searchCountry = this.value;
    		$$invalidate(2, searchCountry);
    	}

    	function input1_input_handler_1() {
    		minPoverty_prp = this.value;
    		$$invalidate(4, minPoverty_prp);
    	}

    	function input2_input_handler_1() {
    		minPoverty_pt = this.value;
    		$$invalidate(6, minPoverty_pt);
    	}

    	function input3_input_handler_1() {
    		minPoverty_ht = this.value;
    		$$invalidate(8, minPoverty_ht);
    	}

    	function input4_input_handler_1() {
    		searchYear = this.value;
    		$$invalidate(3, searchYear);
    	}

    	function input5_input_handler() {
    		maxPoverty_prp = this.value;
    		$$invalidate(5, maxPoverty_prp);
    	}

    	function input6_input_handler() {
    		maxPoverty_pt = this.value;
    		$$invalidate(7, maxPoverty_pt);
    	}

    	function input7_input_handler() {
    		maxPoverty_ht = this.value;
    		$$invalidate(9, maxPoverty_ht);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		stats,
    		newStat,
    		numeroDePagina,
    		numeroAux,
    		limit,
    		searchCountry,
    		searchYear,
    		minPoverty_prp,
    		maxPoverty_prp,
    		minPoverty_pt,
    		maxPoverty_pt,
    		minPoverty_ht,
    		maxPoverty_ht,
    		errorMsg,
    		getStats,
    		busqueda,
    		paginacion,
    		getStatsPov,
    		loadInitialData,
    		insertStat,
    		deleteStat,
    		deleteStats
    	});

    	$$self.$inject_state = $$props => {
    		if ("stats" in $$props) $$invalidate(11, stats = $$props.stats);
    		if ("newStat" in $$props) $$invalidate(0, newStat = $$props.newStat);
    		if ("numeroDePagina" in $$props) $$invalidate(1, numeroDePagina = $$props.numeroDePagina);
    		if ("numeroAux" in $$props) numeroAux = $$props.numeroAux;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("searchCountry" in $$props) $$invalidate(2, searchCountry = $$props.searchCountry);
    		if ("searchYear" in $$props) $$invalidate(3, searchYear = $$props.searchYear);
    		if ("minPoverty_prp" in $$props) $$invalidate(4, minPoverty_prp = $$props.minPoverty_prp);
    		if ("maxPoverty_prp" in $$props) $$invalidate(5, maxPoverty_prp = $$props.maxPoverty_prp);
    		if ("minPoverty_pt" in $$props) $$invalidate(6, minPoverty_pt = $$props.minPoverty_pt);
    		if ("maxPoverty_pt" in $$props) $$invalidate(7, maxPoverty_pt = $$props.maxPoverty_pt);
    		if ("minPoverty_ht" in $$props) $$invalidate(8, minPoverty_ht = $$props.minPoverty_ht);
    		if ("maxPoverty_ht" in $$props) $$invalidate(9, maxPoverty_ht = $$props.maxPoverty_ht);
    		if ("errorMsg" in $$props) $$invalidate(10, errorMsg = $$props.errorMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newStat,
    		numeroDePagina,
    		searchCountry,
    		searchYear,
    		minPoverty_prp,
    		maxPoverty_prp,
    		minPoverty_pt,
    		maxPoverty_pt,
    		minPoverty_ht,
    		maxPoverty_ht,
    		errorMsg,
    		stats,
    		busqueda,
    		paginacion,
    		loadInitialData,
    		insertStat,
    		deleteStat,
    		deleteStats,
    		numeroAux,
    		limit,
    		getStats,
    		getStatsPov,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input2_input_handler_1,
    		input3_input_handler_1,
    		input4_input_handler_1,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler
    	];
    }

    class PovertyTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PovertyTable",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\front\povertyApi\EditPoverty.svelte generated by Svelte v3.22.2 */

    const { console: console_1$2 } = globals;
    const file$4 = "src\\front\\povertyApi\\EditPoverty.svelte";

    // (1:0) <script>      import {    onMount      }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>      import {    onMount      }",
    		ctx
    	});

    	return block;
    }

    // (70:1) {:then stats}
    function create_then_block$1(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty & /*$$scope, updatedPoverty_ht, updatedPoverty_pt, updatedPoverty_prp, updatedYear, updatedCountry*/ 8254) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(70:1) {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (89:9) <Button outline color="primary" on:click={updateStat}>
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Actualizar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(89:9) <Button outline color=\\\"primary\\\" on:click={updateStat}>",
    		ctx
    	});

    	return block;
    }

    // (71:2) <Table bordered>
    function create_default_slot_1$1(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let tbody;
    	let tr1;
    	let td0;
    	let t12;
    	let t13;
    	let td1;
    	let t14;
    	let t15;
    	let td2;
    	let input0;
    	let t16;
    	let td3;
    	let input1;
    	let t17;
    	let td4;
    	let input2;
    	let t18;
    	let td5;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateStat*/ ctx[8]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "País";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Año";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Personas en riesgo de pobreza";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Umbral persona";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Umbral hogar";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Acciones";
    			t11 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			t12 = text(/*updatedCountry*/ ctx[1]);
    			t13 = space();
    			td1 = element("td");
    			t14 = text(/*updatedYear*/ ctx[2]);
    			t15 = space();
    			td2 = element("td");
    			input0 = element("input");
    			t16 = space();
    			td3 = element("td");
    			input1 = element("input");
    			t17 = space();
    			td4 = element("td");
    			input2 = element("input");
    			t18 = space();
    			td5 = element("td");
    			create_component(button.$$.fragment);
    			add_location(th0, file$4, 73, 5, 2299);
    			add_location(th1, file$4, 74, 5, 2319);
    			add_location(th2, file$4, 75, 5, 2338);
    			add_location(th3, file$4, 76, 5, 2383);
    			add_location(th4, file$4, 77, 5, 2413);
    			add_location(th5, file$4, 78, 5, 2441);
    			add_location(tr0, file$4, 72, 4, 2288);
    			add_location(thead, file$4, 71, 3, 2275);
    			add_location(td0, file$4, 83, 5, 2511);
    			add_location(td1, file$4, 84, 5, 2543);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$4, 85, 9, 2576);
    			add_location(td2, file$4, 85, 5, 2572);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$4, 86, 9, 2651);
    			add_location(td3, file$4, 86, 5, 2647);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$4, 87, 9, 2725);
    			add_location(td4, file$4, 87, 5, 2721);
    			add_location(td5, file$4, 88, 5, 2795);
    			add_location(tr1, file$4, 82, 4, 2500);
    			add_location(tbody, file$4, 81, 3, 2487);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, t12);
    			append_dev(tr1, t13);
    			append_dev(tr1, td1);
    			append_dev(td1, t14);
    			append_dev(tr1, t15);
    			append_dev(tr1, td2);
    			append_dev(td2, input0);
    			set_input_value(input0, /*updatedPoverty_prp*/ ctx[3]);
    			append_dev(tr1, t16);
    			append_dev(tr1, td3);
    			append_dev(td3, input1);
    			set_input_value(input1, /*updatedPoverty_pt*/ ctx[4]);
    			append_dev(tr1, t17);
    			append_dev(tr1, td4);
    			append_dev(td4, input2);
    			set_input_value(input2, /*updatedPoverty_ht*/ ctx[5]);
    			append_dev(tr1, t18);
    			append_dev(tr1, td5);
    			mount_component(button, td5, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[11]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[12])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*updatedCountry*/ 2) set_data_dev(t12, /*updatedCountry*/ ctx[1]);
    			if (!current || dirty & /*updatedYear*/ 4) set_data_dev(t14, /*updatedYear*/ ctx[2]);

    			if (dirty & /*updatedPoverty_prp*/ 8 && to_number(input0.value) !== /*updatedPoverty_prp*/ ctx[3]) {
    				set_input_value(input0, /*updatedPoverty_prp*/ ctx[3]);
    			}

    			if (dirty & /*updatedPoverty_pt*/ 16 && to_number(input1.value) !== /*updatedPoverty_pt*/ ctx[4]) {
    				set_input_value(input1, /*updatedPoverty_pt*/ ctx[4]);
    			}

    			if (dirty & /*updatedPoverty_ht*/ 32 && to_number(input2.value) !== /*updatedPoverty_ht*/ ctx[5]) {
    				set_input_value(input2, /*updatedPoverty_ht*/ ctx[5]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(71:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (68:18)     Loading stat...   {:then stats}
    function create_pending_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading stat...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(68:18)     Loading stat...   {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (94:4) {#if errorMsg}
    function create_if_block$4(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[6]);
    			set_style(p, "color", "red");
    			add_location(p, file$4, 94, 8, 2957);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 64) set_data_dev(t1, /*errorMsg*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(94:4) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (97:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Volver");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(97:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h3;
    	let t0;
    	let strong;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2_value = /*params*/ ctx[0].year + "";
    	let t2;
    	let t3;
    	let promise;
    	let t4;
    	let t5;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 7,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*stats*/ ctx[7], info);
    	let if_block = /*errorMsg*/ ctx[6] && create_if_block$4(ctx);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			t0 = text("Editando elemento ");
    			strong = element("strong");
    			t1 = text(t1_value);
    			t2 = text(t2_value);
    			t3 = space();
    			info.block.c();
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(button.$$.fragment);
    			add_location(strong, file$4, 66, 26, 2143);
    			add_location(h3, file$4, 66, 4, 2121);
    			add_location(main, file$4, 65, 0, 2109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(h3, t0);
    			append_dev(h3, strong);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(main, t3);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t4;
    			append_dev(main, t4);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t5);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t2_value !== (t2_value = /*params*/ ctx[0].year + "")) set_data_dev(t2, t2_value);
    			info.ctx = ctx;

    			if (dirty & /*stats*/ 128 && promise !== (promise = /*stats*/ ctx[7]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(main, t5);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block) if_block.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let stats = {};
    	let updatedCountry = "";
    	let updatedYear = 0;
    	let updatedPoverty_prp = 0;
    	let updatedPoverty_pt = 0;
    	let updatedPoverty_ht = 0;
    	let errorMsg = "";
    	onMount(getstats);

    	async function getstats() {
    		console.log("Fetching stats...");
    		const res = await fetch("/api/v2/poverty-stats/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(7, stats = json);
    			$$invalidate(1, updatedCountry = stats.country);
    			$$invalidate(2, updatedYear = stats.year);
    			$$invalidate(3, updatedPoverty_prp = stats.poverty_prp);
    			$$invalidate(4, updatedPoverty_pt = stats.poverty_pt);
    			$$invalidate(5, updatedPoverty_ht = stats.poverty_ht);
    			console.log("Received stats.");
    		} else {
    			$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    			console.log("ERROR!");
    		}
    	}

    	async function updateStat() {
    		console.log("Updating stat..." + JSON.stringify(params.country));

    		const res = await fetch("/api/v2/poverty-stats/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country: params.country,
    				year: parseInt(params.year),
    				"poverty_prp": updatedPoverty_prp,
    				"poverty_pt": updatedPoverty_pt,
    				"poverty_ht": updatedPoverty_ht
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			if (res.status == 200) {
    				window.alert("Dato modificado correctamente.");
    			} else if (res.status == 400) {
    				window.alert("Campo mal escrito.No puede editarlo.");
    			} else {
    				$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}

    			
    		});
    	}

    	
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<EditPoverty> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EditPoverty", $$slots, []);

    	function input0_input_handler() {
    		updatedPoverty_prp = to_number(this.value);
    		$$invalidate(3, updatedPoverty_prp);
    	}

    	function input1_input_handler() {
    		updatedPoverty_pt = to_number(this.value);
    		$$invalidate(4, updatedPoverty_pt);
    	}

    	function input2_input_handler() {
    		updatedPoverty_ht = to_number(this.value);
    		$$invalidate(5, updatedPoverty_ht);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		pop,
    		Table,
    		Button,
    		params,
    		stats,
    		updatedCountry,
    		updatedYear,
    		updatedPoverty_prp,
    		updatedPoverty_pt,
    		updatedPoverty_ht,
    		errorMsg,
    		getstats,
    		updateStat
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("stats" in $$props) $$invalidate(7, stats = $$props.stats);
    		if ("updatedCountry" in $$props) $$invalidate(1, updatedCountry = $$props.updatedCountry);
    		if ("updatedYear" in $$props) $$invalidate(2, updatedYear = $$props.updatedYear);
    		if ("updatedPoverty_prp" in $$props) $$invalidate(3, updatedPoverty_prp = $$props.updatedPoverty_prp);
    		if ("updatedPoverty_pt" in $$props) $$invalidate(4, updatedPoverty_pt = $$props.updatedPoverty_pt);
    		if ("updatedPoverty_ht" in $$props) $$invalidate(5, updatedPoverty_ht = $$props.updatedPoverty_ht);
    		if ("errorMsg" in $$props) $$invalidate(6, errorMsg = $$props.errorMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		updatedCountry,
    		updatedYear,
    		updatedPoverty_prp,
    		updatedPoverty_pt,
    		updatedPoverty_ht,
    		errorMsg,
    		stats,
    		updateStat,
    		getstats,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EditPoverty$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditPoverty",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get params() {
    		throw new Error("<EditPoverty>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditPoverty>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\App.svelte generated by Svelte v3.22.2 */
    const file$5 = "src\\front\\App.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let current;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			add_location(main, file$5, 25, 0, 491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": Home,
    		// JUANFRA
    		// ANGELA
    		"/poverty-stats": PovertyTable,
    		"/poverty-stats/:country/:year": EditPoverty,
    		// ESCOBAR	
    		"*": NotFound
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Router,
    		Home,
    		PovertyTable,
    		EditNPoverty: EditPoverty$1,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.querySelector('#SvelteApp')
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
