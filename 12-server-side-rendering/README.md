# Server side rendering with React and Express

## Typical React app vs Server Side Rendering with React App

- ### Typical React App

  <img src="screenshots/typical-react-1.png" width=500>

  <img src="screenshots/typical-react-2.png" width=300>

- ### SSR with React

  <img src="screenshots/ssr-with-react-1.png" width=500>

  <img src="screenshots/ssr-with-react-2.png" width=300>

## App Setup

- ### Layout

  <img src="screenshots/app-layout-1.png" width=900>

  <img src="screenshots/app-layout-2.png" width=450>

- ### Why separate API server and Rendering server?

  Make it easier to scale and increase performance

  <img src="screenshots/api-server-vs-rendering-server-0.png" width=500>

  <img src="screenshots/api-server-vs-rendering-server-1.png" width=500>

  <img src="screenshots/api-server-vs-rendering-server-2.png" width=500>

  <img src="screenshots/api-server-vs-rendering-server-3.png" width=500>

  <img src="screenshots/api-server-vs-rendering-server-4.png" width=500>

- ### How to make React works with Express

  When using React for frontend, we can do `ReactDOM.render` to create components and render on the DOM. However, when React works in the backend, there's no DOM to be attached to, we can only return a string that includes HTML to the browser. We use `renderToString` from `react-dom` to do that in place of `render`

  <img src="screenshots/react-backend-1.png" width=550>

  NodeJS doesn't understand JSX syntax so we have to run `webpack` and `babel` to convert it to the version NodeJS can process and bundle it into 1 file. Then nodeJS will run that one file to start up the server

  To make this works, we have to setup configuration files for webpack and babel. Those files are `webpack.base.js`, `webpack.client.js`, `webpack.server.js`

  <img src="screenshots/react-backend-3.png" width=500>

  <img src="screenshots/react-backend-2.png" width=250>

  We also need to bundle all of the JS files from React side to send back to frontend, otherwise, the data sent back is just plain HTML. We bundle a separate file for React frontend, and not use the bundle.js made for the server because we don't want to expose code/data in the server to our clients.

  <img src="screenshots/react-backend-4.png" width=550>

  <img src="screenshots/react-backend-5.png" width=550>

  A brief summary of the browser-server flow after we include a js script to make the browser requests for the bundle.js for frontend

  <img src="screenshots/react-backend-6.png" width=400>

## Setup Routes (Navigation) for Server and Client

- Normal flow of requests made from a browser to React App (without SSR) using BrowserRouter. The server always sends back a single index.html file

  <img src="screenshots/routes-1.png" width=300>

- With the SSR React app, we want Express to pass all requests to React Router and let React Router decides what to send back to the client

  <img src="screenshots/routes-2.png" width=500>

- BrowserRouter works by looking at the address URL and processing the appropriate components to render on the screen. When rendering on the server side, there's no address bar for BrowserRouter to look at so we have to use another component from React Router for the server side `StaticRouter`

  <img src="screenshots/routes-3.png" width=300>

- The app currently already setup for server and client to render its own appropriate JS. We just need to create a single `Routes.js` file that contains all the Route for the app, and pass it in under `StaticRouter` for the server side, and `BrowserRouter` for client side

  ```js
  // in Routes.js
  return (
    <div>
      <Route exact path="/" component={Home} />
    </div>
  );

  // in renderer.js
  renderToString(
    <StaticRouter location={req.path} context={{}}>
      <Routes />
    </StaticRouter>
  );

  // in client.js
  ReactDOM.hydrate(
    <BrowserRouter>
      <Routes />
    </BrowserRouter>,
    document.querySelector("#root")
  );
  ```

  <img src="screenshots/routes-4.png" width=500>

## Integrating Support for Redux in SSR

- ### API Server structure (Already built)

  <img src="screenshots/api-server.png" width=350>

- ### We'd want to integrate Redux for data managing to this app. List of Reducers and Action Creators

  <img src="screenshots/redux-reducers-action-creator.png" width=500>

- ### Normal flow of a request in a traditional, client-side only React/Redux app

  <img src="screenshots/redux-traditional.png" width=350>

- ### A request flow in a React/Redux app with SSR

  <img src="screenshots/redux-in-server.png" width=350>

