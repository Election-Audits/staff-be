// Interfaces using imported libraries

import session from "express-session";

// Declaration merging https://stackoverflow.com/a/65381085
declare module 'express-session' {
    export interface SessionData {
        email: string
    }
}
