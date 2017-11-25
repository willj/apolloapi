const azure = require('azure-storage');
const uuid = require('uuid/v4');

module.exports = function (context, req) {
    let project = req.body;

    if (!project.title || project.items.length < 1){
        context.res = {
            status: 400,
            body: 'A title and at least 1 file are required'
        };

        return context.done();
    }

    if(project.items.filter(value => {
        return (value.url) ? false : true ;
    }).length > 0){
        context.res = {
            status: 400,
            body: 'Files are still uploading, try again once complete'
        };

        return context.done();
    }

    project.id = uuid().substr(0,8);

    const tableService = azure.createTableService(process.env.AzureStorageTableConnectionString);
    const entityGen = azure.TableUtilities.entityGenerator;

    tableService.createTableIfNotExists(process.env.ApolloTableName, err => {
        if (err) {
            context.res = {
                status: 500,
                body: 'Unable to create table'
            };
    
            return context.done();
        }
    });

    const entity = {
        PartitionKey: entityGen.String('apollo'),
        RowKey: entityGen.String(project.id),
        Project: entityGen.String(JSON.stringify(project))
    };

    tableService.insertEntity(process.env.ApolloTableName, entity,  (err, result, response)  => {
        if (!err){
            context.res = {
                body: { id: project.id }
            };
            context.done();
        } else {
            context.res = {
                status: 500,
                body: 'Unable to save project'
            };
            context.done();
        }
    });

    
};