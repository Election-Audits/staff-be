// Error created for http response
interface RequestError {
    errMsg: string | undefined // the error message
}


// Add a declaration that will be merged with Express.Request
declare namespace Express {
    interface Request { // add fields to Request
        myFileDir: string,
        myAllowedExts: string[],
        myFileName: string
    }

    interface User { // add email to Request.User
        email: string
    }
}
