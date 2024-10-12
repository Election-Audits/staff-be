// Upload of files like excel sheet for bulk add of electoral areas, polling station agents etc.

const debug = require('debug')('ea:ctrl-files');
debug.log = console.log.bind(console);
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import * as util from "util";
import { Request, Response, NextFunction } from "express";
import i18next from "i18next";
import { ensureDirExists } from "../utils/misc";
import * as XLSX from "xlsx";


const maxFileSize = 20e6; // 20 MB

// directory for temp upload of excel files for getting data from
const filesDir = path.join(__dirname,'..','..', 'files', 'staff');


/**
 * Save an excel document to file system
 * @param req 
 * @param res 
 * @param next 
 */
export async function saveExcelDoc(req: Request, res: Response, next: NextFunction) {
    // set variables to be used in multer callbacks
    req.myFileDir = filesDir;
    req.myAllowedExts = ['xlsx']; // todo: csv?
    // ensure that the directory exists before writing file to it
    await ensureDirExists(filesDir);
    // upload/save file
    await new Promise<void>((resolve, reject)=>{
        multer({storage, limits: {fileSize: maxFileSize}})
        .fields([{name: 'file'}])
        (req,res, (err)=>{
            if (err) {
                debug('multer err: ', err);
                return reject(err);
            }
            //
            resolve();
        });
    });
}


// Configure multer disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        let dir = req.myFileDir;
        req.myFileName = file.originalname;
        cb(null, dir);
    },
    filename: (req, file, cb)=>{
        debug('filename cb. file: ', file);
        let allowedExtensions = req.myAllowedExts;
        //let ext = file.mimetype.split('/')[1]; //file extension
        let nameParts = file.originalname.split('.');
        let ext = nameParts[nameParts.length - 1];
        if (!allowedExtensions.includes(ext)) {
            let errMsg = i18next.t('illegal_file_extension');
            cb(new Error(errMsg), ''); // {errMsg}. todo
        }
        let fileName = req.user?.email + ext; //file.originalname;
        return cb(null, fileName);
    }
});


/**
 * Extract data from data-containing sheet in an excel file. 
 * @param filePath 
 * @returns 
 */
async function getDataFromExcel(filePath: string) {
    // some excel files may not contain data in the first worksheet. Find the worksheet with the most data
    // and use that as the data worksheet
    let workbook = XLSX.readFile(filePath);
    // Find the sheet that has data to work with
    let numDataCellsPerSheet = workbook.SheetNames.map((name)=>{
        return Object.keys(workbook.Sheets[name]).length;
    }); // array of number of cells with data in every sheet
    let worksheetName = workbook.SheetNames.find((name)=>{
        return Object.keys(workbook.Sheets[name]).length == Math.max(...numDataCellsPerSheet);
    });
    debug(`sheet with data: ${worksheetName}`);
    let worksheet = workbook.Sheets[worksheetName+'']; // get worksheet
    return worksheet;
}



async function validateElectoralAreaExcel(worksheet: XLSX.WorkSheet) {
    // the columns in the worksheet must contain the expected database fields (name, parentLevel, etc.)
    
}


