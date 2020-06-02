
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
    	let ul4;
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
    	let br1;
    	let t18;
    	let li7;
    	let strong4;
    	let t20;
    	let ul1;
    	let li8;
    	let a5;
    	let t22;
    	let a6;
    	let t24;
    	let t25;
    	let li9;
    	let a7;
    	let t27;
    	let a8;
    	let t29;
    	let t30;
    	let li10;
    	let a9;
    	let t32;
    	let a10;
    	let t34;
    	let t35;
    	let li11;
    	let a11;
    	let t37;
    	let a12;
    	let t39;
    	let t40;
    	let li12;
    	let a13;
    	let t42;
    	let a14;
    	let t44;
    	let t45;
    	let li13;
    	let a15;
    	let t47;
    	let a16;
    	let t49;
    	let t50;
    	let br2;
    	let t51;
    	let li14;
    	let strong5;
    	let t53;
    	let ul2;
    	let li15;
    	let a17;
    	let t55;
    	let a18;
    	let t57;
    	let t58;
    	let li16;
    	let a19;
    	let t60;
    	let a20;
    	let t62;
    	let t63;
    	let li17;
    	let a21;
    	let t65;
    	let a22;
    	let t67;
    	let t68;
    	let li18;
    	let a23;
    	let t70;
    	let a24;
    	let t72;
    	let t73;
    	let li19;
    	let a25;
    	let t75;
    	let a26;
    	let t77;
    	let t78;
    	let li20;
    	let a27;
    	let t80;
    	let a28;
    	let t82;
    	let t83;
    	let br3;
    	let t84;
    	let li21;
    	let strong6;
    	let t86;
    	let ul3;
    	let br4;
    	let t87;
    	let li22;
    	let button0;
    	let t89;
    	let button1;
    	let t91;
    	let button2;
    	let t93;
    	let br5;
    	let t94;
    	let li23;
    	let button3;
    	let t96;
    	let button4;
    	let t98;
    	let button5;
    	let t100;
    	let br6;
    	let t101;
    	let li24;
    	let button6;
    	let t103;
    	let br7;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			br0 = element("br");
    			t0 = space();
    			ul4 = element("ul");
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
    			br1 = element("br");
    			t18 = space();
    			li7 = element("li");
    			strong4 = element("strong");
    			strong4.textContent = "APIs:";
    			t20 = space();
    			ul1 = element("ul");
    			li8 = element("li");
    			a5 = element("a");
    			a5.textContent = "https://sos1920-01.herokuapp.com/api/v1/natality-stats";
    			t22 = text(" (developed by ");
    			a6 = element("a");
    			a6.textContent = "Juan Francisco Laínez";
    			t24 = text(")");
    			t25 = space();
    			li9 = element("li");
    			a7 = element("a");
    			a7.textContent = "https://sos1920-01.herokuapp.com/api/v2/natality-stats";
    			t27 = text(" (developed by ");
    			a8 = element("a");
    			a8.textContent = "Juan Francisco Laínez";
    			t29 = text(")");
    			t30 = space();
    			li10 = element("li");
    			a9 = element("a");
    			a9.textContent = "https://sos1920-01.herokuapp.com/api/v1/poverty-stats";
    			t32 = text(" (developed by ");
    			a10 = element("a");
    			a10.textContent = "Ángela Torreño";
    			t34 = text(")");
    			t35 = space();
    			li11 = element("li");
    			a11 = element("a");
    			a11.textContent = "https://sos1920-01.herokuapp.com/api/v2/poverty-stats";
    			t37 = text(" (developed by ");
    			a12 = element("a");
    			a12.textContent = "Ángela Torreño";
    			t39 = text(")");
    			t40 = space();
    			li12 = element("li");
    			a13 = element("a");
    			a13.textContent = "https://sos1920-01.herokuapp.com/api/v1/emigrants-stats";
    			t42 = text(" (developed by ");
    			a14 = element("a");
    			a14.textContent = "Antonio Escobar";
    			t44 = text(")");
    			t45 = space();
    			li13 = element("li");
    			a15 = element("a");
    			a15.textContent = "https://sos1920-01.herokuapp.com/api/v2/emigrants-stats";
    			t47 = text(" (developed by ");
    			a16 = element("a");
    			a16.textContent = "Antonio Escobar";
    			t49 = text(")");
    			t50 = space();
    			br2 = element("br");
    			t51 = space();
    			li14 = element("li");
    			strong5 = element("strong");
    			strong5.textContent = "POSTMAN:";
    			t53 = space();
    			ul2 = element("ul");
    			li15 = element("li");
    			a17 = element("a");
    			a17.textContent = "SOS1920-01-nataly-stats v1";
    			t55 = text(" (developed by ");
    			a18 = element("a");
    			a18.textContent = "Juan Francisco Laínez";
    			t57 = text(")");
    			t58 = space();
    			li16 = element("li");
    			a19 = element("a");
    			a19.textContent = "SOS1920-01-nataly-stats v2";
    			t60 = text("(developed by ");
    			a20 = element("a");
    			a20.textContent = "Juan Francisco Laínez";
    			t62 = text(")");
    			t63 = space();
    			li17 = element("li");
    			a21 = element("a");
    			a21.textContent = "SOS1920-01-poverty-stats v1";
    			t65 = text(" (developed by ");
    			a22 = element("a");
    			a22.textContent = "Ángela Torreño";
    			t67 = text(")");
    			t68 = space();
    			li18 = element("li");
    			a23 = element("a");
    			a23.textContent = "SOS1920-01-poverty-stats v2";
    			t70 = text(" (developed by ");
    			a24 = element("a");
    			a24.textContent = "Ángela Torreño";
    			t72 = text(")");
    			t73 = space();
    			li19 = element("li");
    			a25 = element("a");
    			a25.textContent = "SOS1920-01-emigrants-stats v1";
    			t75 = text(" (developed by ");
    			a26 = element("a");
    			a26.textContent = "Antonio Escobar";
    			t77 = text(")");
    			t78 = space();
    			li20 = element("li");
    			a27 = element("a");
    			a27.textContent = "SOS1920-01-emigrants-stats v2";
    			t80 = text(" (developed by ");
    			a28 = element("a");
    			a28.textContent = "Antonio Escobar";
    			t82 = text(")");
    			t83 = space();
    			br3 = element("br");
    			t84 = space();
    			li21 = element("li");
    			strong6 = element("strong");
    			strong6.textContent = "FRONT END:";
    			t86 = space();
    			ul3 = element("ul");
    			br4 = element("br");
    			t87 = space();
    			li22 = element("li");
    			button0 = element("button");
    			button0.textContent = "Tabla Natalidad";
    			t89 = space();
    			button1 = element("button");
    			button1.textContent = "Gráfica Natalidad";
    			t91 = space();
    			button2 = element("button");
    			button2.textContent = "Gráfica Natalidad por Billboard.js";
    			t93 = space();
    			br5 = element("br");
    			t94 = space();
    			li23 = element("li");
    			button3 = element("button");
    			button3.textContent = "Riesgo de pobreza";
    			t96 = space();
    			button4 = element("button");
    			button4.textContent = "Graph Riesgo de pobreza";
    			t98 = space();
    			button5 = element("button");
    			button5.textContent = "Graph2 Riesgo de pobreza";
    			t100 = space();
    			br6 = element("br");
    			t101 = space();
    			li24 = element("li");
    			button6 = element("button");
    			button6.textContent = "Emigración";
    			t103 = space();
    			br7 = element("br");
    			add_location(br0, file, 4, 3, 75);
    			add_location(strong0, file, 7, 8, 104);
    			add_location(li0, file, 7, 4, 100);
    			attr_dev(a0, "href", "https://github.com/juanfran94");
    			add_location(a0, file, 9, 9, 153);
    			add_location(li1, file, 9, 5, 149);
    			attr_dev(a1, "href", "https://github.com/angtorcal");
    			add_location(a1, file, 10, 9, 240);
    			add_location(li2, file, 10, 5, 236);
    			attr_dev(a2, "href", "https://github.com/Escobar1993");
    			add_location(a2, file, 11, 9, 321);
    			add_location(li3, file, 11, 5, 317);
    			add_location(ul0, file, 8, 4, 138);
    			add_location(strong1, file, 13, 8, 413);
    			add_location(li4, file, 13, 4, 409);
    			add_location(strong2, file, 14, 8, 591);
    			attr_dev(a3, "href", "https://github.com/gti-sos/SOS1920-01");
    			add_location(a3, file, 14, 37, 620);
    			add_location(li5, file, 14, 4, 587);
    			add_location(strong3, file, 15, 8, 705);
    			attr_dev(a4, "href", "http://sos1920-01.herokuapp.com");
    			add_location(a4, file, 15, 30, 727);
    			add_location(li6, file, 15, 4, 701);
    			add_location(br1, file, 16, 4, 815);
    			add_location(strong4, file, 18, 20, 843);
    			add_location(li7, file, 18, 16, 839);
    			attr_dev(a5, "href", "https://sos1920-01.herokuapp.com/api/v1/natality-stats");
    			add_location(a5, file, 20, 9, 892);
    			attr_dev(a6, "href", "https://github.com/juanfran94");
    			add_location(a6, file, 20, 147, 1030);
    			add_location(li8, file, 20, 5, 888);
    			attr_dev(a7, "href", "https://sos1920-01.herokuapp.com/api/v2/natality-stats");
    			add_location(a7, file, 21, 24, 1127);
    			attr_dev(a8, "href", "https://github.com/juanfran94");
    			add_location(a8, file, 21, 162, 1265);
    			add_location(li9, file, 21, 20, 1123);
    			attr_dev(a9, "href", "https://sos1920-01.herokuapp.com/api/v1/poverty-stats");
    			add_location(a9, file, 23, 24, 1384);
    			attr_dev(a10, "href", "https://github.com/angtorcal");
    			add_location(a10, file, 23, 160, 1520);
    			add_location(li10, file, 23, 20, 1380);
    			attr_dev(a11, "href", "https://sos1920-01.herokuapp.com/api/v2/poverty-stats");
    			add_location(a11, file, 24, 24, 1609);
    			attr_dev(a12, "href", "https://github.com/angtorcal");
    			add_location(a12, file, 24, 160, 1745);
    			add_location(li11, file, 24, 20, 1605);
    			attr_dev(a13, "href", "https://sos1920-01.herokuapp.com/api/v1/emigrants-stats");
    			add_location(a13, file, 26, 24, 1856);
    			attr_dev(a14, "href", "https://github.com/Escobar1993");
    			add_location(a14, file, 26, 164, 1996);
    			add_location(li12, file, 26, 20, 1852);
    			attr_dev(a15, "href", "https://sos1920-01.herokuapp.com/api/v2/emigrants-stats");
    			add_location(a15, file, 27, 24, 2088);
    			attr_dev(a16, "href", "https://github.com/Escobar1993");
    			add_location(a16, file, 27, 164, 2228);
    			add_location(li13, file, 27, 20, 2084);
    			add_location(ul1, file, 19, 4, 877);
    			add_location(br2, file, 29, 4, 2311);
    			add_location(strong5, file, 31, 20, 2355);
    			add_location(li14, file, 31, 16, 2351);
    			attr_dev(a17, "href", "https://documenter.getpostman.com/view/10867933/Szf3bW6K");
    			add_location(a17, file, 33, 9, 2407);
    			attr_dev(a18, "href", "https://github.com/juanfran94");
    			add_location(a18, file, 33, 121, 2519);
    			add_location(li15, file, 33, 5, 2403);
    			attr_dev(a19, "href", "https://documenter.getpostman.com/view/11334187/Szme4JDG");
    			add_location(a19, file, 34, 9, 2601);
    			attr_dev(a20, "href", "https://github.com/juanfran94");
    			add_location(a20, file, 34, 120, 2712);
    			add_location(li16, file, 34, 5, 2597);
    			attr_dev(a21, "href", "https://documenter.getpostman.com/view/10867933/Szf3bW1r");
    			add_location(a21, file, 35, 9, 2794);
    			attr_dev(a22, "href", "https://github.com/angtorcal");
    			add_location(a22, file, 35, 122, 2907);
    			add_location(li17, file, 35, 5, 2790);
    			attr_dev(a23, "href", "https://documenter.getpostman.com/view/10867933/Szme4JDF");
    			add_location(a23, file, 36, 9, 2981);
    			attr_dev(a24, "href", "https://github.com/angtorcal");
    			add_location(a24, file, 36, 122, 3094);
    			add_location(li18, file, 36, 5, 2977);
    			attr_dev(a25, "href", "https://documenter.getpostman.com/view/6902825/Szf3bW6G");
    			add_location(a25, file, 37, 9, 3168);
    			attr_dev(a26, "href", "https://github.com/Escobar1993");
    			add_location(a26, file, 37, 123, 3282);
    			add_location(li19, file, 37, 5, 3164);
    			attr_dev(a27, "href", "https://documenter.getpostman.com/view/6902825/Szme4JDL");
    			add_location(a27, file, 38, 9, 3359);
    			attr_dev(a28, "href", "https://github.com/Escobar1993");
    			add_location(a28, file, 38, 123, 3473);
    			add_location(li20, file, 38, 5, 3355);
    			add_location(ul2, file, 32, 4, 2392);
    			add_location(br3, file, 40, 4, 3556);
    			add_location(strong6, file, 42, 8, 3572);
    			add_location(li21, file, 42, 4, 3568);
    			add_location(br4, file, 44, 5, 3622);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-success");
    			attr_dev(button0, "onclick", "window.location.href='#/natality-stats'");
    			set_style(button0, "width", "25%");
    			add_location(button0, file, 46, 6, 3645);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-success");
    			attr_dev(button1, "onclick", "window.location.href='#/natality-stats/graph'");
    			set_style(button1, "width", "25%");
    			add_location(button1, file, 47, 6, 3796);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-success");
    			attr_dev(button2, "onclick", "window.location.href='#/natality-stats/graphV2'");
    			set_style(button2, "width", "30%");
    			add_location(button2, file, 48, 6, 3954);
    			add_location(li22, file, 45, 5, 3633);
    			add_location(br5, file, 50, 5, 4142);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-primary");
    			attr_dev(button3, "onclick", "window.location.href='#/poverty-stats'");
    			set_style(button3, "width", "25%");
    			add_location(button3, file, 52, 6, 4166);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary");
    			attr_dev(button4, "onclick", "window.location.href='#/poverty-stats/graph'");
    			set_style(button4, "width", "25%");
    			add_location(button4, file, 53, 6, 4315);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-primary");
    			attr_dev(button5, "onclick", "window.location.href='#/poverty-stats/graph2'");
    			set_style(button5, "width", "25%");
    			add_location(button5, file, 54, 6, 4476);
    			add_location(li23, file, 51, 5, 4154);
    			add_location(br6, file, 56, 4, 4649);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "btn btn-warning");
    			attr_dev(button6, "onclick", "window.location.href='#/emigrants-stats'");
    			set_style(button6, "width", "25%");
    			add_location(button6, file, 57, 9, 4664);
    			add_location(li24, file, 57, 5, 4660);
    			add_location(br7, file, 58, 5, 4813);
    			add_location(ul3, file, 43, 4, 3611);
    			add_location(ul4, file, 5, 3, 84);
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
    			append_dev(div0, ul4);
    			append_dev(ul4, li0);
    			append_dev(li0, strong0);
    			append_dev(ul4, t2);
    			append_dev(ul4, ul0);
    			append_dev(ul0, li1);
    			append_dev(li1, a0);
    			append_dev(ul0, t4);
    			append_dev(ul0, li2);
    			append_dev(li2, a1);
    			append_dev(ul0, t6);
    			append_dev(ul0, li3);
    			append_dev(li3, a2);
    			append_dev(ul4, t8);
    			append_dev(ul4, li4);
    			append_dev(li4, strong1);
    			append_dev(li4, t10);
    			append_dev(ul4, t11);
    			append_dev(ul4, li5);
    			append_dev(li5, strong2);
    			append_dev(li5, a3);
    			append_dev(ul4, t14);
    			append_dev(ul4, li6);
    			append_dev(li6, strong3);
    			append_dev(li6, a4);
    			append_dev(ul4, t17);
    			append_dev(ul4, br1);
    			append_dev(ul4, t18);
    			append_dev(ul4, li7);
    			append_dev(li7, strong4);
    			append_dev(ul4, t20);
    			append_dev(ul4, ul1);
    			append_dev(ul1, li8);
    			append_dev(li8, a5);
    			append_dev(li8, t22);
    			append_dev(li8, a6);
    			append_dev(li8, t24);
    			append_dev(ul1, t25);
    			append_dev(ul1, li9);
    			append_dev(li9, a7);
    			append_dev(li9, t27);
    			append_dev(li9, a8);
    			append_dev(li9, t29);
    			append_dev(ul1, t30);
    			append_dev(ul1, li10);
    			append_dev(li10, a9);
    			append_dev(li10, t32);
    			append_dev(li10, a10);
    			append_dev(li10, t34);
    			append_dev(ul1, t35);
    			append_dev(ul1, li11);
    			append_dev(li11, a11);
    			append_dev(li11, t37);
    			append_dev(li11, a12);
    			append_dev(li11, t39);
    			append_dev(ul1, t40);
    			append_dev(ul1, li12);
    			append_dev(li12, a13);
    			append_dev(li12, t42);
    			append_dev(li12, a14);
    			append_dev(li12, t44);
    			append_dev(ul1, t45);
    			append_dev(ul1, li13);
    			append_dev(li13, a15);
    			append_dev(li13, t47);
    			append_dev(li13, a16);
    			append_dev(li13, t49);
    			append_dev(ul4, t50);
    			append_dev(ul4, br2);
    			append_dev(ul4, t51);
    			append_dev(ul4, li14);
    			append_dev(li14, strong5);
    			append_dev(ul4, t53);
    			append_dev(ul4, ul2);
    			append_dev(ul2, li15);
    			append_dev(li15, a17);
    			append_dev(li15, t55);
    			append_dev(li15, a18);
    			append_dev(li15, t57);
    			append_dev(ul2, t58);
    			append_dev(ul2, li16);
    			append_dev(li16, a19);
    			append_dev(li16, t60);
    			append_dev(li16, a20);
    			append_dev(li16, t62);
    			append_dev(ul2, t63);
    			append_dev(ul2, li17);
    			append_dev(li17, a21);
    			append_dev(li17, t65);
    			append_dev(li17, a22);
    			append_dev(li17, t67);
    			append_dev(ul2, t68);
    			append_dev(ul2, li18);
    			append_dev(li18, a23);
    			append_dev(li18, t70);
    			append_dev(li18, a24);
    			append_dev(li18, t72);
    			append_dev(ul2, t73);
    			append_dev(ul2, li19);
    			append_dev(li19, a25);
    			append_dev(li19, t75);
    			append_dev(li19, a26);
    			append_dev(li19, t77);
    			append_dev(ul2, t78);
    			append_dev(ul2, li20);
    			append_dev(li20, a27);
    			append_dev(li20, t80);
    			append_dev(li20, a28);
    			append_dev(li20, t82);
    			append_dev(ul4, t83);
    			append_dev(ul4, br3);
    			append_dev(ul4, t84);
    			append_dev(ul4, li21);
    			append_dev(li21, strong6);
    			append_dev(ul4, t86);
    			append_dev(ul4, ul3);
    			append_dev(ul3, br4);
    			append_dev(ul3, t87);
    			append_dev(ul3, li22);
    			append_dev(li22, button0);
    			append_dev(li22, t89);
    			append_dev(li22, button1);
    			append_dev(li22, t91);
    			append_dev(li22, button2);
    			append_dev(ul3, t93);
    			append_dev(ul3, br5);
    			append_dev(ul3, t94);
    			append_dev(ul3, li23);
    			append_dev(li23, button3);
    			append_dev(li23, t96);
    			append_dev(li23, button4);
    			append_dev(li23, t98);
    			append_dev(li23, button5);
    			append_dev(ul3, t100);
    			append_dev(ul3, br6);
    			append_dev(ul3, t101);
    			append_dev(ul3, li24);
    			append_dev(li24, button6);
    			append_dev(ul3, t103);
    			append_dev(ul3, br7);
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

    /* src\front\NotFound.svelte generated by Svelte v3.22.2 */

    const file$1 = "src\\front\\NotFound.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "La pagina no existe!";
    			add_location(h1, file$1, 1, 4, 12);
    			add_location(main, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", $$slots, []);
    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$2.name
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
    function create_if_block$1(ctx) {
    	let a;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
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
    		id: create_if_block$1.name,
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
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
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
    	const if_block_creators = [create_if_block$1, create_else_block_1];
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

    /* src\front\Analytics.svelte generated by Svelte v3.22.2 */
    const file$3 = "src\\front\\Analytics.svelte";

    // (116:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atras");
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
    		source: "(116:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let t0;
    	let main;
    	let h2;
    	let t2;
    	let t3;
    	let p;
    	let br;
    	let t4;
    	let i;
    	let t6;
    	let div;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			t0 = space();
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Analisis de todos los datos de los miembros de SOS1920-01";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			p = element("p");
    			br = element("br");
    			t4 = space();
    			i = element("i");
    			i.textContent = "Gráfica común a las tres APIs. Representa la natalidad, la emigración y el riesgo de pobreza. Los datos de \r\n            Riesgo de pobreza son tan pequeños que apenas se aprecian. Para verlo deja marcado un solo país.";
    			t6 = space();
    			div = element("div");
    			if (script0.src !== (script0_src_value = "https://www.amcharts.com/lib/4/core.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$3, 105, 4, 3858);
    			if (script1.src !== (script1_src_value = "https://www.amcharts.com/lib/4/charts.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$3, 106, 4, 3926);
    			if (script2.src !== (script2_src_value = "https://www.amcharts.com/lib/4/plugins/sunburst.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$3, 107, 4, 3996);
    			if (script3.src !== (script3_src_value = "https://www.amcharts.com/lib/4/themes/kelly.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$3, 108, 4, 4076);
    			if (script4.src !== (script4_src_value = "https://www.amcharts.com/lib/4/themes/animated.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$3, 109, 4, 4152);
    			set_style(h2, "text-align", "center");
    			add_location(h2, file$3, 113, 4, 4279);
    			add_location(br, file$3, 117, 8, 4500);
    			add_location(i, file$3, 118, 8, 4514);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$3, 116, 4, 4456);
    			attr_dev(div, "id", "chartdiv");
    			attr_dev(div, "class", "svelte-4y09ai");
    			add_location(div, file$3, 121, 4, 4754);
    			add_location(main, file$3, 112, 0, 4267);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, br);
    			append_dev(p, t4);
    			append_dev(p, i);
    			append_dev(main, t6);
    			append_dev(main, div);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script4, "load", loadGraph, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
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

    async function loadGraph() {
    	let MyDataN = [];
    	let MyDataP = [];
    	let MyDataE = [];
    	let MyDataGraph = [];
    	const resDataN = await fetch("/api/v2/natality-stats");
    	MyDataN = await resDataN.json();
    	const resDataP = await fetch("/api/v2/poverty-stats");
    	MyDataP = await resDataP.json();
    	const resDataE = await fetch("/api/v2/emigrants-stats");
    	MyDataE = await resDataE.json();

    	MyDataN.forEach(x => {
    		MyDataP.forEach(y => {
    			MyDataE.forEach(z => {
    				if (x.country == y.country && x.country == z.country && x.year == y.year && x.year == z.year) {
    					MyDataGraph.push({
    						name: x.country + " " + x.year,
    						children: [
    							{
    								name: "Natalidad",
    								children: [
    									{
    										name: "Total",
    										value: parseInt(x.natality_totals)
    									},
    									{
    										name: "Hombres",
    										value: parseInt(x.natality_men)
    									},
    									{
    										name: "Mujeres",
    										value: parseInt(x.natality_women)
    									}
    								]
    							},
    							{
    								name: "Riesgo de Pobreza",
    								children: [
    									{
    										name: "Personas",
    										value: parseInt(y.poverty_prp)
    									},
    									{
    										name: "Umbral de personal",
    										value: parseInt(y.poverty_pt)
    									},
    									{
    										name: "Umbral del hogar",
    										value: parseInt(y.poverty_ht)
    									}
    								]
    							},
    							{
    								name: "Emigracion",
    								children: [
    									{
    										name: "Total",
    										value: parseFloat(z.em_totals)
    									},
    									{
    										name: "Hombres",
    										value: parseFloat(z.em_man)
    									},
    									{
    										name: "Mujeres",
    										value: parseFloat(z.em_woman)
    									}
    								]
    							}
    						]
    					});
    				}
    			});
    		});
    	});

    	// Themes begin
    	am4core.useTheme(am4themes_kelly);

    	am4core.useTheme(am4themes_animated);

    	// Themes end
    	// create chart
    	var chart = am4core.create("chartdiv", am4plugins_sunburst.Sunburst);

    	chart.padding(0, 0, 0, 0);
    	chart.radius = am4core.percent(98);
    	chart.data = MyDataGraph;
    	chart.colors.step = 2;
    	chart.fontSize = 11;
    	chart.innerRadius = am4core.percent(10);

    	// define data fields
    	chart.dataFields.value = "value";

    	chart.dataFields.name = "name";
    	chart.dataFields.children = "children";
    	var level0SeriesTemplate = new am4plugins_sunburst.SunburstSeries();
    	level0SeriesTemplate.hiddenInLegend = false;
    	chart.seriesTemplates.setKey("0", level0SeriesTemplate);

    	// this makes labels to be hidden if they don't fit
    	level0SeriesTemplate.labels.template.truncate = true;

    	level0SeriesTemplate.labels.template.hideOversized = true;

    	level0SeriesTemplate.labels.template.adapter.add("rotation", function (rotation, target) {
    		target.maxWidth = target.dataItem.slice.radius - target.dataItem.slice.innerRadius - 10;
    		target.maxHeight = Math.abs(target.dataItem.slice.arc * (target.dataItem.slice.innerRadius + target.dataItem.slice.radius) / 2 * am4core.math.RADIANS);
    		return rotation;
    	});

    	var level1SeriesTemplate = level0SeriesTemplate.clone();
    	chart.seriesTemplates.setKey("1", level1SeriesTemplate);
    	level1SeriesTemplate.fillOpacity = 0.75;
    	level1SeriesTemplate.hiddenInLegend = true;
    	var level2SeriesTemplate = level0SeriesTemplate.clone();
    	chart.seriesTemplates.setKey("2", level2SeriesTemplate);
    	level2SeriesTemplate.fillOpacity = 0.5;
    	level2SeriesTemplate.hiddenInLegend = true;
    	chart.legend = new am4charts.Legend();
    }

    function instance$4($$self, $$props, $$invalidate) {
    	loadGraph();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Analytics> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Analytics", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph });
    	return [];
    }

    class Analytics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Analytics",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* node_modules\sveltestrap\src\Table.svelte generated by Svelte v3.22.2 */
    const file$4 = "node_modules\\sveltestrap\\src\\Table.svelte";

    // (38:0) {:else}
    function create_else_block$2(ctx) {
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
    			add_location(table, file$4, 38, 2, 908);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(38:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if responsive}
    function create_if_block$2(ctx) {
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
    			add_location(table, file$4, 33, 4, 826);
    			attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			add_location(div, file$4, 32, 2, 788);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(32:0) {#if responsive}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
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
    			id: create_fragment$5.name
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

    /* src\front\natalityApi\NatalityTable.svelte generated by Svelte v3.22.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src\\front\\natalityApi\\NatalityTable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
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

    // (252:1) {:then natalitystats}
    function create_then_block(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_7] },
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

    			if (dirty[0] & /*natalitystats, newStat*/ 4097 | dirty[1] & /*$$scope*/ 256) {
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
    		source: "(252:1) {:then natalitystats}",
    		ctx
    	});

    	return block;
    }

    // (271:9) <Button outline color="primary" on:click={insertStat}>
    function create_default_slot_9(ctx) {
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
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(271:9) <Button outline color=\\\"primary\\\" on:click={insertStat}>",
    		ctx
    	});

    	return block;
    }

    // (282:10) <Button outline color="danger" on:click="{deleteStat(stat.country,stat.year)}">
    function create_default_slot_8(ctx) {
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
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(282:10) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStat(stat.country,stat.year)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (273:4) {#each natalitystats as stat}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*stat*/ ctx[36].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*stat*/ ctx[36].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*stat*/ ctx[36].natality_totals + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*stat*/ ctx[36].natality_men + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*stat*/ ctx[36].natality_women + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteStat*/ ctx[17](/*stat*/ ctx[36].country, /*stat*/ ctx[36].year))) /*deleteStat*/ ctx[17](/*stat*/ ctx[36].country, /*stat*/ ctx[36].year).apply(this, arguments);
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
    			attr_dev(a, "href", a_href_value = "#/natality-stats/" + /*stat*/ ctx[36].country + "/" + /*stat*/ ctx[36].year);
    			add_location(a, file$5, 275, 7, 9121);
    			add_location(td0, file$5, 274, 6, 9108);
    			add_location(td1, file$5, 277, 6, 9214);
    			add_location(td2, file$5, 278, 6, 9242);
    			add_location(td3, file$5, 279, 6, 9281);
    			add_location(td4, file$5, 280, 6, 9317);
    			add_location(td5, file$5, 281, 6, 9355);
    			add_location(tr, file$5, 273, 5, 9096);
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
    			if ((!current || dirty[0] & /*natalitystats*/ 4096) && t0_value !== (t0_value = /*stat*/ ctx[36].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*natalitystats*/ 4096 && a_href_value !== (a_href_value = "#/natality-stats/" + /*stat*/ ctx[36].country + "/" + /*stat*/ ctx[36].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*natalitystats*/ 4096) && t2_value !== (t2_value = /*stat*/ ctx[36].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*natalitystats*/ 4096) && t4_value !== (t4_value = /*stat*/ ctx[36].natality_totals + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*natalitystats*/ 4096) && t6_value !== (t6_value = /*stat*/ ctx[36].natality_men + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*natalitystats*/ 4096) && t8_value !== (t8_value = /*stat*/ ctx[36].natality_women + "")) set_data_dev(t8, t8_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		source: "(273:4) {#each natalitystats as stat}",
    		ctx
    	});

    	return block;
    }

    // (253:2) <Table bordered>
    function create_default_slot_7(ctx) {
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
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*insertStat*/ ctx[16]);
    	let each_value = /*natalitystats*/ ctx[12];
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
    			th2.textContent = "Natalidad Total";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Natalidad Hombres";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Natalidad Mujeres";
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

    			add_location(th0, file$5, 255, 5, 8382);
    			add_location(th1, file$5, 256, 5, 8402);
    			add_location(th2, file$5, 257, 5, 8421);
    			add_location(th3, file$5, 258, 5, 8452);
    			add_location(th4, file$5, 259, 5, 8485);
    			add_location(th5, file$5, 260, 5, 8518);
    			add_location(tr0, file$5, 254, 4, 8371);
    			add_location(thead, file$5, 253, 3, 8358);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$5, 265, 9, 8592);
    			add_location(td0, file$5, 265, 5, 8588);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$5, 266, 9, 8662);
    			add_location(td1, file$5, 266, 5, 8658);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$5, 267, 9, 8731);
    			add_location(td2, file$5, 267, 5, 8727);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$5, 268, 9, 8811);
    			add_location(td3, file$5, 268, 5, 8807);
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$5, 269, 9, 8888);
    			add_location(td4, file$5, 269, 5, 8884);
    			add_location(td5, file$5, 270, 5, 8963);
    			add_location(tr1, file$5, 264, 4, 8577);
    			add_location(tbody, file$5, 263, 3, 8564);
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
    			set_input_value(input2, /*newStat*/ ctx[0].natality_totals);
    			append_dev(tr1, t14);
    			append_dev(tr1, td3);
    			append_dev(td3, input3);
    			set_input_value(input3, /*newStat*/ ctx[0].natality_men);
    			append_dev(tr1, t15);
    			append_dev(tr1, td4);
    			append_dev(td4, input4);
    			set_input_value(input4, /*newStat*/ ctx[0].natality_women);
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
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[23]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[26]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[27])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newStat*/ 1 && input0.value !== /*newStat*/ ctx[0].country) {
    				set_input_value(input0, /*newStat*/ ctx[0].country);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input1.value) !== /*newStat*/ ctx[0].year) {
    				set_input_value(input1, /*newStat*/ ctx[0].year);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input2.value) !== /*newStat*/ ctx[0].natality_totals) {
    				set_input_value(input2, /*newStat*/ ctx[0].natality_totals);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input3.value) !== /*newStat*/ ctx[0].natality_men) {
    				set_input_value(input3, /*newStat*/ ctx[0].natality_men);
    			}

    			if (dirty[0] & /*newStat*/ 1 && to_number(input4.value) !== /*newStat*/ ctx[0].natality_women) {
    				set_input_value(input4, /*newStat*/ ctx[0].natality_women);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty[0] & /*deleteStat, natalitystats*/ 135168) {
    				each_value = /*natalitystats*/ ctx[12];
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
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(253:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (250:23)     Loading natalitystats...   {:then natalitystats}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading natalitystats...");
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
    		source: "(250:23)     Loading natalitystats...   {:then natalitystats}",
    		ctx
    	});

    	return block;
    }

    // (288:1) {#if errorMsg}
    function create_if_block_3$1(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[10]);
    			set_style(p, "color", "red");
    			add_location(p, file$5, 288, 8, 9548);
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(288:1) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (291:1) {#if exitoMsg}
    function create_if_block_2$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*exitoMsg*/ ctx[11]);
    			set_style(p, "color", "green");
    			add_location(p, file$5, 291, 8, 9626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*exitoMsg*/ 2048) set_data_dev(t, /*exitoMsg*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(291:1) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (294:1) <Button outline color="secondary" on:click="{loadInitialData}">
    function create_default_slot_6(ctx) {
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
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(294:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{loadInitialData}\\\">",
    		ctx
    	});

    	return block;
    }

    // (295:1) <Button outline color="danger" on:click="{deleteStats}">
    function create_default_slot_5(ctx) {
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
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(295:1) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStats}\\\">",
    		ctx
    	});

    	return block;
    }

    // (296:1) {#if numeroDePagina==0}
    function create_if_block_1$1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		source: "(296:1) {#if numeroDePagina==0}",
    		ctx
    	});

    	return block;
    }

    // (297:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 2)}">
    function create_default_slot_4(ctx) {
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(297:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (300:1) {#if numeroDePagina>0}
    function create_if_block$3(ctx) {
    	let t;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 1))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 1).apply(this, arguments);
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		source: "(300:1) {#if numeroDePagina>0}",
    		ctx
    	});

    	return block;
    }

    // (301:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 1)}">
    function create_default_slot_3(ctx) {
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(301:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 1)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (303:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 2)}">
    function create_default_slot_2(ctx) {
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(303:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, natality_totalsMin,      natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin, natality_womenMax, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (320:4) <Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, natality_totalsMin, natality_totalsMax,           natality_menMin, natality_menMax, natality_womenMin, natality_womenMax)}">
    function create_default_slot_1(ctx) {
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(320:4) <Button outline color=\\\"primary\\\" on:click=\\\"{busqueda (searchCountry, searchYear, natality_totalsMin, natality_totalsMax,           natality_menMin, natality_menMax, natality_womenMin, natality_womenMax)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (324:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$1(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$5, 323, 53, 11874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(324:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let promise;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let h60;
    	let t10;
    	let tr0;
    	let td0;
    	let label0;
    	let t11;
    	let input0;
    	let t12;
    	let td1;
    	let label1;
    	let t13;
    	let input1;
    	let t14;
    	let td2;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let td3;
    	let label3;
    	let t17;
    	let input3;
    	let t18;
    	let tr1;
    	let td4;
    	let label4;
    	let t19;
    	let input4;
    	let t20;
    	let td5;
    	let label5;
    	let t21;
    	let input5;
    	let t22;
    	let td6;
    	let label6;
    	let t23;
    	let input6;
    	let t24;
    	let td7;
    	let label7;
    	let t25;
    	let input7;
    	let t26;
    	let t27;
    	let h61;
    	let t29;
    	let br0;
    	let t30;
    	let t31;
    	let br1;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*natalitystats*/ ctx[12], info);
    	let if_block0 = /*errorMsg*/ ctx[10] && create_if_block_3$1(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[11] && create_if_block_2$1(ctx);

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[15]);

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteStats*/ ctx[18]);
    	let if_block2 = /*numeroDePagina*/ ctx[1] == 0 && create_if_block_1$1(ctx);
    	let if_block3 = /*numeroDePagina*/ ctx[1] > 0 && create_if_block$3(ctx);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", function () {
    		if (is_function(/*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9]))) /*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*natality_totalsMin*/ ctx[4], /*natality_totalsMax*/ ctx[5], /*natality_menMin*/ ctx[6], /*natality_menMax*/ ctx[7], /*natality_womenMin*/ ctx[8], /*natality_womenMax*/ ctx[9]).apply(this, arguments);
    	});

    	const button3 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button3.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Datos de Natalidad 🤰";
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			create_component(button0.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			if (if_block3) if_block3.c();
    			t8 = space();
    			h60 = element("h6");
    			h60.textContent = "Pulse el boton para pasar a la siguiente página.";
    			t10 = space();
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			t11 = text("País: ");
    			input0 = element("input");
    			t12 = space();
    			td1 = element("td");
    			label1 = element("label");
    			t13 = text("Número mínimo de natalidad total: ");
    			input1 = element("input");
    			t14 = space();
    			td2 = element("td");
    			label2 = element("label");
    			t15 = text("Número mínimo de natalidad en hombres: ");
    			input2 = element("input");
    			t16 = space();
    			td3 = element("td");
    			label3 = element("label");
    			t17 = text("Número mínimo de natalidad en mujeres: ");
    			input3 = element("input");
    			t18 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			label4 = element("label");
    			t19 = text("Año: ");
    			input4 = element("input");
    			t20 = space();
    			td5 = element("td");
    			label5 = element("label");
    			t21 = text("Número máximo de natalidad total: ");
    			input5 = element("input");
    			t22 = space();
    			td6 = element("td");
    			label6 = element("label");
    			t23 = text("Número máximo de natalidad en hombres: ");
    			input6 = element("input");
    			t24 = space();
    			td7 = element("td");
    			label7 = element("label");
    			t25 = text("Número máximo de natalidad en mujeres: ");
    			input7 = element("input");
    			t26 = space();
    			create_component(button2.$$.fragment);
    			t27 = space();
    			h61 = element("h6");
    			h61.textContent = "¡¡NOTA!! Si quieres volver a ver todos los datos antes de la búsqueda, borre los datos de los filtros y pulse Buscar";
    			t29 = space();
    			br0 = element("br");
    			t30 = space();
    			create_component(button3.$$.fragment);
    			t31 = space();
    			br1 = element("br");
    			add_location(h2, file$5, 248, 1, 8225);
    			add_location(h60, file$5, 305, 1, 10603);
    			add_location(input0, file$5, 307, 19, 10689);
    			add_location(label0, file$5, 307, 6, 10676);
    			add_location(td0, file$5, 307, 2, 10672);
    			add_location(input1, file$5, 308, 47, 10787);
    			add_location(label1, file$5, 308, 6, 10746);
    			add_location(td1, file$5, 308, 2, 10742);
    			add_location(input2, file$5, 309, 52, 10895);
    			add_location(label2, file$5, 309, 6, 10849);
    			add_location(td2, file$5, 309, 2, 10845);
    			add_location(input3, file$5, 310, 52, 11000);
    			add_location(label3, file$5, 310, 6, 10954);
    			add_location(td3, file$5, 310, 2, 10950);
    			add_location(tr0, file$5, 306, 1, 10664);
    			add_location(input4, file$5, 313, 18, 11088);
    			add_location(label4, file$5, 313, 6, 11076);
    			add_location(td4, file$5, 313, 2, 11072);
    			add_location(input5, file$5, 314, 47, 11183);
    			add_location(label5, file$5, 314, 6, 11142);
    			add_location(td5, file$5, 314, 2, 11138);
    			add_location(input6, file$5, 315, 52, 11291);
    			add_location(label6, file$5, 315, 6, 11245);
    			add_location(td6, file$5, 315, 2, 11241);
    			add_location(input7, file$5, 316, 52, 11396);
    			add_location(label7, file$5, 316, 6, 11350);
    			add_location(td7, file$5, 316, 2, 11346);
    			add_location(tr1, file$5, 312, 1, 11064);
    			add_location(h61, file$5, 321, 1, 11687);
    			add_location(br0, file$5, 322, 1, 11815);
    			add_location(br1, file$5, 324, 1, 11933);
    			add_location(main, file$5, 247, 0, 8216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t2;
    			append_dev(main, t2);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t3);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t4);
    			mount_component(button0, main, null);
    			append_dev(main, t5);
    			mount_component(button1, main, null);
    			append_dev(main, t6);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t7);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t8);
    			append_dev(main, h60);
    			append_dev(main, t10);
    			append_dev(main, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(label0, t11);
    			append_dev(label0, input0);
    			set_input_value(input0, /*searchCountry*/ ctx[2]);
    			append_dev(tr0, t12);
    			append_dev(tr0, td1);
    			append_dev(td1, label1);
    			append_dev(label1, t13);
    			append_dev(label1, input1);
    			set_input_value(input1, /*natality_totalsMin*/ ctx[4]);
    			append_dev(tr0, t14);
    			append_dev(tr0, td2);
    			append_dev(td2, label2);
    			append_dev(label2, t15);
    			append_dev(label2, input2);
    			set_input_value(input2, /*natality_menMin*/ ctx[6]);
    			append_dev(tr0, t16);
    			append_dev(tr0, td3);
    			append_dev(td3, label3);
    			append_dev(label3, t17);
    			append_dev(label3, input3);
    			set_input_value(input3, /*natality_womenMin*/ ctx[8]);
    			append_dev(main, t18);
    			append_dev(main, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, label4);
    			append_dev(label4, t19);
    			append_dev(label4, input4);
    			set_input_value(input4, /*searchYear*/ ctx[3]);
    			append_dev(tr1, t20);
    			append_dev(tr1, td5);
    			append_dev(td5, label5);
    			append_dev(label5, t21);
    			append_dev(label5, input5);
    			set_input_value(input5, /*natality_totalsMax*/ ctx[5]);
    			append_dev(tr1, t22);
    			append_dev(tr1, td6);
    			append_dev(td6, label6);
    			append_dev(label6, t23);
    			append_dev(label6, input6);
    			set_input_value(input6, /*natality_menMax*/ ctx[7]);
    			append_dev(tr1, t24);
    			append_dev(tr1, td7);
    			append_dev(td7, label7);
    			append_dev(label7, t25);
    			append_dev(label7, input7);
    			set_input_value(input7, /*natality_womenMax*/ ctx[9]);
    			append_dev(main, t26);
    			mount_component(button2, main, null);
    			append_dev(main, t27);
    			append_dev(main, h61);
    			append_dev(main, t29);
    			append_dev(main, br0);
    			append_dev(main, t30);
    			mount_component(button3, main, null);
    			append_dev(main, t31);
    			append_dev(main, br1);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[29]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[30]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[31]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[32]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[33]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[34]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[35])
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*natalitystats*/ 4096 && promise !== (promise = /*natalitystats*/ ctx[12]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[12] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(main, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(main, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (/*numeroDePagina*/ ctx[1] == 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
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

    			if (/*numeroDePagina*/ ctx[1] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t8);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*searchCountry*/ 4 && input0.value !== /*searchCountry*/ ctx[2]) {
    				set_input_value(input0, /*searchCountry*/ ctx[2]);
    			}

    			if (dirty[0] & /*natality_totalsMin*/ 16 && input1.value !== /*natality_totalsMin*/ ctx[4]) {
    				set_input_value(input1, /*natality_totalsMin*/ ctx[4]);
    			}

    			if (dirty[0] & /*natality_menMin*/ 64 && input2.value !== /*natality_menMin*/ ctx[6]) {
    				set_input_value(input2, /*natality_menMin*/ ctx[6]);
    			}

    			if (dirty[0] & /*natality_womenMin*/ 256 && input3.value !== /*natality_womenMin*/ ctx[8]) {
    				set_input_value(input3, /*natality_womenMin*/ ctx[8]);
    			}

    			if (dirty[0] & /*searchYear*/ 8 && input4.value !== /*searchYear*/ ctx[3]) {
    				set_input_value(input4, /*searchYear*/ ctx[3]);
    			}

    			if (dirty[0] & /*natality_totalsMax*/ 32 && input5.value !== /*natality_totalsMax*/ ctx[5]) {
    				set_input_value(input5, /*natality_totalsMax*/ ctx[5]);
    			}

    			if (dirty[0] & /*natality_menMax*/ 128 && input6.value !== /*natality_menMax*/ ctx[7]) {
    				set_input_value(input6, /*natality_menMax*/ ctx[7]);
    			}

    			if (dirty[0] & /*natality_womenMax*/ 512 && input7.value !== /*natality_womenMax*/ ctx[9]) {
    				set_input_value(input7, /*natality_womenMax*/ ctx[9]);
    			}

    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(button2);
    			destroy_component(button3);
    			run_all(dispose);
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
    	let natalitystats = [];

    	let newStat = {
    		country: "",
    		year: "",
    		natality_totals: "",
    		natality_men: "",
    		natality_women: ""
    	};

    	let numeroDePagina = 0;
    	let numeroAux;
    	let limit = 10;
    	let searchCountry = "";
    	let searchYear = "";
    	let natality_totalsMin = "";
    	let natality_totalsMax = "";
    	let natality_menMin = "";
    	let natality_menMax = "";
    	let natality_womenMin = "";
    	let natality_womenMax = "";
    	let errorMsg = "";
    	let exitoMsg = "";
    	onMount(getStats);

    	async function getStats() {
    		console.log("Fetching stats....");
    		const res = await fetch("/api/v2/natality-stats?offset=" + numeroDePagina + "&limit=" + limit);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, natalitystats = json);
    			console.log("Received " + natalitystats.length + " stats.");
    		} else {
    			console.log("ERROR");
    		}

    		
    	}

    	

    	//BUSQUEDAS
    	async function busqueda(
    		searchCountry,
    	searchYear,
    	natality_totalsMin,
    	natality_totalsMax,
    	natality_menMin,
    	natality_menMax,
    	natality_womenMin,
    	natality_womenMax
    	) {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");

    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof natality_totalsMin == "undefined") {
    			natality_totalsMin = "";
    		}

    		if (typeof natality_totalsMax == "undefined") {
    			natality_totalsMax = "";
    		}

    		if (typeof natality_menMin == "undefined") {
    			natality_menMin = "";
    		}

    		if (typeof natality_menMax == "undefined") {
    			natality_menMax = "";
    		}

    		if (typeof natality_womenMin == "undefined") {
    			natality_womenMin = "";
    		}

    		if (typeof natality_womenMax == "undefined") {
    			natality_womenMax = "";
    		}

    		const res = await fetch("/api/v2/natality-stats?country=" + searchCountry + "&year=" + searchYear + "&natality_totalsMax=" + natality_totalsMax + "&natality_totalsMin=" + natality_totalsMin + "&natality_menMin=" + natality_menMin + "&natality_menMax=" + natality_menMax + "&natality_womenMin=" + natality_womenMin + "&natality_womenMax=" + natality_womenMax);

    		if (res.ok) {
    			const json = await res.json();
    			$$invalidate(12, natalitystats = json);
    			console.log("Found " + natalitystats.length + " stats");

    			//window.alert("Dato encontrado con éxito");
    			$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ".Dato encontrado.");
    		} else if (res.status == 404) {
    			window.alert("No se encuentran datos.");
    			$$invalidate(10, errorMsg = res.status + "quiere decir: " + res.statusText + ".Dato no encontrado");
    		}
    	}

    	//PAGINACION
    	async function paginacion(
    		searchCountry,
    	searchYear,
    	natality_totalsMin,
    	natality_totalsMax,
    	natality_menMin,
    	natality_menMax,
    	natality_womenMin,
    	natality_womenMax,
    	num
    	) {
    		numeroAux = num;

    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof natality_totalsMin == "undefined") {
    			natality_totalsMin = "";
    		}

    		if (typeof natality_totalsMax == "undefined") {
    			natality_totalsMax = "";
    		}

    		if (typeof natality_menMin == "undefined") {
    			natality_menMin = "";
    		}

    		if (typeof natality_menMax == "undefined") {
    			natality_menMax = "";
    		}

    		if (typeof natality_womenMin == "undefined") {
    			natality_womenMin = "";
    		}

    		if (typeof natality_womenMax == "undefined") {
    			natality_womenMax = "";
    		}

    		if (num == 1) {
    			$$invalidate(1, numeroDePagina = numeroDePagina - limit);

    			if (numeroDePagina < 0) {
    				$$invalidate(1, numeroDePagina = 0);
    				const res = await fetch("/api/v2/natality-stats?country=" + searchCountry + "&year=" + searchYear + "&natality_totalsMin=" + natality_totalsMin + "&natality_totalsMax=" + natality_totalsMax + "&natality_menMax=" + natality_menMax + "&natality_menMin=" + natality_menMin + "&natality_womenMax=" + natality_womenMax + "&natality_womenMin=" + natality_womenMin + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(12, natalitystats = json);
    					numeroAux = num;
    				}
    			} else {
    				const res = await fetch("/api/v2/natality-stats?country=" + searchCountry + "&year=" + searchYear + "&natality_totalsMin=" + natality_totalsMin + "&natality_totalsMax=" + natality_totalsMax + "&natality_menMax=" + natality_menMax + "&natality_menMin=" + natality_menMin + "&natality_womenMax=" + natality_womenMax + "&natality_womenMin=" + natality_womenMin + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(12, natalitystats = json);
    					numeroAux = num;
    				}
    			}
    		} else {
    			$$invalidate(1, numeroDePagina = numeroDePagina + limit);
    			const res = await fetch("/api/v2/natality-stats?country=" + searchCountry + "&year=" + searchYear + "&natality_totalsMin=" + natality_totalsMin + "&natality_totalsMax=" + natality_totalsMax + "&natality_menMax=" + natality_menMax + "&natality_menMin=" + natality_menMin + "&natality_womenMax=" + natality_womenMax + "&natality_womenMin=" + natality_womenMin + "&limit=" + limit + "&offset=" + numeroDePagina);

    			if (res.ok) {
    				const json = await res.json();
    				$$invalidate(12, natalitystats = json);
    				numeroAux = num;
    			}
    		}
    	}

    	async function getStatsNat() {
    		console.log("Fetching stats...");
    		const res = await fetch("/api/v2/natality-stats");

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, natalitystats = json);
    			console.log("Received " + natalitystats.length + " stats.");
    		} else {
    			$$invalidate(10, errorMsg = "ERROR: " + res.status + ", y quiere decir: " + res.statusText + ".Dato no encontado");
    			console.log("ERROR!");
    		}
    	}

    	async function loadInitialData() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Loading stats...");

    		const res = await fetch("/api/v2/natality-stats/loadInitialData", { method: "GET" }).then(function (res) {
    			if (res.ok) {
    				getStatsNat();

    				//window.alert("Datos iniciales cargados.");
    				$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ".Dato iniciales cargados!");
    			} else {
    				$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}
    		});
    	}

    	async function insertStat() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Inserting stat...");

    		if (newStat.country == "" || newStat.country == null || newStat.year == "" || newStat.year == null) {
    			window.alert("Rellana el campo país y año");
    		} else {
    			const res = await fetch("/api/v2/natality-stats", {
    				method: "POST",
    				body: JSON.stringify(newStat),
    				headers: { "Content-Type": "application/json" }
    			}).then(function (res) {
    				if (res.ok) {
    					console.log("Ok:");
    					getStats();

    					//window.alert("Dato insertado correctamente.");
    					$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ". Dato insertado con éxito");
    				} else if (res.status == 400) {
    					window.alert("Campo mal escrito.No se puede insertar el dato.");
    					$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText + ".Rellene todos los campos");
    					console.log("ERROR!");
    				} else {
    					$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText + ".Dato ya creado");
    					console.log("ERROR!");
    					window.alert("Dato ya creado. No se puede insertar el dato.");
    				}
    			});
    		}
    	}

    	async function deleteStat(country, year) {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/natality-stats/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			window.alert("Dato eliminado correctamente.");
    			getStats();
    			$$invalidate(11, exitoMsg = "Exito: " + res.status + ": " + res.statusText + " Dato eliminado.");
    		});
    	}

    	async function deleteStats() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/natality-stats", { method: "DELETE" }).then(function (res) {
    			window.alert("Base de datos eliminada correctamente.");
    			getStatsNat();
    			location.reload();
    			exitoMsg("Mensaje: " + res.status + ": " + res.statusText + ".Datos eliminados correctamente");
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<NatalityTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NatalityTable", $$slots, []);

    	function input0_input_handler() {
    		newStat.country = this.value;
    		$$invalidate(0, newStat);
    	}

    	function input1_input_handler() {
    		newStat.year = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input2_input_handler() {
    		newStat.natality_totals = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input3_input_handler() {
    		newStat.natality_men = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input4_input_handler() {
    		newStat.natality_women = to_number(this.value);
    		$$invalidate(0, newStat);
    	}

    	function input0_input_handler_1() {
    		searchCountry = this.value;
    		$$invalidate(2, searchCountry);
    	}

    	function input1_input_handler_1() {
    		natality_totalsMin = this.value;
    		$$invalidate(4, natality_totalsMin);
    	}

    	function input2_input_handler_1() {
    		natality_menMin = this.value;
    		$$invalidate(6, natality_menMin);
    	}

    	function input3_input_handler_1() {
    		natality_womenMin = this.value;
    		$$invalidate(8, natality_womenMin);
    	}

    	function input4_input_handler_1() {
    		searchYear = this.value;
    		$$invalidate(3, searchYear);
    	}

    	function input5_input_handler() {
    		natality_totalsMax = this.value;
    		$$invalidate(5, natality_totalsMax);
    	}

    	function input6_input_handler() {
    		natality_menMax = this.value;
    		$$invalidate(7, natality_menMax);
    	}

    	function input7_input_handler() {
    		natality_womenMax = this.value;
    		$$invalidate(9, natality_womenMax);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		pop,
    		natalitystats,
    		newStat,
    		numeroDePagina,
    		numeroAux,
    		limit,
    		searchCountry,
    		searchYear,
    		natality_totalsMin,
    		natality_totalsMax,
    		natality_menMin,
    		natality_menMax,
    		natality_womenMin,
    		natality_womenMax,
    		errorMsg,
    		exitoMsg,
    		getStats,
    		busqueda,
    		paginacion,
    		getStatsNat,
    		loadInitialData,
    		insertStat,
    		deleteStat,
    		deleteStats
    	});

    	$$self.$inject_state = $$props => {
    		if ("natalitystats" in $$props) $$invalidate(12, natalitystats = $$props.natalitystats);
    		if ("newStat" in $$props) $$invalidate(0, newStat = $$props.newStat);
    		if ("numeroDePagina" in $$props) $$invalidate(1, numeroDePagina = $$props.numeroDePagina);
    		if ("numeroAux" in $$props) numeroAux = $$props.numeroAux;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("searchCountry" in $$props) $$invalidate(2, searchCountry = $$props.searchCountry);
    		if ("searchYear" in $$props) $$invalidate(3, searchYear = $$props.searchYear);
    		if ("natality_totalsMin" in $$props) $$invalidate(4, natality_totalsMin = $$props.natality_totalsMin);
    		if ("natality_totalsMax" in $$props) $$invalidate(5, natality_totalsMax = $$props.natality_totalsMax);
    		if ("natality_menMin" in $$props) $$invalidate(6, natality_menMin = $$props.natality_menMin);
    		if ("natality_menMax" in $$props) $$invalidate(7, natality_menMax = $$props.natality_menMax);
    		if ("natality_womenMin" in $$props) $$invalidate(8, natality_womenMin = $$props.natality_womenMin);
    		if ("natality_womenMax" in $$props) $$invalidate(9, natality_womenMax = $$props.natality_womenMax);
    		if ("errorMsg" in $$props) $$invalidate(10, errorMsg = $$props.errorMsg);
    		if ("exitoMsg" in $$props) $$invalidate(11, exitoMsg = $$props.exitoMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newStat,
    		numeroDePagina,
    		searchCountry,
    		searchYear,
    		natality_totalsMin,
    		natality_totalsMax,
    		natality_menMin,
    		natality_menMax,
    		natality_womenMin,
    		natality_womenMax,
    		errorMsg,
    		exitoMsg,
    		natalitystats,
    		busqueda,
    		paginacion,
    		loadInitialData,
    		insertStat,
    		deleteStat,
    		deleteStats,
    		numeroAux,
    		limit,
    		getStats,
    		getStatsNat,
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

    class NatalityTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NatalityTable",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\front\natalityApi\EditNatality.svelte generated by Svelte v3.22.2 */

    const { console: console_1$2 } = globals;
    const file$6 = "src\\front\\natalityApi\\EditNatality.svelte";

    // (1:0) <script>   import {          onMount      }
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
    		source: "(1:0) <script>   import {          onMount      }",
    		ctx
    	});

    	return block;
    }

    // (80:4) {:then stats}
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

    			if (dirty & /*$$scope, updatedNatalityWomen, updatedNatalityMen, updatedNatalityTotals, updatedYear, updatedCountry*/ 16446) {
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
    		source: "(80:4) {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (99:25) <Button outline  color="success" on:click={updateStats}>
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
    		source: "(99:25) <Button outline  color=\\\"success\\\" on:click={updateStats}>",
    		ctx
    	});

    	return block;
    }

    // (81:8) <Table bordered>
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
    				color: "success",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateStats*/ ctx[9]);

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
    			th2.textContent = "Natalidad Total";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Natalidad en Hombres";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Natalidad en Mujeres";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Acción";
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
    			add_location(th0, file$6, 83, 19, 2494);
    			add_location(th1, file$6, 84, 17, 2526);
    			add_location(th2, file$6, 85, 17, 2557);
    			add_location(th3, file$6, 86, 17, 2600);
    			add_location(th4, file$6, 87, 5, 2636);
    			add_location(th5, file$6, 88, 5, 2672);
    			add_location(tr0, file$6, 82, 16, 2469);
    			add_location(thead, file$6, 81, 12, 2444);
    			add_location(td0, file$6, 93, 20, 2797);
    			add_location(td1, file$6, 94, 5, 2829);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$6, 95, 24, 2877);
    			add_location(td2, file$6, 95, 20, 2873);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$6, 96, 24, 2966);
    			add_location(td3, file$6, 96, 20, 2962);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$6, 97, 9, 3037);
    			add_location(td4, file$6, 97, 5, 3033);
    			add_location(td5, file$6, 98, 20, 3121);
    			add_location(tr1, file$6, 92, 16, 2771);
    			add_location(tbody, file$6, 91, 12, 2746);
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
    			set_input_value(input0, /*updatedNatalityTotals*/ ctx[3]);
    			append_dev(tr1, t16);
    			append_dev(tr1, td3);
    			append_dev(td3, input1);
    			set_input_value(input1, /*updatedNatalityMen*/ ctx[4]);
    			append_dev(tr1, t17);
    			append_dev(tr1, td4);
    			append_dev(td4, input2);
    			set_input_value(input2, /*updatedNatalityWomen*/ ctx[5]);
    			append_dev(tr1, t18);
    			append_dev(tr1, td5);
    			mount_component(button, td5, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[13])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*updatedCountry*/ 2) set_data_dev(t12, /*updatedCountry*/ ctx[1]);
    			if (!current || dirty & /*updatedYear*/ 4) set_data_dev(t14, /*updatedYear*/ ctx[2]);

    			if (dirty & /*updatedNatalityTotals*/ 8 && to_number(input0.value) !== /*updatedNatalityTotals*/ ctx[3]) {
    				set_input_value(input0, /*updatedNatalityTotals*/ ctx[3]);
    			}

    			if (dirty & /*updatedNatalityMen*/ 16 && to_number(input1.value) !== /*updatedNatalityMen*/ ctx[4]) {
    				set_input_value(input1, /*updatedNatalityMen*/ ctx[4]);
    			}

    			if (dirty & /*updatedNatalityWomen*/ 32 && to_number(input2.value) !== /*updatedNatalityWomen*/ ctx[5]) {
    				set_input_value(input2, /*updatedNatalityWomen*/ ctx[5]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
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
    		source: "(81:8) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (78:18)           Loading data ...      {:then stats}
    function create_pending_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading data ...");
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
    		source: "(78:18)           Loading data ...      {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (104:1) {#if errorMsg}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMsg*/ ctx[6]);
    			set_style(p, "color", "red");
    			add_location(p, file$6, 104, 8, 3303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 64) set_data_dev(t, /*errorMsg*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(104:1) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#if exitoMsg}
    function create_if_block$4(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*exitoMsg*/ ctx[7]);
    			set_style(p, "color", "green");
    			add_location(p, file$6, 107, 8, 3380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*exitoMsg*/ 128) set_data_dev(t, /*exitoMsg*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(107:4) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (110:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$2(ctx) {
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(110:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let h3;
    	let t0;
    	let strong;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let promise;
    	let t5;
    	let t6;
    	let t7;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 8,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*stats*/ ctx[8], info);
    	let if_block0 = /*errorMsg*/ ctx[6] && create_if_block_1$2(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[7] && create_if_block$4(ctx);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			t0 = text("Editar el dato: ");
    			strong = element("strong");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			info.block.c();
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			create_component(button.$$.fragment);
    			add_location(strong, file$6, 76, 22, 2287);
    			add_location(h3, file$6, 76, 2, 2267);
    			add_location(main, file$6, 75, 1, 2257);
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
    			append_dev(strong, t3);
    			append_dev(main, t4);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t5;
    			append_dev(main, t5);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t6);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t7);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);
    			info.ctx = ctx;

    			if (dirty & /*stats*/ 256 && promise !== (promise = /*stats*/ ctx[8]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[8] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(main, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(main, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
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
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let stats = {};
    	let updatedCountry = "";
    	let updatedYear = 0;
    	let updatedNatalityTotals = 0;
    	let updatedNatalityMen = 0;
    	let updatedNatalityWomen = 0;
    	let errorMsg = "";
    	let exitoMsg = "";
    	onMount(getStats);

    	async function getStats() {
    		console.log("Fetching natality-stats ...");
    		const res = await fetch("/api/v2/natality-stats/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(8, stats = json);
    			$$invalidate(1, updatedCountry = params.country);
    			$$invalidate(2, updatedYear = params.year);
    			$$invalidate(3, updatedNatalityTotals = stats.natality_totals);
    			$$invalidate(4, updatedNatalityMen = stats.natality_men);
    			$$invalidate(5, updatedNatalityWomen = stats.natality_women);
    			console.log("Data loaded");
    		} else {
    			$$invalidate(6, errorMsg = "El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    			console.log("¡ERROR!");
    		}
    	}

    	async function updateStats() {
    		$$invalidate(7, exitoMsg = "");
    		$$invalidate(6, errorMsg = "");
    		console.log("Updating natality ...");

    		const res = await fetch("/api/v2/natality-stats/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country: params.country,
    				year: parseInt(params.year),
    				"natality_totals": updatedNatalityTotals,
    				"natality_men": updatedNatalityMen,
    				"natality_women": updatedNatalityWomen
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			getStats();

    			if (res.ok) {
    				$$invalidate(7, exitoMsg = res.status + ": " + res.statusText + ". El Dato ha sido actualizado con éxito");
    				console.log("OK!" + exitoMsg);
    				getStats();
    				window.alert("Dato ha sido modificado correctamente.");
    			} else if (res.status == 400) {
    				window.alert("Los datos que se insertan no son válidos");
    			} else {
    				$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}

    			
    		});
    	}

    	
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<EditNatality> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EditNatality", $$slots, []);

    	function input0_input_handler() {
    		updatedNatalityTotals = to_number(this.value);
    		$$invalidate(3, updatedNatalityTotals);
    	}

    	function input1_input_handler() {
    		updatedNatalityMen = to_number(this.value);
    		$$invalidate(4, updatedNatalityMen);
    	}

    	function input2_input_handler() {
    		updatedNatalityWomen = to_number(this.value);
    		$$invalidate(5, updatedNatalityWomen);
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
    		updatedNatalityTotals,
    		updatedNatalityMen,
    		updatedNatalityWomen,
    		errorMsg,
    		exitoMsg,
    		getStats,
    		updateStats
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("stats" in $$props) $$invalidate(8, stats = $$props.stats);
    		if ("updatedCountry" in $$props) $$invalidate(1, updatedCountry = $$props.updatedCountry);
    		if ("updatedYear" in $$props) $$invalidate(2, updatedYear = $$props.updatedYear);
    		if ("updatedNatalityTotals" in $$props) $$invalidate(3, updatedNatalityTotals = $$props.updatedNatalityTotals);
    		if ("updatedNatalityMen" in $$props) $$invalidate(4, updatedNatalityMen = $$props.updatedNatalityMen);
    		if ("updatedNatalityWomen" in $$props) $$invalidate(5, updatedNatalityWomen = $$props.updatedNatalityWomen);
    		if ("errorMsg" in $$props) $$invalidate(6, errorMsg = $$props.errorMsg);
    		if ("exitoMsg" in $$props) $$invalidate(7, exitoMsg = $$props.exitoMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		updatedCountry,
    		updatedYear,
    		updatedNatalityTotals,
    		updatedNatalityMen,
    		updatedNatalityWomen,
    		errorMsg,
    		exitoMsg,
    		stats,
    		updateStats,
    		getStats,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EditNatality extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditNatality",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get params() {
    		throw new Error("<EditNatality>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditNatality>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\natalityApi\GraphNatality.svelte generated by Svelte v3.22.2 */
    const file$7 = "src\\front\\natalityApi\\GraphNatality.svelte";

    // (82:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$3(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$7, 81, 56, 2612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(82:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p0;
    	let br;
    	let t2;
    	let i;
    	let t4;
    	let p1;
    	let t5;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p0 = element("p");
    			br = element("br");
    			t2 = space();
    			i = element("i");
    			i.textContent = "En la gráfica podemos observar la representación de la natalidad, \r\n                con número de nacimientos, en hombres y mujeres de algunos países del mundo.";
    			t4 = space();
    			p1 = element("p");
    			t5 = space();
    			create_component(button.$$.fragment);
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$7, 63, 8, 1772);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$7, 64, 8, 1847);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$7, 65, 8, 1929);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$7, 66, 8, 2013);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-1hzettu");
    			add_location(div, file$7, 72, 12, 2217);
    			add_location(br, file$7, 74, 16, 2309);
    			add_location(i, file$7, 75, 16, 2331);
    			attr_dev(p0, "class", "highcharts-description");
    			add_location(p0, file$7, 73, 12, 2257);
    			attr_dev(figure, "class", "highcharts-figure svelte-1hzettu");
    			add_location(figure, file$7, 71, 8, 2169);
    			add_location(p1, file$7, 80, 8, 2547);
    			add_location(main, file$7, 70, 4, 2153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p0);
    			append_dev(p0, br);
    			append_dev(p0, t2);
    			append_dev(p0, i);
    			append_dev(main, t4);
    			append_dev(main, p1);
    			append_dev(main, t5);
    			mount_component(button, main, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$1, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$1() {
    	let MyData = [];
    	let MyDataGraph = [];
    	const resData = await fetch("/api/v2/natality-stats");
    	MyData = await resData.json();

    	MyData.forEach(x => {
    		MyDataGraph.push({
    			name: x.country + " " + x.year,
    			data: [
    				"",
    				parseInt(x.natality_men),
    				parseInt(x.natality_women),
    				parseInt(x.natality_totals),
    				""
    			],
    			pointPlacement: "on"
    		});
    	});

    	//Las dos comillas son para que me salgan todas las barras, meto una varibale vacía para ello.
    	Highcharts.chart("container", {
    		chart: { type: "column" },
    		title: { text: "🤰NATALIDAD🤰" },
    		xAxis: {
    			categories: ["", "Natalidad en Hombres", "Natalidad en Mujeres", "Natalidad Total", ""],
    			crosshair: true
    		},
    		yAxis: {
    			min: 0,
    			title: { text: "Número de nacimientos" }
    		},
    		tooltip: {
    			headerFormat: "<span style=\"font-size:10px\">{point.key}</span><table>",
    			pointFormat: "<tr><td style=\"color:{series.color};padding:0\">{series.name}: </td>" + "<td style=\"padding:0\"><b>{point.y:.1f} mil personas</b></td></tr>",
    			footerFormat: "</table>",
    			shared: true,
    			useHTML: true
    		},
    		plotOptions: {
    			column: { pointPadding: 0.2, borderWidth: 0 }
    		},
    		series: MyDataGraph
    	});
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GraphNatality> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GraphNatality", $$slots, []);
    	$$self.$capture_state = () => ({ Button, pop, loadGraph: loadGraph$1 });
    	return [];
    }

    class GraphNatality extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphNatality",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\front\natalityApi\GraphNatalityV2.svelte generated by Svelte v3.22.2 */

    const { console: console_1$3 } = globals;
    const file$8 = "src\\front\\natalityApi\\GraphNatalityV2.svelte";

    // (76:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$4(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$8, 75, 56, 1992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(76:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let t0;
    	let main;
    	let div;
    	let t1;
    	let br;
    	let t2;
    	let p;
    	let i;
    	let t4;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			t0 = space();
    			main = element("main");
    			div = element("div");
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			p = element("p");
    			i = element("i");
    			i.textContent = "Gráfica, representada mediante Billboard.js, presenta el porcentje de natalidad total de algunos países en el año 2010.";
    			t4 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div, "id", "gaugeChart");
    			add_location(div, file$8, 72, 4, 1758);
    			add_location(br, file$8, 73, 4, 1791);
    			add_location(i, file$8, 74, 7, 1804);
    			add_location(p, file$8, 74, 4, 1801);
    			add_location(main, file$8, 69, 0, 1738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(main, t1);
    			append_dev(main, br);
    			append_dev(main, t2);
    			append_dev(main, p);
    			append_dev(p, i);
    			append_dev(main, t4);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$2() {
    	const resData = await fetch("/api/v2/natality-stats");
    	let MyData = await resData.json();

    	let datachart = MyData.filter(y => y.year == 2010).map(y => {
    		return [y.country, y["natality_totals"]];
    	});

    	var chart = bb.generate({
    		data: {
    			columns: [],
    			type: "gauge",
    			onclick(y, i) {
    				console.log("onclick", y, i);
    			}
    		},
    		gauge: {},
    		color: {
    			pattern: ["#FF0000", "#F97600", "#F6C600", "#60B044"],
    			threshold: {
    				values: [500000, 700000, 820000, 1000000]
    			}
    		},
    		size: { height: 300 },
    		bindto: "#gaugeChart"
    	});

    	/* Recursive function because settimeout doesnt work properly in loop  */
    	function loop_charting(i) {
    		setTimeout(
    			function () {
    				chart.load({ columns: [datachart[i]] });

    				if (i < datachart.length) {
    					loop_charting(i + 1);
    				}
    			},
    			1000
    		);
    	}

    	loop_charting(0);
    }

    function instance$9($$self, $$props, $$invalidate) {
    	loadGraph$2();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<GraphNatalityV2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GraphNatalityV2", $$slots, []);
    	$$self.$capture_state = () => ({ Button, pop, loadGraph: loadGraph$2 });
    	return [];
    }

    class GraphNatalityV2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphNatalityV2",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\front\povertyApi\PovertyTable.svelte generated by Svelte v3.22.2 */

    const { console: console_1$4 } = globals;
    const file$9 = "src\\front\\povertyApi\\PovertyTable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     import {    onMount   }
    function create_catch_block$2(ctx) {
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
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>     import {    onMount   }",
    		ctx
    	});

    	return block;
    }

    // (248:1) {:then stats}
    function create_then_block$2(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_7$1] },
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

    			if (dirty[0] & /*stats, newStat*/ 4097 | dirty[1] & /*$$scope*/ 256) {
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
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(248:1) {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (267:9) <Button outline color="primary" on:click={insertStat}>
    function create_default_slot_9$1(ctx) {
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
    		id: create_default_slot_9$1.name,
    		type: "slot",
    		source: "(267:9) <Button outline color=\\\"primary\\\" on:click={insertStat}>",
    		ctx
    	});

    	return block;
    }

    // (278:10) <Button outline color="danger" on:click="{deleteStat(stat.country,stat.year)}">
    function create_default_slot_8$1(ctx) {
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
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(278:10) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStat(stat.country,stat.year)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (269:4) {#each stats as stat}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*stat*/ ctx[36].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*stat*/ ctx[36].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*stat*/ ctx[36].poverty_prp + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*stat*/ ctx[36].poverty_pt + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*stat*/ ctx[36].poverty_ht + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteStat*/ ctx[17](/*stat*/ ctx[36].country, /*stat*/ ctx[36].year))) /*deleteStat*/ ctx[17](/*stat*/ ctx[36].country, /*stat*/ ctx[36].year).apply(this, arguments);
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
    			attr_dev(a, "href", a_href_value = "#/poverty-stats/" + /*stat*/ ctx[36].country + "/" + /*stat*/ ctx[36].year);
    			add_location(a, file$9, 271, 7, 8932);
    			add_location(td0, file$9, 270, 6, 8919);
    			add_location(td1, file$9, 273, 6, 9024);
    			add_location(td2, file$9, 274, 6, 9052);
    			add_location(td3, file$9, 275, 6, 9087);
    			add_location(td4, file$9, 276, 6, 9121);
    			add_location(td5, file$9, 277, 6, 9155);
    			add_location(tr, file$9, 269, 5, 8907);
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
    			if ((!current || dirty[0] & /*stats*/ 4096) && t0_value !== (t0_value = /*stat*/ ctx[36].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*stats*/ 4096 && a_href_value !== (a_href_value = "#/poverty-stats/" + /*stat*/ ctx[36].country + "/" + /*stat*/ ctx[36].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*stats*/ 4096) && t2_value !== (t2_value = /*stat*/ ctx[36].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*stats*/ 4096) && t4_value !== (t4_value = /*stat*/ ctx[36].poverty_prp + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*stats*/ 4096) && t6_value !== (t6_value = /*stat*/ ctx[36].poverty_pt + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*stats*/ 4096) && t8_value !== (t8_value = /*stat*/ ctx[36].poverty_ht + "")) set_data_dev(t8, t8_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(269:4) {#each stats as stat}",
    		ctx
    	});

    	return block;
    }

    // (249:2) <Table bordered>
    function create_default_slot_7$1(ctx) {
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
    				$$slots: { default: [create_default_slot_9$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*insertStat*/ ctx[16]);
    	let each_value = /*stats*/ ctx[12];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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

    			add_location(th0, file$9, 251, 5, 8205);
    			add_location(th1, file$9, 252, 5, 8225);
    			add_location(th2, file$9, 253, 5, 8244);
    			add_location(th3, file$9, 254, 5, 8289);
    			add_location(th4, file$9, 255, 5, 8319);
    			add_location(th5, file$9, 256, 5, 8347);
    			add_location(tr0, file$9, 250, 4, 8194);
    			add_location(thead, file$9, 249, 3, 8181);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$9, 261, 9, 8421);
    			add_location(td0, file$9, 261, 5, 8417);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$9, 262, 9, 8491);
    			add_location(td1, file$9, 262, 5, 8487);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$9, 263, 9, 8560);
    			add_location(td2, file$9, 263, 5, 8556);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$9, 264, 9, 8636);
    			add_location(td3, file$9, 264, 5, 8632);
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$9, 265, 9, 8711);
    			add_location(td4, file$9, 265, 5, 8707);
    			add_location(td5, file$9, 266, 5, 8782);
    			add_location(tr1, file$9, 260, 4, 8406);
    			add_location(tbody, file$9, 259, 3, 8393);
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
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[23]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[26]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[27])
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

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty[0] & /*deleteStat, stats*/ 135168) {
    				each_value = /*stats*/ ctx[12];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(249:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (246:15)     Loading stats...   {:then stats}
    function create_pending_block$2(ctx) {
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
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(246:15)     Loading stats...   {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (284:1) {#if errorMsg}
    function create_if_block_3$2(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[10]);
    			set_style(p, "color", "red");
    			add_location(p, file$9, 284, 2, 9342);
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
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(284:1) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (287:4) {#if exitoMsg}
    function create_if_block_2$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*exitoMsg*/ ctx[11]);
    			set_style(p, "color", "green");
    			add_location(p, file$9, 287, 8, 9423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*exitoMsg*/ 2048) set_data_dev(t, /*exitoMsg*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(287:4) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (290:1) <Button outline color="secondary" on:click="{loadInitialData}">
    function create_default_slot_6$1(ctx) {
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
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(290:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{loadInitialData}\\\">",
    		ctx
    	});

    	return block;
    }

    // (291:1) <Button outline color="danger" on:click="{deleteStats}">
    function create_default_slot_5$1(ctx) {
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
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(291:1) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteStats}\\\">",
    		ctx
    	});

    	return block;
    }

    // (292:1) {#if numeroDePagina==0}
    function create_if_block_1$3(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(292:1) {#if numeroDePagina==0}",
    		ctx
    	});

    	return block;
    }

    // (293:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">
    function create_default_slot_4$1(ctx) {
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
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(293:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (295:1) {#if numeroDePagina>0}
    function create_if_block$5(ctx) {
    	let t;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 1))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 1).apply(this, arguments);
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(295:1) {#if numeroDePagina>0}",
    		ctx
    	});

    	return block;
    }

    // (296:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 1)}">
    function create_default_slot_3$1(ctx) {
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
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(296:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 1)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (297:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">
    function create_default_slot_2$2(ctx) {
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
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(297:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (313:1) <Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht)}">
    function create_default_slot_1$2(ctx) {
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(313:1) <Button outline color=\\\"primary\\\" on:click=\\\"{busqueda (searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (315:2) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$5(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$9, 314, 54, 11486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(315:2) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    	let t8;
    	let h60;
    	let t10;
    	let tr0;
    	let td0;
    	let label0;
    	let t11;
    	let input0;
    	let t12;
    	let td1;
    	let label1;
    	let t13;
    	let input1;
    	let t14;
    	let td2;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let td3;
    	let label3;
    	let t17;
    	let input3;
    	let t18;
    	let tr1;
    	let td4;
    	let label4;
    	let t19;
    	let input4;
    	let t20;
    	let td5;
    	let label5;
    	let t21;
    	let input5;
    	let t22;
    	let td6;
    	let label6;
    	let t23;
    	let input6;
    	let t24;
    	let td7;
    	let label7;
    	let t25;
    	let input7;
    	let t26;
    	let t27;
    	let h61;
    	let t29;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*stats*/ ctx[12], info);
    	let if_block0 = /*errorMsg*/ ctx[10] && create_if_block_3$2(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[11] && create_if_block_2$2(ctx);

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[15]);

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteStats*/ ctx[18]);
    	let if_block2 = /*numeroDePagina*/ ctx[1] == 0 && create_if_block_1$3(ctx);
    	let if_block3 = /*numeroDePagina*/ ctx[1] > 0 && create_if_block$5(ctx);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", function () {
    		if (is_function(/*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9]))) /*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*minPoverty_prp*/ ctx[4], /*maxPoverty_prp*/ ctx[5], /*minPoverty_pt*/ ctx[6], /*maxPoverty_pt*/ ctx[7], /*minPoverty_ht*/ ctx[8], /*maxPoverty_ht*/ ctx[9]).apply(this, arguments);
    	});

    	const button3 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button3.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Datos de pobreza. 💶";
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			create_component(button0.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			if (if_block3) if_block3.c();
    			t8 = space();
    			h60 = element("h6");
    			h60.textContent = "Para verlo mediante páginas pulse el botón de avanzar página.";
    			t10 = space();
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			t11 = text("País: ");
    			input0 = element("input");
    			t12 = space();
    			td1 = element("td");
    			label1 = element("label");
    			t13 = text("Mínimo de personas en riesgo de pobreza: ");
    			input1 = element("input");
    			t14 = space();
    			td2 = element("td");
    			label2 = element("label");
    			t15 = text("Mínimo umbral persona: ");
    			input2 = element("input");
    			t16 = space();
    			td3 = element("td");
    			label3 = element("label");
    			t17 = text("Mínimo umbral hogar: ");
    			input3 = element("input");
    			t18 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			label4 = element("label");
    			t19 = text("Año: ");
    			input4 = element("input");
    			t20 = space();
    			td5 = element("td");
    			label5 = element("label");
    			t21 = text("Máximo de personas en riesgo de pobreza: ");
    			input5 = element("input");
    			t22 = space();
    			td6 = element("td");
    			label6 = element("label");
    			t23 = text("Máximo umbral persona: ");
    			input6 = element("input");
    			t24 = space();
    			td7 = element("td");
    			label7 = element("label");
    			t25 = text("Máximo umbral hogar: ");
    			input7 = element("input");
    			t26 = space();
    			create_component(button2.$$.fragment);
    			t27 = space();
    			h61 = element("h6");
    			h61.textContent = "Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar.";
    			t29 = space();
    			create_component(button3.$$.fragment);
    			add_location(h3, file$9, 244, 1, 8073);
    			add_location(h60, file$9, 298, 1, 10325);
    			add_location(input0, file$9, 300, 19, 10424);
    			add_location(label0, file$9, 300, 6, 10411);
    			add_location(td0, file$9, 300, 2, 10407);
    			add_location(input1, file$9, 301, 54, 10529);
    			add_location(label1, file$9, 301, 6, 10481);
    			add_location(td1, file$9, 301, 2, 10477);
    			add_location(input2, file$9, 302, 36, 10617);
    			add_location(label2, file$9, 302, 6, 10587);
    			add_location(td2, file$9, 302, 2, 10583);
    			add_location(input3, file$9, 303, 34, 10702);
    			add_location(label3, file$9, 303, 6, 10674);
    			add_location(td3, file$9, 303, 2, 10670);
    			add_location(tr0, file$9, 299, 1, 10399);
    			add_location(input4, file$9, 306, 18, 10786);
    			add_location(label4, file$9, 306, 6, 10774);
    			add_location(td4, file$9, 306, 2, 10770);
    			add_location(input5, file$9, 307, 54, 10888);
    			add_location(label5, file$9, 307, 6, 10840);
    			add_location(td5, file$9, 307, 2, 10836);
    			add_location(input6, file$9, 308, 36, 10976);
    			add_location(label6, file$9, 308, 6, 10946);
    			add_location(td6, file$9, 308, 2, 10942);
    			add_location(input7, file$9, 309, 34, 11061);
    			add_location(label7, file$9, 309, 6, 11033);
    			add_location(td7, file$9, 309, 2, 11029);
    			add_location(tr1, file$9, 305, 1, 10762);
    			add_location(h61, file$9, 313, 1, 11315);
    			add_location(main, file$9, 243, 0, 8064);
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
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t4);
    			mount_component(button0, main, null);
    			append_dev(main, t5);
    			mount_component(button1, main, null);
    			append_dev(main, t6);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t7);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t8);
    			append_dev(main, h60);
    			append_dev(main, t10);
    			append_dev(main, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(label0, t11);
    			append_dev(label0, input0);
    			set_input_value(input0, /*searchCountry*/ ctx[2]);
    			append_dev(tr0, t12);
    			append_dev(tr0, td1);
    			append_dev(td1, label1);
    			append_dev(label1, t13);
    			append_dev(label1, input1);
    			set_input_value(input1, /*minPoverty_prp*/ ctx[4]);
    			append_dev(tr0, t14);
    			append_dev(tr0, td2);
    			append_dev(td2, label2);
    			append_dev(label2, t15);
    			append_dev(label2, input2);
    			set_input_value(input2, /*minPoverty_pt*/ ctx[6]);
    			append_dev(tr0, t16);
    			append_dev(tr0, td3);
    			append_dev(td3, label3);
    			append_dev(label3, t17);
    			append_dev(label3, input3);
    			set_input_value(input3, /*minPoverty_ht*/ ctx[8]);
    			append_dev(main, t18);
    			append_dev(main, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, label4);
    			append_dev(label4, t19);
    			append_dev(label4, input4);
    			set_input_value(input4, /*searchYear*/ ctx[3]);
    			append_dev(tr1, t20);
    			append_dev(tr1, td5);
    			append_dev(td5, label5);
    			append_dev(label5, t21);
    			append_dev(label5, input5);
    			set_input_value(input5, /*maxPoverty_prp*/ ctx[5]);
    			append_dev(tr1, t22);
    			append_dev(tr1, td6);
    			append_dev(td6, label6);
    			append_dev(label6, t23);
    			append_dev(label6, input6);
    			set_input_value(input6, /*maxPoverty_pt*/ ctx[7]);
    			append_dev(tr1, t24);
    			append_dev(tr1, td7);
    			append_dev(td7, label7);
    			append_dev(label7, t25);
    			append_dev(label7, input7);
    			set_input_value(input7, /*maxPoverty_ht*/ ctx[9]);
    			append_dev(main, t26);
    			mount_component(button2, main, null);
    			append_dev(main, t27);
    			append_dev(main, h61);
    			append_dev(main, t29);
    			mount_component(button3, main, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[29]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[30]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[31]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[32]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[33]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[34]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[35])
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*stats*/ 4096 && promise !== (promise = /*stats*/ ctx[12]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[12] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					if_block0.m(main, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(main, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (/*numeroDePagina*/ ctx[1] == 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$3(ctx);
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

    			if (/*numeroDePagina*/ ctx[1] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$5(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t8);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
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

    			if (dirty[1] & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(button2);
    			destroy_component(button3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    	let exitoMsg = "";
    	onMount(getStats);

    	async function getStats() {
    		console.log("Fetching stats....");
    		const res = await fetch("/api/v2/poverty-stats?offset=" + numeroDePagina + "&limit=" + limit);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, stats = json);
    			console.log("Received " + stats.length + " stats.");
    		} else {
    			console.log("ERROR");
    		}

    		
    	}

    	

    	////////////////////////BUSQUEDA
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
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");

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
    			$$invalidate(12, stats = json);
    			console.log("Found " + stats.length + " stats");

    			//window.alert("Se han encontrado datos.");
    			$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ". Dato encontrado con éxito.");
    		} else if (res.status == 404) {
    			window.alert("No se encuentran datos.");
    			$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText + ". No se encuentran datos.");
    		} else {
    			console.log("ERROR:" + " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    		}

    		
    	}

    	//////////////////////PAGINACION
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
    					$$invalidate(12, stats = json);
    					numeroAux = num;
    				}
    			} else {
    				const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(12, stats = json);
    					numeroAux = num;
    				}
    			}
    		} else {
    			$$invalidate(1, numeroDePagina = numeroDePagina + limit);
    			const res = await fetch("/api/v2/poverty-stats?country=" + searchCountry + "&year=" + searchYear + "&poverty_prpMax=" + maxPoverty_prp + "&poverty_prpMin=" + minPoverty_prp + "&poverty_ptMax=" + maxPoverty_pt + "&poverty_ptMin=" + minPoverty_pt + "&poverty_htMax=" + maxPoverty_ht + "&poverty_htMin=" + minPoverty_ht + "&limit=" + limit + "&offset=" + numeroDePagina);

    			if (res.ok) {
    				const json = await res.json();
    				$$invalidate(12, stats = json);
    				numeroAux = num;
    			}
    		}
    	}

    	async function getStatsPov() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Fetching stats...");
    		const res = await fetch("/api/v2/poverty-stats");

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, stats = json);
    			console.log("Received " + stats.length + " stats.");
    		} else {
    			//window.alert("No se encuentra ningún dato.");
    			//errorMsg =" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
    			console.log("ERROR!");
    		}
    	}

    	async function loadInitialData() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Loading stats...");

    		const res = await fetch("/api/v2/poverty-stats/loadInitialData", { method: "GET" }).then(function (res) {
    			$$invalidate(11, exitoMsg = "");

    			if (res.ok) {
    				getStatsPov();

    				//window.alert("Datos iniciales cargados.");
    				$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ". Datos iniciales cargados.");
    			} else if (res.status == 401) {
    				window.alert("La base de datos no está vacía. Debe vaciarla para cargar los datos iniciales");
    				$$invalidate(10, errorMsg = res.status + ": " + res.statusText + ". Vacia la base de datos antes de cargar.");
    			} else {
    				$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}
    		});
    	}

    	async function insertStat() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
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

    					//window.alert("Dato insertado correctamente.");
    					$$invalidate(11, exitoMsg = res.status + ": " + res.statusText + ". Dato insertado con éxito");
    				} else if (res.status == 400) {
    					window.alert("Campo mal escrito.No puede insertarlo.");
    					$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText + "Asegurese de tener los campos completos.");
    					console.log("ERROR!");
    				} else {
    					window.alert("Dato ya creado. No puede insertarlo.");
    					$$invalidate(10, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText + "Este dato ya esta creado");
    					console.log("ERROR!");
    				}
    			});
    		}
    	}

    	async function deleteStat(country, year) {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/poverty-stats/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			window.alert("Dato eliminado correctamente.");
    			getStats();
    		});
    	}

    	async function deleteStats() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/poverty-stats", { method: "DELETE" }).then(function (res) {
    			window.alert("Base de datos eliminada correctamente.");
    			getStatsPov();
    			location.reload();
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<PovertyTable> was created with unknown prop '${key}'`);
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
    		pop,
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
    		exitoMsg,
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
    		if ("stats" in $$props) $$invalidate(12, stats = $$props.stats);
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
    		if ("exitoMsg" in $$props) $$invalidate(11, exitoMsg = $$props.exitoMsg);
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
    		exitoMsg,
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PovertyTable",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\front\povertyApi\EditPoverty.svelte generated by Svelte v3.22.2 */

    const { console: console_1$5 } = globals;
    const file$a = "src\\front\\povertyApi\\EditPoverty.svelte";

    // (1:0) <script>      import {    onMount      }
    function create_catch_block$3(ctx) {
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
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>      import {    onMount      }",
    		ctx
    	});

    	return block;
    }

    // (78:1) {:then stats}
    function create_then_block$3(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_1$3] },
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

    			if (dirty & /*$$scope, updatedPoverty_ht, updatedPoverty_pt, updatedPoverty_prp, updatedYear, updatedCountry*/ 16446) {
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
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(78:1) {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (97:9) <Button outline color="primary" on:click={updateStat}>
    function create_default_slot_2$3(ctx) {
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
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(97:9) <Button outline color=\\\"primary\\\" on:click={updateStat}>",
    		ctx
    	});

    	return block;
    }

    // (79:2) <Table bordered>
    function create_default_slot_1$3(ctx) {
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
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateStat*/ ctx[9]);

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
    			add_location(th0, file$a, 81, 5, 2600);
    			add_location(th1, file$a, 82, 5, 2620);
    			add_location(th2, file$a, 83, 5, 2639);
    			add_location(th3, file$a, 84, 5, 2684);
    			add_location(th4, file$a, 85, 5, 2714);
    			add_location(th5, file$a, 86, 5, 2742);
    			add_location(tr0, file$a, 80, 4, 2589);
    			add_location(thead, file$a, 79, 3, 2576);
    			add_location(td0, file$a, 91, 5, 2812);
    			add_location(td1, file$a, 92, 5, 2844);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$a, 93, 9, 2877);
    			add_location(td2, file$a, 93, 5, 2873);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$a, 94, 9, 2952);
    			add_location(td3, file$a, 94, 5, 2948);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$a, 95, 9, 3026);
    			add_location(td4, file$a, 95, 5, 3022);
    			add_location(td5, file$a, 96, 5, 3096);
    			add_location(tr1, file$a, 90, 4, 2801);
    			add_location(tbody, file$a, 89, 3, 2788);
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
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[13])
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

    			if (dirty & /*$$scope*/ 16384) {
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
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(79:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (76:18)     Loading stat...   {:then stats}
    function create_pending_block$3(ctx) {
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
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(76:18)     Loading stat...   {:then stats}",
    		ctx
    	});

    	return block;
    }

    // (102:4) {#if errorMsg}
    function create_if_block_1$4(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[6]);
    			set_style(p, "color", "red");
    			add_location(p, file$a, 102, 2, 3252);
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
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(102:4) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (105:1) {#if exitoMsg}
    function create_if_block$6(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*exitoMsg*/ ctx[7]);
    			set_style(p, "color", "green");
    			add_location(p, file$a, 105, 8, 3330);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*exitoMsg*/ 128) set_data_dev(t, /*exitoMsg*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(105:1) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (108:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(108:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let main;
    	let h3;
    	let t0;
    	let strong;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let promise;
    	let t5;
    	let t6;
    	let t7;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 8,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*stats*/ ctx[8], info);
    	let if_block0 = /*errorMsg*/ ctx[6] && create_if_block_1$4(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[7] && create_if_block$6(ctx);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$6] },
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
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			info.block.c();
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			create_component(button.$$.fragment);
    			add_location(strong, file$a, 74, 26, 2443);
    			add_location(h3, file$a, 74, 4, 2421);
    			add_location(main, file$a, 73, 0, 2409);
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
    			append_dev(strong, t3);
    			append_dev(main, t4);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t5;
    			append_dev(main, t5);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t6);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t7);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);
    			info.ctx = ctx;

    			if (dirty & /*stats*/ 256 && promise !== (promise = /*stats*/ ctx[8]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[8] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					if_block0.m(main, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(main, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
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
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let stats = {};
    	let updatedCountry = "";
    	let updatedYear = 0;
    	let updatedPoverty_prp = 0;
    	let updatedPoverty_pt = 0;
    	let updatedPoverty_ht = 0;
    	let errorMsg = "";
    	let exitoMsg = "";
    	onMount(getStats);

    	async function getStats() {
    		console.log("Fetching stats...");
    		const res = await fetch("/api/v2/poverty-stats/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(8, stats = json);
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
    		$$invalidate(7, exitoMsg = "");
    		$$invalidate(6, errorMsg = "");
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
    			getStats();

    			if (res.ok) {
    				$$invalidate(7, exitoMsg = res.status + ": " + res.statusText + ". El Dato ha sido actualizado con éxito");
    				console.log("OK!" + exitoMsg);
    				getStats();
    				window.alert("Dato ha sido modificado correctamente.");
    			} else if (res.status == 400) {
    				window.alert("Los datos que se insertan no son válidos");
    			} else {
    				window.alert("Los datos que se insertan no son válidos");
    				$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    				console.log("ERROR!");
    			}

    			
    		});
    	}

    	
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<EditPoverty> was created with unknown prop '${key}'`);
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
    		exitoMsg,
    		getStats,
    		updateStat
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("stats" in $$props) $$invalidate(8, stats = $$props.stats);
    		if ("updatedCountry" in $$props) $$invalidate(1, updatedCountry = $$props.updatedCountry);
    		if ("updatedYear" in $$props) $$invalidate(2, updatedYear = $$props.updatedYear);
    		if ("updatedPoverty_prp" in $$props) $$invalidate(3, updatedPoverty_prp = $$props.updatedPoverty_prp);
    		if ("updatedPoverty_pt" in $$props) $$invalidate(4, updatedPoverty_pt = $$props.updatedPoverty_pt);
    		if ("updatedPoverty_ht" in $$props) $$invalidate(5, updatedPoverty_ht = $$props.updatedPoverty_ht);
    		if ("errorMsg" in $$props) $$invalidate(6, errorMsg = $$props.errorMsg);
    		if ("exitoMsg" in $$props) $$invalidate(7, exitoMsg = $$props.exitoMsg);
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
    		exitoMsg,
    		stats,
    		updateStat,
    		getStats,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EditPoverty extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditPoverty",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get params() {
    		throw new Error("<EditPoverty>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditPoverty>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\povertyApi\GraphPoverty.svelte generated by Svelte v3.22.2 */
    const file$b = "src\\front\\povertyApi\\GraphPoverty.svelte";

    // (91:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$7(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$b, 90, 56, 2346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(91:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let i;
    	let t3;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			i = element("i");
    			i.textContent = "En la gráfica se puede observar como afecta el riesgo de pobreza en la poblacion mundial.";
    			t3 = space();
    			create_component(button.$$.fragment);
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$b, 74, 0, 1706);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$b, 75, 0, 1773);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$b, 76, 0, 1847);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$b, 77, 0, 1923);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-1u5s9ap");
    			add_location(div, file$b, 84, 4, 2093);
    			add_location(i, file$b, 86, 7, 2168);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$b, 85, 4, 2125);
    			attr_dev(figure, "class", "highcharts-figure svelte-1u5s9ap");
    			add_location(figure, file$b, 83, 0, 2053);
    			add_location(main, file$b, 82, 0, 2045);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			append_dev(p, i);
    			append_dev(main, t3);
    			mount_component(button, main, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$3, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$3() {
    	let MyData = [];
    	let MyDataGraph = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();

    	MyData.forEach(x => {
    		MyDataGraph.push({
    			name: x.country + " " + x.year,
    			data: [
    				"",
    				parseInt(x.poverty_prp),
    				parseInt(x.poverty_pt),
    				parseInt(x.poverty_ht),
    				""
    			],
    			pointPlacement: "on"
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: { text: "Riesgo de pobreza" },
    		xAxis: {
    			categories: [
    				"",
    				"Personas en riesgo de pobreza (millones)",
    				"Umbral de personas (Euros)",
    				"Umbral de pobreza (Euros)",
    				""
    			],
    			title: { text: null }
    		},
    		yAxis: {
    			min: 0,
    			title: { text: "miles", align: "high" },
    			labels: { overflow: "justify" }
    		},
    		tooltip: {}, // valueSuffix: ' miles'
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		legend: {
    			layout: "vertical",
    			align: "right",
    			verticalAlign: "top",
    			x: -40,
    			y: 80,
    			floating: false,
    			borderWidth: 1,
    			backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || "#FFFFFF",
    			shadow: true
    		},
    		credits: { enabled: false },
    		series: MyDataGraph
    	});
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GraphPoverty> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GraphPoverty", $$slots, []);
    	$$self.$capture_state = () => ({ Button, pop, loadGraph: loadGraph$3 });
    	return [];
    }

    class GraphPoverty extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphPoverty",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\front\povertyApi\GraphPoverty2.svelte generated by Svelte v3.22.2 */
    const file$c = "src\\front\\povertyApi\\GraphPoverty2.svelte";

    // (64:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$8(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$c, 63, 56, 2353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(64:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let i0;
    	let t1;
    	let t2;
    	let div;
    	let t3;
    	let p;
    	let br0;
    	let t4;
    	let i1;
    	let t6;
    	let t7;
    	let br1;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			i0 = element("i");
    			t1 = text(" Personas en riesgo pobreza en 2017");
    			t2 = space();
    			div = element("div");
    			t3 = space();
    			p = element("p");
    			br0 = element("br");
    			t4 = space();
    			i1 = element("i");
    			i1.textContent = "La gráfica representa el porcentaje de personas en riesgo de pobreza en 2017.";
    			t6 = space();
    			create_component(button.$$.fragment);
    			t7 = space();
    			br1 = element("br");
    			if (script0.src !== (script0_src_value = "https://www.amcharts.com/lib/4/core.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$c, 48, 8, 1645);
    			if (script1.src !== (script1_src_value = "https://www.amcharts.com/lib/4/charts.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$c, 49, 8, 1717);
    			if (script2.src !== (script2_src_value = "https://www.amcharts.com/lib/4/themes/kelly.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$c, 50, 8, 1791);
    			if (script3.src !== (script3_src_value = "https://www.amcharts.com/lib/4/themes/animated.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$c, 51, 8, 1871);
    			attr_dev(i0, "class", "fas fa-bicycle");
    			add_location(i0, file$c, 56, 37, 2033);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$c, 56, 4, 2000);
    			attr_dev(div, "id", "chartdiv");
    			attr_dev(div, "class", "svelte-16neavo");
    			add_location(div, file$c, 58, 4, 2112);
    			add_location(br0, file$c, 60, 8, 2187);
    			add_location(i1, file$c, 61, 8, 2201);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$c, 59, 4, 2143);
    			add_location(br1, file$c, 64, 4, 2415);
    			add_location(main, file$c, 55, 0, 1988);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(h3, i0);
    			append_dev(h3, t1);
    			append_dev(main, t2);
    			append_dev(main, div);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, br0);
    			append_dev(p, t4);
    			append_dev(p, i1);
    			append_dev(main, t6);
    			mount_component(button, main, null);
    			append_dev(main, t7);
    			append_dev(main, br1);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$4, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$4() {
    	let MyData = [];
    	let MyDataGraph = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();

    	MyData.forEach(x => {
    		if (x.year == 2017) {
    			MyDataGraph.push({
    				country: x.country,
    				poverty_prp: [parseInt(x.poverty_prp)]
    			});
    		}
    	});

    	am4core.ready(function () {
    		// Themes begin
    		am4core.useTheme(am4themes_kelly);

    		// Create chart instance
    		var chart = am4core.create("chartdiv", am4charts.PieChart);

    		// Add data
    		chart.data = MyDataGraph;

    		// Set inner radius
    		chart.innerRadius = am4core.percent(35);

    		// Add and configure Series
    		var pieSeries = chart.series.push(new am4charts.PieSeries());

    		pieSeries.dataFields.value = "poverty_prp";
    		pieSeries.dataFields.category = "country";
    		pieSeries.slices.template.stroke = am4core.color("#fff");
    		pieSeries.slices.template.strokeWidth = 2;
    		pieSeries.slices.template.strokeOpacity = 1;

    		// This creates initial animation
    		pieSeries.hiddenState.properties.opacity = 1;

    		pieSeries.hiddenState.properties.endAngle = -90;
    		pieSeries.hiddenState.properties.startAngle = -90;
    	});
    }

    function instance$d($$self, $$props, $$invalidate) {
    	loadGraph$4();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GraphPoverty2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GraphPoverty2", $$slots, []);
    	$$self.$capture_state = () => ({ Button, pop, loadGraph: loadGraph$4 });
    	return [];
    }

    class GraphPoverty2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphPoverty2",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\Home.svelte generated by Svelte v3.22.2 */
    const file$d = "src\\front\\povertyApi\\Integrations\\Home.svelte";

    // (10:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$9(ctx) {
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t = text(" Atrás");
    			attr_dev(i, "class", "fas fa-arrow-circle-left");
    			add_location(i, file$d, 9, 56, 273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(10:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let h2;
    	let strong;
    	let t1;
    	let br0;
    	let br1;
    	let t2;
    	let p0;
    	let t3;
    	let p1;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let br2;
    	let br3;
    	let t10;
    	let button4;
    	let t12;
    	let button5;
    	let t14;
    	let button6;
    	let t16;
    	let br4;
    	let br5;
    	let t17;
    	let button7;
    	let t19;
    	let button8;
    	let t21;
    	let button9;
    	let t23;
    	let br6;
    	let br7;
    	let t24;
    	let button10;
    	let t26;
    	let button11;
    	let t28;
    	let button12;
    	let t30;
    	let br8;
    	let br9;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", pop);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			strong = element("strong");
    			strong.textContent = "Integraciones con Riesgo de Pobreza";
    			t1 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t2 = space();
    			p0 = element("p");
    			create_component(button0.$$.fragment);
    			t3 = space();
    			p1 = element("p");
    			button1 = element("button");
    			button1.textContent = "API Grupo 04";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "API Grupo 05";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "API Grupo 06";
    			t9 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t10 = space();
    			button4 = element("button");
    			button4.textContent = "API Grupo 07";
    			t12 = space();
    			button5 = element("button");
    			button5.textContent = "API Grupo 08";
    			t14 = space();
    			button6 = element("button");
    			button6.textContent = "API Grupo 09";
    			t16 = space();
    			br4 = element("br");
    			br5 = element("br");
    			t17 = space();
    			button7 = element("button");
    			button7.textContent = "API Grupo 10";
    			t19 = space();
    			button8 = element("button");
    			button8.textContent = "API Grupo 21";
    			t21 = space();
    			button9 = element("button");
    			button9.textContent = "API Grupo 22";
    			t23 = space();
    			br6 = element("br");
    			br7 = element("br");
    			t24 = space();
    			button10 = element("button");
    			button10.textContent = "API Grupo 28";
    			t26 = space();
    			button11 = element("button");
    			button11.textContent = "API Externo 01";
    			t28 = space();
    			button12 = element("button");
    			button12.textContent = "API Externo 02";
    			t30 = space();
    			br8 = element("br");
    			br9 = element("br");
    			add_location(strong, file$d, 6, 4, 142);
    			add_location(h2, file$d, 6, 0, 138);
    			add_location(br0, file$d, 7, 0, 202);
    			add_location(br1, file$d, 7, 4, 206);
    			add_location(p0, file$d, 8, 0, 212);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			attr_dev(button1, "onclick", "window.location.href='#/poverty-stats/sos1920-04'");
    			set_style(button1, "margin-left", "10%");
    			set_style(button1, "width", "20%");
    			add_location(button1, file$d, 12, 4, 346);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-primary");
    			attr_dev(button2, "onclick", "window.location.href='#/poverty-stats/sos1920-05'");
    			set_style(button2, "margin-left", "10%");
    			set_style(button2, "width", "20%");
    			add_location(button2, file$d, 13, 4, 516);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-primary");
    			attr_dev(button3, "onclick", "window.location.href='#/poverty-stats/sos1920-06'");
    			set_style(button3, "margin-left", "10%");
    			set_style(button3, "width", "20%");
    			add_location(button3, file$d, 14, 4, 686);
    			add_location(br2, file$d, 15, 4, 856);
    			add_location(br3, file$d, 15, 8, 860);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary");
    			attr_dev(button4, "onclick", "window.location.href='#/poverty-stats/sos1920-07'");
    			set_style(button4, "margin-left", "10%");
    			set_style(button4, "width", "20%");
    			add_location(button4, file$d, 16, 4, 870);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-primary");
    			attr_dev(button5, "onclick", "window.location.href='#/poverty-stats/sos1920-08'");
    			set_style(button5, "margin-left", "10%");
    			set_style(button5, "width", "20%");
    			add_location(button5, file$d, 17, 4, 1040);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "btn btn-primary");
    			attr_dev(button6, "onclick", "window.location.href='#/poverty-stats/sos1920-09'");
    			set_style(button6, "margin-left", "10%");
    			set_style(button6, "width", "20%");
    			add_location(button6, file$d, 18, 4, 1210);
    			add_location(br4, file$d, 19, 4, 1380);
    			add_location(br5, file$d, 19, 8, 1384);
    			attr_dev(button7, "type", "button");
    			attr_dev(button7, "class", "btn btn-primary");
    			attr_dev(button7, "onclick", "window.location.href='#/poverty-stats/sos1920-10'");
    			set_style(button7, "margin-left", "10%");
    			set_style(button7, "width", "20%");
    			add_location(button7, file$d, 20, 4, 1394);
    			attr_dev(button8, "type", "button");
    			attr_dev(button8, "class", "btn btn-primary");
    			attr_dev(button8, "onclick", "window.location.href='#/poverty-stats/sos1920-21'");
    			set_style(button8, "margin-left", "10%");
    			set_style(button8, "width", "20%");
    			add_location(button8, file$d, 21, 4, 1564);
    			attr_dev(button9, "type", "button");
    			attr_dev(button9, "class", "btn btn-primary");
    			attr_dev(button9, "onclick", "window.location.href='#/poverty-stats/sos1920-22'");
    			set_style(button9, "margin-left", "10%");
    			set_style(button9, "width", "20%");
    			add_location(button9, file$d, 22, 4, 1734);
    			add_location(br6, file$d, 23, 4, 1904);
    			add_location(br7, file$d, 23, 8, 1908);
    			attr_dev(button10, "type", "button");
    			attr_dev(button10, "class", "btn btn-primary");
    			attr_dev(button10, "onclick", "window.location.href='#/poverty-stats/sos1920-28'");
    			set_style(button10, "margin-left", "10%");
    			set_style(button10, "width", "20%");
    			add_location(button10, file$d, 24, 4, 1918);
    			attr_dev(button11, "type", "button");
    			attr_dev(button11, "class", "btn btn-danger");
    			attr_dev(button11, "onclick", "window.location.href='#/poverty-stats/ex-01'");
    			set_style(button11, "margin-left", "10%");
    			set_style(button11, "width", "20%");
    			add_location(button11, file$d, 25, 4, 2088);
    			attr_dev(button12, "type", "button");
    			attr_dev(button12, "class", "btn btn-danger");
    			attr_dev(button12, "onclick", "window.location.href='#/poverty-stats/ex-02'");
    			set_style(button12, "margin-left", "10%");
    			set_style(button12, "width", "20%");
    			add_location(button12, file$d, 26, 4, 2254);
    			add_location(br8, file$d, 27, 4, 2420);
    			add_location(br9, file$d, 27, 8, 2424);
    			add_location(p1, file$d, 11, 0, 337);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, strong);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p0, anchor);
    			mount_component(button0, p0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, button1);
    			append_dev(p1, t5);
    			append_dev(p1, button2);
    			append_dev(p1, t7);
    			append_dev(p1, button3);
    			append_dev(p1, t9);
    			append_dev(p1, br2);
    			append_dev(p1, br3);
    			append_dev(p1, t10);
    			append_dev(p1, button4);
    			append_dev(p1, t12);
    			append_dev(p1, button5);
    			append_dev(p1, t14);
    			append_dev(p1, button6);
    			append_dev(p1, t16);
    			append_dev(p1, br4);
    			append_dev(p1, br5);
    			append_dev(p1, t17);
    			append_dev(p1, button7);
    			append_dev(p1, t19);
    			append_dev(p1, button8);
    			append_dev(p1, t21);
    			append_dev(p1, button9);
    			append_dev(p1, t23);
    			append_dev(p1, br6);
    			append_dev(p1, br7);
    			append_dev(p1, t24);
    			append_dev(p1, button10);
    			append_dev(p1, t26);
    			append_dev(p1, button11);
    			append_dev(p1, t28);
    			append_dev(p1, button12);
    			append_dev(p1, t30);
    			append_dev(p1, br8);
    			append_dev(p1, br9);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p0);
    			destroy_component(button0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button });
    	return [];
    }

    class Home$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-04.svelte generated by Svelte v3.22.2 */

    const { console: console_1$6 } = globals;
    const file$e = "src\\front\\povertyApi\\Integrations\\sos1920-04.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$a(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Análisis del tráfico en España del grupo 04";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Análisis del tráfico en España y riesgo de pobreza en Europa en el año 2015.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$e, 77, 2, 1800);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$e, 78, 2, 1869);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$e, 79, 2, 1945);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$e, 80, 2, 2023);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$e, 83, 1, 2149);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$e, 86, 2, 2362);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$e, 87, 2, 2392);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$e, 85, 1, 2324);
    			add_location(main, file$e, 82, 0, 2140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$5, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$5() {
    	let MyData = [];
    	let API_04 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-04.herokuapp.com/api/v1/traffic_accidents");

    	if (resData2.ok) {
    		console.log("Ok, api 04 loaded");
    		const json = await resData2.json();
    		API_04 = json;
    		console.log(API_04);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2017 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country + " " + x.year,
    				data: [0, 0, parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_04.forEach(x => {
    		if (x.year == 2016 && (x.province == "Pontevedra" || x.province == "Cadiz")) {
    			aux = {
    				name: x.province + " " + x.year,
    				data: [
    					parseInt(x.accidentWithVictims),
    					parseInt(x.notHospitalizedWounded),
    					0,
    					0
    				]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Análisis del tráfico en España y riesgo de pobreza en Europa en el año 2015"
    		},
    		xAxis: {
    			categories: [
    				"Accidentes con víctimas",
    				"No hospitalizados",
    				"Umbral de persona",
    				"Umbral de hogar"
    			],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<Sos1920_04> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_04", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$5 });
    	return [];
    }

    class Sos1920_04 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_04",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-05.svelte generated by Svelte v3.22.2 */

    const { console: console_1$7 } = globals;
    const file$f = "src\\front\\povertyApi\\Integrations\\sos1920-05.svelte";

    // (77:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$b(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(77:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con Esperanza de vida del grupo 05";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Esperanza de vida y Riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$f, 69, 2, 1664);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$f, 70, 2, 1733);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$f, 71, 2, 1809);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$f, 72, 2, 1887);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$f, 75, 1, 2013);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$f, 78, 2, 2206);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$f, 79, 2, 2236);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$f, 77, 1, 2168);
    			add_location(main, file$f, 74, 0, 2004);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$6, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$6() {
    	let MyData = [];
    	let API_05 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("http://sos1920-05.herokuapp.com/api/v1/life_expectancies");

    	if (resData2.ok) {
    		console.log("Ok, api 05 loaded");
    		const json = await resData2.json();
    		API_05 = json;
    		console.log(API_05);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		API_05.forEach(y => {
    			if (x.year == 2010 && (x.country == "france" && y.country == "france" || x.country == "italy" && y.country == "italy" || x.country == "unitedKingdom" && y.country == "uk")) {
    				aux = {
    					name: y.country,
    					data: [
    						y.women_life_expectancy,
    						y.men_life_expectancy,
    						parseInt(x.poverty_pt),
    						parseInt(x.poverty_ht)
    					]
    				};

    				valores.push(aux);
    			}
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Esperanza de vida y Riesgo de pobreza"
    		},
    		xAxis: {
    			categories: [
    				"Esperanza de vida en Mujeres",
    				"Esperanza de vida en Hombres",
    				"Umbral de persona",
    				"Umbral de hogar"
    			],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Sos1920_05> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_05", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$6 });
    	return [];
    }

    class Sos1920_05 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_05",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-06.svelte generated by Svelte v3.22.2 */

    const { console: console_1$8 } = globals;
    const file$g = "src\\front\\povertyApi\\Integrations\\sos1920-06.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$c(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Número de accidentes en los caminos de la ciudad del grupo 06";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Número de accidentes en los caminos de la ciudad y riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$g, 77, 2, 1721);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$g, 78, 2, 1790);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$g, 79, 2, 1866);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$g, 80, 2, 1944);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$g, 83, 1, 2070);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$g, 86, 2, 2301);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$g, 87, 2, 2331);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$g, 85, 1, 2263);
    			add_location(main, file$g, 82, 0, 2061);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$7, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$7() {
    	let MyData = [];
    	let API_06 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-06.herokuapp.com/api/v2/not-hospitalized-stats");

    	if (resData2.ok) {
    		console.log("Ok, api 06 loaded");
    		const json = await resData2.json();
    		API_06 = json;
    		console.log(API_06);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2010 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_06.forEach(x => {
    		if (x.year == 2014 && (x.province == "Madrid" || x.province == "Sevilla")) {
    			aux = {
    				name: x.province,
    				data: [parseInt(x.interurban), parseInt(x.urban), 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Número de accidentes en los caminos de la ciudad y riesgo de pobreza"
    		},
    		xAxis: {
    			categories: ["Interurbano", "Urbano", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$h($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<Sos1920_06> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_06", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$7 });
    	return [];
    }

    class Sos1920_06 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_06",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-07.svelte generated by Svelte v3.22.2 */

    const { console: console_1$9 } = globals;
    const file$h = "src\\front\\povertyApi\\Integrations\\sos1920-07.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$d(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$d.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$d] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Importaciones del grupo 07";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Importaciones y riesgo de pobreza en el año 2010.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$h, 77, 2, 1700);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$h, 78, 2, 1769);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$h, 79, 2, 1845);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$h, 80, 2, 1923);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$h, 83, 1, 2049);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$h, 86, 2, 2245);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$h, 87, 2, 2275);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$h, 85, 1, 2207);
    			add_location(main, file$h, 82, 0, 2040);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$8, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$8() {
    	let MyData = [];
    	let API_07 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-07.herokuapp.com/api/v2/imports");

    	if (resData2.ok) {
    		console.log("Ok, api 07 loaded");
    		const json = await resData2.json();
    		API_07 = json;
    		console.log(API_07);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2010 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_07.forEach(x => {
    		if (x.year == 2010 && (x.country == "south-korea" || x.country == "china")) {
    			aux = {
    				name: x.country,
    				data: [parseInt(x.gdawaste / 100), parseInt(x.gdaethylalcohol / 100), 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Importaciones y riesgo de pobreza en el año 2010"
    		},
    		xAxis: {
    			categories: ["Residuos", "Alcohol", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$i($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$9.warn(`<Sos1920_07> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_07", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$8 });
    	return [];
    }

    class Sos1920_07 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_07",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-08.svelte generated by Svelte v3.22.2 */

    const { console: console_1$a } = globals;
    const file$i = "src\\front\\povertyApi\\Integrations\\sos1920-08.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$e(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$e.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$e] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Electricidad Producida del grupo 08";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Electricidad Producida y Riesgo de pobreza en el año 2015 y 2018.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$i, 77, 2, 1721);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$i, 78, 2, 1790);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$i, 79, 2, 1866);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$i, 80, 2, 1944);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$i, 83, 1, 2070);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$i, 86, 2, 2275);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$i, 87, 2, 2305);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$i, 85, 1, 2237);
    			add_location(main, file$i, 82, 0, 2061);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$9, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$9() {
    	let MyData = [];
    	let API_08 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-08.herokuapp.com/api/v2/electricity-produced-stats");

    	if (resData2.ok) {
    		console.log("Ok, api 08 loaded");
    		const json = await resData2.json();
    		API_08 = json;
    		console.log(API_08);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2015 && (x.country == "italy" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_08.forEach(x => {
    		if (x.year == 2018 && (x.state == "Hawaii" || x.state == "California")) {
    			aux = {
    				name: x.state,
    				data: [parseInt(x.solar / 1000), parseInt(x.coal / 1000), 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Electricidad Producida y Riesgo de pobreza en el año 2015 y 2018"
    		},
    		xAxis: {
    			categories: ["Energia solar", "Carbon", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$j($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<Sos1920_08> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_08", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$9 });
    	return [];
    }

    class Sos1920_08 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_08",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-09.svelte generated by Svelte v3.22.2 */

    const { console: console_1$b } = globals;
    const file$j = "src\\front\\povertyApi\\Integrations\\sos1920-09.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$f(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$f.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$f] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Energías primarias del grupo 09";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Energías primarias y Riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$j, 77, 2, 1735);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$j, 78, 2, 1804);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$j, 79, 2, 1880);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$j, 80, 2, 1958);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$j, 83, 1, 2084);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$j, 86, 2, 2285);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$j, 87, 2, 2315);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$j, 85, 1, 2247);
    			add_location(main, file$j, 82, 0, 2075);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$a, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$a() {
    	let MyData = [];
    	let API_09 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-09.herokuapp.com/api/v3/oil-coal-nuclear-energy-consumption-stats");

    	if (resData2.ok) {
    		console.log("Ok, api 09 loaded");
    		const json = await resData2.json();
    		API_09 = json;
    		console.log(API_09);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2017 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt / 100), parseInt(x.poverty_ht / 100)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_09.forEach(x => {
    		if (x.year == 2017 && (x.country == "Belgium" || x.country == "China")) {
    			aux = {
    				name: x.country,
    				data: [x["oil-consumption"], x["coal-consumption"], 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Energías primarias y Riesgo de pobreza"
    		},
    		xAxis: {
    			categories: [
    				"Consumo de Gasolina",
    				"Consumo de Carbón",
    				"Umbral de persona",
    				"Umbral de hogar"
    			],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$k($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$b.warn(`<Sos1920_09> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_09", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$a });
    	return [];
    }

    class Sos1920_09 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_09",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-10.svelte generated by Svelte v3.22.2 */

    const { console: console_1$c } = globals;
    const file$k = "src\\front\\povertyApi\\Integrations\\sos1920-10.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$g(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$g.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$g] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Datos de Suicidios del grupo 10";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Datos de Suicidios y Riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$k, 77, 2, 1677);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$k, 78, 2, 1746);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$k, 79, 2, 1822);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$k, 80, 2, 1900);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$k, 83, 1, 2026);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$k, 86, 2, 2227);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$k, 87, 2, 2257);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$k, 85, 1, 2189);
    			add_location(main, file$k, 82, 0, 2017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$b, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$b() {
    	let MyData = [];
    	let API_10 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("http://sos1920-10.herokuapp.com/api/v2/global-suicides");

    	if (resData2.ok) {
    		console.log("Ok, api 10 loaded");
    		const json = await resData2.json();
    		API_10 = json;
    		console.log(API_10);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2017 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt / 1000), parseInt(x.poverty_ht / 1000)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_10.forEach(x => {
    		if (x.year == 2008 && (x.country == "Brazil" || x.country == "Cuba")) {
    			aux = {
    				name: x.country,
    				data: [parseInt(x.men), parseInt(x.women), 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Datos de Suicidios y Riesgo de pobreza"
    		},
    		xAxis: {
    			categories: ["Hombres", "Mujeres", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$l($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$c.warn(`<Sos1920_10> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_10", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$b });
    	return [];
    }

    class Sos1920_10 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_10",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-21.svelte generated by Svelte v3.22.2 */

    const { console: console_1$d } = globals;
    const file$l = "src\\front\\povertyApi\\Integrations\\sos1920-21.svelte";

    // (85:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$h(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$h.name,
    		type: "slot",
    		source: "(85:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$h] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Heridos de tráfico del grupo 21";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Heridos de tráfico y Riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$l, 77, 2, 1683);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$l, 78, 2, 1752);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$l, 79, 2, 1828);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$l, 80, 2, 1906);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$l, 83, 1, 2032);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$l, 86, 2, 2233);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$l, 87, 2, 2263);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$l, 85, 1, 2195);
    			add_location(main, file$l, 82, 0, 2023);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$c, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$c() {
    	let MyData = [];
    	let API_21 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://sos1920-21.herokuapp.com/api/v2/traffic-injuries");

    	if (resData2.ok) {
    		console.log("Ok, api 21 loaded");
    		const json = await resData2.json();
    		API_21 = json;
    		console.log(API_21);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		if (x.year == 2017 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
    			};

    			valores.push(aux);
    		}
    	});

    	API_21.forEach(x => {
    		if (x.year == 2017 && (x.auto_com == "aragon" || x.auto_com == "asturias")) {
    			aux = {
    				name: x.auto_com,
    				data: [parseInt(x.accident), parseInt(x.dead), 0, 0]
    			};

    			valores.push(aux);
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Heridos de tráfico y Riesgo de pobreza"
    		},
    		xAxis: {
    			categories: ["Accidentes", "Muertos", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$m($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$d.warn(`<Sos1920_21> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_21", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$c });
    	return [];
    }

    class Sos1920_21 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_21",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-22.svelte generated by Svelte v3.22.2 */

    const { console: console_1$e } = globals;
    const file$m = "src\\front\\povertyApi\\Integrations\\sos1920-22.svelte";

    // (77:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$i(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$i.name,
    		type: "slot",
    		source: "(77:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$i] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con Natación del grupo 22";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Natación y riesgo de pobreza en Italia, Francia y Reino Unido.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$m, 69, 2, 1628);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$m, 70, 2, 1697);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$m, 71, 2, 1773);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$m, 72, 2, 1851);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$m, 75, 1, 1977);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$m, 78, 2, 2161);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$m, 79, 2, 2191);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$m, 77, 1, 2123);
    			add_location(main, file$m, 74, 0, 1968);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$d, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$d() {
    	let MyData = [];
    	let API_22 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("/api/v1/swim-stats");

    	if (resData2.ok) {
    		console.log("Ok, api 22 loaded");
    		const json = await resData2.json();
    		API_22 = json;
    		console.log(API_22);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		API_22.forEach(y => {
    			if (x.year == 2010 && (x.country == "france" && y.country == "france" || x.country == "italy" && y.country == "italy" || x.country == "unitedKingdom" && y.country == "united kingdom")) {
    				aux = {
    					name: y.country,
    					data: [
    						parseInt(y.yearofbirth),
    						parseInt(y.position),
    						parseInt(x.poverty_pt),
    						parseInt(x.poverty_ht)
    					]
    				};

    				valores.push(aux);
    			}
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Natación y riesgo de pobreza en Italia, Francia y Reino Unido"
    		},
    		xAxis: {
    			categories: ["Años Nacimiento", "Posición", "Umbral de persona", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$n($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$e.warn(`<Sos1920_22> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_22", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$d });
    	return [];
    }

    class Sos1920_22 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_22",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\sos1920-28.svelte generated by Svelte v3.22.2 */

    const { console: console_1$f } = globals;
    const file$n = "src\\front\\povertyApi\\Integrations\\sos1920-28.svelte";

    // (77:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$j(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$j.name,
    		type: "slot",
    		source: "(77:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$j] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con Administrador de datos de PPA del grupo 28";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Administrador de datos de PPA y riesgo de pobreza en el año 2017.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$n, 69, 2, 1689);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$n, 70, 2, 1758);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$n, 71, 2, 1834);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$n, 72, 2, 1912);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$n, 75, 1, 2038);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$n, 78, 2, 2243);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$n, 79, 2, 2273);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$n, 77, 1, 2205);
    			add_location(main, file$n, 74, 0, 2029);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$e, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$e() {
    	let MyData = [];
    	let API_28 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("/api/v1/ppas");

    	if (resData2.ok) {
    		console.log("Ok, api 28 loaded");
    		const json = await resData2.json();
    		API_28 = json;
    		console.log(API_28);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		API_28.forEach(y => {
    			if (x.year == 2017 && (x.country == "france" && y.country == "France" || x.country == "germany" && y.country == "Germany" || x.country == "unitedKingdom" && y.country == "United Kingdom" || x.country == "spain" && y.country == "Spain")) {
    				aux = {
    					name: y.country,
    					data: [
    						parseInt(y.aas_net),
    						parseInt(y.ppa_per_capita),
    						parseInt(x.poverty_pt),
    						parseInt(x.poverty_ht)
    					]
    				};

    				valores.push(aux);
    			}
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Administrador de datos de PPA y riesgo de pobreza en el año 2017"
    		},
    		xAxis: {
    			categories: [
    				"Salario neto",
    				"Paridad de poder Adquisitivo",
    				"Umbral de persona",
    				"Umbral de hogar"
    			],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$o($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$f.warn(`<Sos1920_28> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sos1920_28", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$e });
    	return [];
    }

    class Sos1920_28 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sos1920_28",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\ex-01.svelte generated by Svelte v3.22.2 */

    const { console: console_1$g } = globals;
    const file$o = "src\\front\\povertyApi\\Integrations\\ex-01.svelte";

    // (76:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$k(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$k.name,
    		type: "slot",
    		source: "(76:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$k] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Externa 01";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Casos de infectados de coronavirus y Riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$o, 68, 2, 1617);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$o, 69, 2, 1686);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$o, 70, 2, 1762);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$o, 71, 2, 1840);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$o, 74, 1, 1966);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$o, 77, 2, 2146);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$o, 78, 2, 2176);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$o, 76, 1, 2108);
    			add_location(main, file$o, 73, 0, 1957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$f, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$f() {
    	let MyData = [];
    	let API_ex01 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://disease.sh/v2/countries?yesterday=false&sort=deaths&allowNull=true");

    	if (resData2.ok) {
    		console.log("Ok, api ex01 loaded");
    		const json = await resData2.json();
    		API_ex01 = json;
    		console.log(API_ex01);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		API_ex01.forEach(y => {
    			if (x.year == 2017 && (x.country == "spain" && y.country == "Spain" || x.country == "france" && y.country == "France" || x.country == "italy" && y.country == "Italy" || x.country == "germany" && y.country == "Germany")) {
    				aux = {
    					name: y.country,
    					data: [parseInt(y.cases), parseInt(x.poverty_prp)]
    				};

    				valores.push(aux);
    			}
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: {
    			text: "Importaciones y riesgo de pobreza en el año 2010"
    		},
    		xAxis: {
    			categories: ["Casos", "Umbral de hogar"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$p($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$g.warn(`<Ex_01> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Ex_01", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$f });
    	return [];
    }

    class Ex_01 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ex_01",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\front\povertyApi\Integrations\ex-02.svelte generated by Svelte v3.22.2 */

    const { console: console_1$h } = globals;
    const file$p = "src\\front\\povertyApi\\Integrations\\ex-02.svelte";

    // (76:1) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$l(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
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
    		id: create_default_slot$l.name,
    		type: "slot",
    		source: "(76:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let h3;
    	let t2;
    	let t3;
    	let figure;
    	let div;
    	let t4;
    	let p;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$l] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Integración con la API Externa 02";
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			figure = element("figure");
    			div = element("div");
    			t4 = space();
    			p = element("p");
    			p.textContent = "Poblacion y riesgo de pobreza.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$p, 68, 2, 1575);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$p, 69, 2, 1644);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$p, 70, 2, 1720);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$p, 71, 2, 1798);
    			set_style(h3, "text-align", "center");
    			add_location(h3, file$p, 74, 1, 1924);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-mzn03e");
    			add_location(div, file$p, 77, 2, 2104);
    			set_style(p, "text-align", "center");
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$p, 78, 2, 2134);
    			attr_dev(figure, "class", "highcharts-figure svelte-mzn03e");
    			add_location(figure, file$p, 76, 1, 2066);
    			add_location(main, file$p, 73, 0, 1915);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			mount_component(button, main, null);
    			append_dev(main, t3);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t4);
    			append_dev(figure, p);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$g, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
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
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$g() {
    	let MyData = [];
    	let API_ex02 = [];
    	const resData = await fetch("/api/v2/poverty-stats");
    	MyData = await resData.json();
    	const resData2 = await fetch("https://restcountries.eu/rest/v2/all");

    	if (resData2.ok) {
    		console.log("Ok, api ex02 loaded");
    		const json = await resData2.json();
    		API_ex02 = json;
    		console.log(API_ex02);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];
    	let valores = [];

    	MyData.forEach(x => {
    		API_ex02.forEach(y => {
    			if (x.year == 2010 && (x.country == "spain" && y.name == "Spain" || x.country == "france" && y.name == "France" || x.country == "italy" && y.name == "Italy" || x.country == "germany" && y.name == "Germany")) {
    				aux = {
    					name: y.name,
    					data: [parseInt(y.population / 1000), parseInt(x.poverty_prp)]
    				};

    				valores.push(aux);
    			}
    		});
    	});

    	Highcharts.chart("container", {
    		chart: { type: "bar" },
    		title: { text: "Poblacion y Riesgo de pobreza" },
    		xAxis: {
    			categories: ["Poblacion", "Personas en riesco de pobreza"],
    			title: { text: null }
    		},
    		yAxis: { min: 0, labels: { overflow: "justify" } },
    		plotOptions: { bar: { dataLabels: { enabled: true } } },
    		credits: { enabled: false },
    		series: valores
    	});
    }

    function instance$q($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$h.warn(`<Ex_02> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Ex_02", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$g });
    	return [];
    }

    class Ex_02 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ex_02",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\front\emigrantApi\EmigrantTable.svelte generated by Svelte v3.22.2 */

    const { console: console_1$i } = globals;
    const file$q = "src\\front\\emigrantApi\\EmigrantTable.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>   import {    onMount   }
    function create_catch_block$4(ctx) {
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
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(1:0) <script>   import {    onMount   }",
    		ctx
    	});

    	return block;
    }

    // (245:1) {:then emistats}
    function create_then_block$4(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_6$2] },
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

    			if (dirty[0] & /*emistats, newEmiStat*/ 4097 | dirty[1] & /*$$scope*/ 256) {
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
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(245:1) {:then emistats}",
    		ctx
    	});

    	return block;
    }

    // (264:9) <Button outline color="primary" on:click={insertEmiStat}>
    function create_default_slot_8$2(ctx) {
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
    		id: create_default_slot_8$2.name,
    		type: "slot",
    		source: "(264:9) <Button outline color=\\\"primary\\\" on:click={insertEmiStat}>",
    		ctx
    	});

    	return block;
    }

    // (273:10) <Button outline color="danger" on:click="{deleteEmiStat(emistat.country,emistat.year)}">
    function create_default_slot_7$2(ctx) {
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
    		id: create_default_slot_7$2.name,
    		type: "slot",
    		source: "(273:10) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteEmiStat(emistat.country,emistat.year)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (266:4) {#each emistats as emistat}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*emistat*/ ctx[36].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*emistat*/ ctx[36].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*emistat*/ ctx[36].em_man + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*emistat*/ ctx[36].em_woman + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*emistat*/ ctx[36].em_totals + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_7$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteEmiStat*/ ctx[17](/*emistat*/ ctx[36].country, /*emistat*/ ctx[36].year))) /*deleteEmiStat*/ ctx[17](/*emistat*/ ctx[36].country, /*emistat*/ ctx[36].year).apply(this, arguments);
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
    			attr_dev(a, "href", a_href_value = "#/emigrants-stats/" + /*emistat*/ ctx[36].country + "/" + /*emistat*/ ctx[36].year);
    			add_location(a, file$q, 267, 10, 9581);
    			add_location(td0, file$q, 267, 6, 9577);
    			add_location(td1, file$q, 268, 6, 9676);
    			add_location(td2, file$q, 269, 6, 9707);
    			add_location(td3, file$q, 270, 6, 9740);
    			add_location(td4, file$q, 271, 6, 9775);
    			add_location(td5, file$q, 272, 6, 9811);
    			add_location(tr, file$q, 266, 5, 9565);
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
    			if ((!current || dirty[0] & /*emistats*/ 4096) && t0_value !== (t0_value = /*emistat*/ ctx[36].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*emistats*/ 4096 && a_href_value !== (a_href_value = "#/emigrants-stats/" + /*emistat*/ ctx[36].country + "/" + /*emistat*/ ctx[36].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*emistats*/ 4096) && t2_value !== (t2_value = /*emistat*/ ctx[36].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*emistats*/ 4096) && t4_value !== (t4_value = /*emistat*/ ctx[36].em_man + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*emistats*/ 4096) && t6_value !== (t6_value = /*emistat*/ ctx[36].em_woman + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*emistats*/ 4096) && t8_value !== (t8_value = /*emistat*/ ctx[36].em_totals + "")) set_data_dev(t8, t8_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(266:4) {#each emistats as emistat}",
    		ctx
    	});

    	return block;
    }

    // (246:2) <Table bordered>
    function create_default_slot_6$2(ctx) {
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
    				$$slots: { default: [create_default_slot_8$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*insertEmiStat*/ ctx[16]);
    	let each_value = /*emistats*/ ctx[12];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			th2.textContent = "Emigrantes (Hombres)";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Emigrantes (Mujeres)";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Emigrantes (Totales)";
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

    			add_location(th0, file$q, 248, 5, 8842);
    			add_location(th1, file$q, 249, 5, 8862);
    			add_location(th2, file$q, 250, 5, 8881);
    			add_location(th3, file$q, 251, 5, 8917);
    			add_location(th4, file$q, 252, 5, 8953);
    			add_location(th5, file$q, 253, 5, 8989);
    			add_location(tr0, file$q, 247, 4, 8831);
    			add_location(thead, file$q, 246, 3, 8818);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$q, 258, 9, 9063);
    			add_location(td0, file$q, 258, 5, 9059);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$q, 259, 9, 9136);
    			add_location(td1, file$q, 259, 5, 9132);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$q, 260, 9, 9208);
    			add_location(td2, file$q, 260, 5, 9204);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$q, 261, 9, 9282);
    			add_location(td3, file$q, 261, 5, 9278);
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$q, 262, 9, 9358);
    			add_location(td4, file$q, 262, 5, 9354);
    			add_location(td5, file$q, 263, 5, 9431);
    			add_location(tr1, file$q, 257, 4, 9048);
    			add_location(tbody, file$q, 256, 3, 9035);
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
    			set_input_value(input0, /*newEmiStat*/ ctx[0].country);
    			append_dev(tr1, t12);
    			append_dev(tr1, td1);
    			append_dev(td1, input1);
    			set_input_value(input1, /*newEmiStat*/ ctx[0].year);
    			append_dev(tr1, t13);
    			append_dev(tr1, td2);
    			append_dev(td2, input2);
    			set_input_value(input2, /*newEmiStat*/ ctx[0].em_man);
    			append_dev(tr1, t14);
    			append_dev(tr1, td3);
    			append_dev(td3, input3);
    			set_input_value(input3, /*newEmiStat*/ ctx[0].em_woman);
    			append_dev(tr1, t15);
    			append_dev(tr1, td4);
    			append_dev(td4, input4);
    			set_input_value(input4, /*newEmiStat*/ ctx[0].em_totals);
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
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[23]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[26]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[27])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newEmiStat*/ 1 && input0.value !== /*newEmiStat*/ ctx[0].country) {
    				set_input_value(input0, /*newEmiStat*/ ctx[0].country);
    			}

    			if (dirty[0] & /*newEmiStat*/ 1 && to_number(input1.value) !== /*newEmiStat*/ ctx[0].year) {
    				set_input_value(input1, /*newEmiStat*/ ctx[0].year);
    			}

    			if (dirty[0] & /*newEmiStat*/ 1 && to_number(input2.value) !== /*newEmiStat*/ ctx[0].em_man) {
    				set_input_value(input2, /*newEmiStat*/ ctx[0].em_man);
    			}

    			if (dirty[0] & /*newEmiStat*/ 1 && to_number(input3.value) !== /*newEmiStat*/ ctx[0].em_woman) {
    				set_input_value(input3, /*newEmiStat*/ ctx[0].em_woman);
    			}

    			if (dirty[0] & /*newEmiStat*/ 1 && to_number(input4.value) !== /*newEmiStat*/ ctx[0].em_totals) {
    				set_input_value(input4, /*newEmiStat*/ ctx[0].em_totals);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty[0] & /*deleteEmiStat, emistats*/ 135168) {
    				each_value = /*emistats*/ ctx[12];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_default_slot_6$2.name,
    		type: "slot",
    		source: "(246:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (243:18)     Loading emistats...   {:then emistats}
    function create_pending_block$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading emistats...");
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
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(243:18)     Loading emistats...   {:then emistats}",
    		ctx
    	});

    	return block;
    }

    // (279:1) {#if errorMsg}
    function create_if_block_3$3(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[10]);
    			set_style(p, "color", "red");
    			add_location(p, file$q, 278, 15, 10003);
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
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(279:1) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (280:1) {#if exitoMsg}
    function create_if_block_2$3(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ÉXITO: ");
    			t1 = text(/*exitoMsg*/ ctx[11]);
    			set_style(p, "color", "green");
    			add_location(p, file$q, 279, 16, 10069);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*exitoMsg*/ 2048) set_data_dev(t1, /*exitoMsg*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(280:1) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (281:1) <Button outline color="secondary" on:click="{loadInitialData}">
    function create_default_slot_5$2(ctx) {
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
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(281:1) <Button outline color=\\\"secondary\\\" on:click=\\\"{loadInitialData}\\\">",
    		ctx
    	});

    	return block;
    }

    // (282:1) <Button outline color="danger" on:click="{deleteEmiStats}">
    function create_default_slot_4$2(ctx) {
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
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(282:1) <Button outline color=\\\"danger\\\" on:click=\\\"{deleteEmiStats}\\\">",
    		ctx
    	});

    	return block;
    }

    // (283:1) {#if numeroDePagina==0}
    function create_if_block_1$5(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(283:1) {#if numeroDePagina==0}",
    		ctx
    	});

    	return block;
    }

    // (284:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}">
    function create_default_slot_3$2(ctx) {
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
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(284:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (286:1) {#if numeroDePagina>0}
    function create_if_block$7(ctx) {
    	let t;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 1))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 1).apply(this, arguments);
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 2))) /*paginacion*/ ctx[14](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9], 2).apply(this, arguments);
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

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(286:1) {#if numeroDePagina>0}",
    		ctx
    	});

    	return block;
    }

    // (287:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 1)}">
    function create_default_slot_2$4(ctx) {
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
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(287:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 1)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (288:2) <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}">
    function create_default_slot_1$4(ctx) {
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(288:2) <Button outline color=\\\"primary\\\" on:click=\\\"{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}\\\">",
    		ctx
    	});

    	return block;
    }

    // (304:1) <Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax)}">
    function create_default_slot$m(ctx) {
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
    		id: create_default_slot$m.name,
    		type: "slot",
    		source: "(304:1) <Button outline color=\\\"primary\\\" on:click=\\\"{busqueda (searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax)}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
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
    	let t8;
    	let h60;
    	let t10;
    	let tr0;
    	let td0;
    	let label0;
    	let t11;
    	let input0;
    	let t12;
    	let td1;
    	let label1;
    	let t13;
    	let input1;
    	let t14;
    	let td2;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let td3;
    	let label3;
    	let t17;
    	let input3;
    	let t18;
    	let tr1;
    	let td4;
    	let label4;
    	let t19;
    	let input4;
    	let t20;
    	let td5;
    	let label5;
    	let t21;
    	let input5;
    	let t22;
    	let td6;
    	let label6;
    	let t23;
    	let input6;
    	let t24;
    	let td7;
    	let label7;
    	let t25;
    	let input7;
    	let t26;
    	let t27;
    	let h61;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
    		value: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*emistats*/ ctx[12], info);
    	let if_block0 = /*errorMsg*/ ctx[10] && create_if_block_3$3(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[11] && create_if_block_2$3(ctx);

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[15]);

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteEmiStats*/ ctx[18]);
    	let if_block2 = /*numeroDePagina*/ ctx[1] == 0 && create_if_block_1$5(ctx);
    	let if_block3 = /*numeroDePagina*/ ctx[1] > 0 && create_if_block$7(ctx);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot$m] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", function () {
    		if (is_function(/*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9]))) /*busqueda*/ ctx[13](/*searchCountry*/ ctx[2], /*searchYear*/ ctx[3], /*em_manMin*/ ctx[4], /*em_manMax*/ ctx[5], /*em_womanMin*/ ctx[6], /*em_womanMax*/ ctx[7], /*em_totalsMin*/ ctx[8], /*em_totalsMax*/ ctx[9]).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Datos sobre emigrantes. 🛫";
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			create_component(button0.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			if (if_block3) if_block3.c();
    			t8 = space();
    			h60 = element("h6");
    			h60.textContent = "Para verlo mediante páginas pulse el botón de avanzar página.";
    			t10 = space();
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			t11 = text("País: ");
    			input0 = element("input");
    			t12 = space();
    			td1 = element("td");
    			label1 = element("label");
    			t13 = text("Mínimo de emigrantes (Hombres): ");
    			input1 = element("input");
    			t14 = space();
    			td2 = element("td");
    			label2 = element("label");
    			t15 = text("Mínimo de emigrantes (Mujeres): ");
    			input2 = element("input");
    			t16 = space();
    			td3 = element("td");
    			label3 = element("label");
    			t17 = text("Mínimo de emigrantes (Totales): ");
    			input3 = element("input");
    			t18 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			label4 = element("label");
    			t19 = text("Año: ");
    			input4 = element("input");
    			t20 = space();
    			td5 = element("td");
    			label5 = element("label");
    			t21 = text("Máximo de emigrantes (Hombres): ");
    			input5 = element("input");
    			t22 = space();
    			td6 = element("td");
    			label6 = element("label");
    			t23 = text("Máximo de emigrantes (Mujeres): ");
    			input6 = element("input");
    			t24 = space();
    			td7 = element("td");
    			label7 = element("label");
    			t25 = text("Máximo de emigrantes (Totales): ");
    			input7 = element("input");
    			t26 = space();
    			create_component(button2.$$.fragment);
    			t27 = space();
    			h61 = element("h6");
    			h61.textContent = "Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar.";
    			add_location(h3, file$q, 241, 1, 8695);
    			add_location(h60, file$q, 289, 1, 10941);
    			add_location(input0, file$q, 291, 19, 11040);
    			add_location(label0, file$q, 291, 6, 11027);
    			add_location(td0, file$q, 291, 2, 11023);
    			add_location(input1, file$q, 292, 45, 11136);
    			add_location(label1, file$q, 292, 6, 11097);
    			add_location(td1, file$q, 292, 2, 11093);
    			add_location(input2, file$q, 293, 45, 11228);
    			add_location(label2, file$q, 293, 6, 11189);
    			add_location(td2, file$q, 293, 2, 11185);
    			add_location(input3, file$q, 294, 45, 11322);
    			add_location(label3, file$q, 294, 6, 11283);
    			add_location(td3, file$q, 294, 2, 11279);
    			add_location(tr0, file$q, 290, 1, 11015);
    			add_location(input4, file$q, 297, 18, 11405);
    			add_location(label4, file$q, 297, 6, 11393);
    			add_location(td4, file$q, 297, 2, 11389);
    			add_location(input5, file$q, 298, 45, 11498);
    			add_location(label5, file$q, 298, 6, 11459);
    			add_location(td5, file$q, 298, 2, 11455);
    			add_location(input6, file$q, 299, 45, 11590);
    			add_location(label6, file$q, 299, 6, 11551);
    			add_location(td6, file$q, 299, 2, 11547);
    			add_location(input7, file$q, 300, 45, 11684);
    			add_location(label7, file$q, 300, 6, 11645);
    			add_location(td7, file$q, 300, 2, 11641);
    			add_location(tr1, file$q, 296, 1, 11381);
    			add_location(h61, file$q, 304, 1, 11921);
    			add_location(main, file$q, 240, 0, 8686);
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
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t4);
    			mount_component(button0, main, null);
    			append_dev(main, t5);
    			mount_component(button1, main, null);
    			append_dev(main, t6);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t7);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t8);
    			append_dev(main, h60);
    			append_dev(main, t10);
    			append_dev(main, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(label0, t11);
    			append_dev(label0, input0);
    			set_input_value(input0, /*searchCountry*/ ctx[2]);
    			append_dev(tr0, t12);
    			append_dev(tr0, td1);
    			append_dev(td1, label1);
    			append_dev(label1, t13);
    			append_dev(label1, input1);
    			set_input_value(input1, /*em_manMin*/ ctx[4]);
    			append_dev(tr0, t14);
    			append_dev(tr0, td2);
    			append_dev(td2, label2);
    			append_dev(label2, t15);
    			append_dev(label2, input2);
    			set_input_value(input2, /*em_womanMin*/ ctx[6]);
    			append_dev(tr0, t16);
    			append_dev(tr0, td3);
    			append_dev(td3, label3);
    			append_dev(label3, t17);
    			append_dev(label3, input3);
    			set_input_value(input3, /*em_totalsMin*/ ctx[8]);
    			append_dev(main, t18);
    			append_dev(main, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, label4);
    			append_dev(label4, t19);
    			append_dev(label4, input4);
    			set_input_value(input4, /*searchYear*/ ctx[3]);
    			append_dev(tr1, t20);
    			append_dev(tr1, td5);
    			append_dev(td5, label5);
    			append_dev(label5, t21);
    			append_dev(label5, input5);
    			set_input_value(input5, /*em_manMax*/ ctx[5]);
    			append_dev(tr1, t22);
    			append_dev(tr1, td6);
    			append_dev(td6, label6);
    			append_dev(label6, t23);
    			append_dev(label6, input6);
    			set_input_value(input6, /*em_womanMax*/ ctx[7]);
    			append_dev(tr1, t24);
    			append_dev(tr1, td7);
    			append_dev(td7, label7);
    			append_dev(label7, t25);
    			append_dev(label7, input7);
    			set_input_value(input7, /*em_totalsMax*/ ctx[9]);
    			append_dev(main, t26);
    			mount_component(button2, main, null);
    			append_dev(main, t27);
    			append_dev(main, h61);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[29]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[30]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[31]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[32]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[33]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[34]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[35])
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*emistats*/ 4096 && promise !== (promise = /*emistats*/ ctx[12]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[12] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$3(ctx);
    					if_block0.c();
    					if_block0.m(main, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$3(ctx);
    					if_block1.c();
    					if_block1.m(main, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (/*numeroDePagina*/ ctx[1] == 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$5(ctx);
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

    			if (/*numeroDePagina*/ ctx[1] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*numeroDePagina*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$7(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t8);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*searchCountry*/ 4 && input0.value !== /*searchCountry*/ ctx[2]) {
    				set_input_value(input0, /*searchCountry*/ ctx[2]);
    			}

    			if (dirty[0] & /*em_manMin*/ 16 && input1.value !== /*em_manMin*/ ctx[4]) {
    				set_input_value(input1, /*em_manMin*/ ctx[4]);
    			}

    			if (dirty[0] & /*em_womanMin*/ 64 && input2.value !== /*em_womanMin*/ ctx[6]) {
    				set_input_value(input2, /*em_womanMin*/ ctx[6]);
    			}

    			if (dirty[0] & /*em_totalsMin*/ 256 && input3.value !== /*em_totalsMin*/ ctx[8]) {
    				set_input_value(input3, /*em_totalsMin*/ ctx[8]);
    			}

    			if (dirty[0] & /*searchYear*/ 8 && input4.value !== /*searchYear*/ ctx[3]) {
    				set_input_value(input4, /*searchYear*/ ctx[3]);
    			}

    			if (dirty[0] & /*em_manMax*/ 32 && input5.value !== /*em_manMax*/ ctx[5]) {
    				set_input_value(input5, /*em_manMax*/ ctx[5]);
    			}

    			if (dirty[0] & /*em_womanMax*/ 128 && input6.value !== /*em_womanMax*/ ctx[7]) {
    				set_input_value(input6, /*em_womanMax*/ ctx[7]);
    			}

    			if (dirty[0] & /*em_totalsMax*/ 512 && input7.value !== /*em_totalsMax*/ ctx[9]) {
    				set_input_value(input7, /*em_totalsMax*/ ctx[9]);
    			}

    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
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
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let emistats = [];

    	let newEmiStat = {
    		country: "",
    		year: "",
    		em_man: "",
    		em_woman: "",
    		em_totals: ""
    	};

    	let numeroDePagina = 0;
    	let numeroAux;
    	let limit = 10;
    	let searchCountry = "";
    	let searchYear = "";
    	let em_manMin = "";
    	let em_manMax = "";
    	let em_womanMin = "";
    	let em_womanMax = "";
    	let em_totalsMin = "";
    	let em_totalsMax = "";
    	let errorMsg = "";
    	let exitoMsg = "";
    	onMount(getEmiStats);

    	async function getEmiStats() {
    		console.log("Fetching stats....");
    		const res = await fetch("/api/v2/emigrants-stats?offset=" + numeroDePagina + "&limit=" + limit);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, emistats = json);
    			console.log("Received " + emistats.length + " stats.");
    		} else {
    			console.log("ERROR");
    		}

    		
    	}

    	

    	///////////////////////////////////// BUSQUEDA ////////////////////////////////////////////
    	async function busqueda(
    		searchCountry,
    	searchYear,
    	em_manMin,
    	em_manMax,
    	em_womanMin,
    	em_womanMax,
    	em_totalsMin,
    	em_totalsMax
    	) {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");

    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof em_manMin == "undefined") {
    			em_manMin = "";
    		}

    		if (typeof em_manMax == "undefined") {
    			em_manMax = "";
    		}

    		if (typeof em_womanMin == "undefined") {
    			em_womanMin = "";
    		}

    		if (typeof em_womanMax == "undefined") {
    			em_womanMax = "";
    		}

    		if (typeof em_totalsMin == "undefined") {
    			em_totalsMin = "";
    		}

    		if (typeof em_totalsMax == "undefined") {
    			em_totalsMax = "";
    		}

    		const res = await fetch("/api/v2/emigrants-stats?country=" + searchCountry + "&year=" + searchYear + "&em_manMin=" + em_manMin + "&em_manMax=" + em_manMax + "&em_womanMin=" + em_womanMin + "&em_womanMax=" + em_womanMax + "&em_totalsMin=" + em_totalsMin + "&em_totalsMax=" + em_totalsMax);

    		if (res.ok) {
    			const json = await res.json();
    			$$invalidate(12, emistats = json);
    			console.log("Found " + emistats.length + " emistats");
    			window.alert("Se han encontrado datos.");
    			$$invalidate(11, exitoMsg = "Código de mensaje: " + res.status + ": " + res.statusText + ", Datos encontrados");
    		} else if (res.status == 404) {
    			//window.alert("No se encuentran datos.");
    			$$invalidate(10, errorMsg = "Código de error: " + res.status + "-" + res.statusText + ", dato no encontrado");
    		} else {
    			console.log("ERROR:" + " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
    		}

    		
    	}

    	/////////////////////// Paginación ////////////////////////////////////
    	async function paginacion(
    		searchCountry,
    	searchYear,
    	em_manMin,
    	em_manMax,
    	em_womanMin,
    	em_womanMax,
    	em_totalsMin,
    	em_totalsMax,
    	num
    	) {
    		numeroAux = num;

    		if (typeof searchCountry == "undefined") {
    			searchCountry = "";
    		}

    		if (typeof searchYear == "undefined") {
    			searchYear = "";
    		}

    		if (typeof em_manMin == "undefined") {
    			em_manMin = "";
    		}

    		if (typeof em_manMax == "undefined") {
    			em_manMax = "";
    		}

    		if (typeof em_womanMin == "undefined") {
    			em_womanMin = "";
    		}

    		if (typeof em_womanMax == "undefined") {
    			em_womanMax = "";
    		}

    		if (typeof em_totalsMin == "undefined") {
    			em_totalsMin = "";
    		}

    		if (typeof em_totalsMax == "undefined") {
    			em_totalsMax = "";
    		}

    		if (num == 1) {
    			$$invalidate(1, numeroDePagina = numeroDePagina - limit);

    			if (numeroDePagina < 0) {
    				$$invalidate(1, numeroDePagina = 0);
    				const res = await fetch("/api/v2/emigrants-stats?country=" + searchCountry + "&year=" + searchYear + "&em_manMin=" + em_manMin + "&em_manMax=" + em_manMax + "&em_womanMin=" + em_womanMin + "&em_womanMax=" + em_womanMax + "&em_totalsMin=" + em_totalsMin + "&em_totalsMax=" + em_totalsMax + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(12, emistats = json);
    					numeroAux = num;
    				}
    			} else {
    				const res = await fetch("/api/v2/emigrants-stats?country=" + searchCountry + "&year=" + searchYear + "&em_manMin=" + em_manMin + "&em_manMax=" + em_manMax + "&em_womanMin=" + em_womanMin + "&em_womanMax=" + em_womanMax + "&em_totalsMin=" + em_totalsMin + "&em_totalsMax=" + em_totalsMax + "&limit=" + limit + "&offset=" + numeroDePagina);

    				if (res.ok) {
    					const json = await res.json();
    					$$invalidate(12, emistats = json);
    					numeroAux = num;
    				}
    			}
    		} else {
    			$$invalidate(1, numeroDePagina = numeroDePagina + limit);
    			const res = await fetch("/api/v2/emigrants-stats?country=" + searchCountry + "&year=" + searchYear + "&em_manMin=" + em_manMin + "&em_manMax=" + em_manMax + "&em_womanMin=" + em_womanMin + "&em_womanMax=" + em_womanMax + "&em_totalsMin=" + em_totalsMin + "&em_totalsMax=" + em_totalsMax + "&limit=" + limit + "&offset=" + numeroDePagina);

    			if (res.ok) {
    				const json = await res.json();
    				$$invalidate(12, emistats = json);
    				numeroAux = num;
    			}
    		}
    	}

    	async function getStats() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Fetching stats...");
    		const res = await fetch("/api/v2/emigrants-stats");

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(12, emistats = json);
    			console.log("Received " + emistats.length + " stats.");
    		} else {
    			window.alert("No se encuentra ningún dato.");
    		} //errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", no se ha encontrado el dato";
    	}

    	async function loadInitialData() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Loading stats...");

    		const res = await fetch("/api/v2/emigrants-stats/loadInitialData", { method: "GET" }).then(function (res) {
    			if (res.ok) {
    				getStats();
    				window.alert("Datos iniciales cargados.");
    				$$invalidate(11, exitoMsg = "Código de mensaje: " + res.status + ": " + res.statusText + ", Datos generados correctamente");
    			} else if (res.status == 400) {
    				window.alert("La base de datos no está vacía. Debe vaciarla para cargar los datos iniciales");
    				$$invalidate(10, errorMsg = "Código de error: " + res.status + "-" + res.statusText + ", La base de datos debe estar vacía");
    			} else {
    				$$invalidate(10, errorMsg = "Código de error: " + res.status + "-" + res.statusText + ", no se puede generar datos correctamente");
    			}
    		});
    	}

    	async function insertEmiStat() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Inserting stat...");

    		if (newEmiStat.country == "" || newEmiStat.country == null || newEmiStat.year == "" || newEmiStat.year == null) {
    			window.alert("Falta país y un año");
    		} else {
    			const res = await fetch("/api/v2/emigrants-stats", {
    				method: "POST",
    				body: JSON.stringify(newEmiStat),
    				headers: { "Content-Type": "application/json" }
    			}).then(function (res) {
    				if (res.ok) {
    					console.log("Ok:");
    					getStats();

    					//window.alert("Dato insertado correctamente.");
    					$$invalidate(11, exitoMsg = "Código de mensaje: " + res.status + ": " + res.statusText + ", Dato insertado correctamente");
    				} else if (res.status == 400) {
    					window.alert("Campo mal escrito. No puede insertarlo.");
    					$$invalidate(10, errorMsg = "Código de error: " + res.status + "-" + res.statusText + ", rellene todos los campos correctamente");
    				} else {
    					window.alert("Dato ya creado. No puede insertarlo.");
    					$$invalidate(10, errorMsg = "Código de error: " + res.status + "-" + res.statusText + ", el dato ya existe");
    				}
    			});
    		}
    	}

    	async function deleteEmiStat(country, year) {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/emigrants-stats/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			getStats();
    			$$invalidate(11, exitoMsg = "Código de mensaje: " + res.status + "-" + res.statusText + ", Borrado correctamente");
    		});
    	} /*
    async function deleteEmi1Stat(country){
    		console.log("Deleting stat...");
    		const res = await fetch("/api/v2/emigrants-stats/"+country,{
    			method: "DELETE"
    		}).then(function (res){
    			window.alert("Dato eliminado correctamente.");
    			getStats();
    		});
    	}*/

    	async function deleteEmiStats() {
    		$$invalidate(11, exitoMsg = "");
    		$$invalidate(10, errorMsg = "");
    		console.log("Deleting stat...");

    		const res = await fetch("/api/v2/emigrants-stats", { method: "DELETE" }).then(function (res) {
    			window.alert("Base de datos eliminada correctamente.");
    			getStats();
    			location.reload();
    			$$invalidate(11, exitoMsg = "Código de mensaje: " + res.status + "-" + res.statusText + ", Borrados correctamente");
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$i.warn(`<EmigrantTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EmigrantTable", $$slots, []);

    	function input0_input_handler() {
    		newEmiStat.country = this.value;
    		$$invalidate(0, newEmiStat);
    	}

    	function input1_input_handler() {
    		newEmiStat.year = to_number(this.value);
    		$$invalidate(0, newEmiStat);
    	}

    	function input2_input_handler() {
    		newEmiStat.em_man = to_number(this.value);
    		$$invalidate(0, newEmiStat);
    	}

    	function input3_input_handler() {
    		newEmiStat.em_woman = to_number(this.value);
    		$$invalidate(0, newEmiStat);
    	}

    	function input4_input_handler() {
    		newEmiStat.em_totals = to_number(this.value);
    		$$invalidate(0, newEmiStat);
    	}

    	function input0_input_handler_1() {
    		searchCountry = this.value;
    		$$invalidate(2, searchCountry);
    	}

    	function input1_input_handler_1() {
    		em_manMin = this.value;
    		$$invalidate(4, em_manMin);
    	}

    	function input2_input_handler_1() {
    		em_womanMin = this.value;
    		$$invalidate(6, em_womanMin);
    	}

    	function input3_input_handler_1() {
    		em_totalsMin = this.value;
    		$$invalidate(8, em_totalsMin);
    	}

    	function input4_input_handler_1() {
    		searchYear = this.value;
    		$$invalidate(3, searchYear);
    	}

    	function input5_input_handler() {
    		em_manMax = this.value;
    		$$invalidate(5, em_manMax);
    	}

    	function input6_input_handler() {
    		em_womanMax = this.value;
    		$$invalidate(7, em_womanMax);
    	}

    	function input7_input_handler() {
    		em_totalsMax = this.value;
    		$$invalidate(9, em_totalsMax);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		emistats,
    		newEmiStat,
    		numeroDePagina,
    		numeroAux,
    		limit,
    		searchCountry,
    		searchYear,
    		em_manMin,
    		em_manMax,
    		em_womanMin,
    		em_womanMax,
    		em_totalsMin,
    		em_totalsMax,
    		errorMsg,
    		exitoMsg,
    		getEmiStats,
    		busqueda,
    		paginacion,
    		getStats,
    		loadInitialData,
    		insertEmiStat,
    		deleteEmiStat,
    		deleteEmiStats
    	});

    	$$self.$inject_state = $$props => {
    		if ("emistats" in $$props) $$invalidate(12, emistats = $$props.emistats);
    		if ("newEmiStat" in $$props) $$invalidate(0, newEmiStat = $$props.newEmiStat);
    		if ("numeroDePagina" in $$props) $$invalidate(1, numeroDePagina = $$props.numeroDePagina);
    		if ("numeroAux" in $$props) numeroAux = $$props.numeroAux;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("searchCountry" in $$props) $$invalidate(2, searchCountry = $$props.searchCountry);
    		if ("searchYear" in $$props) $$invalidate(3, searchYear = $$props.searchYear);
    		if ("em_manMin" in $$props) $$invalidate(4, em_manMin = $$props.em_manMin);
    		if ("em_manMax" in $$props) $$invalidate(5, em_manMax = $$props.em_manMax);
    		if ("em_womanMin" in $$props) $$invalidate(6, em_womanMin = $$props.em_womanMin);
    		if ("em_womanMax" in $$props) $$invalidate(7, em_womanMax = $$props.em_womanMax);
    		if ("em_totalsMin" in $$props) $$invalidate(8, em_totalsMin = $$props.em_totalsMin);
    		if ("em_totalsMax" in $$props) $$invalidate(9, em_totalsMax = $$props.em_totalsMax);
    		if ("errorMsg" in $$props) $$invalidate(10, errorMsg = $$props.errorMsg);
    		if ("exitoMsg" in $$props) $$invalidate(11, exitoMsg = $$props.exitoMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newEmiStat,
    		numeroDePagina,
    		searchCountry,
    		searchYear,
    		em_manMin,
    		em_manMax,
    		em_womanMin,
    		em_womanMax,
    		em_totalsMin,
    		em_totalsMax,
    		errorMsg,
    		exitoMsg,
    		emistats,
    		busqueda,
    		paginacion,
    		loadInitialData,
    		insertEmiStat,
    		deleteEmiStat,
    		deleteEmiStats,
    		numeroAux,
    		limit,
    		getEmiStats,
    		getStats,
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

    class EmigrantTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmigrantTable",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\front\emigrantApi\EditEmigrant.svelte generated by Svelte v3.22.2 */

    const { console: console_1$j } = globals;
    const file$r = "src\\front\\emigrantApi\\EditEmigrant.svelte";

    // (1:0) <script>      import {onMount}
    function create_catch_block$5(ctx) {
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
    		id: create_catch_block$5.name,
    		type: "catch",
    		source: "(1:0) <script>      import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (68:1) {:then eStat}
    function create_then_block$5(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_1$5] },
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

    			if (dirty & /*$$scope, updatedEm_totals, updatedEm_woman, updatedEm_man, updatedYear, updatedCountry*/ 16446) {
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
    		id: create_then_block$5.name,
    		type: "then",
    		source: "(68:1) {:then eStat}",
    		ctx
    	});

    	return block;
    }

    // (87:9) <Button outline color="primary" on:click={updateStat}>
    function create_default_slot_2$5(ctx) {
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
    		id: create_default_slot_2$5.name,
    		type: "slot",
    		source: "(87:9) <Button outline color=\\\"primary\\\" on:click={updateStat}>",
    		ctx
    	});

    	return block;
    }

    // (69:2) <Table bordered>
    function create_default_slot_1$5(ctx) {
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
    				$$slots: { default: [create_default_slot_2$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateStat*/ ctx[9]);

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
    			th2.textContent = "Emigrantes (Hombres)";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Emigrantes (Mujeres)";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Emigrantes (Totales)";
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
    			add_location(th0, file$r, 71, 5, 2369);
    			add_location(th1, file$r, 72, 5, 2389);
    			add_location(th2, file$r, 73, 5, 2408);
    			add_location(th3, file$r, 74, 5, 2444);
    			add_location(th4, file$r, 75, 5, 2480);
    			add_location(th5, file$r, 76, 5, 2516);
    			add_location(tr0, file$r, 70, 4, 2358);
    			add_location(thead, file$r, 69, 3, 2345);
    			add_location(td0, file$r, 81, 5, 2586);
    			add_location(td1, file$r, 82, 5, 2618);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$r, 83, 9, 2651);
    			add_location(td2, file$r, 83, 5, 2647);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$r, 84, 9, 2721);
    			add_location(td3, file$r, 84, 5, 2717);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$r, 85, 9, 2793);
    			add_location(td4, file$r, 85, 5, 2789);
    			add_location(td5, file$r, 86, 5, 2862);
    			add_location(tr1, file$r, 80, 4, 2575);
    			add_location(tbody, file$r, 79, 3, 2562);
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
    			set_input_value(input0, /*updatedEm_man*/ ctx[3]);
    			append_dev(tr1, t16);
    			append_dev(tr1, td3);
    			append_dev(td3, input1);
    			set_input_value(input1, /*updatedEm_woman*/ ctx[4]);
    			append_dev(tr1, t17);
    			append_dev(tr1, td4);
    			append_dev(td4, input2);
    			set_input_value(input2, /*updatedEm_totals*/ ctx[5]);
    			append_dev(tr1, t18);
    			append_dev(tr1, td5);
    			mount_component(button, td5, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[13])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*updatedCountry*/ 2) set_data_dev(t12, /*updatedCountry*/ ctx[1]);
    			if (!current || dirty & /*updatedYear*/ 4) set_data_dev(t14, /*updatedYear*/ ctx[2]);

    			if (dirty & /*updatedEm_man*/ 8 && to_number(input0.value) !== /*updatedEm_man*/ ctx[3]) {
    				set_input_value(input0, /*updatedEm_man*/ ctx[3]);
    			}

    			if (dirty & /*updatedEm_woman*/ 16 && to_number(input1.value) !== /*updatedEm_woman*/ ctx[4]) {
    				set_input_value(input1, /*updatedEm_woman*/ ctx[4]);
    			}

    			if (dirty & /*updatedEm_totals*/ 32 && to_number(input2.value) !== /*updatedEm_totals*/ ctx[5]) {
    				set_input_value(input2, /*updatedEm_totals*/ ctx[5]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
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
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(69:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (66:18)     Loading eStat...   {:then eStat}
    function create_pending_block$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading eStat...");
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
    		id: create_pending_block$5.name,
    		type: "pending",
    		source: "(66:18)     Loading eStat...   {:then eStat}",
    		ctx
    	});

    	return block;
    }

    // (92:4) {#if errorMsg}
    function create_if_block_1$6(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ERROR: ");
    			t1 = text(/*errorMsg*/ ctx[6]);
    			set_style(p, "color", "red");
    			add_location(p, file$r, 91, 18, 3014);
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
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(92:4) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    // (93:1) {#if exitoMsg}
    function create_if_block$8(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*exitoMsg*/ ctx[7]);
    			set_style(p, "color", "green");
    			add_location(p, file$r, 92, 16, 3080);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*exitoMsg*/ 128) set_data_dev(t, /*exitoMsg*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(93:1) {#if exitoMsg}",
    		ctx
    	});

    	return block;
    }

    // (94:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$n(ctx) {
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
    		id: create_default_slot$n.name,
    		type: "slot",
    		source: "(94:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let main;
    	let h3;
    	let t0;
    	let strong;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let promise;
    	let t5;
    	let t6;
    	let t7;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$5,
    		then: create_then_block$5,
    		catch: create_catch_block$5,
    		value: 8,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*eStat*/ ctx[8], info);
    	let if_block0 = /*errorMsg*/ ctx[6] && create_if_block_1$6(ctx);
    	let if_block1 = /*exitoMsg*/ ctx[7] && create_if_block$8(ctx);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$n] },
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
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			info.block.c();
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			create_component(button.$$.fragment);
    			add_location(strong, file$r, 64, 26, 2211);
    			add_location(h3, file$r, 64, 4, 2189);
    			add_location(main, file$r, 63, 0, 2177);
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
    			append_dev(strong, t3);
    			append_dev(main, t4);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t5;
    			append_dev(main, t5);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t6);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t7);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);
    			info.ctx = ctx;

    			if (dirty & /*eStat*/ 256 && promise !== (promise = /*eStat*/ ctx[8]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[8] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*errorMsg*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$6(ctx);
    					if_block0.c();
    					if_block0.m(main, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*exitoMsg*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$8(ctx);
    					if_block1.c();
    					if_block1.m(main, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
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
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let eStat = {};
    	let updatedCountry = "";
    	let updatedYear = "";
    	let updatedEm_man = 0;
    	let updatedEm_woman = 0;
    	let updatedEm_totals = 0;
    	let errorMsg = "";
    	let exitoMsg = "";
    	onMount(getStat);

    	async function getStat() {
    		console.log("Fetching stat...");
    		const res = await fetch("/api/v2/emigrants-stats/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(8, eStat = json);
    			$$invalidate(1, updatedCountry = eStat.country);
    			$$invalidate(2, updatedYear = eStat.year);
    			$$invalidate(3, updatedEm_man = eStat.em_man);
    			$$invalidate(4, updatedEm_woman = eStat.em_woman);
    			$$invalidate(5, updatedEm_totals = eStat.em_totals);
    			console.log("Received stats.");
    		} else {
    			$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + res.statusText + " , rellene los campos correctamente ");
    		}
    	}

    	async function updateStat() {
    		$$invalidate(6, errorMsg = "");
    		$$invalidate(7, exitoMsg = "");
    		console.log("Updating stat..." + JSON.stringify(params.country));

    		const res = await fetch("/api/v2/emigrants-stats/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country: params.country,
    				year: parseInt(params.year),
    				"em_man": updatedEm_man,
    				"em_woman": updatedEm_woman,
    				"em_totals": updatedEm_totals
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			getStat();

    			if (res.ok) {
    				$$invalidate(7, exitoMsg = res.status + ": " + res.statusText + ". Dato actualizado con éxito");
    				getStat();
    				window.alert("Dato modificado correctamente.");
    			} else if (res.status == 400) {
    				window.alert("Campo mal escrito. No puede editarlo.");
    			} else {
    				$$invalidate(6, errorMsg = " El tipo de error es: " + res.status + res.statusText + ", rellene todos los campos correctamente");
    			}

    			
    		});
    	}

    	
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$j.warn(`<EditEmigrant> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EditEmigrant", $$slots, []);

    	function input0_input_handler() {
    		updatedEm_man = to_number(this.value);
    		$$invalidate(3, updatedEm_man);
    	}

    	function input1_input_handler() {
    		updatedEm_woman = to_number(this.value);
    		$$invalidate(4, updatedEm_woman);
    	}

    	function input2_input_handler() {
    		updatedEm_totals = to_number(this.value);
    		$$invalidate(5, updatedEm_totals);
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
    		eStat,
    		updatedCountry,
    		updatedYear,
    		updatedEm_man,
    		updatedEm_woman,
    		updatedEm_totals,
    		errorMsg,
    		exitoMsg,
    		getStat,
    		updateStat
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("eStat" in $$props) $$invalidate(8, eStat = $$props.eStat);
    		if ("updatedCountry" in $$props) $$invalidate(1, updatedCountry = $$props.updatedCountry);
    		if ("updatedYear" in $$props) $$invalidate(2, updatedYear = $$props.updatedYear);
    		if ("updatedEm_man" in $$props) $$invalidate(3, updatedEm_man = $$props.updatedEm_man);
    		if ("updatedEm_woman" in $$props) $$invalidate(4, updatedEm_woman = $$props.updatedEm_woman);
    		if ("updatedEm_totals" in $$props) $$invalidate(5, updatedEm_totals = $$props.updatedEm_totals);
    		if ("errorMsg" in $$props) $$invalidate(6, errorMsg = $$props.errorMsg);
    		if ("exitoMsg" in $$props) $$invalidate(7, exitoMsg = $$props.exitoMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		updatedCountry,
    		updatedYear,
    		updatedEm_man,
    		updatedEm_woman,
    		updatedEm_totals,
    		errorMsg,
    		exitoMsg,
    		eStat,
    		updateStat,
    		getStat,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EditEmigrant extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditEmigrant",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get params() {
    		throw new Error("<EditEmigrant>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditEmigrant>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\emigrantApi\Integrations\G23.svelte generated by Svelte v3.22.2 */

    const { console: console_1$k } = globals;
    const file$s = "src\\front\\emigrantApi\\Integrations\\G23.svelte";

    function create_fragment$t(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Funciona";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$s, 104, 8, 2603);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$s, 105, 8, 2685);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$s, 106, 8, 2769);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$s, 107, 8, 2844);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-32ht8r");
    			add_location(div, file$s, 111, 8, 2998);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$s, 112, 8, 3034);
    			attr_dev(figure, "class", "highcharts-figure svelte-32ht8r");
    			add_location(figure, file$s, 110, 4, 2954);
    			add_location(main, file$s, 109, 0, 2942);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$h() {
    	let MisDatos = [];
    	let G23 = [];
    	const EmigrantDatos = await fetch("/api/v1/emigrants-stats");
    	MisDatos = await EmigrantDatos.json();
    	const DatosExternos = await fetch("/api/v2/fires-stats");

    	if (DatosExternos.ok) {
    		console.log("G23 cargado");
    		const json = await DatosExternos.json();
    		G23 = json;
    		console.log(G23);
    	} else {
    		console.log("ERROR!");
    	}

    	let aux = [];

    	MisDatos.forEach(x => {
    		if (x.year == 2010 && (x.country == "spain" || x.country == "germany")) {
    			aux = {
    				name: x.country,
    				data: [0, 0, parseInt(x.em_man), parseInt(x.em_woman)]
    			};
    		}
    	});

    	G23.forEach(x => {
    		if (x.year == 2010 && (x.community == "ceuta" || x.community == "aragon")) {
    			aux = {
    				name: x.community,
    				data: [parseInt(x.total_fire), parseInt(x.total_fire), 0, 0]
    			};
    		}
    	});

    	Highcharts.chart("container", {
    		chart: { type: "areaspline" },
    		title: { text: "G01 - G23" },
    		legend: {
    			layout: "vertical",
    			align: "left",
    			verticalAlign: "top",
    			x: 150,
    			y: 100,
    			floating: true,
    			borderWidth: 1,
    			backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || "#FFFFFF"
    		},
    		xAxis: {
    			categories: ["em_man", "em_woman", "total_fire", "total_fire"],
    			plotBands: [
    				{
    					// visualize the weekend
    					from: 4.5,
    					to: 6.5,
    					color: "rgba(68, 170, 213, .2)"
    				}
    			]
    		},
    		yAxis: { title: { text: "Fruit units" } },
    		tooltip: { shared: true, valueSuffix: " units" },
    		credits: { enabled: false },
    		plotOptions: { areaspline: { fillOpacity: 0.5 } },
    		series: // valores
    		[
    			{
    				name: "John",
    				data: [3, 4, 3, 5, 4, 10, 12]
    			},
    			{
    				name: "Jane",
    				data: [1, 3, 4, 3, 3, 5, 4]
    			}
    		]
    	});
    }

    function instance$t($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$k.warn(`<G23> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("G23", $$slots, []);
    	$$self.$capture_state = () => ({ pop, Button, loadGraph: loadGraph$h });
    	return [];
    }

    class G23 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "G23",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\front\App.svelte generated by Svelte v3.22.2 */

    const file$t = "src\\front\\App.svelte";

    function create_fragment$u(ctx) {
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
    			add_location(main, file$t, 90, 0, 4098);
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
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": Home,
    		"/Analytics": Analytics,
    		// JUANFRAN
    		"/natality-stats": NatalityTable,
    		"/natality-stats/:country/:year": EditNatality,
    		"/natality-stats/graph": GraphNatality,
    		"/natality-stats/graphV2": GraphNatalityV2,
    		// ANGELA
    		"/poverty-stats": PovertyTable,
    		"/poverty-stats/:country/:year": EditPoverty,
    		"/poverty-stats/graph": GraphPoverty,
    		"/poverty-stats/graph2": GraphPoverty2,
    		"/poverty-stats/integrations": Home$1,
    		"/poverty-stats/sos1920-04": Sos1920_04,
    		"/poverty-stats/sos1920-05": Sos1920_05,
    		"/poverty-stats/sos1920-06": Sos1920_06,
    		"/poverty-stats/sos1920-07": Sos1920_07,
    		"/poverty-stats/sos1920-08": Sos1920_08,
    		"/poverty-stats/sos1920-09": Sos1920_09,
    		"/poverty-stats/sos1920-10": Sos1920_10,
    		"/poverty-stats/sos1920-21": Sos1920_21,
    		"/poverty-stats/sos1920-22": Sos1920_22,
    		"/poverty-stats/sos1920-28": Sos1920_28,
    		"/poverty-stats/ex-01": Ex_01,
    		"/poverty-stats/ex-02": Ex_02,
    		// ESCOBAR	
    		"/emigrants-stats": EmigrantTable,
    		"/emigrants-stats/:country/:year": EditEmigrant,
    		//"/emigrants-stats/G05:":G05,
    		//"/emigrants-stats/G06:":G06,
    		//"/emigrants-stats/G07:":G07,
    		//"/emigrants-stats/G08:":G08,
    		//"/emigrants-stats/G09:":G09,
    		//"/emigrants-stats/G12:":G12,
    		//"/emigrants-stats/G22:":G22,
    		"/emigrants-stats/G23:": G23,
    		//"/emigrants-stats/G26:":G26,
    		//"/emigrants-stats/G30:":G30,
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
    		NotFound,
    		Analytics,
    		NatalityTable,
    		EditNatality,
    		GraphNatality,
    		GraphNatalityV2,
    		PovertyTable,
    		EditPoverty,
    		GraphPoverty,
    		GraphPoverty2,
    		PovertyIntegrations: Home$1,
    		API04: Sos1920_04,
    		API05: Sos1920_05,
    		API06: Sos1920_06,
    		API07: Sos1920_07,
    		API08: Sos1920_08,
    		API09: Sos1920_09,
    		API10: Sos1920_10,
    		API21: Sos1920_21,
    		API22: Sos1920_22,
    		API28: Sos1920_28,
    		APIex1: Ex_01,
    		APIex2: Ex_02,
    		EmigrantTable,
    		EditEmigrant,
    		G23,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    const app = new App({
    	target: document.querySelector('#SvelteApp')
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
