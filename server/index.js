import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, useMatches, useActionData, useLoaderData, useParams, useRouteError, Meta, Links, ScrollRestoration, Scripts, Outlet, isRouteErrorResponse } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createElement, useState, useEffect } from "react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function withComponentProps(Component) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      matches: useMatches()
    };
    return createElement(Component, props);
  };
}
function withErrorBoundaryProps(ErrorBoundary3) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      error: useRouteError()
    };
    return createElement(ErrorBoundary3, props);
  };
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const buildBoard = (width, height, bombs) => {
  const board = getEmptyBoard(width, height);
  fillBoardWithBombs(board, width, height, bombs);
  numberBoard(board, width, height);
  return board;
};
const getEmptyBoard = (width, height) => {
  const board = [];
  for (var i = 0; i < height; i++) {
    const row = [];
    for (var j = 0; j < width; j++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
};
const fillBoardWithBombs = (board, width, height, bombs) => {
  for (var i = 0; i < bombs; i++) {
    let foundSpot = false;
    while (!foundSpot) {
      let row = Math.floor(Math.random() * height);
      let col = Math.floor(Math.random() * width);
      if (board[row][col] === 0) {
        board[row][col] = -1;
        foundSpot = true;
      }
    }
  }
};
const numberBoard = (board, width, height) => {
  for (var i = 0; i < height; i++) {
    for (var j = 0; j < width; j++) {
      if (board[i][j] === 0) {
        board[i][j] = getNearbyBombs(board, width, height, i, j);
      }
    }
  }
};
const BOX = [-1, 0, 1];
const getNearbyBombs = (board, width, height, row, col) => {
  return BOX.map((y) => {
    return BOX.map((x) => {
      if (row + y > 0 && row + y < height && col + x > 0 && col + x < width) {
        return board[row + y][col + x];
      }
      return 0;
    }).reduce((partialSum, a) => partialSum + (a === -1 ? 1 : 0), 0);
  }).reduce((partialSum, a) => partialSum + a, 0);
};
function meta({}) {
  return [{
    title: "Minesweeper by Diddy"
  }, {
    name: "description",
    content: "This game will make you shit your pants"
  }];
}
const home = withComponentProps(function Home() {
  const [board, setBoard] = useState();
  useEffect(() => {
    setBoard(buildBoard(30, 16, 99));
  }, []);
  return /* @__PURE__ */ jsx("div", {
    className: "flex flex-col w-full h-full items-center justify-center",
    children: board == null ? void 0 : board.map((row) => {
      return /* @__PURE__ */ jsx("div", {
        className: "flex flex-row",
        children: row.map((space) => {
          return /* @__PURE__ */ jsx("div", {
            className: "flex flex-col w-[30px] h-[30px]",
            children: space
          });
        })
      });
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/minesweeperassets/entry.client-BFhZpkrh.js", "imports": ["/minesweeperassets/chunk-HA7DTUK3-DItZKCSJ.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/minesweeperassets/root--DtV-gvq.js", "imports": ["/minesweeperassets/chunk-HA7DTUK3-DItZKCSJ.js", "/minesweeperassets/with-props-Db1jVSdq.js"], "css": ["/minesweeperassets/root-fVoLIL_2.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/minesweeperassets/home-4kmdE4Pi.js", "imports": ["/minesweeperassets/with-props-Db1jVSdq.js", "/minesweeperassets/chunk-HA7DTUK3-DItZKCSJ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/minesweeperassets/manifest-df005c4f.js", "version": "df005c4f" };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const publicPath = "/minesweeper";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routes,
  ssr
};
