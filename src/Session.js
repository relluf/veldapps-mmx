define(["require", "yell", "jquery"], function(require, yell, jquery) {

	var yell = require("yell"), Session;
	var ajax = require("jquery").ajax;
	var VA_BASE_URL = "/cavalion/js/"; 
	
	// var VA_BASE_URL = "https://veldapps.com/cavalion/js/"; // CORS introduces extra request for every request (!!!)
	
	function getQueryString(obj) {
		if(typeof obj === "string") return obj;
		
		var str = [];
		for(var k in obj) {
			if(obj[k] !== undefined) {
				str.push(String.format("%s=%s", k, window.escape(obj[k]).replace(/\+/g, "%2B")));
			}
		}
		return str.join("&");
	}

	return (Session = {
		baseUrl: function() {
			if(arguments.length === 1) {
				return (VA_BASE_URL = arguments[0]);
			}
			return VA_BASE_URL;
		},

		authenticated: undefined,
		waiting: [],
		
		waitFor() {
			// returns a Promise to a valid/authenticated session
			return new Promise((resolve, reject) => {
				if(this.isAuthenticated()) {
					resolve(this);
				} else {
					this.waiting.push([resolve, reject]);
				}
			});
		},
		
		isAuthenticated() {
			return this.authenticated;
		},
		isLoggedIn() {
			return this.execute("users/Session.isLoggedIn").then(function(res) {
				return (this.authenticated = res === true);
			}.bind(this));
		},
		
		login(user, password) {
			this.authenticated = undefined;
			
			return this.execute("users/Session.login", { user: user, password: password })
				.then(res => {
					yell(this, "session:authenticated", [res === "OK"]);
					this.waiting.forEach(w => w[0](this));
					this.waiting = [];
					return (this.authenticated = (res === "\"OK\"" || res === "OK")); // weird buggy response differs over servers
				});
		},
		logout() {
			delete this.authenticated;
			
			return new Promise((resolve, reject) => {
				this.execute("users/Session.logout")
					.then(res => resolve(res))
					.catch(res => resolve({}));
			});
			
		},

		execute(command, params, content, options) {
			params = getQueryString(params || {});
			content = typeof content === "string" ? content : JSON.stringify(content);
			options = options || {};
			
			return Promise.resolve(ajax({ 
				method: options.method || "POST", data: content,
				contentType: "application/json",
				converters: { "text script": function(text) { return JSON.parse(text); } },
				url: js.sf("%s/%s?%s", VA_BASE_URL, command, params)
			}));
		}
	});
});