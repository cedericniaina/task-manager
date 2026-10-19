- METTRE TOUS LES DONNES ENVOIE EN JSON_ENCODE

## DEBUG

```js
fetch("http://localhost:8000/test").then(res=>res.json())
Content-Security-Policy: The page’s settings blocked the loading of a resource (connect-src) at http://localhost:8000/test because it violates the following directive: “default-src chrome:” debugger eval code:1:6
Promise { <state>: "rejected", <reason>: TypeError }
​
<state>: "rejected"
​
<reason>: TypeError: NetworkError when attempting to fetch resource.
​
<prototype>: Promise.prototype { … }

Uncaught (in promise) TypeError: Net
```