- ### Challenges to integrate Redux to the server

  - **Redux needs different configuration on browser vs server**: The way Redux behaves on the server needs to be significantly different from the way it behaves on the client b/c of the other three challenges listed below. In other words, to solve problems with the below three challenges, Redux needs to behave differently on the server. To setup Redux on the server, we'd take a very similar approach to how we setup Router. There will be two Redux stores, one for the server bundle, and one for the client bundle.
  - **Aspects of authentication needs to be handled on server. Normally this is only on the browser**: The API requires user to logged in in other to access to some routes. This API uses cookie based authentication, so as long as user go through the Oauth authentication process, the browser will be able to authenticate to the API with the use of cookies. The cookie based authentication is very straight forward. However, with SSR, when our app is rendered on the server, we don't easily have access to the cookie data that proves the user is authenticated.
  - **Need some way to detect when all initial data load action creators are completed on server**: In a normal React/Redux app, whenever we need to load up some data, we'd call an action creator that'll make some Ajax requests and when the requests are resolved, we dispatch an Action and the app naturally updates. After the reducers run, Redux collects all the new states, and rerenders the app automatically. The key there is when we call an Action Creator, the updates occur automatically so we don't get any signals when the action creators finish fetching data. But on the server, when we attempt to fetch some data from an action creator, we need to know the exact instant that the request issued by an action creator is finished so that we can attempt to render the app to a string and send it back to the browser (why? b/c we want to show the user some data as fast as possible). That means we need some way to know when an action creators finish loading some initial data.
  - **Need state rehydration on the browser**: Similar to how React needs a kickstart to rehydrate (rerender) after the initial HTML loads up, redux also needs a kickstart to rehydrate its process.

