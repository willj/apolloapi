const azure = require('azure-storage');
const uuid = require('uuid/v1')();
const supportedFileTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const fileExtensions = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp"
};

module.exports = function (context, req) {
    
    const { mimeType, fileSize } = req.body;

    if ( isValidFileType(mimeType) && isValidSize(fileSize) ) {

        const blobService = azure.createBlobService(process.env.AzureStorageConnectionString);
        const containerName = process.env.ApolloContainerName;
        const blobName = generateBlobName(mimeType, uuid);

        let startDate = new Date();
        let expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + process.env.ApolloTokenDurationMinutes);
        
        let sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: azure.BlobUtilities.SharedAccessPermissions.WRITE,
                Expiry: expiryDate
            }
        };
    
        let token = blobService.generateSharedAccessSignature(containerName, blobName, sharedAccessPolicy);
        let sasUrl = blobService.getUrl(containerName, blobName, token);
    
        context.res = {
            body: { url: sasUrl, expires: expiryDate }
        }
    } else {
        let errorMessage = "An error occured";

        if ( !isValidFileType(mimeType) ) errorMessage = "Invalid File type";
        if ( !isValidSize(fileSize) ) errorMessage = "The file is too large";

        context.res = {
            status: 400,
            body: errorMessage
        };
    }

    context.done();
};

function isValidFileType(mimeType){
    return (supportedFileTypes.indexOf(mimeType) !== -1);
}

function isValidSize(fileSize){
    return (fileSize <= process.env.ApolloMaxFileSizeBytes);
}

function generateBlobName(mimeType, fileName){
    return fileName + "." + fileExtensions[mimeType];
}