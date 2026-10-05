// start node backend server

import express from "express"; // framework for node js for handling requests 
import cors from "cors" // allows browsers to send reqeuests despite backend and frontend being on different ports
import dotenv from "dotenv"; // to read env file
import fs from "fs"; // built into node.js
import {vendorAssessment } from "./agent.js"; // vendorAssessment from the agent logic file

//console.log('before dotenv.config():', process.env.API_KEY_OPENAI, process.env.BACKEND_PORT); // debugging env issues
dotenv.config() // now api key = process.env.API_KEY_OPENAI
//console.log('after dotenv.config():', process.env.API_KEY_OPENAI, process.env.BACKEND_PORT);

const app = express(); // instance of express app created as "app" variable

app.use(cors()); // front end can call this backend



app.use(express.json()); // express converts JSON data from react to js objects

const vendors = JSON.parse( // vendors is new variable defined containing vendors data 
// vendors contains an array of all vendors as js objects instead of JSON string

    fs.readFileSync("./data/vendors.json", "utf-8") // "readfilesync" = stop everything until this file is read
);

app.get("/vendors", (req, res) => { // new GET route at http://localhost:1234/vendors 
    res.json(vendors); // sends back vendor data parsed from local data above|(json)
});

app.post("/assess", async (req, res) => { // new POST route http://localhost:1234/assess (async)      -  takes vendorID and returns assessment results on vendor data

    const {vendorID} = req.body; // vendorID extracted from JSON    body sent by front end
    // e.g frontend sends {vendorID: "123"} then vendorID = "123" here

    const vendor = vendors.find(v => v.id === vendorID); // new variable vendor extracts first vendor in vendors that has corresponding id to the request

    if (!vendor) { // if vendor is empty
        return res.status(404).json({error: "Vendor not found"});// sent HTTP 404 not found status as well as json error message
    }

    const result = await vendorAssessment(vendor) // calls AI assessment function from agent

    // open AI api is called and assessment result is returned as result variable

    res.json(result); // return ai assessment result to frontend as JSON
})

const PORT = process.env.BACKEND_PORT; // get port so its easy to change from env
console.log('final port value:', PORT); // debugging

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`); // server is started and listens on http://localhost:1234

    // this means it can now respond to http://localhost:1234/______ urls

    // so now react in front end can call:
    // fetch("http://localhost:1234/assess", {method: "POST", body: {vendorID: "abc"}})
    // and get the results of the assessment on the vendorID from the body contents it sent
}); 