- ### Server Side Data Loading with Redux

  After setting up 2 Redux stores for server side and client side, we can access and update Redux store for the client side the same way we always do in traditional React/Redux app. [commit link](https://github.com/ngannguyen117/React-Bootcamp/commit/b409239ec8a4d2f44e42dc9d5c8d878fd5a990a1)

  However, it requires more setting up to use Redux (accessing store, create Action Creators and Reducers) on the server side.

  - The flow of data loading in a traditional React/Redux

    <img src="screenshots/data-loading-traditional.png" width=350>

  - Up to this point with SSR, the data loading we setup like in traditional React/Redux app won't work because we already send back to the browser HTML file before any Component can mount on the DOM, so the life method `componentDidMount` will never be called to fetch data.

    <img src="screenshots/data-loading-ssr-1.png" width=400>

  - We can fix that by finding which components will need to be rendered, and fetch all data for those components before render the components and send it back to the browser.

    <img src="screenshots/data-loading-ssr-2.png" width=400>

    <img src="screenshots/data-loading-ssr-3.png" width=400>

  - **Figure out what components would have rendered (based on URL)**: to do this, we need to use `React Router Config` library. This library is a sub-package of `React Router`. Its purpose is to help with server side rendering in figuring out which components needed to be rendered without rendering it. However, to use it, we need to make changes to the routes definition `Routes.js`.

  ```js
  // Previous definition of Routes
  <Route exact path="/" component={Home} />;

  // New Routes.js
  import Home from "./components/Home";
  import UserList from "./components/UsersList";

  export default [
    {
      path: "/",
      component: Home,
      exact: true,
    },
    {
      path: "/users",
      component: UserList,
    },
  ];

  // in client.js and renderer.js we replace <Routes /> with
  import { renderRoutes } from "react-router-config";
  <div>{renderRoutes(Routes)}</div>;

  // in src/index.js, use matchRoutes method to find out which components need to be render after creating the store
  import { matchRoutes } from "react-router-config";
  matchRoutes(Routes, req.path);
  ```

  - **LoadData Functions**:

    <img src="screenshots/load-data-1.png" width=550>

    <img src="screenshots/load-data-2.png" width=550>

    Why do we want to load data to the redux store on the server before rendering?

    Because the rendering part is still React/Redux render components. Usually, on the traditional client side, Redux could rerender the app after receiving new data (through `componentDidMount`) but that will not work here because it never had that kickstart to start the Redux part. So to make it work with SSR when the app first renders, we load data to redux store. During the rendering step, the React/Redux app still uses `connect` function from `react-redux` to get connect to the Provider and render components with data from redux store.

  - **Client Rehydration**

    Before the fix: The server renders the page with data from the store. Server returns the page to the browser with an empty store as initial state

    <img src="screenshots/client-rehydration-1.png" width=600>

    We have to include the data from the store on the server along with the HTML (as window.INITIAL_STATE) so that the browser can rehydrate the page with the right data.

    <img src="screenshots/client-rehydration-2.png" width=350>

  - **Authentication**

    Normal process of authentication between browser and the API server

    <img src="screenshots/auth-1.png" width=140>
    <img src="screenshots/auth-2.png" width=580>

    That process will not work with SSR (at least at the initial rendering) because the browser sends requests to the rendering server, the rendering server makes the requests to API server. The authentication cookie won't be sent to the rendering server because cookie is issued per Domain basis while the API server and render server have different sub-domains

    <img src="screenshots/auth-3.png" width=140>
    <img src="screenshots/auth-4.png" width=610>

    **Why we cannot attach Json Web Token (JWT) to every request instead of using cookie?**: We can use JWT as cookie but in this discussion, we're talking about attaching JWT to the header, URL or body of the request.

    Normal process with browser sends a request to the server with a JWT attached to header/url/body. This only works when we have control over what will be send over with the request because we have to attach the JWT.

    <img src="screenshots/auth-jwt-1.png" width=500>

    Use JWT with the Render Server: When the user goes to the browser and enter our address page, we have no control over the request to be able to attach the JWT to the header/url/body to the request. So after receiving the request, the server has to make a follow up request to get the JWT before it can send any response back. This means we won't be able to send back rendered HTML content to the browser. Only cookies are always being attached with the requests without us have to set it up.

    <img src="screenshots/auth-jwt-2.png" width=500>

    <img src="screenshots/auth-jwt-3.png" width=500>


    **`SOLUTION`**: Setup a `proxy` on the rendering server. When a user attemps to authenticate with the app, rather than sending the user directly to API server, we'll send the users to the proxy running on our rendering server. The proxy will forward that authentication request to the API. After a cookie is issued by the API, the proxy will communicate that cookie back to the browser. So as far as the browser is concerned, the API doesn't exist. It will think that it's only communicating with the Render server.

    <img src="screenshots/auth-5.png" width=900>

    Initial Page Fetch: Server side, Followup AJAX requests: Client side. We have to make sure both call the same action creator

    <img src="screenshots/auth-6.png" width=900>

    During the `Initial Page Load` process, we need to correctly get the server to communicate directly with the API server. This means we don't go through the proxy but the request will be made from the action creator, which will use axios to make the fetch request to API. We need to make sure we attach the cookie from the original request to the request that axios makes.

    <img src="screenshots/auth-7.png" width=800>

    For `Followup Requests` which are made from the Browser, we'd be using the same Action Creator used in the Initial Page load. This time, the request made from axios will go through the proxy but we don't need to manually attach cookie because the browser already does it for us.

    <img src="screenshots/auth-8.png" width=800>

    - Setup proxy

      ```js
      // in src/index.js
      import express from 'express';
      import proxy from 'express-http-proxy';

      const app = express();
      app.use('/api', proxy('http://react-ssr-api.herokuapp.com/'));
      ```

    - Setup Axios and Redux thunk for Initial Page Load and followup requests processes.

      <img src="screenshots/axios-thunk.png" width=600>

      ```js
      // Action Creator for both client and server

      // in actions/index.js: api is the axiosInstance we pass in redux thunk.extraArguments
      export const fetchUsers = () => async (dispatch, getState, api) => {
        const res = await api.get('/users');
        dispatch({ type: FETCH_USERS, payload: res });
      };
      ```

      ```js
      // FOR CLIENT

      // in client.js
      const axiosInstance = axios.create({ baseURL: '/api' });

      const store = createStore(reducers, window.INITIAL_STATE, applyMiddleware(thunk.withExtraArgument(axiosInstance)));
      ```

      ```js
      // FOR SERVER

      // in src/index.js
      const store = createStore(req); // pass req obj to createStore

      // in createStore.js
      export default req => {
        const axiosInstance = axios.create({
          baseURL: 'http://react-ssr-api.herokuapp.com',
          headers: { cookie: req.get('cookie') || '' },
        });

        const store = createStore(reducers, {}, applyMiddleware(thunk.withExtraArgument(axiosInstance)));

        return store;
      };
      ```
