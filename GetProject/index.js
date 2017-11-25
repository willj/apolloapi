const azure = require('azure-storage');

module.exports = function (context, req) {

    if(!req.query.id){
        context.res = {
            status: 400,
            body: "Project id is required"
        };

        return context.done();
    }

    const tableService = azure.createTableService(process.env.AzureStorageTableConnectionString);

    tableService.retrieveEntity(process.env.ApolloTableName, process.env.ApolloPartitionKey, req.query.id, (err, result) => {
        if (err){
            context.res = {
                status: 400,
                body: err
            };
        } else {
            context.res = {
                body: result.Project['_']
            };
        }

        context.done();
    });
};