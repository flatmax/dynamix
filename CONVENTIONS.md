jrpc-oo provides object oriented rpc between the browser and nodejs
JRPC-OO lifecycle:
in javascript :
* setupDone() When the system is finished setup and ready to be used
* remoteDisconnected(uuid) Notify that a remote has been disconnected
* remoteIsUp() Remote is up but not ready to call see setupDone
Usage :
Both client and server allow you to add an instance of a class and the methods are parsed out enabling it to be called.
js: addClass(c, objName) - Typically called in connectedCallback

JRPC-OO usage :
js promise : this.call['Class.method'](args)

JRPC-OO response :
The return value is an object of {remote UUID : return data, ... }. utils.js function extractResponseData returns the data from the first UUID, as well as data for other forms.

JRPC-OO allows direct call and response of nodejs classes in the browser and browser classes in nodejs. Everything is a remote once connected and all remotes can directly call class.method of instances on other remotes (getting the RPC responses), no need to re-implement the classes locally.

Store each class in its own js file, e.g. Test.js has the code for the class Test in it.
In the webapp, the kebab-case file name webapp/track-play.js imports TrackPlay and does customElements.define, however webapp/src/TrackPlay.js has the class's code in it.

UI Design:
Use Material Design 3 (Material Web Components) for all UI elements in the webapp.
Import Material Web Components as needed: @material/web
Common components: md-filled-button, md-outlined-button, md-text-button, md-icon-button, md-linear-progress, md-circular-progress, md-list, md-list-item, md-icon, md-card, md-elevated-card, md-outlined-card
