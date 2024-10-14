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
// import { REPLACE_STRING } from "shared-lib/constants";

// const REPLACE_STRING = "__replace__"; // TODO: get from constants file


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
        // req.myFileName = file.originalname;
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
        req.myFileName = fileName;
        return cb(null, fileName);
    }
});


/**
 * Extract data from data-containing sheet in an excel file. 
 * @param filePath 
 * @returns 
 */
export async function getDataFromExcel(filePath: string) {
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


///////// ------- Data Validation ----------------------------
/**
 * validate that an excel sheet has the right columns
 * @param worksheet 
 * @param requiredColumns 
 * @returns number of columns
 */
export async function validateExcel(worksheet: XLSX.WorkSheet, requiredColumns: string[]) {
    // the columns in the worksheet must contain the expected database fields (name, parentLevel, etc.)
    // NB: assume the header starts at cell A3, ie the first two rows can be used for description, but data starts
    // from row 3
    let headerRow = getRowData(startCell, worksheet, null);
    // check if any columns are missing
    let missingColumns = [];
    for (let requiredCol of requiredColumns) {
        if (!headerRow.includes(requiredCol)) missingColumns.push(requiredCol);
    }
    // send error message if missing column(s)
    if (missingColumns.length > 0) {
        // add missing columns
        let errMsg = i18next.t('missing_columns') +' '+ missingColumns.join(', ');
        return Promise.reject({errMsg});
    }
    return headerRow.length;
}


const startCell = 'A3'; // assuming header starts on first cell of third row
// numbers and letters that are combined to form Excel cell names
const numbers = ['0','1','2','3','4','5','6','7','8','9'];
const letters = 
['A','B','C','D','E','F','G','H','I','J','K','L','M',
'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];


/**
 * Returns a row of data
 * @param startCell startCell e.g 'A3'
 * @param worksheet
 * @param expectedNumColumns expected number of columns
 * @returns 
 */
function getRowData(startCell: string, worksheet: XLSX.WorkSheet, expectedNumColumns: number | null) {
    let [startLetter, rowNumber] = splitCellName(startCell);
    let curCellLetter : string | null = startLetter;
    let data = [];
    let continueCondition : boolean; // condition for continuing while loop
    let numElements = 0;
    do {
        let ref = curCellLetter + rowNumber;
        let cellData = worksheet[ref]?.v;
        data.push(cellData); //  if (cellData) 
        //
        numElements++;
        curCellLetter = getNextLetterInRow(curCellLetter);
        continueCondition = expectedNumColumns ? (numElements < expectedNumColumns) : cellData;
    } while (continueCondition && curCellLetter); //  
    // NB: curCellLetter null check in while condition to ensure logic in body uses right type
    return data;
}


/**
 * Splits a cell name like AB29 into ['AB', 29]
 * @param cellName 
 * @returns 
 */
function splitCellName(cellName: string) : [string, number] { //findIndexOfNumber(str) {
    let ind = cellName.length; // init to avoid error message on potentially undefined
    for (let i=0; i<cellName.length; i++) {
        if(numbers.includes(cellName[i])) {
            ind = i;
            break;
        }
    }
    if (!ind) {
        debug(`input ${cellName} doesn't contain both letters and numbers`);
    }
    let letter = cellName.substring(0, ind);
    let number = cellName.substring(ind);
    // debug(`letter: ${letter}, number: ${number}`);
    return [letter, parseInt(number)];
}


/**
 * Returns the letter part of the name of the next cell in row. Assumes last possible data cell is 'ZZ--'
 * @param curLetter 
 * @returns 
 */
function getNextLetterInRow(curLetter: string) {
    let newLetter;
    if (curLetter == 'ZZ') {
        debug('reached last possible column ZZ');
        newLetter = null;
    } else if (curLetter == 'Z') {
        newLetter = 'AA';
    } else if (curLetter[1] == 'Z') { // eg. BZ to CA
        let indexOfFirstLetter = letters.findIndex((testLet)=> testLet == curLetter[0]);
        newLetter = letters[indexOfFirstLetter+1] + 'A';
    } else if (curLetter.length == 2) {
        let indexOfSecondLetter = letters.findIndex((testLet)=> testLet==curLetter[1]);
        newLetter = curLetter[0] + letters[indexOfSecondLetter+1];
    } else { // single letter to be incremented
        let indexOfLetter = letters.findIndex((testLet)=> testLet==curLetter);
        newLetter = letters[indexOfLetter+1];
    }
    // debug(`newLetter: ${newLetter}`);
    return newLetter;
}

/////////////// -----------------


function iterateDataRows(worksheet: XLSX.WorkSheet, expectedNumColumns: number, 
    expectedHeaderMap: {[key: string]: number}) {
    // split cell name to letter and number
    let [startCellLetter, startCellNumber] = splitCellName(startCell);
    let curRowNumber = startCellNumber + 1;
    let rowsMissingData = [];
    // track data by keys: parentLevelName, then name, to find duplicates in same parent electoral area
    let dataMap = {};
    let dataArray = [];
    let expectedHeaders = Object.keys(expectedHeaderMap);
    let numExpectedHeaders = expectedHeaders.length;
    let continueCondition;
    const infiniteBound = 1e6; // upper bound to guard against infinite loop
    let numRows = 0;
    do {
        let startCellTmp = startCellLetter + curRowNumber;
        let rowData = getRowData(startCellTmp, worksheet, expectedNumColumns);
        // check if this row is missing data
        let { isMissingData, numMissingColumns } = checkRowMissingData(rowData, expectedHeaderMap);
        if (isMissingData) {
            debug('row with missing data: ', rowData);
            rowsMissingData.push(curRowNumber); // number
        }
        // transform the row data into an object keyed by column name
        let obj : {[key: string]: any} = {};
        for (let header of expectedHeaders) {
            let ind = expectedHeaderMap[header];
            obj[header] = rowData[ind]; 
        }
        dataArray.push(obj);
        // also write in data map to ensure no duplicates in data
        // if (!dataMap[obj.parentLevelName]) dataMap[obj.parentLevelName] = {};


        //
        continueCondition = numMissingColumns < numExpectedHeaders;
        numRows++;
        curRowNumber++;
    } while (continueCondition && curRowNumber <= infiniteBound)
}


/**
 * check if a row is missing any data from expected columns
 * @param rowData data in a row of an excel sheet
 * @param expectedHeaderMap map with key: headerName, and value: index of its column in header row
 * @returns 
 */
function checkRowMissingData(rowData: string[], expectedHeaderMap: {[index: string]: number}) {
    //let isMissingData = false;
    let expectedHeaders = Object.keys(expectedHeaderMap);
    let numMissingColumns = 0;
    let missingStr = `missing value in column(s): `;
    // debug('rowData: ', rowData);
    // NB: check for missing columns won't work until getRowData uses last refCell to iterate a row
    // It currently stops after seeing the first empty cell
    for (let expHeader of expectedHeaders) {
        let index = expectedHeaderMap[expHeader];
        let val = rowData[index]; // NB: rowData already accessed .v ?.v;
        if (!val) { // val == null || 
            missingStr += `${expHeader}, `;
            numMissingColumns++;
        }
    }
    let isMissingData = numMissingColumns > 0;
    if (isMissingData) debug(missingStr);
    return {
        isMissingData, 
        numMissingColumns
    };
}
