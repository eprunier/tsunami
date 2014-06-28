var minimist = require('minimist');
var url = require('url');
var http = require('http');
var pd = require('pretty-data').pd;

exports.help = function() {
    var help = "\n\
Usage: tsu rest [-m|--method <method>] [--basic-auth <user:password>] [-v|--verbose] <url>\n\
\n\
Options: \n\
    --basic-auth\n\
        Add basic authorization header\n\
\n\
    -m, --method <method>\n\
        HTTP method (GET, POST, DELETE...). Default value is GET.\n\
\n\
    -v, --verbose\n\
        Verbose mode";

    console.log(help);    
};

exports.execute = function() {
    var args = parseArgs();

    if (args._.length < 2) {
	console.log('You must provide a URL');
	process.exit(1);
    } else {
	var options = createOptions(args);
	var verbose = args.verbose || false;
	sendRequest(options, verbose);
    }
};

/**
 * Parse command line arguments.
 */
function parseArgs() {
    var cmdLine = process.argv.slice(2);
    var argsOptions = {'boolean': 'v',
		       'alias': {'m': 'method',
				 'v': 'verbose'}};

    return minimist(cmdLine, argsOptions);
}

/**
 * create request options.
 */
function createOptions(args) {
    var target = url.parse(args._[args._.length - 1]);

    var options = {
	hostname: target.hostname || 'localhost',
	port: target.port || 80,
	path: target.path,
	method: args.method || 'GET',
	headers: {}
    };

    var user = target.auth || args['basic-auth'];
    if (user) {
	options.headers['Authorization'] = 'Basic ' + new Buffer(user).toString('base64');
    }

    return options;
}

/**
 * Send request.
 */
function sendRequest(options, verbose) {
    var req = http.request(options, function(res) {
	var status = res.statusCode;
	var statusLine = status + ' ' + http.STATUS_CODES[status];

	if (verbose) {
	    console.log('Status: ' + statusLine);
	    console.log('Headers: \n' + pd.json(res.headers));
	    console.log('Body: ');
	}

	res.setEncoding('utf8');
	res.on('data', function(result) {
	    var contentType = res.headers['content-type'];
	    if (contentType.indexOf('application/json') >= 0) {
		var json = pd.json(result);
		console.log(json);
	    } else if (contentType.indexOf('text/html') >= 0) {
		var html = pd.xml(result);
		console.log(html);
	    } else {
		console.log(result);
	    }
	});
    }).on('error', function(e) {
	console.log('problem with request: ' + e.message);
    }).end();
}