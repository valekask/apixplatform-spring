require.config({
    baseUrl: './../botw/js',
    deps: ["app"],
    shim: {
        jquery: {
            exports: "$"
        },
        bootstrap: {
            deps: ["jquery"],
            exports: "bootstrap"
        },
        d3: {
            deps: [],
            exports: "d3"
        },
        "d3-transform": {
            deps: ["d3"],
            exports: "d3-transform"
        },
        "d3-zoom": {
            deps: ["d3"],
            exports: "d3-zoom"
        }
    },
    paths: {
        jquery: "lib/jquery-1.7.1",
        d3: "lib/d3-v3/d3.v3",
        "d3-transform": "lib/d3-v3/d3-transform",
        "d3-zoom": "lib/d3-v3/d3-zoom",
        bootstrap: "lib/bootstrap.min",
        utils: "services/utils",
        dispatcher: "services/dispatcher"
    }
});