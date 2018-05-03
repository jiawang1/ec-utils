# troop-adapter

provide functions to enable react application to run with troop based app together.

1. troop client: supprot simple troop query/command without cache and batch, also supply basic http client functions.
2. troop connector: event emitter and subscriber to enable react app and troop app to communicate with each other via troop Hub event.
3. TroopWrapper: HOC to inject troop connecter to react component.
4. renderToTroop: render react component inside troop app.

## interface

1. API for *troopClient*

query (__(url, resource, options)=>Promise__): simulate troop query without cache and batch. url (manditory): url for the troop query endpoint. resource (manditory): the troop resource identifier, the format should be resource + ! + id,  like "user!current". Here also support mulitiple resources splited via "|". options(optional): format of options shoud be like { troopContext, httpOptions}.

postCommand(__(url, body, options)=>Promise__): post a troop command. url (manditory): url for the troop command endpoint + command url, like "/services/api/school/command/enrollment/updatecurrentenrollment", body: contents for the command, should be an object. options(optional): format of options shoud be like { troopContext, httpOptions}.

postCommandWithObject(__(oCommand, body, troopContext) =>Promise__): a simple API for posting troop command, oCommand (manditory): cache object for troop command. body: conents for troop command. troopContext: troop context.

getJson(__(url, option)=>Promise__): http get request with JSON as parameter. url :  url for service. option: http options.

postJson(__(url, body, option)=>Promise__): http post request with JSON as parameter.

postForm(__(url, body, option)=>Promise__): http post request with with MIME type 'application/x-www-form-urlencoded'.url :  url for service. body: form content in JSON format. option: http options.
